import { Search, Upload } from 'lucide-react'
import { useState } from 'react'
import { PRICE_COMPARISONS } from '../data/priceComparison'
import { formatRupiah } from '../data/sales'

export function KomparasiPage() {
  const [comparisons] = useState(PRICE_COMPARISONS)
  const [query, setQuery] = useState('')

  const filtered = comparisons.filter((c) => {
    if (!query) return true
    const q = query.toLowerCase()
    return c.vehicle.toLowerCase().includes(q) || String(c.year).includes(q)
  })

  const totalSources = new Set(comparisons.flatMap((c) => c.sources.map((s) => s.source))).size

  return (
    <div className="px-4 py-5 lg:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[15px] font-bold text-slate-900">Komparasi Harga Pembelianan</p>
          <p className="text-[12px] text-slate-400">Bandingkan harga dari beberapa sumber/vendor sebelum pembelian</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,110,253,0.35)] hover:bg-primary-hover">
          <Upload className="h-4 w-4" /> Import Spreadsheet
        </button>
      </div>

      <div className="mb-4 rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <p className="text-[12px] text-slate-500">{comparisons.length} unit dianalisis dari {totalSources} sumber harga — perbarui terakhir 24 Sep 2026</p>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari unit..." className="h-[38px] w-[240px] rounded-[8px] border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-primary" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((c) => {
          const sorted = [...c.sources].sort((a, b) => a.price - b.price)
          const minPrice = sorted[0].price
          return (
            <div key={c.id} className="rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="border-b border-line px-4 py-3">
                <p className="text-[13px] font-bold text-slate-900">{c.vehicle} {c.year}</p>
                <p className="text-[11px] text-slate-400">{c.sources.length} sumber harga</p>
              </div>
              <div className="divide-y divide-line">
                {sorted.map((s, idx) => {
                  const diff = s.price - minPrice
                  const isMin = idx === 0
                  const isMax = idx === sorted.length - 1 && sorted.length > 1
                  const label = isMin ? 'Termurah' : isMax ? 'Tertinggi' : 'Murah'
                  return (
                    <div key={s.source} className={`px-4 py-3 ${isMin ? 'bg-emerald-50' : ''}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-slate-900">{s.source}</span>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${isMin ? 'bg-emerald-100 text-emerald-700' : isMax ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>{label}</span>
                        </div>
                        <span className={`text-[13px] font-semibold ${isMin ? 'text-emerald-700' : 'text-slate-800'}`}>{formatRupiah(s.price)}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">{s.date}</span>
                        <span className={`text-[11px] ${isMin ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>{isMin ? 'harga terbaik' : `+${formatRupiah(diff)} vs termurah`}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="border-t border-line px-4 py-3">
                <p className="text-[12px] text-slate-500">Rekomendasi: <span className="font-semibold text-emerald-600">{c.recommendation}</span></p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
