import { useState } from 'react'
import { SalesPage } from './SalesPage'
import { PembelianPageContent } from './PembelianContent'
import { PembelianForm } from '../components/PembelianForm'
import { PenjualanForm } from '../components/PenjualanForm'

type TabId = 'sales' | 'pembelian' | 'form-penjualan' | 'form-pembelian'

const TABS: { id: TabId; label: string }[] = [
  { id: 'sales', label: 'Data Penjualan' },
  { id: 'pembelian', label: 'Data Pembelian' },
  { id: 'form-penjualan', label: 'Input Penjualan' },
  { id: 'form-pembelian', label: 'Tambah Pembelian' },
]

export function TransaksiPage() {
  const [tab, setTab] = useState<TabId>('sales')

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`h-[38px] rounded-[8px] px-4 text-[13px] font-medium transition-colors ${
              tab === t.id ? 'bg-primary text-white' : 'border border-line bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sales' && <SalesPage />}
      {tab === 'pembelian' && <PembelianPageContent />}
      {tab === 'form-penjualan' && <PenjualanForm />}
      {tab === 'form-pembelian' && <PembelianForm />}
    </div>
  )
}
