import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { CUSTOMERS, type Customer } from '../data/customers'
import { formatRupiah } from '../data/sales'

export function CustomerPage() {
  const [customers] = useState<Customer[]>(CUSTOMERS)
  const [query, setQuery] = useState('')

  const filtered = customers.filter((c) => {
    if (!query) return true
    const q = query.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q)
  })

  return (
    <div className="px-4 py-5 lg:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[15px] font-bold text-slate-900">Master Customer</p>
          <p className="text-[12px] text-slate-400">{filtered.length} customer terdaftar</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,110,253,0.35)] hover:bg-primary-hover">
          <Plus className="h-4 w-4" /> Tambah Customer
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari customer..." className="h-[38px] w-[280px] rounded-[8px] border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-primary" />
        </div>
      </div>

      <div className="rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {['Nama', 'Telepon', 'Email', 'NIK', 'Total Transaksi', 'Total Belanja', 'Bergabung', 'Catatan'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="h-[60px] border-b border-line last:border-0 hover:bg-slate-50">
                  <td className="px-4"><span className="text-[13px] font-semibold text-slate-900">{c.name}</span></td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{c.phone}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{c.email}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] font-mono text-slate-500">{c.idCard}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{c.totalPurchases}x</td>
                  <td className="whitespace-nowrap px-4 text-[13px] font-semibold text-slate-800">{formatRupiah(c.totalSpent)}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{c.joinedDate}</td>
                  <td className="px-4 max-w-[200px] truncate text-[13px] text-slate-500">{c.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
