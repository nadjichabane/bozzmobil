import { PURCHASE_CARS, type PipelineCar, type Stage } from './pipeline'

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
  image: string
  car: PipelineCar
}

const SUPPLIERS = [
  'PT Auto Sumber',
  'CV Mobil Jaya',
  'PT Mitra Kendaraan',
  'PT Global Mobil',
  'CV Sentosa Auto',
]

const stageToPurchaseStatus: Record<Stage, Purchase['status']> = {
  lead: 'Diproses',
  inspecting: 'Diproses',
  rejected: 'Dibatalkan',
  purchasing: 'Diproses',
  available: 'Selesai',
  sold: 'Selesai',
}

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
  image: c.image,
  car: c,
}))
