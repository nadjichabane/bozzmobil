/**
 * Generic company payment module.
 * V1: PURCHASE_UNIT only.
 * Future sourceTypes: MAINTENANCE, OFFICE_EXPENSE, OTHER.
 *
 * The payment core does NOT require vehicle-specific fields.
 * Vehicle info is resolved from the source via sourceId.
 */

// ── Source types (V1: PURCHASE_UNIT only) ────────────────────────────────────
export type PaymentSourceType =
  | 'PURCHASE_UNIT'
  // Future:
  // | 'MAINTENANCE'
  // | 'OFFICE_EXPENSE'
  // | 'OTHER'

export const PAYMENT_SOURCE_TYPES: { value: PaymentSourceType; label: string; enabled: boolean }[] = [
  { value: 'PURCHASE_UNIT', label: 'PEMBELIAN UNIT', enabled: true },
  // Future modules — listed for filtering structure, disabled for V1:
  { value: 'MAINTENANCE' as PaymentSourceType, label: 'MAINTENANCE', enabled: false },
  { value: 'OFFICE_EXPENSE' as PaymentSourceType, label: 'OPERASIONAL / KANTOR', enabled: false },
  { value: 'OTHER' as PaymentSourceType, label: 'LAINNYA', enabled: false },
]

// ── Payment status (derived, never manually set) ─────────────────��───────────
export type PaymentStatus = 'BELUM DIBAYAR' | 'BELUM LUNAS' | 'LUNAS'

// ── Amount-verification record (pre-first-entry guard) ────────────────────────
// Recorded once per PaymentRequest. verifiedAt is always captured.
// verifiedBy is optional — only set when a reliable user identity exists in context.
export type PaymentRequestVerification = {
  requestId: string
  verifiedAt: string        // ISO
  verifiedBy?: string       // omit when no user identity is available
}

// ── Payment allocation (planned internal breakdown of totalAmount) ─────────
// Describes how the gross purchase amount is distributed internally.
// NOT actual disbursement records — those live in PaymentEntry.
// Allocations are optional: historical requests created before this field
// exists have no allocations and remain fully valid.

export type AllocationRole = 'VEHICLE_SETTLEMENT' | 'COMMISSION'

// Administrative category; independent from financial allocation role/source.
export const ENTRY_PAYMENT_CATEGORIES = ['Pembayaran Kendaraan', 'Komisi', 'Maintenance', 'Lainnya'] as const
export type EntryPaymentCategory = typeof ENTRY_PAYMENT_CATEGORIES[number]

export type PaymentAllocation = {
  bank?: string
  accountNumber?: string
  accountHolder?: string
  role: AllocationRole
  /** Nominal alokasi. Harus >= 0. */
  amount: number
  /** Nama atau referensi penerima (broker, supplier, PIC internal, dll.) */
  recipient: string
}

/**
 * Validate a PaymentRequest allocation set before creation.
 *
 * Invariants (checked in order):
 * 1. Every allocation amount is finite and >= 0.
 * 2. The sum of all allocation amounts equals totalAmount exactly.
 * 3. No two allocations have the same role (at most one per role).
 * 4. Recipient strings are non-empty.
 *
 * Returns a human-readable error string, or null when the set is valid.
 * An empty/undefined allocation set is valid (historical requests).
 */
export function validatePaymentAllocations(
  allocations: PaymentAllocation[] | undefined,
  totalAmount: number,
): string | null {
  if (!allocations || allocations.length === 0) return null
  // Invariant 3: no duplicate roles
  const seenRoles = new Set<string>()
  for (const a of allocations) {
    if (seenRoles.has(a.role)) {
      return `Peran alokasi duplikat: ${a.role}`
    }
    seenRoles.add(a.role)
    // Invariant 1: finite and non-negative
    if (!Number.isFinite(a.amount) || a.amount < 0) {
      return `Nominal alokasi tidak valid untuk peran ${a.role}`
    }
    // Invariant 4: recipient must be non-empty
    if (!a.recipient.trim()) {
      return `Penerima alokasi wajib diisi untuk peran ${a.role}`
    }
  }
  // Invariant 2: sum must equal totalAmount
  const sum = allocations.reduce((s, a) => s + a.amount, 0)
  if (sum !== totalAmount) {
    return `Jumlah alokasi (${sum}) tidak sama dengan total tagihan (${totalAmount})`
  }
  return null
}

// ── PaymentRequest ─────────────────────────────────────────────────────────────
export type PaymentRequest = {
  id: string                // e.g. "PAY-2026-001"
  sourceType: PaymentSourceType
  sourceId: string          // e.g. carKey for PURCHASE_UNIT
  title: string             // e.g. "Honda Civic - B 9008 DM"
  vendor: string            // supplier name
  /** FK → Supplier.id (master supplier di CRM). Snapshot saat request dibuat — tidak berubah saat master supplier diedit. */
  supplierId?: string
  vendorType?: 'Perorangan' | 'Supplier'
  /** Gross vehicle purchase amount. Commission is INCLUDED in this total, not added on top. */
  totalAmount: number
  /**
   * Planned internal allocation of totalAmount.
   * - Optional: requests created before this field existed have no allocations.
   * - Invariant: sum(allocations.amount) === totalAmount (enforced at creation).
   * - Does NOT represent actual disbursement — see PaymentEntry for actual payments.
   */
  allocations?: PaymentAllocation[]
  createdAt: string         // ISO
  dueDate?: string          // optional due date
  status: PaymentStatus     // derived from entries
}

// ── Payment proof metadata (per PaymentEntry) ─────────────────────────────
// proof belongs to PaymentEntry, NOT to PaymentRequest / PipelineCar.
// objectUrl is a temporary browser object URL (in-memory prototype only).
export type ProofMeta = {
  name: string        // e.g. "bukti-transfer-001.jpg"
  type: string        // e.g. "image/jpeg", "application/pdf"
  size: number        // bytes
  objectUrl: string   // URL.createObjectURL(file) — revoke when replaced/deleted
}

