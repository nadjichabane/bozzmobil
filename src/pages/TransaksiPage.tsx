import { useState } from 'react'
import { SalesPage } from './SalesPage'
import { PembelianPageContent } from './PembelianContent'
import { PembelianForm } from '../components/PembelianForm'
import { PenjualanForm } from '../components/PenjualanForm'
import { usePipelineData } from '../context/usePipelineData'
import { MASTER_UNITS } from '../data/masterUnits'

type TabId = 'sales' | 'pembelian' | 'form-penjualan' | 'form-pembelian'

const TABS: { id: TabId; label: string }[] = [
  { id: 'sales', label: 'Data Penjualan' },
  { id: 'pembelian', label: 'Data Pembelian' },
  { id: 'form-penjualan', label: 'Input Penjualan' },
  { id: 'form-pembelian', label: 'Tambah Pembelian' },
]

export function TransaksiPage() {
  const [tab, setTab] = useState<TabId>('sales')
  const { advance, masterUnits: liveMasterUnits } = usePipelineData()

  const selectedUnitKey = liveMasterUnits[0]?.id ?? MASTER_UNITS[0]?.id

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
      {tab === 'form-penjualan' && (
        <PenjualanForm
          onProcess={() => {
            if (selectedUnitKey) advance(selectedUnitKey, 'sold')
          }}
        />
      )}
      {tab === 'form-pembelian' && (
        <PembelianForm
          onProcess={() => {
            if (selectedUnitKey) advance(selectedUnitKey, 'available')
          }}
        />
      )}
    </div>
  )
}
