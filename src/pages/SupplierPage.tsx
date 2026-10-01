import { Eye, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { SUPPLIERS, type Supplier } from '../data/suppliers'
import { computeSupplierKpis, supplierAge, supplierCharts } from '../data/suppliersAnalytics'
import { DonutChart } from '../components/DonutChart'
import { Pagination } from '../components/Pagination'
import { formatRupiahCompact } from '../data/sales'

const PAGE_SIZE = 8

export function SupplierPage() {
  const [suppliers] = useState<Supplier[]>(SUPPLIERS)
  const [query, setQuery] = useState('')
  const [filterKota, setFilterKota] = useState('Semua Kota')
  const [filterStatus, setFilterStatus] = useState('Semua Status')
  const [filterProfesi, setFilterProfesi] = useState('Semua Profesi')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Supplier>(SUPPLIERS[0])

  const kotas = ['Semua Kota', ...Array.from(new Set(suppliers.map((s) => s.kota).filter(Boolean) as string[]))]
  const professions = ['Semua Profesi', ...Array.from(new Set(suppliers.map((s) => s.profesi).filter(Boolean) as string[]))]
  const statuses = ['Semua Status', 'Aktif', 'Nonaktif']

  const filtered = suppliers.filter((s) => {
    if (filterKota !== 'Semua Kota' && s.kota !== filterKota) return false
    if (filterProfesi !== 'Semua Profesi' && s.profesi !== filterProfesi) return false
    if (filterStatus !== 'Semua Status' && (s.status ?? 'Aktif') !== filterStatus) return false
    if (!query) return true
    const q = query.toLowerCase()
    return (
      s.name.toLowerCase().includes(q) ||
      s.company.toLowerCase().includes(q) ||
      s.contact.toLowerCase().includes(q) ||
      (s.kota ?? '').toLowerCase().includes(q)
    )
  })

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const start = (safePage - 1) * PAGE_SIZE
  const rows = filtered.slice(start, start + PAGE_SIZE)

  const k = computeSupplierKpis(suppliers)
  const { profSlices, ageSlices } = supplierCharts(suppliers)

  const kpiCards = [
    { label: 'TOTAL SUPPLIER', value: String(k.total), sub: `${k.total} supplier terdaftar`, color: '#0D6EFD' },
    { label: 'SUPPLIER REPEAT', value: `${k.repeat}`, pct: `(${k.repeatPct}%)`, sub: 'repeat order', color: '#22C55E' },
    { label: 'SUPPLIER BARU', value: `${k.isNew}`, pct: `(${k.newPct}%)`, sub: 'supplier baru', color: '#F59E0B' },
    { label: 'TOTAL PEMBELIAN', value: formatRupiahCompact(k.totalValue), sub: 'akumulasi pembelian', color: '#8B5CF6' },
    { label: 'TOTAL TRANSAKSI', value: String(k.totalTx), sub: 'transaksi unit masuk', color: '#06B6D4' },
  ]

  const selDetail = {
    kota: selected.kota,
    profesi: selected.profesi,
    birthDate: selected.birthDate,
  }
  const selAge = selected.birthDate ? supplierAge(selected.birthDate) : null

  return (
    <div className="px-4 py-5 lg:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[15px] font-bold text-slate-900">Master Supplier</p>
          <p className="text-[12px] text-slate-400">Kelola data supplier dan riwayat pembelian</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,110,253,0.35)] hover:bg-primary-hover">
          <Plus className="h-4 w-4" /> Tambah Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {kpiCards.map((c) => (
          <div key={c.label} className="rounded-[12px] border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px]" style={{ background: `${c.color}1A` }}>
                <span className="h-3 w-3 rounded-[4px]" style={{ background: c.color }} />
              </span>
              <p className="text-[10.5px] font-semibold tracking-[0.04em] text-slate-400">{c.label}</p>
            </div>
            <p className="mt-2.5 flex items-baseline gap-1 text-[19px] font-bold leading-tight text-slate-900">
              {c.value}
              {c.pct && <span className="text-[12px] font-semibold text-slate-500">{c.pct}</span>}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
                placeholder="Cari nama, kontak, kota..."
                className="h-[38px] w-[260px] rounded-[8px] border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-primary"
              />
            </div>
            <select value={filterKota} onChange={(e) => { setFilterKota(e.target.value); setPage(1) }} className="h-[38px] rounded-[8px] border border-line bg-white px-3 text-[13px] text-slate-700">
              {kotas.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select value={filterProfesi} onChange={(e) => { setFilterProfesi(e.target.value); setPage(1) }} className="h-[38px] rounded-[8px] border border-line bg-white px-3 text-[13px] text-slate-700">
              {professions.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }} className="h-[38px] rounded-[8px] border border-line bg-white px-3 text-[13px] text-slate-700">
              {statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button type="button" className="h-[38px] rounded-[8px] border border-line bg-white px-4 text-[13px] font-medium text-slate-600 hover:bg-slate-50">
              Filter
            </button>
          </div>

          <div className="overflow-hidden rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line">
                    {['No', 'Nama Supplier', 'Kontak', 'Tanggal Lahir', 'Kota', 'Profesi', 'Total Pembelian', 'Total Transaksi', 'Status', 'Aksi'].map((h) => (
                      <th key={h} className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s, i) => {
                    const age = s.birthDate ? supplierAge(s.birthDate) : null
                    return (
                      <tr key={s.id} className={`h-[60px] border-b border-line last:border-0 hover:bg-slate-50 ${selected.id === s.id ? 'bg-primary/5' : ''}`}>
                        <td className="px-4 text-[13px] text-slate-400">{start + i + 1}</td>
                        <td className="px-4">
                          <p className="text-[13px] font-semibold text-slate-900">{s.name}</p>
                          <p className="text-[11px] text-slate-400">{s.company}</p>
                        </td>
                        <td className="px-4">
                          <p className="text-[13px] text-slate-600">{s.contact}</p>
                          <p className="text-[11px] text-slate-400">{s.phone}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">
                          {s.birthDate}
                          {age !== null && <span className="text-slate-400"> ({age} th)</span>}
                        </td>
                        <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{s.kota}</td>
                        <td className="px-4">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">{s.profesi}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 text-[13px] font-semibold text-slate-800">{formatRupiahCompact(s.totalValue)}</td>
                        <td className="whitespace-nowrap px-4 text-[13px] font-medium text-slate-800">{s.totalSupplied} transaksi</td>
                        <td className="px-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${(s.status ?? 'Aktif') === 'Aktif' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {s.status ?? 'Aktif'}
                          </span>
                        </td>
                        <td className="px-4">
                          <button
                            type="button"
                            onClick={() => setSelected(s)}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-[8px] border ${selected.id === s.id ? 'border-primary bg-primary text-white' : 'border-line bg-white text-slate-500 hover:bg-slate-50'}`}
                            aria-label={`Lihat detail ${s.name}`}
                          >
                            <Eye className="h-4 w-4" />
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
        </div>

        <div className="space-y-4">
          <div className="rounded-[12px] border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <p className="text-[14px] font-semibold text-slate-900">Detail Supplier</p>
            <p className="mt-2 text-[16px] font-bold text-slate-900">{selected.name}</p>
            <p className="mt-0.5 text-[12px] text-slate-400">{selected.company} · {selDetail.profesi}</p>

            <div className="mt-4 space-y-2.5 text-[12.5px] text-slate-600">
              <p className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-slate-300" /> {selected.contact} · {selected.phone}</p>
              <p className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-slate-300" /> {selected.email}</p>
              <p className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-slate-300" /> {selDetail.kota}</p>
            </div>

            <div className="mt-4 border-t border-line pt-4">
              <p className="mb-1.5 text-[12px] font-semibold text-slate-500">Informasi Lahir</p>
              <p className="text-[12.5px] text-slate-600">
                {selDetail.birthDate}
                {selAge !== null && <span className="text-slate-400"> (umur {selAge} tahun)</span>}
              </p>
            </div>

            <div className="mt-4 border-t border-line pt-4">
              <p className="mb-1.5 text-[12px] font-semibold text-slate-500">Ringkasan</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[8px] bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-400">Total Pembelian</p>
                  <p className="text-[13.5px] font-bold text-slate-900">{formatRupiahCompact(selected.totalValue)}</p>
                </div>
                <div className="rounded-[8px] bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-400">Total Transaksi</p>
                  <p className="text-[13.5px] font-bold text-slate-900">{selected.totalSupplied} transaksi</p>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-line pt-4">
              <p className="mb-2 text-[12px] font-semibold text-slate-500">Riwayat Pembelian Terakhir</p>
              <div className="flex items-center gap-3">
                <img src="/cars/fortuner.jpg" alt="unit terakhir" className="h-14 w-20 rounded-[8px] object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-slate-900">Toyota Fortuner 2.4 VRZ</p>
                  <p className="text-[11.5px] text-slate-400">15/09/2026</p>
                </div>
                <p className="shrink-0 text-[12.5px] font-bold text-slate-900">Rp 310jt</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DonutChart title="Supplier Berdasarkan Profesi" subtitle="Distribusi profesi supplier" slices={profSlices} />
        <DonutChart title="Supplier Berdasarkan Range Umur" subtitle="Rentang usia supplier" slices={ageSlices} />
      </div>
    </div>
  )
}
