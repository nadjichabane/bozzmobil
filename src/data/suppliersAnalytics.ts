import { type Supplier, SUPPLIERS } from '../data/suppliers'

export type SupplierDetail = {
  fullName: string
  profession: string
  birthDate: string
  city: string
  phone: string
  email: string
  address: string
  repeat: boolean
  lastBuy: { date: string; car: string; image: string; price: number }
}

export const SUPPLIER_DETAILS: Record<string, SupplierDetail> = {
  '1': {
    fullName: 'PT Auto Sumber Makmur',
    profession: 'Dealer Mobil',
    birthDate: '10/03/1990',
    city: 'Jakarta Timur',
    phone: '021-5551234',
    email: 'hendra@autosumber.co.id',
    address: 'Jl. Raya Bekasi No. 45, Jakarta Timur',
    repeat: true,
    lastBuy: { date: '15/09/2026', car: 'Toyota Fortuner 2.4 VRZ', image: '/cars/fortuner.jpg', price: 310_000_000 },
  },
  '2': {
    fullName: 'CV Mobil Jaya Abadi',
    profession: 'Perorangan',
    birthDate: '22/07/1985',
    city: 'Jakarta Pusat',
    phone: '021-5555678',
    email: 'susanto@mobiljaya.com',
    address: 'Jl. Sudirman No. 112, Jakarta Pusat',
    repeat: true,
    lastBuy: { date: '12/09/2026', car: 'Honda BR-V E 2021', image: '/cars/serena.jpg', price: 185_000_000 },
  },
  '3': {
    fullName: 'Toko Mobil Berkah Motor',
    profession: 'Perorangan',
    birthDate: '05/11/1992',
    city: 'Bandung',
    phone: '0812-9876-5432',
    email: 'agus@berkahmotor.com',
    address: 'Jl. Gatot Subroto No. 88, Bandung',
    repeat: false,
    lastBuy: { date: '28/08/2026', car: 'Suzuki Ertiga GX', image: '/cars/ertiga.jpg', price: 90_000_000 },
  },
  '4': {
    fullName: 'PT Mitra Kendaraan Nusantara',
    profession: 'Broker',
    birthDate: '18/01/1988',
    city: 'Surabaya',
    phone: '021-5559876',
    email: 'ratna@mitrakendaraan.co.id',
    address: 'Jl. Ahmad Yani No. 33, Surabaya',
    repeat: true,
    lastBuy: { date: '20/09/2026', car: 'Hyundai Stargazer Prime', image: '/cars/xpander.jpg', price: 175_000_000 },
  },
  '5': {
    fullName: 'CV Sentosa Auto Trading',
    profession: 'Dealer Mobil',
    birthDate: '30/06/1995',
    city: 'Semarang',
    phone: '0813-4567-8901',
    email: 'budi@sentoauto.com',
    address: 'Jl. Diponegoro No. 67, Semarang',
    repeat: false,
    lastBuy: { date: '10/09/2026', car: 'Kia Sportage EX 2018', image: '/cars/raize.jpg', price: 230_000_000 },
  },
  '6': {
    fullName: 'PT Global Mobil Indonesia',
    profession: 'Dealer Mobil',
    birthDate: '14/02/1980',
    city: 'Jakarta Selatan',
    phone: '021-5554321',
    email: 'dewi@globalmobil.id',
    address: 'Jl. Rasuna Said No. 22, Jakarta Selatan',
    repeat: true,
    lastBuy: { date: '07/09/2026', car: 'Mitsubishi Pajero Sport Dakar', image: '/cars/xpander.jpg', price: 350_000_000 },
  },
}

export function computeSupplierKpis(suppliers: Supplier[]) {
  const total = suppliers.length
  const repeat = suppliers.filter((s) => SUPPLIER_DETAILS[s.id]?.repeat).length
  const totalValue = suppliers.reduce((sum, s) => sum + s.totalValue, 0)
  const totalTx = suppliers.reduce((sum, s) => sum + s.totalSupplied, 0)
  return {
    total,
    repeat,
    isNew: total - repeat,
    totalValue,
    totalTx,
    repeatPct: total > 0 ? Math.round((repeat / total) * 100) : 0,
    newPct: total > 0 ? Math.round(((total - repeat) / total) * 100) : 0,
  }
}

export function supplierAge(birthDate: string) {
  const b = new Date(birthDate)
  const now = new Date('2026-10-01')
  let age = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--
  return age
}

export function supplierCharts(suppliers: Supplier[]) {
  const professions = new Map<string, number>()
  for (const s of suppliers) {
    const p = s.profesi ?? 'Lainnya'
    professions.set(p, (professions.get(p) ?? 0) + 1)
  }
  const profColors = ['#0D6EFD', '#F59E0B', '#22C55E', '#8B5CF6', '#06B6D4', '#EF4444']
  const profSlices = Array.from(professions.entries()).map(([label, value], i) => ({
    label,
    value,
    color: profColors[i % profColors.length],
  }))

  const buckets = new Map<string, number>()
  const bucketFor = (age: number) =>
    age < 30 ? 'Under 30' : age < 40 ? '30-39' : age < 50 ? '40-49' : '50+'
  for (const s of suppliers) {
    if (!s.birthDate) continue
    const b = bucketFor(supplierAge(s.birthDate))
    buckets.set(b, (buckets.get(b) ?? 0) + 1)
  }
  const bucketColors: Record<string, string> = {
    'Under 30': '#0D6EFD',
    '30-39': '#F59E0B',
    '40-49': '#22C55E',
    '50+': '#8B5CF6',
  }
  const ageSlices = ['Under 30', '30-39', '40-49', '50+'].map((b) => ({
    label: b,
    value: buckets.get(b) ?? 0,
    color: bucketColors[b],
  }))

  return { profSlices, ageSlices }
}

export { SUPPLIERS }
