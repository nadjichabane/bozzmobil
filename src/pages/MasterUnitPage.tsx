import { Eye, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { type MasterUnit } from '../data/masterUnits'
import { type Purchase } from '../data/purchases'
import { type Sale } from '../data/sales'
import { type Inspection } from '../data/inspections'
import { usePipelineData } from '../context/usePipelineData'
import { formatRupiah, formatRupiahCompact } from '../data/sales'
import { Pagination } from '../components/Pagination'

const PAGE_SIZE = 8

type Stage = {
  purchase: Purchase | undefined
  inspection: Inspection | undefined
  sale: Sale | undefined
}

type Row = MasterUnit & {
  plate: string
  stage: Stage
}

export function MasterUnitPage() {
  const { masterUnits, purchases, sales, inspections } = usePipelineData()

  const [query, setQuery] = useState('')
  const [filterBrand, setFilterBrand] = useState('Semua Brand')
  const [filterStatus, setFilterStatus] = useState('Semua Status')
  const [filterYear, setFilterYear] = useState('Semua Tahun')
  const [filterColor, setFilterColor] = useState('Semua Warna')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Row | null>(null)

  const units: Row[] = useMemo(() => {
    return masterUnits.map((u) => {
      const purchase = purchases.find((p) => p.id === u.id)
      const sale = sales.find((s) => s.id === u.id)
      const inspection = inspections.find((ins) => ins.id === u.id)
      return { ...u, plate: u.car.plate, stage: { purchase, inspection, sale } }
    })
  }, [masterUnits, purchases, sales, inspections])

  const brands = ['Semua Brand', ...Array.from(new Set(units.map((u) => u.brand)))]
  const years = ['Semua Tahun', ...Array.from(new Set(units.map((u) => u.year))).sort((a, b) => b - a).map(String)]
  const colors = ['Semua Warna', ...Array.from(new Set(units.map((u) => u.color)))]

  // Default selected to first available row
  const activeSelected = selected ?? units[0] ?? null

  const statusOf = (r: Row) => (r.available ? 'Tersedia' : r.stage.sale ? 'Terjual' : 'Tersedia')

  const filtered = units.filter((u) => {
    if (filterBrand !== 'Semua Brand' && u.brand !== filterBrand) return false
    if (filterYear !== 'Semua Tahun' && String(u.year) !== filterYear) return false
    if (filterColor !== 'Semua Warna' && u.color !== filterColor) return false
    if (filterStatus !== 'Semua Status' && statusOf(u) !== filterStatus) return false
    if (!query) return true
    const q = query.toLowerCase()
    return (
      u.name.toLowerCase().includes(q) ||
      u.brand.toLowerCase().includes(q) ||
      u.model.toLowerCase().includes(q) ||
      u.plate.toLowerCase().includes(q)
    )
  })

  const totalAvailable = units.filter((u) => u.available).length
  const totalSold = units.filter((u) => !u.available && u.stage.sale).length
  const onInspection = units.filter((u) => u.stage.inspection).length
  const totalMargin = units.reduce((s, u) => s + (u.sellingPrice - u.acquisitionPrice), 0)
  const avgMarginPct = totalMargin / units.reduce((s, u) => s + u.acquisitionPrice, 0)

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const start = (safePage - 1) * PAGE_SIZE
  const rows = filtered.slice(start, start + PAGE_SIZE)

  const kpiCards = [
    { label: 'TOTAL UNIT', value: String(units.length), sub: 'unit terdaftar' },
    { label: 'TERSEDIA', value: String(totalAvailable), sub: 'unit siap jual' },
    { label: 'TERJUAL', value: String(totalSold), sub: 'sudah terjual' },
    { label: 'DALSIN INSPEKSI', value: String(onInspection), sub: 'unit sedang dicek' },
    { label: 'MARGIN RATA-RATA', value: formatRupiahCompact(totalMargin / units.length), sub: `${avgMarginPct.toFixed(1)}% dari harga beli`, accent: true },
  ]

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
          <p className="text-[12px] text-slate-400">Semua status unit terkumpul: pembelian · inspeksi · penjualan</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,110,253,0.35)] hover:bg-primary-hover">
          <Plus className="h-4 w-4" /> Tambah Unit
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {kpiCards.map((c) => (
          <div key={c.label} className="rounded-[12px] border border-line bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <p className="text-[10.5px] font-semibold tracking-[0.04em] text-slate-400">{c.label}</p>
            <p className={`mt-1.5 text-[20px] font-bold leading-tight ${c.accent ? 'text-primary' : 'text-slate-900'}`}>{c.value}</p>
            <p className="mt-1 text-[11px] text-slate-400">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            placeholder="Cari unit, nopol, merek, tipe..."
            className="h-[38px] w-[240px] rounded-[8px] border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-primary"
          />
        </div>
        <select value={filterBrand} onChange={(e) => { setFilterBrand(e.target.value); setPage(1) }} className="h-[38px] rounded-[8px] border border-line bg-white px-3 text-[13px] text-slate-700">
          {brands.map((b) => <option key={b}>{b}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }} className="h-[38px] rounded-[8px] border border-line bg-white px-3 text-[13px] text-slate-700">
          {['Semua Status', 'Tersedia', 'Terjual'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={filterYear} onChange={(e) => { setFilterYear(e.target.value); setPage(1) }} className="h-[38px] rounded-[8px] border border-line bg-white px-3 text-[13px] text-slate-700">
          {years.map((y) => <option key={y}>{y}</option>)}
        </select>
        <select value={filterColor} onChange={(e) => { setFilterColor(e.target.value); setPage(1) }} className="h-[38px] rounded-[8px] border border-line bg-white px-3 text-[13px] text-slate-700">
          {colors.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="mt-4 grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line">
                  {['No', 'PRC', 'Foto', 'Informasi Unit', 'Harga Beli', 'Harga Jual', 'Margin', 'Status', 'Aksi'].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((u, i) => {
                  const margin = u.sellingPrice - u.acquisitionPrice
                  const marginPct = (margin / u.acquisitionPrice) * 100
                  const st = statusOf(u)
                  return (
                    <tr
                      key={u.id}
                      onClick={() => setSelected(u)}
                      className={`h-[64px] cursor-pointer border-b border-line last:border-0 transition ${activeSelected?.id === u.id ? 'bg-primary/5' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-4 text-[13px] text-slate-400">{start + i + 1}</td>
                      <td className="whitespace-nowrap px-4 font-mono text-[12.5px] text-slate-500">{u.chassis.slice(0, 10)}</td>
                      <td className="px-4">
                        <img src={u.imageUrl} alt={u.name} className="h-10 w-16 rounded-[8px] object-cover" />
                      </td>
                      <td className="px-4">
                        <p className="text-[13px] font-semibold text-slate-900">{u.name} {u.year}</p>
                        <p className="text-[11px] text-slate-400">
                          {u.transmission} · {u.color} · {u.plate}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">
                        {u.stage.purchase ? formatRupiah(u.stage.purchase.price) : formatRupiah(u.acquisitionPrice)}
                      </td>
                      <td className="whitespace-nowrap px-4 text-[13px] font-semibold text-slate-800">{formatRupiah(u.sellingPrice)}</td>
                      <td className="whitespace-nowrap px-4">
                        <p className="text-[13px] font-semibold text-emerald-600">{formatRupiah(margin)}</p>
                        <span className="text-[10px] font-medium text-emerald-500">+{marginPct.toFixed(1)}%</span>
                      </td>
                      <td className="px-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${st === 'Tersedia' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{st}</span>
                          {u.stage.inspection && (
                            <span className="inline-flex w-fit rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                              Inspeksi: {u.stage.inspection.status}
                            </span>
                          )}
                          {u.stage.sale && (
                            <span className="inline-flex w-fit rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                              Jual: {u.stage.sale.status}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4">
                        <button type="button" className="text-[13px] font-medium text-primary hover:underline" onClick={(e) => { e.stopPropagation(); setSelected(u) }}>
                          Lihat
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={safePage}
            pageCount={pageCount}
            from={filtered.length === 0 ? 0 : start + 1}
            to={Math.min(start + PAGE_SIZE, filtered.length)}
            total={filtered.length}
            onPageChange={setPage}
          />
        </div>

        {/* Detail panel terintegrasi */}
        {activeSelected && (
          <div className="rounded-[12px] border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-3">
              <img src={activeSelected.imageUrl} alt={activeSelected.name} className="h-14 w-20 rounded-[8px] object-cover" />
              <div>
                <p className="text-[14px] font-bold text-slate-900">{activeSelected.name} {activeSelected.year}</p>
                <p className="text-[11px] text-slate-400">{activeSelected.plate} · {activeSelected.color} · {activeSelected.transmission} · <span className="font-medium text-slate-500">{activeSelected.schemaUnit}</span></p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-[12.5px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Harga Beli</span>
                <span className="font-semibold text-slate-800">
                  {formatRupiah(activeSelected.stage.purchase ? activeSelected.stage.purchase.price : activeSelected.acquisitionPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Harga Jual</span>
                <span className="font-semibold text-slate-800">{formatRupiah(activeSelected.sellingPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kondisi</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${conditionColor(activeSelected.condition)}`}>{activeSelected.condition}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Schema Unit</span>
                <span className="font-semibold text-slate-800">{activeSelected.schemaUnit}</span>
              </div>
            </div>

            <div className="mt-4 border-t border-line pt-4">
              <p className="mb-2 text-[12px] font-semibold text-slate-500">MASTER UNIT — STATUS TERAKHIR</p>
              <div className="space-y-2">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400">Status Mobil</span>
                  <span className="font-medium text-slate-800 text-right">{activeSelected.statusMobilTerakhir}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400">Tanggal Status</span>
                  <span className="font-mono text-slate-600 text-right">{activeSelected.tanggalStatusTerakhir}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400">No. HP Customer</span>
                  <span className="font-mono text-slate-600 text-right">{activeSelected.noHPCustomer}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400">Sumber</span>
                  <span className="text-slate-600 text-right">{activeSelected.sumber}</span>
                </div>
                <div className="rounded-[6px] bg-slate-50 p-2.5 text-[11px] text-slate-500">
                  <p className="mb-1 font-semibold text-slate-400">INFORMASI STATUS TERAKHIR</p>
                  {activeSelected.informasiStatusTerakhir}
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-line pt-4">
              <p className="mb-2 text-[12px] font-semibold text-slate-500">Jejak Status</p>
              <div className="space-y-2">
                <Jejak label="Pembelian" ok={!!activeSelected.stage.purchase} detail={activeSelected.stage.purchase ? `${activeSelected.stage.purchase.invoice} · ${activeSelected.stage.purchase.supplier}` : 'Belum tercatat'} />
                <Jejak label="Inspeksi" ok={!!activeSelected.stage.inspection} detail={activeSelected.stage.inspection ? `${activeSelected.stage.inspection.code} · ${activeSelected.stage.inspection.status}` : 'Belum diinspeksi'} />
                <Jejak label="Penjualan" ok={!!activeSelected.stage.sale} detail={activeSelected.stage.sale ? `${activeSelected.stage.sale.invoice} · ${activeSelected.stage.sale.customer}` : 'Belum terjual'} />
              </div>
            </div>

            <button type="button" className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-[8px] border border-line bg-white px-4 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50">
              <Eye className="h-4 w-4" /> Detail Lengkap
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Jejak({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`h-2 w-2 shrink-0 rounded-full ${ok ? 'bg-emerald-500' : 'bg-slate-300'}`} />
      <span className="w-[80px] text-[11px] font-medium text-slate-500">{label}</span>
      <span className={`min-w-0 flex-1 truncate text-[11px] ${ok ? 'text-slate-700' : 'text-slate-400'}`}>{detail}</span>
    </div>
  )
}