// ── Per-entry allocation (actual disbursement split) ─────────────────────────
// When a PaymentEntry is created, the disbursement can be split across
// allocation roles. Each entry may carry an optional allocations array.
// The sum of allocations.amount must equal the entry.amount.
// Historical entries without allocations remain fully valid.

export type EntryAllocation = {
  role: AllocationRole
  /**
   * Planned recipient reference from the PaymentRequest's allocation.
   * This is the RECIPIENT INTENDED when the payment request was planned,
   * NOT the proof of who actually received the disbursement.
   * The actual recipient of the disbursement is PaymentEntry.actualRecipient.
   * This field is preserved for compatibility and to show the planned
   * recipient alongside actual payments. UI must label it as "Penerima
   * Rencana" (planned), not "Penerima Aktual" (actual).
   */
  recipient: string
  /** Portion of the entry.amount allocated to this role. Must be >= 0. */
  amount: number
}

// ── Entry validation failure (discriminated union) ───────────────────────────
export type EntryValidationFailure =
  | { reason: 'REQUEST_CANCELLED' }
  | { reason: 'REQUEST_NOT_FOUND' }
  | { reason: 'AMOUNT_INVALID' }
  | { reason: 'VERIFICATION_REQUIRED' }
  | { reason: 'REQUEST_LUNAS' }
  | { reason: 'OVERPAYMENT_REQUEST'; overBy: number }
  | { reason: 'ALLOCATION_SUM_MISMATCH'; entrySum: number; entryAmount: number }
  | { reason: 'OVERPAYMENT_ALLOCATION'; role: AllocationRole; overBy: number }
  | { reason: 'ALLOCATION_REQUIRED' }
  | { reason: 'RECIPIENT_MISSING' }
  | { reason: 'UNKNOWN_ROLE'; role: string }
  | { reason: 'DUPLICATE_ROLE'; role: AllocationRole }
  | { reason: 'ALLOCATION_AMOUNT_INVALID'; role: AllocationRole; amount: number }
  /**
   * The draft matches one or more committed entries. No entry was created and
   * no balances changed. The operator must review the matches and explicitly
   * confirm the override via confirmDuplicatePayment.
   */
  | { reason: 'DUPLICATE_DETECTED'; matches: DuplicatePaymentMatch[] }

// ── Entry add result (truthful return from the synchronous transaction) ──────
export type EntryAddResult =
  | { ok: true; entry: PaymentEntry; status: PaymentStatus; totalPaid: number }
  | { ok: false; failure: EntryValidationFailure }

// ── PaymentEntry ───────────────────────────────────────────────────────────────
export type PaymentEntry = {
  paymentCategory?: EntryPaymentCategory
  bank?: string
  accountNumber?: string
  accountHolder?: string
  id: string                // e.g. "PMT-2026-0001"
  paymentRequestId: string  // FK → PaymentRequest.id
  paymentDate: string       // ISO
  method: string            // 'Transfer' | 'Tunai' | 'Kartu' | etc.
  amount: number
  sourceAccount?: string
  reference?: string
  note?: string
  proof?: ProofMeta         // per-entry proof (independent of other entries)
  /**
   * Actual disbursement split across allocation roles.
   * - Optional: historical entries have no allocations.
   * - Invariant: when present, sum(allocations[].amount) === this.amount.
   * - When request.allocations exists, per-role totals across all entries
   *   must not exceed the planned allocation for that role.
   */
  allocations?: EntryAllocation[]
  /**
   * Actual recipient(s) of this disbursement.
   * - Required for new entries created after Phase 1B-2C.1.
   * - Optional for historical entries created before this field existed.
   */
  actualRecipient?: string
}

// ── Duplicate payment detection ───────────────────────────────────────────────
// Pure, deterministic helpers. No React, no PaymentStore mutation.

/**
 * Normalize a string for comparison: collapse all whitespace runs to a single
 * space, trim, lowercase. Blank strings normalize to "".
 */
function normalizeForCompare(s: string | undefined): string {
  if (!s) return ''
  return s.replace(/\s+/g, ' ').trim().toLowerCase()
}

export type DuplicatePaymentMatch = {
  /** The existing PaymentEntry that matches the draft. */
  entryId: string
  reason: 'REFERENCE_MATCH' | 'DETAILS_MATCH'
  confidence: 'HIGH' | 'POSSIBLE'
}

export type DuplicatePaymentCheck = {
  hasPotentialDuplicate: boolean
  matches: DuplicatePaymentMatch[]
}

/**
 * Exact-match snapshot binding (Fix #15.1, Part A).
 *
 * When the operator reviews the duplicate warning, the UI captures the exact
 * set of matches displayed. This snapshot is passed back at commit time and
 * the store recomputes the matches against the current committed entries.
 * If the recomputed set differs from the reviewed set — a match was added,
 * removed, or its reason changed — the confirmation is invalid and the
 * operator must re-review.
 *
 * Comparison is deterministic and order-independent: two snapshots are equal
 * when they contain the same (entryId, reason) pairs, each exactly once.
 */
export type ReviewedDuplicateMatches = Array<{
  entryId: string
  reason: 'REFERENCE_MATCH' | 'DETAILS_MATCH'
  confidence: 'HIGH' | 'POSSIBLE'
}>

/**
 * Canonical key for one match. entryId is globally unique (PMT sequence),
 * so (entryId, reason) is a complete identity. Confidence is derived from
 * reason and therefore redundant as a key component.
 */
export function duplicateMatchKey(m: { entryId: string; reason: 'REFERENCE_MATCH' | 'DETAILS_MATCH' }): string {
  return `${m.entryId}::${m.reason}`
}

