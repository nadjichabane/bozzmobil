import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

type DropdownProps = {
  value: string
  options: string[]
  onChange: (value: string) => void
  className?: string
  minWidth?: string
}

export function Dropdown({
  value,
  options,
  onChange,
  className = '',
  minWidth = 'min-w-[168px]',
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div ref={ref} className={`relative ${minWidth} ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="flex h-[38px] w-full items-center justify-between gap-2 rounded-[8px] border border-line bg-white px-3 text-[13px] text-slate-700 shadow-[0_1px_1px_rgba(15,23,42,0.03)] hover:border-slate-300"
      >
        <span className="truncate">{value}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-40 mt-1 max-h-56 w-full overflow-auto rounded-[8px] border border-line bg-white py-1 shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
        >
          {options.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                role="option"
                aria-selected={opt === value}
                className={`flex w-full px-3 py-2 text-left text-[13px] hover:bg-slate-50 ${
                  opt === value ? 'bg-blue-50 font-medium text-primary' : 'text-slate-700'
                }`}
                onClick={() => {
                  onChange(opt)
                  setOpen(false)
                }}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
