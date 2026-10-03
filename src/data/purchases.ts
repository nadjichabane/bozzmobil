import { PURCHASE_CARS, type PipelineCar } from './pipeline'

export type Purchase = {
  id: string
  invoice: string
  date: string
  unit: string
  plate: string
  supplier: string
  price: number
  adminFee: number
  status: 'Selesai' | 'Diproses' | 'Dibatalkan'
  paymentMethod: 'Transfer' | 'Tunai'
  jenisTransaksi: 'Pembelian Unit' | 'Pembelian Sparepart' | 'Pembelian Jasa'
  image: string
  car: PipelineCar
  schemaUnit: PipelineCar['schemaUnit']
}

const SUPPLIERS = [
  'PT Auto Sumber',
  'CV Mobil Jaya',
  'PT Mitra Kendaraan',
  'PT Global Mobil',
  'CV Sentosa Auto',
]

export const PURCHASES: Purchase[] = PURCHASE_CARS.map((c, i) => ({
  id: c.key,
  invoice: `POB-2026-04${String(i + 1).padStart(2, '0')}`,
  date: `0${i + 1}/09/2026`,
  unit: `${c.brand} ${c.model}`,
  plate: c.plate,
  supplier: SUPPLIERS[i % SUPPLIERS.length],
  price: c.buyPrice,
  adminFee: Math.round(c.buyPrice * 0.01),
  status: c.stage === 'available' || c.stage === 'sold' ? 'Selesai' : 'Diproses',
  paymentMethod: i % 2 === 0 ? 'Transfer' : 'Tunai',
  jenisTransaksi: i % 3 === 0 ? 'Pembelian Unit' : i % 3 === 1 ? 'Pembelian Unit' : 'Pembelian Jasa',
  image: c.image,
  car: c,
  schemaUnit: c.schemaUnit,
}))