/**
 * Order-independent snapshot equality. Two snapshots match when they
 * contain the same keys with the same multiplicities.
 */
export function areDuplicateSnapshotsEqual(
  a: ReviewedDuplicateMatches,
  b: ReviewedDuplicateMatches,
): boolean {
  if (a.length !== b.length) return false
  const count = (xs: ReviewedDuplicateMatches) => {
    const m = new Map<string, number>()
    for (const x of xs) {
      const k = duplicateMatchKey(x)
      m.set(k, (m.get(k) ?? 0) + 1)
    }
    return m
  }
  const ca = count(a)
  const cb = count(b)
  for (const [k, n] of ca) {
    if ((cb.get(k) ?? 0) !== n) return false
  }
  return true
}

/**
 * Detect potential duplicate payments for a draft entry against the
 * already-committed entries of the SAME PaymentRequest.
 *
 * Rules:
 * D1 — Matching transfer reference (both non-empty after normalization):
 *      HIGH-confidence REFERENCE_MATCH. Blank references never match.
 * D2 — Matching payment details (payment date + amount + actualRecipient
 *      + method all match): POSSIBLE DETAILS_MATCH.
 * D3 — Same amount alone is NEVER flagged.
 * D4 — Comparison is scoped to entries of the given requestId only.
 * D5 — Historical entries with missing fields: a field that is absent on the
 *      existing entry (undefined / empty after normalization) is treated as
 *      "cannot match" for that field. The draft's value is irrelevant for the
 *      match test when the existing value is absent.
 */
export function detectDuplicatePayments(
  draft: Omit<PaymentEntry, 'id'>,
  existingEntries: PaymentEntry[],
  requestId: string,
): DuplicatePaymentCheck {
  const check = detectDuplicatePaymentsCore(draft, existingEntries, requestId)
  // Deterministic ordering: sort by match key so snapshot comparison and
  // audit records are stable regardless of entry-array order.
  check.matches.sort((a, b) => duplicateMatchKey(a) < duplicateMatchKey(b) ? -1 : 1)
  return check
}

function detectDuplicatePaymentsCore(
  draft: Omit<PaymentEntry, 'id'>,
  existingEntries: PaymentEntry[],
  requestId: string,
): DuplicatePaymentCheck {
  const matches: DuplicatePaymentMatch[] = []

  // D4: scope — only entries of the same requestId
  const scoped = existingEntries.filter((e) => e.paymentRequestId === requestId)

  const draftRef = normalizeForCompare(draft.reference)
  const draftRecipient = normalizeForCompare(draft.actualRecipient)
  const draftDate = draft.paymentDate.slice(0, 10) // date portion only (YYYY-MM-DD)
  const draftMethod = draft.method
  const draftAmount = draft.amount

  for (const entry of scoped) {
    const entryRef = normalizeForCompare(entry.reference)
    const entryRecipient = normalizeForCompare(entry.actualRecipient)
    const entryDate = entry.paymentDate.slice(0, 10)

    // Rule D1: matching non-empty transfer reference → HIGH-confidence
    if (draftRef !== '' && entryRef !== '' && draftRef === entryRef) {
      matches.push({ entryId: entry.id, reason: 'REFERENCE_MATCH', confidence: 'HIGH' })
      continue // don't double-flag the same entry
    }

    // Rule D2: matching details — ALL four fields must match AND the
    // existing entry must actually have the field recorded (non-empty).
    // D5: if the existing entry lacks a field, it cannot satisfy the match.
    const refDetailsMatch =
      entryDate === draftDate &&
      entry.amount === draftAmount &&
      entryRecipient !== '' && entryRecipient === draftRecipient &&
      entry.method === draftMethod

    if (refDetailsMatch) {
      matches.push({ entryId: entry.id, reason: 'DETAILS_MATCH', confidence: 'POSSIBLE' })
    }
    // D3: same amount alone does NOT trigger a warning — handled above.
  }

  return { hasPotentialDuplicate: matches.length > 0, matches }
}

// ── Payment override audit trail ──────────────────────────────────────────────
// In-memory, owned by PaymentStore. Reset with store.reset().
// NOT durable across browser refresh or application restart.

export type PaymentOverrideAuditRecord = {
  /** Which confirmation type was exercised. */
  type: 'DUPLICATE_PAYMENT_OVERRIDE'
  /** The newly created PaymentEntry. */
  newEntryId: string
  /** The PaymentRequest the entry belongs to. */
  paymentRequestId: string
  /**
   * The exact duplicate matches the operator reviewed and confirmed
   * (Fix #15.1, Part A). Stored as the reviewed snapshot, not merely a
   * list of entry IDs — each match carries its reason and confidence.
   */
  reviewedMatches: ReviewedDuplicateMatches
  /** Existing PaymentEntry IDs that the draft matched. */
  matchedEntryIds: string[]
  /** The matching reasons reported at confirmation time. */
  reasons: Array<'REFERENCE_MATCH' | 'DETAILS_MATCH'>
  /**
   * Operator identity, when reliably available from context.
   * In the current V1 prototype no reliable operator identity exists, so this
   * is recorded as "unavailable" — the field is always present but may hold
   * the sentinel string "UNAVAILABLE" when no identity is provided.
   */
  operatorIdentity: string
  /** ISO timestamp of the operator's confirmation. */
  confirmedAt: string
  /** The operator's written justification for overriding the warning. */
  justification: string
  /** The draft payment that was confirmed (snapshot at time of commit). */
  confirmedDraft: Omit<PaymentEntry, 'id'>
}

// ── PaymentStore (synchronous in-memory transaction) ───────────────────────────
// Plain synchronous transaction group. No React dependencies —
// can be swapped for a Supabase-backed adapter later without changing
// the transaction function bodies.

export type PaymentStoreInput = {
  sourceType: PaymentSourceType
  sourceId: string
  title: string
  vendor: string
  totalAmount: number
  dueDate?: string
  supplierId?: string
  vendorType?: 'Perorangan' | 'Supplier'
  allocations?: PaymentAllocation[]
}

