import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { MASTER_UNITS, type MasterUnit } from '../data/masterUnits'
import { formatRupiah } from '../data/sales'

export function MasterUnitPage() {
  const [units] = useState<MasterUnit[]>(MASTER_UNITS)
  const [query, setQuery] = useState('')
  const [filterBrand, setFilterBrand] = useState('Semua Brand')
  const [filterCondition, setFilterCondition] = useState('Semua Kondisi')

  const brands = ['Semua Brand', ...Array.from(new Set(units.map((u) => u.brand)))]
  const conditions = ['Semua Kondisi', 'Berkondisi Baik', 'Butuh Perbaikan Ringan', 'Butuh Perbaikan Besar']

  const filtered = units.filter((u) => {
    if (filterBrand !== 'Semua Brand' && u.brand !== filterBrand) return false
    if (filterCondition !== 'Semua Kondisi' && u.condition !== filterCondition) return false
    if (!query) return true
    const q = query.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.brand.toLowerCase().includes(q) || u.model.toLowerCase().includes(q)
  })

  const conditionColor = (c: string) => {
    if (c === 'Berkondisi Baik') return 'bg-emerald-50 text-emerald-700'
    if (c === 'Butuh Perbaikan Ringan') return 'bg-amber-50 text-amber-700'
    return 'bg-red-50 text-red-700'
  }

  return (
    <div className="px-4 py-5 lg:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[15px] font-bold text-slate-900">Master Unit</p>
          <p className="text-[12px] text-slate-400">{filtered.length} unit terdaftar</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,110,253,0.35)] hover:bg-primary-hover">
          <Plus className="h-4 w-4" /> Tambah Unit
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari unit..."
            className="h-[38px] w-[240px] rounded-[8px] border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-primary"
          />
        </div>
        <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="h-[38px] rounded-[8px] border border-line bg-white px-3 text-[13px] text-slate-700">
          {brands.map((b) => <option key={b}>{b}</option>)}
        </select>
        <select value={filterCondition} onChange={(e) => setFilterCondition(e.target.value)} className="h-[38px] rounded-[8px] border border-line bg-white px-3 text-[13px] text-slate-700">
          {conditions.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {['Unit', 'Brand', 'Tahun', 'Warna', 'Transmisi', 'CC', 'Harga Beli', 'Harga Jual', 'Margin', 'Kondisi', 'Stok'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const margin = ((u.sellingPrice - u.acquisitionPrice) / u.acquisitionPrice * 100).toFixed(1)
                return (
                  <tr key={u.id} className="h-[60px] border-b border-line last:border-0 hover:bg-slate-50">
                    <td className="px-4"><span className="text-[13px] font-medium text-slate-900">{u.name}</span></td>
                    <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{u.brand}</td>
                    <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{u.year}</td>
                    <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{u.color}</td>
                    <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{u.transmission}</td>
                    <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{u.cc.toLocaleString('id-ID')}</td>
                    <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{formatRupiah(u.acquisitionPrice)}</td>
                    <td className="whitespace-nowrap px-4 text-[13px] font-semibold text-slate-800">{formatRupiah(u.sellingPrice)}</td>
                    <td className="whitespace-nowrap px-4 text-[13px] font-semibold text-emerald-600">+{margin}%</td>
                    <td className="px-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${conditionColor(u.condition)}`}>{u.condition}</span></td>
                    <td className="px-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${u.available ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{u.available ? 'Tersedia' : 'Terjual'}</span></td>
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
