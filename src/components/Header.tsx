import { Bell, CalendarDays, ChevronDown, Menu } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const NOTIFICATIONS = [
  { id: 1, title: 'STNK unit B 1505 TAG sudah selesai', time: '12 menit lalu' },
  { id: 2, title: 'Pembayaran INV-2026-0826 menunggu verifikasi', time: '1 jam lalu' },
  { id: 3, title: 'Dokumen BPKB CR-V 2.4 belum lengkap', time: '3 jam lalu' },
  { id: 4, title: 'SPK baru dari customer Andi Wijaya', time: 'Kemarin' },
  { id: 5, title: 'Rekonsiliasi BCA Finance siap ditinjau', time: 'Kemarin' },
]

type HeaderProps = {
  title: string
  subtitle: string
  onMenu: () => void
}

export function Header({ title, subtitle, onMenu }: HeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!notifRef.current?.contains(e.target as Node)) setNotifOpen(false)
      if (!userRef.current?.contains(e.target as Node)) setUserOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <header className="flex h-[90px] items-center justify-between gap-4 border-b border-line bg-white px-5 lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenu}
          className="flex h-9 w-9 items-center justify-center rounded-[8px] text-slate-500 hover:bg-slate-50"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-[20px] font-bold leading-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-0.5 truncate text-[12.5px] text-slate-400">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          className="hidden h-[38px] items-center gap-2 rounded-[8px] border border-line bg-white px-3 text-[12.5px] text-slate-600 md:inline-flex"
        >
          <CalendarDays className="h-4 w-4 text-slate-400" />
          <span className="whitespace-nowrap">01 Agustus 2026 - 31 Agustus 2026</span>
        </button>

        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v)
              setUserOpen(false)
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50"
            aria-label="Notifikasi"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              5
            </span>
          </button>
          {notifOpen && (
            <div className="absolute right-0 z-50 mt-2 w-[320px] overflow-hidden rounded-[10px] border border-line bg-white shadow-[0_12px_32px_rgba(15,23,42,0.14)]">
              <div className="border-b border-line px-4 py-3">
                <p className="text-[13px] font-semibold text-slate-900">Notifikasi</p>
                <p className="text-[11px] text-slate-400">5 pemberitahuan baru</p>
              </div>
              <ul>
                {NOTIFICATIONS.map((n) => (
                  <li
                    key={n.id}
                    className="border-b border-line px-4 py-3 last:border-0 hover:bg-slate-50"
                  >
                    <p className="text-[12.5px] font-medium text-slate-800">{n.title}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{n.time}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div ref={userRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setUserOpen((v) => !v)
              setNotifOpen(false)
            }}
            className="flex items-center gap-2.5 rounded-[8px] py-1 pl-1 pr-1 hover:bg-slate-50"
          >
            <img
              src="/cars/avatar.jpg"
              alt="Dede Prasetyo"
              className="h-9 w-9 rounded-full object-cover"
            />
            <div className="hidden text-left sm:block">
              <p className="text-[13px] font-semibold leading-tight text-slate-900">
                Dede Prasetyo
              </p>
              <p className="text-[11.5px] text-slate-400">Owner</p>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
          </button>
          {userOpen && (
            <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-[10px] border border-line bg-white py-1 shadow-[0_12px_32px_rgba(15,23,42,0.14)]">
              <button type="button" className="block w-full px-3 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50">
                Profil saya
              </button>
              <button type="button" className="block w-full px-3 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50">
                Pengaturan
              </button>
              <button type="button" className="block w-full px-3 py-2 text-left text-[13px] text-red-600 hover:bg-red-50">
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