export type PaymentStore = {
  /** Authoritative arrays (synchronous read-your-writes). */
  requests: PaymentRequest[]
  entries: PaymentEntry[]
  verifications: Record<string, PaymentRequestVerification>
  paySeq: number
  pmtSeq: number
  /**
   * Audit records for payments that required an override to commit.
   * In-memory only — lost on browser refresh. Committed atomically with
   * the PaymentEntry inside confirmDuplicatePayment.
   */
  audit: PaymentOverrideAuditRecord[]
  /**
   * Create a PaymentRequest. Synchronous. Writes to the store on success.
   * Returns the created request, or null if a duplicate or allocation
   * validation error is detected.
   */
  createRequest(input: PaymentStoreInput): PaymentRequest | null
  /**
   * Add a PaymentEntry. Synchronous. All guards run against the store's
   * own authoritative arrays (not React state). On rejection, nothing is
   * mutated. On acceptance, the entry is appended, the request status is
   * updated, and the store's pmtSeq is incremented.
   */
  addEntry(
    requestId: string,
    draft: Omit<PaymentEntry, 'id'>,
  ): EntryAddResult
  /**
   * Run duplicate detection for a draft against the latest committed entries.
   * Pure read-only — returns the check without mutating the store.
   */
  checkForDuplicates(
    requestId: string,
    draft: Omit<PaymentEntry, 'id'>,
  ): DuplicatePaymentCheck
  /**
   * Atomically confirm a duplicate-override payment.
   *
   * Performs a full revalidation against the store's current state:
   *   1. request still exists
   *   2. all financial guards still pass (amount, overpayment, allocations)
   *   3. draftFingerprint must match the current draft (binding to what
   *      the operator actually reviewed)
   *   4. duplicate matches are recomputed with the latest entries
   *   5. the recomputed matches must equal the operator-reviewed snapshot
   *      exactly (same entryId + reason, order-independent). A changed
   *      match set (new, removed, or reclassified match) invalidates the
   *      confirmation → MATCH_SET_CHANGED.
   *   6. a new PaymentEntry is created and an audit record is committed
   *      atomically — the audit record stores the reviewed snapshot.
   *
   * If any revalidation fails, NOTHING is committed — the store is unchanged,
   * no entry, no audit record, no balance mutation.
   *
   * @param requestId  – PaymentRequest the draft belongs to
   * @param draft      – the payment draft the operator confirmed
   * @param options.justification – non-empty operator justification (required)
   * @param options.operatorIdentity – operator label, or "UNAVAILABLE" when no
   *                                  reliable identity exists in context
   * @param options.draftFingerprint – a hash/identifier of the draft that was
   *                                   shown to the operator (exact binding)
   * @param options.reviewedMatches – the exact duplicate matches shown to the
   *                                  operator when they confirmed. Must match
   *                                  the store's current match set or the
   *                                  commit is rejected with MATCH_SET_CHANGED.
   */
  confirmDuplicatePayment(
    requestId: string,
    draft: Omit<PaymentEntry, 'id'>,
    options: {
      justification: string
      operatorIdentity?: string
      draftFingerprint: string
      reviewedMatches: ReviewedDuplicateMatches
    },
  ):
    | { ok: true; entry: PaymentEntry; audit: PaymentOverrideAuditRecord }
    | {
        ok: false
        failure:
          | EntryValidationFailure
          | { reason: 'JUSTIFICATION_EMPTY' }
          | { reason: 'DRAFT_INVALIDATED'; currentFingerprint: string }
          | { reason: 'MATCH_SET_CHANGED'; currentMatches: DuplicatePaymentMatch[] }
      }
  /**
   * Compute a stable fingerprint for a payment draft. Used for exact-draft
   * binding: the fingerprint shown to the operator must match the fingerprint
   * of the draft at commit time, otherwise the confirmation is invalidated.
   */
  draftFingerprint(draft: Omit<PaymentEntry, 'id'>): string
  /**
   * Record that totalAmount was verified by admin. Idempotent.
   * Returns the existing or newly created verification record, or null
   * if the request does not exist.
   */
  verify(requestId: string, verifiedBy?: string): PaymentRequestVerification | null
  /** Check whether a PaymentRequest exists for sourceType + sourceId. */
  hasRequest(sourceType: PaymentSourceType, sourceId: string): boolean
  /** Retrieve a PaymentRequest by sourceType + sourceId. */
  getRequest(sourceType: PaymentSourceType, sourceId: string): PaymentRequest | undefined
  /** Retrieve all PaymentEntries for a given PaymentRequest. */
  getEntries(requestId: string): PaymentEntry[]
  /** Look up the audit record linked to a PaymentEntry (if any). */
  getAuditForEntry(entryId: string): PaymentOverrideAuditRecord | undefined
  /** Reset the store to a clean initial state. */
  reset(): void
}

/**
 * Factory: create a mutable in-memory PaymentStore.
 * The returned object is intentionally mutable — PipelineContext holds it
 * in a useRef and relies on its synchronous read-your-writes semantics.
 */
