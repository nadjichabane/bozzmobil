import { Car, CircleDollarSign, FileWarning, Percent, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { SALES, type Sale } from '../data/sales'
import { AddSaleModal } from '../components/AddSaleModal'
import { FilterBar, type Filters } from '../components/FilterBar'
import { SalesTable } from '../components/SalesTable'
import { StatCard } from '../components/StatCard'

const PAGE_SIZE = 8

const INITIAL_FILTERS: Filters = {
  status: 'Semua Status',
  payment: 'Semua Jenis Pembayaran',
  sales: 'Semua Sales',
  finance: 'Semua Finance',
  query: '',
}

export function SalesPage() {
  const [sales, setSales] = useState<Sale[]>(SALES)
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase()
    return sales.filter((s) => {
      if (filters.status !== 'Semua Status' && s.status !== filters.status) return false
      if (filters.payment !== 'Semua Jenis Pembayaran' && s.payment !== filters.payment)
        return false
      if (filters.sales !== 'Semua Sales' && s.salesPerson !== filters.sales) return false
      if (filters.finance !== 'Semua Finance' && s.finance !== filters.finance) return false
      if (!q) return true
      return (
        s.unit.toLowerCase().includes(q) ||
        s.plate.toLowerCase().includes(q) ||
        s.customer.toLowerCase().includes(q) ||
        s.invoice.toLowerCase().includes(q)
      )
    })
  }, [sales, filters])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const start = (safePage - 1) * PAGE_SIZE
  const rows = filtered.slice(start, start + PAGE_SIZE)

  const handleFilterChange = (next: Filters) => {
    setFilters(next)
    setPage(1)
  }

  return (
    <div className="px-4 py-5 lg:px-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="TOTAL PENJUALAN (UNIT)"
          value="28 Unit"
          trend="↑ 27% dari bulan lalu"
          icon={Car}
          iconBg="bg-[#2F80ED]"
        />
        <StatCard
          title="TOTAL OMZET"
          value="Rp 6.380.000.000"
          trend="↑ 18.6% dari bulan lalu"
          icon={Wallet}
          iconBg="bg-[#22C55E]"
        />
        <StatCard
          title="LABA KOTOR"
          value="Rp 892.400.000"
          trend="↑ 19.8% dari bulan lalu"
          icon={CircleDollarSign}
          iconBg="bg-[#F59E0B]"
        />
        <StatCard
          title="RATA-RATA MARGIN"
          value="14.0%"
          trend="↑ 1.2% dari bulan lalu"
          icon={Percent}
          iconBg="bg-[#8B5CF6]"
        />
        <StatCard
          title="PENDING STNK"
          value="3 Unit"
          trend="↓ 1 dari bulan lalu"
          trendUp={false}
          icon={FileWarning}
          iconBg="bg-[#06B6D4]"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <FilterBar
          filters={filters}
          onChange={handleFilterChange}
          onAdd={() => setModalOpen(true)}
        />
        <SalesTable
          rows={rows}
          page={safePage}
          pageCount={pageCount}
          from={filtered.length === 0 ? 0 : start + 1}
          to={Math.min(start + PAGE_SIZE, filtered.length)}
          total={filtered.length}
          onPageChange={setPage}
        />
      </div>

      <AddSaleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(sale) => {
          setSales((prev) => [sale, ...prev])
          setPage(1)
        }}
      />
    </div>
  )
}
