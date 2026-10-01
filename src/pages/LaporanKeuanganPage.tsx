import { ArrowDownLeft, ArrowUpRight, FileDown, Wallet } from 'lucide-react'
import { useState } from 'react'
import { EXPENSES, EXPENSE_CATEGORIES } from '../data/expenses'
import { SALES, formatRupiah } from '../data/sales'
import { StatCard } from '../components/StatCard'

type FlowRow = {
  id: string
  date: string
  type: 'Pemasukan' | 'Pengeluaran'
  category: string
  description: string
  amount: number
  reference: string
}

const ROWS: FlowRow[] = [
  ...SALES.map((s) => ({
    id: `in-${s.id}`,
    date: s.date,
    type: 'Pemasukan' as const,
    category: 'Penjualan Unit',
    description: `${s.unit} — ${s.customer}`,
    amount: s.price,
    reference: s.invoice,
  })),
  ...EXPENSES.map((e) => ({
    id: `out-${e.id}`,
    date: e.date,
    type: 'Pengeluaran' as const,
    category: e.category,
    description: e.description,
    amount: e.amount,
    reference: e.reference,
  })),
]

export function LaporanKeuanganPage() {
  const [tab, setTab] = useState<'Semua' | 'Pemasukan' | 'Pengeluaran'>('Semua')

  const totalIn = SALES.reduce((s, x) => s + x.price, 0)
  const totalOut = EXPENSES.reduce((s, x) => s + x.amount, 0)
  const net = totalIn - totalOut

  const byCategory = EXPENSE_CATEGORIES.filter((c) => c !== 'Semua Kategori').map((cat) => ({
    cat,
    total: EXPENSES.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
  }))
  const maxCat = Math.max(...byCategory.map((c) => c.total), 1)

  const filtered = ROWS.filter((r) => tab === 'Semua' || r.type === tab)

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="TOTAL PEMASUKAN"
          value={formatRupiah(totalIn)}
          trend="Dari penjualan unit"
          icon={ArrowUpRight}
          iconBg="bg-[#22C55E]"
        />
        <StatCard
          title="TOTAL PENGELUARAN"
          value={formatRupiah(totalOut)}
          trend="Sepanjang periode berjalan"
          icon={ArrowDownLeft}
          iconBg="bg-[#EF4444]"
          trendUp={false}
        />
        <StatCard
          title="ARUS KAS BERSIH"
          value={formatRupiah(net)}
          trend={net >= 0 ? 'Positif' : 'Negatif'}
          icon={Wallet}
          iconBg={net >= 0 ? 'bg-[#2F80ED]' : 'bg-[#EF4444]'}
          trendUp={net >= 0}
        />
        <StatCard
          title="TRANSAKSI"
          value={`${ROWS.length} Transaksi`}
          trend="Pemasukan & pengeluaran"
          icon={FileDown}
          iconBg="bg-[#8B5CF6]"
        />
      </div>

      <div className="mt-4 rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex items-center gap-1">
            {(['Semua', 'Pemasukan', 'Pengeluaran'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-[8px] px-3 py-1.5 text-[12px] font-semibold ${
                  tab === t ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,110,253,0.35)] hover:bg-primary-hover">
            <FileDown className="h-4 w-4" /> Ekspor Laporan
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {['Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Nominal', 'Referensi'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="h-[55px] border-b border-line last:border-0 hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{r.date}</td>
                  <td className="px-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      r.type === 'Pemasukan' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                    }`}>{r.type}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{r.category}</td>
                  <td className="max-w-[260px] truncate px-4 text-[13px] text-slate-800">{r.description}</td>
                  <td className={`whitespace-nowrap px-4 text-[13px] font-semibold ${r.type === 'Pemasukan' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {r.type === 'Pemasukan' ? '+' : '-'}{formatRupiah(r.amount)}
                  </td>
                  <td className="whitespace-nowrap px-4 font-mono text-[12px] text-slate-400">{r.reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 rounded-[12px] border border-line bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <p className="mb-4 text-[13px] font-semibold text-slate-900">Rekapitulasi Pengeluaran per Kategori</p>
        <div className="space-y-3">
          {byCategory.map((c) => (
            <div key={c.cat}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[12px] text-slate-600">{c.cat}</span>
                <span className="text-[12px] font-semibold text-slate-800">{formatRupiah(c.total)}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(c.total / maxCat) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
