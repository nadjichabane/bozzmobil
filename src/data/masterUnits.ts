import { UNIT_CARS, masterChassis, type PipelineCar, type Stage } from './pipeline'

export type StatusTerakhir =
  | 'Terbeli — menunggu inspeksi selesai'
  | 'Terbeli — dalam inspeksi'
  | 'Terbeli — inspeksi lulus, pembelian diproses'
  | 'Tersedia — siap dijual'
  | 'Terjual — lunas'
  | 'Terjual — proses STNK'
  | 'Terjual — proses BPKB'

export type MasterUnit = {
  id: string
  name: string
  brand: string
  model: string
  year: number
  color: string
  transmission: 'Manual' | 'Otomatis'
  cc: number
  chassis: string
  engine: string
  acquisitionDate: string
  acquisitionPrice: number
  sellingPrice: number
  condition: 'Berkondisi Baik' | 'Butuh Perbaikan Ringan' | 'Butuh Perbaikan Besar'
  imageUrl: string
  available: boolean
  // ERD: MASTER UNIT — status terakhir
  statusMobilTerakhir: string
  informasiStatusTerakhir: string
  tanggalStatusTerakhir: string
  noHPCustomer: string
  sumber: string
  car: PipelineCar
}

export function statusForStage(stage: Stage): {
  label: string
  info: string
  date: string
} {
  switch (stage) {
    case 'purchasing':
      return {
        label: 'Tersedia — pembelian diproses',
        info: 'Unit lulus inspeksi, pembelian sedang diproses oleh admin.',
        date: '01/10/2026',
      }
    case 'available':
      return {
        label: 'Tersedia — siap dijual',
        info: 'Pembelian selesai, unit masuk ke data stok dan siap dijual.',
        date: '05/10/2026',
      }
    case 'sold':
      return {
        label: 'Terjual',
        info: 'Unit telah terjual, proses penjualan selesai.',
        date: '28/09/2026',
      }
    default:
      return { label: 'Tersedia', info: '', date: '01/10/2026' }
  }
}

export const MASTER_UNITS: MasterUnit[] = UNIT_CARS.map((c, i) => {
  const st = statusForStage(c.stage)
  return {
    id: c.key,
    name: `${c.brand} ${c.model}`,
    brand: c.brand,
    model: c.model,
    year: c.year,
    color: c.color,
    transmission: c.transmission,
    cc: 1500 + (i * 150) % 1500,
    chassis: masterChassis(c.key),
    engine: `${c.model.slice(0, 2).toUpperCase()}-${c.brand.slice(0, 2).toUpperCase()}V`,
    acquisitionDate: `0${(i % 9) + 1}/09/2026`,
    acquisitionPrice: c.buyPrice,
    sellingPrice: c.sellPrice,
    condition: c.sellPrice > c.buyPrice * 1.15 ? 'Berkondisi Baik' : 'Butuh Perbaikan Ringan',
    imageUrl: c.image,
    available: c.stage === 'available',
    statusMobilTerakhir: st.label,
    informasiStatusTerakhir: st.info,
    tanggalStatusTerakhir: st.date,
    noHPCustomer: c.phone,
    sumber: c.source,
    car: c,
  }
})
