import { PembelianPage } from './PembelianPage'
import { SalesPage } from './SalesPage'

export function TransaksiPage() {
  return (
    <div>
      <SalesPage />
      <div className="mb-6 mt-10 border-t border-line pt-6">
        <PembelianPage />
      </div>
    </div>
  )
}
