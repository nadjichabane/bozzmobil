import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { APP_USERS, type AppUser } from '../data/users'

const ROLE_OPTIONS = ['Semua Role', 'Admin', 'Manager', 'Sales', 'Finance', 'HR']

const ROLE_BADGE: Record<AppUser['role'], string> = {
  Admin: 'bg-red-50 text-red-700',
  Manager: 'bg-amber-50 text-amber-700',
  Sales: 'bg-blue-50 text-blue-700',
  Finance: 'bg-emerald-50 text-emerald-700',
  HR: 'bg-slate-100 text-slate-500',
}

export function UserPage() {
  const [users] = useState<AppUser[]>(APP_USERS)
  const [query, setQuery] = useState('')
  const [filterRole, setFilterRole] = useState('Semua Role')

  const filtered = users.filter((u) => {
    if (filterRole !== 'Semua Role' && u.role !== filterRole) return false
    if (!query) return true
    const q = query.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

  const totalUsers = users.length
  const activeCount = users.filter((u) => u.status === 'Aktif').length
  const adminCount = users.filter((u) => u.role === 'Admin').length
  const inactiveCount = users.filter((u) => u.status === 'Nonaktif').length

  return (
    <div className="px-4 py-5 lg:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[15px] font-bold text-slate-900">User &amp; Access Management</p>
          <p className="text-[12px] text-slate-400">{filtered.length} pengguna terdaftar</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,110,253,0.35)] hover:bg-primary-hover">
          <Plus className="h-4 w-4" /> Tambah User
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-slate-400">TOTAL USER</p>
          <p className="mt-1 text-[20px] font-bold text-slate-900">{totalUsers}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-emerald-600">AKTIF</p>
          <p className="mt-1 text-[20px] font-bold text-emerald-600">{activeCount}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-slate-400">ADMIN</p>
          <p className="mt-1 text-[20px] font-bold text-slate-900">{adminCount}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-red-500">NONAKTIF</p>
          <p className="mt-1 text-[20px] font-bold text-red-500">{inactiveCount}</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama/email user..." className="h-[38px] w-[280px] rounded-[8px] border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-primary" />
        </div>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="h-[38px] rounded-[8px] border border-line bg-white px-3 text-[13px] text-slate-700">
          {ROLE_OPTIONS.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>

      <div className="rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {['Nama', 'Email', 'Role', 'Modul Akses', 'Status', 'Login Terakhir'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="h-[60px] border-b border-line last:border-0 hover:bg-slate-50">
                  <td className="px-4"><span className="text-[13px] font-semibold text-slate-900">{u.name}</span></td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{u.email}</td>
                  <td className="px-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${ROLE_BADGE[u.role]}`}>{u.role}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{u.accessModules} modul</td>
                  <td className="px-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${u.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{u.status}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{u.lastLogin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
