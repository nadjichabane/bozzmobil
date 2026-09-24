type PaymentBadgeProps = {
  type: 'Credit' | 'Cash'
}

export function PaymentBadge({ type }: PaymentBadgeProps) {
  if (type === 'Credit') {
    return (
      <span className="inline-flex rounded-full bg-[#E8F1FF] px-2.5 py-1 text-[11px] font-semibold text-[#1D4ED8]">
        Credit
      </span>
    )
  }

  return (
    <span className="inline-flex rounded-full bg-[#E8F8EE] px-2.5 py-1 text-[11px] font-semibold text-[#15803D]">
      Cash
    </span>
  )
}
