import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { EXPENSES, EXPENSE_CATEGORIES, type Expense } from '../data/expenses'
import { formatRupiah } from '../data/sales'

export function BiayaPage() {
  const [expenses] = useState<Expense[]>(EXPENSES)
  const [query, setQuery] = useState('')
  const [filterCat, setFilterCat] = useState('Semua Kategori')

  const filtered = expenses.filter((e) => {
    if (filterCat !== 'Semua Kategori' && e.category !== filterCat) return false
    if (!query) return true
    const q = query.toLowerCase()
    return e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)
  })

  const totalExpense = filtered.reduce((s, e) => s + e.amount, 0)
  const byCategory = EXPENSE_CATEGORIES.filter((c) => c !== 'Semua Kategori').map((cat) => ({
    cat,
    total: filtered.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.total > 0)
  const maxCat = Math.max(...byCategory.map((c) => c.total), 1)

  return (
    <div className="px-4 py-5 lg:px-6">
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-slate-400">TOTAL PENGELUARAN</p>
          <p className="mt-1 text-[20px] font-bold text-red-600">{formatRupiah(totalExpense)}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-slate-400">TRANSAKSI</p>
          <p className="mt-1 text-[20px] font-bold text-slate-900">{filtered.length}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari pengeluaran..." className="h-[38px] w-[240px] rounded-[8px] border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-primary" />
          </div>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="h-[38px] rounded-[8px] border border-line bg-white px-3 text-[13px] text-slate-700">
            {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,110,253,0.35)] hover:bg-primary-hover">
          <Plus className="h-4 w-4" /> Tambah Pengeluaran
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-[12px] border border-line bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] xl:col-span-2">
          <p className="mb-4 text-[13px] font-semibold text-slate-900">Rincian Pengeluaran</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line">
                  {['Tanggal', 'Kategori', 'Deskripsi', 'Metode', 'Jumlah', 'Refernsi'].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="h-[55px] border-b border-line last:border-0 hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{e.date}</td>
                    <td className="px-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{e.category}</span></td>
                    <td className="px-4 max-w-[180px] truncate text-[13px] text-slate-800">{e.description}</td>
                    <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{e.paymentMethod}</td>
                    <td className="whitespace-nowrap px-4 text-[13px] font-semibold text-red-600">{formatRupiah(e.amount)}</td>
                    <td className="whitespace-nowrap px-4 text-[12px] font-mono text-slate-400">{e.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[12px] border border-line bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="mb-4 text-[13px] font-semibold text-slate-900">By Kategori</p>
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
    </div>
  )
}
