type DonutSlice = {
  label: string
  value: number
  color: string
}

type DonutChartProps = {
  title: string
  subtitle?: string
  slices: DonutSlice[]
  centerLabel?: string
}

export function DonutChart({ title, subtitle, slices, centerLabel }: DonutChartProps) {
  const total = slices.reduce((sum, s) => sum + s.value, 0)
  const R = 42
  const C = 2 * Math.PI * R
  let offset = 0

  return (
    <div className="rounded-[12px] border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <p className="text-[13px] font-semibold text-slate-900">{title}</p>
      {subtitle && <p className="mt-0.5 text-[11.5px] text-slate-400">{subtitle}</p>}
      <div className="mt-4 flex items-center gap-6">
        <div className="relative h-[110px] w-[110px] shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={R} fill="none" stroke="#F1F5F9" strokeWidth="12" />
            {slices.map((s) => {
              const len = total > 0 ? (s.value / total) * C : 0
              const el = (
                <circle
                  key={s.label}
                  cx="50"
                  cy="50"
                  r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="12"
                  strokeDasharray={`${len} ${C - len}`}
                  strokeDashoffset={-offset}
                />
              )
              offset += len
              return el
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[16px] font-bold text-slate-900">{centerLabel ?? total}</span>
            {centerLabel === undefined && <span className="text-[10px] text-slate-400">Total</span>}
          </div>
        </div>
        <ul className="min-w-0 flex-1 space-y-2">
          {slices.map((s) => (
            <li key={s.label} className="flex items-center gap-2 text-[12px]">
              <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: s.color }} />
              <span className="min-w-0 flex-1 truncate text-slate-600">{s.label}</span>
              <span className="font-semibold text-slate-900">
                {total > 0 ? Math.round((s.value / total) * 100) : 0}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
