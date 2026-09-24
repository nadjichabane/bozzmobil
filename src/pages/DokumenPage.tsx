import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { DOC_ITEMS, type DocItem } from '../data/dokumen'

const STATUS_COLOR: Record<string, string> = {
  Lengkap: 'bg-emerald-50 text-emerald-700',
  'Belum Lengkap': 'bg-red-50 text-red-700',
  'Dalam Proses': 'bg-blue-50 text-blue-700',
}

const DOC_ICON: Record<string, string> = {
  STNK: 'bg-blue-50 text-blue-700',
  BPKB: 'bg-purple-50 text-purple-700',
  KTP: 'bg-amber-50 text-amber-700',
  KK: 'bg-pink-50 text-pink-700',
  FP: 'bg-emerald-50 text-emerald-700',
  Bon: 'bg-slate-50 text-slate-700',
}

export function DokumenPage() {
  const [docs] = useState<DocItem[]>(DOC_ITEMS)
  const [query, setQuery] = useState('')

  const filtered = docs.filter((d) => {
    if (!query) return true
    const q = query.toLowerCase()
    return d.unit.toLowerCase().includes(q) || d.plate.toLowerCase().includes(q) || d.documentType.toLowerCase().includes(q)
  })

  return (
    <div className="px-4 py-5 lg:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[15px] font-bold text-slate-900">Dokumen Kendaraan</p>
          <p className="text-[12px] text-slate-400">{filtered.length} dokumen tercatat</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,110,253,0.35)] hover:bg-primary-hover">
          <Plus className="h-4 w-4" /> Tambah Dokumen
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari dokumen..." className="h-[38px] w-[300px] rounded-[8px] border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-primary" />
        </div>
      </div>

      <div className="rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {['Unit', 'Nopol', 'Jenis Dokumen', 'Status', 'Kadaluarsa', 'Update Terakhir', 'Catatan'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="h-[60px] border-b border-line last:border-0 hover:bg-slate-50">
                  <td className="px-4 max-w-[180px] truncate text-[13px] font-medium text-slate-900" title={d.unit}>{d.unit}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] font-mono text-slate-500">{d.plate}</td>
                  <td className="px-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${DOC_ICON[d.documentType]}`}>{d.documentType}</span>
                  </td>
                  <td className="px-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_COLOR[d.status]}`}>{d.status}</span></td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{d.expiryDate || '-'}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{d.lastUpdated}</td>
                  <td className="px-4 max-w-[200px] truncate text-[13px] text-slate-500">{d.remarks || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
