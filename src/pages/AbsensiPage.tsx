import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { ATTENDANCE, type Attendance } from '../data/attendance'

const STATUS_STYLE: Record<Attendance['status'], string> = {
  'Hadir': 'bg-emerald-50 text-emerald-700',
  'Terlambat': 'bg-amber-50 text-amber-700',
  'Sakit': 'bg-red-50 text-red-600',
  'Cuti': 'bg-slate-100 text-slate-500',
  'Alpa': 'bg-red-50 text-red-600',
}

export function AbsensiPage() {
  const [records] = useState<Attendance[]>(ATTENDANCE)
  const [query, setQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('Semua Status')

  const statusOptions = ['Semua Status', 'Hadir', 'Terlambat', 'Sakit', 'Cuti', 'Alpa']

  const filtered = records.filter((r) => {
    if (filterStatus !== 'Semua Status' && r.status !== filterStatus) return false
    if (!query) return true
    const q = query.toLowerCase()
    return r.employee.toLowerCase().includes(q) || r.date.includes(q)
  })

  const count = (s: Attendance['status']) => records.filter((r) => r.status === s).length
  const hadir = count('Hadir')
  const terlambat = count('Terlambat')
  const izin = count('Sakit') + count('Cuti')
  const alpa = count('Alpa')

  return (
    <div className="px-4 py-5 lg:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[15px] font-bold text-slate-900">Absensi Karyawan</p>
          <p className="text-[12px] text-slate-400">Waktu masuk, keluar, dan rekap kehadiran</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,110,253,0.35)] hover:bg-primary-hover">
          <Plus className="h-4 w-4" /> Catat Kehadiran
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-emerald-600">HADIR</p>
          <p className="mt-1 text-[20px] font-bold text-emerald-600">{hadir}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-amber-600">TERLAMBAT</p>
          <p className="mt-1 text-[20px] font-bold text-amber-600">{terlambat}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-slate-400">IZIN / SAKIT</p>
          <p className="mt-1 text-[20px] font-bold text-slate-900">{izin}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-red-500">ALPA</p>
          <p className="mt-1 text-[20px] font-bold text-red-500">{alpa}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari karyawan / tanggal..." className="h-[38px] w-[240px] rounded-[8px] border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-primary" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-[38px] rounded-[8px] border border-line bg-white px-3 text-[13px] text-slate-700">
          {statusOptions.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {['Karyawan', 'Tanggal', 'Jam Masuk', 'Jam Keluar', 'Status', 'Keterangan'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="h-[60px] border-b border-line last:border-0 hover:bg-slate-50">
                  <td className="px-4"><span className="text-[13px] font-semibold text-slate-900">{r.employee}</span></td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{r.date}</td>
                  <td className="whitespace-nowrap px-4 font-mono text-[13px] text-slate-600">{r.inTime}</td>
                  <td className="whitespace-nowrap px-4 font-mono text-[13px] text-slate-600">{r.outTime}</td>
                  <td className="px-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="max-w-[220px] truncate px-4 text-[13px] text-slate-500">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
