import { Plus, Search, X } from 'lucide-react'
import { useState } from 'react'
import {
  LEADS,
  LEAD_SOURCES,
  LEAD_STATUSES,
  type Lead,
  type LeadInput,
} from '../data/leads'
import { formatRupiah } from '../data/sales'
import { Pagination } from '../components/Pagination'

const PAGE_SIZE = 8

const emptyForm: LeadInput = {
  status: 'Baru',
  customer: '',
  phone: '',
  address: '',
  plate: '',
  carType: '',
  year: new Date().getFullYear(),
  mileage: undefined,
  source: 'Iklan Online',
  expectedPrice: undefined,
  note: '',
}

const statusColor = (s: Lead['status']) => {
  switch (s) {
    case 'Baru':
      return 'bg-blue-50 text-blue-700'
    case 'Dijadwalkan':
      return 'bg-indigo-50 text-indigo-700'
    case 'Dalam Inspeksi':
      return 'bg-amber-50 text-amber-700'
    case 'Selesai':
      return 'bg-emerald-50 text-emerald-700'
    default:
      return 'bg-red-50 text-red-700'
  }
}

export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(LEADS)
  const [query, setQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('Semua Status')
  const [filterSource, setFilterSource] = useState('Semua Sumber')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Lead | null>(leads[0])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<LeadInput>(emptyForm)

  const nextCode = () => {
    const n = leads.length + 1
    const d = new Date()
    const pad = (x: number) => String(x).padStart(2, '0')
    return `LD-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${String(n).padStart(3, '0')}`
  }

  const submitLead = () => {
    if (!form.customer.trim() || !form.plate.trim()) return
    const lead: Lead = {
      ...form,
      id: String(Date.now()),
      code: nextCode(),
      createdAt: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    }
    setLeads((prev) => [lead, ...prev])
    setSelected(lead)
    setShowForm(false)
    setForm(emptyForm)
    setPage(1)
  }

  const sources = ['Semua Sumber', ...LEAD_SOURCES]
  const statuses = ['Semua Status', ...LEAD_STATUSES]

  const filtered = leads.filter((l) => {
    if (filterStatus !== 'Semua Status' && l.status !== filterStatus) return false
    if (filterSource !== 'Semua Sumber' && l.source !== filterSource) return false
    if (!query) return true
    const q = query.toLowerCase()
    return (
      l.customer.toLowerCase().includes(q) ||
      l.plate.toLowerCase().includes(q) ||
      l.carType.toLowerCase().includes(q) ||
      l.phone.toLowerCase().includes(q)
    )
  })

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const start = (safePage - 1) * PAGE_SIZE
  const rows = filtered.slice(start, start + PAGE_SIZE)

  const kpi = {
    total: leads.length,
    scheduled: leads.filter((l) => l.status === 'Dijadwalkan').length,
    inProgress: leads.filter((l) => l.status === 'Dalam Inspeksi').length,
    done: leads.filter((l) => l.status === 'Selesai').length,
    rejected: leads.filter((l) => l.status === 'Ditolak').length,
  }

  const kpiCards = [
    { label: 'TOTAL LEADS', value: String(kpi.total), sub: 'mobil masuk untuk inspeksi', accent: true },
    { label: 'DIJADWALKAN', value: String(kpi.scheduled), sub: 'menunggu jadwal inspeksi' },
    { label: 'DALAM INSPEKSI', value: String(kpi.inProgress), sub: 'sedang dicek tim' },
    { label: 'SELESAI', value: String(kpi.done), sub: 'inspeksi tuntas' },
    { label: 'DITOLAK', value: String(kpi.rejected), sub: 'tidak direkomendasikan' },
  ]

  const set = <K extends keyof LeadInput>(key: K, value: LeadInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  return (
    <div className="px-4 py-5 lg:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[15px] font-bold text-slate-900">Leads Inspeksi</p>
          <p className="text-[12px] text-slate-400">Daftar mobil yang akan diinspeksi — masuk ke antrian tim inspeksi</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,110,253,0.35)] hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" /> Tambah Leads
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
            placeholder="Cari nama, nopol, tipe, no. hp..."
            className="h-[38px] w-[240px] rounded-[8px] border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-primary"
          />
        </div>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }} className="h-[38px] rounded-[8px] border border-line bg-white px-3 text-[13px] text-slate-700">
          {statuses.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={filterSource} onChange={(e) => { setFilterSource(e.target.value); setPage(1) }} className="h-[38px] rounded-[8px] border border-line bg-white px-3 text-[13px] text-slate-700">
          {sources.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="mt-4 grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line">
                  {['No', 'Kode', 'Pelanggan', 'Mobil', 'Nopol', 'Tahun', 'Sumber', 'Status', 'Aksi'].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((l, i) => (
                  <tr
                    key={l.id}
                    onClick={() => setSelected(l)}
                    className={`h-[60px] cursor-pointer border-b border-line last:border-0 transition ${selected?.id === l.id ? 'bg-primary/5' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-4 text-[13px] text-slate-400">{start + i + 1}</td>
                    <td className="whitespace-nowrap px-4 font-mono text-[12px] text-slate-500">{l.code}</td>
                    <td className="px-4">
                      <p className="text-[13px] font-semibold text-slate-900">{l.customer}</p>
                      <p className="text-[11px] text-slate-400">{l.phone}</p>
                    </td>
                    <td className="px-4">
                      <p className="text-[13px] text-slate-800">{l.carType}</p>
                      {l.mileage ? <p className="text-[11px] text-slate-400">{l.mileage.toLocaleString('id-ID')} km</p> : null}
                    </td>
                    <td className="whitespace-nowrap px-4 font-mono text-[12.5px] text-slate-600">{l.plate}</td>
                    <td className="px-4 text-[13px] text-slate-600">{l.year}</td>
                    <td className="px-4 text-[12px] text-slate-500">{l.source}</td>
                    <td className="px-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColor(l.status)}`}>{l.status}</span>
                    </td>
                    <td className="px-4">
                      <button type="button" className="text-[13px] font-medium text-primary hover:underline" onClick={(e) => { e.stopPropagation(); setSelected(l) }}>
                        Lihat
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-[13px] text-slate-400">Belum ada leads yang cocok.</td>
                  </tr>
                )}
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

        {selected && (
          <div className="rounded-[12px] border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-[11px] text-slate-400">{selected.code}</p>
                <p className="text-[14px] font-bold text-slate-900">{selected.customer}</p>
                <p className="text-[11px] text-slate-400">{selected.phone}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColor(selected.status)}`}>{selected.status}</span>
            </div>

            <div className="mt-4 space-y-2.5 text-[12.5px]">
              <DetailRow label="Alamat" value={selected.address} />
              <DetailRow label="Mobil" value={`${selected.carType} ${selected.year}${selected.mileage ? ` · ${selected.mileage.toLocaleString('id-ID')} km` : ''}`} />
              <DetailRow label="Nopol" value={selected.plate} mono />
              <DetailRow label="Sumber" value={selected.source} />
              {selected.expectedPrice != null && <DetailRow label="Estimasi Harga" value={formatRupiah(selected.expectedPrice)} />}
            </div>

            {selected.note && (
              <div className="mt-4 rounded-[8px] bg-slate-50 p-3 text-[12px] text-slate-600">
                <p className="mb-1 text-[11px] font-semibold text-slate-400">CATATAN</p>
                {selected.note}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button type="button" className="flex-1 rounded-[8px] bg-primary px-3 py-2 text-[12.5px] font-semibold text-white hover:bg-primary-hover">
                Jadwalkan Inspeksi
              </button>
              <button type="button" className="rounded-[8px] border border-line px-3 py-2 text-[12.5px] font-medium text-slate-600 hover:bg-slate-50">
                Hapus
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setShowForm(false)} />
          <div className="relative max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-[12px] bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[14px] font-bold text-slate-900">Tambah Leads Inspeksi</p>
                <p className="text-[11px] text-slate-400">Data mobil yang akan masuk daftar inspeksi tim</p>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <Field label="Nama Pelanggan">
                <input value={form.customer} onChange={(e) => set('customer', e.target.value)} className={input} placeholder="cth. Budi Santoso" />
              </Field>
              <Field label="No. HP">
                <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={input} placeholder="08xx-xxxx-xxxx" />
              </Field>
              <Field label="Alamat" wide>
                <input value={form.address} onChange={(e) => set('address', e.target.value)} className={input} placeholder="Alamat lengkap" />
              </Field>
              <Field label="No. Polisi">
                <input value={form.plate} onChange={(e) => set('plate', e.target.value)} className={input} placeholder="B 1234 ABC" />
              </Field>
              <Field label="Jenis / Tipe Mobil">
                <input value={form.carType} onChange={(e) => set('carType', e.target.value)} className={input} placeholder="cth. Honda City" />
              </Field>
              <Field label="Tahun Kendaraan">
                <input type="number" value={form.year} onChange={(e) => set('year', Number(e.target.value))} className={input} />
              </Field>
              <Field label="Tahun Kilometer">
                <input type="number" value={form.mileage ?? ''} onChange={(e) => set('mileage', e.target.value ? Number(e.target.value) : undefined)} className={input} placeholder="opsional" />
              </Field>
              <Field label="Sumber Leads">
                <select value={form.source} onChange={(e) => set('source', e.target.value as LeadInput['source'])} className={input}>
                  {LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Estimasi Harga">
                <input type="number" value={form.expectedPrice ?? ''} onChange={(e) => set('expectedPrice', e.target.value ? Number(e.target.value) : undefined)} className={input} placeholder="opsional" />
              </Field>
              <Field label="Status Awal">
                <select value={form.status} onChange={(e) => set('status', e.target.value as LeadInput['status'])} className={input}>
                  {LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Catatan" wide>
                <textarea value={form.note ?? ''} onChange={(e) => set('note', e.target.value)} rows={2} className={input} placeholder="Keterangan tambahan (opsional)" />
              </Field>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-[8px] border border-line px-4 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50">
                Batal
              </button>
              <button
                type="button"
                onClick={submitLead}
                disabled={!form.customer.trim() || !form.plate.trim()}
                className="rounded-[8px] bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Simpan Leads
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const input =
  'w-full rounded-[8px] border border-line bg-white px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-primary'

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${wide ? 'col-span-2' : ''}`}>
      <span className="mb-1 block text-[11.5px] font-medium text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="shrink-0 text-slate-400">{label}</span>
      <span className={`text-right text-slate-700 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}
