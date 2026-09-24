import type { LucideIcon } from 'lucide-react'

type StatCardProps = {
  title: string
  value: string
  trend: string
  trendUp?: boolean
  icon: LucideIcon
  iconBg: string
}

export function StatCard({
  title,
  value,
  trend,
  trendUp = true,
  icon: Icon,
  iconBg,
}: StatCardProps) {
  return (
    <div className="flex items-center gap-3.5 rounded-[12px] border border-line bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconBg}`}
      >
        <Icon className="h-[18px] w-[18px] text-white" strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold tracking-[0.04em] text-slate-400">
          {title}
        </p>
        <p className="mt-0.5 truncate text-[18px] font-bold leading-tight text-slate-900">
          {value}
        </p>
        <p
          className={`mt-1.5 inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
            trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
          }`}
        >
          {trend}
        </p>
      </div>
    </div>
  )
}
