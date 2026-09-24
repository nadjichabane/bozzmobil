type ProgressBarProps = {
  value: number
}

export function ProgressBar({ value }: ProgressBarProps) {
  const complete = value >= 100
  return (
    <div className="flex min-w-[92px] flex-col gap-1">
      <span
        className={`text-[12px] font-semibold ${complete ? 'text-[#16A34A]' : 'text-[#D97706]'}`}
      >
        {value}%
      </span>
      <div className="h-[6px] w-[78px] overflow-hidden rounded-full bg-[#EEF2F6]">
        <div
          className={`h-full rounded-full ${complete ? 'bg-[#22C55E]' : 'bg-[#F59E0B]'}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
