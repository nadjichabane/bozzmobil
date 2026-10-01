export type PriceSource = {
  source: string
  price: number
  date: string
  updatedAt?: string
}

export type PriceComparison = {
  id: string
  vehicle: string
  year: number
  sources: PriceSource[]
  recommendation: string
}

export const PRICE_COMPARISONS: PriceComparison[] = [
  {
    id: '1',
    vehicle: 'Honda City',
    year: 2012,
    sources: [
      { source: 'Bozzmobil Analytics', price: 85_000_000, date: '24/09/2026', updatedAt: '24/09/2026' },
      { source: 'Spreadsheet Internal', price: 88_500_000, date: '20/09/2026' },
      { source: 'Marketplace A', price: 86_200_000, date: '23/09/2026' },
      { source: 'Supplier B', price: 91_000_000, date: '18/09/2026' },
    ],
    recommendation: 'Bozzmobil Analytics',
  },
  {
    id: '2',
    vehicle: 'Toyota Raize',
    year: 2022,
    sources: [
      { source: 'Bozzmobil Analytics', price: 158_000_000, date: '24/09/2026', updatedAt: '24/09/2026' },
      { source: 'Spreadsheet Internal', price: 155_000_000, date: '22/09/2026' },
      { source: 'Marketplace A', price: 162_500_000, date: '23/09/2026' },
      { source: 'Supplier B', price: 157_000_000, date: '19/09/2026' },
    ],
    recommendation: 'Spreadsheet Internal',
  },
  {
    id: '3',
    vehicle: 'Mitsubishi Xpander',
    year: 2021,
    sources: [
      { source: 'Bozzmobil Analytics', price: 193_500_000, date: '24/09/2026', updatedAt: '24/09/2026' },
      { source: 'Spreadsheet Internal', price: 190_000_000, date: '21/09/2026' },
      { source: 'Marketplace A', price: 188_000_000, date: '23/09/2026' },
    ],
    recommendation: 'Marketplace A',
  },
  {
    id: '4',
    vehicle: 'Toyota Fortuner',
    year: 2020,
    sources: [
      { source: 'Bozzmobil Analytics', price: 195_000_000, date: '24/09/2026', updatedAt: '24/09/2026' },
      { source: 'Spreadsheet Internal', price: 198_200_000, date: '20/09/2026' },
      { source: 'Marketplace A', price: 204_000_000, date: '23/09/2026' },
      { source: 'Supplier B', price: 196_500_000, date: '18/09/2026' },
    ],
    recommendation: 'Bozzmobil Analytics',
  },
  {
    id: '5',
    vehicle: 'Suzuki Ertiga',
    year: 2014,
    sources: [
      { source: 'Bozzmobil Analytics', price: 74_500_000, date: '24/09/2026', updatedAt: '24/09/2026' },
      { source: 'Spreadsheet Internal', price: 72_000_000, date: '22/09/2026' },
      { source: 'Marketplace A', price: 79_800_000, date: '23/09/2026' },
      { source: 'Supplier B', price: 76_000_000, date: '19/09/2026' },
    ],
    recommendation: 'Spreadsheet Internal',
  },
  {
    id: '6',
    vehicle: 'Honda CR-V',
    year: 2015,
    sources: [
      { source: 'Bozzmobil Analytics', price: 182_000_000, date: '24/09/2026', updatedAt: '24/09/2026' },
      { source: 'Spreadsheet Internal', price: 180_000_000, date: '21/09/2026' },
      { source: 'Marketplace A', price: 184_500_000, date: '23/09/2026' },
    ],
    recommendation: 'Spreadsheet Internal',
  },
]