export function createPaymentStore(initial?: Pick<PaymentStore, 'requests' | 'entries' | 'verifications' | 'audit' | 'paySeq' | 'pmtSeq'>): PaymentStore {
  let requests: PaymentRequest[] = [...(initial?.requests ?? [])]
  let entries: PaymentEntry[] = [...(initial?.entries ?? [])]
  let verifications: Record<string, PaymentRequestVerification> = { ...(initial?.verifications ?? {}) }
  let paySeq = initial?.paySeq ?? 0
  let pmtSeq = initial?.pmtSeq ?? 0

  const store: PaymentStore = {
    // Expose mutable arrays via getters so external code sees live state
    // (the `requests`/`entries` fields on the type are re-assigned internally
    //  when arrays are mutated — in practice we mutate in place for entries,
    //  and reassign for requests to keep React reference changes visible).
    get requests() { return _requests },
    get entries() { return _entries },
    get verifications() { return _verifications },
    get paySeq() { return paySeq },
    get pmtSeq() { return pmtSeq },
    get audit() { return _audit },

    createRequest(input) {
      // Prevent duplicate active PaymentRequest for same source
      if (store.hasRequest(input.sourceType, input.sourceId)) return null
      // Validate allocations before creation
      const allocError = validatePaymentAllocations(input.allocations, input.totalAmount)
      if (allocError) return null
      paySeq += 1
      const id = `PAY-${new Date().getFullYear()}-${String(paySeq).padStart(3, '0')}`
      const request: PaymentRequest = {
        id,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        title: input.title,
        vendor: input.vendor,
        totalAmount: input.totalAmount,
        createdAt: new Date().toISOString(),
        ...(input.dueDate ? { dueDate: input.dueDate } : {}),
        ...(input.supplierId ? { supplierId: input.supplierId } : {}),
        ...(input.vendorType ? { vendorType: input.vendorType } : {}),
        ...(input.allocations && input.allocations.length > 0
          ? { allocations: input.allocations }
          : {}),
        status: 'BELUM DIBAYAR',
      }
      _requests = [..._requests, request]
      return request
    },

    addEntry(requestId, draft) {
      const request = _requests.find((r) => r.id === requestId)
      if (!request) return { ok: false, failure: { reason: 'REQUEST_NOT_FOUND' } }

      // Guard: request must not already be LUNAS
      const existing = _entries.filter((e) => e.paymentRequestId === requestId)
      if (existing.length > 0 && request.status === 'LUNAS') {
        return { ok: false, failure: { reason: 'REQUEST_LUNAS' } }
      }

      // Guard: amount must be positive and finite
      if (!(draft.amount > 0) || !Number.isFinite(draft.amount)) {
        return { ok: false, failure: { reason: 'AMOUNT_INVALID' } }
      }

      // Guard: pre-first-entry verification (reads live store, not React state)
      if (isEntryBlockedByVerification(existing.length, requestId in _verifications)) {
        return { ok: false, failure: { reason: 'VERIFICATION_REQUIRED' } }
      }

      // Guard: request-level overpayment (reads live committed entries)
      const totalPaid = sumPaymentEntries(existing)
      if (totalPaid + draft.amount > request.totalAmount) {
        return {
          ok: false,
          failure: {
            reason: 'OVERPAYMENT_REQUEST',
            overBy: totalPaid + draft.amount - request.totalAmount,
          },
        }
      }

      // Guard: per-allocation validation (if draft.allocations present)
      if (draft.allocations && draft.allocations.length > 0) {
        // Invariant 1: allocation sum must equal entry.amount
        const allocSum = draft.allocations.reduce((s, a) => s + a.amount, 0)
        if (allocSum !== draft.amount) {
          return {
            ok: false,
            failure: {
              reason: 'ALLOCATION_SUM_MISMATCH',
              entrySum: allocSum,
              entryAmount: draft.amount,
            },
          }
        }
        // Invariant 2: per-role running total must not exceed planned allocation
        if (request.allocations) {
          for (const alloc of draft.allocations) {
            const roleAlloc = request.allocations.find((a) => a.role === alloc.role)
            if (!roleAlloc) continue // role not in planned allocations → skip
            const existingForRole = existing
              .flatMap((e) => e.allocations ?? [])
              .filter((a) => a.role === alloc.role)
              .reduce((s, a) => s + a.amount, 0)
            if (existingForRole + alloc.amount > roleAlloc.amount) {
              return {
                ok: false,
                failure: {
                  reason: 'OVERPAYMENT_ALLOCATION',
                  role: alloc.role,
                  overBy: existingForRole + alloc.amount - roleAlloc.amount,
                },
              }
            }
          }
        }
      }

      // ── All guards passed: COMMIT ─────────────────────────────────────────
      pmtSeq += 1
      const pmtId = `PMT-${new Date().getFullYear()}-${String(pmtSeq).padStart(4, '0')}`
      const newEntry: PaymentEntry = {
        ...draft,
        id: pmtId,
        paymentRequestId: requestId,
      }
      _entries = [..._entries, newEntry]

      const newTotalPaid = totalPaid + draft.amount
      const newStatus = computePaymentStatus(request.totalAmount, newTotalPaid)
      _requests = _requests.map((r) =>
        r.id === requestId ? { ...r, status: newStatus } : r,
      )

      return { ok: true, entry: newEntry, status: newStatus, totalPaid: newTotalPaid }
    },

    verify(requestId, verifiedBy) {
      const req = _requests.find((r) => r.id === requestId)
      if (!req) return null
      // Idempotent: already verified → return existing record
      if (_verifications[requestId]) return _verifications[requestId]
      const record: PaymentRequestVerification = {
        requestId,
        verifiedAt: new Date().toISOString(),
        ...(verifiedBy ? { verifiedBy } : {}),
      }
      _verifications = { ..._verifications, [requestId]: record }
      return record
    },

    hasRequest(sourceType, sourceId) {
      return _requests.some((r) => r.sourceType === sourceType && r.sourceId === sourceId)
    },

    getRequest(sourceType, sourceId) {
      return _requests.find((r) => r.sourceType === sourceType && r.sourceId === sourceId)
    },

    getEntries(requestId) {
      return _entries.filter((e) => e.paymentRequestId === requestId)
    },

    // Stubs — rebound after the internal state variables are declared below.
    checkForDuplicates: () => ({ hasPotentialDuplicate: false, matches: [] }),
    confirmDuplicatePayment: () => ({
      ok: false as const,
      failure: { reason: 'DUPLICATE_DETECTED' as const, matches: [] as never },
    }),
    draftFingerprint: () => '',
    getAuditForEntry: () => undefined,

    reset() {
      _requests = []
      _entries = []
      _verifications = {}
      _audit = []
      paySeq = 0
      pmtSeq = 0
    },
  }

  // Internal mutable arrays (exposed via getters as live views)
  let _requests = requests
  let _entries = entries
  let _verifications = verifications
  let _audit: PaymentOverrideAuditRecord[] = [...(initial?.audit ?? [])]

  // Re-bind the getters to use _requests/_entries/_verifications/_audit
  Object.defineProperties(store, {
    requests:    { get: () => _requests },
    entries:     { get: () => _entries },
    verifications: { get: () => _verifications },
    paySeq:      { get: () => paySeq },
    pmtSeq:      { get: () => pmtSeq },
    audit:       { get: () => _audit },
  })

  // Fix: reset() must mutate the _ variables that the getters read
  store.reset = () => {
    _requests = []
    _entries = []
    _verifications = {}
    _audit = []
    paySeq = 0
    pmtSeq = 0
  }

  // Re-bind createRequest and addEntry to use the _ variables
  store.createRequest = (input) => {
    if (store.hasRequest(input.sourceType, input.sourceId)) return null
    const allocError = validatePaymentAllocations(input.allocations, input.totalAmount)
    if (allocError) return null
    paySeq += 1
    const id = `PAY-${new Date().getFullYear()}-${String(paySeq).padStart(3, '0')}`
    const request: PaymentRequest = {
      id,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      title: input.title,
      vendor: input.vendor,
      totalAmount: input.totalAmount,
      createdAt: new Date().toISOString(),
      ...(input.dueDate ? { dueDate: input.dueDate } : {}),
      ...(input.supplierId ? { supplierId: input.supplierId } : {}),
        ...(input.vendorType ? { vendorType: input.vendorType } : {}),
      ...(input.allocations && input.allocations.length > 0
        ? { allocations: input.allocations }
        : {}),
      status: 'BELUM DIBAYAR',
    }
    _requests = [..._requests, request]
    return request
  }

  /**
   * Shared commit helper for addEntry and confirmDuplicatePayment.
   *
   * Assumes the caller has already passed every financial guard against the
   * live store state and supplies a consistent `totalPaid` computed from
   * that same state. Runs in a single synchronous call — no interleaving.
   *
   * `onCommit` (when provided) executes immediately after the entry is
   * written but inside the same synchronous boundary: if it throws, the
   * entry and request-status mutations are rolled back, so entry and
   * audit record are committed or not atomically.
   */
  const commitEntry = (
    requestId: string,
    draft: Omit<PaymentEntry, 'id'>,
    totalPaid: number,
    onCommit?: () => void,
  ) => {
    const pmtId = `PMT-${new Date().getFullYear()}-${String(pmtSeq + 1).padStart(4, '0')}`
    const newEntry: PaymentEntry = {
      ...draft,
      id: pmtId,
      paymentRequestId: requestId,
    }
    const newTotalPaid = totalPaid + draft.amount
    const newStatus = computePaymentStatus(
      _requests.find((r) => r.id === requestId)!.totalAmount,
      newTotalPaid,
    )

    const prevEntries = _entries
    const prevRequests = _requests
    pmtSeq += 1
    _entries = [..._entries, newEntry]
    _requests = prevRequests.map((r) =>
      r.id === requestId ? { ...r, status: newStatus } : r,
    )
    try {
      onCommit?.()
    } catch (err) {
      pmtSeq -= 1
      _entries = prevEntries
      _requests = prevRequests
      throw err
    }
    return { entry: newEntry, status: newStatus, totalPaid: newTotalPaid }
  }

  /** All financial guards shared by addEntry and confirmDuplicatePayment. */
  const validateEntryFinancial = (
    requestId: string,
    draft: Omit<PaymentEntry, 'id'>,
  ): { ok: true; totalPaid: number } | { ok: false; failure: EntryValidationFailure } => {
    const request = _requests.find((r) => r.id === requestId)
    if (!request) return { ok: false, failure: { reason: 'REQUEST_NOT_FOUND' } }

    const existing = _entries.filter((e) => e.paymentRequestId === requestId)
    if (existing.length > 0 && request.status === 'LUNAS') {
      return { ok: false, failure: { reason: 'REQUEST_LUNAS' } }
    }

    if (!(draft.amount > 0) || !Number.isFinite(draft.amount)) {
      return { ok: false, failure: { reason: 'AMOUNT_INVALID' } }
    }

    if (isEntryBlockedByVerification(existing.length, requestId in _verifications)) {
      return { ok: false, failure: { reason: 'VERIFICATION_REQUIRED' } }
    }

    const totalPaid = sumPaymentEntries(existing)
    if (totalPaid + draft.amount > request.totalAmount) {
      return {
        ok: false,
        failure: {
          reason: 'OVERPAYMENT_REQUEST',
          overBy: totalPaid + draft.amount - request.totalAmount,
        },
      }
    }

    // ── Allocation validation ─────────────────────────────────────────────
    // When the request has planned allocations, new entries MUST include
    // a valid allocation breakdown. For requests without planned allocations
    // (historical), entries may be created without allocation breakdown.
    const hasPlannedAllocations = request.allocations && request.allocations.length > 0

    if (hasPlannedAllocations) {
      if (!draft.allocations || draft.allocations.length === 0) {
        return { ok: false, failure: { reason: 'ALLOCATION_REQUIRED' } }
      }
      if (!draft.actualRecipient || !draft.actualRecipient.trim()) {
        return { ok: false, failure: { reason: 'RECIPIENT_MISSING' } }
      }
      const seenRoles = new Set<string>()
      for (const alloc of draft.allocations) {
        const validRoles = request.allocations!.map((a) => a.role)
        if (!validRoles.includes(alloc.role)) {
          return { ok: false, failure: { reason: 'UNKNOWN_ROLE', role: alloc.role } }
        }
        if (seenRoles.has(alloc.role)) {
          return { ok: false, failure: { reason: 'DUPLICATE_ROLE', role: alloc.role } }
        }
        seenRoles.add(alloc.role)
        if (!Number.isFinite(alloc.amount) || alloc.amount < 0) {
          return {
            ok: false,
            failure: { reason: 'ALLOCATION_AMOUNT_INVALID', role: alloc.role, amount: alloc.amount },
          }
        }
      }
    }

    if (draft.allocations && draft.allocations.length > 0) {
      const allocSum = draft.allocations.reduce((s, a) => s + a.amount, 0)
      if (allocSum !== draft.amount) {
        return {
          ok: false,
          failure: {
            reason: 'ALLOCATION_SUM_MISMATCH',
            entrySum: allocSum,
            entryAmount: draft.amount,
          },
        }
      }
      if (request.allocations) {
        for (const alloc of draft.allocations) {
          const roleAlloc = request.allocations.find((a) => a.role === alloc.role)
          if (!roleAlloc) continue
          const existingForRole = existing
            .flatMap((e) => e.allocations ?? [])
            .filter((a) => a.role === alloc.role)
            .reduce((s, a) => s + a.amount, 0)
          if (existingForRole + alloc.amount > roleAlloc.amount) {
            return {
              ok: false,
              failure: {
                reason: 'OVERPAYMENT_ALLOCATION',
                role: alloc.role,
                overBy: existingForRole + alloc.amount - roleAlloc.amount,
              },
            }
          }
        }
      }
    }

    return { ok: true, totalPaid: sumPaymentEntries(existing) }
  }

  store.addEntry = (requestId, draft) => {
    // 1. Financial guards against the live store
    const valid = validateEntryFinancial(requestId, draft)
    if (!valid.ok) return { ok: false, failure: valid.failure }

    // 2. Duplicate guard (Fix #15.1, Part B) — authoritative check at the
    //    commit boundary. Normal entries with no matches proceed to commit;
    //    duplicates are rejected with the match details so the caller can
    //    open the override confirmation flow. No entry, no balance change.
    const dupCheck = detectDuplicatePayments(draft, _entries, requestId)
    if (dupCheck.hasPotentialDuplicate) {
      return { ok: false, failure: { reason: 'DUPLICATE_DETECTED', matches: dupCheck.matches } }
    }

    // 3. Normal commit
    const committed = commitEntry(requestId, draft, valid.totalPaid)
    return { ok: true, ...committed }
  }

  // ── Duplicate payment detection & override ─────────────────────────────────
  store.draftFingerprint = (draft: Omit<PaymentEntry, 'id'>): string => {
    // Stable fingerprint from the fields that matter for the confirmation binding.
    // Uses field-value concatenation, not object identity.
    const allocKey = (draft.allocations ?? [])
      .map((a) => `${a.role}:${a.amount}`)
      .sort()
      .join('|')
    return [
      draft.paymentDate,
      draft.method,
      draft.amount,
      draft.reference ?? '',
      draft.actualRecipient ?? '',
      draft.paymentCategory ?? '',
      draft.bank ?? '',
      draft.accountNumber ?? '',
      draft.accountHolder ?? '',
      allocKey,
    ].join('::')
  }

  store.checkForDuplicates = (requestId: string, draft: Omit<PaymentEntry, 'id'>) => {
    return detectDuplicatePayments(draft, _entries, requestId)
  }

  store.getAuditForEntry = (entryId: string) => _audit.find((r) => r.newEntryId === entryId)

  store.confirmDuplicatePayment = (requestId, draft, options) => {
    // 1. Justification is mandatory and non-empty
    if (!options.justification.trim()) {
      return { ok: false, failure: { reason: 'JUSTIFICATION_EMPTY' } }
    }

    // 2. Draft must still be present in the form the operator reviewed
    const currentFingerprint = store.draftFingerprint(draft)
    if (currentFingerprint !== options.draftFingerprint) {
      return {
        ok: false,
        failure: { reason: 'DRAFT_INVALIDATED', currentFingerprint },
      }
    }

    // 3. Re-run ALL financial guards against the live store (read-your-writes)
    const valid = validateEntryFinancial(requestId, draft)
    if (!valid.ok) return { ok: false, failure: valid.failure }

    // 4. Recompute duplicate matches against the LATEST committed entries.
    //    The operator-reviewed snapshot must equal the current set exactly
    //    (order-independent). Any new, removed, or reclassified match
    //    invalidates the confirmation — the operator must re-review.
    const dupCheck = detectDuplicatePayments(draft, _entries, requestId)
    const currentMatches: ReviewedDuplicateMatches = dupCheck.matches.map((m) => ({
      entryId: m.entryId,
      reason: m.reason,
      confidence: m.confidence,
    }))

    // An empty match set can never be accepted as a duplicate override:
    // an override record without a reviewed warning fabricates the audit.
    if (dupCheck.matches.length === 0) {
      return { ok: false, failure: { reason: 'MATCH_SET_CHANGED', currentMatches: [] } }
    }
    if (!areDuplicateSnapshotsEqual(options.reviewedMatches, currentMatches)) {
      return {
        ok: false,
        failure: { reason: 'MATCH_SET_CHANGED', currentMatches: dupCheck.matches },
      }
    }

    // 5. ATOMIC COMMIT: entry + audit record together. The audit record
    //    stores the reviewed snapshot — the matches the operator actually
    //    confirmed, verified equal to the live set above.
    const committed = commitEntry(requestId, draft, valid.totalPaid, () => {
      const entry = _entries[_entries.length - 1]
      const auditRecord: PaymentOverrideAuditRecord = {
        type: 'DUPLICATE_PAYMENT_OVERRIDE',
        newEntryId: entry.id,
        paymentRequestId: requestId,
        reviewedMatches: currentMatches.map((m) => ({ ...m })),
        matchedEntryIds: currentMatches.map((m) => m.entryId),
        reasons: currentMatches.map((m) => m.reason),
        operatorIdentity: options.operatorIdentity?.trim() || 'UNAVAILABLE',
        confirmedAt: new Date().toISOString(),
        justification: options.justification.trim(),
        confirmedDraft: { ...draft },
      }
      _audit = [..._audit, auditRecord]
    })

    return { ok: true, entry: committed.entry, audit: _audit[_audit.length - 1] }
  }

  return store
}

