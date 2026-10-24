import { PaymentProofReview, type ProofReviewItem } from './PaymentProofReview'
import { formatLeadPriceRange } from '../lib/leadPriceRange'
import { purchasePaymentCategory } from '../lib/purchasePaymentCategory'
import { useState, useRef, useMemo } from 'react'
import { PurchaseRefundPanel } from './PurchaseRefundPanel'
import {
  CreditCard, Plus, CheckCircle2, UploadCloud, FileText, Eye, ShieldCheck, AlertTriangle, X, Trash2,
} from 'lucide-react'
import {
  SectionCard, Field, inputCls, selectCls,
} from './FormSection'
import { RupiahInput } from './RupiahInput'
import { usePipelineData, type PurchaseRow } from '../context/usePipelineData'
import { type PipelineCar } from '../data/pipeline'
import { formatRupiah } from '../data/sales'
import {
  ENTRY_PAYMENT_CATEGORIES,
  type EntryPaymentCategory,
  type PaymentEntry,
  type ProofMeta,
  type EntryAllocation,
  type AllocationRole,
  type DuplicatePaymentMatch,
  type ReviewedDuplicateMatches,
  type PaymentOverrideAuditRecord,
  computePaymentStatus,
  sumPaymentEntries,
  reconcileAllocations,
  hasPlannedAllocations,
} from '../data/payments'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'

// ── Internal form row type (multi-row payment form) ───────────────────────
// One row = one AllocationRole disbursement. Each row produces a separate
// PaymentEntry. Multiple rows of the same role are allowed.
type PaymentRowDraft = {
  rowKey: string            // unique per row (stable identity across re-renders)
  role: AllocationRole
  paymentCategory: EntryPaymentCategory
  bank: string
  accountNumber: string
  accountHolder: string
  amount: number | undefined
  method: string
  note: string
  /** Pre-filled from planned.recipient; editable by operator. */
  recipient: string
  proof: ProofMeta | null
  /** Set when this row's PaymentEntry has been committed. UI locks the fields. */
  committedEntryId?: string
}

// Per-row processing result (shown after "Proses Pembayaran" click)
// status: 'success' — entry committed, 'failed' — guard rejected,
//         'pending-dup' — duplicate warning, needs operator confirmation
type RowResult =
  | { rowKey: string; status: 'success'; entryId: string; amount: number; role: AllocationRole }
  | { rowKey: string; status: 'failed'; reason: string; role: AllocationRole }
  | { rowKey: string; status: 'pending-dup'; role: AllocationRole }

/**
 * Payment detail view for a specific PaymentRequest.
 * Receives a PurchaseRow; resolves the active PaymentRequest via
 * getPaymentRequestForSource and shows entries + add-entry form.
 *
 * For requests with planned allocations:
 * - Displays planned allocation summary
 * - Add-payment form includes per-role allocation inputs + actual recipient
 * - Live sum validation + remaining balances
 *
 * For historical requests without allocations:
 * - Preserves the legacy entry workflow (no allocation inputs)
 *
 * Falls back to the legacy car.payment data if no generic request exists yet.
 */
