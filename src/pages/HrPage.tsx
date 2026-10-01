import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { EMPLOYEES, type Employee } from '../data/employees'
import { formatRupiah } from '../data/sales'

export function HrPage() {
  const [employees] = useState<Employee[]>(EMPLOYEES)
  const [query, setQuery] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('Semua Departemen')
  const [filterStatus, setFilterStatus] = useState('Semua Status')

  const departments = ['Semua Departemen', ...Array.from(new Set(employees.map((e) => e.department)))]
  const statusOptions = ['Semua Status', 'Aktif', 'Cuti', 'Resign']

  const filtered = employees.filter((e) => {
    if (filterDepartment !== 'Semua Departemen' && e.department !== filterDepartment) return false
    if (filterStatus !== 'Semua Status' && e.status !== filterStatus) return false
    if (!query) return true
    const q = query.toLowerCase()
    return e.name.toLowerCase().includes(q) || e.nric.includes(q) || e.position.toLowerCase().includes(q)
  })

  const activeCount = employees.filter((e) => e.status === 'Aktif').length
  const earliest = employees.reduce((min, e) => (new Date(e.hireDate.split('/').reverse().join('-')).getTime() < new Date(min.split('/').reverse().join('-')).getTime() ? e.hireDate : min), employees[0].hireDate)
  const totalSalary = employees.reduce((s, e) => s + e.salary, 0)

  return (
    <div className="px-4 py-5 lg:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[15px] font-bold text-slate-900">Sumber Daya Manusia</p>
          <p className="text-[12px] text-slate-400">Profil karyawan, departemen, dan status kepegawaian</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,110,253,0.35)] hover:bg-primary-hover">
          <Plus className="h-4 w-4" /> Tambah Karyawan
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-slate-400">TOTAL KARYAWAN</p>
          <p className="mt-1 text-[20px] font-bold text-slate-900">{employees.length}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-emerald-600">AKTIF</p>
          <p className="mt-1 text-[20px] font-bold text-emerald-600">{activeCount}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-slate-400">TERLAMA</p>
          <p className="mt-1 text-[14px] font-bold text-slate-900">{earliest}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-slate-400">GAJI TOTAL / BULAN</p>
          <p className="mt-1 text-[16px] font-bold text-slate-900">{formatRupiah(totalSalary)}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama / NIK / jabatan..." className="h-[38px] w-[260px] rounded-[8px] border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-primary" />
        </div>
        <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className="h-[38px] rounded-[8px] border border-line bg-white px-3 text-[13px] text-slate-700">
          {departments.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-[38px] rounded-[8px] border border-line bg-white px-3 text-[13px] text-slate-700">
          {statusOptions.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {['Nama', 'NIK', 'Jabatan', 'Departemen', 'Status', 'Bergabung', 'Pengalaman Terakhir', 'Gaji'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="h-[60px] border-b border-line last:border-0 hover:bg-slate-50">
                  <td className="px-4"><span className="text-[13px] font-semibold text-slate-900">{e.name}</span></td>
                  <td className="whitespace-nowrap px-4 font-mono text-[13px] text-slate-500">{e.nric}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{e.position}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{e.department}</td>
                  <td className="px-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${e.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700' : e.status === 'Cuti' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>{e.status}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{e.hireDate}</td>
                  <td className="whitespace-nowrap px-4 text-[12px] text-slate-500">{e.lastCompany}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] font-semibold text-slate-800">{formatRupiah(e.salary)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
