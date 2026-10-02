import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import type { NavId } from '../components/Sidebar'
import {
  type Inspection,
  type Finding,
  countBySeverity,
  recommend,
} from '../data/inspections'
import { usePipelineData } from '../context/usePipelineData'
import { formatRupiah } from '../data/sales'

const INPUT =
  'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-slate-700 outline-none focus:border-primary'

function severityStyle(sev: Finding['severity']): string {
  if (sev === 'Major') return 'bg-red-100 text-red-700 border-red-200'
  if (sev === 'Minor') return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-slate-100 text-slate-600 border-slate-200'
}

function statusStyle(st: Inspection['status']): string {
  if (st === 'Selesai') return 'bg-emerald-100 text-emerald-700'
  if (st === 'Dalam Inspeksi') return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-500'
}

function recommendationStyle(rec: string): string {
  if (rec === 'Certified') return 'bg-emerald-100 text-emerald-700'
  if (rec === 'Value') return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

export default function InspectionPage({ onNavigate }: { onNavigate: (id: NavId) => void }) {
  const { inspections, advance } = usePipelineData()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('Semua')
  const [selected, setSelected] = useState<Inspection | null>(inspections[0])
  const [reason, setReason] = useState(selected?.reason ?? '')

  const q = query.trim().toLowerCase()
  const statuses = ['Semua', 'Dalam Inspeksi', 'Selesai', 'Draft']
  const list = useMemo(
    () =>
      inspections.filter(i => {
        const matchQ = !q || `${i.id} ${i.code} ${i.unit} ${i.customer}`.toLowerCase().includes(q)
        const matchStatus = status === 'Semua' || i.status === status
        return matchQ && matchStatus
      }),
    [q, status, inspections]
  )

  const rec = useMemo(
    () => (selected ? recommend({ ...countBySeverity(selected.findings) }) : ''),
    [selected]
  )
  const openFindings = selected?.findings.filter(f => f.severity !== 'Catatan') ?? []

  const doAdvance = (next: 'purchasing' | 'rejected') => {
    if (!selected) return
    advance(selected.id, next)
    onNavigate(next === 'purchasing' ? 'transaksi' : 'leads')
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 md:p-6">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-slate-900">Inspeksi & Leads</h1>
        <p className="text-[12px] text-slate-400">
          Item cek fisik, temuan, catatan, rekomendasi keputusan; mobil masuk dari daftar Leads Inspeksi
        </p>
      </div>

      <div className="grid flex-1 grid-cols-1 items-start gap-4 xl:grid-cols-[400px_1fr]">
        {/* ---------- LEFT: List Inspeksi ---------- */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-[12px] font-semibold text-slate-700">DATA INSPEKSI</h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {list.length}
            </span>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            <label className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Cari kode / nopol / unit..."
                className={INPUT + ' pl-8'}
              />
            </label>
            <select value={status} onChange={e => setStatus(e.target.value)} className={INPUT}>
              {statuses.map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="mt-3 flex flex-col gap-1.5">
            {list.length === 0 && (
              <p className="py-6 text-center text-[12px] text-slate-400">Tidak ada hasil inspeksi</p>
            )}
            {list.map(i => {
              const s = countBySeverity(i.findings)
              const active = selected?.id === i.id
              return (
                <button
                  key={i.id}
                  onClick={() => {
                    setSelected(i)
                    setReason(i.reason)
                  }}
                  className={
                    'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ' +
                    (active
                      ? 'border-primary/30 bg-blue-50/60'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50')
                  }
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-slate-800">
                      {i.code} · {i.unit}
                    </p>
                    <p className="truncate text-[10px] text-slate-400">
                      {i.unitMeta} · {i.customer}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-[10px] font-medium">
                      {s.major > 0 && <span className="text-red-600">M{s.major}</span>}
                      {s.minor > 0 && <span className="text-amber-600">m{s.minor}</span>}
                      {s.catatan > 0 && <span className="text-slate-400">c{s.catatan}</span>}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle(i.status)}`}>
                      {i.status}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* ---------- RIGHT: Detail Result ---------- */}
        {selected ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {/* detail header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[14px] font-semibold text-slate-800">
                {selected.code} · {selected.unit}
              </h3>
              <p className="text-[12px] text-slate-400">
                {selected.unitMeta} · {formatRupiah(selected.marketPrice)}
                {selected.priceAllIn ? ' · All in' : ''}
              </p>
            </div>
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-500 hover:bg-slate-50">
              EXPORT PDF
            </button>
          </div>

          {/* summary strip */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="text-[11px] text-slate-500">
              Inspeksi: <b className="text-slate-700">{selected.inspector}</b>
            </span>
            <span className="text-[11px] text-slate-500">
              Progress: <b className="text-slate-700">{selected.pointsDone}/{selected.totalPoints}</b>
            </span>
            <span className="ml-auto flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
              REKOMENDASI:
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${recommendationStyle(rec)}`}
              >
                {rec || '—'}
              </span>
            </span>
          </div>

          {/* categories progress */}
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[12px] font-semibold text-slate-700">ITEM CHECKLIST</h4>
              <span className="text-[11px] text-slate-400">
                {selected.pointsDone} / {selected.totalPoints} item selesai
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
              {selected.categories.map(c => {
                const pct = c.total === 0 ? 0 : Math.round((c.done / c.total) * 100)
                const complete = c.done === c.total
                return (
                  <div key={c.id} className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-medium text-slate-600">{c.label}</span>
                      <span className={complete ? 'text-emerald-600' : 'text-slate-400'}>
                        {c.done}/{c.total}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={
                          'h-full rounded-full ' +
                          (complete ? 'bg-emerald-500' : 'bg-amber-500')
                        }
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* findings table */}
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <h4 className="text-[12px] font-semibold text-slate-700">FINDINGS</h4>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                {openFindings.length} perlu perhatian
              </span>
            </div>

            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400">
                    <th className="px-2 py-2 font-medium">Temuan</th>
                    <th className="px-2 py-2 font-medium">Sistem</th>
                    <th className="px-2 py-2 font-medium">Sev.</th>
                    <th className="px-2 py-2 font-medium">Foto</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.findings.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-2 py-4 text-[12px] text-slate-400">
                        Tidak ada temuan
                      </td>
                    </tr>
                  )}
                  {selected.findings.map(f => (
                    <tr key={f.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-2 py-2">
                        <p className="text-[12px] font-medium text-slate-700">{f.title}</p>
                        <p className="text-[10px] text-slate-400">{f.description}</p>
                      </td>
                      <td className="px-2 py-2 text-[12px] text-slate-600">{f.system}</td>
                      <td className="px-2 py-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${severityStyle(f.severity)}`}
                        >
                          {f.severity}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-[12px] text-slate-600">{f.photoCount} foto</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* detail cards */}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-3">
              <h5 className="text-[11px] font-semibold text-slate-500">CUSTOMER & PIC</h5>
              <div className="mt-1 space-y-1 text-[12px] text-slate-700">
                <p>Kustomer: <b>{selected.customer}</b></p>
                <p>PIC Internal: <b>{selected.picInternal}</b> · {selected.picPhone}</p>
                <p>Mediator: <b>{selected.mediator}</b> · {selected.mediatorPhone}</p>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <h5 className="text-[11px] font-semibold text-slate-500">REASONS / KETERANGAN</h5>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-[12px] text-slate-700 outline-none focus:border-primary"
                placeholder="Keterangan alasan keputusan / catatan inspeksi..."
              />
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <h5 className="text-[11px] font-semibold text-slate-500">REKAMAN (MEDIA)</h5>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded bg-slate-100 text-[14px] text-slate-400">
                  📷
                </div>
                <div>
                  <p className="text-[12px] font-medium text-slate-700">
                    {selected.findings.reduce((n, f) => n + f.photoCount, 0)} foto tersimpan
                  </p>
                  <p className="text-[10px] text-slate-400">{selected.documentNote}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <h5 className="text-[11px] font-semibold text-slate-500">KEPUTUSAN</h5>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => doAdvance('purchasing')}
                  className={
                    'rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white ' +
                    ((rec === 'Certified' || rec === 'Value')
                      ? 'bg-emerald-500 hover:bg-emerald-600'
                      : 'cursor-not-allowed bg-slate-300')
                  }
                  disabled={rec !== 'Certified' && rec !== 'Value'}
                >
                  CERTIFIED / LULUS
                </button>
                <button
                  type="button"
                  onClick={() => doAdvance('purchasing')}
                  className={
                    'rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white ' +
                    (rec === 'Value'
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'cursor-not-allowed bg-slate-300')
                  }
                  disabled={rec !== 'Value'}
                >
                  VALUE
                </button>
                <button
                  type="button"
                  onClick={() => doAdvance('rejected')}
                  className={
                    'rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white ' +
                    ((rec === 'Tidak Direkomendasikan' || selected.car.stage === 'inspecting')
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'cursor-not-allowed bg-slate-300')
                  }
                  disabled={rec === 'Certified' || rec === 'Value'}
                >
                  REJECT
                </button>
              </div>
              <p className="mt-2 text-[10px] text-slate-400">
                Rekomendasi berdasarkan jumlah temuan major. Lulus → masuk pembelian; Reject → pipeline berakhir.
              </p>
            </div>
          </div>

          {/* footer actions */}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('transaksi')}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700"
            >
              HUBUNGAN KE PO & TRANSAKSI
            </button>
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-500 hover:bg-slate-50">
              Cetak / Upload Hasil
            </button>
          </div>
        </section>
        ) : (
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="py-10 text-center text-[13px] text-slate-400">
              Pilih inspeksi dari daftar untuk melihat detail.
            </p>
          </section>
        )}
      </div>
    </div>
  )
}
