import { Plus, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function SectionCard({
  index,
  title,
  icon: Icon,
  action,
  children,
}: {
  index?: number
  title: string
  icon?: LucideIcon
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="rounded-[12px] border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {index !== undefined && (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
              {index}
            </span>
          )}
          {Icon && <Icon className="h-4 w-4 text-slate-400" />}
          <p className="text-[14px] font-semibold text-slate-900">{title}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

export function SectionHeader({
  number,
  title,
  onAdd,
  addLabel = '+ Tambah Customer',
}: {
  number: number
  title: string
  onAdd?: () => void
  addLabel?: string
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
          {number}
        </span>
        <p className="text-[14px] font-semibold text-slate-900">{title}</p>
      </div>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline"
        >
          <Plus className="h-3.5 w-3.5" /> {addLabel.replace(/^\+ /, '')}
        </button>
      )}
    </div>
  )
}

export const inputCls =
  'h-[38px] w-full rounded-[8px] border border-line bg-white px-3 text-[13px] text-slate-800 outline-none focus:border-primary disabled:bg-slate-50 disabled:text-slate-400'

export const selectCls =
  'h-[38px] w-full rounded-[8px] border border-line bg-white px-3 text-[13px] text-slate-700 outline-none focus:border-primary'

export function Field({
  label,
  children,
  className = '',
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`block text-[12px] font-medium text-slate-600 ${className}`}>
      <span className="mb-1 block text-[11.5px] font-medium text-slate-500">{label}</span>
      {children}
    </label>
  )
}

export function SegToggle({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-[8px] border border-line">
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-4 py-1.5 text-[12.5px] font-semibold transition-colors ${
            i > 0 ? 'border-l border-line' : ''
          } ${value === o.value ? 'bg-primary text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-[8px] border border-line bg-white px-4 py-3 text-left"
    >
      <span>
        <span className="block text-[13px] font-medium text-slate-800">{label}</span>
        {hint && <span className="block text-[11px] text-slate-400">{hint}</span>}
      </span>
      <span
        className={`relative h-[20px] w-[36px] shrink-0 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-slate-200'}`}
      >
        <span
          className={`absolute top-[2px] h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? 'left-[18px]' : 'left-[2px]'}`}
        />
      </span>
    </button>
  )
}

export function CheckRow({
  label,
  checked,
  onChange,
  note,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  note?: string
}) {
  return (
    <div className="rounded-[8px] border border-line bg-white px-4 py-3">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-[13px] font-medium text-slate-800">{label}</span>
        <span className="flex items-center gap-2">
          {note !== undefined && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                checked ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {checked ? 'Ada' : 'Tidak Ada'}
            </span>
          )}
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 accent-[#0D6EFD]"
            onClick={(e) => e.stopPropagation()}
          />
        </span>
      </button>
      {note !== undefined && (
        <textarea
          placeholder="Catatan (opsional)..."
          className="mt-2 h-[54px] w-full resize-none rounded-[6px] border border-line bg-slate-50 p-2 text-[12px] outline-none focus:border-primary"
        />
      )}
    </div>
  )
}