// ── Purchase Admin Documents (KTP, KWITANSI, BASTK) ──────────────────────────
// These belong to the purchase admin, NOT to accounting/payment.
export type PurchaseDocumentStatus = 'BELUM UPLOAD' | 'TERUPLOAD'

export type PurchaseDocument = {
  key: 'KTP' | 'KWITANSI' | 'BASTK'
  status: PurchaseDocumentStatus
  fileName?: string         // set when status = TERUPLOAD
}

// ── Derived helpers ────────────────────────────────────────────────────────────

export function computePaymentStatus(
  totalAmount: number,
  totalPaid: number,
): PaymentStatus {
  if (totalPaid === 0) return 'BELUM DIBAYAR'
  if (totalPaid >= totalAmount && totalAmount > 0) return 'LUNAS'
  return 'BELUM LUNAS'
}

export function sumPaymentEntries(entries: PaymentEntry[]): number {
  return entries.reduce((s, e) => s + e.amount, 0)
}

/**
 * Pre-first-entry verification guard.
 * Blocks adding an entry only when the request has NO entries yet and its
 * totalAmount has NOT been verified. Requests that already contain entries
 * (historical, created before this guard existed) are never blocked.
 */
export function isEntryBlockedByVerification(
  entryCount: number,
  verified: boolean,
): boolean {
  return entryCount === 0 && !verified
}

