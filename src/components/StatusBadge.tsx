type StatusBadgeProps = {
  status: 'Lunas' | 'Proses STNK' | 'Proses BPKB'
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'Lunas') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F8EE] px-2.5 py-1 text-[11px] font-semibold text-[#16A34A]">
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#22C55E] text-white">
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" aria-hidden>
            <path
              d="M2.5 6.2 4.8 8.5 9.5 3.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        Lunas
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF4E5] px-2.5 py-1 text-[11px] font-semibold text-[#D97706]">
      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#F59E0B] text-white">
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" aria-hidden>
          <circle cx="6" cy="6" r="4.2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6 3.8v2.4l1.6 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
      {status}
    </span>
  )
}
