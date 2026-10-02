import { useState } from 'react'
import { Header } from './components/Header'
import { Sidebar, type NavId } from './components/Sidebar'
import { DashboardPage } from './pages/DashboardPage'
import { CustomerPage } from './pages/CustomerPage'
import { MasterUnitPage } from './pages/MasterUnitPage'
import { TransaksiPage } from './pages/TransaksiPage'
import InspectionPage from './pages/InspectionPage'
import { AbsensiPage } from './pages/AbsensiPage'
import { GudangPage } from './pages/GudangPage'
import { LeadsPage } from './pages/LeadsPage'
import { KomparasiPage } from './pages/KomparasiPage'
import { LaporanKeuanganPage } from './pages/LaporanKeuanganPage'
import { UserPage } from './pages/UserPage'
import { HrPage } from './pages/HrPage'
import { MigrasiPage } from './pages/MigrasiPage'
import { PipelineSimulatorPage } from './pages/PipelineSimulatorPage'
import { PipelineProvider } from './context/PipelineContext'

const PAGE_COPY: Record<NavId, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard & Reporting', subtitle: 'Ringkasan operasional, transaksi, inventaris, dan absensi' },
  crm: { title: 'CRM & Customer Management', subtitle: 'Profil pelanggan, kontak, riwayat transaksi, pencarian & penyaringan' },
  kendaraan: { title: 'Master Unit', subtitle: 'Semua unit & status terpusat: pembelian, inspeksi, penjualan' },
  transaksi: { title: 'Pembelian & Penjualan', subtitle: 'Transaksi, relasi transaksi, harga & margin' },
  inspeksi: { title: 'Inspeksi & Leads', subtitle: 'Item cek fisik, temuan, catatan, rekomendasi keputusan' },
  leads: { title: 'Leads Inspeksi', subtitle: 'Daftar mobil yang akan diinspeksi & masuk antrian tim inspeksi' },
  simulasi: { title: 'Simulasi Pipeline', subtitle: 'Ikuti alur Lead → Inspeksi → Pembelian → Stok → Penjualan' },
  absensi: { title: 'Absensi Karyawan', subtitle: 'Kehadiran, waktu masuk/keluar, rekap monitoring' },
  gudang: { title: 'Gudang / Inventory Barang', subtitle: 'Stok, barang masuk & keluar, histori, ketersediaan' },
  komparasi: { title: 'Komparasi Harga', subtitle: 'Bandingkan harga antar sumber & vendor sebelum pembelian' },
  user: { title: 'User & Access Management', subtitle: 'Akun pengguna dan pembatasan akses per peran' },
  keuangan: { title: 'Laporan Keuangan', subtitle: 'Pemasukan, pengeluaran, rekapitulasi & arus kas' },
  hr: { title: 'Human Resource', subtitle: 'Profil, jabatan, departemen, status kepegawaian & riwayat' },
  migrasi: { title: 'Migrasi & Integrasi Data', subtitle: 'Migrasi dari Analytics Bozzmobil & spreadsheet, pemetaan field' },
}

export default function App() {
  const [active, setActive] = useState<NavId>('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopHidden, setDesktopHidden] = useState(false)
  const copy = PAGE_COPY[active]

  const pages: Record<NavId, React.ReactNode> = {
    dashboard: <DashboardPage />,
    crm: <CustomerPage />,
    kendaraan: <MasterUnitPage />,
    transaksi: <TransaksiPage />,
    inspeksi: <InspectionPage onNavigate={setActive} />,
    leads: <LeadsPage onNavigate={setActive} />,
    simulasi: <PipelineSimulatorPage />,
    absensi: <AbsensiPage />,
    gudang: <GudangPage />,
    komparasi: <KomparasiPage />,
    user: <UserPage />,
    keuangan: <LaporanKeuanganPage />,
    hr: <HrPage />,
    migrasi: <MigrasiPage />,
  }

  return (
    <PipelineProvider>
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
            {pages[active]}
          </div>
        </div>
      </div>
    </PipelineProvider>
  )
}
