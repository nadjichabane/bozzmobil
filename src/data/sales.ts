import { SOLD_CARS, type PipelineCar } from './pipeline'

export type PaymentType = 'Credit' | 'Cash'
export type SaleStatus = 'Lunas' | 'Proses STNK' | 'Proses BPKB'

export type Sale = {
  id: string
  invoice: string
  idTransaksi: string
  date: string
  unit: string
  plate: string
  customer: string
  phone: string
  payment: PaymentType
  finance: string
  price: number
  profit: number
  status: SaleStatus
  completeness: number
  jenisTransaksi: 'Penjualan Unit' | 'Trade In' | 'Rekonsiliasi'
  image: string
  salesPerson: string
  car: PipelineCar
  schemaUnit: PipelineCar['schemaUnit']
}

const SALES_PERSONS: string[] = ['Rudi Hartono', 'Maya Putri', 'Andi Saputra']
const FINANCE: string[] = ['BCA Finance', 'ACC Finance', 'Mandiri Tunas', '-']

const SALES_STATUS: SaleStatus[] = ['Lunas', 'Proses STNK', 'Proses BPKB']

export const SALES: Sale[] = SOLD_CARS.map((c, i) => ({
  id: c.key,
  invoice: `INV-2026-${String(31 - i).padStart(4, '0')}`,
  idTransaksi: `TRX-2026-${String(100 + i)}`,
  date: `${String(31 - i)}/08/2026`,
  unit: `${c.brand} ${c.model} ${c.transmission === 'Otomatis' ? 'AT' : 'MT'} ${c.year}`,
  plate: c.plate,
  customer: c.customer,
  phone: c.phone,
  payment: i % 2 === 0 ? 'Credit' : 'Cash',
  finance: i % 2 === 0 ? FINANCE[i % FINANCE.length] : '-',
  price: c.sellPrice,
  profit: Math.round(c.sellPrice - c.buyPrice),
  status: SALES_STATUS[i % SALES_STATUS.length],
  completeness: i % 3 === 0 ? 100 : i % 3 === 1 ? 80 : 60,
  jenisTransaksi: i % 4 === 0 ? 'Trade In' : 'Penjualan Unit',
  image: c.image,
  salesPerson: SALES_PERSONS[i % SALES_PERSONS.length],
  car: c,
  schemaUnit: c.schemaUnit,
}))

export const formatRupiah = (value: number) =>
  `Rp ${value.toLocaleString('id-ID')}`

export const formatRupiahCompact = (value: number) => {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '')}M`
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}B`
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(1).replace(/\.?0+$/, '')}K`
  return `Rp ${value}`
}

export const SALES_PEOPLE = ['Semua Sales', 'Rudi Hartono', 'Maya Putri', 'Andi Saputra']
export const FINANCE_OPTIONS = [
  'Semua Finance',
  'BCA Finance',
  'ACC Finance',
  'Mandiri Tunas',
]
export const STATUS_OPTIONS = ['Semua Status', 'Lunas', 'Proses STNK', 'Proses BPKB']
export const PAYMENT_OPTIONS = ['Semua Jenis Pembayaran', 'Credit', 'Cash']
