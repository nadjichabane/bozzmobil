import { createContext, useContext, useState, useRef, useEffect, type ReactNode, type SetStateAction } from 'react'
import type { PipelineSnapshot } from '../data/pipelineSnapshot'
import { createSaleLedger, saleViews, validateSale, type SaleInput, type SaleRecord, type SaleResult, type ReceiptInput, type SaleDocument, type SaleReceiptDraft } from '../data/saleLedger'
import { getSaleEligibility } from '../lib/saleEligibility'
import { sameStockPayment, type StockPaymentSnapshot } from '../lib/purchaseStock'
import { createPurchaseRefundStore, type PurchaseRefund, type RefundInput } from '../data/purchaseRefunds'
import { getOutstandingQcInFindings, getOutstandingQcOutFindings } from '../lib/qcInRepairs'
import { isValidPlate, isValidOptionalPlate, normalizePlate } from '../lib/licensePlate'
import { isValidLeadPriceRange } from '../lib/leadPriceRange'
import { applyLeadCorrections, isLeadEditable, type LeadCorrections } from '../lib/leadEditing'
import { createInitialPipeline } from '../lib/initialPipeline'
import { createLeasingStore, resolveSaleLeasing, type Leasing, type LeasingInput, type LeasingResult } from '../data/leasing'
import {
  type PipelineCar,
  type Stage,
  type InspectionRecord,
  type InspectionDecision,
  type InspectionAuditEvent,
  type CarPayment,
  type PaymentRecord,
  type StatusPenilaian,
} from '../data/pipeline'
import {
  type PaymentRequest,
  type PaymentEntry,
  type PurchaseDocument,
  type PaymentSourceType,
  type PaymentRequestVerification,
  type PaymentAllocation,
  type PaymentStore,
  type EntryAddResult,
  type PaymentStoreInput,
  type DuplicatePaymentCheck,
  type ReviewedDuplicateMatches,
  type PaymentOverrideAuditRecord,
  createPaymentStore,
  stripLockedPrice,
} from '../data/payments'
import { CHECKLIST_TEMPLATE, computeProgress, seedResponsesFromCar } from '../data/checklist'
import {
  type QcRecord,
  type QcType,
  type QcCompletionData,
  getActiveQcIn,
  getActiveQcOut,
  getLatestCompletedQcIn,
  getLatestCompletedQcOut,
  isQcInSaleable,
  isQcInInputResult,
  isQcOutResult,
  isQcOutHandoverable,
  selectQcOutForBast,
  validateQcChecklist,
  validateQcInChecklist,
} from '../data/qc'
import { getQcTemplate, getQcTemplateItems } from '../data/qcTemplates'
import { SUPPLIERS, type Supplier } from '../data/suppliers'
import { canDeleteCar, type DeletionVerdict, type DeletionGuardInput } from '../lib/deletionGuards'

/**
 * Pipeline terpusat — satu source of truth untuk semua modul.
 * Setiap transisi stage memicu update state global;
 * UI di seluruh halaman reaktif ke perubahan ini.
 */

// Aturan transisi sah (lifecycle arsitektur):
// Lead -> Inspeksi -> Lulus/Tolak -> Pembelian -> Stok (NOT READY/qc) -> READY(available) -> Terjual
// Generic advance tidak membuat transaksi. commitSale memakai eligibility canonical
// dan dapat menjual Stock READY di stage qc dengan hasil IN selesai apa pun.
// Re-inspeksi: rejected -> inspecting (juga sah untuk jadwal ulang)
const ALLOWED_TRANSITIONS: Record<Stage, Stage[]> = {
  lead: ['inspecting'],
  inspecting: ['purchasing', 'rejected'],
  rejected: ['inspecting'],
  purchasing: ['qc'],
  qc: ['available'],
  available: ['sold'],
  sold: [],
}

export function canTransition(from: Stage, to: Stage): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

