export type Supplier = {
  id: string
  name: string
  company: string
  contact: string
  phone: string
  email: string
  address: string
  totalSupplied: number
  totalValue: number
  joinedDate: string
}

export const SUPPLIERS: Supplier[] = [
  {
    id: '1', name: 'PT Auto Sumber Makmur', company: 'Auto Sumber',
    contact: 'Hendra Wijaya', phone: '021-5551234',
    email: 'hendra@autosumber.co.id',
    address: 'Jl. Raya Bekasi No. 45, Jakarta Timur',
    totalSupplied: 24, totalValue: 3_200_000_000, joinedDate: '15/01/2023',
  },
  {
    id: '2', name: 'CV Mobil Jaya Abadi', company: 'Mobil Jaya',
    contact: 'Susanto', phone: '021-5555678',
    email: 'susanto@mobiljaya.com',
    address: 'Jl. Sudirman No. 112, Jakarta Pusat',
    totalSupplied: 18, totalValue: 2_800_000_000, joinedDate: '03/06/2023',
  },
  {
    id: '3', name: 'Toko mobil Berkah Motor', company: 'Berkah Motor',
    contact: 'Agus Pratama', phone: '0812-9876-5432',
    email: 'agus@berkahmotor.com',
    address: 'Jl. Gatot Subroto No. 88, Bandung',
    totalSupplied: 12, totalValue: 1_500_000_000, joinedDate: '20/09/2023',
  },
  {
    id: '4', name: 'PT Mitra Kendaraan Nusantara', company: 'Mitra Kendaraan',
    contact: 'Ratna Sari', phone: '021-5559876',
    email: 'ratna@mitrakendaraan.co.id',
    address: 'Jl. Ahmad Yani No. 33, Surabaya',
    totalSupplied: 31, totalValue: 4_100_000_000, joinedDate: '10/03/2022',
  },
  {
    id: '5', name: 'CV Sentosa Auto Trading', company: 'Sentosa Auto',
    contact: 'Budi Setiawan', phone: '0813-4567-8901',
    email: 'budi@sentoauto.com',
    address: 'Jl. Diponegoro No. 67, Semarang',
    totalSupplied: 8, totalValue: 980_000_000, joinedDate: '05/11/2023',
  },
  {
    id: '6', name: 'PT Global Mobil Indonesia', company: 'Global Mobil',
    contact: 'Dewi Lestari', phone: '021-5554321',
    email: 'dewi@globalmobil.id',
    address: 'Jl. Rasuna Said No. 22, Jakarta Selatan',
    totalSupplied: 45, totalValue: 6_200_000_000, joinedDate: '01/08/2021',
  },
]
