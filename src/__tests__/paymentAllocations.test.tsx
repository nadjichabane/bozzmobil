import { pipelineFixtureProps } from './fixtures/pipeline'
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { PipelineProvider, usePipeline } from '../context/PipelineContext'
import {
  createPaymentStore,
  reconcileAllocations,
  hasPlannedAllocations,
  type PaymentStore,
  type PaymentRequest,
  type PaymentEntry,
  type PaymentAllocation,
} from '../data/payments'

// ── Helper types and utilities ────────────────────────────────────────────────

function makeAllocations(settlement = 95_000_000, commission = 5_000_000): PaymentAllocation[] {
  return [
    { role: 'VEHICLE_SETTLEMENT', amount: settlement, recipient: 'PT Supplier' },
    { role: 'COMMISSION', amount: commission, recipient: 'Broker A' },
  ]
}

function seedRequestWithAllocations(
  store: PaymentStore,
  sourceId = 'car-alloc-test',
  totalAmount = 100_000_000,
  allocations?: PaymentAllocation[],
): PaymentRequest {
  const allocs = allocations ?? makeAllocations()
  const req = store.createRequest({
    sourceType: 'PURCHASE_UNIT',
    sourceId,
    title: 'Test Car',
    vendor: 'PT Test',
    totalAmount,
    allocations: allocs,
  })
  if (!req) throw new Error('seed failed')
  store.verify(req.id)
  return req
}

function seedHistoricalRequest(
  store: PaymentStore,
  sourceId = 'car-hist',
  totalAmount = 100_000_000,
): PaymentRequest {
  const req = store.createRequest({
    sourceType: 'PURCHASE_UNIT',
    sourceId,
    title: 'Historical Car',
    vendor: 'PT Hist',
    totalAmount,
  })
  if (!req) throw new Error('seed failed')
  store.verify(req.id)
  return req
}

// ── React integration harness ──────────────────────────────────────────────────

type ProbeRef = {
  current: ReturnType<typeof usePipeline> | null
}

function TestProbe({ probeRef }: { probeRef: ProbeRef }) {
  const ctx = usePipeline()
  probeRef.current = ctx
  return null
}

function mountPipeline(): ProbeRef {
  const probeRef: ProbeRef = { current: null }
  render(
    <PipelineProvider {...pipelineFixtureProps}>
      <TestProbe probeRef={probeRef} />
    </PipelineProvider>,
  )
  return probeRef
}

