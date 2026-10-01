import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { WAREHOUSE_ITEMS, STOCK_MOVES } from '../data/warehouse'

const CATEGORIES = ['Semua Kategori', 'Sparepart', 'Aksesoris', 'Kelengkapan Unit', 'Konsumables']

export function GudangPage() {
  const [items] = useState(WAREHOUSE_ITEMS)
  const [moves] = useState(STOCK_MOVES)
  const [query, setQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('Semua Kategori')

  const totalItems = items.length
  const lowStock = items.filter((i) => i.stock < i.minStock).length
  const totalMoves = moves.length
  const totalStock = items.reduce((s, i) => s + i.stock, 0)

  const filtered = items.filter((i) => {
    if (filterCategory !== 'Semua Kategori' && i.category !== filterCategory) return false
    if (!query) return true
    const q = query.toLowerCase()
    return i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q)
  })

  const filteredMoves = moves.filter((m) => {
    if (!query) return true
    const q = query.toLowerCase()
    return m.item.toLowerCase().includes(q) || m.by.toLowerCase().includes(q) || m.ref.toLowerCase().includes(q)
  })

  return (
    <div className="px-4 py-5 lg:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[15px] font-bold text-slate-900">Gudang / Inventory Barang</p>
          <p className="text-[12px] text-slate-400">{totalItems} item terdaftar · monitoring stok & mutasi barang</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,110,253,0.35)] hover:bg-primary-hover">
          <Plus className="h-4 w-4" /> Tambah Barang
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-slate-400">TOTAL ITEM</p>
          <p className="mt-1 text-[20px] font-bold text-slate-900">{totalItems}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-red-500">STOK RENDAH</p>
          <p className="mt-1 text-[20px] font-bold text-red-500">{lowStock}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-slate-400">MUTASI 7 HARI</p>
          <p className="mt-1 text-[20px] font-bold text-slate-900">{totalMoves}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-emerald-600">NILAI PERSEDIAAN</p>
          <p className="mt-1 text-[20px] font-bold text-emerald-600">{totalStock}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari barang/kode..." className="h-[38px] w-[260px] rounded-[8px] border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-primary" />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="h-[38px] rounded-[8px] border border-line bg-white px-3 text-[13px] text-slate-700">
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {['Kode', 'Nama', 'Kategori', 'Stok', 'Stok Min', 'Satuan', 'Lokasi', 'Supplier'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => {
                const isLow = i.stock < i.minStock
                return (
                  <tr key={i.id} className="h-[60px] border-b border-line last:border-0 hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 text-[13px] font-mono text-slate-500">{i.code}</td>
                    <td className="px-4"><span className="text-[13px] font-medium text-slate-900">{i.name}</span></td>
                    <td className="whitespace-nowrap px-4 text-[12px] text-slate-500">{i.category}</td>
                    <td className="whitespace-nowrap px-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${isLow ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>{i.stock} {i.unit}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{i.minStock}</td>
                    <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{i.unit}</td>
                    <td className="whitespace-nowrap px-4 text-[12px] text-slate-500">{i.location}</td>
                    <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{i.supplier}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mb-3 mt-6 text-[13px] font-bold text-slate-900">Histori Perubahan Stok</p>
      <div className="mb-4 rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {['Item', 'Tipe', 'Jumlah', 'Tanggal', 'Oleh', 'Ref.'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredMoves.map((m) => (
                <tr key={m.id} className="h-[60px] border-b border-line last:border-0 hover:bg-slate-50">
                  <td className="px-4"><span className="text-[13px] font-medium text-slate-900">{m.item}</span></td>
                  <td className="px-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${m.type === 'Masuk' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{m.type}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{m.qty}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{m.date}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{m.by}</td>
                  <td className="whitespace-nowrap px-4 text-[12px] font-mono text-slate-500">{m.ref}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
