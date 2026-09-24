import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { SPKS, type SPK } from '../data/spks'
import { formatRupiah } from '../data/sales'

const STATUS_COLOR: Record<string, string> = {
  Draft: 'bg-slate-100 text-slate-600',
  Aktif: 'bg-blue-50 text-blue-700',
  Selesai: 'bg-emerald-50 text-emerald-700',
  Batal: 'bg-red-50 text-red-700',
}

export function SpkPage() {
  const [spks] = useState<SPK[]>(SPKS)
  const [query, setQuery] = useState('')

  const filtered = spks.filter((s) => {
    if (!query) return true
    const q = query.toLowerCase()
    return s.spkNumber.toLowerCase().includes(q) || s.customerName.toLowerCase().includes(q) || s.unit.toLowerCase().includes(q)
  })

  return (
    <div className="px-4 py-5 lg:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[15px] font-bold text-slate-900">SPK</p>
          <p className="text-[12px] text-slate-400">{filtered.length} surat pesanan</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,110,253,0.35)] hover:bg-primary-hover">
          <Plus className="h-4 w-4" /> Buat SPK Baru
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari SPK..." className="h-[38px] w-[300px] rounded-[8px] border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-primary" />
        </div>
      </div>

      <div className="rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {['No. SPK', 'Tanggal', 'Customer', 'Unit', 'Harga Jual', 'DP', 'Cicilan/Bln', 'Tenor', 'Finance', 'Status'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="h-[60px] border-b border-line last:border-0 hover:bg-slate-50">
                  <td className="px-4"><span className="text-[13px] font-medium text-primary">{s.spkNumber}</span></td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{s.date}</td>
                  <td className="px-4"><span className="text-[13px] font-medium text-slate-900">{s.customerName}</span><span className="ml-1 text-[11px] text-slate-400">{s.customerPhone}</span></td>
                  <td className="px-4 max-w-[160px] truncate text-[13px] font-medium text-slate-800" title={s.unit}>{s.unit}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] font-semibold text-slate-800">{formatRupiah(s.price)}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] font-semibold text-emerald-600">{formatRupiah(s.downPayment)}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{formatRupiah(s.installment)}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{s.tenor} bln</td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{s.finance}</td>
                  <td className="px-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_COLOR[s.status]}`}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
