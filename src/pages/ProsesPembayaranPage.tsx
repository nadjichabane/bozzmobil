import {
  useState,
} from 'react'
import {
  Wallet,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react'
import {
  usePipelineData,
} from '../context/usePipelineData'
import {
  PAYMENT_SOURCE_TYPES,
  type PaymentRequest,
  type PaymentSourceType,
  type PaymentStatus,
  sumPaymentEntries,
} from '../data/payments'
import { formatRupiah } from '../data/sales'
import { ProsesPembayaran } from '../components/ProsesPembayaran'
import { Badge, type BadgeTone } from '../components/ui/Badge'
import { PURCHASE_PAYMENT_CATEGORIES, purchasePaymentCategory } from '../lib/purchasePaymentCategory'

// ── Status metadata ───────────────────────────────────────────────────────────

const STATUS_META: Record<
  PaymentStatus,
  { label: string; tone: BadgeTone; icon: typeof CheckCircle2 }
> = {
  'BELUM DIBAYAR': {
    label: 'Belum Dibayar',
    tone: 'neutral',
    icon: Clock,
  },
  'BELUM LUNAS': {
    label: 'Belum Lunas',
    tone: 'warning',
    icon: AlertCircle,
  },
  'LUNAS': {
    label: 'Lunas',
    tone: 'success',
    icon: CheckCircle2,
  },
}

// ── Page ────────────────────────────────────────────────────────────────────────

type FilterKey = 'ALL' | 'REFUND' | PaymentSourceType | 'STATUS_' | PaymentStatus

export function ProsesPembayaranPage() {
  const {
    paymentRequests,
    getEntriesForRequest,
    purchaseRows,
    getCar,
    isPurchaseRejected,
    purchaseRefunds,
  } = usePipelineData()

  const [activeFilter, setActiveFilter] = useState<FilterKey>('ALL')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('')

  // ── Derived row type ────────────────────────────────────────────────────────
  type QueueRow = {
    request: PaymentRequest
    totalPaid: number
    remaining: number
    entryCount: number
  }

  const rows: QueueRow[] = paymentRequests.map((req) => {
    const entries = getEntriesForRequest(req.id)
    const totalPaid = sumPaymentEntries(entries)
    return {
      request: req,
      totalPaid,
      remaining: isPurchaseRejected(req.sourceId) ? 0 : Math.max(0, req.totalAmount - totalPaid),
      entryCount: entries.length,
    }
  })

  // ── Summary cards ──────────────────────────────────────────────────────────
  const totalOutstanding = rows.reduce((s, r) => s + r.remaining, 0)
  const countBelumDibayar = rows.filter((r) => !isPurchaseRejected(r.request.sourceId) && r.request.status === 'BELUM DIBAYAR').length
  const countBelumLunas = rows.filter((r) => !isPurchaseRejected(r.request.sourceId) && r.request.status === 'BELUM LUNAS').length

  const summaryCards = [
    {
      label: 'Total Request',
      value: String(rows.length),
      sub: 'termasuk histori pembelian ditolak',
      icon: Wallet,
      color: 'text-slate-700',
      border: 'border-slate-200',
    },
    {
      label: 'Belum Dibayar',
      value: String(countBelumDibayar),
      sub: 'perlu segera diproses',
      icon: Clock,
      color: 'text-blue-600',
      border: 'border-blue-200',
    },
    {
      label: 'Belum Lunas',
      value: String(countBelumLunas),
      sub: 'sudah ada pembayaran',
      icon: AlertCircle,
      color: 'text-amber-600',
      border: 'border-amber-200',
    },
    {
      label: 'Sisa Tagihan',
      value: formatRupiah(totalOutstanding),
      sub: 'total outstanding',
      icon: Wallet,
      color: totalOutstanding > 0 ? 'text-red-600' : 'text-emerald-600',
      border: totalOutstanding > 0 ? 'border-red-200' : 'border-emerald-200',
    },
  ]

  // ── Filter tabs ─────────────────────────────────────────────────────────────
  const filterTabs: { key: FilterKey; label: string; count: number }[] = [
    { key: 'ALL', label: 'Semua', count: rows.length },
    { key: 'REFUND', label: 'Menunggu Refund', count: rows.filter(r => isPurchaseRejected(r.request.sourceId) && r.totalPaid > purchaseRefunds.filter(refund => refund.requestId === r.request.id).reduce((sum, refund) => sum + refund.amount, 0)).length },
    ...PAYMENT_SOURCE_TYPES.map((st) => ({
      key: st.value as FilterKey,
      label: st.label,
      count: rows.filter((r) => r.request.sourceType === st.value).length,
    })),
  ]

  // ── Filtering ───────────────────────────────────────────────────────────────
  const filtered = rows.filter((r) => {
    if (categoryFilter && purchasePaymentCategory(r.request.sourceType === 'PURCHASE_UNIT' ? getCar(r.request.sourceId) : undefined) !== categoryFilter) return false
    if (activeFilter === 'ALL') return true
    if (activeFilter === 'REFUND') return isPurchaseRejected(r.request.sourceId) && r.totalPaid > purchaseRefunds.filter(refund => refund.requestId === r.request.id).reduce((sum, refund) => sum + refund.amount, 0)
    if (r.request.status === activeFilter) return !isPurchaseRejected(r.request.sourceId)
    return r.request.sourceType === activeFilter
  })

  // ── Detail view ─────────────────────────────────────────────────────────────
  if (selectedId) {
    const sel = paymentRequests.find((r) => r.id === selectedId)
    const selRow = purchaseRows.find((p) => p.id === sel?.sourceId)
    if (sel && selRow) {
      return (
        <ProsesPembayaran
          row={selRow}
          onBack={() => setSelectedId(null)}
        />
      )
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-center gap-2">
        <Wallet className="h-5 w-5 text-slate-400" />
        <div>
          <p className="text-[15px] font-bold text-slate-900">Proses Pembayaran</p>
          <p className="text-[12px] text-slate-400">
            Antrian pembayaran unit & operasional — {rows.length} total request
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summaryCards.map((c) => (
          <div
            key={c.label}
            className={`rounded-[12px] border ${c.border} bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]`}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                {c.label}
              </p>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
            <p className={`text-[20px] font-bold leading-tight ${c.color}`}>
              {c.value}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              className={`rounded-[8px] border px-3 py-1.5 text-[12px] font-semibold transition ${
                isActive
                  ? 'border-primary bg-primary text-white'
                  : 'border-line bg-white text-slate-600 hover:border-primary/50 hover:text-primary'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 text-[10px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <label className="mb-4 flex flex-wrap items-center gap-2 text-[12px] text-slate-600">
        Kategori Pembayaran
        <select aria-label="Kategori Pembayaran" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="rounded-[8px] border border-line bg-white px-3 py-2 text-[12px]">
          <option value="">Semua Kategori</option>
          {[...new Set<string>([...PURCHASE_PAYMENT_CATEGORIES, ...rows.map(row => purchasePaymentCategory(row.request.sourceType === 'PURCHASE_UNIT' ? getCar(row.request.sourceId) : undefined))])].map(category => <option key={category} value={category}>{category}</option>)}
        </select>
      </label>

      {/* Table / list */}
      {filtered.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-line bg-white p-8 text-center">
          <Wallet className="mx-auto mb-2 h-6 w-6 text-slate-300" />
          <p className="text-[13px] font-medium text-slate-500">
            Belum ada antrian pembayaran untuk kategori ini.
          </p>
          <p className="mt-1 text-[11.5px] text-slate-400">
            Submit informasi pembelian dari halaman Proses Pembelian untuk menambah antrian.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {/* Table header */}
          <div className="grid min-w-[1140px] grid-cols-[90px_140px_100px_minmax(140px,1fr)_130px_110px_100px_100px_90px_120px] items-center gap-2 border-b border-line bg-slate-50 px-4 py-2.5 text-[10.5px] font-semibold tracking-wide text-slate-400 uppercase">
            <span>ID Payment</span>
            <span>ID Inspeksi</span>
            <span>Plat Nomor</span>
            <span>Unit</span>
            <span>Kategori</span>
            <span className="text-right">Total</span>
            <span>Dibayar / Sisa</span>
            <span>Status</span>
            <span>Jenis</span>
            <span className="text-right">Detail</span>
          </div>

          {filtered.map((row) => {
            const req = row.request
            const rejected = isPurchaseRejected(req.sourceId)
            const refunded = purchaseRefunds.filter(r => r.requestId === req.id).reduce((sum, r) => sum + r.amount, 0)
            const st = rejected ? { tone: 'danger' as const, label: row.totalPaid > refunded ? 'Ditolak · Menunggu refund' : 'Ditolak · Refund selesai / tidak diperlukan' } : STATUS_META[req.status]
            const car = req.sourceType === 'PURCHASE_UNIT' ? getCar(req.sourceId) : undefined
            const inspectionCode = req.sourceType === 'PURCHASE_UNIT' ? purchaseRows.find(purchase => purchase.id === req.sourceId)?.inspection.code : undefined
            const plate = car?.plate ?? '—'
            const unitLabel = car ? `${car.brand} ${car.model}` : (req.title || '—')
            const supplier = car?.supplier || req.vendor
            const progress =
              req.totalAmount > 0
                ? Math.min(100, Math.round((row.totalPaid / req.totalAmount) * 100))
                : 0

            return (
              <div
                key={req.id}
                className="group grid min-w-[1140px] grid-cols-[90px_140px_100px_minmax(140px,1fr)_130px_110px_100px_100px_90px_120px] items-center gap-2 border-b border-line/60 px-4 py-3 last:border-0 transition hover:bg-slate-50/60"
              >
                {/* ID Payment */}
                <div className="min-w-0">
                  <p className="truncate font-mono text-[11px] font-medium text-primary" title={req.id}>
                    {req.id}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="break-words font-mono text-[11px] font-medium text-primary" title={inspectionCode || undefined}>{inspectionCode || '-'}</p>
                </div>

                {/* Plat Nomor */}
                <div className="min-w-0">
                  <p className="font-mono text-[12px] font-semibold text-slate-800">{plate}</p>
                </div>

                {/* Unit + supplier secondary */}
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-slate-900">{unitLabel}</p>
                  {supplier && (
                    <p className="truncate text-[11px] text-slate-400">{supplier}</p>
                  )}
                  {row.entryCount > 0 && (
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {row.entryCount} pembayaran tercatat
                    </p>
                  )}
                  {rejected && <p className="text-[11px] text-amber-700">Refund diterima: {formatRupiah(refunded)} · Belum kembali: {formatRupiah(row.totalPaid - refunded)}</p>}
                </div>

                <div className="text-[11px] font-medium text-slate-600">{purchasePaymentCategory(car)}</div>

                {/* Total */}
                <div className="text-right">
                  <p className="text-[13px] font-bold text-slate-800">
                    {formatRupiah(req.totalAmount)}
                  </p>
                  <div className="mt-1 ml-auto h-1 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        progress === 100 ? 'bg-emerald-500' : progress > 0 ? 'bg-amber-400' : 'bg-blue-400'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Dibayar / Sisa */}
                <div className="text-[11px]">
                  <p className="text-slate-500">
                    Dibayar:{' '}
                    <span className="font-semibold text-slate-800">
                      {formatRupiah(row.totalPaid)}
                    </span>
                  </p>
                  <p className="text-slate-500">
                    Sisa:{' '}
                    <span className={`font-semibold ${row.remaining > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {formatRupiah(row.remaining)}
                    </span>
                  </p>
                </div>

                {/* Status */}
                <div>
                  <Badge tone={st.tone} withDot>
                    {st.label}
                  </Badge>
                </div>

                {/* Jenis */}
                <div>
                  <span className="rounded-[6px] bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {req.sourceType}
                  </span>
                </div>

                {/* Detail */}
                <button
                  type="button"
                  onClick={() => setSelectedId(req.id)}
                  className="ml-auto flex items-center gap-1 text-[12px] font-semibold text-primary hover:opacity-80"
                >
                  PROSES
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
