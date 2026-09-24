import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { SUPPLIERS, type Supplier } from '../data/suppliers'
import { formatRupiah } from '../data/sales'

export function SupplierPage() {
  const [suppliers] = useState<Supplier[]>(SUPPLIERS)
  const [query, setQuery] = useState('')

  const filtered = suppliers.filter((s) => {
    if (!query) return true
    const q = query.toLowerCase()
    return s.name.toLowerCase().includes(q) || s.company.toLowerCase().includes(q) || s.contact.toLowerCase().includes(q)
  })

  return (
    <div className="px-4 py-5 lg:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[15px] font-bold text-slate-900">Master Supplier</p>
          <p className="text-[12px] text-slate-400">{filtered.length} supplier terdaftar</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,110,253,0.35)] hover:bg-primary-hover">
          <Plus className="h-4 w-4" /> Tambah Supplier
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari supplier..." className="h-[38px] w-[280px] rounded-[8px] border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-primary" />
        </div>
      </div>

      <div className="rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {['Nama Supplier', 'Perusahaan', 'PIC', 'Telepon', 'Email', 'Total Unit', 'Total Nilai', 'Terdaftar'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="h-[60px] border-b border-line last:border-0 hover:bg-slate-50">
                  <td className="px-4"><span className="text-[13px] font-semibold text-slate-900">{s.name}</span></td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{s.company}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{s.contact}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{s.phone}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{s.email}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] font-medium text-slate-800">{s.totalSupplied} unit</td>
                  <td className="whitespace-nowrap px-4 text-[13px] font-semibold text-slate-800">{formatRupiah(s.totalValue)}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{s.joinedDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
