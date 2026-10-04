import { Car, CircleDollarSign, FileWarning, Percent, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { formatRupiahCompact } from '../data/sales'
import { usePipelineData } from '../context/usePipelineData'
import { usePipeline } from '../context/PipelineContext'
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
  const { sales } = usePipelineData()
  const { markBast } = usePipeline()
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

  const kpi = useMemo(() => {
    const totalUnits = sales.length
    const totalOmzet = sales.reduce((s, x) => s + x.price, 0)
    const totalLaba = sales.reduce((s, x) => s + x.profit, 0)
    const avgMargin = totalOmzet === 0 ? 0 : (totalLaba / totalOmzet) * 100
    const pendingStnk = sales.filter((s) => s.status === 'Proses STNK').length
    return { totalUnits, totalOmzet, totalLaba, avgMargin, pendingStnk }
  }, [sales])

  const handleFilterChange = (next: Filters) => {
    setFilters(next)
    setPage(1)
  }

  return (
    <div className="px-4 py-5 lg:px-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="TOTAL PENJUALAN (UNIT)"
          value={`${kpi.totalUnits} Unit`}
          trend="Terjual dari pipeline"
          icon={Car}
          iconBg="bg-[#2F80ED]"
        />
        <StatCard
          title="TOTAL OMZET"
          value={formatRupiahCompact(kpi.totalOmzet)}
          trend="Akumulasi harga jual"
          icon={Wallet}
          iconBg="bg-[#22C55E]"
        />
        <StatCard
          title="LABA KOTOR"
          value={formatRupiahCompact(kpi.totalLaba)}
          trend="Margin total"
          icon={CircleDollarSign}
          iconBg="bg-[#F59E0B]"
        />
        <StatCard
          title="RATA-RATA MARGIN"
          value={`${kpi.avgMargin.toFixed(1)}%`}
          trend="Dari omzet"
          icon={Percent}
          iconBg="bg-[#8B5CF6]"
        />
        <StatCard
          title="PENDING STNK"
          value={`${kpi.pendingStnk} Unit`}
          trend="Dalam proses STNK"
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
          onMarkBast={(unitKey) => markBast(unitKey)}
        />
      </div>

      <AddSaleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={() => setPage(1)}
      />
    </div>
  )
}
