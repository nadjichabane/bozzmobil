import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { INVENTORY, type InventoryUnit } from '../data/inventory'
import { formatRupiah } from '../data/sales'

export function InventoryPage() {
  const [inventory] = useState<InventoryUnit[]>(INVENTORY)
  const [query, setQuery] = useState('')
  const [filterAvailable, setFilterAvailable] = useState('Semua')
  const [filterLocation, setFilterLocation] = useState('Semua Lokasi')

  const locations = ['Semua Lokasi', ...Array.from(new Set(inventory.map((u) => u.storageLocation)))]

  const filtered = inventory.filter((u) => {
    if (filterAvailable === 'Tersedia' && !u.available) return false
    if (filterAvailable === 'Terjual' && u.available) return false
    if (filterLocation !== 'Semua Lokasi' && u.storageLocation !== filterLocation) return false
    if (!query) return true
    const q = query.toLowerCase()
    return u.unit.toLowerCase().includes(q) || u.plate.toLowerCase().includes(q)
  })

  const availableCount = inventory.filter((u) => u.available).length
  const totalValue = inventory.filter((u) => u.available).reduce((s, u) => s + u.askingPrice, 0)

  return (
    <div className="px-4 py-5 lg:px-6">
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-slate-400">TOTAL UNIT</p>
          <p className="mt-1 text-[20px] font-bold text-slate-900">{inventory.length}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-emerald-600">TERSEDIA</p>
          <p className="mt-1 text-[20px] font-bold text-emerald-600">{availableCount}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-slate-400">NILAI STOK</p>
          <p className="mt-1 text-[16px] font-bold text-slate-900">{formatRupiah(totalValue)}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-slate-400">RATA-RATA HARI</p>
          <p className="mt-1 text-[20px] font-bold text-slate-900">{Math.round(inventory.reduce((s, u) => s + u.daysInStock, 0) / inventory.length)} hari</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari unit/nopol..." className="h-[38px] w-[240px] rounded-[8px] border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-primary" />
          </div>
          <select value={filterAvailable} onChange={(e) => setFilterAvailable(e.target.value)} className="h-[38px] rounded-[8px] border border-line bg-white px-3 text-[13px] text-slate-700">
            <option>Semua</option>
            <option>Tersedia</option>
            <option>Terjual</option>
          </select>
          <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="h-[38px] rounded-[8px] border border-line bg-white px-3 text-[13px] text-slate-700">
            {locations.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,110,253,0.35)] hover:bg-primary-hover">
          <Plus className="h-4 w-4" /> Tambah Unit
        </button>
      </div>

      <div className="rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {['Unit', 'Tahun', 'Warna', 'Nopol', 'Lokasi', 'Harga Beli', 'Harga Jual', 'Margin', 'Hari', 'Status'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const margin = ((u.askingPrice - u.acquisitionPrice) / u.acquisitionPrice * 100).toFixed(1)
                return (
                  <tr key={u.id} className="h-[60px] border-b border-line last:border-0 hover:bg-slate-50">
                    <td className="px-4"><span className="text-[13px] font-medium text-slate-900">{u.unit}</span></td>
                    <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{u.year}</td>
                    <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{u.color}</td>
                    <td className="whitespace-nowrap px-4 text-[13px] font-mono text-slate-500">{u.plate}</td>
                    <td className="whitespace-nowrap px-4 text-[12px] text-slate-500">{u.storageLocation}</td>
                    <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{formatRupiah(u.acquisitionPrice)}</td>
                    <td className="whitespace-nowrap px-4 text-[13px] font-semibold text-slate-800">{formatRupiah(u.askingPrice)}</td>
                    <td className="whitespace-nowrap px-4 text-[13px] font-semibold text-emerald-600">+{margin}%</td>
                    <td className="whitespace-nowrap px-4">
                      <span className={`text-[12px] font-medium ${u.daysInStock > 45 ? 'text-red-500' : u.daysInStock > 25 ? 'text-amber-500' : 'text-emerald-600'}`}>{u.daysInStock} hari</span>
                    </td>
                    <td className="px-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${u.available ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{u.available ? 'Tersedia' : 'Terjual'}</span>
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
