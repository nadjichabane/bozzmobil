import {
  BarChart3,
  Car,
  CarFront,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Landmark,
  Package,
  Repeat,
  ShoppingBag,
  Sparkles,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export type NavId =
  | 'dashboard'
  | 'master-unit'
  | 'master-supplier'
  | 'master-finance'
  | 'master-customer'
  | 'pembelian'
  | 'penjualan'
  | 'trade-in'
  | 'spk'
  | 'dokumen'
  | 'inventory'
  | 'rekonsiliasi'
  | 'biaya'
  | 'laporan'
  | 'ai-analytics'

type NavItem = {
  id: NavId
  label: string
  icon: LucideIcon
  badge?: string
}

type NavSection = {
  title: string
  items: NavItem[]
}

const SECTIONS: NavSection[] = [
  {
    title: 'DASHBOARD',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'MASTER DATA',
    items: [
      { id: 'master-unit', label: 'Master Unit', icon: CarFront },
      { id: 'master-supplier', label: 'Master Supplier', icon: Car },
      { id: 'master-finance', label: 'Master Finance', icon: Landmark },
      { id: 'master-customer', label: 'Master Customer', icon: Users },
    ],
  },
  {
    title: 'TRANSAKSI',
    items: [
      { id: 'pembelian', label: 'Pembelian', icon: ShoppingBag },
      { id: 'penjualan', label: 'Penjualan', icon: FileSpreadsheet },
      { id: 'trade-in', label: 'Trade In', icon: Repeat },
      { id: 'spk', label: 'SPK', icon: FileText },
    ],
  },
  {
    title: 'DOKUMEN & INVENTORY',
    items: [
      { id: 'dokumen', label: 'Dokumen Kendaraan', icon: FolderOpen },
      { id: 'inventory', label: 'Inventory', icon: Package },
    ],
  },
  {
    title: 'ACCOUNTING',
    items: [
      { id: 'rekonsiliasi', label: 'Rekonsiliasi', icon: Repeat },
      { id: 'biaya', label: 'Biaya & Pengeluaran', icon: Wallet },
    ],
  },
  {
    title: 'LAPORAN',
    items: [{ id: 'laporan', label: 'Laporan', icon: BarChart3 }],
  },
  {
    title: 'AI & TOOLS',
    items: [{ id: 'ai-analytics', label: 'AI Analytics', icon: Sparkles, badge: 'New' }],
  },
]

type SidebarProps = {
  active: NavId
  onSelect: (id: NavId) => void
  open: boolean
  desktopHidden: boolean
  onClose: () => void
}

export function Sidebar({ active, onSelect, open, desktopHidden, onClose }: SidebarProps) {
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-900/40 transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[215px] flex-col bg-navy text-white transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } ${desktopHidden ? 'lg:-translate-x-full' : 'lg:translate-x-0'}`}
      >
        <div className="px-5 pb-3 pt-5">
          <div className="text-[22px] font-bold leading-none tracking-tight">
            <span className="text-white">Bozz</span>
            <span className="text-[#3B82F6]">Mobil</span>
          </div>
          <p className="mt-2 text-[8.5px] font-medium leading-snug tracking-[0.04em] text-[#8BA3C7]">
            PILIHAN CERDAS MOBIL BEKAS BERKUALITAS
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-1">
          {SECTIONS.map((section) => (
            <div key={section.title} className="mb-3.5">
              <p className="mb-1.5 px-2 text-[10px] font-semibold tracking-[0.08em] text-[#6B85B3]">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = item.id === active
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelect(item.id)
                        onClose()
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-[7px] text-left text-[13px] ${
                        isActive
                          ? 'bg-primary font-medium text-white'
                          : 'text-[#C5D4EA] hover:bg-white/5'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span className="rounded-[4px] bg-primary px-1.5 py-px text-[9px] font-semibold text-white">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3">
          <div className="rounded-[10px] bg-white/10 px-3 py-2.5">
            <p className="text-[11px] font-medium text-white/90">BozzMobil System</p>
            <p className="text-[10px] text-[#8BA3C7]">v2.1.0</p>
          </div>
        </div>
      </aside>
    </>
  )
}
