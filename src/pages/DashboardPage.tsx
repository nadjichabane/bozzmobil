import { Car, CircleDollarSign, FileWarning, Percent, TrendingUp, Wallet, Zap } from 'lucide-react'
import { SALES, formatRupiah } from '../data/sales'
import { StatCard } from '../components/StatCard'

const TOP_UNITS = [
  { unit: 'Toyota Fortuner VRZ', sold: 4, revenue: 920_000_000 },
  { unit: 'Mitsubishi Xpander', sold: 3, revenue: 675_000_000 },
  { unit: 'Honda City', sold: 3, revenue: 315_000_000 },
  { unit: 'Toyota Raize', sold: 2, revenue: 374_000_000 },
  { unit: 'Suzuki Ertiga', sold: 2, revenue: 180_000_000 },
]

const WEEKLY_DATA = [
  { day: 'Sen', sales: 3, revenue: 420_000_000 },
  { day: 'Sel', sales: 5, revenue: 680_000_000 },
  { day: 'Rab', sales: 2, revenue: 310_000_000 },
  { day: 'Kam', sales: 7, revenue: 890_000_000 },
  { day: 'Jum', sales: 4, revenue: 560_000_000 },
  { day: 'Sab', sales: 8, revenue: 1050_000_000 },
  { day: 'Min', sales: 1, revenue: 150_000_000 },
]

const MAX_REVENUE = Math.max(...WEEKLY_DATA.map((d) => d.revenue))

const TOP_SALES_PEOPLE = [
  { name: 'Rudi Hartono', sold: 9, revenue: 1_260_000_000 },
  { name: 'Maya Putri', sold: 8, revenue: 1_180_000_000 },
  { name: 'Andi Saputra', sold: 7, revenue: 980_000_000 },
]

export function DashboardPage() {
  const totalSales = SALES.length
  const totalRevenue = SALES.reduce((s, v) => s + v.price, 0)
  const totalProfit = SALES.reduce((s, v) => s + v.profit, 0)
  const avgMargin = Math.round((totalProfit / totalRevenue) * 100)

  return (
    <div className="px-4 py-5 lg:px-6 space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="TOTAL PENJUALAN" value={`${totalSales} Unit`} trend="↑ 27% dari bulan lalu" icon={Car} iconBg="bg-[#2F80ED]" />
        <StatCard title="TOTAL OMZET" value={formatRupiah(totalRevenue)} trend="↑ 18.6% dari bulan lalu" icon={Wallet} iconBg="bg-[#22C55E]" />
        <StatCard title="LABA KOTOR" value={formatRupiah(totalProfit)} trend="↑ 19.8% dari bulan lalu" icon={CircleDollarSign} iconBg="bg-[#F59E0B]" />
        <StatCard title="RATA-RATA MARGIN" value={`${avgMargin}%`} trend="↑ 1.2% dari bulan lalu" icon={Percent} iconBg="bg-[#8B5CF6]" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-[12px] border border-line bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-slate-900">Pendapatan Mingguan</p>
              <p className="text-[11.5px] text-slate-400">Senin - Minggu terakhir</p>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
              <TrendingUp className="h-3 w-3" /> +12.4%
            </span>
          </div>
          <div className="flex items-end justify-between gap-2">
            {WEEKLY_DATA.map((d) => (
              <div key={d.day} className="flex flex-col items-center gap-1.5 flex-1">
                <span className="text-[10px] font-medium text-slate-500">
                  {d.revenue >= 1_000_000_000 ? `${(d.revenue / 1_000_000_000).toFixed(1)}Jt` : `${(d.revenue / 1_000_000).toFixed(0)}jt`}
                </span>
                <div className="w-full rounded-t-[4px] bg-primary/80 transition-all" style={{ height: `${(d.revenue / MAX_REVENUE) * 120}px` }} />
                <span className="text-[11px] text-slate-500">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[12px] border border-line bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-slate-900">Top Sales Person</p>
            <Zap className="h-4 w-4 text-amber-500" />
          </div>
          <div className="space-y-3">
            {TOP_SALES_PEOPLE.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : 'bg-orange-50 text-orange-600'}`}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-slate-900">{s.name}</p>
                  <p className="text-[11px] text-slate-400">{s.sold} unit terjual</p>
                </div>
                <span className="shrink-0 text-[12px] font-semibold text-slate-700">{formatRupiah(s.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-[12px] border border-line bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-slate-900">Unit Terlaris</p>
            <span className="text-[11px] text-slate-400">Bulan ini</span>
          </div>
          <div className="space-y-3">
            {TOP_UNITS.map((u) => (
              <div key={u.unit} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-[8px] bg-slate-100" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-slate-800">{u.unit}</p>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(u.sold / TOP_UNITS[0].sold) * 100}%` }} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[12px] font-semibold text-slate-800">{u.sold} unit</p>
                  <p className="text-[11px] text-slate-400">{formatRupiah(u.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[12px] border border-line bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-slate-900">Status Penjualan</p>
            <span className="flex items-center gap-1 text-[11px] font-medium text-red-500">
              <FileWarning className="h-3 w-3" /> 3 pending
            </span>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Lunas', count: 19, color: 'bg-emerald-500', pct: 68 },
              { label: 'Proses STNK', count: 6, color: 'bg-amber-500', pct: 21 },
              { label: 'Proses BPKB', count: 3, color: 'bg-blue-500', pct: 11 },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                <span className="text-[13px] text-slate-700 flex-1">{s.label}</span>
                <span className="text-[13px] font-semibold text-slate-900">{s.count} unit</span>
                <div className="h-1.5 w-20 rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} />
                </div>
                <span className="text-[11px] text-slate-400 w-8 text-right">{s.pct}%</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-[8px] bg-slate-50 p-3">
            <p className="text-[11px] font-medium text-slate-500">Target Bulan Ini</p>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-slate-800">28 / 35 unit</span>
              <span className="text-[12px] font-semibold text-primary">80%</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-primary" style={{ width: '80%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