/**
 * Purchase-price lock guard.
 * When a PURCHASE_UNIT PaymentRequest exists for a car, its totalAmount is
 * fixed at creation time (canonical buyPrice). Any subsequent attempt to
 * modify buyPrice through saveCarCorrections must be stripped so that
 * PaymentRequest.totalAmount cannot be silently changed.
 *
 * This helper is pure and testable without React: it takes the incoming
 * corrections object and a boolean flag, and returns a new object with
 * buyPrice removed when the lock is active. Unrelated fields are preserved.
 */
export function stripLockedPrice<K extends string>(
  corrections: Record<K, unknown>,
  priceLocked: boolean,
): Record<K, unknown> {
  if (!priceLocked || !('buyPrice' in corrections)) return corrections
  const { buyPrice: _discarded, ...rest } = corrections
  return rest as Record<K, unknown>
}

// ── Allocation reconciliation helpers (pure, read-only) ───────────────────
// These functions compute per-role payment progress without mutating anything.
// They are safe to call from any render or derived-value context.

export type AllocationReconciliation = {
  /** Total paid across all entries for this request. */
  totalPaid: number
  /** Total remaining (totalAmount - totalPaid), clamped to >= 0. */
  totalRemaining: number
  /** Per-role breakdown. Present only when the request has planned allocations. */
  perRole?: {
    role: AllocationRole
    planned: number
    paid: number
    remaining: number
  }[]
  /**
   * Sum of entry amounts that lack an allocation breakdown.
   * When > 0, per-role balances are incomplete/uncertain:
   * we cannot attribute these payments to specific roles.
   */
  unattributedHistorical: number
  /** Derived overall payment status. */
  status: PaymentStatus
}

