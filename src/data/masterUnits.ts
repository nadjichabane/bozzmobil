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
}

export const MASTER_UNITS: MasterUnit[] = [
  {
    id: '1', name: 'Honda City E MT', brand: 'Honda', model: 'City', year: 2012,
    color: 'Hitam', transmission: 'Manual', cc: 1497,
    chassis: 'MHFGD18DEBG000123', engine: 'L15A7',
    acquisitionDate: '12/03/2024', acquisitionPrice: 85_000_000, sellingPrice: 105_000_000,
    condition: 'Berkondisi Baik', imageUrl: '/cars/city.jpg', available: true,
  },
  {
    id: '2', name: 'Toyota Raize GR Sport', brand: 'Toyota', model: 'Raize', year: 2022,
    color: 'Putih', transmission: 'Otomatis', cc: 1197,
    chassis: 'NTDA21GK0N000456', engine: '2NR-VE',
    acquisitionDate: '05/07/2024', acquisitionPrice: 155_000_000, sellingPrice: 187_000_000,
    condition: 'Berkondisi Baik', imageUrl: '/cars/raize.jpg', available: true,
  },
  {
    id: '3', name: 'Mitsubishi Xpander GLX', brand: 'Mitsubishi', model: 'Xpander', year: 2021,
    color: 'Silver', transmission: 'Otomatis', cc: 1499,
    chassis: 'JAHTB2EA6M000789', engine: '4B11',
    acquisitionDate: '20/02/2024', acquisitionPrice: 190_000_000, sellingPrice: 225_000_000,
    condition: 'Berkondisi Baik', imageUrl: '/cars/xpander.jpg', available: true,
  },
  {
    id: '4', name: 'Toyota Fortuner VRZ', brand: 'Toyota', model: 'Fortuner', year: 2020,
    color: 'Hitam', transmission: 'Otomatis', cc: 2755,
    chassis: 'JTFAJ5DW1L001234', engine: '2GD-FTV',
    acquisitionDate: '15/08/2023', acquisitionPrice: 195_000_000, sellingPrice: 230_000_000,
    condition: 'Berkondisi Baik', imageUrl: '/cars/fortuner.jpg', available: false,
  },
  {
    id: '5', name: 'Suzuki Ertiga GX', brand: 'Suzuki', model: 'Ertiga', year: 2014,
    color: 'Merah', transmission: 'Manual', cc: 1462,
    chassis: 'MFMSH1CCLC000567', engine: 'K15B',
    acquisitionDate: '10/11/2023', acquisitionPrice: 72_000_000, sellingPrice: 90_000_000,
    condition: 'Butuh Perbaikan Ringan', imageUrl: '/cars/ertiga.jpg', available: false,
  },
  {
    id: '6', name: 'Honda CR-V 2.4', brand: 'Honda', model: 'CR-V', year: 2015,
    color: 'Silver', transmission: 'Otomatis', cc: 2356,
    chassis: 'JHLCR5888FC000890', engine: 'K24Z7',
    acquisitionDate: '03/06/2023', acquisitionPrice: 180_000_000, sellingPrice: 217_000_000,
    condition: 'Berkondisi Baik', imageUrl: '/cars/fortuner.jpg', available: false,
  },
  {
    id: '7', name: 'Nissan Serena HWS', brand: 'Nissan', model: 'Serena', year: 2012,
    color: 'Hitam', transmission: 'Otomatis', cc: 2000,
    chassis: 'MNN26-1234567', engine: 'QR25DE',
    acquisitionDate: '18/01/2024', acquisitionPrice: 95_000_000, sellingPrice: 120_000_000,
    condition: 'Berkondisi Baik', imageUrl: '/cars/serena.jpg', available: false,
  },
  {
    id: '8', name: 'Toyota Agya TRD Sportivo', brand: 'Toyota', model: 'Agya', year: 2019,
    color: 'Merah', transmission: 'Manual', cc: 998,
    chassis: 'MHMTY23AXJU000123', engine: '1KR-VE',
    acquisitionDate: '25/09/2024', acquisitionPrice: 82_000_000, sellingPrice: 102_000_000,
    condition: 'Berkondisi Baik', imageUrl: '/cars/agya.jpg', available: true,
  },
  {
    id: '9', name: 'Mazda CX-5 2.0 Dynamic', brand: 'Mazda', model: 'CX-5', year: 2017,
    color: 'Biru', transmission: 'Otomatis', cc: 1998,
    chassis: 'JMZKFARF1H1000456', engine: 'PE-VPS',
    acquisitionDate: '07/04/2024', acquisitionPrice: 200_000_000, sellingPrice: 245_000_000,
    condition: 'Berkondisi Baik', imageUrl: '/cars/xpander.jpg', available: true,
  },
  {
    id: '10', name: 'Hyundai Creta Prime', brand: 'Hyundai', model: 'Creta', year: 2022,
    color: 'Putih', transmission: 'Otomatis', cc: 1493,
    chassis: 'UMRHF41C4NJ000789', engine: 'G4FC',
    acquisitionDate: '14/12/2024', acquisitionPrice: 218_000_000, sellingPrice: 268_000_000,
    condition: 'Berkondisi Baik', imageUrl: '/cars/raize.jpg', available: true,
  },
  {
    id: '11', name: 'Toyota Innova Reborn Zenix', brand: 'Toyota', model: 'Innova', year: 2018,
    color: 'Silver', transmission: 'Otomatis', cc: 1798,
    chassis: 'MHFGM2BA5JU001234', engine: '2NR-VE',
    acquisitionDate: '30/05/2024', acquisitionPrice: 215_000_000, sellingPrice: 265_000_000,
    condition: 'Berkondisi Baik', imageUrl: '/cars/city.jpg', available: false,
  },
  {
    id: '12', name: 'Daihatsu Terios R', brand: 'Daihatsu', model: 'Terios', year: 2019,
    color: 'Putih', transmission: 'Otomatis', cc: 1496,
    chassis: 'MDJA3FFXXKP000567', engine: '3NR-FT',
    acquisitionDate: '22/08/2024', acquisitionPrice: 140_000_000, sellingPrice: 175_000_000,
    condition: 'Berkondisi Baik', imageUrl: '/cars/fortuner.jpg', available: true,
  },
]
