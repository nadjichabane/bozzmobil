import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { TRADE_INS, type TradeIn } from '../data/tradeIns'
import { formatRupiah } from '../data/sales'

const STATUS_COLOR: Record<string, string> = {
  Selesai: 'bg-emerald-50 text-emerald-700',
  Penilaian: 'bg-blue-50 text-blue-700',
  'Pending Approval': 'bg-amber-50 text-amber-700',
}

export function TradeInPage() {
  const [tradeIns] = useState<TradeIn[]>(TRADE_INS)
  const [query, setQuery] = useState('')

  const filtered = tradeIns.filter((t) => {
    if (!query) return true
    const q = query.toLowerCase()
    return t.invoice.toLowerCase().includes(q) || t.customerName.toLowerCase().includes(q) || t.newUnit.toLowerCase().includes(q)
  })

  return (
    <div className="px-4 py-5 lg:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[15px] font-bold text-slate-900">Trade In</p>
          <p className="text-[12px] text-slate-400">{filtered.length} transaksi tukar tambah</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,110,253,0.35)] hover:bg-primary-hover">
          <Plus className="h-4 w-4" /> Tambah Trade In
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari transaksi..." className="h-[38px] w-[300px] rounded-[8px] border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-primary" />
        </div>
      </div>

      <div className="rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {['No. Invoice', 'Tanggal', 'Customer', 'Unit Baru', 'Harga', 'Unit Trade-In', 'Thn', 'Nopol', 'Valuasi', 'Selisih', 'Kondisi', 'Status'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-3 text-[11.5px] font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="h-[60px] border-b border-line last:border-0 hover:bg-slate-50">
                  <td className="px-3"><span className="text-[13px] font-medium text-primary">{t.invoice}</span></td>
                  <td className="whitespace-nowrap px-3 text-[13px] text-slate-600">{t.date}</td>
                  <td className="px-3"><span className="text-[13px] font-medium text-slate-900">{t.customerName}</span><span className="ml-1 text-[11px] text-slate-400">{t.customerPhone}</span></td>
                  <td className="px-3 max-w-[140px] truncate text-[13px] font-medium text-slate-800" title={t.newUnit}>{t.newUnit}</td>
                  <td className="whitespace-nowrap px-3 text-[13px] font-semibold text-slate-800">{formatRupiah(t.newPrice)}</td>
                  <td className="px-3 max-w-[120px] truncate text-[13px] text-slate-700" title={t.tradeUnit}>{t.tradeUnit}</td>
                  <td className="whitespace-nowrap px-3 text-[13px] text-slate-600">{t.tradeYear}</td>
                  <td className="whitespace-nowrap px-3 text-[13px] font-mono text-slate-500">{t.tradePlate}</td>
                  <td className="whitespace-nowrap px-3 text-[13px] font-semibold text-slate-800">{formatRupiah(t.tradeValuation)}</td>
                  <td className="whitespace-nowrap px-3 text-[13px] font-semibold text-emerald-600">{formatRupiah(t.diffAmount)}</td>
                  <td className="px-3"><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${t.tradeCondition === 'Berkondisi Baik' ? 'bg-emerald-50 text-emerald-700' : t.tradeCondition === 'Butuh Perbaikan Ringan' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{t.tradeCondition.replace('Butuh Perbaikan ', 'Rp ')}</span></td>
                  <td className="px-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_COLOR[t.status]}`}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
