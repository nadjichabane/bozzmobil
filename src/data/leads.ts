export type LeadStatus = 'Baru' | 'Dijadwalkan' | 'Dalam Inspeksi' | 'Selesai' | 'Ditolak'
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
  mileage?: number
  source: LeadSource
  expectedPrice?: number
  note?: string
  createdAt: string
}

export const LEADS: Lead[] = [
  {
    id: '1',
    code: 'LD-20260925-001',
    status: 'Baru',
    customer: 'Budi Santoso',
    phone: '0812-3456-7890',
    address: 'Jl. Melati No. 12, Jakarta Timur',
    plate: 'B 1505 TAG',
    carType: 'Honda City',
    year: 2012,
    mileage: 85_000,
    source: 'Walk In',
    expectedPrice: 95_000_000,
    note: 'Unit dari pelanggan, ingin estimasi sebelum dijual.',
    createdAt: '25/09/2026',
  },
  {
    id: '2',
    code: 'LD-20260924-002',
    status: 'Dijadwalkan',
    customer: 'Sari Wulandari',
    phone: '0813-2222-4444',
    address: 'Jl. Kenanga No. 5, Bekasi',
    plate: 'F 3344 ABC',
    carType: 'Suzuki Ertiga',
    year: 2014,
    mileage: 120_000,
    source: 'Referral',
    expectedPrice: 90_000_000,
    note: 'Inspeksi dijadwalkan 28/09, customer minta sertifikasi kondisi.',
    createdAt: '24/09/2026',
  },
  {
    id: '3',
    code: 'LD-20260923-003',
    status: 'Dalam Inspeksi',
    customer: 'Dedi Kurnia',
    phone: '0812-8888-9999',
    address: 'Jl. Mawar No. 21, Depok',
    plate: 'B 7788 MNO',
    carType: 'Toyota Fortuner',
    year: 2020,
    mileage: 58_000,
    source: 'Pembelian Toko',
    expectedPrice: 350_000_000,
    note: 'Unit beli dari supplier, sedang diinspeksi tim.',
    createdAt: '23/09/2026',
  },
  {
    id: '4',
    code: 'LD-20260922-004',
    status: 'Selesai',
    customer: 'Rina Kartika',
    phone: '0811-5566-7788',
    address: 'Jl. Anggrek No. 8, Tangerang',
    plate: 'B 4455 DEF',
    carType: 'Mitsubishi Xpander',
    year: 2021,
    mileage: 45_000,
    source: 'Iklan Online',
    expectedPrice: 225_000_000,
    note: 'Inspeksi selesai, unit direkomendasikan Certified.',
    createdAt: '22/09/2026',
  },
  {
    id: '5',
    code: 'LD-20260921-005',
    status: 'Ditolak',
    customer: 'Tono Saputra',
    phone: '0821-9900-1122',
    address: 'Jl. Padi No. 3, Jakarta Barat',
    plate: 'B 9900 STU',
    carType: 'Nissan Serena',
    year: 2012,
    mileage: 160_000,
    source: 'Lelang',
    expectedPrice: 110_000_000,
    note: 'Kondisi kurang layak, biaya perbaikan melebihi nilai jual.',
    createdAt: '21/09/2026',
  },
]

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
  'Dijadwalkan',
  'Dalam Inspeksi',
  'Selesai',
  'Ditolak',
]

export type LeadInput = Omit<Lead, 'id' | 'code' | 'createdAt'>
