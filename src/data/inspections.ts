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
}

export const INSPECTIONS: Inspection[] = [
  {
    id: '1',
    code: 'INS-20260920-001',
    status: 'Dalam Inspeksi',
    unit: 'Honda HR-V S AT',
    unitMeta: '2023 • AT • 40.000km',
    image: '/cars/serena.jpg',
    marketPrice: 243_000_000,
    priceAllIn: true,
    totalPoints: 158,
    pointsDone: 158,
    findings: [
      {
        id: 'f1',
        severity: 'Major',
        title: 'Bumper Depan',
        description: 'Terdapat baret dalam cukup di sisi kanan.',
        system: 'Eksterior',
        area: 'Bumper Depan',
        photoCount: 3,
        photos: ['/cars/serena.jpg', '/cars/fortuner.jpg'],
      },
      {
        id: 'f2',
        severity: 'Major',
        title: 'Support Radiator',
        description: 'Indikasi bekas perbaikan (repair) pada dudukan support.',
        system: 'Mesin',
        area: 'Support Radiator',
        photoCount: 2,
        photos: ['/cars/ertiga.jpg'],
      },
      {
        id: 'f3',
        severity: 'Major',
        title: 'Sekoran Oli',
        description: 'Terdapat rembes oli pada bagian cover valve.',
        system: 'Mesin',
        area: 'Rembesan',
        photoCount: 1,
        photos: [],
      },
      {
        id: 'f4',
        severity: 'Minor',
        title: 'Velg Depan Kiri',
        description: 'Baret ringan pada sisi luar velg.',
        system: 'Eksterior',
        area: 'Velg & Ban',
        photoCount: 1,
        photos: [],
      },
      {
        id: 'f5',
        severity: 'Minor',
        title: 'Jok Pengemudi',
        description: 'Terdapat sedikit noda pada jok.',
        system: 'Interior',
        area: 'Jok',
        photoCount: 1,
        photos: [],
      },
      {
        id: 'f6',
        severity: 'Minor',
        title: 'Headlamp Kanan',
        description: 'Mika kusam ringan.',
        system: 'Eksterior',
        area: 'Lampu-lampu',
        photoCount: 1,
        photos: [],
      },
      {
        id: 'f7',
        severity: 'Minor',
        title: 'Kaki-kaki Depan',
        description: 'Bushing stabilizer mulai getas.',
        system: 'Kaki-kaki',
        area: 'Suspensi',
        photoCount: 1,
        photos: [],
      },
    ],
    categories: [
      { id: 'unit', label: 'Data Unit', done: 8, total: 8 },
      { id: 'eksterior', label: 'Pemeriksaan Eksterior', done: 12, total: 12 },
      { id: 'interior', label: 'Pemeriksaan Interior', done: 14, total: 14 },
      { id: 'mesin', label: 'Pemeriksaan Mesin', done: 16, total: 16 },
      { id: 'transmisi', label: 'Pemeriksaan Transmisi', done: 8, total: 8 },
      { id: 'kaki', label: 'Pemeriksaan Kaki-kaki', done: 12, total: 12 },
      { id: 'elektrikal', label: 'Pemeriksaan Elektrikal', done: 10, total: 10 },
      { id: 'ac', label: 'Pemeriksaan AC & Pendingin', done: 8, total: 8 },
    ],
    customer: 'Pak Budi',
    picInternal: 'PRAS',
    picPhone: '0812-3456-7890',
    mediator: 'BG DANTO',
    mediatorPhone: '+62 853-1522-0548',
    inspector: 'Budi Hermanto',
    note: 'Nama cus pak Budi',
    reason:
      'Secara keseluruhan unit dalam kondisi sangat baik. Minus minor masih wajar dan dapat diperbaki.',
    documentNote: 'Maks. 10 file (foto/video/pdf), ukuran maks. 10 MB per file.',
  },
  {
    id: '2',
    code: 'INS-20260918-002',
    status: 'Selesai',
    unit: 'Toyota Fortuner VRZ',
    unitMeta: '2020 • AT • 58.000km',
    image: '/cars/fortuner.jpg',
    marketPrice: 350_000_000,
    priceAllIn: true,
    totalPoints: 158,
    pointsDone: 158,
    findings: [
      {
        id: 'f1',
        severity: 'Minor',
        title: 'Velg Belakang',
        description: 'Baret halus pada sisi dalam.',
        system: 'Eksterior',
        area: 'Velg & Ban',
        photoCount: 1,
        photos: [],
      },
      {
        id: 'f2',
        severity: 'Catatan',
        title: 'Kendali Roda',
        description: 'Setir sedikit bergetar pada kecepatan tinggi.',
        system: 'Kaki-kaki',
        area: 'Stir',
        photoCount: 0,
        photos: [],
      },
    ],
    categories: [
      { id: 'unit', label: 'Data Unit', done: 8, total: 8 },
      { id: 'eksterior', label: 'Pemeriksaan Eksterior', done: 12, total: 12 },
      { id: 'interior', label: 'Pemeriksaan Interior', done: 14, total: 14 },
      { id: 'mesin', label: 'Pemeriksaan Mesin', done: 16, total: 16 },
      { id: 'transmisi', label: 'Pemeriksaan Transmisi', done: 8, total: 8 },
      { id: 'kaki', label: 'Pemeriksaan Kaki-kaki', done: 12, total: 12 },
      { id: 'elektrikal', label: 'Pemeriksaan Elektrikal', done: 10, total: 10 },
      { id: 'ac', label: 'Pemeriksaan AC & Pendingin', done: 8, total: 8 },
    ],
    customer: 'Ibu Sari',
    picInternal: 'PRAS',
    picPhone: '0813-2222-4444',
    mediator: 'BG DANTO',
    mediatorPhone: '+62 853-1522-0548',
    inspector: 'Andi Saputra',
    note: 'Unit bersih, servis rutin',
    reason: 'Unit sangat layak jual, tidak ada temuan major.',
    documentNote: 'Maks. 10 file (foto/video/pdf), ukuran maks. 10 MB per file.',
  },
  {
    id: '3',
    code: 'INS-20260915-003',
    status: 'Draft',
    unit: 'Suzuki Ertiga GX',
    unitMeta: '2014 • MT • 120.000km',
    image: '/cars/ertiga.jpg',
    marketPrice: 90_000_000,
    priceAllIn: false,
    totalPoints: 158,
    pointsDone: 96,
    findings: [
      {
        id: 'f1',
        severity: 'Major',
        title: 'Mesin Getar',
        description: 'Getaran mesin kasar saat idle.',
        system: 'Mesin',
        area: 'Block',
        photoCount: 1,
        photos: [],
      },
    ],
    categories: [
      { id: 'unit', label: 'Data Unit', done: 8, total: 8 },
      { id: 'eksterior', label: 'Pemeriksaan Eksterior', done: 12, total: 12 },
      { id: 'interior', label: 'Pemeriksaan Interior', done: 14, total: 14 },
      { id: 'mesin', label: 'Pemeriksaan Mesin', done: 8, total: 16 },
      { id: 'transmisi', label: 'Pemeriksaan Transmisi', done: 8, total: 8 },
      { id: 'kaki', label: 'Pemeriksaan Kaki-kaki', done: 12, total: 12 },
      { id: 'elektrikal', label: 'Pemeriksaan Elektrikal', done: 5, total: 10 },
      { id: 'ac', label: 'Pemeriksaan AC & Pendingin', done: 6, total: 8 },
    ],
    customer: 'Pak Dedi',
    picInternal: 'PRAS',
    picPhone: '0812-8888-9999',
    mediator: 'BG DANTO',
    mediatorPhone: '+62 853-1522-0548',
    inspector: 'Budi Hermanto',
    note: 'Lanjut inspeksi mesin',
    reason: '',
    documentNote: 'Maks. 10 file (foto/video/pdf), ukuran maks. 10 MB per file.',
  },
]

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