/**
 * Compute the reconciliation of a PaymentRequest's allocations against
 * its actual entries. Pure read-only — does not mutate anything.
 *
 * Rules:
 * - Total paid = sum of all entry amounts (including historical entries
 *   without allocation breakdowns).
 * - Per-role paid = sum of entry allocation amounts for that role only.
 *   Historical entries without allocations contribute to totalPaid but
 *   NOT to per-role paid (they are unattributed).
 * - When unattributedHistorical > 0, per-role remaining is an UPPER BOUND
 *   (true remaining for that role is totalRemaining - unattributed, not
 *   perRole.remaining, which ignores unattributed).
 * - Never double-count: EntryAllocation amounts are counted in their role
 *   only, not also in totalPaid.
 */
export function reconcileAllocations(
  request: PaymentRequest,
  entries: PaymentEntry[],
): AllocationReconciliation {
  const totalPaid = sumPaymentEntries(entries)
  const totalRemaining = Math.max(0, request.totalAmount - totalPaid)
  const status = computePaymentStatus(request.totalAmount, totalPaid)

  // Identify historical unattributed amounts
  const unattributedHistorical = entries
    .filter((e) => !e.allocations || e.allocations.length === 0)
    .reduce((s, e) => s + e.amount, 0)

  if (!request.allocations || request.allocations.length === 0) {
    return { totalPaid, totalRemaining, unattributedHistorical, status }
  }

  // Per-role breakdown
  const perRole = request.allocations.map((alloc) => {
    const paid = entries
      .flatMap((e) => e.allocations ?? [])
      .filter((a) => a.role === alloc.role)
      .reduce((s, a) => s + a.amount, 0)
    return {
      role: alloc.role,
      planned: alloc.amount,
      paid,
      remaining: Math.max(0, alloc.amount - paid),
    }
  })

  return { totalPaid, totalRemaining, perRole, unattributedHistorical, status }
}

/**
 * Convenience: check whether a request has planned allocations.
 * Historical requests (without allocations) use the legacy entry workflow.
 */
export function hasPlannedAllocations(request: PaymentRequest): boolean {
  return request.allocations !== undefined && request.allocations.length > 0
}
