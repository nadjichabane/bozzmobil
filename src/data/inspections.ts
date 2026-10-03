import { INSPECTION_CARS, type PipelineCar, type Stage } from './pipeline'

export type FindingSeverity = 'Major' | 'Minor' | 'Catatan'

export type Finding = {
  id: string
  severity: FindingSeverity
  title: string
  description: string
  system: string
  area: string
  photoCount: number
  photos: string[]
}

export type InspectionCategory = {
  id: string
  label: string
  done: number
  total: number
}

export type Inspection = {
  id: string
  code: string
  status: 'Dalam Inspeksi' | 'Selesai' | 'Draft'
  unit: string
  unitMeta: string
  image: string
  marketPrice: number
  priceAllIn: boolean
  totalPoints: number
  pointsDone: number
  findings: Finding[]
  categories: InspectionCategory[]
  customer: string
  picInternal: string
  picPhone: string
  mediator: string
  mediatorPhone: string
  inspector: string
  note: string
  reason: string
  documentNote: string
  car: PipelineCar
  schemaUnit: PipelineCar['schemaUnit']
}

const CATEGORIES: InspectionCategory[] = [
  { id: 'unit', label: 'Data Unit', done: 8, total: 8 },
  { id: 'eksterior', label: 'Pemeriksaan Eksterior', done: 12, total: 12 },
  { id: 'interior', label: 'Pemeriksaan Interior', done: 14, total: 14 },
  { id: 'mesin', label: 'Pemeriksaan Mesin', done: 16, total: 16 },
  { id: 'transmisi', label: 'Pemeriksaan Transmisi', done: 8, total: 8 },
  { id: 'kaki', label: 'Pemeriksaan Kaki-kaki', done: 12, total: 12 },
  { id: 'elektrikal', label: 'Pemeriksaan Elektrikal', done: 10, total: 10 },
  { id: 'ac', label: 'Pemeriksaan AC & Pendingin', done: 8, total: 8 },
]

const FINDINGS_BY_STAGE: Record<Stage, Finding[]> = {
  lead: [],
  inspecting: [
    { id: 'f1', severity: 'Minor', title: 'Bumper Depan', description: 'Baret halus pada sisi kanan.', system: 'Eksterior', area: 'Bumper', photoCount: 2, photos: [] },
    { id: 'f2', severity: 'Catatan', title: 'Jok Pengemudi', description: 'Noda ringan, dapat dicuci.', system: 'Interior', area: 'Jok', photoCount: 1, photos: [] },
  ],
  rejected: [
    { id: 'f1', severity: 'Major', title: 'Mesin Getar', description: 'Getaran mesin kasar saat idle.', system: 'Mesin', area: 'Block', photoCount: 2, photos: [] },
    { id: 'f2', severity: 'Major', title: 'Seher Rusak', description: 'Indikasi overhaull, biaya tinggi.', system: 'Mesin', area: 'Seher', photoCount: 3, photos: [] },
    { id: 'f3', severity: 'Minor', title: 'Velg Baret', description: 'Baret dalam pada velg belakang.', system: 'Eksterior', area: 'Velg', photoCount: 2, photos: [] },
  ],
  purchasing: [
    { id: 'f1', severity: 'Minor', title: 'Cat Kusam', description: 'Permukaan cat kusam, dapat dipoles.', system: 'Eksterior', area: 'Body', photoCount: 1, photos: [] },
    { id: 'f2', severity: 'Catatan', title: 'Km Tinggi', description: 'Kilometer tinggi, kondisi masih baik.', system: 'Data Unit', area: 'Odometer', photoCount: 0, photos: [] },
  ],
  available: [],
  sold: [],
}

const stageToInspectionStatus: Record<Stage, Inspection['status']> = {
  lead: 'Draft',
  inspecting: 'Dalam Inspeksi',
  rejected: 'Selesai',
  purchasing: 'Selesai',
  available: 'Selesai',
  sold: 'Selesai',
}

const pointsDoneFor = (c: PipelineCar) =>
  c.stage === 'inspecting' ? 96 : c.stage === 'rejected' ? 130 : 158

export const INSPECTIONS: Inspection[] = INSPECTION_CARS.map((c, i) => ({
  id: c.key,
  code: `INS-202609${String(30 - i).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`,
  status: stageToInspectionStatus[c.stage],
  unit: `${c.brand} ${c.model} ${c.transmission === 'Otomatis' ? 'AT' : 'MT'}`,
  unitMeta: `${c.year} • ${c.transmission === 'Otomatis' ? 'AT' : 'MT'} • ${c.mileage.toLocaleString('id-ID')}km`,
  image: c.image,
  marketPrice: c.expectedPrice,
  priceAllIn: true,
  totalPoints: 158,
  pointsDone: pointsDoneFor(c),
  findings: FINDINGS_BY_STAGE[c.stage],
  categories: CATEGORIES,
  customer: c.customer,
  picInternal: 'PRAS',
  picPhone: '0812-3456-7890',
  mediator: 'BG DANTO',
  mediatorPhone: '+62 853-1522-0548',
  inspector: c.stage === 'rejected' ? 'Andi Saputra' : 'Budi Hermanto',
  note: c.source,
  reason:
    c.stage === 'rejected'
      ? 'Biaya perbaikan melebihi nilai jual, unit tidak direkomendasikan.'
      : c.stage === 'purchasing'
        ? 'Unit lulus inspeksi, masuk proses pembelian.'
        : c.stage === 'inspecting'
          ? 'Inspeksi sedang berlangsung.'
          : '',
  documentNote: 'Maks. 10 file (foto/video/pdf), ukuran maks. 10 MB per file.',
  car: c,
  schemaUnit: c.schemaUnit,
}))

export function countBySeverity(findings: Finding[]) {
  return {
    major: findings.filter((f) => f.severity === 'Major').length,
    minor: findings.filter((f) => f.severity === 'Minor').length,
    catatan: findings.filter((f) => f.severity === 'Catatan').length,
  }
}

export function recommend(findingCount: { major: number; minor: number }) {
  if (findingCount.major >= 2) return 'Tidak Direkomendasikan'
  if (findingCount.major === 1) return 'Value'
  return 'Certified'
}