function latest(probeRef: ProbeRef): ReturnType<typeof usePipeline> {
  const ctx = probeRef.current
  if (!ctx) throw new Error('Probe not mounted')
  return ctx
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Payment Allocation Validation & Reconciliation (Phase 1B-2D.1)', () => {
  let store: PaymentStore

  beforeEach(() => {
    store = createPaymentStore()
  })

  // Test 1: Settlement-only payment
  it('Test 1 — settlement-only payment: full settlement amount with zero commission', () => {
    const req = seedRequestWithAllocations(store, 'car-settle-only')
    // Pay only settlement portion (95M), commission remains unpaid
    const r = store.addEntry(req.id, {
      paymentRequestId: req.id,
      paymentDate: '2026-01-01',
      method: 'Transfer',
      amount: 95_000_000,
      actualRecipient: 'PT Supplier',
      allocations: [
        { role: 'VEHICLE_SETTLEMENT', amount: 95_000_000, recipient: 'PT Supplier' },
        { role: 'COMMISSION', amount: 0, recipient: 'Broker A' },
      ],
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.entry.amount).toBe(95_000_000)
      expect(r.status).toBe('BELUM LUNAS') // 95M < 100M total
    }
  })

  // Test 2: Commission-only payment
  it('Test 2 — commission-only payment: full commission amount with zero settlement', () => {
    const req = seedRequestWithAllocations(store, 'car-comm-only')
    const r = store.addEntry(req.id, {
      paymentRequestId: req.id,
      paymentDate: '2026-01-01',
      method: 'Transfer',
      amount: 5_000_000,
      actualRecipient: 'Broker A',
      allocations: [
        { role: 'VEHICLE_SETTLEMENT', amount: 0, recipient: 'PT Supplier' },
        { role: 'COMMISSION', amount: 5_000_000, recipient: 'Broker A' },
      ],
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.entry.amount).toBe(5_000_000)
      expect(r.status).toBe('BELUM LUNAS') // 5M < 100M total
    }
  })

  // Test 3: Commission-first partial payment
  it('Test 3 — commission-first partial payment: 3M commission paid before any settlement', () => {
    const req = seedRequestWithAllocations(store, 'car-comm-first')
    const r = store.addEntry(req.id, {
      paymentRequestId: req.id,
      paymentDate: '2026-01-01',
      method: 'Transfer',
      amount: 3_000_000,
      actualRecipient: 'Broker A',
      allocations: [
        { role: 'VEHICLE_SETTLEMENT', amount: 0, recipient: 'PT Supplier' },
        { role: 'COMMISSION', amount: 3_000_000, recipient: 'Broker A' },
      ],
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      // Reconciliation: commission paid 3M, remaining 2M
      const rec = reconcileAllocations(req, store.getEntries(req.id))
      const commission = rec.perRole!.find((r) => r.role === 'COMMISSION')
      expect(commission?.paid).toBe(3_000_000)
      expect(commission?.remaining).toBe(2_000_000)
      const settlement = rec.perRole!.find((r) => r.role === 'VEHICLE_SETTLEMENT')
      expect(settlement?.paid).toBe(0)
      expect(settlement?.remaining).toBe(95_000_000)
    }
  })

  // Test 4: Multiple partial payments
  it('Test 4 — multiple partial payments: three entries each 30M with mixed allocations', () => {
    const req = seedRequestWithAllocations(store, 'car-multi', 90_000_000,
      makeAllocations(85_000_000, 5_000_000)
    )
    const r1 = store.addEntry(req.id, {
      paymentRequestId: req.id,
      paymentDate: '2026-01-01',
      method: 'Transfer',
      amount: 30_000_000,
      actualRecipient: 'PT Supplier',
      allocations: [
        { role: 'VEHICLE_SETTLEMENT', amount: 25_000_000, recipient: 'PT Supplier' },
        { role: 'COMMISSION', amount: 5_000_000, recipient: 'Broker A' },
      ],
    })
    expect(r1.ok).toBe(true)

    const r2 = store.addEntry(req.id, {
      paymentRequestId: req.id,
      paymentDate: '2026-01-05',
      method: 'Transfer',
      amount: 30_000_000,
      actualRecipient: 'PT Supplier',
      allocations: [
        { role: 'VEHICLE_SETTLEMENT', amount: 30_000_000, recipient: 'PT Supplier' },
      ],
    })
    expect(r2.ok).toBe(true)

    const r3 = store.addEntry(req.id, {
      paymentRequestId: req.id,
      paymentDate: '2026-01-10',
      method: 'Transfer',
      amount: 30_000_000,
      actualRecipient: 'PT Supplier',
      allocations: [
        { role: 'VEHICLE_SETTLEMENT', amount: 30_000_000, recipient: 'PT Supplier' },
      ],
    })
    expect(r3.ok).toBe(true)

    const rec = reconcileAllocations(req, store.getEntries(req.id))
    expect(rec.totalPaid).toBe(90_000_000)
    expect(rec.status).toBe('LUNAS')
    const settlement = rec.perRole!.find((r) => r.role === 'VEHICLE_SETTLEMENT')
    expect(settlement?.paid).toBe(85_000_000) // 25+30+30
    expect(settlement?.remaining).toBe(0)
    const commission = rec.perRole!.find((r) => r.role === 'COMMISSION')
    expect(commission?.paid).toBe(5_000_000)
    expect(commission?.remaining).toBe(0)
  })

  // Test 5: Same actual recipient with two allocation roles
  it('Test 5 — same actual recipient with two allocation roles in one entry', () => {
    const req = seedRequestWithAllocations(store, 'car-same-recipient')
    const r = store.addEntry(req.id, {
      paymentRequestId: req.id,
      paymentDate: '2026-01-01',
      method: 'Transfer',
      amount: 100_000_000,
      actualRecipient: 'PT Supplier', // Both roles go to same recipient
      allocations: [
        { role: 'VEHICLE_SETTLEMENT', amount: 95_000_000, recipient: 'PT Supplier' },
        { role: 'COMMISSION', amount: 5_000_000, recipient: 'Broker A' },
      ],
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.status).toBe('LUNAS')
      // actualRecipient is single: both roles in one entry, one recipient
      expect(r.entry.actualRecipient).toBe('PT Supplier')
    }
  })

  // Test 6: Different actual recipients using separate PaymentEntries
  it('Test 6 — different actual recipients using separate PaymentEntries', () => {
    const req = seedRequestWithAllocations(store, 'car-diff-recipient')
    // Entry 1: settlement goes to PT Supplier
    const r1 = store.addEntry(req.id, {
      paymentRequestId: req.id,
      paymentDate: '2026-01-01',
      method: 'Transfer',
      amount: 50_000_000,
      actualRecipient: 'PT Supplier',
      allocations: [
        { role: 'VEHICLE_SETTLEMENT', amount: 50_000_000, recipient: 'PT Supplier' },
        { role: 'COMMISSION', amount: 0, recipient: 'Broker A' },
      ],
    })
    expect(r1.ok).toBe(true)

    // Entry 2: commission goes to Broker A (separate entry, different recipient)
    const r2 = store.addEntry(req.id, {
      paymentRequestId: req.id,
      paymentDate: '2026-01-05',
      method: 'Transfer',
      amount: 50_000_000,
      actualRecipient: 'Broker A',
      allocations: [
        { role: 'VEHICLE_SETTLEMENT', amount: 45_000_000, recipient: 'PT Supplier' },
        { role: 'COMMISSION', amount: 5_000_000, recipient: 'Broker A' },
      ],
    })
    expect(r2.ok).toBe(true)
    if (r2.ok) {
      expect(r2.status).toBe('LUNAS')
      const entries = store.getEntries(req.id)
      expect(entries[0].actualRecipient).toBe('PT Supplier')
      expect(entries[1].actualRecipient).toBe('Broker A')
    }
  })

  // Test 7: Missing actual recipient
  it('Test 7 — missing actual recipient is rejected (RECIPIENT_MISSING)', () => {
    const req = seedRequestWithAllocations(store, 'car-no-recipient')
    const r = store.addEntry(req.id, {
      paymentRequestId: req.id,
      paymentDate: '2026-01-01',
      method: 'Transfer',
      amount: 50_000_000,
      // No actualRecipient
      allocations: [
        { role: 'VEHICLE_SETTLEMENT', amount: 50_000_000, recipient: 'PT Supplier' },
      ],
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.failure.reason).toBe('RECIPIENT_MISSING')
  })

  // Test 8: Missing allocation breakdown
  it('Test 8 — missing allocation breakdown is rejected (ALLOCATION_REQUIRED)', () => {
    const req = seedRequestWithAllocations(store, 'car-no-alloc')
    const r = store.addEntry(req.id, {
      paymentRequestId: req.id,
      paymentDate: '2026-01-01',
      method: 'Transfer',
      amount: 50_000_000,
      actualRecipient: 'PT Supplier',
      // No allocations
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.failure.reason).toBe('ALLOCATION_REQUIRED')
  })

  // Test 9: Unknown role
  it('Test 9 — unknown role is rejected (UNKNOWN_ROLE)', () => {
    const req = seedRequestWithAllocations(store, 'car-unknown-role')
    const r = store.addEntry(req.id, {
      paymentRequestId: req.id,
      paymentDate: '2026-01-01',
      method: 'Transfer',
      amount: 50_000_000,
      actualRecipient: 'PT Supplier',
      allocations: [
        { role: 'MAINTENANCE' as any, amount: 50_000_000, recipient: 'Mechanic' },
      ],
    })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.failure.reason).toBe('UNKNOWN_ROLE')
    }
  })

  // Test 10: Duplicate role
  it('Test 10 — duplicate role is rejected (DUPLICATE_ROLE)', () => {
    const req = seedRequestWithAllocations(store, 'car-dup-role')
    const r = store.addEntry(req.id, {
      paymentRequestId: req.id,
      paymentDate: '2026-01-01',
      method: 'Transfer',
      amount: 50_000_000,
      actualRecipient: 'PT Supplier',
      allocations: [
        { role: 'VEHICLE_SETTLEMENT', amount: 25_000_000, recipient: 'PT Supplier' },
        { role: 'VEHICLE_SETTLEMENT', amount: 25_000_000, recipient: 'PT Supplier' },
      ],
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.failure.reason).toBe('DUPLICATE_ROLE')
  })

  // Test 11: Allocation sum mismatch
  it('Test 11 — allocation sum != entry amount is rejected (ALLOCATION_SUM_MISMATCH)', () => {
    const req = seedRequestWithAllocations(store, 'car-sum-mismatch')
    const r = store.addEntry(req.id, {
      paymentRequestId: req.id,
      paymentDate: '2026-01-01',
      method: 'Transfer',
      amount: 50_000_000,
      actualRecipient: 'PT Supplier',
      allocations: [
        { role: 'VEHICLE_SETTLEMENT', amount: 40_000_000, recipient: 'PT Supplier' },
        { role: 'COMMISSION', amount: 3_000_000, recipient: 'Broker A' },
      ],
      // Sum = 43M ≠ 50M
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.failure.reason).toBe('ALLOCATION_SUM_MISMATCH')
  })

  // Test 12: Per-role overpayment
  it('Test 12 — per-role overpayment is rejected (OVERPAYMENT_ALLOCATION)', () => {
    const req = seedRequestWithAllocations(store, 'car-overpay-role')
    // First: pay 90M to settlement (planned is 95M)
    const r1 = store.addEntry(req.id, {
      paymentRequestId: req.id,
      paymentDate: '2026-01-01',
      method: 'Transfer',
      amount: 90_000_000,
      actualRecipient: 'PT Supplier',
      allocations: [
        { role: 'VEHICLE_SETTLEMENT', amount: 90_000_000, recipient: 'PT Supplier' },
        { role: 'COMMISSION', amount: 0, recipient: 'Broker A' },
      ],
    })
    expect(r1.ok).toBe(true)

    // Second: try to pay 10M to settlement → 90+10=100M > 95M planned
    const r2 = store.addEntry(req.id, {
      paymentRequestId: req.id,
      paymentDate: '2026-01-02',
      method: 'Transfer',
      amount: 10_000_000,
      actualRecipient: 'PT Supplier',
      allocations: [
        { role: 'VEHICLE_SETTLEMENT', amount: 10_000_000, recipient: 'PT Supplier' },
      ],
    })
    expect(r2.ok).toBe(false)
    if (!r2.ok) {
      expect(r2.failure.reason).toBe('OVERPAYMENT_ALLOCATION')
      if (r2.failure.reason === 'OVERPAYMENT_ALLOCATION') {
        expect(r2.failure.role).toBe('VEHICLE_SETTLEMENT')
        expect(r2.failure.overBy).toBe(5_000_000) // 100M - 95M
      }
    }
  })

  // Test 13: Total overpayment
  it('Test 13 — total overpayment is rejected (OVERPAYMENT_REQUEST)', () => {
    const req = seedRequestWithAllocations(store, 'car-overpay-total')
    const r1 = store.addEntry(req.id, {
      paymentRequestId: req.id,
      paymentDate: '2026-01-01',
      method: 'Transfer',
      amount: 95_000_000,
      actualRecipient: 'PT Supplier',
      allocations: [
        { role: 'VEHICLE_SETTLEMENT', amount: 95_000_000, recipient: 'PT Supplier' },
        { role: 'COMMISSION', amount: 0, recipient: 'Broker A' },
      ],
    })
    expect(r1.ok).toBe(true)

    const r2 = store.addEntry(req.id, {
      paymentRequestId: req.id,
      paymentDate: '2026-01-02',
      method: 'Transfer',
      amount: 10_000_000,
      actualRecipient: 'Broker A',
      allocations: [
        { role: 'COMMISSION', amount: 10_000_000, recipient: 'Broker A' },
      ],
    })
    expect(r2.ok).toBe(false)
    if (!r2.ok) expect(r2.failure.reason).toBe('OVERPAYMENT_REQUEST')
  })

  // Test 14: Commission zero
  it('Test 14 — commission zero: single settlement allocation at full gross is valid', () => {
    const req = seedRequestWithAllocations(
      store,
      'car-zero-comm',
      100_000_000,
      [
        { role: 'VEHICLE_SETTLEMENT', amount: 100_000_000, recipient: 'PT Supplier' },
        { role: 'COMMISSION', amount: 0, recipient: 'Broker X' },
      ],
    )
    const r = store.addEntry(req.id, {
      paymentRequestId: req.id,
      paymentDate: '2026-01-01',
      method: 'Transfer',
      amount: 100_000_000,
      actualRecipient: 'PT Supplier',
      allocations: [
        { role: 'VEHICLE_SETTLEMENT', amount: 100_000_000, recipient: 'PT Supplier' },
        { role: 'COMMISSION', amount: 0, recipient: 'Broker X' },
      ],
    })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.status).toBe('LUNAS')

    // Reconciliation shows zero commission remaining
    const rec = reconcileAllocations(req, store.getEntries(req.id))
    const commission = rec.perRole!.find((r) => r.role === 'COMMISSION')
    expect(commission?.planned).toBe(0)
    expect(commission?.remaining).toBe(0)
    // A zero-commission allocation should not require a positive commission payment
    // (already proven by the LUNAS status above without any commission payment)
  })

  // Test 15: Historical PaymentRequest without allocations
  it('Test 15 — historical request without allocations: legacy entry creation works without allocation breakdown', () => {
    const req = seedHistoricalRequest(store, 'car-legacy', 80_000_000)
    expect(hasPlannedAllocations(req)).toBe(false)

    // Entry without allocations should be accepted
    const r = store.addEntry(req.id, {
      paymentRequestId: req.id,
      paymentDate: '2026-01-01',
      method: 'Transfer',
      amount: 40_000_000,
      // No allocations, no actualRecipient — legacy behavior preserved
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.status).toBe('BELUM LUNAS')
      expect(r.entry.allocations).toBeUndefined()
      expect(r.entry.actualRecipient).toBeUndefined()
    }

    // Second entry also without allocations
    const r2 = store.addEntry(req.id, {
      paymentRequestId: req.id,
      paymentDate: '2026-01-05',
      method: 'Tunai',
      amount: 40_000_000,
    })
    expect(r2.ok).toBe(true)
    if (r2.ok) expect(r2.status).toBe('LUNAS')
  })

  // Test 16: Historical PaymentEntry without allocation details
  it('Test 16 — historical entry without allocation details contributes to totalPaid but not per-role', () => {
    // Simulate a historical entry without allocation breakdown
    // (in a real system this would come from legacy data)
    // We can't directly inject via store, so we test via reconciliation
    // by creating a request with no allocations and adding entries
    const histReq = seedHistoricalRequest(store, 'car-hist-entry-2', 50_000_000)
    const r1 = store.addEntry(histReq.id, {
      paymentRequestId: histReq.id,
      paymentDate: '2026-01-01',
      method: 'Transfer',
      amount: 30_000_000,
      // No allocations — historical
    })
    expect(r1.ok).toBe(true)

    const entries = store.getEntries(histReq.id)
    const rec = reconcileAllocations(histReq, entries)
    expect(rec.totalPaid).toBe(30_000_000)
    expect(rec.unattributedHistorical).toBe(30_000_000)
    expect(rec.perRole).toBeUndefined() // No planned allocations → no per-role
  })

  // Test 17: Mixed historical and new entries
  it('Test 17 — mixed historical and new entries: total paid includes both, unattributed tracked separately', () => {
    // Create a request with planned allocations
    const req = seedRequestWithAllocations(store, 'car-mixed')

    // Simulate historical entry: create a second request without allocations
    // and add an entry, then check reconciliation of the allocation request
    // with entries that lack allocations
    const r1 = store.addEntry(req.id, {
      paymentRequestId: req.id,
      paymentDate: '2026-01-01',
      method: 'Transfer',
      amount: 50_000_000,
      actualRecipient: 'PT Supplier',
      allocations: [
        { role: 'VEHICLE_SETTLEMENT', amount: 50_000_000, recipient: 'PT Supplier' },
      ],
    })
    expect(r1.ok).toBe(true)

    // Now add an entry without allocations (as if it was historical data
    // injected into a request that DID have planned allocations)
    // This tests the "mixed" scenario. We need a request that has
    // planned allocations but also has entries without allocation breakdown.
    // Since our store enforces ALLOCATION_REQUIRED for planned requests,
    // we test the reconciliation function directly with synthetic data.
    const syntheticEntries: PaymentEntry[] = [
      {
        id: 'PMT-2026-0001',
        paymentRequestId: req.id,
        paymentDate: '2026-01-01',
        method: 'Transfer',
        amount: 50_000_000,
        actualRecipient: 'PT Supplier',
        allocations: [
          { role: 'VEHICLE_SETTLEMENT', amount: 50_000_000, recipient: 'PT Supplier' },
        ],
      },
      {
        id: 'PMT-2026-0000', // Historical entry (no allocations)
        paymentRequestId: req.id,
        paymentDate: '2025-12-01',
        method: 'Transfer',
        amount: 20_000_000,
        // No allocations, no actualRecipient — historical
      },
    ]

    const rec = reconcileAllocations(req, syntheticEntries)
    expect(rec.totalPaid).toBe(70_000_000) // 50M + 20M
    expect(rec.unattributedHistorical).toBe(20_000_000)
    const settlement = rec.perRole!.find((r) => r.role === 'VEHICLE_SETTLEMENT')
    expect(settlement?.paid).toBe(50_000_000) // Only from the allocation entry
    // Total remaining = 100M - 70M = 30M, but settlement remaining = 95M - 50M = 45M
    // These are NOT the same when unattributed historical payments exist
    expect(rec.totalRemaining).toBe(30_000_000)
    expect(settlement?.remaining).toBe(45_000_000)
    expect(rec.totalRemaining).not.toBe(
      rec.perRole!.reduce((s, r) => s + r.remaining, 0)
    )
  })

  // Payment persistence in context must not register stock implicitly.
  it('Test 18 — actual recipient differs from planned recipient: entry is accepted, discrepancy preserved', () => {
    const req = seedRequestWithAllocations(store, 'car-discrepancy')
    // Planned recipient for COMMISSION is 'Broker A'
    // Actual payment goes to 'Broker B' (a different actual recipient)
    const r = store.addEntry(req.id, {
      paymentRequestId: req.id,
      paymentDate: '2026-01-01',
      method: 'Transfer',
      amount: 5_000_000,
      actualRecipient: 'Broker B', // Different from planned 'Broker A'
      allocations: [
        { role: 'VEHICLE_SETTLEMENT', amount: 0, recipient: 'PT Supplier' },
        { role: 'COMMISSION', amount: 5_000_000, recipient: 'Broker A' }, // planned recipient
      ],
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      // The actual recipient is preserved as-is
      expect(r.entry.actualRecipient).toBe('Broker B')
      // The allocation still references the planned recipient
      const commAlloc = r.entry.allocations!.find((a) => a.role === 'COMMISSION')
      expect(commAlloc?.recipient).toBe('Broker A')
      // No business guard blocks this — different recipients just require
      // separate PaymentEntries (business rule 6)
    }
  })

  // Test 19: Rapid consecutive submissions
  it('Test 19 — rapid consecutive submissions: two entries in same tick produce distinct IDs', () => {
    const req = seedRequestWithAllocations(store, 'car-rapid', 200_000_000,
      makeAllocations(190_000_000, 10_000_000)
    )
    // Two rapid submissions
    const r1 = store.addEntry(req.id, {
      paymentRequestId: req.id,
      paymentDate: '2026-01-01',
      method: 'Transfer',
      amount: 50_000_000,
      actualRecipient: 'PT Supplier',
      allocations: [
        { role: 'VEHICLE_SETTLEMENT', amount: 50_000_000, recipient: 'PT Supplier' },
      ],
    })
    // r2 differs from r1 in paymentDate → passes the duplicate guard
    const r2 = store.addEntry(req.id, {
      paymentRequestId: req.id,
      paymentDate: '2026-01-02',
      method: 'Transfer',
      amount: 50_000_000,
      actualRecipient: 'PT Supplier',
      allocations: [
        { role: 'VEHICLE_SETTLEMENT', amount: 50_000_000, recipient: 'PT Supplier' },
      ],
    })
    expect(r1.ok).toBe(true)
    expect(r2.ok).toBe(true)
    if (r1.ok && r2.ok) {
      expect(r1.entry.id).not.toBe(r2.entry.id)
      expect(store.entries.length).toBe(2)
    }
  })

  // Test 20: Commission payment must not register stock implicitly.
  it('Test 20 — first accepted commission payment does not trigger stock registration (React integration)', () => {
    const probeRef = mountPipeline()

    let carKey: string | undefined

    act(() => {
      const ctx = latest(probeRef)
      const car = ctx.cars.find((c) => c.stage === 'purchasing' && c.stockStatus === undefined)
      if (!car) throw new Error('No purchasing car found')
      carKey = car.key

      let req = ctx.getPaymentRequestForSource('PURCHASE_UNIT', car.key)
      if (!req) {
        const created = ctx.createPaymentRequest({
          sourceType: 'PURCHASE_UNIT',
          sourceId: car.key,
          title: `${car.brand} ${car.model}`,
          vendor: car.supplier ?? 'Test',
          totalAmount: 100_000_000,
          allocations: [
            { role: 'VEHICLE_SETTLEMENT', amount: 95_000_000, recipient: 'PT Supplier' },
            { role: 'COMMISSION', amount: 5_000_000, recipient: 'Broker A' },
          ],
        })
        if (!created) throw new Error('createPaymentRequest returned null')
        req = created
        ctx.verifyPaymentRequestAmount(req.id)
      }

      // First payment: commission-only (5M), balance only.
      const r = ctx.addPaymentEntry(req.id, {
        paymentRequestId: req.id,
        paymentDate: '2026-01-01',
        method: 'Transfer',
        amount: 5_000_000,
        actualRecipient: 'Broker A',
        allocations: [
          { role: 'VEHICLE_SETTLEMENT', amount: 0, recipient: 'PT Supplier' },
          { role: 'COMMISSION', amount: 5_000_000, recipient: 'Broker A' },
        ],
      })
      expect(r.ok).toBe(true)
    })

    // Payment updates the balance; it must not advance the lifecycle.
    act(() => {})
    const ctx = latest(probeRef)
    const target = ctx.cars.find((c) => c.key === carKey)
    expect(target?.stage).toBe('purchasing')
    expect(target?.stockStatus).toBeUndefined()
  })
})
