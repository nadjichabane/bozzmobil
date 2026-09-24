import { Filter, Plus, Search } from 'lucide-react'
import {
  FINANCE_OPTIONS,
  PAYMENT_OPTIONS,
  SALES_PEOPLE,
  STATUS_OPTIONS,
} from '../data/sales'
import { Dropdown } from './Dropdown'

export type Filters = {
  status: string
  payment: string
  sales: string
  finance: string
  query: string
}

type FilterBarProps = {
  filters: Filters
  onChange: (next: Filters) => void
  onAdd: () => void
}

export function FilterBar({ filters, onChange, onAdd }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-line px-5 py-3.5">
      <Dropdown
        value={filters.status}
        options={STATUS_OPTIONS}
        onChange={(status) => onChange({ ...filters, status })}
      />
      <Dropdown
        value={filters.payment}
        options={PAYMENT_OPTIONS}
        onChange={(payment) => onChange({ ...filters, payment })}
        minWidth="min-w-[196px]"
      />
      <Dropdown
        value={filters.sales}
        options={SALES_PEOPLE}
        onChange={(sales) => onChange({ ...filters, sales })}
      />
      <Dropdown
        value={filters.finance}
        options={FINANCE_OPTIONS}
        onChange={(finance) => onChange({ ...filters, finance })}
      />

      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          placeholder="Cari unit, nopol, customer..."
          className="h-[38px] w-full rounded-[8px] border border-line bg-white pl-9 pr-3 text-[13px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-primary"
        />
      </div>

      <button
        type="button"
        className="inline-flex h-[38px] items-center gap-1.5 rounded-[8px] border border-line bg-white px-3.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
      >
        <Filter className="h-3.5 w-3.5" />
        Filter
      </button>

      <button
        type="button"
        onClick={onAdd}
        className="inline-flex h-[38px] items-center gap-1.5 rounded-[8px] bg-primary px-3.5 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,110,253,0.35)] hover:bg-primary-hover"
      >
        <Plus className="h-4 w-4" />
        Tambah Penjualan
      </button>
    </div>
  )
}