type PipelineState = {
  leasings: Leasing[]
  saveLeasing: (input: LeasingInput, id?: string, version?: number) => LeasingResult
  saleRecords: SaleRecord[]
  commitSale: (carKey: string, input: SaleInput) => SaleResult
  updateSale: (id: string, version: number, input: SaleInput) => SaleResult
  receiveSalePayment: (id: string, input: ReceiptInput) => SaleResult
  receiveSalePayments: (id: string, input: SaleReceiptDraft[]) => SaleResult
  confirmSaleHistory: (id: string, version: number) => SaleResult
  attachSaleDocument: (id: string, category: SaleDocument['category'], file: File, replaceId?: string, receiptId?: string) => SaleResult
  removeSaleDocument: (id: string, docId: string) => SaleResult

  cars: PipelineCar[]
  inspectionRecords: InspectionRecord[]
  /** Ganti stage satu mobil (transisi pipeline), hanya bila transisinya sah */
  advance: (key: string, next: Stage) => boolean
  /** Tambah mobil baru ke pipeline (stage 'lead') */
  addCar: (car: Omit<PipelineCar, 'key'> & { key: string }) => boolean
  canEditLead: (carKey: string) => boolean
  updateLead: (carKey: string, corrections: LeadCorrections) => boolean
  /** Hapus mobil dari pipeline.
   *  Fail-closed guard: deletion allowed only for clean unused leads
   *  (stage='lead', no inspection/QC/payment/purchase/BAST history).
   *  Guard runs synchronously against the current render's state and returns
   *  { ok: true } immediately upon passing — the setCars updater runs later
   *  during the next commit and re-validates stage/stockStatus/bastCompleted
   *  as a safety net (prevents deleting a car that advanced to a later stage
   *  between the guard call and the commit). The return value is "scheduled"
   *  not "confirmed committed" — this is an accepted limitation of React's
   *  asynchronous state model.
   *  Returns { ok: true } on success; { ok: false, reason, detail? } on failure. */
  removeCar: (key: string) => DeletionVerdict
  /** Reset ke data awal */
  reset: () => void
  /** Cari mobil berdasarkan key */
  getCar: (key: string) => PipelineCar | undefined
  /** Tandai BAST selesai untuk unit yang sudah 'sold'. Tidak mengubah stage.
   *  Guard chain:
   *    1. car.stage === 'sold'
   *    2. car.bastCompleted === false (idempotent)
   *    3. selectQcOutForBast resolves the most recently STARTED QC OUT record
   *       regardless of status (newest by startedAt). isQcOutHandoverable
   *       must pass: active record or TUNDA SERAH result blocks BAST.
   *    4. car.handover exists and has at least one valid photo
   *  On success: sets bastCompleted=true and handover.completedAt=now atomically. */
  markBast: (key: string) => boolean
  /** Simpan draft serah terima (foto + metadata) untuk car di stage 'sold' yang
   *  belum BAST. Tidak mengfinalisasi BAST — hanya menyimpan bukti ke car.handover.
   *  Guard: car.stage==='sold', !car.bastCompleted, photos array non-empty after
   *  filtering out empty strings. Returns true on success. */
  saveHandoverDraft: (
    carKey: string,
    draft: {
      photos: string[]
      receivingPerson?: string
      handoverStaff?: string
    },
  ) => boolean
  /** Set inspector untuk mobil, sekaligus advance ke 'inspecting' jika dari 'lead'.
   *  Juga membuat InspectionRecord baru berstatus 'Terjadwal'.
   *  schedule = tanggal + jam inspeksi yang diminta admin. */
  assignInspector: (key: string, inspectorId: string, schedule?: { date: string; time: string }) => boolean
  /** MULAI INSPEKSI: hanya sah untuk record berstatus 'Terjadwal'.
   *  Set startedAt = now; status → 'Dalam Inspeksi'.
   *  Jika car masih di stage 'lead', juga advance ke 'inspecting'. */
  startInspection: (inspectionId: string) => boolean
  /** Selesaikan inspeksi aktif (pasang keputusan lulus/reject + points + completedAt).
   *  Jika decision='rejected', stage car → 'rejected'.
   *  Jika decision='lulus':
   *   - pointsDone === totalPoints → catatan tidak diwajibkan.
   *   - pointsDone < totalPoints   → lulusOverrideNote WAJIB non-kosong.
   *  Dalam kedua kasus stage car tetap 'inspecting' (menunggu VALIDASI KE PEMBELIAN).
   *  Hanya sah untuk record berstatus 'Dalam Inspeksi' (sudah dimulai). */
  completeInspection: (
    inspectionId: string,
    decision: InspectionDecision,
    pointsDone: number,
    reason: string,
    lulusOverrideNote?: string,
  ) => boolean
  /** Validasi inspeksi lulus ke pembelian (stage → 'purchasing'). */
  validateToPurchase: (inspectionId: string) => boolean
  /** Simpan / perbarui checklist responses untuk sebuah InspectionRecord.
   *  Points derived dari responses, bukan dari counter terpisah. */
  saveChecklistResponses: (inspectionId: string, responses: import('../data/checklist').ChecklistResponse[]) => void
  canEditInspection: (inspectionId: string) => boolean
  addInspectionPhotos: (inspectionId: string, itemId: string, dataUrls: string[]) => boolean
  saveInspectionNotes: (inspectionId: string, reason: string) => void
  /** Simpan status penilaian (REKOMENDASI / MODERAT_LEV1 / …) pada InspectionRecord.
   *  Hanya setelah mulai inspeksi, termasuk koreksi hasil terbaru sebelum pembelian. */
  saveStatusPenilaian: (inspectionId: string, status: StatusPenilaian) => void
  /** Tambah finding baru ke InspectionRecord.findings. */
  addFinding: (inspectionId: string, finding: import('../data/inspections').Finding) => void
  /** Perbarui finding yang sudah ada di InspectionRecord.findings. */
  updateFinding: (inspectionId: string, finding: import('../data/inspections').Finding) => void
  /** Hapus finding dari InspectionRecord.findings. */
  removeFinding: (inspectionId: string, findingId: string) => void
  /** REJECT PEMBELIAN — keputusan PEMBELIAN admin, TERPISAH dari hasil inspeksi:
   *  histori tetap utuh; unit masuk bucket purchasing/Ditolak, keluar dari stok
   *  aktif. Hanya sebelum lunas dan sebelum ada transaksi penjualan. */
  rejectPurchase: (carKey: string) => boolean
  /** Cek apakah pembelian car ini sudah ditolak admin. */
  isPurchaseRejected: (carKey: string) => boolean
  /** Jadwalkan inspeksi ulang untuk car yang rejected:
   *  buat InspectionRecord baru berstatus 'Terjadwal' + stage → 'inspecting'.
   *  schedule = tanggal + jam inspeksi ulang. */
  scheduleReinspection: (carKey: string, inspectorId: string, schedule?: { date: string; time: string }) => boolean
  /** UBAH JADWAL inspection yang belum dimulai (status 'Terjadwal'):
   *  ganti scheduledAt + append audit event 'schedule_updated' (before/after).
   *  slaBreached di-recompute (jadwal baru → flag di-reset).
   *  Tidak mengubah inspector — itu lewat assignInspector. */
  rescheduleInspection: (inspectionId: string, schedule: { date: string; time: string }, actorId?: string) => boolean
  /** Simpan / perbarui state pembayaran pembelian car (commission, creditDetail, paymentType, dll).
   *  Tidak mengubah car.stage — pembayaran adalah koreksi data, bukan transisi. */
  saveCarPayment: (carKey: string, payment: CarPayment) => void
  /** Tambah satu record pembayaran ke riwayat car.
   *  Return: boolean (true = tercatat; false = car tidak ditemukan). */
  addCarPaymentRecord: (carKey: string, record: Omit<PaymentRecord, 'id' | 'paidAt'>) => boolean
  /** Koreksi field unit/inspeksi pada car: brand, model, year, color, transmission, mileage, plate, buyPrice, schemaUnit.
   *  Mengikuti aturan MASTER UNIT: record di PipelineCar adalah current state.
   *  PRICE LOCK: buyPrice di-strip (ditolak diam-diam) bila sudah ada
   *  PURCHASE_UNIT PaymentRequest untuk car ini — PaymentRequest.totalAmount
   *  tidak boleh berubah setelah dibuat. Field lain tetap tersimpan. */
  saveCarCorrections: (carKey: string, corrections: Partial<Pick<PipelineCar, 'brand' | 'model' | 'year' | 'color' | 'transmission' | 'mileage' | 'plate' | 'buyPrice' | 'schemaUnit'>>) => boolean
  /** Koreksi detail supplier pada car. */
  saveSupplierDetail: (carKey: string, detail: NonNullable<PipelineCar['supplierDetail']>, supplierId?: string, partyType?: PipelineCar['purchasePartyType']) => void
  /** Tandai car sebagai "informasi pembelian sudah disubmit untuk pembayaran".
   *  Hanya sah untuk car di stage 'purchasing'. */
  markSubmittedForPayment: (carKey: string) => void
  /** Cek apakah car sudah disubmit untuk pembayaran. */
  isSubmittedForPayment: (carKey: string) => boolean
  // ── Generic Payment Request / Entry (V1: PURCHASE_UNIT) ─────────────────
  /** Semua PaymentRequest yang sudah dibuat */
  paymentRequests: PaymentRequest[]
  /** Semua PaymentEntry (rincian pembayaran per request) */
  paymentEntries: PaymentEntry[]
  purchaseRefunds: PurchaseRefund[]
  recordPurchaseRefund: (requestId: string, input: RefundInput) => { ok: true; refund: PurchaseRefund } | { ok: false; error: string }
  /** Buat PaymentRequest baru. Return: PaymentRequest (created) | null (duplicate/guard failed).
   *  `allocations` is an optional planned internal breakdown of totalAmount.
   *  Validated via validatePaymentAllocations before creation; invalid sets cause null return. */
  createPaymentRequest: (input: {
    sourceType: PaymentSourceType
    sourceId: string
    title: string
    vendor: string
    totalAmount: number
    dueDate?: string
    supplierId?: string
    vendorType?: 'Perorangan' | 'Supplier'
    /** Optional planned allocation breakdown. Must sum to totalAmount if provided. */
    allocations?: PaymentAllocation[]
  }) => PaymentRequest | null
  /** Tambah satu PaymentEntry ke PaymentRequest.
   *  Returns a truthful result: `EntryAddResult` with `ok: true` + entry + status,
   *  or `ok: false` + specific failure reason. Synchronous — the store
   *  commit is complete when the function returns. */
  addPaymentEntry: (requestId: string, entry: Omit<PaymentEntry, 'id'>) => EntryAddResult
  /**
   * Run duplicate detection for a draft against the store's latest committed
   * entries. Pure read-only — safe to call on every render or before submit.
   */
  checkForDuplicates: (requestId: string, draft: Omit<PaymentEntry, 'id'>) => DuplicatePaymentCheck
  /**
   * Compute a stable fingerprint for a payment draft (exact-draft binding).
   * The fingerprint is captured when the operator reviews the warning and must
   * match at commit time.
   */
  getDraftFingerprint: (draft: Omit<PaymentEntry, 'id'>) => string
  /**
   * Atomically commit a confirmed duplicate-override payment.
   * Revalidates all financial guards against the live store, recomputes
   * duplicate matches, verifies the operator-reviewed snapshot is still
   * current, and commits the entry + audit record in one call.
   * Returns `ok: true` with the new entry and audit record, or `ok: false`
   * with a specific failure reason.
   *
   * `reviewedMatches` is the exact set of matches the operator saw when they
   * confirmed — the store recomputes the current set and requires equality.
   *
   * Failure reasons:
   * - JUSTIFICATION_EMPTY — no operator justification provided
   * - DRAFT_INVALIDATED — the draft changed after the operator reviewed it
   * - MATCH_SET_CHANGED — the duplicate match set differs from what the
   *   operator reviewed (a match was added, removed, or reclassified).
   *   The confirmation is invalid; the operator must re-review the new set.
   * - Any financial guard failure (OVERPAYMENT_*, ALLOCATION_*, etc.)
   */
  confirmDuplicatePayment: (
    requestId: string,
    entry: Omit<PaymentEntry, 'id'>,
    options: {
      justification: string
      operatorIdentity?: string
      draftFingerprint: string
      reviewedMatches: ReviewedDuplicateMatches
    },
  ) =>
    | { ok: true; entry: PaymentEntry; audit: PaymentOverrideAuditRecord }
    | {
        ok: false
        failure:
          | import('../data/payments').EntryValidationFailure
          | { reason: 'JUSTIFICATION_EMPTY' }
          | { reason: 'DRAFT_INVALIDATED'; currentFingerprint: string }
          | { reason: 'MATCH_SET_CHANGED'; currentMatches: import('../data/payments').DuplicatePaymentMatch[] }
      }
  /** All payment-override audit records (in-memory, reset with store). */
  paymentAudit: PaymentOverrideAuditRecord[]
  /** Look up the audit record linked to a PaymentEntry (if any). */
  getPaymentAuditForEntry: (entryId: string) => PaymentOverrideAuditRecord | undefined
  /** Cek apakah sudah ada PaymentRequest aktif untuk sourceId + sourceType */
  hasActivePaymentRequest: (sourceType: PaymentSourceType, sourceId: string) => boolean
  /** Ambil PaymentRequest berdasarkan sourceType + sourceId */
  getPaymentRequestForSource: (sourceType: PaymentSourceType, sourceId: string) => PaymentRequest | undefined
  /** Ambil PaymentEntries untuk sebuah PaymentRequest */
  getEntriesForRequest: (requestId: string) => PaymentEntry[]
  // ── Amount-verification guard (pre-first-entry) ────────────────────────────
  /** All recorded amount-verification records, keyed by PaymentRequest.id */
  paymentVerifications: Record<string, PaymentRequestVerification>
  /** Record that the totalAmount for a PaymentRequest was explicitly verified by admin.
   *  Idempotent: calling on an already-verified request returns the existing record.
   *  Does NOT create a PaymentEntry, NOT mark LUNAS, NOT create a new PaymentRequest.
   *  verifiedAt is always recorded; verifiedBy is included only when a reliable
   *  user identity is already available in context (omitted in current V1 prototype).
   *  Returns the recorded verification, or null if the request does not exist. */
  verifyPaymentRequestAmount: (requestId: string, verifiedBy?: string) => PaymentRequestVerification | null
  /** Check whether a PaymentRequest's totalAmount has been explicitly verified. */
  isAmountVerified: (requestId: string) => boolean
  // ── Purchase Admin Documents (KTP, KWITANSI, BASTK) ─────────────────────
  /** Dokumen pembelian per carKey (KTP, KWITANSI, BASTK) */
  purchaseDocuments: Record<string, PurchaseDocument[]>
  /** Update status dokumen pembelian untuk sebuah car */
  updatePurchaseDocument: (carKey: string, docKey: PurchaseDocument['key'], status: PurchaseDocument['status'], fileName?: string) => void
  // ── Purchase Process Entry (state B: confirmed entered Proses Pembelian) ─
  /** Mark carKey as having explicitly entered the purchase process (admin confirmed in Data Pembelian).
   *  Only valid when car.stage === 'purchasing' and !rejected.
   *  Idempotent — marking an already-entered car is a no-op that returns true.
   *  Also auto-generates a stable Purchase ID (PUR-YYYY-NNNN) for the car. */
  markEnteredPurchaseProcess: (carKey: string) => boolean
  /** Check whether a car has entered the purchase process (state B). */
  isEnteredPurchaseProcess: (carKey: string) => boolean
  /** Auto-generated Purchase ID (e.g. "PUR-2026-0001") for a carKey, if assigned. */
  getPurchaseId: (carKey: string) => string | undefined
  // ── Purchase Notes & Commission Pct (from PembelianContent) ─────────────
  /** Purchase notes text, keyed by carKey */
  purchaseNotes: Record<string, string>
  /** Commission percentage, keyed by carKey */
  commissionPct: Record<string, number>
  // ── Stock Unit / QC domain ───────────────────────────────────────────────
  /** All QC records (IN + OUT), shared across the app. */
  qcRecords: QcRecord[]
  /** Enter stock: purchasing → qc + stockStatus='INCOMING'.
   *  Preconditions:
   *    - car.stage === 'purchasing'
   *    - canonical PURCHASE_UNIT request exists (purchase form submitted)
   *    - !isPurchaseRejected
   *    - car.stockStatus === undefined (not already in stock)
   *  Unpaid/partial entry requires the exact current payment snapshot reviewed
   *  in a confirmation. Fully paid entry does not require manual confirmation.
   *  Returns true on success, false on any guard failure. */
  getStockPaymentSnapshot: (carKey: string) => StockPaymentSnapshot | undefined
  enterStockUnit: (carKey: string, reviewedPayment?: StockPaymentSnapshot) => boolean
  /** Confirm physical arrival: INCOMING → READY.
   *  Preconditions:
   *    - car.stage === 'qc'
   *    - car.stockStatus === 'INCOMING'
   *    - confirmedBy is non-empty and a valid inspector id
   *    - plateConfirmed is non-empty
   *    - normalized plateConfirmed === normalized car.plate
   *    - photos.vehicle and photos.license are each non-empty
   *  Idempotent: if already READY, returns false without mutating.
   *  Returns true on success, false on any guard failure. */
  confirmArrival: (
    carKey: string,
    confirmedBy: string,
    plateConfirmed: string,
    photos: Record<string, string>,
  ) => boolean
  /** Simpan draft QC IN (checklist responses, findings, catatan, foto) pada record
   *  DALAM PROSES. Tidak mengubah status/result. Immutability guard: hanya boleh
   *  untuk record yang masih 'DALAM PROSES'. */
  saveQcInDraft: (
    qcRecordId: string,
    draft: {
      checklistResponses?: import('../data/checklist').ChecklistResponse[]
      findings?: import('../data/inspections').QcFinding[]
      notes?: string
      photos?: string[]
    },
  ) => boolean
  /** Start a QC IN inspection for a vehicle.
   *  Preconditions:
   *    - car.stage in qc/available/sold, before final BAST
   *    - car.stockStatus === 'READY'
   *    - no active QC IN for this carKey
   *  Creates a new QcRecord with type='IN', status='DALAM PROSES'.
   *  Returns the created record, or null on guard failure. */
  startQcIn: (carKey: string, inspectorId: string) => QcRecord | null
  /** Complete an active QC IN record.
   *  Preconditions:
   *    - record exists, type='IN', status='DALAM PROSES'
   *    - data.result must be a valid QcInResult
   *    - checklist must pass validateQcInChecklist (repair-only note allowance)
   *    - LAYAK JUAL requires no unresolved blocking findings
   *  Sets status='SELESAI', completedAt=now. Merges QcCompletionData.
   *  LAYAK JUAL advances an eligible 'qc' unit to 'available'; sold never rolls back.
   *  Does NOT change car.stockStatus (remains 'READY').
   *  Returns true on success, false on any guard failure. */
  completeQcIn: (qcRecordId: string, data: QcCompletionData) => boolean
  /** Simpan draft QC OUT (checklist responses, findings, catatan, foto) pada record
   *  DALAM PROSES. Tidak mengubah status/result. Immutability guard: hanya boleh
   *  untuk record yang masih 'DALAM PROSES'. */
  saveQcOutDraft: (
    qcRecordId: string,
    draft: {
      checklistResponses?: import('../data/checklist').ChecklistResponse[]
      findings?: import('../data/inspections').QcFinding[]
      notes?: string
      photos?: string[]
    },
  ) => boolean
  /** Start a QC OUT inspection for a vehicle.
   *  Preconditions:
   *    - car.stage is 'qc' or 'available'
   *    - car.stockStatus === 'READY'
   *    - no active QC OUT for this carKey
   *  QC OUT does NOT require a completed QC IN.
   *  Creates a new QcRecord with type='OUT', status='DALAM PROSES'.
   *  Returns the created record, or null on guard failure. */
  startQcOut: (carKey: string, inspectorId: string) => QcRecord | null
  /** Complete an active QC OUT record.
   *  Preconditions:
   *    - record exists, type='OUT', status='DALAM PROSES'
   *    - data.result must be a valid QcOutResult (SIAP SERAH | TUNDA SERAH)
   *    - checklist (if responses provided) must pass validateQcChecklist
   *    - SIAP SERAH requires no unresolved blocksHandover findings
   *  TUNDA SERAH may be recorded even when handover-blocking findings remain.
   *  Sets status='SELESAI', completedAt=now. Merges QcCompletionData.
   *  Does NOT mutate any QC IN record.
   *  Does NOT change car.stage or car.stockStatus.
   *  Returns true on success, false on any guard failure. */
  completeQcOut: (qcRecordId: string, data: QcCompletionData) => boolean
  /** Get all QC records for a vehicle (read-only accessor). */
  getQcRecordsForCar: (carKey: string) => QcRecord[]
  /** Get the derived three-state QC IN status for a vehicle. */
  getQcInStatusForCar: (carKey: string) => import('../data/qc').QcInStatus
  /** Get the derived three-state QC OUT status for a vehicle. */
  getQcOutStatusForCar: (carKey: string) => import('../data/qc').QcInStatus
  /** Get the most recently completed QC IN record for a vehicle (for QC OUT display). */
  getLatestCompletedQcInForCar: (carKey: string) => QcRecord | undefined
  // ── Master Supplier (shared state) ─────────────────────────────────────
  /** All suppliers in the master list. Seeded from static SUPPLIERS; reactive via context. */
  suppliers: Supplier[]
  /** Add a new supplier. Generates a unique ID. Returns the created supplier. */
  addSupplier: (input: Omit<Supplier, 'id' | 'totalSupplied' | 'totalValue' | 'joinedDate' | 'status'>) => Supplier
  /** Update an existing supplier's fields. Does NOT mutate PipelineCar.supplierDetail or PaymentRequest. Returns the updated supplier, or null if ID not found. */
  updateSupplier: (id: string, updates: Partial<Supplier>) => Supplier | null
  /** Look up a supplier by ID. Returns undefined if not found. */
  getSupplierById: (id: string) => Supplier | undefined
}

