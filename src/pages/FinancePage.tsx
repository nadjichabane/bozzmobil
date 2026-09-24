import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { FINANCES, type Finance } from '../data/finances'
import { formatRupiah } from '../data/sales'

export function FinancePage() {
  const [finances] = useState<Finance[]>(FINANCES)
  const [query, setQuery] = useState('')

  const filtered = finances.filter((f) => {
    if (!query) return true
    const q = query.toLowerCase()
    return f.name.toLowerCase().includes(q) || f.type.toLowerCase().includes(q)
  })

  return (
    <div className="px-4 py-5 lg:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[15px] font-bold text-slate-900">Master Finance</p>
          <p className="text-[12px] text-slate-400">{filtered.length} mitra pembiayaan</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,110,253,0.35)] hover:bg-primary-hover">
          <Plus className="h-4 w-4" /> Tambah Finance
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari finance..." className="h-[38px] w-[280px] rounded-[8px] border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-primary" />
        </div>
      </div>

      <div className="rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {['Nama Finance', 'Tipe', 'PIC', 'Telepon', 'Limit Kredit', 'Terdisburse', 'Sisa Limit', 'Pending', 'Status'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => {
                const remaining = f.approvedCredit - f.totalDisbursed
                return (
                  <tr key={f.id} className="h-[60px] border-b border-line last:border-0 hover:bg-slate-50">
                    <td className="px-4"><span className="text-[13px] font-semibold text-slate-900">{f.name}</span></td>
                    <td className="whitespace-nowrap px-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${f.type === 'Bank' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>{f.type}</span></td>
                    <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{f.contact}</td>
                    <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{f.phone}</td>
                    <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{formatRupiah(f.approvedCredit)}</td>
                    <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{formatRupiah(f.totalDisbursed)}</td>
                    <td className="whitespace-nowrap px-4 text-[13px] font-semibold text-slate-800">{formatRupiah(remaining)}</td>
                    <td className="whitespace-nowrap px-4">
                      <span className={`text-[12px] font-semibold ${f.pendingApprovers > 0 ? 'text-amber-600' : 'text-slate-500'}`}>{f.pendingApprovers}</span>
                    </td>
                    <td className="px-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${f.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{f.status}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
