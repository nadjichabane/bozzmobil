import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { PURCHASES, type Purchase } from '../data/purchases'
import { formatRupiah } from '../data/sales'

const STATUS_COLOR: Record<string, string> = {
  Selesai: 'bg-emerald-50 text-emerald-700',
  Diproses: 'bg-blue-50 text-blue-700',
  Dibatalkan: 'bg-red-50 text-red-700',
}

export function PembelianPage() {
  const [purchases] = useState<Purchase[]>(PURCHASES)
  const [query, setQuery] = useState('')

  const filtered = purchases.filter((p) => {
    if (!query) return true
    const q = query.toLowerCase()
    return p.invoice.toLowerCase().includes(q) || p.unit.toLowerCase().includes(q) || p.supplier.toLowerCase().includes(q)
  })

  return (
    <div className="px-4 py-5 lg:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[15px] font-bold text-slate-900">Data Pembelian</p>
          <p className="text-[12px] text-slate-400">{filtered.length} transaksi pembelian unit</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,110,253,0.35)] hover:bg-primary-hover">
          <Plus className="h-4 w-4" /> Tambah Pembelian
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari invoice, unit, supplier..." className="h-[38px] w-[300px] rounded-[8px] border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-primary" />
        </div>
      </div>

      <div className="rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {['No. Invoice', 'Tanggal', 'Unit', 'Nopol', 'Supplier', 'Harga Beli', 'Biaya Admin', 'Metode Bayar', 'Status'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="h-[60px] border-b border-line last:border-0 hover:bg-slate-50">
                  <td className="px-4"><span className="text-[13px] font-medium text-primary">{p.invoice}</span></td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{p.date}</td>
                  <td className="px-4"><span className="text-[13px] font-medium text-slate-900">{p.unit}</span></td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-500 font-mono">{p.plate}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{p.supplier}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] font-semibold text-slate-800">{formatRupiah(p.price)}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-500">{formatRupiah(p.adminFee)}</td>
                  <td className="whitespace-nowrap px-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${p.paymentMethod === 'Transfer' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>{p.paymentMethod}</span></td>
                  <td className="px-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_COLOR[p.status]}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
