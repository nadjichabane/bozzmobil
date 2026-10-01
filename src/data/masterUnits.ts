import { UNIT_CARS, masterChassis, type PipelineCar } from './pipeline'

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
  car: PipelineCar
}

export const MASTER_UNITS: MasterUnit[] = UNIT_CARS.map((c, i) => ({
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
  car: c,
}))
