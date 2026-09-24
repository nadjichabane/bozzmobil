import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { RECONCILIATIONS, type RecItem } from '../data/reconciliation'
import { formatRupiah } from '../data/sales'

const STATUS_COLOR: Record<string, string> = {
  Cocok: 'bg-emerald-50 text-emerald-700',
  Selisih: 'bg-red-50 text-red-700',
  'Belum Cocok': 'bg-amber-50 text-amber-700',
}

export function RekonsiliasiPage() {
  const [items] = useState<RecItem[]>(RECONCILIATIONS)
  const [query, setQuery] = useState('')

  const filtered = items.filter((i) => {
    if (!query) return true
    const q = query.toLowerCase()
    return i.finance.toLowerCase().includes(q) || i.transactionRef.toLowerCase().includes(q)
  })

  const cocokCount = filtered.filter((i) => i.status === 'Cocok').length
  const selisihTotal = filtered.filter((i) => i.discrepancy).reduce((s, i) => s + (i.discrepancy ?? 0), 0)

  return (
    <div className="px-4 py-5 lg:px-6">
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-slate-400">TOTAL TRANSAKSI</p>
          <p className="mt-1 text-[20px] font-bold text-slate-900">{filtered.length}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-emerald-600">COCOK</p>
          <p className="mt-1 text-[20px] font-bold text-emerald-600">{cocokCount}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-red-600">SELISIH</p>
          <p className="mt-1 text-[16px] font-bold text-red-600">{formatRupiah(selisihTotal)}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-slate-400">SUSPEK</p>
          <p className="mt-1 text-[20px] font-bold text-amber-600">{filtered.filter((i) => i.status === 'Belum Cocok').length}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari transaksi..." className="h-[38px] w-[280px] rounded-[8px] border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-primary" />
          </div>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,110,253,0.35)] hover:bg-primary-hover">
          <Plus className="h-4 w-4" /> Import Data Bank
        </button>
      </div>

      <div className="rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {['Tanggal', 'Finance', 'Ref Transaksi', 'Jumlah (Sistem)', 'Debit Bank', 'Kredit Bank', 'Status', 'Selisih'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.id} className="h-[60px] border-b border-line last:border-0 hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{i.date}</td>
                  <td className="whitespace-nowrap px-4"><span className="text-[13px] font-medium text-slate-900">{i.finance}</span></td>
                  <td className="whitespace-nowrap px-4 text-[12px] font-mono text-slate-500">{i.transactionRef}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{formatRupiah(i.amount)}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{i.bankDebit > 0 ? formatRupiah(i.bankDebit) : '-'}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{i.bankCredit > 0 ? formatRupiah(i.bankCredit) : '-'}</td>
                  <td className="px-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_COLOR[i.status]}`}>{i.status}</span></td>
                  <td className="whitespace-nowrap px-4 text-[13px] font-semibold text-red-600">{i.discrepancy ? formatRupiah(i.discrepancy) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
