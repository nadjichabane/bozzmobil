export type InventoryUnit = {
  id: string
  unit: string
  plate: string
  year: number
  color: string
  acquisitionDate: string
  acquisitionPrice: number
  askingPrice: number
  storageLocation: string
  condition: 'Berkondisi Baik' | 'Butuh Perbaikan Ringan' | 'Butuh Perbaikan Besar'
  daysInStock: number
  available: boolean
}

export const INVENTORY: InventoryUnit[] = [
  { id: '1', unit: 'Honda City E MT', plate: 'B 1505 TAG', year: 2012, color: 'Hitam', acquisitionDate: '12/03/2024', acquisitionPrice: 85_000_000, askingPrice: 105_000_000, storageLocation: 'Lantai 1 - A1', condition: 'Berkondisi Baik', daysInStock: 14, available: true },
  { id: '2', unit: 'Toyota Raize GR Sport', plate: 'F 1573 AHW', year: 2022, color: 'Putih', acquisitionDate: '05/07/2024', acquisitionPrice: 155_000_000, askingPrice: 187_000_000, storageLocation: 'Lantai 1 - B3', condition: 'Berkondisi Baik', daysInStock: 7, available: true },
  { id: '3', unit: 'Mitsubishi Xpander GLX', plate: 'B 1469 OKH', year: 2021, color: 'Silver', acquisitionDate: '20/02/2024', acquisitionPrice: 190_000_000, askingPrice: 225_000_000, storageLocation: 'Lantai 1 - A2', condition: 'Berkondisi Baik', daysInStock: 21, available: true },
  { id: '4', unit: 'Toyota Fortuner VRZ', plate: 'B 1355 NJK', year: 2020, color: 'Hitam', acquisitionDate: '15/08/2023', acquisitionPrice: 195_000_000, askingPrice: 230_000_000, storageLocation: 'Lantai 2 - C1', condition: 'Berkondisi Baik', daysInStock: 45, available: false },
  { id: '5', unit: 'Suzuki Ertiga GX', plate: 'F 1522 FNC', year: 2014, color: 'Merah', acquisitionDate: '10/11/2023', acquisitionPrice: 72_000_000, askingPrice: 90_000_000, storageLocation: 'Lantai 1 - D2', condition: 'Butuh Perbaikan Ringan', daysInStock: 60, available: false },
  { id: '6', unit: 'Honda CR-V 2.4', plate: 'B 1010 KJJ', year: 2015, color: 'Silver', acquisitionDate: '03/06/2023', acquisitionPrice: 180_000_000, askingPrice: 217_000_000, storageLocation: 'Lantai 1 - A3', condition: 'Berkondisi Baik', daysInStock: 32, available: false },
  { id: '7', unit: 'Nissan Serena HWS', plate: 'B 2144 UKL', year: 2012, color: 'Hitam', acquisitionDate: '18/01/2024', acquisitionPrice: 95_000_000, askingPrice: 120_000_000, storageLocation: 'Lantai 2 - B1', condition: 'Berkondisi Baik', daysInStock: 38, available: false },
  { id: '8', unit: 'Toyota Agya TRD Sportivo', plate: 'F 1309 OHM', year: 2019, color: 'Merah', acquisitionDate: '25/09/2024', acquisitionPrice: 82_000_000, askingPrice: 102_000_000, storageLocation: 'Lantai 1 - C3', condition: 'Berkondisi Baik', daysInStock: 5, available: true },
  { id: '9', unit: 'Mazda CX-5 2.0 Dynamic', plate: 'B 1221 CX5', year: 2017, color: 'Biru', acquisitionDate: '07/04/2024', acquisitionPrice: 200_000_000, askingPrice: 245_000_000, storageLocation: 'Lantai 2 - A1', condition: 'Berkondisi Baik', daysInStock: 28, available: true },
  { id: '10', unit: 'Hyundai Creta Prime', plate: 'B 1550 CRT', year: 2022, color: 'Putih', acquisitionDate: '14/12/2024', acquisitionPrice: 218_000_000, askingPrice: 268_000_000, storageLocation: 'Lantai 1 - B2', condition: 'Berkondisi Baik', daysInStock: 3, available: true },
  { id: '11', unit: 'Toyota Innova Reborn', plate: 'B 1677 PST', year: 2018, color: 'Silver', acquisitionDate: '30/05/2024', acquisitionPrice: 215_000_000, askingPrice: 265_000_000, storageLocation: 'Lantai 2 - C2', condition: 'Berkondisi Baik', daysInStock: 52, available: false },
  { id: '12', unit: 'Daihatsu Terios R', plate: 'F 1444 QWE', year: 2019, color: 'Putih', acquisitionDate: '22/08/2024', acquisitionPrice: 140_000_000, askingPrice: 175_000_000, storageLocation: 'Lantai 1 - D1', condition: 'Berkondisi Baik', daysInStock: 19, available: true },
]