const PipelineCtx = createContext<PipelineState | null>(null)

/** Helper: buat code inspeksi baru unik */
function nextInspectionCode(existing: InspectionRecord[]): string {
  const n = existing.length + 1
  const seq = String(n).padStart(3, '0')
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  const year = new Date().getFullYear()
  return `INS-${year}${month}${String(new Date().getDate()).padStart(2, '0')}-${seq}`
}

/** Combine 'YYYY-MM-DD' + 'HH:mm' → ISO datetime string */
function isoDateTime(date: string, time: string): string {
  return `${date}T${time}:00`
}

/**
 * Recompute the persisted SLA flag for a record.
 * true when: status is 'Terjadwal', scheduledAt exists, startedAt is absent,
 * and current time is past scheduledAt.
 * Call after every write that touches scheduledAt / startedAt / status.
 */
export function computeSlaBreached(r: Pick<InspectionRecord, 'status' | 'scheduledAt' | 'startedAt'>): boolean {
  return r.status === 'Terjadwal' && !!r.scheduledAt && !r.startedAt && new Date(r.scheduledAt).getTime() < Date.now()
}

/** Append an audit event to a record (returns a new array; never mutates in place). */
function withAudit(
  r: InspectionRecord,
  ev: Omit<InspectionAuditEvent, 'at'>,
): InspectionRecord {
  const event: InspectionAuditEvent = { at: new Date().toISOString(), ...ev }
  return { ...r, auditLog: [...(r.auditLog ?? []), event] }
}

