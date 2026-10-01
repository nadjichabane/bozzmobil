import { PIPELINE, type Stage } from './pipeline'

export type LeadStatus =
  | 'Baru'
  | 'Dalam Inspeksi'
  | 'Ditolak'
  | 'Lulus'
  | 'Terbeli'
  | 'Terjual'

export type LeadSource =
  | 'Iklan Online'
  | 'Walk In'
  | 'Referral'
  | 'Media Sosial'
  | 'Pembelian Toko'
  | 'Lelang'
  | 'Lainnya'

export type Lead = {
  id: string
  code: string
  status: LeadStatus
  customer: string
  phone: string
  address: string
  plate: string
  carType: string
  year: number
  mileage: number
  source: LeadSource
  expectedPrice: number
  note?: string
  createdAt: string
}

const stageToStatus: Record<Stage, LeadStatus> = {
  lead: 'Baru',
  inspecting: 'Dalam Inspeksi',
  rejected: 'Ditolak',
  purchasing: 'Lulus',
  available: 'Terbeli',
  sold: 'Terjual',
}

const dayFor = (i: number) => `${String(28 - i).padStart(2, '0')}/09/2026`

export const LEADS: Lead[] = PIPELINE.map((c, i) => ({
  id: c.key,
  code: `LD-202609${String(30 - i).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`,
  status: stageToStatus[c.stage],
  customer: c.customer,
  phone: c.phone,
  address: c.address,
  plate: c.plate,
  carType: `${c.brand} ${c.model}`,
  year: c.year,
  mileage: c.mileage,
  source: c.source,
  expectedPrice: c.expectedPrice,
  createdAt: dayFor(i),
}))

export const LEAD_SOURCES: LeadSource[] = [
  'Iklan Online',
  'Walk In',
  'Referral',
  'Media Sosial',
  'Pembelian Toko',
  'Lelang',
  'Lainnya',
]

export const LEAD_STATUSES: LeadStatus[] = [
  'Baru',
  'Dalam Inspeksi',
  'Ditolak',
  'Lulus',
  'Terbeli',
  'Terjual',
]

export type LeadInput = Omit<Lead, 'id' | 'code' | 'createdAt'>
