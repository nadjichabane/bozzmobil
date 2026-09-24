import { BarChart3, Car, CircleDollarSign, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { SALES } from '../data/sales'
import { formatRupiah } from '../data/sales'

const MONTHLY_DATA = [
  { month: 'Jan', sales: 18, revenue: 2_100_000_000 },
  { month: 'Feb', sales: 22, revenue: 2_800_000_000 },
  { month: 'Mar', sales: 15, revenue: 1_950_000_000 },
  { month: 'Apr', sales: 25, revenue: 3_200_000_000 },
  { month: 'Mei', sales: 20, revenue: 2_600_000_000 },
  { month: 'Jun', sales: 28, revenue: 3_500_000_000 },
  { month: 'Jul', sales: 24, revenue: 3_100_000_000 },
  { month: 'Agu', sales: 28, revenue: 3_600_000_000 },
]
const MAX_REVENUE = Math.max(...MONTHLY_DATA.map((d) => d.revenue))

const PAYMENT_BREAKDOWN = [
  { label: 'Cash', value: 14, color: 'bg-emerald-500', pct: 50 },
  { label: 'Credit', value: 14, color: 'bg-blue-500', pct: 50 },
]

const STATUS_BREAKDOWN = [
  { label: 'Lunas', value: 19, color: 'bg-emerald-500', pct: 68 },
  { label: 'Proses STNK', value: 6, color: 'bg-amber-500', pct: 21 },
  { label: 'Proses BPKB', value: 3, color: 'bg-blue-500', pct: 11 },
]

export function LaporanPage() {
  const totalSales = SALES.length
  const totalRevenue = SALES.reduce((s, v) => s + v.price, 0)
  const totalProfit = SALES.reduce((s, v) => s + v.profit, 0)
  const avgMargin = Math.round((totalProfit / totalRevenue) * 100)

  const [period, setPeriod] = useState('Agustus 2026')

  return (
    <div className="px-4 py-5 lg:px-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[15px] font-bold text-slate-900">Laporan</p>
          <p className="text-[12px] text-slate-400">Ringkasan performa penjualan</p>
        </div>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="h-[38px] rounded-[8px] border border-line bg-white px-3 text-[13px] text-slate-700">
          <option>Agustus 2026</option>
          <option>Juli 2026</option>
          <option>Q3 2026</option>
          <option>Tahun 2026</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Unit Terjual', value: `${totalSales} Unit`, icon: Car, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Omzet', value: formatRupiah(totalRevenue), icon: CircleDollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Laba', value: formatRupiah(totalProfit), icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Rata-rata Margin', value: `${avgMargin}%`, icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((card) => (
          <div key={card.label} className={`rounded-[12px] border border-line bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]`}>
            <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-full ${card.bg}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <p className="text-[10px] font-semibold tracking-wider text-slate-400">{card.label}</p>
            <p className={`mt-1 text-[18px] font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-[12px] border border-line bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="mb-4 text-[13px] font-semibold text-slate-900">Tren Pendapatan 8 Bulan Terakhir</p>
          <div className="flex items-end justify-between gap-2">
            {MONTHLY_DATA.map((d) => (
              <div key={d.month} className="flex flex-col items-center gap-1.5 flex-1">
                <span className="text-[10px] font-medium text-slate-500">
                  {(d.revenue / 1_000_000_000).toFixed(1)}M
                </span>
                <div className="w-full rounded-t-[4px] bg-primary/80" style={{ height: `${(d.revenue / MAX_REVENUE) * 120}px` }} />
                <span className="text-[11px] text-slate-500">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[12px] border border-line bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="mb-4 text-[13px] font-semibold text-slate-900">Breakdown Pembayaran</p>
          <div className="space-y-3">
            {PAYMENT_BREAKDOWN.map((p) => (
              <div key={p.label} className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${p.color}`} />
                <span className="text-[13px] text-slate-700 flex-1">{p.label}</span>
                <span className="text-[13px] font-semibold text-slate-900">{p.value} unit</span>
                <div className="h-1.5 w-16 rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${p.color}`} style={{ width: `${p.pct}%` }} />
                </div>
                <span className="text-[11px] text-slate-400 w-8 text-right">{p.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[12px] border border-line bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <p className="mb-4 text-[13px] font-semibold text-slate-900">Breakdown Status</p>
        <div className="flex flex-wrap gap-6">
          {STATUS_BREAKDOWN.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
              <span className="text-[13px] text-slate-700">{s.label}</span>
              <span className="text-[13px] font-semibold text-slate-900">{s.value} unit</span>
              <span className="text-[12px] text-slate-400">({s.pct}%)</span>
              <div className="h-2 w-32 rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[12px] border border-line bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <p className="mb-4 text-[13px] font-semibold text-slate-900">Laporan per Sales Person</p>
        <div className="space-y-3">
          {[
            { name: 'Rudi Hartono', sold: 9, revenue: 1_260_000_000, profit: 98_000_000 },
            { name: 'Maya Putri', sold: 8, revenue: 1_180_000_000, profit: 95_000_000 },
            { name: 'Andi Saputra', sold: 7, revenue: 980_000_000, profit: 72_000_000 },
          ].map((s) => (
            <div key={s.name} className="flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-[12px] font-bold">
                {s.name[0]}
              </div>
              <span className="w-36 text-[13px] font-medium text-slate-800">{s.name}</span>
              <span className="text-[13px] text-slate-600">{s.sold} unit</span>
              <span className="text-[13px] font-semibold text-slate-800">{formatRupiah(s.revenue)}</span>
              <span className="text-[13px] font-semibold text-emerald-600">{formatRupiah(s.profit)}</span>
              <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(s.sold / 9) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