export function ProsesPembayaran({
  row,
  onBack,
}: {
  row: PurchaseRow
  onBack: () => void
}) {
  const {
    getPaymentRequestForSource,
    getEntriesForRequest,
    addPaymentEntry,
    getPurchaseId,
    isAmountVerified,
    verifyPaymentRequestAmount,
    paymentVerifications,
    getCar,
    checkForDuplicates,
    getDraftFingerprint,
    confirmDuplicatePayment,
    getPaymentAuditForEntry,
    isPurchaseRejected,
  } = usePipelineData()

  // Read the latest car from pipeline context so payment data reflects
  // current state, not a snapshot from list-view selection.
  const car: PipelineCar = getCar(row.id) ?? row.car

  // Generic payment module
  const request = getPaymentRequestForSource('PURCHASE_UNIT', car.key)
  const entries: PaymentEntry[] = request
    ? getEntriesForRequest(request.id)
    : []
  const totalPaid = sumPaymentEntries(entries)
  const total = request?.totalAmount ?? row.price
  const derivedStatus = request?.status ?? computePaymentStatus(total, totalPaid)
  const legacy = car.payment
  const legacyPayments = legacy?.payments ?? []
  const legacyPaid = legacyPayments.reduce((s, p) => s + p.amount, 0)
  const legacyCommission = legacy?.commission ?? 0

  const useGeneric = !!request
  const effectiveTotal = useGeneric ? total : row.price
  const effectivePaid = useGeneric ? totalPaid : legacyPaid
  const effectiveRemaining = Math.max(0, effectiveTotal - effectivePaid)

  const reconciliation = useMemo(
    () => request ? reconcileAllocations(request, entries) : null,
    [request, entries],
  )
  const hasAllocations = request ? hasPlannedAllocations(request) : false

  // Verification guard
  const verified = request ? isAmountVerified(request.id) : false
  const verifiedInfo = request ? paymentVerifications[request.id] : undefined
  const needsVerification = !!request && !verified && entries.length === 0

  // ── Toast ──
  const [toast, setToast] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // ── Legacy single-entry state (for requests without planned allocations) ──
  const [legacyAmt, setLegacyAmt] = useState<number | undefined>(undefined)
  const [legacyMethod, setLegacyMethod] = useState('Transfer')
  const [legacyNote, setLegacyNote] = useState('')
  const [legacyCategory, setLegacyCategory] = useState<EntryPaymentCategory>('Lainnya')
  const [legacyAccount, setLegacyAccount] = useState({ bank: car.supplierDetail?.bank ?? '', accountNumber: car.supplierDetail?.accountNumber ?? '', accountHolder: car.supplierDetail?.accountHolder ?? '' })
  const [legacyProof, setLegacyProof] = useState<ProofMeta | null>(null)
  const legacyProofInputRef = useRef<HTMLInputElement>(null)

  // ── Proof modal (for existing entry inspection) ──
  const [proofModal, setProofModal] = useState<PaymentEntry | null>(null)

  // ── Multi-row payment form state ───────────────────────────────────────────
  // One row per AllocationRole. Each row is a separate PaymentEntry so the
  // operator can track Unit and Commission disbursements independently.
  //
  // Initialisation happens on first render (request available or not);
  // if entries already exist, each row pre-fills with the REMAINING amount
  // for that role (planned.amount − alreadyPaidForRole), not the full planned.
  const initialRowState = useMemo<PaymentRowDraft[]>(() => {
    if (!hasAllocations || !request?.allocations) return []
    const paidByRole: Record<string, number> = {}
    for (const entry of entries) {
      for (const a of entry.allocations ?? []) {
        paidByRole[a.role] = (paidByRole[a.role] ?? 0) + a.amount
      }
    }
    return request.allocations
      .filter((a) => a.amount > 0)
      .map((a) => ({
        rowKey: crypto.randomUUID(),
        role: a.role,
        amount: Math.max(0, a.amount - (paidByRole[a.role] ?? 0)),
        method: 'Transfer',
        note: '',
        recipient: a.recipient,
        paymentCategory: a.role === 'COMMISSION' ? 'Komisi' : 'Pembayaran Kendaraan',
        bank: a.bank ?? (a.role === 'VEHICLE_SETTLEMENT' ? car.supplierDetail?.bank ?? '' : ''),
        accountNumber: a.accountNumber ?? (a.role === 'VEHICLE_SETTLEMENT' ? car.supplierDetail?.accountNumber ?? '' : ''),
        accountHolder: a.accountHolder ?? (a.role === 'VEHICLE_SETTLEMENT' ? car.supplierDetail?.accountHolder ?? '' : ''),
        proof: null,
      }))
  }, [hasAllocations, request?.allocations, entries, car.supplierDetail?.bank, car.supplierDetail?.accountNumber, car.supplierDetail?.accountHolder])

  const [rows, setRows] = useState<PaymentRowDraft[]>(initialRowState)
  const [rowProcessing, setRowProcessing] = useState(false)
  const [rowResults, setRowResults] = useState<RowResult[]>([])

  const updateRow = (rowKey: string, patch: Partial<PaymentRowDraft>) => {
    // A changed row must pass proof review again, never commit a cached draft.
    dupRowDrafts.current.delete(rowKey)
    setRowResults(previous => previous.filter(result => result.rowKey !== rowKey))
    if (dupForRowKey === rowKey) handleDupCancel()
    setRows((prev) => prev.map((r) => r.rowKey === rowKey ? { ...r, ...patch } : r))
  }

  const removeRow = (rowKey: string) => {
    dupRowDrafts.current.delete(rowKey)
    setRowResults(previous => previous.filter(result => result.rowKey !== rowKey))
    if (dupForRowKey === rowKey) handleDupCancel()
    setRows((prev) => {
      const target = prev.find((r) => r.rowKey === rowKey)
      if (target?.proof) URL.revokeObjectURL(target.proof.objectUrl)
      return prev.filter((r) => r.rowKey !== rowKey)
    })
  }

  // Role picker state for "Tambah Baris" — operator picks which role to add.
  const [addRole, setAddRole] = useState<AllocationRole | null>(null)

  const addRow = (role: AllocationRole) => {
    if (!request?.allocations) return
    const plannedAlloc = request.allocations.find((a) => a.role === role)
    if (!plannedAlloc || plannedAlloc.amount === 0) return  // zero-commission guard
    // Compute what's already allocated in the form for this role
    const paidInForm = rows
      .filter((r) => r.role === role && !r.committedEntryId)
      .reduce((s, r) => s + (r.amount ?? 0), 0)
    // Also include committed entries for this role
    const committedForRole = (request.allocations?.find((a) => a.role === role)?.amount ?? 0)
      - (reconciliation?.perRole?.find((pr) => pr.role === role)?.remaining ?? 0)
    const remaining = Math.max(0, plannedAlloc.amount - committedForRole - paidInForm)
    setRows((prev) => [...prev, {
      rowKey: crypto.randomUUID(),
      role,
      amount: remaining,
      method: 'Transfer',
      note: '',
      recipient: plannedAlloc.recipient,
      paymentCategory: role === 'COMMISSION' ? 'Komisi' : 'Pembayaran Kendaraan',
      bank: plannedAlloc.bank ?? (role === 'VEHICLE_SETTLEMENT' ? car.supplierDetail?.bank ?? '' : ''),
      accountNumber: plannedAlloc.accountNumber ?? (role === 'VEHICLE_SETTLEMENT' ? car.supplierDetail?.accountNumber ?? '' : ''),
      accountHolder: plannedAlloc.accountHolder ?? (role === 'VEHICLE_SETTLEMENT' ? car.supplierDetail?.accountHolder ?? '' : ''),
      proof: null,
    }])
    setAddRole(null)
  }

  // Live totals: only uncommitted rows count toward the next process cycle
  const uncommittedRows = rows.filter((r) => !r.committedEntryId)
  const totalRowAmount = uncommittedRows.reduce((s, r) => s + (r.amount ?? 0), 0)
  const totalRowRemaining = hasAllocations
    ? Math.max(0, request!.totalAmount - totalPaid)
    : 0

  // ── Sequential multi-row processing ──────────────────────────────────────
  // Each row becomes its own PaymentEntry. Processing is sequential (no
  // Promise.all) because the store does not support batch atomic commits;
  // a mid-sequence failure leaves prior entries committed (no rollback).
  // Rows that already have a committedEntryId are NEVER resubmitted.
  const [paymentReview, setPaymentReview] = useState<{ mode: 'rows' | 'legacy'; fingerprint: string; items: ProofReviewItem[] } | null>(null)
  const reviewConsumed = useRef(false)
  const requireProofReview = (mode: 'rows' | 'legacy', fingerprint: string, items: ProofReviewItem[], reviewed?: string) => {
    if (reviewed === fingerprint) return true
    reviewConsumed.current = false
    if (reviewed) showToast('Isian pembayaran berubah. Periksa kembali sebelum melanjutkan.')
    setPaymentReview({ mode, fingerprint, items })
    return false
  }

  const handleProcessAll = (reviewed?: string) => {
    if (!request) return
    if (needsVerification) {
      showToast('Verifikasi nominal total tagihan terlebih dahulu.')
      return
    }
    // Only process rows that haven't been committed yet
    const pendingRows = rows.filter((r) => !r.committedEntryId)
    if (pendingRows.length === 0) return

    // Pre-flight: total across pending rows must not exceed remaining
    const pendingTotal = pendingRows.reduce((s, r) => s + (r.amount ?? 0), 0)
    if (pendingTotal > totalRowRemaining) {
      showToast(`Total input (${formatRupiah(pendingTotal)}) melebihi sisa tagihan (${formatRupiah(totalRowRemaining)}).`)
      return
    }

    const fingerprint = JSON.stringify([request.id, request.totalAmount, request.allocations, totalRowRemaining, pendingRows])
    if (!requireProofReview('rows', fingerprint, pendingRows.map(row => ({ key: row.rowKey, label: roleLabel(row.role), amount: row.amount ?? 0, recipient: row.recipient.trim() || request.allocations?.find(a => a.role === row.role)?.recipient || '', proof: row.proof, paymentCategory: row.paymentCategory, bank: row.bank, accountNumber: row.accountNumber, accountHolder: row.accountHolder })), reviewed)) return

    setRowProcessing(true)
    const newResults: RowResult[] = []
    const committedUpdates = new Map<string, string>() // rowKey → entryId

    for (const row of pendingRows) {
      const amt = row.amount ?? 0
      if (amt <= 0) {
        newResults.push({ rowKey: row.rowKey, status: 'failed', reason: 'Nominal harus lebih dari 0.', role: row.role })
        continue
      }

      // Build a per-row entry draft (single-role allocation)
      const allocs: EntryAllocation[] = [{
        role: row.role,
        recipient: row.recipient.trim() || (request.allocations?.find((a) => a.role === row.role)?.recipient ?? ''),
        amount: amt,
      }]

      const entryDraft: Omit<PaymentEntry, 'id'> = {
        paymentRequestId: request.id,
        paymentDate: new Date().toISOString(),
        method: row.method,
        amount: amt,
        note: row.note.trim() || undefined,
        allocations: allocs,
        actualRecipient: row.recipient.trim() || undefined,
        paymentCategory: row.paymentCategory,
        bank: row.bank.trim(),
        accountNumber: row.accountNumber.trim(),
        accountHolder: row.accountHolder.trim(),
        ...(row.proof ? { proof: row.proof } : {}),
      }

      // Per-row duplicate preflight (UI-level; store guard is authoritative)
      const dupCheck = checkForDuplicates(request.id, entryDraft)
      if (dupCheck.hasPotentialDuplicate) {
        newResults.push({ rowKey: row.rowKey, status: 'pending-dup', role: row.role })
        dupRowDrafts.current.set(row.rowKey, entryDraft)
        continue
      }

      const result = addPaymentEntry(request.id, entryDraft)
      if (result.ok) {
        newResults.push({ rowKey: row.rowKey, status: 'success', entryId: result.entry.id, amount: amt, role: row.role })
        committedUpdates.set(row.rowKey, result.entry.id)
      } else if (result.failure.reason === 'DUPLICATE_DETECTED') {
        newResults.push({ rowKey: row.rowKey, status: 'pending-dup', role: row.role })
        dupRowDrafts.current.set(row.rowKey, entryDraft)
      } else {
        newResults.push({ rowKey: row.rowKey, status: 'failed', reason: formatFailureReason(result.failure.reason), role: row.role })
      }
    }

    // Mark committed rows in the form state (locks their fields)
    if (committedUpdates.size > 0) {
      setRows((prev) => prev.map((r) => {
        const entryId = committedUpdates.get(r.rowKey)
        return entryId ? { ...r, committedEntryId: entryId } : r
      }))
    }

    // Merge: keep existing results for committed rows, append new results
    setRowResults((prev) => [
      ...prev.filter((r) => !(r as { rowKey: string }).rowKey && (committedUpdates.size === 0)),
      ...newResults,
    ])
    // Simpler: just set the new results (committed rows stay in the form, not in results)
    setRowResults(newResults)
    setRowProcessing(false)
  }

  const handleLegacyPayment = (reviewed?: string) => {
                          if (!request || legacyAmt === undefined || legacyAmt <= 0) return
                          if (needsVerification) { showToast('Verifikasi nominal total tagihan terlebih dahulu.'); return }
                          const fingerprint = JSON.stringify([request.id, request.totalAmount, effectiveRemaining, legacyAmt, legacyMethod, legacyNote, legacyProof, legacyCategory, legacyAccount])
                          if (!requireProofReview('legacy', fingerprint, [{ key: 'legacy', label: 'Pembayaran', amount: legacyAmt, recipient: request.vendor, proof: legacyProof, paymentCategory: legacyCategory, ...legacyAccount }], reviewed)) return
                          const draft: Omit<PaymentEntry, 'id'> = {
                            paymentRequestId: request.id,
                            paymentDate: new Date().toISOString(),
                            method: legacyMethod,
                            paymentCategory: legacyCategory,
                            ...legacyAccount,
                            amount: legacyAmt,
                            note: legacyNote.trim() || undefined,
                            ...(legacyProof ? { proof: legacyProof } : {}),
                          }
                          const dupCheck = checkForDuplicates(request.id, draft)
                          if (dupCheck.hasPotentialDuplicate) {
                            openDupDialog(draft, dupCheck.matches)
                            return
                          }
                          const res = addPaymentEntry(request.id, draft)
                          if (res.ok) {
                            showToast(`Pembayaran ${res.entry.id} dicatat (${formatRupiah(res.entry.amount)}).`)
                            setLegacyAmt(undefined); setLegacyNote(''); setLegacyProof(null)
                          } else if (res.failure.reason === 'DUPLICATE_DETECTED') {
                            openDupDialog(draft, res.failure.matches)
                          } else {
                            showToast(formatFailureReason(res.failure.reason))
                          }
  }

  // Stash for rows that hit the duplicate path — needed to re-open the dialog
  // from the result panel without re-running the whole form.
  const dupRowDrafts = useRef(new Map<string, Omit<PaymentEntry, 'id'>>())
  // Which rowKey triggered the currently-open duplicate dialog (null = legacy path)
  const [dupForRowKey, setDupForRowKey] = useState<string | null>(null)

  const handleConfirmDupForRow = (rowKey: string) => {
    const draft = dupRowDrafts.current.get(rowKey)
    if (!draft || !request) return
    const dupCheck = checkForDuplicates(request.id, draft)
    if (dupCheck.hasPotentialDuplicate) {
      setDupForRowKey(rowKey)
      openDupDialog(draft, dupCheck.matches)
    }
  }

  const handleResetForm = () => {
    for (const r of rows) if (r.proof) URL.revokeObjectURL(r.proof.objectUrl)
    // Reload from latest committed balances — initialRowState already
    // reflects current entry totals via useMemo on [entries]
    setRows(initialRowState)
    setRowResults([])
    dupRowDrafts.current.clear()
  }

  // ── Verification handler ─────────────────────────────────────────────────
  const handleVerify = () => {
    if (!request) return
    verifyPaymentRequestAmount(request.id)
    showToast(`Total nominal ${formatRupiah(request.totalAmount)} terverifikasi.`)
  }

  // ── Duplicate confirmation state (shared with result-panel re-entry) ──
  type DupCheckState = {
    draft: Omit<PaymentEntry, 'id'>
    matches: DuplicatePaymentMatch[]
    reviewedMatches: ReviewedDuplicateMatches
    draftFp: string
  }
  const [dupPending, setDupPending] = useState<DupCheckState | null>(null)
  const [dupReason, setDupReason] = useState('')
  const [dupProcessing, setDupProcessing] = useState(false)
  const [dupCancelMsg, setDupCancelMsg] = useState<string | null>(null)
  const [auditInspect, setAuditInspect] = useState<PaymentOverrideAuditRecord | null>(null)

  const openDupDialog = (
    entryDraft: Omit<PaymentEntry, 'id'>,
    matches: DuplicatePaymentMatch[],
  ) => {
    const reviewedMatches: ReviewedDuplicateMatches = matches.map((m) => ({
      entryId: m.entryId,
      reason: m.reason,
      confidence: m.confidence,
    }))
    const fp = getDraftFingerprint(entryDraft)
    setDupPending({ draft: entryDraft, matches, reviewedMatches, draftFp: fp })
    setDupReason('')
    setDupCancelMsg(null)
  }

  const formatFailureReason = (reason: string): string => {
    const msgs: Record<string, string> = {
      OVERPAYMENT_REQUEST: 'Nominal melebihi sisa tagihan — tidak bisa dicatat.',
      OVERPAYMENT_ALLOCATION: 'Alokasi melebihi batas per peran — tidak bisa dicatat.',
      VERIFICATION_REQUIRED: 'Verifikasi nominal total tagihan terlebih dahulu.',
      REQUEST_NOT_FOUND: 'Payment request tidak ditemukan.',
      REQUEST_LUNAS: 'Payment request sudah lunas — tidak perlu pembayaran tambahan.',
      REQUEST_CANCELLED: 'Pembelian ditolak. Pembayaran baru dihentikan.',
      AMOUNT_INVALID: 'Nominal tidak valid.',
      ALLOCATION_SUM_MISMATCH: 'Jumlah alokasi tidak sama dengan nominal pembayaran.',
      ALLOCATION_REQUIRED: 'Alokasi breakdown wajib diisi untuk pembayaran ini.',
      RECIPIENT_MISSING: 'Penerima wajib diisi.',
      UNKNOWN_ROLE: 'Peran alokasi tidak dikenal.',
      DUPLICATE_ROLE: 'Peran alokasi duplikat.',
      ALLOCATION_AMOUNT_INVALID: 'Nominal alokasi tidak valid (harus ≥ 0 dan finite).',
      DUPLICATE_DETECTED: 'Pembayaran terdeteksi duplikat — gunakan alur konfirmasi duplikat.',
    }
    return msgs[reason] ?? 'Gagal mencatat pembayaran.'
  }

  // ── Duplicate confirmation handlers ─────────────────��──────────────────────
  const handleDupCancel = () => {
    setDupPending(null)
    setDupReason('')
    setDupCancelMsg(null)
    setDupForRowKey(null)
    // Cancelling must NOT create an entry — the row stays in pending-dup state
  }

  const handleDupConfirm = () => {
    if (!request || !dupPending || dupProcessing) return
    if (!dupForRowKey && JSON.stringify([legacyAmt, legacyMethod, legacyNote.trim() || undefined, legacyProof, legacyCategory, legacyAccount]) !== JSON.stringify([dupPending.draft.amount, dupPending.draft.method, dupPending.draft.note, dupPending.draft.proof ?? null, dupPending.draft.paymentCategory, { bank: dupPending.draft.bank ?? '', accountNumber: dupPending.draft.accountNumber ?? '', accountHolder: dupPending.draft.accountHolder ?? '' }])) {
      handleDupCancel()
      handleLegacyPayment()
      return
    }
    if (!dupReason.trim()) {
      setDupCancelMsg('Alasan wajib diisi sebelum konfirmasi.')
      return
    }
    setDupProcessing(true)
    setDupCancelMsg(null)

    const result = confirmDuplicatePayment(request.id, dupPending.draft, {
      justification: dupReason.trim(),
      draftFingerprint: dupPending.draftFp,
      operatorIdentity: undefined,
      reviewedMatches: dupPending.reviewedMatches,
    })

    setDupProcessing(false)

    if (result.ok) {
      showToast(
        `Pembayaran ${result.entry.id} dicatat melalui konfirmasi duplikat (${formatRupiah(result.entry.amount)}).`
      )
      // Mark the triggering row as committed so it is never resubmitted
      const rowKey = dupForRowKey
      if (rowKey) {
        setRows((prev) => prev.map((r) =>
          r.rowKey === rowKey ? { ...r, committedEntryId: result.entry.id } : r
        ))
        setRowResults((prev) => prev.map((res) =>
          res.rowKey === rowKey && res.status === 'pending-dup'
            ? { rowKey, status: 'success' as const, entryId: result.entry.id, amount: result.entry.amount, role: res.role }
            : res
        ))
        dupRowDrafts.current.delete(rowKey)
      }
      setDupPending(null)
      setDupReason('')
      setDupForRowKey(null)
      return
    }

    const f = result.failure
    if (f.reason === 'MATCH_SET_CHANGED') {
      openDupDialog(dupPending.draft, f.currentMatches)
      setDupCancelMsg(
        'Daftar pembayaran duplikat telah berubah — periksa ulang dan konfirmasi lagi.'
      )
      return
    }
    if (f.reason === 'DRAFT_INVALIDATED') {
      setDupPending(null)
      setDupReason('')
      setDupForRowKey(null)
      showToast('Pembayaran telah berubah — periksa ulang dan ulangi konfirmasi.')
      return
    }
    showToast(formatFailureReason((f as { reason: string }).reason))
    // Keep the dialog open so the operator can fix the issue
  }

  // Look up an entry's override audit record (for the history table badge)
  const auditForEntry = (entry: PaymentEntry): PaymentOverrideAuditRecord | undefined =>
    getPaymentAuditForEntry(entry.id)

  // ── Per-row proof file upload ─────────────────────────────────────────────
  const proofInputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map())

  const handleRowProofFile = (rowKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      const previous = rows.find(row => row.rowKey === rowKey)
      if (!previous || previous.committedEntryId) return
      if (previous.proof) URL.revokeObjectURL(previous.proof.objectUrl)
      updateRow(rowKey, { proof: { name: f.name, type: f.type, size: f.size, objectUrl: URL.createObjectURL(f) } })
    }
    e.target.value = ''
  }

  // Status badge helper
  const statusBadge = (st: typeof derivedStatus) => {
    if (st === 'LUNAS')
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (st === 'BELUM LUNAS')
      return 'bg-amber-50 text-amber-700 border-amber-200'
    return 'bg-slate-100 text-slate-600 border-slate-200'
  }

  // Helper to format allocation role labels
  const roleLabel = (role: AllocationRole) =>
    role === 'VEHICLE_SETTLEMENT' ? 'Pembayaran Unit' : 'Pembayaran Komisi'

  if (isPurchaseRejected(car.key)) return <div className="space-y-4">
    <Button variant="secondary" onClick={onBack}>Kembali ke Daftar</Button>
    <h1 className="font-bold">Pembelian ditolak — {row.unit}</h1>
    <p>Pembayaran baru dihentikan. Riwayat pembayaran keluar tetap tersimpan.</p>
    <ul>{entries.map(entry => <li key={entry.id}>{entry.id} · {formatRupiah(entry.amount)} · {entry.paymentDate}{entry.proof && <a className="ml-2 text-primary underline" href={entry.proof.objectUrl} target="_blank" rel="noreferrer">Bukti pembayaran</a>}</li>)}</ul>
    {request && <PurchaseRefundPanel requestId={request.id} />}
  </div>

  return (
    <div>
      {/* Back + header */}
      <div className="mb-5 flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={onBack}>
          &larr; Kembali ke Daftar
        </Button>
        <div>
          <p className="text-[15px] font-bold text-slate-900">
            Proses Pembayaran — {row.unit}
          </p>
          <p className="text-[12px] text-slate-400">
            {car.plate} · Vendor: {request?.vendor ?? car.supplier ?? '—'}
          </p>
        </div>
      </div>

      {toast && (
        <div className="mb-4 flex items-center gap-2 rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {toast}
        </div>
      )}

      {/* ── Transaction ID reference block ───────────────────────────────── */}
      {request && (
        <div className="mb-5 grid grid-cols-1 gap-x-6 gap-y-2 rounded-[10px] border border-line bg-slate-50 p-4 text-[12px] sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-400">ID Pembayaran</p>
            <p className="font-mono font-semibold text-primary">{request.id}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-400">Purchase ID</p>
            <p className="font-mono font-semibold text-slate-800">{getPurchaseId(car.key) ?? '—'}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        {/* ── Left: entry form + history ─────────���──────────────────────── */}
        <div className="space-y-5">
          {/* Legacy submitted info (if present) */}
          {(request || legacy) && (
            <SectionCard title="Informasi Pembelian (Ter-submit)" icon={FileText}>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px] sm:grid-cols-3">
                <div>
                  <span className="text-slate-400">Kategori:</span>{' '}
                  <span className="font-semibold text-slate-800">{purchasePaymentCategory(car)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Jenis:</span>{' '}
                  <span className="font-semibold text-slate-800">{legacy?.paymentType ?? '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Komisi:</span>{' '}
                  <span className="font-semibold text-slate-800">{formatRupiah(legacyCommission)}</span>
                </div>
              </div>
              <div role="region" aria-label="Rekening Penjual" className="mt-4 rounded-[8px] border border-line bg-slate-50 p-3">
                <p className="mb-2 text-[12px] font-semibold text-slate-800">Rekening Penjual</p>
                <div className="grid grid-cols-1 gap-3 text-[12px] sm:grid-cols-3">
                  <div><p className="text-slate-500">Bank</p><p className="mt-1 font-semibold text-slate-800">{car.supplierDetail?.bank || '-'}</p></div>
                  <div><p className="text-slate-500">Nomor Rekening</p><p className="mt-1 select-text break-all font-mono font-semibold text-slate-800">{car.supplierDetail?.accountNumber || '-'}</p></div>
                  <div><p className="text-slate-500">Atas Nama Rekening</p><p className="mt-1 font-semibold text-slate-800">{car.supplierDetail?.accountHolder || '-'}</p></div>
                </div>
                <p className="mt-2 text-[11px] text-slate-500">Sesuai data penjual yang diisi pada Proses Pembelian.</p>
              </div>
            </SectionCard>
          )}

          {/* Add payment entry */}
          <SectionCard index={1} title="Input Pembayaran" icon={CreditCard}>
            {useGeneric ? (
              <>
                {/* Verification banner — shown when totalAmount has not been verified yet */}
                {needsVerification && (
                  <div className="mb-4 rounded-[10px] border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                      <div>
                        <p className="text-[13px] font-semibold text-amber-900">
                          Verifikasi Nominal Total Tagihan
                        </p>
                        <p className="mt-0.5 text-[12px] text-amber-700">
                          Konfirmasi bahwa total tagihan di bawah ini sudah benar sebelum menambah pembayaran pertama.
                        </p>
                        <div className="mt-3 flex items-center justify-between rounded-[8px] bg-white px-3 py-2.5">
                          <div>
                            <p className="text-[10px] font-semibold uppercase text-slate-400">Total Tagihan ({request!.id})</p>
                            <p className="font-mono text-[14px] font-bold text-slate-900">{formatRupiah(request!.totalAmount)}</p>
                          </div>
                          <Button variant="primary" size="sm" onClick={handleVerify}>
                            VERIFIKASI
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Verified badge */}
                {verified && verifiedInfo && (
                  <div className="mb-4 flex items-center gap-2 rounded-[8px] bg-emerald-50 px-3 py-2 text-[12px] text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>
                      Nominal terverifikasi{verifiedInfo.verifiedBy ? ` oleh ${verifiedInfo.verifiedBy}` : ''} — {new Date(verifiedInfo.verifiedAt).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}

                {/* Planned allocation summary (only when request has planned allocations) */}
                {hasAllocations && request!.allocations!.length > 0 && (
                  <div className="mb-4 rounded-[10px] border border-line bg-white p-4">
                    <p className="mb-2 text-[12px] font-semibold text-slate-700">Ringkasan Alokasi Rencana</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px] sm:grid-cols-3">
                      {request!.allocations!.map((alloc) => (
                        <div key={alloc.role}>
                          <p className="text-[10px] font-semibold uppercase text-slate-400">
                            {roleLabel(alloc.role)}
                          </p>
                          <p className="font-semibold text-slate-800">{formatRupiah(alloc.amount)}</p>
                          <p className="text-[11px] text-slate-500">Penerima Rencana: {alloc.recipient}</p>
                          <p className="text-[11px] text-slate-500">Rekening: {alloc.bank || '-'} / {alloc.accountNumber || '-'} / a.n. {alloc.accountHolder || '-'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Multi-row payment form (one row per AllocationRole) */}
                {hasAllocations ? (
                  <>
                    {/* Per-role row cards */}
                    <div className="space-y-3">
                      {rows.map((r) => {
                        const plannedAlloc = request!.allocations!.find((a) => a.role === r.role)
                        const paidForRole = reconciliation?.perRole?.find((pr) => pr.role === r.role)?.paid ?? 0
                        const remainingForRole = plannedAlloc
                          ? Math.max(0, plannedAlloc.amount - paidForRole)
                          : 0
                        const isCommitted = !!r.committedEntryId
                        return (
                          <div
                            key={r.rowKey}
                            className={`rounded-[10px] border p-4 ${
                              isCommitted
                                ? 'border-emerald-200 bg-emerald-50/50'
                                : r.role === 'VEHICLE_SETTLEMENT'
                                  ? 'border-line bg-white'
                                  : 'border-violet-200 bg-violet-50/40'
                            }`}
                          >
                            {/* Row header */}
                            <div className="mb-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`rounded-[4px] px-2 py-0.5 text-[11px] font-bold ${
                                    r.role === 'VEHICLE_SETTLEMENT'
                                      ? 'bg-slate-100 text-slate-700'
                                      : 'bg-violet-100 text-violet-700'
                                  }`}
                                >
                                  {roleLabel(r.role)}
                                </span>
                                {isCommitted && (
                                  <span className="inline-flex items-center gap-1 rounded-[4px] bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {r.committedEntryId}
                                  </span>
                                )}
                              </div>
                              {!isCommitted && rows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeRow(r.rowKey)}
                                  className="inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium text-slate-400 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="h-3 w-3" /> Hapus
                                </button>
                              )}
                            </div>

                            {/* Fields grid — locked when committed */}
                            <div className={`grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4 ${isCommitted ? 'opacity-60' : ''}`}>
                              <Field label="Kategori Pembayaran"><select aria-label="Kategori pembayaran baris" value={r.paymentCategory} disabled={isCommitted} onChange={e => updateRow(r.rowKey, { paymentCategory: e.target.value as EntryPaymentCategory })} className={selectCls}>{ENTRY_PAYMENT_CATEGORIES.map(category => <option key={category}>{category}</option>)}</select></Field>
                              <Field label="Nominal (Rp)">
                                <RupiahInput
                                  value={r.amount}
                                  onChange={(v) => updateRow(r.rowKey, { amount: v })}
                                  placeholder="0"
                                  className={inputCls}
                                  disabled={isCommitted}
                                  ariaLabel={`Nominal ${roleLabel(r.role)}`}
                                />
                              </Field>
                              <Field label="Metode">
                                <select
                                  value={r.method}
                                  onChange={(e) => updateRow(r.rowKey, { method: e.target.value })}
                                  className={selectCls}
                                  disabled={isCommitted}
                                >
                                  <option>Transfer</option>
                                  <option>Tunai</option>
                                  <option>Kartu</option>
                                  <option>Cek</option>
                                </select>
                              </Field>
                              <Field label="Penerima">
                                <input
                                  type="text"
                                  value={r.recipient}
                                  onChange={(e) => updateRow(r.rowKey, { recipient: e.target.value })}
                                  placeholder={plannedAlloc?.recipient ?? 'Penerima…'}
                                  className={inputCls}
                                  disabled={isCommitted}
                                />
                              </Field>
                              <Field label="Catatan">
                                <input
                                  type="text"
                                  value={r.note}
                                  onChange={(e) => updateRow(r.rowKey, { note: e.target.value })}
                                  placeholder="Opsional"
                                  className={inputCls}
                                  disabled={isCommitted}
                                />
                              </Field>
                              <Field label="Bank"><input aria-label={'Bank ' + roleLabel(r.role)} value={r.bank} disabled={isCommitted} onChange={e => updateRow(r.rowKey, { bank: e.target.value })} className={inputCls} placeholder="Nama bank (opsional)" /></Field>
                              <Field label="Nomor Rekening"><input aria-label={'Rekening ' + roleLabel(r.role)} type="text" inputMode="numeric" value={r.accountNumber} disabled={isCommitted} onChange={e => updateRow(r.rowKey, { accountNumber: e.target.value })} className={inputCls} placeholder="Nomor rekening" /></Field>
                              <Field label="Atas Nama Rekening"><input aria-label={'Atas Nama ' + roleLabel(r.role)} value={r.accountHolder} disabled={isCommitted} onChange={e => updateRow(r.rowKey, { accountHolder: e.target.value })} className={inputCls} placeholder="Atas nama rekening" /></Field>
                              {/* Bukti + proof filename */}
                              <div className="col-span-2 flex items-center gap-3 sm:col-span-4">
                                <label
                                  className={`inline-flex items-center gap-1.5 rounded-[8px] border border-dashed px-3 py-2 text-[12px] font-semibold ${
                                    isCommitted
                                      ? 'border-line text-slate-400'
                                      : 'cursor-pointer border-line text-slate-600 hover:border-primary hover:text-primary'
                                  }`}
                                >
                                  <UploadCloud className="h-4 w-4" />
                                  {r.proof ? 'Ganti Bukti' : 'Pilih Bukti'}
                                  <input
                                    ref={(el) => { if (el) proofInputRefs.current.set(r.rowKey, el) }}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,application/pdf"
                                    className="hidden"
                                    disabled={isCommitted}
                                    onChange={(e) => handleRowProofFile(r.rowKey, e)}
                                  />
                                </label>
                                {r.proof && (
                                  <span className="text-[11px] text-emerald-600">{r.proof.name}</span>
                                )}
                              </div>
                            </div>

                            {/* Remaining hint */}
                            {!isCommitted && plannedAlloc && remainingForRole > 0 && (
                              <p className="mt-1.5 text-[10.5px] text-slate-400">
                                Sisa {roleLabel(r.role)}: {formatRupiah(remainingForRole)}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Add row — role picker (allows multiple rows of the same role) */}
                    {request!.allocations && (
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAddRole(addRole ? null : 'VEHICLE_SETTLEMENT')}
                          className={`inline-flex items-center gap-1 rounded-[6px] border px-2.5 py-1 text-[12px] font-semibold transition ${
                            addRole === 'VEHICLE_SETTLEMENT'
                              ? 'border-primary bg-primary text-white'
                              : 'border-line bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Plus className="h-3.5 w-3.5" /> Tambah Kolom Pembayaran
                        </button>
                        {request!.allocations.some((a) => a.role === 'COMMISSION' && a.amount > 0) && (
                          <button
                            type="button"
                            onClick={() => setAddRole(addRole ? null : 'COMMISSION')}
                            className={`inline-flex items-center gap-1 rounded-[6px] border px-2.5 py-1 text-[12px] font-semibold transition ${
                              addRole === 'COMMISSION'
                                ? 'border-violet-500 bg-violet-500 text-white'
                                : 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100'
                            }`}
                          >
                            <Plus className="h-3.5 w-3.5" /> Tambah Kolom Komisi
                          </button>
                        )}
                        {addRole && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => addRow(addRole)}
                          >
                            Tambahkan Kolom
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Live totals */}
                    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[8px] bg-slate-50 px-4 py-3 text-[12px]">
                      <div>
                        <span className="text-slate-500">Total Input: </span>
                        <span className={`font-bold ${totalRowAmount > totalRowRemaining ? 'text-red-600' : 'text-slate-900'}`}>
                          {formatRupiah(totalRowAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Sisa Tagihan: </span>
                        <span className={`font-bold ${totalRowRemaining > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {formatRupiah(totalRowRemaining)}
                        </span>
                      </div>
                      {totalRowAmount > totalRowRemaining && (
                        <div className="flex items-center gap-1.5 text-red-600">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Melampaui sisa tagihan</span>
                        </div>
                      )}
                    </div>

                    {/* Process button */}
                    <div className="mt-4">
                      <Button
                        variant="primary"
                        onClick={() => handleProcessAll()}
                        disabled={
                          derivedStatus === 'LUNAS' ||
                          needsVerification ||
                          rowProcessing ||
                          rows.length === 0 ||
                          totalRowAmount > totalRowRemaining
                        }
                      >
                        {rowProcessing ? 'Memproses…' : 'PROSES PEMBAYARAN'}
                      </Button>
                      {needsVerification && (
                        <span className="ml-3 text-[12px] font-medium text-amber-600">
                          Verifikasi nominal total tagihan terlebih dahulu.
                        </span>
                      )}
                      {derivedStatus === 'LUNAS' && !needsVerification && (
                        <span className="ml-3 text-[12px] font-medium text-emerald-600">
                          Sudah lunas — tidak perlu pembayaran tambahan.
                        </span>
                      )}
                    </div>

                    {/* Result panel after processing */}
                    {rowResults.length > 0 && (() => {
                      const successCount = rowResults.filter((r) => r.status === 'success').length
                      const failedCount = rowResults.filter((r) => r.status === 'failed').length
                      const pendingCount = rowResults.filter((r) => r.status === 'pending-dup').length
                      const hasPartial = successCount > 0 && (failedCount > 0 || pendingCount > 0)
                      return (
                      <div className="mt-5">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-[12px] font-semibold text-slate-700">Hasil Proses</p>
                          {/* Status counts */}
                          <div className="flex gap-3 text-[11px] font-medium">
                            {successCount > 0 && (
                              <span className="text-emerald-600">{successCount} Berhasil</span>
                            )}
                            {failedCount > 0 && (
                              <span className="text-red-600">{failedCount} Gagal</span>
                            )}
                            {pendingCount > 0 && (
                              <span className="text-amber-600">{pendingCount} Menunggu Konfirmasi</span>
                            )}
                          </div>
                        </div>
                        {/* Explicit no-rollback notice on partial success */}
                        {hasPartial && (
                          <div className="mb-2 rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] text-amber-800">
                            <strong>TIDAK ADA ROLLBACK</strong> — baris yang sudah tercatat tetap tersimpan.
                            Baris yang gagal dapat diperbaiki dan diulang.
                          </div>
                        )}
                        <div className="space-y-1.5">
                          {rowResults.map((res) => {
                            const isDup = res.status === 'pending-dup'
                            return (
                            <div
                              key={res.rowKey}
                              className={`flex items-center gap-3 rounded-[8px] border px-3 py-2.5 text-[12px] ${
                                res.status === 'success'
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                  : isDup
                                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                                    : 'border-red-200 bg-red-50 text-red-800'
                              }`}
                            >
                              {res.status === 'success' ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                              ) : isDup ? (
                                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                              ) : (
                                <X className="h-4 w-4 shrink-0 text-red-600" />
                              )}
                              <span className="flex-1">
                                <strong>{roleLabel(res.role)}</strong>
                                {res.status === 'success' && (
                                  <> — dicatat sebagai <span className="font-mono font-medium">{res.entryId}</span> ({formatRupiah(res.amount)})</>
                                )}
                                {res.status === 'failed' && (
                                  <> — {res.reason}</>
                                )}
                                {isDup && (
                                  <> — perlu konfirmasi duplikat</>
                                )}
                              </span>
                              {isDup && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleConfirmDupForRow(res.rowKey)}
                                >
                                  KONFIRMASI
                                </Button>
                              )}
                            </div>
                            )
                          })}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Button variant="secondary" size="sm" onClick={handleResetForm}>
                            Muat Ulang Form
                          </Button>
                          {successCount > 0 && (
                            <span className="text-[11px] text-slate-400">
                              Baris berhasil tidak akan dikirim ulang saat form dimuat ulang.
                            </span>
                          )}
                        </div>
                      </div>
                      )
                    })()}
                  </>
                ) : (
                  /* Legacy: no planned allocations — single-entry form */
                  <>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                      <Field label="Kategori Pembayaran"><select aria-label="Kategori pembayaran baris" value={legacyCategory} onChange={e => setLegacyCategory(e.target.value as EntryPaymentCategory)} className={selectCls}>{ENTRY_PAYMENT_CATEGORIES.map(category => <option key={category}>{category}</option>)}</select></Field>
                      <Field label="Bank"><input value={legacyAccount.bank} onChange={e => setLegacyAccount(previous => ({ ...previous, bank: e.target.value }))} className={inputCls} /></Field>
                      <Field label="Nomor Rekening"><input type="text" inputMode="numeric" value={legacyAccount.accountNumber} onChange={e => setLegacyAccount(previous => ({ ...previous, accountNumber: e.target.value }))} className={inputCls} /></Field>
                      <Field label="Atas Nama Rekening"><input value={legacyAccount.accountHolder} onChange={e => setLegacyAccount(previous => ({ ...previous, accountHolder: e.target.value }))} className={inputCls} /></Field>
                      <Field label="Nominal (Rp)">
                        <RupiahInput
                          value={legacyAmt}
                          onChange={setLegacyAmt}
                          placeholder="0"
                          className={inputCls}
                          ariaLabel="Nominal pembayaran"
                        />
                      </Field>
                      <Field label="Metode">
                        <select value={legacyMethod} onChange={(e) => setLegacyMethod(e.target.value)} className={selectCls}>
                          <option>Transfer</option>
                          <option>Tunai</option>
                          <option>Kartu</option>
                          <option>Cek</option>
                        </select>
                      </Field>
                      <Field label="Catatan">
                        <input
                          type="text"
                          value={legacyNote}
                          onChange={(e) => setLegacyNote(e.target.value)}
                          placeholder="Opsional"
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Bukti">
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[8px] border border-dashed border-line px-3 py-2 text-[12px] font-semibold text-slate-600 hover:border-primary hover:text-primary">
                          <UploadCloud className="h-4 w-4" />
                          {legacyProof ? 'Ganti' : 'Pilih'}
                          <input
                            ref={legacyProofInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (f) {
                                if (legacyProof) URL.revokeObjectURL(legacyProof.objectUrl)
                                setLegacyProof({ name: f.name, type: f.type, size: f.size, objectUrl: URL.createObjectURL(f) })
                              }
                              e.target.value = ''
                            }}
                          />
                        </label>
                      </Field>
                    </div>

                    {legacyProof && (
                      <p className="mt-2 text-[11px] text-emerald-600">File: {legacyProof.name}</p>
                    )}

                    <div className="mt-4">
                      <Button
                        variant="primary"
                        icon={<Plus className="h-4 w-4" />}
                        onClick={() => {
                          handleLegacyPayment()
                        }}
                        disabled={derivedStatus === 'LUNAS' || needsVerification || legacyAmt === undefined || legacyAmt <= 0}
                      >
                        Tambah Pembayaran
                      </Button>
                      {needsVerification && (
                        <span className="ml-3 text-[12px] font-medium text-amber-600">
                          Verifikasi nominal total tagihan terlebih dahulu.
                        </span>
                      )}
                    </div>
                  </>
                )}

                {/* Entry history */}
                {entries.length > 0 && (
                  <div className="mt-5">
                    <p className="mb-2 text-[12px] font-semibold text-slate-700">
                      Riwayat Pembayaran ({entries.length})
                    </p>
                    <div className="overflow-hidden rounded-[8px] border border-line">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b border-line bg-slate-50">
                            <th className="px-3 py-2 text-[10.5px] font-semibold uppercase text-slate-400">ID Transaksi</th>
                            <th className="px-3 py-2 text-[10.5px] font-semibold uppercase text-slate-400">Tanggal</th>
                            <th className="px-3 py-2 text-[10.5px] font-semibold uppercase text-slate-400">Metode</th>
                            <th className="px-3 py-2 text-right text-[10.5px] font-semibold uppercase text-slate-400">Nominal</th>
                            <th className="px-3 py-2 text-[10.5px] font-semibold uppercase text-slate-400">Penerima</th>
                            <th className="px-3 py-2 text-[10.5px] font-semibold uppercase text-slate-400">Alokasi</th>
                            <th className="px-3 py-2 text-[10.5px] font-semibold uppercase text-slate-400">Keterangan</th>
                            <th className="px-3 py-2 text-right text-[10.5px] font-semibold uppercase text-slate-400">Bukti</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entries.map((e) => {
                            const auditRec = auditForEntry(e)
                            return (
                            <tr key={e.id} className="border-b border-line last:border-0 hover:bg-slate-50">
                              <td className="whitespace-nowrap px-3 py-2 font-mono text-[12px] font-medium text-primary">
                                {e.id}
                                {auditRec && (
                                  <button
                                    type="button"
                                    onClick={() => setAuditInspect(auditRec)}
                                    title="Lihat riwayat konfirmasi duplikat"
                                    className="ml-2 inline-flex items-center gap-0.5 rounded-[4px] bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 hover:bg-amber-100"
                                  >
                                    <ShieldCheck className="h-3 w-3" />
                                    KONFIRMASI DUPLIKAT
                                  </button>
                                )}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 text-[12px] text-slate-600">{new Date(e.paymentDate).toLocaleDateString('id-ID')}</td>
                              <td className="px-3 py-2 text-[12px] text-slate-600">{e.method}</td>
                              <td className="whitespace-nowrap px-3 py-2 text-right text-[12px] font-semibold text-slate-800">{formatRupiah(e.amount)}</td>
                              {/* Actual recipient — show "Belum Dicatat" when absent (historical) */}
                              <td className="px-3 py-2 text-[12px]">
                                {e.actualRecipient ? (
                                  <span className="font-medium text-slate-700">{e.actualRecipient}</span>
                                ) : (
                                  <span className="text-slate-400">Belum Dicatat</span>
                                )}
                              </td>
                              {/* Allocation breakdown */}
                              <td className="px-3 py-2 text-[12px]">
                                {e.allocations && e.allocations.length > 0 ? (
                                  <div className="space-y-0.5">
                                    {e.allocations.map((a) => (
                                      <div key={a.role} className="text-[11px] text-slate-600">
                                        {roleLabel(a.role)}: <span className="font-medium">{formatRupiah(a.amount)}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-slate-400">Tanpa Rincian Alokasi</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-[12px] text-slate-500">
                                <p className="font-semibold text-slate-700">Kategori: {e.paymentCategory || 'Belum dicatat'}</p>
                                {(e.accountNumber || e.accountHolder || e.bank) && <p className="break-words">Rekening: {e.bank || '-'} / {e.accountNumber || '-'} / a.n. {e.accountHolder || '-'}</p>}
                                {e.note || '—'}
                                {e.reference && <p className="text-[10.5px] text-slate-400">Ref: {e.reference}</p>}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {e.proof ? (
                                  <button
                                    type="button"
                                    onClick={() => setProofModal(e)}
                                    className="inline-flex items-center gap-1 rounded-[6px] bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                                  >
                                    <Eye className="h-3 w-3" />
                                    LIHAT BUKTI
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-slate-400">TIDAK ADA</span>
                                )}
                              </td>
                            </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Unattributed historical warning */}
                    {reconciliation && reconciliation.unattributedHistorical > 0 && (
                      <div className="mt-3 flex items-start gap-2 rounded-[8px] border border-amber-200 bg-amber-50 p-3 text-[11.5px] text-amber-800">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <div>
                          <p className="font-semibold">Pembayaran historis tanpa rincian alokasi</p>
                          <p>
                            Total {formatRupiah(reconciliation.unattributedHistorical)} dari pembayaran tidak memiliki rincian alokasi.
                            Saldo per-peran mungkin tidak lengkap.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Legacy fallback — no generic request yet */
              <div className="rounded-[10px] border border-blue-200 bg-blue-50 p-4 text-[12.5px] text-blue-800">
                Belum ada PaymentRequest untuk unit ini.
                Buat terlebih dahulu dari halaman Proses Pembelian (submit informasi pembelian).
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── Right sidebar: summary ─────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="rounded-[12px] border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <p className="mb-3 text-[13px] font-semibold text-slate-900">
              Ringkasan Unit
            </p>
            <div className="mb-3 flex items-center gap-3">
              <img
                src={row.image}
                alt=""
                className="h-16 w-24 rounded-[8px] bg-slate-100 object-cover"
              />
              <div>
                <p className="text-[14px] font-bold text-slate-900">{row.unit}</p>
                <p className="font-mono text-[12px] text-slate-500">{row.plate}</p>
              </div>
            </div>

            {/* Status badge */}
            <div className="mb-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1 text-[11px] font-semibold ${statusBadge(derivedStatus)}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    derivedStatus === 'LUNAS'
                      ? 'bg-emerald-500'
                      : derivedStatus === 'BELUM LUNAS'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                  }`}
                />
                {derivedStatus}
              </span>
            </div>

            <div className="space-y-1.5 text-[12px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Harga Awal</span>
                <span className="font-semibold text-slate-600" title="Referensi — dari Leads, tidak terpengaruh negosiasi">{formatLeadPriceRange(car)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Harga Beli Final</span>
                <span className="font-bold text-primary">{formatRupiah(useGeneric ? request!.totalAmount : car.buyPrice)}</span>
              </div>
              {/* Per-role breakdown from reconciliation */}
              {reconciliation?.perRole && reconciliation.perRole.map((r) => (
                <div key={r.role} className="flex justify-between text-[11.5px] text-slate-500">
                  <span>{roleLabel(r.role)} (rencana)</span>
                  <span>{formatRupiah(r.planned)}</span>
                </div>
              ))}
              {reconciliation?.perRole && reconciliation.perRole.map((r) => (
                <div key={`${r.role}-paid`} className="flex justify-between text-[11.5px] text-slate-500">
                  <span className="pl-2">└ Dibayar</span>
                  <span className={r.remaining === 0 ? 'text-emerald-600' : 'text-slate-600'}>{formatRupiah(r.paid)}</span>
                </div>
              ))}
              {legacyCommission > 0 && !reconciliation?.perRole && (
                <div className="flex justify-between text-[11.5px] text-slate-500">
                  <span>Alokasi Komisi (dalam gros)</span>
                  <span>{formatRupiah(legacyCommission)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-1.5">
                <span className="font-semibold text-slate-700">Total Tagihan</span>
                <span className="font-bold text-primary">{formatRupiah(effectiveTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dibayar</span>
                <span className="font-semibold text-emerald-600">
                  {formatRupiah(effectivePaid)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sisa</span>
                <span
                  className={`font-semibold ${effectiveRemaining > 0 ? 'text-red-600' : 'text-emerald-600'}`}
                >
                  {formatRupiah(effectiveRemaining)}
                </span>
              </div>
            </div>
          </div>

          {/* Legacy credit info */}
          {legacy?.creditDetail && (
            <div className="rounded-[12px] border border-blue-200 bg-blue-50 p-4">
              <p className="mb-2 text-[12px] font-semibold text-blue-800">Info Kredit</p>
              <div className="space-y-1 text-[11.5px] text-blue-900">
                <div>
                  <span className="text-blue-600">Leasing:</span>{' '}
                  {legacy.creditDetail.leasing}
                </div>
                <div>
                  <span className="text-blue-600">BPKB:</span>{' '}
                  {legacy.creditDetail.bpkbStatus}
                </div>
                {legacy.creditDetail.paidToCustomer > 0 && (
                  <div>
                    <span className="text-blue-600">Ke Customer:</span>{' '}
                    {formatRupiah(legacy.creditDetail.paidToCustomer)}
                  </div>
                )}
                {legacy.creditDetail.paidToLeasing > 0 && (
                  <div>
                    <span className="text-blue-600">Ke Leasing:</span>{' '}
                    {formatRupiah(legacy.creditDetail.paidToLeasing)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Proof modal ─────────────────────────────────────────────────── */}
      {paymentReview && <PaymentProofReview items={paymentReview.items} onCancel={() => setPaymentReview(null)} onConfirm={() => {
        if (reviewConsumed.current) return
        reviewConsumed.current = true
        const review = paymentReview
        setPaymentReview(null)
        if (review.mode === 'rows') handleProcessAll(review.fingerprint)
        else handleLegacyPayment(review.fingerprint)
      }} />}
      {proofModal?.proof && (() => {
        const p = proofModal.proof!
        const isImage = /^image\/(jpeg|png|webp|jpg)$/i.test(p.type)
        const isPdf = p.type === 'application/pdf'

        return (
          <Modal
            open={!!proofModal?.proof}
            onClose={() => setProofModal(null)}
            title="BUKTI PEMBAYARAN"
            subtitle={`ID: ${proofModal.id}`}
            size="lg"
            footer={
              <Button variant="secondary" onClick={() => setProofModal(null)}>
                TUTUP
              </Button>
            }
          >
            {/* Payment metadata */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-[10px] bg-slate-50 p-4 text-[12px] sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-semibold uppercase text-slate-400">ID Transaksi</p>
                <p className="font-mono font-semibold text-primary">{proofModal.id}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-slate-400">Tanggal</p>
                <p className="font-semibold text-slate-800">
                  {new Date(proofModal.paymentDate).toLocaleDateString('id-ID')}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-slate-400">Metode</p>
                <p className="font-semibold text-slate-800">{proofModal.method}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-slate-400">Nominal</p>
                <p className="font-bold text-slate-900">{formatRupiah(proofModal.amount)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-slate-400">Nama File</p>
                <p className="truncate font-mono text-slate-800" title={p.name}>{p.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-slate-400">Tipe / Ukuran</p>
                <p className="text-slate-600">{p.type || '—'} · {(p.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>

            {proofModal.reference && (
              <p className="mt-3 text-[12px] text-slate-500">
                <span className="font-semibold text-slate-400">Referensi:</span>{' '}
                <span className="font-mono">{proofModal.reference}</span>
              </p>
            )}
            {proofModal.note && (
              <p className="mt-3 text-[12px] text-slate-500">
                <span className="font-semibold text-slate-400">Keterangan:</span>{' '}
                {proofModal.note}
              </p>
            )}

            {/* Preview area */}
            {isImage && (
              <div className="mt-4 overflow-hidden rounded-[10px] border border-line bg-slate-50">
                <img
                  src={p.objectUrl}
                  alt={p.name}
                  className="max-h-[480px] w-full object-contain"
                  style={{ maxWidth: '100%' }}
                />
              </div>
            )}
            {isPdf && (
              <div className="mt-4 overflow-hidden rounded-[10px] border border-line bg-slate-50">
                <iframe
                  src={p.objectUrl}
                  title={p.name}
                  className="h-[420px] w-full"
                />
              </div>
            )}
            {!isImage && !isPdf && (
              <div className="mt-4 rounded-[10px] border border-line bg-slate-50 p-4">
                <p className="text-[12px] text-slate-500">
                  Preview tidak tersedia untuk tipe file ini.
                </p>
                <div className="mt-2 text-[12px]">
                  <p><span className="font-semibold text-slate-400">Nama File:</span> {p.name}</p>
                  <p><span className="font-semibold text-slate-400">Tipe:</span> {p.type || 'unknown'}</p>
                  <p><span className="font-semibold text-slate-400">Ukuran:</span> {(p.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            )}

            {/* Open file button (for PDF / unsupported) */}
            {(!isImage || isPdf) && (
              <div className="mt-4">
                <a
                  href={p.objectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-[8px] border border-line bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <Eye className="h-3.5 w-3.5" />
                  BUKA FILE
                </a>
              </div>
            )}
          </Modal>
        )
      })()}

      {/* ── Duplicate payment confirmation dialog ─────────────────────────── */}
      {dupPending && request && (() => {
        const existingEntries = getEntriesForRequest(request.id)
        const matched = dupPending.matches.map((m) => {
          const entry = existingEntries.find((e) => e.id === m.entryId)
          return { match: m, entry: entry ?? null }
        })
        return (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
            <div
              className="w-full max-w-lg rounded-t-[12px] bg-white p-5 shadow-xl sm:rounded-[12px]"
              role="dialog"
              aria-modal="true"
            >
              {/* Header */}
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-amber-50">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-slate-900">
                    Peringatan: Pembayaran Berpotensi Duplikat
                  </p>
                  <p className="text-[12px] text-slate-500">
                    PaymentRequest {request.id}
                  </p>
                </div>
              </div>

              {/* Re-review banner (Fix #15.1 Part C) */}
              {dupCancelMsg && (
                <div className="mb-3 rounded-[8px] border border-red-200 bg-red-50 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                    <div>
                      <p className="text-[12px] font-semibold text-red-800">{dupCancelMsg}</p>
                      <p className="mt-0.5 text-[11px] text-red-700">
                        Konfirmasi sebelumnya tidak berlaku. Periksa ulang daftar di bawah dan
                        ketik alasan baru untuk melanjutkan.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Matching existing payments */}
              <div className="space-y-2.5">
                <p className="text-[12px] font-semibold text-slate-700">
                  Pembayaran yang cocok:
                </p>
                {matched.map(({ match, entry }, i) => (
                  <div
                    key={i}
                    className={`rounded-[8px] border p-3 text-[12px] ${
                      match.confidence === 'HIGH'
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold ${
                          match.confidence === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {match.confidence === 'HIGH' ? 'SAMA REFERENSI' : 'MIRIP DETAIL'}
                      </span>
                      <span className="font-mono text-[11px] font-medium text-slate-800">
                        {match.entryId}
                      </span>
                    </div>
                    {entry && (
                      <div className="mt-2 space-y-1">
                        <p>
                          <span className="text-slate-500">Tanggal:</span>{' '}
                          <span className="font-medium">
                            {new Date(entry.paymentDate).toLocaleDateString('id-ID')}
                          </span>
                        </p>
                        <p>
                          <span className="text-slate-500">Nominal:</span>{' '}
                          <span className="font-medium">{formatRupiah(entry.amount)}</span>
                        </p>
                        {entry.actualRecipient && (
                          <p>
                            <span className="text-slate-500">Penerima:</span>{' '}
                            <span className="font-medium">{entry.actualRecipient}</span>
                          </p>
                        )}
                        {entry.reference && (
                          <p>
                            <span className="text-slate-500">Referensi:</span>{' '}
                            <span className="font-mono">{entry.reference}</span>
                          </p>
                        )}
                        {match.reason === 'DETAILS_MATCH' && (
                          <p className="text-[11px] text-slate-500">
                            Kecocokan: tanggal + nominal + penerima + metode sama.
                          </p>
                        )}
                        {match.reason === 'REFERENCE_MATCH' && (
                          <p className="text-[11px] text-slate-500">
                            Kecocokan: nomor referensi transfer identik.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Current draft being submitted */}
              <div className="mt-3 rounded-[8px] border border-blue-100 bg-blue-50 p-3 text-[12px]">
                <p className="font-semibold text-blue-800">Pembayaran yang akan dicatat:</p>
                <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 text-blue-800">
                  <p>
                    <span className="text-blue-500">Nominal:</span>{' '}
                    <span className="font-medium">{formatRupiah(dupPending.draft.amount)}</span>
                  </p>
                  <p>
                    <span className="text-blue-500">Metode:</span>{' '}
                    <span className="font-medium">{dupPending.draft.method}</span>
                  </p>
                  {dupPending.draft.actualRecipient && (
                    <p>
                      <span className="text-blue-500">Penerima:</span>{' '}
                      <span className="font-medium">{dupPending.draft.actualRecipient}</span>
                    </p>
                  )}
                  <p className="text-[12px]">Kategori: {dupPending.draft.paymentCategory || 'Belum dicatat'}</p>
                  {(dupPending.draft.bank || dupPending.draft.accountNumber || dupPending.draft.accountHolder) && <p className="break-words text-[12px]">Rekening: {dupPending.draft.bank || '-'} / {dupPending.draft.accountNumber || '-'} / a.n. {dupPending.draft.accountHolder || '-'}</p>}
                  {dupPending.draft.reference && (
                    <p>
                      <span className="text-blue-500">Referensi:</span>{' '}
                      <span className="font-mono">{dupPending.draft.reference}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Reason input (mandatory) */}
              <div className="mt-4">
                <label className="mb-1 block text-[12px] font-semibold text-slate-700">
                  Alasan Lanjut Mencatat <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={dupReason}
                  onChange={(e) => setDupReason(e.target.value)}
                  rows={2}
                  placeholder="Jelaskan mengapa pembayaran ini adalah transaksi terpisah yang sah…"
                  className="w-full rounded-[8px] border border-line bg-white px-3 py-2 text-[12px] focus:border-primary focus:outline-none"
                />
                {dupCancelMsg && (
                  <p className="mt-1 text-[11px] font-medium text-red-600">{dupCancelMsg}</p>
                )}
              </div>

              {/* Operator notice */}
              <p className="mt-3 text-[11px] text-slate-400">
                Identitas operator: <span className="font-medium">TIDAK TERSEDIA</span> —
                pencatatan audit akan dicatat sebagai operator tidak dikenal (V1).
              </p>

              {/* Actions */}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button variant="secondary" size="sm" onClick={handleDupCancel} disabled={dupProcessing}>
                  <X className="h-4 w-4" />
                  Batal
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDupConfirm}
                  disabled={dupProcessing || !dupReason.trim()}
                >
                  {dupProcessing ? 'Memproses…' : 'KONFIRMASI & CATAT PEMBAYARAN'}
                </Button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Audit inspection modal ─────────────────────────────────────────── */}
      {auditInspect && (
        <Modal
          open={!!auditInspect}
          onClose={() => setAuditInspect(null)}
          title="RIWAYAT KONFIRMASI DUPLIKAT"
          subtitle={`Entry: ${auditInspect.newEntryId}`}
          size="md"
          footer={
            <Button variant="secondary" onClick={() => setAuditInspect(null)}>
              TUTUP
            </Button>
          }
        >
          <div className="space-y-3 text-[12px]">
            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-400">Tipe Konfirmasi</p>
              <p className="font-mono font-semibold text-amber-700">{auditInspect.type}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-400">Payment Request</p>
              <p className="font-mono text-slate-800">{auditInspect.paymentRequestId}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-400">
                Entry yang Dipakai sebagai Referensi
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {auditInspect.matchedEntryIds.map((id) => (
                  <span
                    key={id}
                    className="rounded-[4px] bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700"
                  >
                    {id}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-400">Alasan Kecocokan</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {auditInspect.reasons.map((r, i) => (
                  <span
                    key={i}
                    className="rounded-[4px] bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800"
                  >
                    {r === 'REFERENCE_MATCH' ? 'SAMA REFERENSI' : 'MIRIP DETAIL'}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-400">Operator</p>
              <p className="text-slate-600">
                {auditInspect.operatorIdentity === 'UNAVAILABLE'
                  ? 'TIDAK TERSEDIA (V1 — tidak ada context identitas)'
                  : auditInspect.operatorIdentity}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-400">Waktu Konfirmasi</p>
              <p className="text-slate-600">
                {new Date(auditInspect.confirmedAt).toLocaleString('id-ID')}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-400">Justifikasi Operator</p>
              <p className="mt-1 rounded-[8px] bg-slate-50 p-3 text-slate-700">
                {auditInspect.justification}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