export function PipelineProvider({ children, initialCars, initialSales, initialInspections = [], initialQcRecords = [], initialSnapshot, onSnapshot }: { children: ReactNode; initialCars?: PipelineCar[]; initialSales?: SaleRecord[]; initialInspections?: InspectionRecord[]; initialQcRecords?: QcRecord[]; initialSnapshot?: PipelineSnapshot; onSnapshot?: (snapshot: PipelineSnapshot) => void }) {
  const [cars, setCarsState] = useState<PipelineCar[]>(() => initialSnapshot?.cars ?? initialCars ?? createInitialPipeline())
  const carsRef = useRef(cars)
  const setCars = (action: SetStateAction<PipelineCar[]>) => {
    const next = typeof action === 'function' ? action(carsRef.current) : action
    if (next === carsRef.current) return
    carsRef.current = next
    setCarsState(next)
  }
  const [leasingStore] = useState(() => createLeasingStore(initialSnapshot?.leasings))
  const [leasingVersion, setLeasingVersion] = useState(0)
  const leasings = leasingStore.records
  const saveLeasing: PipelineState['saveLeasing'] = (input, id, version) => {
    const result = leasingStore.save(input, id, version)
    if (result.ok) setLeasingVersion((value) => value + 1)
    return result
  }
  const [saleLedger] = useState(() => createSaleLedger(initialSnapshot?.sales ?? initialSales, initialSnapshot?.saleCounters))
  const [saleVersion, publishSales] = useState(0)
  const saleRecords = saleLedger.records
  const publishSaleResult = (result: SaleResult) => {
    if (result.ok && !result.replay) publishSales((v) => v + 1)
    return result
  }
  const [inspectionRecords, setInspectionRecordsState] = useState<InspectionRecord[]>(initialSnapshot?.inspectionRecords ?? initialInspections)
  const inspectionRecordsRef = useRef(inspectionRecords)
  const setInspectionRecords = (action: SetStateAction<InspectionRecord[]>) => {
    const next = typeof action === 'function' ? action(inspectionRecordsRef.current) : action
    if (next === inspectionRecordsRef.current) return
    inspectionRecordsRef.current = next
    setInspectionRecordsState(next)
  }
  /** Keputusan pembelian admin per car — terpisah dari hasil inspeksi LULUS */
  const [rejectedPurchases, setRejectedPurchases] = useState<Set<string>>(() => new Set(initialSnapshot?.rejectedPurchases))
  const rejectedPurchasesRef = useRef(new Set(initialSnapshot?.rejectedPurchases))
  const [refundStore] = useState(() => createPurchaseRefundStore(initialSnapshot?.refunds))
  const disposalTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    clearTimeout(disposalTimer.current)
    // StrictMode's setup/cleanup probe must not revoke hydrated attachment URLs.
    return () => { disposalTimer.current = setTimeout(() => { saleLedger.dispose(); refundStore.dispose() }, 0) }
  }, [saleLedger, refundStore])
  /** Car yang informasi pembeliaannya sudah disubmit untuk pembayaran */
  const [submittedForPayment, setSubmittedForPayment] = useState<Set<string>>(() => new Set(initialSnapshot?.submittedForPayment))
  // ── Generic payment module state ─────────────────────────────────────────
  // Stable synchronous payment transaction store. The instance provides
  // read-your-writes semantics: when addPaymentEntry mutates the store, the
  // very next call sees the updated arrays — eliminating all stale-closure
  // race conditions for payment requests, entries, and verification records.
  // Bump the version state after store mutations so React publishes current records.
  const [paymentStore] = useState<PaymentStore>(() => createPaymentStore(initialSnapshot?.payment))
  const [storeVersion, setStoreVersion] = useState(0)
  const paymentRequests = paymentStore.requests
  const paymentEntries = paymentStore.entries
  const paymentVerifications = paymentStore.verifications
  const [purchaseDocuments, setPurchaseDocuments] = useState<Record<string, PurchaseDocument[]>>(initialSnapshot?.purchaseDocuments ?? {})
  /** Sequence counter for generating unique Purchase IDs */
  const [purchaseSeq, setPurchaseSeq] = useState(initialSnapshot?.purchaseSeq ?? 0)
  /** Stable Purchase ID (PUR-YYYY-NNNN) assigned to each carKey that entered purchase process */
  const [purchaseIdMap, setPurchaseIdMap] = useState<Record<string, string>>(initialSnapshot?.purchaseIdMap ?? {})
  /** Cars that have explicitly entered the purchase process (admin confirmed in Data Pembelian) */
  const [enteredPurchaseProcess, setEnteredPurchaseProcess] = useState<Set<string>>(() => new Set(initialSnapshot?.enteredPurchaseProcess))
  // ── Purchase Notes & Commission Pct ──────────────────────────────────────
  const [purchaseNotes] = useState<Record<string, string>>(initialSnapshot?.purchaseNotes ?? {})
  const [commissionPct] = useState<Record<string, number>>(initialSnapshot?.commissionPct ?? {})
  // ── QC domain state ────────────────────────────────────────────────────────
  // ── Master Supplier (shared state) ───────────────────────────────────
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSnapshot?.suppliers ?? SUPPLIERS)
  const [supplierSeq, setSupplierSeq] = useState(initialSnapshot?.supplierSeq ?? SUPPLIERS.length)

  const [qcRecords, setQcRecordsState] = useState<QcRecord[]>(initialSnapshot?.qcRecords ?? initialQcRecords)
  const qcRecordsRef = useRef(qcRecords)
  const setQcRecords = (action: SetStateAction<QcRecord[]>) => {
    const next = typeof action === 'function' ? action(qcRecordsRef.current) : action
    qcRecordsRef.current = next
    setQcRecordsState(next)
  }
  const commitSale: PipelineState['commitSale'] = (carKey, input) => {
    const buyer = input.buyerType === 'Supplier' ? suppliers.find(supplier => supplier.id === input.buyerSupplierId) : undefined
    if (input.buyerType === 'Supplier' && (!buyer || (buyer.status === 'Nonaktif' && saleLedger.get(carKey)?.buyerSupplierId !== buyer.id))) return { ok: false, error: 'Pilih pembeli supplier aktif dari Master Supplier.' }
    if (buyer) input = { ...input, customer: { ...input.customer, name: saleLedger.get(carKey)?.buyerSupplierId === buyer.id ? saleLedger.get(carKey)!.customer.name : buyer.name } }
    const resolved = resolveSaleLeasing(leasingStore.records, input, saleLedger.get(carKey))
    if (!resolved.ok) return resolved
    input = resolved.input
    const error = validateSale(input)
    if (error) return { ok: false, error }
    const replay = saleLedger.replay(carKey, input)
    if (replay) return replay
    const car = carsRef.current.find((c) => c.key === carKey)
    const eligibility = car ? getSaleEligibility(car, qcRecordsRef.current, saleViews(carsRef.current, saleLedger.records)) : undefined
    if (typeof eligibility === 'object' && eligibility.reason === 'qc-note-required') return { ok: false, error: 'Catatan QC IN wajib diisi untuk hasil PERLU PERBAIKAN atau TIDAK LAYAK JUAL sebelum memproses penjualan. Lakukan QC IN ulang untuk melengkapi catatan.' }
    if (!car || rejectedPurchasesRef.current.has(carKey) || eligibility !== 'eligible') {
      return { ok: false, error: 'Unit tidak lagi memenuhi syarat penjualan. Periksa QC dan stok.' }
    }
    const nextCars = carsRef.current.map((c) => c.key === carKey ? { ...c, stage: 'sold' as const } : c)
    const result = saleLedger.create(car, input)
    if (!result.ok) return result
    setCars(nextCars.map((car) => car.key === carKey ? withBastDocuments(car, [], result.record.documents) : car))
    return publishSaleResult(result)
  }
  const updateSale: PipelineState['updateSale'] = (id, version, input) => {
    const record = saleLedger.get(id)
    const buyer = input.buyerType === 'Supplier' ? suppliers.find(supplier => supplier.id === input.buyerSupplierId) : undefined
    if (input.buyerType === 'Supplier' && (!buyer || (buyer.status === 'Nonaktif' && record?.buyerSupplierId !== buyer.id))) return { ok: false, error: 'Pilih pembeli supplier aktif dari Master Supplier.' }
    if (buyer) input = { ...input, customer: { ...input.customer, name: record?.buyerSupplierId === buyer.id ? record.customer.name : buyer.name } }
    if (!record || carsRef.current.find((c) => c.key === record.carKey)?.stage !== 'sold') return { ok: false, error: 'Unit/transaksi tidak ditemukan atau belum terjual.' }
    if (carsRef.current.find((car) => car.key === record.carKey)?.bastCompleted && input.draftDocuments?.some((doc) => doc.category === 'Foto BASTK')) return { ok: false, error: 'Bukti BAST yang sudah selesai tidak dapat diubah.' }
    const resolved = resolveSaleLeasing(leasingStore.records, input, record)
    if (!resolved.ok) return resolved
    input = resolved.input
    const result = saleLedger.update(id, version, input)
    if (result.ok) setCars((cars) => cars.map((car) => car.key === record.carKey ? withBastDocuments(car, record.documents, result.record.documents) : car))
    return publishSaleResult(result)
  }
  const receiveSalePayment: PipelineState['receiveSalePayment'] = (id, input) => publishSaleResult(saleLedger.receive(id, input))
  const receiveSalePayments: PipelineState['receiveSalePayments'] = (id, input) => publishSaleResult(saleLedger.receiveBatch(id, input))
  const confirmSaleHistory: PipelineState['confirmSaleHistory'] = (id, version) => publishSaleResult(saleLedger.confirmHistory(id, version))
  function withBastDocuments(car: PipelineCar, before: SaleDocument[], after: SaleDocument[]) {
    const oldPhotos = before.filter((doc) => doc.category === 'Foto BASTK').map((doc) => doc.url)
    const newPhotos = after.filter((doc) => doc.category === 'Foto BASTK').map((doc) => doc.url)
    if (JSON.stringify(oldPhotos) === JSON.stringify(newPhotos)) return car
    return { ...car, handover: { ...car.handover, photos: [...(car.handover?.photos ?? []).filter((url) => !oldPhotos.includes(url)), ...newPhotos] } }
  }
  const attachSaleDocument: PipelineState['attachSaleDocument'] = (id, category, file, replaceId, receiptId) => {
    const before = saleLedger.get(id)
    if (before && carsRef.current.find((car) => car.key === before.carKey)?.bastCompleted && (category === 'Foto BASTK' || before.documents.find((doc) => doc.id === replaceId)?.category === 'Foto BASTK')) return { ok: false, error: 'Bukti BAST yang sudah selesai tidak dapat diubah.' }
    const result = saleLedger.attach(id, category, file, replaceId, receiptId)
    if (result.ok && before) setCars((cars) => cars.map((car) => car.key === before.carKey ? withBastDocuments(car, before.documents, result.record.documents) : car))
    return publishSaleResult(result)
  }
  const removeSaleDocument: PipelineState['removeSaleDocument'] = (id, docId) => {
    const before = saleLedger.get(id)
    if (before && before.documents.find((doc) => doc.id === docId)?.category === 'Foto BASTK' && carsRef.current.find((car) => car.key === before.carKey)?.bastCompleted) return { ok: false, error: 'Bukti BAST yang sudah selesai tidak dapat diubah.' }
    const result = saleLedger.removeDocument(id, docId)
    if (result.ok && before) setCars((cars) => cars.map((car) => car.key === before.carKey ? withBastDocuments(car, before.documents, result.record.documents) : car))
    return publishSaleResult(result)
  }
  /** Per-type, per-carKey sequence counter for generating unique QC record IDs.
   *  Key: `${type}-${carKey}`. Value: number of records created so far.
   *  Using a per-type+carKey counter (not a global one) ensures that records
   *  of different types don't interfere with each other's numbering.
   *  The Date.now() suffix in the ID also guards against collisions after
   *  deletion or concurrent operations. */
  const qcSeqRef = useRef<Record<string, number>>(initialSnapshot?.qcSequences ?? initialQcRecords.reduce((sequences, record) => {
    const key = record.type.toLowerCase() + '-' + record.carKey
    sequences[key] = (sequences[key] ?? 0) + 1
    return sequences
  }, {} as Record<string, number>))

  const advance: PipelineState['advance'] = (key, next) => {
    if (rejectedPurchasesRef.current.has(key)) return false
    const car = carsRef.current.find((c) => c.key === key)
    if (!car || !canTransition(car.stage, next)) return false
    // No generic stage transition may bypass the purchase-payment review.
    if (car.stage === 'purchasing' && next === 'qc') return enterStockUnit(key)
    // ── CENTRAL SALEABILITY GUARD (STEP 8) ─────────────────────────────────
    // qc → available is ONLY allowed when:
    //   1. car.stockStatus === 'READY' (physically arrived), AND
    //   2. the latest completed QC IN record is LAYAK JUAL with no
    //      unresolved blocking findings (typed result + finding check).
    // This guard is enforced here in the single mutation path, not in UI.
    // All callers (MasterUnitPage, PipelineSimulatorPage, direct advance() calls)
    // must pass through this check — there is no bypass.
    if (car.stage === 'qc' && next === 'available') {
      if (car.stockStatus !== 'READY') return false
      const latestQcIn = getLatestCompletedQcIn(key, qcRecordsRef.current)
      if (!latestQcIn || !isQcInSaleable(latestQcIn)) return false
    }
    setCars((prev) => prev.map((c) => (c.key === key ? { ...c, stage: next } : c)))
    return true
  }

  const addCar: PipelineState['addCar'] = (car) => {
    if (carsRef.current.some(existing => existing.key === car.key) || [car.year, car.mileage, car.expectedPrice, car.buyPrice, car.sellPrice].some(value => !Number.isFinite(value) || value < 0)) return false
    if (!(car.stage === 'lead' ? isValidOptionalPlate(car.plate) : isValidPlate(car.plate)) || !isValidLeadPriceRange(car)) return false
    setCars((prev) => [{ ...car, plate: normalizePlate(car.plate) }, ...prev])
    return true
  }

  const canEditLead: PipelineState['canEditLead'] = (key) => {
    const car = carsRef.current.find(c => c.key === key)
    return isLeadEditable(car) && !paymentStore.getRequest('PURCHASE_UNIT', key)
      && !saleLedger.get(key) && !purchaseIdMap[key] && !enteredPurchaseProcess.has(key)
      && !submittedForPayment.has(key) && !rejectedPurchasesRef.current.has(key)
  }

  const updateLead: PipelineState['updateLead'] = (key, corrections) => {
    if (!canEditLead(key)) return false
    const car = carsRef.current.find(c => c.key === key)!
    const updated = applyLeadCorrections(car, corrections)
    if (!updated) return false
    setCars(prev => prev.map(c => c.key === key ? updated : c))
    return true
  }

  const removeCar: PipelineState['removeCar'] = (key) => {
    // Guard against the authoritative state collections (not derived UI rows).
    // canDeleteCar is synchronous — it reads the current render's state and
    // returns a verdict before scheduling any state update.
    const guardInput: DeletionGuardInput = {
      cars,
      inspectionRecords,
      qcRecords,
      paymentRequests,
      paymentEntries,
      rejectedPurchases,
      submittedForPayment,
      enteredPurchaseProcess,
      purchaseDocuments,
      purchaseIdMap,
      paymentVerifications,
    }
    const verdict = canDeleteCar(key, guardInput)
    if (!verdict.ok) return verdict
    // Schedule the deletion.
    //
    // React state updates are asynchronous — setCars' updater runs during the
    // next render commit, not synchronously here. We therefore cannot use a
    // flag captured by the updater to communicate success back to the caller.
    //
    // Instead: the guard verdict (computed synchronously above against current
    // state) is the authoritative "yes, deletion is allowed" signal. If the
    // guard says ok, the deletion is scheduled; we return ok immediately.
    // The updater re-validates as a safety net: if state changes between this
    // render and the next commit (e.g. a concurrent stage advance), the car
    // may be silently left in place rather than incorrectly removed.
    setCars((prev) => {
      const car = prev.find((c) => c.key === key)
      if (!car || car.stage !== 'lead' || car.stockStatus !== undefined || car.bastCompleted) {
        return prev
      }
      return prev.filter((c) => c.key !== key)
    })
    return { ok: true }
  }

  const markSubmittedForPayment: PipelineState['markSubmittedForPayment'] = (carKey) => {
    const car = carsRef.current.find((c) => c.key === carKey)
    if (!car || car.stage !== 'purchasing') return
    setSubmittedForPayment((prev) => new Set(prev).add(carKey))
  }

  const isSubmittedForPayment: PipelineState['isSubmittedForPayment'] = (carKey) =>
    submittedForPayment.has(carKey)

  const markEnteredPurchaseProcess: PipelineState['markEnteredPurchaseProcess'] = (carKey) => {
    if (rejectedPurchasesRef.current.has(carKey)) return false
    const car = carsRef.current.find((c) => c.key === carKey)
    if (!car || car.stage !== 'purchasing') return false
    // Idempotent: already marked → still valid
    if (enteredPurchaseProcess.has(carKey)) return true
    setEnteredPurchaseProcess((prev) => new Set(prev).add(carKey))
    // Auto-generate a stable Purchase ID (PUR-YYYY-NNNN) on first entry
    const year = new Date().getFullYear()
    const nextSeq = purchaseSeq + 1
    const purId = `PUR-${year}-${String(nextSeq).padStart(4, '0')}`
    setPurchaseSeq(nextSeq)
    setPurchaseIdMap((prev) => ({ ...prev, [carKey]: purId }))
    return true
  }

  const isEnteredPurchaseProcess: PipelineState['isEnteredPurchaseProcess'] = (carKey) =>
    enteredPurchaseProcess.has(carKey)

  const getPurchaseId: PipelineState['getPurchaseId'] = (carKey) =>
    purchaseIdMap[carKey]

  // ── Generic payment request / entry actions ─────────────────────────────

  const hasActivePaymentRequest: PipelineState['hasActivePaymentRequest'] = (sourceType, sourceId) =>
    paymentStore.hasRequest(sourceType, sourceId)

  const getPaymentRequestForSource: PipelineState['getPaymentRequestForSource'] = (sourceType, sourceId) =>
    paymentStore.getRequest(sourceType, sourceId)

  const getEntriesForRequest: PipelineState['getEntriesForRequest'] = (requestId) =>
    paymentStore.getEntries(requestId)

  // ── Amount-verification guard (pre-first-entry) ────────────────────────────

  const verifyPaymentRequestAmount: PipelineState['verifyPaymentRequestAmount'] = (requestId, verifiedBy) => {
    const record = paymentStore.verify(requestId, verifiedBy)
    if (record && !paymentVerifications[requestId]) {
      // New record was created — trigger a React re-render so other components
      // pick up the verification. Idempotent: only bumps when the record is new.
      setStoreVersion((v) => v + 1)
    }
    return record
  }

  const isAmountVerified: PipelineState['isAmountVerified'] = (requestId) =>
    paymentStore.verifications[requestId] !== undefined

  const createPaymentRequest: PipelineState['createPaymentRequest'] = (input: PaymentStoreInput) => {
    if (input.sourceType === 'PURCHASE_UNIT') {
      const car = carsRef.current.find(candidate => candidate.key === input.sourceId)
      if (!car || !isValidPlate(car.plate)) return null
    }
    if (rejectedPurchasesRef.current.has(input.sourceId)) return null
    if (input.vendorType !== undefined && !['Perorangan', 'Supplier'].includes(input.vendorType)) return null
    if (input.vendorType === 'Supplier' && !input.supplierId) return null
    if (input.vendorType === 'Perorangan' && (input.supplierId || !input.vendor.trim())) return null
    const supplier = input.supplierId ? suppliers.find(candidate => candidate.id === input.supplierId) : undefined
    if (input.supplierId && (!supplier || supplier.status === 'Nonaktif')) return null
    const result = paymentStore.createRequest(supplier ? { ...input, vendor: supplier.name } : input)
    if (result) {
      markSubmittedForPayment(result.sourceId)
      setStoreVersion((v) => v + 1)
    }
    return result
  }
  const addPaymentEntry: PipelineState['addPaymentEntry'] = (requestId, entry) => {
    const request = paymentStore.requests.find(r => r.id === requestId)
    if (request && rejectedPurchasesRef.current.has(request.sourceId)) return { ok: false, failure: { reason: 'REQUEST_CANCELLED' } }
    const result = paymentStore.addEntry(requestId, entry)
    if (result.ok) {
      autoStockPaidRequest(requestId)
      setStoreVersion((v) => v + 1)
    }
    return result
  }

  // ── Duplicate payment detection & override ─────────────────────────────────
  const checkForDuplicates: PipelineState['checkForDuplicates'] = (requestId, draft) =>
    paymentStore.checkForDuplicates(requestId, draft)

  const getDraftFingerprint: PipelineState['getDraftFingerprint'] = (draft) =>
    paymentStore.draftFingerprint(draft)

  const confirmDuplicatePayment: PipelineState['confirmDuplicatePayment'] = (requestId, entry, options) => {
    const request = paymentStore.requests.find(r => r.id === requestId)
    if (request && rejectedPurchasesRef.current.has(request.sourceId)) return { ok: false, failure: { reason: 'REQUEST_CANCELLED' } }
    const result = paymentStore.confirmDuplicatePayment(requestId, entry, options)
    if (result.ok) {
      autoStockPaidRequest(requestId)
      setStoreVersion((v) => v + 1)
    }
    return result
  }

  // ── Store-level duplicate guard (Fix #15.1, Part B) ─────────────────────────
  // addPaymentEntry delegates to the store; the store now runs duplicate
  // detection inside its synchronous transaction boundary. When the draft
  // matches committed entries, the result is `ok: false` with
  // `failure.reason === 'DUPLICATE_DETECTED'` and the match details. The
  // caller must open the override confirmation flow instead of treating
  // this as a generic payment failure.

  const paymentAudit = paymentStore.audit
  const getPaymentAuditForEntry: PipelineState['getPaymentAuditForEntry'] = (entryId) =>
    paymentStore.getAuditForEntry(entryId)

  const updatePurchaseDocument: PipelineState['updatePurchaseDocument'] = (carKey, docKey, status, fileName) => {
    setPurchaseDocuments((prev) => {
      // If carKey has no docs yet, seed all three so no slot is missing.
      const ALL_KEYS: PurchaseDocument['key'][] = ['KTP', 'KWITANSI', 'BASTK']
      const existing = prev[carKey]
      let base: PurchaseDocument[]
      if (existing) {
        base = existing.map((d) =>
          d.key === docKey
            ? { ...d, status, ...(fileName ? { fileName } : {}) }
            : d,
        )
        // Ensure all three keys are present (in case one was never touched)
        for (const k of ALL_KEYS) {
          if (!base.some((d) => d.key === k)) {
            base = [...base, { key: k, status: 'BELUM UPLOAD' as const }]
          }
        }
      } else {
        base = ALL_KEYS.map((k) =>
          k === docKey
            ? { key: k, status, ...(fileName ? { fileName } : {}) }
            : { key: k, status: 'BELUM UPLOAD' as const },
        )
      }
      return { ...prev, [carKey]: base }
    })
  }

  const reset = () => {
    rejectedPurchasesRef.current.clear()
    refundStore.reset()
    saleLedger.reset(Boolean(initialSnapshot))
    publishSales((v) => v + 1)
    setCars(initialCars ?? createInitialPipeline())
    setInspectionRecords(initialInspections)
    setRejectedPurchases(new Set())
    setSubmittedForPayment(new Set())
    setEnteredPurchaseProcess(new Set())
    paymentStore.reset()
    setStoreVersion((v) => v + 1)
    setPurchaseDocuments({})
    setPurchaseSeq(0)
    setPurchaseIdMap({})
    // QC domain reset
    setQcRecords([])
    qcSeqRef.current = {}
    // Master supplier reset
    setSuppliers(SUPPLIERS)
    setSupplierSeq(SUPPLIERS.length)
  }
  const getCar = (key: string) => carsRef.current.find((c) => c.key === key)

  const markBast: PipelineState['markBast'] = (key) => {
    // Guard 1: car must exist, be in 'sold' stage, and not already BAST-completed.
    // Use the cars closure for the guard check (fast path); the mutation below
    // uses setCars(prev) so the updater re-checks the same conditions on `prev`
    // to prevent stale-closure double-submission.
    const car = carsRef.current.find((c) => c.key === key)
    if (!car || car.stage !== 'sold' || car.bastCompleted) return false
    // Guard 2: BAST eligibility — the authoritative QC OUT record must be
    // handoverable. selectQcOutForBast returns the most recently STARTED
    // QC OUT record regardless of status (newest by startedAt):
    //   - active record  → blocked (status check in isQcOutHandoverable)
    //   - TUNDA SERAH    → blocked (result check)
    //   - SIAP SERAH     → allowed (if photo evidence is present)
    // An active QC OUT started AFTER a completed SIAP SERAH record blocks
    // BAST until the newer one also completes with SIAP SERAH.
    // isQcOutHandoverable enforces: type=OUT, status=SELESAI,
    // result=SIAP SERAH, and no unresolved blocksHandover findings.
    const qcOutSelection = selectQcOutForBast(key, qcRecordsRef.current)
    if (!qcOutSelection || !isQcOutHandoverable(qcOutSelection)) return false
    // Guard 3: at least one valid handover photo must be saved on the car.
    // Photos are stored as data-URL / remote-URL strings; empty strings are rejected.
    const carForDraft = carsRef.current.find((c) => c.key === key)
    const validPhotos = (carForDraft?.handover?.photos ?? []).filter(
      (p) => typeof p === 'string' && p.trim().length > 0,
    )
    if (validPhotos.length === 0) return false
    // All guards passed — set both flags atomically.
    // The setCars updater re-checks bastCompleted on `prev` to prevent
    // a stale-closure double-submission race (two rapid clicks before the
    // first setCars has committed).
    // Use a function updater so React applies the change against the LATEST
    // committed state. If a first click already set bastCompleted=true, this
    // second click sees it and returns the same car object — no re-render,
    // no timestamp mutation.
    let succeeded = false
    setCars((prev) =>
      prev.map((c) => {
        if (c.key !== key) return c
        // Re-check on prev: if already completed, do nothing (idempotent no-op)
        if (c.bastCompleted) return c
        succeeded = true
        const now = new Date().toISOString()
        return {
          ...c,
          bastCompleted: true,
          handover: c.handover
            ? { ...c.handover, completedAt: now }
            : undefined,
        }
      }),
    )
    return succeeded
  }

  const saveHandoverDraft: PipelineState['saveHandoverDraft'] = (carKey, draft) => {
    const car = carsRef.current.find((c) => c.key === carKey)
    // Guard 1: car must exist, be in 'sold' stage
    if (!car || car.stage !== 'sold') return false
    // Guard 2: BAST not yet completed (evidence is frozen after completion)
    if (car.bastCompleted) return false
    // Guard 3: photos must contain at least one valid non-empty string
    const validPhotos = (draft.photos ?? []).filter(
      (p) => typeof p === 'string' && p.trim().length > 0,
    )
    if (validPhotos.length === 0) return false
    // Save the draft — preserve any existing receivingPerson / handoverStaff
    // when the caller does not supply new values.
    const prevHandover = car.handover
    setCars((prev) =>
      prev.map((c) => {
        if (c.key !== carKey) return c
        // Re-check on prev: if already completed between read and write, abort
        if (c.bastCompleted) return c
        return {
          ...c,
          handover: {
            photos: validPhotos,
            receivingPerson: draft.receivingPerson ?? prevHandover?.receivingPerson,
            handoverStaff: draft.handoverStaff ?? prevHandover?.handoverStaff,
            completedAt: c.handover?.completedAt, // preserved if already set (shouldn't be)
          },
        }
      }),
    )
    return true
  }

  const assignInspector: PipelineState['assignInspector'] = (key, inspectorId, schedule) => {
    const car = carsRef.current.find((c) => c.key === key)
    // Guard: only 'lead' stage may receive a new normal inspection schedule.
    // 'rejected' uses scheduleReinspection (separate flow, creates reinspection record).
    // 'inspecting', 'purchasing', 'qc', 'available', 'sold' are all invalid.
    if (!car || car.stage !== 'lead') return false
    setCars((prev) =>
      prev.map((c) =>
        c.key === key
          ? { ...c, inspectorId, stage: 'inspecting' as const }
          : c,
      ),
    )
    // Buat record inspeksi baru berstatus 'Terjadwal'
    const now = new Date().toISOString()
    const scheduledAt = schedule ? isoDateTime(schedule.date, schedule.time) : undefined
    const record: InspectionRecord = {
      id: `insp-${key}-${Date.now()}`,
      code: nextInspectionCode(inspectionRecords),
      carKey: key,
      inspectorId,
      status: 'Terjadwal',
      pointsDone: 0,
      totalPoints: CHECKLIST_TEMPLATE.length,
      reason: 'Inspeksi dijadwalkan.',
      createdAt: now,
      ...(scheduledAt ? { scheduledAt } : {}),
      slaBreached: scheduledAt ? new Date(scheduledAt).getTime() < Date.now() : false,
      auditLog: [
        {
          at: now,
          event: 'record_created',
          actorId: inspectorId,
          detail: 'Inspeksi baru dijadwalkan',
          changes: scheduledAt
            ? { scheduledAt: { before: undefined, after: scheduledAt } }
            : undefined,
        },
      ],
    }
    setInspectionRecords((prev) => [...prev, record])
    return true
  }

  /**
   * MULAI INSPEKSI — transition: 'Terjadwal' → 'Dalam Inspeksi'
   * Sets startedAt = current ISO timestamp.
   * If car is still in 'lead' stage, advance to 'inspecting'.
   */
  const startInspection: PipelineState['startInspection'] = (inspectionId) => {
    const record = inspectionRecordsRef.current.find((r) => r.id === inspectionId)
    if (!record || record.status !== 'Terjadwal' || !canManageInspection(inspectionId)) return false
    const startedAt = new Date().toISOString()
    // Ensure checklistResponses is seeded when the inspection actually begins.
    // Records created by assignInspector/scheduleReinspection have no checklistResponses.
    const carForSeed = carsRef.current.find((c) => c.key === record.carKey)
    // Only seed when we have the car; records without a matching car are malformed.
    const seededResponses = record.checklistResponses
      ? record.checklistResponses
      : carForSeed
        ? seedResponsesFromCar(carForSeed)
        : undefined
    if (seededResponses) {
      const { globalTotal: totalItems, globalDone: doneItems } = computeProgress(seededResponses)
      setInspectionRecords((prev) =>
        prev.map((r) => {
          if (r.id !== inspectionId) return r
          const updated: InspectionRecord = withAudit(
            {
              ...r,
              status: 'Dalam Inspeksi',
              startedAt,
              slaBreached: false,
              checklistResponses: seededResponses,
              pointsDone: doneItems,
              totalPoints: totalItems,
            },
            {
              event: 'inspection_started',
              actorId: record.inspectorId,
              detail: 'MULAI INSPEKSI dikonfirmasi',
              changes: {
                startedAt: { before: undefined, after: startedAt },
                status: { before: 'Terjadwal', after: 'Dalam Inspeksi' },
              },
            },
          )
          return updated
        }),
      )
    } else {
      setInspectionRecords((prev) =>
        prev.map((r) => {
          if (r.id !== inspectionId) return r
          const updated: InspectionRecord = withAudit(
            { ...r, status: 'Dalam Inspeksi', startedAt, slaBreached: false },
            {
              event: 'inspection_started',
              actorId: record.inspectorId,
              detail: 'MULAI INSPEKSI dikonfirmasi',
              changes: {
                startedAt: { before: undefined, after: startedAt },
                status: { before: 'Terjadwal', after: 'Dalam Inspeksi' },
              },
            },
          )
          return updated
        }),
      )
    }
    // If car still in 'lead' stage, advance to 'inspecting'
    const car = carsRef.current.find((c) => c.key === record.carKey)
    if (car && car.stage === 'lead') {
      setCars((prev) =>
        prev.map((c) => (c.key === record.carKey ? { ...c, stage: 'inspecting' as const } : c)),
      )
    }
    return true
  }

  /**
   * SELESAIKAN INSPEKSI — transition: 'Dalam Inspeksi' → 'Selesai'
   * Sets completedAt = current ISO timestamp.
   * If decision='rejected', stage car → 'rejected'.
   * If decision='lulus':
   *   - pointsDone === totalPoints → proceed normally, no note required.
   *   - pointsDone < totalPoints   → lulusOverrideNote must be non-empty.
   *   In both cases stage car stays 'inspecting' (menunggu VALIDASI KE PEMBELIAN).
   * Only valid for records already in 'Dalam Inspeksi' status (startedAt exists).
   */
  const completeInspection: PipelineState['completeInspection'] = (
    inspectionId, decision, pointsDone, reason, lulusOverrideNote,
  ) => {
    const record = inspectionRecordsRef.current.find((r) => r.id === inspectionId)
    if (!record || record.status !== 'Dalam Inspeksi' || !canEditInspection(inspectionId)) return false
    const progress = record.checklistResponses ? computeProgress(record.checklistResponses) : undefined
    const totalPoints = progress?.globalTotal ?? record.totalPoints
    pointsDone = progress?.globalDone ?? pointsDone
    // H4 guard (updated): LULUS with incomplete checklist is allowed ONLY when
    // a non-empty lulusOverrideNote is provided. Complete checklist → note optional.
    if (decision === 'lulus' && totalPoints > 0) {
      if (pointsDone < totalPoints && !(lulusOverrideNote ?? '').trim()) return false
    }
    const completedAt = new Date().toISOString()
    setInspectionRecords((prev) =>
      prev.map((r) => {
        if (r.id !== inspectionId) return r
        const updated: InspectionRecord = withAudit(
          {
            ...r,
            status: 'Selesai',
            decision,
            pointsDone,
            totalPoints,
            reason,
            completedAt,
            slaBreached: false,
            ...(lulusOverrideNote ? { lulusOverrideNote: lulusOverrideNote.trim() } : {}),
          },
          {
            event: 'inspection_completed',
            actorId: record.inspectorId,
            detail:
              decision === 'lulus'
                ? pointsDone < totalPoints
                  ? 'Unit LULUS inspeksi dengan catatan (checklist belum lengkap)'
                  : 'Unit LULUS inspeksi'
                : 'Unit TIDAK LULUS inspeksi',
            changes: {
              decision: { before: record.decision, after: decision },
              pointsDone: { before: String(record.pointsDone), after: String(pointsDone) },
              completedAt: { before: undefined, after: completedAt },
              reason: { before: record.reason, after: reason },
              status: { before: 'Dalam Inspeksi', after: 'Selesai' },
              ...(lulusOverrideNote
                ? { lulusOverrideNote: { before: record.lulusOverrideNote, after: lulusOverrideNote.trim() } }
                : {}),
            },
          },
        )
        return updated
      }),
    )
    if (decision === 'rejected') {
      setCars((prev) =>
        prev.map((c) =>
          c.key === record.carKey ? { ...c, stage: 'rejected' as const } : c,
        ),
      )
    }
    // decision='lulus' → stage tetap 'inspecting', menunggu VALIDASI KE PEMBELIAN
    return true
  }

  const validateToPurchase: PipelineState['validateToPurchase'] = (inspectionId) => {
    const record = inspectionRecordsRef.current.find((r) => r.id === inspectionId)
    if (!record || record.status !== 'Selesai' || record.decision !== 'lulus') return false
    if (inspectionRecordsRef.current.filter(r => r.carKey === record.carKey).at(-1)?.id !== record.id) return false
    const car = carsRef.current.find((c) => c.key === record.carKey)
    if (!car || car.stage !== 'inspecting') return false
    setCars((prev) =>
      prev.map((c) => (c.key === record.carKey ? { ...c, stage: 'purchasing' as const } : c)),
    )
    return true
  }

  /**
   * REJECT PEMBELIAN — purchase decision only (admin decided NOT to buy).
   * Preserves inspection/QC/payment history. An unpaid stocked unit returns
   * to the rejected-purchase bucket (purchasing), outside active inventory.
   */
  const rejectPurchase: PipelineState['rejectPurchase'] = (carKey) => {
    const car = carsRef.current.find((c) => c.key === carKey)
    const request = paymentStore.getRequest('PURCHASE_UNIT', carKey)
    if (!car || !['purchasing', 'qc', 'available'].includes(car.stage) || saleLedger.get(carKey) || rejectedPurchasesRef.current.has(carKey) || request?.status === 'LUNAS') return false
    if (!request && car.buyPrice > 0 && (car.payment?.payments ?? []).reduce((sum, entry) => sum + entry.amount, 0) >= car.buyPrice) return false
    rejectedPurchasesRef.current.add(carKey)
    setRejectedPurchases(new Set(rejectedPurchasesRef.current))
    // Remove from active inventory using the existing purchase-stage bucket.
    // Arrival/QC/payment records are retained for history, never deleted.
    setCars(prev => prev.map(c => c.key === carKey ? { ...c, stage: 'purchasing' as const } : c))
    return true
  }

  const isPurchaseRejected: PipelineState['isPurchaseRejected'] = (carKey) =>
    rejectedPurchasesRef.current.has(carKey)

  const recordPurchaseRefund: PipelineState['recordPurchaseRefund'] = (requestId, input) => {
    const request = paymentStore.requests.find(r => r.id === requestId)
    if (!request) return { ok: false, error: 'Request pembelian tidak ditemukan.' }
    const paid = paymentStore.getEntries(requestId).reduce((sum, e) => sum + e.amount, 0)
    const result = refundStore.add(requestId, paid, rejectedPurchasesRef.current.has(request.sourceId), input)
    if (result.ok) setStoreVersion(v => v + 1)
    return result
  }

  // ── Save checklist responses (derived progress) ────────────────────────
  // Scheduling/start eligibility is broader than permission to enter inspection content.
  const canManageInspection = (inspectionId: string): boolean => {
    const record = inspectionRecordsRef.current.find(r => r.id === inspectionId)
    if (!record || inspectionRecordsRef.current.filter(r => r.carKey === record.carKey).at(-1)?.id !== record.id) return false
    const car = carsRef.current.find(c => c.key === record.carKey)
    if (!car || paymentStore.getRequest('PURCHASE_UNIT', car.key) || saleLedger.get(car.key) || purchaseIdMap[car.key] ||
      enteredPurchaseProcess.has(car.key) || submittedForPayment.has(car.key) || rejectedPurchasesRef.current.has(car.key) ||
      qcRecordsRef.current.some(qc => qc.carKey === car.key)) return false
    return (car.stage === 'lead' && record.status === 'Terjadwal') || (car.stage === 'inspecting' && (record.status !== 'Selesai' || record.decision === 'lulus')) ||
      (car.stage === 'rejected' && record.status === 'Selesai' && record.decision === 'rejected')
  }
  const canEditInspection: PipelineState['canEditInspection'] = inspectionId => {
    const record = inspectionRecordsRef.current.find(r => r.id === inspectionId)
    return (record?.status === 'Dalam Inspeksi' || record?.status === 'Selesai') && canManageInspection(inspectionId)
  }
  const correctInspection = (inspectionId: string, mutate: (record: InspectionRecord) => InspectionRecord, detail: string) => {
    if (!canEditInspection(inspectionId)) return
    setInspectionRecords(prev => prev.map(record => {
      if (record.id !== inspectionId) return record
      const next = mutate(record)
      if (next === record) return record
      return record.status === 'Selesai' ? withAudit(next, { event: 'inspection_corrected', actorId: record.inspectorId, detail }) : next
    }))
  }
  const addInspectionPhotos: PipelineState['addInspectionPhotos'] = (inspectionId, itemId, dataUrls) => {
    const item = CHECKLIST_TEMPLATE.find(candidate => candidate.id === itemId)
    if (!canEditInspection(inspectionId) || !item || !(item.inputType === 'photo' || item.allowsPhoto) ||
      !dataUrls.length || dataUrls.some(url => typeof url !== 'string' || !url.startsWith('data:image/'))) return false
    correctInspection(inspectionId, record => {
      const current = record.checklistResponses ?? []
      const base: import('../data/checklist').ChecklistResponse[] = [...current, ...CHECKLIST_TEMPLATE.filter(candidate => !current.some(response => response.itemId === candidate.id)).map(candidate => ({ itemId: candidate.id, value: 'BELUM DIPERIKSA' }))]
      const responses = base.map(response => response.itemId === itemId ?
        { ...response, value: item.inputType === 'photo' ? 'ADA' : response.value, mediaRefs: [...(response.mediaRefs ?? []), ...dataUrls], updatedAt: new Date().toISOString() } : response)
      const { globalDone: pointsDone, globalTotal: totalPoints } = computeProgress(responses)
      return { ...record, checklistResponses: responses, pointsDone, totalPoints }
    }, `Foto ${item.label} ditambahkan (${dataUrls.length} foto)`)
    return true
  }
  const saveInspectionNotes: PipelineState['saveInspectionNotes'] = (inspectionId, reason) => {
    correctInspection(inspectionId, record => record.reason === reason ? record : { ...record, reason }, 'Keterangan inspeksi dikoreksi sebelum pembelian')
  }
  const saveChecklistResponses: PipelineState['saveChecklistResponses'] = (inspectionId, responses) => {
    correctInspection(inspectionId, record => {
      const { globalDone: pointsDone, globalTotal: totalPoints } = computeProgress(responses)
      return { ...record, checklistResponses: responses, pointsDone, totalPoints }
    }, 'Checklist/foto inspeksi dikoreksi sebelum pembelian')
  }
  const saveStatusPenilaian: PipelineState['saveStatusPenilaian'] = (inspectionId, status) => {
    correctInspection(inspectionId, record => record.statusPenilaian === status ? record : withAudit({ ...record, statusPenilaian: status }, {
      event: 'decision_updated', detail: 'Status penilaian diperbarui', changes: { statusPenilaian: { before: record.statusPenilaian, after: status } },
    }), 'Status penilaian dikoreksi sebelum pembelian')
  }
  const addFinding: PipelineState['addFinding'] = (inspectionId, finding) => {
    correctInspection(inspectionId, record => (record.findings ?? []).some(item => item.id === finding.id) ? record :
      { ...record, findings: [...(record.findings ?? []), finding] }, 'Temuan ditambahkan sebelum pembelian')
  }
  const updateFinding: PipelineState['updateFinding'] = (inspectionId, finding) => {
    correctInspection(inspectionId, record => !(record.findings ?? []).some(item => item.id === finding.id) ? record :
      { ...record, findings: record.findings!.map(item => item.id === finding.id ? finding : item) }, 'Temuan dikoreksi sebelum pembelian')
  }
  const removeFinding: PipelineState['removeFinding'] = (inspectionId, findingId) => {
    correctInspection(inspectionId, record => !(record.findings ?? []).some(item => item.id === findingId) ? record :
      { ...record, findings: record.findings!.filter(item => item.id !== findingId) }, 'Temuan dihapus sebelum pembelian')
  }

  /**
   * JADWALKAN INSPEKSI ULANG — create new 'Terjadwal' record for a rejected car.
   * Also advances car stage from 'rejected' → 'inspecting'.
   * The new record will be 'Terjadwal' until inspector clicks MULAI INSPEKSI.
   */
  const scheduleReinspection: PipelineState['scheduleReinspection'] = (carKey, inspectorId, schedule) => {
    const car = carsRef.current.find((c) => c.key === carKey)
    if (!car || car.stage !== 'rejected') return false
    setCars((prev) =>
      prev.map((c) =>
        c.key === carKey
          ? { ...c, inspectorId, stage: 'inspecting' as const }
          : c,
      ),
    )
    // Hitung urutan: berapa inspeksi yang sudah ada untuk car ini
    const existingForCar = inspectionRecordsRef.current.filter((r) => r.carKey === carKey).length
    const seq = existingForCar + 1
    const now = new Date().toISOString()
    const scheduledAt = schedule ? isoDateTime(schedule.date, schedule.time) : undefined
    const record: InspectionRecord = {
      id: `insp-${carKey}-${seq}`,
      code: nextInspectionCode(inspectionRecords),
      carKey,
      inspectorId,
      status: 'Terjadwal',
      pointsDone: 0,
      totalPoints: CHECKLIST_TEMPLATE.length,
      reason: 'Inspeksi ulang dijadwalkan setelah unit ditolak.',
      createdAt: now,
      ...(scheduledAt ? { scheduledAt } : {}),
      slaBreached: scheduledAt ? new Date(scheduledAt).getTime() < Date.now() : false,
      auditLog: [
        {
          at: now,
          event: 'record_created',
          actorId: inspectorId,
          detail: 'Inspeksi ulang dijadwalkan',
          changes: scheduledAt
            ? { scheduledAt: { before: undefined, after: scheduledAt } }
            : undefined,
        },
      ],
    }
    setInspectionRecords((prev) => [...prev, record])
    return true
  }

  /**
   * RESCHEDULE — ubah jadwal inspection yang belum dimulai (status 'Terjadwal').
   * Ganti scheduledAt + append audit event 'schedule_updated' (before/after).
   * slaBreached direkompute berdasarkan jadwal baru.
   * Tidak mengubah inspectorId.
   */

  // ── QC domain action helpers ───────────────────────────────────────────────

  /**
   * Generate a unique QC record ID.
   * Format: qc-{type-lower}-{carKey}-{seq}-{Date.now()}
   * The synchronous sequence guarantees uniqueness for same-tick records;
   * Date.now() also distinguishes records created after a reset.
   */
  function nextQcRecordId(type: QcType, carKey: string): string {
    const seqKey = `${type.toLowerCase()}-${carKey}`
    const seq = (qcSeqRef.current[seqKey] ?? 0) + 1
    qcSeqRef.current[seqKey] = seq
    return `qc-${type.toLowerCase()}-${carKey}-${seq}-${Date.now()}`
  }

  /** Read-only accessor for QC records of a specific vehicle. */
  const getQcRecordsForCar: PipelineState['getQcRecordsForCar'] = (carKey) =>
    qcRecordsRef.current.filter((r) => r.carKey === carKey)

  /** Derived three-state QC IN status for a vehicle. */
  const getQcInStatusForCar: PipelineState['getQcInStatusForCar'] = (carKey) => {
    if (getActiveQcIn(carKey, qcRecordsRef.current)) return 'DALAM PROSES'
    if (getLatestCompletedQcIn(carKey, qcRecordsRef.current)) return 'SELESAI'
    return 'BELUM DILAKUKAN'
  }

  /** Most recently completed QC IN record for a vehicle. */
  const getLatestCompletedQcInForCar: PipelineState['getLatestCompletedQcInForCar'] = (carKey) =>
    getLatestCompletedQcIn(carKey, qcRecordsRef.current)

  /** Derived three-state QC OUT status for a vehicle (same three-state shape as QC IN). */
  const getQcOutStatusForCar: PipelineState['getQcOutStatusForCar'] = (carKey) => {
    if (getActiveQcOut(carKey, qcRecordsRef.current)) return 'DALAM PROSES'
    if (getLatestCompletedQcOut(carKey, qcRecordsRef.current)) return 'SELESAI'
    return 'BELUM DILAKUKAN'
  }

  // ── STEP 4: enterStockUnit ───────────────────────────────────────────────
  // Partial payment uses a confirmed manual action; full payment calls this
  // same canonical command automatically, without duplicating the unit.

  const getStockPaymentSnapshot: PipelineState['getStockPaymentSnapshot'] = (carKey) => {
    const car = carsRef.current.find(c => c.key === carKey)
    if (!car) return undefined
    const request = paymentStore.getRequest('PURCHASE_UNIT', carKey)
    const total = request?.totalAmount ?? car.buyPrice
    const paid = request ? paymentStore.getEntries(request.id).reduce((sum, entry) => sum + entry.amount, 0)
      : (car.payment?.payments ?? []).reduce((sum, entry) => sum + entry.amount, 0)
    if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(paid) || paid < 0 || paid > total) return undefined
    return { requestId: request?.id, total, paid, remaining: total - paid }
  }

  const enterStockUnit: PipelineState['enterStockUnit'] = (carKey, reviewedPayment) => {
    const car = carsRef.current.find((c) => c.key === carKey)
    // Guard 1: must be in purchasing stage
    if (!car || car.stage !== 'purchasing') return false
    // Submission is proven by the canonical request, not navigation/legacy flags.
    if (!paymentStore.getRequest('PURCHASE_UNIT', carKey)) return false
    // Guard 2: must not be rejected
    if (rejectedPurchasesRef.current.has(carKey)) return false
    // Guard 3: must not already be in stock (duplicate prevention)
    if (saleLedger.get(carKey)) return false
    if (car.stockStatus !== undefined) return false
    const payment = getStockPaymentSnapshot(carKey)
    if (!payment) return false
    // Fully paid requests auto-enter. Every unpaid/partial manual command must
    // carry the current snapshot explicitly reviewed in the confirmation dialog.
    if (payment.remaining > 0 && !sameStockPayment(payment, reviewedPayment)) return false
    // All guards passed — advance to qc + set stockStatus to INCOMING
    setCars((prev) =>
      prev.map((c) =>
        c.key === carKey
          ? { ...c, stage: 'qc' as const, stockStatus: 'INCOMING' as const }
          : c,
      ),
    )
    return true
  }

  function autoStockPaidRequest(requestId: string) {
    const request = paymentStore.requests.find(r => r.id === requestId)
    if (request?.sourceType === 'PURCHASE_UNIT' && request.status === 'LUNAS') enterStockUnit(request.sourceId)
  }

  // ── STEP 5: confirmArrival ───────────────────────────────────────────────

  const confirmArrival: PipelineState['confirmArrival'] = (carKey, confirmedBy, plateConfirmed, photos) => {
    const car = carsRef.current.find((c) => c.key === carKey)
    // Guard 1: car must exist
    if (!car) return false
    // Guard 2: must be in qc stage
    if (car.stage !== 'qc') return false
    // Guard 3: must be INCOMING (not already READY or undefined)
    if (car.stockStatus !== 'INCOMING') return false
    // Guard 4: receiving officer must be a valid, non-empty id
    const trimmedOfficer = confirmedBy.trim()
    if (!trimmedOfficer) return false
    // Guard 5: plate re-entry must be non-empty
    const trimmedPlate = plateConfirmed.trim()
    if (!trimmedPlate) return false
    // Guard 6: normalized plate must match the registered plate
    const norm = (s: string) => s.replace(/\s+/g, '').toUpperCase()
    if (norm(trimmedPlate) !== norm(car.plate)) return false
    // Guard 7: both required photo categories must have evidence
    if (!photos?.vehicle?.trim() || !photos?.license?.trim()) return false
    const now = new Date().toISOString()
    setCars((prev) =>
      prev.map((c) =>
        c.key === carKey
          ? {
              ...c,
              stockStatus: 'READY' as const,
              arrivedAt: now,
              arrivalConfirmedBy: trimmedOfficer,
              arrivalPlate: trimmedPlate,
              arrivalPhotos: {
                vehicle: photos.vehicle.trim(),
                license: photos.license.trim(),
              },
            }
          : c,
      ),
    )
    return true
  }

  // ── STEP 6: startQcIn / saveQcInDraft / completeQcIn ─────────────────────

  const saveQcInDraft: PipelineState['saveQcInDraft'] = (qcRecordId, draft) => {
    const record = qcRecordsRef.current.find((r) => r.id === qcRecordId)
    if (record && rejectedPurchasesRef.current.has(record.carKey)) return false
    if (record && carsRef.current.find(car => car.key === record.carKey)?.bastCompleted) return false
    // Guard 1: record must exist
    if (!record) return false
    // Guard 2: must be type IN
    if (record.type !== 'IN') return false
    // Guard 3: must be DALAM PROSES (completed records are immutable)
    if (record.status !== 'DALAM PROSES') return false
    setQcRecords((prev) =>
      prev.map((r) =>
        r.id === qcRecordId
          ? {
              ...r,
              ...(draft.checklistResponses !== undefined
                ? { checklistResponses: draft.checklistResponses }
                : {}),
              ...(draft.findings !== undefined ? { findings: draft.findings } : {}),
              ...(draft.notes !== undefined ? { notes: draft.notes } : {}),
              ...(draft.photos !== undefined ? { photos: draft.photos } : {}),
            }
          : r,
      ),
    )
    return true
  }

  const startQcIn: PipelineState['startQcIn'] = (carKey, inspectorId) => {
    const car = carsRef.current.find((c) => c.key === carKey)
    // QC continues during the sale until final handover.
    if (!car || car.bastCompleted || !['qc', 'available', 'sold'].includes(car.stage)) return null
    if (rejectedPurchasesRef.current.has(carKey)) return null
    // Guard 2: must be physically READY (INCOMING cannot start QC IN)
    if (car.stockStatus !== 'READY') return null
    // Guard 3: no active QC IN already exists for this car
    if (getActiveQcIn(carKey, qcRecordsRef.current)) return null
    const id = nextQcRecordId('IN', carKey)
    const now = new Date().toISOString()
    const template = getQcTemplate('qc-in')
    const repairFindings = getOutstandingQcInFindings(qcRecordsRef.current, carKey).map((finding, index) => ({
      ...finding, id: `${id}-repair-${index + 1}`, originalFindingId: finding.id,
      resolution: 'UNRESOLVED' as const, verifiedBy: undefined, verifiedAt: undefined,
      photos: [...(finding.photos ?? [])],
    }))
    const record: QcRecord = {
      id,
      carKey,
      type: 'IN',
      status: 'DALAM PROSES',
      inspectorId,
      startedAt: now,
      templateId: template.id,
      templateVersion: template.version,
      findings: repairFindings,
    }
    setQcRecords((prev) => [...prev, record])
    return record
  }

  const completeQcIn: PipelineState['completeQcIn'] = (qcRecordId, data) => {
    const record = qcRecordsRef.current.find((r) => r.id === qcRecordId)
    if (record && rejectedPurchasesRef.current.has(record.carKey)) return false
    if (record && carsRef.current.find(car => car.key === record.carKey)?.bastCompleted) return false
    // Guard 1: record must exist
    if (!record) return false
    // Guard 2: must be type IN
    if (record.type !== 'IN') return false
    // Guard 3: must be in DALAM PROSES status (not already SELESAI)
    if (record.status !== 'DALAM PROSES') return false
    // Guard 4: result must be a valid QcInResult
    if (!data || !('result' in data)) return false
    // Historical results remain readable; new submissions use current choices.
    const result = data.result
    if (!isQcInInputResult(result)) {
      return false
    }
    // Guard 6: N/A reasons remain mandatory. Repair-only QC IN may replace
    // missing finding evidence with a nonblank completion/draft note.
    // Use the most recently saved draft responses if not passed explicitly.
    const responses = data.checklistResponses ?? record.checklistResponses
    const completionNotes = data.notes ?? record.notes
    if (responses) {
      const items = getQcTemplateItems(record.templateId, record.templateVersion)
      const errors = validateQcInChecklist(responses, items, data.findings ?? record.findings, { result, notes: completionNotes })
      if (errors.length > 0) return false
    }
    // Guard 7: LAYAK JUAL is rejected when unresolved blocking findings exist.
    // Merged findings (draft + completion payload) must all be clean.
    if (result === 'LAYAK JUAL') {
      const mergedFindings = data.findings ?? record.findings ?? []
      const blocking = mergedFindings.filter(
        (f) => f.blocksSale === true && f.resolution !== 'RESOLVED',
      )
      if (blocking.length > 0) return false
      const candidateRecords = qcRecordsRef.current.map(candidate => candidate.id === record.id
        ? { ...candidate, status: 'SELESAI' as const, findings: mergedFindings } : candidate)
      if (getOutstandingQcInFindings(candidateRecords, record.carKey).some(finding => finding.blocksSale === true)) return false
    }
    const now = new Date().toISOString()
    setQcRecords((prev) =>
      prev.map((r) =>
        r.id === qcRecordId
          ? {
              ...r,
              status: 'SELESAI' as const,
              completedAt: now,
              result: data.result,
              ...(data.findings ? { findings: data.findings } : {}),
              ...(data.checklistResponses ? { checklistResponses: data.checklistResponses } : {}),
              ...(completionNotes !== undefined ? { notes: completionNotes } : {}),
              ...(data.photos ? { photos: data.photos } : {}),
            }
          : r,
      ),
    )
    // Auto-advance (Rule 3): when QC IN completes with LAYAK JUAL,
    // transition the vehicle from 'qc' to 'available' in the same render batch.
    // This avoids stale-state issues (no separate advance() call).
    // Guards: stage must be 'qc', stockStatus must be 'READY'.
    // No duplicate transition: canTransition('available', 'available') is false,
    // so a second call is a no-op.
    if (result === 'LAYAK JUAL') {
      setCars((prev) =>
        prev.map((c) => {
          if (c.key !== record.carKey || c.stage !== 'qc' || c.stockStatus !== 'READY') return c
          return { ...c, stage: 'available' as const }
        }),
      )
    }
    return true
  }

  // ── STEP 7: startQcOut / completeQcOut ───────────────────────────────────

  const startQcOut: PipelineState['startQcOut'] = (carKey, inspectorId) => {
    const car = carsRef.current.find((c) => c.key === carKey)
    // Guard 1: must be in qc or available stage
    if (!car || car.bastCompleted || (car.stage !== 'qc' && car.stage !== 'available' && car.stage !== 'sold')) return null
    if (rejectedPurchasesRef.current.has(carKey)) return null
    // Guard 2: must be physically READY
    if (car.stockStatus !== 'READY') return null
    // Guard 3: no active QC OUT already exists for this car
    if (getActiveQcOut(carKey, qcRecordsRef.current)) return null
    // Note: does NOT check QC IN status — QC OUT is allowed even when
    // QC IN is BELUM DILAKUKAN or DALAM PROSES.
    const id = nextQcRecordId('OUT', carKey)
    const now = new Date().toISOString()
    const template = getQcTemplate('qc-out')
    const repairFindings = getOutstandingQcOutFindings(qcRecordsRef.current, carKey).map((finding, index) => ({
      ...finding, id: `${id}-repair-${index + 1}`, originalFindingId: finding.id,
      resolution: 'UNRESOLVED' as const, verifiedBy: undefined, verifiedAt: undefined,
      photos: [...(finding.photos ?? [])],
    }))
    const record: QcRecord = {
      id,
      carKey,
      type: 'OUT',
      status: 'DALAM PROSES',
      inspectorId,
      startedAt: now,
      templateId: template.id,
      templateVersion: template.version,
      findings: repairFindings,
    }
    setQcRecords((prev) => [...prev, record])
    return record
  }

  const completeQcOut: PipelineState['completeQcOut'] = (qcRecordId, data) => {
    const record = qcRecordsRef.current.find((r) => r.id === qcRecordId)
    if (record && rejectedPurchasesRef.current.has(record.carKey)) return false
    // Guard 1: record must exist
    if (!record) return false
    if (carsRef.current.find(car => car.key === record.carKey)?.bastCompleted) return false
    // Guard 2: must be type OUT
    if (record.type !== 'OUT') return false
    // Guard 3: must be in DALAM PROSES status (completed records are immutable)
    if (record.status !== 'DALAM PROSES') return false
    // Guard 4: result must be present
    if (!data || !('result' in data)) return false
    // Guard 5: result must be a valid QcOutResult
    if (!isQcOutResult(data.result)) return false
    const result = data.result
    // Guard 6: checklist validation (N/A reasons, temuan evidence) — checklist
    // items are all optional; this only rejects malformed answered items.
    // Use the most recently saved draft responses if not passed explicitly.
    const responses = data.checklistResponses ?? record.checklistResponses
    if (responses) {
      const items = getQcTemplateItems(record.templateId, record.templateVersion)
      const errors = validateQcChecklist(responses, items, data.findings ?? record.findings)
      if (errors.length > 0) return false
    }
    // Guard 7: SIAP SERAH is rejected when unresolved blocksHandover findings exist.
    // TUNDA SERAH is always allowed regardless of unresolved findings.
    // Merged findings (draft + completion payload) are checked.
    if (result === 'SIAP SERAH') {
      const mergedFindings = data.findings ?? record.findings ?? []
      const blocking = mergedFindings.filter(
        (f) => f.blocksHandover === true && f.resolution !== 'RESOLVED',
      )
      if (blocking.length > 0) return false
      const candidateRecords = qcRecordsRef.current.map(candidate => candidate.id === record.id
        ? { ...candidate, status: 'SELESAI' as const, findings: mergedFindings } : candidate)
      if (getOutstandingQcOutFindings(candidateRecords, record.carKey).some(finding => finding.blocksHandover === true)) return false
    }
    const now = new Date().toISOString()
    setQcRecords((prev) =>
      prev.map((r) =>
        r.id === qcRecordId
          ? {
              ...r,
              status: 'SELESAI' as const,
              completedAt: now,
              result: data.result,
              ...(data.findings ? { findings: data.findings } : {}),
              ...(data.checklistResponses ? { checklistResponses: data.checklistResponses } : {}),
              ...(data.notes ? { notes: data.notes } : {}),
              ...(data.photos ? { photos: data.photos } : {}),
            }
          : r,
      ),
    )
    // QC OUT completion does NOT mutate any QC IN record.
    // QC OUT completion does NOT change car.stage or car.stockStatus.
    return true
  }

  const saveQcOutDraft: PipelineState['saveQcOutDraft'] = (qcRecordId, draft) => {
    const record = qcRecordsRef.current.find((r) => r.id === qcRecordId)
    if (record && rejectedPurchasesRef.current.has(record.carKey)) return false
    // Guard 1: record must exist
    if (!record) return false
    // Guard 2: must be type OUT
    if (record.type !== 'OUT') return false
    // Guard 3: must be DALAM PROSES (completed records are immutable)
    if (record.status !== 'DALAM PROSES') return false
    setQcRecords((prev) =>
      prev.map((r) =>
        r.id === qcRecordId
          ? {
              ...r,
              ...(draft.checklistResponses !== undefined
                ? { checklistResponses: draft.checklistResponses }
                : {}),
              ...(draft.findings !== undefined ? { findings: draft.findings } : {}),
              ...(draft.notes !== undefined ? { notes: draft.notes } : {}),
              ...(draft.photos !== undefined ? { photos: draft.photos } : {}),
            }
          : r,
      ),
    )
    return true
  }

  const saveCarPayment: PipelineState['saveCarPayment'] = (carKey, payment) => {
    if (rejectedPurchasesRef.current.has(carKey)) return
    setCars((prev) =>
      prev.map((c) => (c.key === carKey ? { ...c, payment } : c)),
    )
  }

  const addCarPaymentRecord: PipelineState['addCarPaymentRecord'] = (carKey, record) => {
    if (rejectedPurchasesRef.current.has(carKey)) return false
    const car = carsRef.current.find((c) => c.key === carKey)
    if (!car) return false
    const newRecord: PaymentRecord = {
      ...record,
      id: `pay-${carKey}-${Date.now()}`,
      paidAt: new Date().toISOString(),
    }
    setCars((prev) =>
      prev.map((c) => {
        if (c.key !== carKey) return c
        const current: CarPayment = c.payment ?? { carKey, paymentType: 'Cash', commission: 0, payments: [] }
        return { ...c, payment: { ...current, payments: [...current.payments, newRecord] } }
      }),
    )
    return true
  }

  const saveCarCorrections: PipelineState['saveCarCorrections'] = (carKey, corrections) => {
    if (corrections.plate !== undefined && !isValidPlate(corrections.plate)) return false
    // Price-lock guard: once a PURCHASE_UNIT PaymentRequest exists, buyPrice is
    // frozen at PaymentRequest.totalAmount. Strip buyPrice from the corrections
    // so PaymentRequest.totalAmount cannot be silently changed. Unrelated fields
    // (brand, model, year, color, etc.) are preserved.
    const priceLocked = hasActivePaymentRequest('PURCHASE_UNIT', carKey)
    const safeCorrections = { ...stripLockedPrice(corrections as Record<string, unknown>, priceLocked) } as typeof corrections
    if (['year', 'mileage', 'buyPrice'].some(field => {
      const value = safeCorrections[field as keyof typeof safeCorrections]
      return value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
    })) return false
    if (safeCorrections.plate !== undefined) safeCorrections.plate = normalizePlate(safeCorrections.plate)
    setCars((prev) => prev.map((c) => (c.key === carKey ? { ...c, ...safeCorrections } : c)))
    return true
  }

  const saveSupplierDetail: PipelineState['saveSupplierDetail'] = (carKey, detail, supplierId, partyType) => {
    const car = carsRef.current.find(candidate => candidate.key === carKey)
    if (partyType === 'Supplier' && !supplierId) return
    if (partyType === 'Perorangan' && !detail.name?.trim()) return
    if (partyType !== 'Perorangan') supplierId = supplierId || car?.supplierId
    else supplierId = undefined
    const supplier = supplierId ? suppliers.find(candidate => candidate.id === supplierId) : undefined
    if (supplierId && (!supplier || (supplier.status === 'Nonaktif' && car?.supplierId !== supplierId))) return
    const request = paymentStore.getRequest('PURCHASE_UNIT', carKey)
    if (request && partyType && ((request.vendorType ?? (request.supplierId ? 'Supplier' : car?.purchasePartyType)) !== partyType)) return
    if (supplierId && request && ((request.supplierId && request.supplierId !== supplierId) || (!request.supplierId && car?.supplierId !== supplierId))) return
    if (supplier) detail = { ...detail, name: supplier.name }
    setCars((prev) =>
      prev.map((c) =>
        c.key === carKey
          ? {
              ...c,
              supplierDetail: detail,
              supplier: detail.name?.trim() || c.supplier,
              ...(partyType === 'Perorangan' ? { supplierId: undefined } : supplierId ? { supplierId } : {}),
              ...(partyType ? { purchasePartyType: partyType } : {}),
            }
          : c,
      ),
    )
  }

  const rescheduleInspection: PipelineState['rescheduleInspection'] = (inspectionId, schedule, actorId) => {
    const record = inspectionRecordsRef.current.find((r) => r.id === inspectionId)
    if (!record || record.status !== 'Terjadwal' || !canManageInspection(inspectionId)) return false
    // H3 guard: the car must still be at a stage where a pre-start Terjadwal record is valid.
    // 'lead' — record created via assignInspector but not yet started.
    // 'inspecting' — active inspection flow (before startInspection was called on this record).
    // 'rejected', 'purchasing', 'qc', 'available', 'sold' → all blocked.
    const car = carsRef.current.find((c) => c.key === record.carKey)
    if (!car || (car.stage !== 'lead' && car.stage !== 'inspecting')) return false
    const newScheduledAt = isoDateTime(schedule.date, schedule.time)
    setInspectionRecords((prev) =>
      prev.map((r) => {
        if (r.id !== inspectionId) return r
        const updated: InspectionRecord = withAudit(
          { ...r, scheduledAt: newScheduledAt, slaBreached: computeSlaBreached({ status: r.status, scheduledAt: newScheduledAt, startedAt: r.startedAt }) },
          {
            event: 'schedule_updated',
            actorId,
            detail: 'Jadwal inspeksi diubah',
            changes: {
              scheduledAt: { before: r.scheduledAt, after: newScheduledAt },
            },
          },
        )
        return updated
      }),
    )
    return true
  }

  // ── Master Supplier CRUD ──────────────────────────────────────────────

  const addSupplier: PipelineState['addSupplier'] = (input) => {
    const nextSeq = supplierSeq + 1
    const newId = `SUP-${String(nextSeq).padStart(3, '0')}`
    const newSupplier: Supplier = {
      id: newId,
      ...input,
      totalSupplied: 0,
      totalValue: 0,
      joinedDate: new Date().toLocaleDateString('id-ID'),
      status: 'Aktif',
    }
    setSupplierSeq(nextSeq)
    setSuppliers((prev) => [...prev, newSupplier])
    return newSupplier
  }

  const updateSupplier: PipelineState['updateSupplier'] = (id, updates) => {
    const existing = suppliers.find((s) => s.id === id)
    if (!existing) return null
    const merged: Supplier = { ...existing, ...updates, id: existing.id }
    setSuppliers((prev) => prev.map((s) => (s.id === id ? merged : s)))
    return merged
  }

  const getSupplierById: PipelineState['getSupplierById'] = (id) =>
    suppliers.find((s) => s.id === id)

  useEffect(() => {
    if (!onSnapshot) return
    onSnapshot({ version: 1, cars, inspectionRecords, qcRecords, suppliers, supplierSeq,
      leasings: leasingStore.records, sales: saleLedger.records, saleCounters: saleLedger.counters,
      payment: { requests: paymentStore.requests, entries: paymentStore.entries, verifications: paymentStore.verifications,
        audit: paymentStore.audit, paySeq: paymentStore.paySeq, pmtSeq: paymentStore.pmtSeq },
      refunds: refundStore.records, rejectedPurchases: [...rejectedPurchases], submittedForPayment: [...submittedForPayment],
      enteredPurchaseProcess: [...enteredPurchaseProcess], purchaseIdMap, purchaseSeq, purchaseDocuments, purchaseNotes,
      commissionPct, qcSequences: { ...qcSeqRef.current } })
  }, [onSnapshot, cars, inspectionRecords, qcRecords, suppliers, supplierSeq, leasingStore, saleLedger, paymentStore,
    refundStore, rejectedPurchases, submittedForPayment, enteredPurchaseProcess, purchaseIdMap, purchaseSeq,
    purchaseDocuments, purchaseNotes, commissionPct, leasingVersion, saleVersion, storeVersion])

  return (
    <PipelineCtx.Provider
      value={{
        cars,
        leasings, saveLeasing,
        saleRecords, commitSale, updateSale, receiveSalePayment, receiveSalePayments, confirmSaleHistory, attachSaleDocument, removeSaleDocument,
        inspectionRecords,
        advance,
        addCar,
        canEditLead,
        updateLead,
        removeCar,
        reset,
        getCar,
        markBast,
        saveHandoverDraft,
        assignInspector,
        startInspection,
        completeInspection,
        canEditInspection,
        addInspectionPhotos,
        saveInspectionNotes,
        saveChecklistResponses,
        saveStatusPenilaian,
        addFinding,
        updateFinding,
        removeFinding,
        validateToPurchase,
        rejectPurchase,
        isPurchaseRejected,
        scheduleReinspection,
        rescheduleInspection,
        saveCarPayment,
        addCarPaymentRecord,
        saveCarCorrections,
        saveSupplierDetail,
        markSubmittedForPayment,
        isSubmittedForPayment,
        markEnteredPurchaseProcess,
        isEnteredPurchaseProcess,
        getPurchaseId,
        paymentRequests,
        paymentEntries,
        purchaseRefunds: refundStore.records,
        recordPurchaseRefund,
        createPaymentRequest,
        addPaymentEntry,
        checkForDuplicates,
        getDraftFingerprint,
        confirmDuplicatePayment,
        paymentAudit,
        getPaymentAuditForEntry,
        hasActivePaymentRequest,
        getPaymentRequestForSource,
        getEntriesForRequest,
        paymentVerifications,
        verifyPaymentRequestAmount,
        isAmountVerified,
        purchaseDocuments,
        updatePurchaseDocument,
        purchaseNotes,
        commissionPct,
        qcRecords,
        enterStockUnit,
        getStockPaymentSnapshot,
        confirmArrival,
        saveQcInDraft,
        startQcIn,
        completeQcIn,
        saveQcOutDraft,
        startQcOut,
        completeQcOut,
        getQcRecordsForCar,
        getQcInStatusForCar,
        getQcOutStatusForCar,
        getLatestCompletedQcInForCar,
        suppliers,
        addSupplier,
        updateSupplier,
        getSupplierById,
      }}
    >
      {children}
    </PipelineCtx.Provider>
  )
}

export function usePipeline() {
  const ctx = useContext(PipelineCtx)
  if (!ctx) throw new Error('usePipeline harus di dalam PipelineProvider')
  return ctx
}

/** Hook turunan: filter berdasarkan stage */
export function usePipelineByStage(stage: Stage | Stage[]) {
  const { cars } = usePipeline()
  const stages = Array.isArray(stage) ? stage : [stage]
  return cars.filter((c) => stages.includes(c.stage))
}
