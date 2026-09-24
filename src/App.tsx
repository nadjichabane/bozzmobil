import { useState } from 'react'
import { Header } from './components/Header'
import { Sidebar, type NavId } from './components/Sidebar'
import { SalesPage } from './pages/SalesPage'
import { DashboardPage } from './pages/DashboardPage'
import { MasterUnitPage } from './pages/MasterUnitPage'
import { SupplierPage } from './pages/SupplierPage'
import { FinancePage } from './pages/FinancePage'
import { CustomerPage } from './pages/CustomerPage'
import { PembelianPage } from './pages/PembelianPage'
import { TradeInPage } from './pages/TradeInPage'
import { SpkPage } from './pages/SpkPage'
import { DokumenPage } from './pages/DokumenPage'
import { InventoryPage } from './pages/InventoryPage'
import { RekonsiliasiPage } from './pages/RekonsiliasiPage'
import { BiayaPage } from './pages/BiayaPage'
import { LaporanPage } from './pages/LaporanPage'
import { AiAnalyticsPage } from './pages/AiAnalyticsPage'

const PAGE_COPY: Record<NavId, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Ringkasan performa dealer hari ini' },
  'master-unit': { title: 'Master Unit', subtitle: 'Kelola data unit kendaraan' },
  'master-supplier': { title: 'Master Supplier', subtitle: 'Kelola data supplier unit' },
  'master-finance': { title: 'Master Finance', subtitle: 'Kelola mitra pembiayaan' },
  'master-customer': { title: 'Master Customer', subtitle: 'Kelola database customer' },
  pembelian: { title: 'Data Pembelian', subtitle: 'Kelola seluruh transaksi pembelian unit' },
  penjualan: { title: 'Data Penjualan', subtitle: 'Kelola seluruh transaksi penjualan unit' },
  'trade-in': { title: 'Trade In', subtitle: 'Kelola transaksi tukar tambah' },
  spk: { title: 'SPK', subtitle: 'Kelola surat pesanan kendaraan' },
  dokumen: { title: 'Dokumen Kendaraan', subtitle: 'Pantau kelengkapan STNK dan BPKB' },
  inventory: { title: 'Inventory', subtitle: 'Stok unit yang tersedia di dealer' },
  rekonsiliasi: { title: 'Rekonsiliasi', subtitle: 'Cocokkan mutasi bank dan transaksi' },
  biaya: { title: 'Biaya & Pengeluaran', subtitle: 'Catat biaya operasional dealer' },
  laporan: { title: 'Laporan', subtitle: 'Laporan penjualan, laba, dan stok' },
  'ai-analytics': { title: 'AI Analytics', subtitle: 'Insight prediktif performa penjualan' },
}

const PAGES: Record<NavId, React.ReactNode> = {
  dashboard: <DashboardPage />,
  'master-unit': <MasterUnitPage />,
  'master-supplier': <SupplierPage />,
  'master-finance': <FinancePage />,
  'master-customer': <CustomerPage />,
  pembelian: <PembelianPage />,
  penjualan: <SalesPage />,
  'trade-in': <TradeInPage />,
  spk: <SpkPage />,
  dokumen: <DokumenPage />,
  inventory: <InventoryPage />,
  rekonsiliasi: <RekonsiliasiPage />,
  biaya: <BiayaPage />,
  laporan: <LaporanPage />,
  'ai-analytics': <AiAnalyticsPage />,
}

export default function App() {
  const [active, setActive] = useState<NavId>('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopHidden, setDesktopHidden] = useState(false)
  const copy = PAGE_COPY[active]

  return (
    <div className="min-h-screen bg-page">
      <Sidebar
        active={active}
        onSelect={setActive}
        open={mobileOpen}
        desktopHidden={desktopHidden}
        onClose={() => setMobileOpen(false)}
      />
      <div className={desktopHidden ? '' : 'lg:pl-[215px]'}>
        <Header
          title={copy.title}
          subtitle={copy.subtitle}
          onMenu={() => {
            if (window.innerWidth >= 1024) setDesktopHidden((v) => !v)
            else setMobileOpen((v) => !v)
          }}
        />
        <div className="px-4 py-5 lg:px-6">
          {PAGES[active]}
        </div>
      </div>
    </div>
  )
}
