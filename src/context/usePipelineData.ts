import { useMemo } from 'react'
import { usePipeline } from '../context/PipelineContext'
import {
  type PipelineCar,
  type Stage,
  masterChassis,
} from '../data/pipeline'
import { type Lead, LEAD_SOURCES } from '../data/leads'
import {
  type Inspection,
  type Finding,
} from '../data/inspections'
import { type Purchase } from '../data/purchases'
import { type Sale, SALES_PEOPLE, FINANCE_OPTIONS } from '../data/sales'
import { type MasterUnit, statusForStage } from '../data/masterUnits'

// ── Derivation helpers ───────────────────────────────────────────────────────

const SUPPLIER_NAMES = [
  'PT Auto Sumber',
  'CV Mobil Jaya',
  'PT Mitra Kendaraan',
  'PT Global Mobil',
  'CV Sentosa Auto',
]

const stageToLeadStatus: Record<Stage, Lead['status']> = {
  lead: 'Baru',
  inspecting: 'Dalam Inspeksi',
  rejected: 'Ditolak',
  purchasing: 'Lulus',
  available: 'Terbeli',
  sold: 'Terjual',
}

const stageToInspectionStatus: Record<Stage, Inspection['status']> = {
  lead: 'Draft',
  inspecting: 'Dalam Inspeksi',
  rejected: 'Selesai',
  purchasing: 'Selesai',
  available: 'Selesai',
  sold: 'Selesai',
}

const FINDINGS: Record<Stage, Finding[]> = {
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

function deriveLeads(cars: PipelineCar[]): Lead[] {
  return cars.map((c, i) => ({
    id: c.key,
    code: `LD-202609${String(30 - (i % 30)).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`,
    status: stageToLeadStatus[c.stage],
    customer: c.customer,
    phone: c.phone,
    address: c.address,
    plate: c.plate,
    carType: `${c.brand} ${c.model}`,
    year: c.year,
    mileage: c.mileage,
    source: LEAD_SOURCES.find((s) => s === c.source) ?? 'Lainnya',
    expectedPrice: c.expectedPrice,
    createdAt: `0${(i % 28) + 1}/09/2026`,
  }))
}

function deriveInspections(cars: PipelineCar[]): Inspection[] {
  return cars
    .filter((c) => c.stage !== 'lead')
    .map((c, i) => {
      return {
        id: c.key,
        code: `INS-202609${String(30 - (i % 30)).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`,
        status: stageToInspectionStatus[c.stage],
        unit: `${c.brand} ${c.model} ${c.transmission === 'Otomatis' ? 'AT' : 'MT'}`,
        unitMeta: `${c.year} • ${c.transmission === 'Otomatis' ? 'AT' : 'MT'} • ${c.mileage.toLocaleString('id-ID')}km`,
        image: c.image,
        marketPrice: c.expectedPrice,
        priceAllIn: true,
        totalPoints: 158,
        pointsDone: c.stage === 'inspecting' ? 96 : c.stage === 'rejected' ? 130 : 158,
        findings: FINDINGS[c.stage],
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
      }
    })
}

function derivePurchases(cars: PipelineCar[]): Purchase[] {
  const eligible = cars.filter((c) => c.stage !== 'lead' && c.stage !== 'rejected')
  return eligible.map((c, i) => ({
    id: c.key,
    invoice: `POB-2026-04${String(i + 1).padStart(2, '0')}`,
    date: `0${(i % 28) + 1}/09/2026`,
    unit: `${c.brand} ${c.model}`,
    plate: c.plate,
    supplier: SUPPLIER_NAMES[i % SUPPLIER_NAMES.length],
    price: c.buyPrice,
    adminFee: Math.round(c.buyPrice * 0.01),
    status: c.stage === 'available' || c.stage === 'sold' ? 'Selesai' : 'Diproses',
    paymentMethod: i % 2 === 0 ? 'Transfer' : 'Tunai',
    jenisTransaksi: 'Pembelian Unit',
    image: c.image,
    car: c,
  }))
}

function deriveSales(cars: PipelineCar[]): Sale[] {
  return cars
    .filter((c) => c.stage === 'sold')
    .map((c, i) => ({
      id: c.key,
      invoice: `INV-2026-${String(31 - (i % 30)).padStart(4, '0')}`,
      idTransaksi: `TRX-2026-${String(100 + i)}`,
      date: `${String(31 - (i % 30))}/08/2026`,
      unit: `${c.brand} ${c.model} ${c.transmission === 'Otomatis' ? 'AT' : 'MT'} ${c.year}`,
      plate: c.plate,
      customer: c.customer,
      phone: c.phone,
      payment: i % 2 === 0 ? 'Credit' : 'Cash',
      finance: i % 2 === 0 ? (FINANCE_OPTIONS[i + 1] ?? '-') : '-',
      price: c.sellPrice,
      profit: Math.round(c.sellPrice - c.buyPrice),
      status: i % 3 === 0 ? 'Lunas' : i % 3 === 1 ? 'Proses STNK' : 'Proses BPKB',
      completeness: i % 3 === 0 ? 100 : i % 3 === 1 ? 80 : 60,
      jenisTransaksi: i % 4 === 0 ? 'Trade In' : 'Penjualan Unit',
      image: c.image,
      salesPerson: SALES_PEOPLE[i % SALES_PEOPLE.length] ?? '-',
      car: c,
    }))
}

function deriveMasterUnits(cars: PipelineCar[]): MasterUnit[] {
  return cars
    .filter((c) => c.stage === 'available' || c.stage === 'sold')
    .map((c, i) => {
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
}

// ── The hook ────────────────────────────────────────────────────────────────

export function usePipelineData() {
  const { cars, advance, addCar, removeCar, reset, getCar } = usePipeline()

  return useMemo(() => {
    const leads = deriveLeads(cars)
    const inspections = deriveInspections(cars)
    const purchases = derivePurchases(cars)
    const sales = deriveSales(cars)
    const masterUnits = deriveMasterUnits(cars)

    return {
      cars,
      leads,
      inspections,
      purchases,
      sales,
      masterUnits,
      advance,
      addCar,
      removeCar,
      reset,
      getCar,
    }
  }, [cars, advance, addCar, removeCar, reset, getCar])
}

// ── Tambah car baru (form Leads) ────────────────────────────────────────────

export function newPipelineCar(input: {
  customer: string
  phone: string
  address: string
  plate: string
  carType: string
  year: number
  mileage?: number
  source: string
  expectedPrice?: number
  note?: string
}): Omit<PipelineCar, 'key'> {
  // Parse "Honda City" → brand="Honda", model="City"
  const [brand = '', model = ''] = input.carType.split(' ')
  return {
    customer: input.customer,
    phone: input.phone,
    address: input.address,
    plate: input.plate,
    brand: brand || input.carType,
    model: model,
    year: input.year,
    mileage: input.mileage ?? 0,
    source: input.source,
    expectedPrice: input.expectedPrice ?? 0,
    buyPrice: 0,
    sellPrice: 0,
    image: '/cars/city.jpg',
    color: 'Hitam',
    transmission: 'Otomatis',
    stage: 'lead',
  }
}
