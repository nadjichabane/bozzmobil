export type Purchase = {
  id: string
  invoice: string
  date: string
  unit: string
  plate: string
  supplier: string
  price: number
  adminFee: number
  status: 'Selesai' | 'Diproses' | 'Dibatalkan'
  paymentMethod: 'Transfer' | 'Tunai'
  image: string
}

export const PURCHASES: Purchase[] = [
  { id: '1', invoice: 'POB-2026-0401', date: '01/09/2026', unit: 'Honda Civic RS 2020', plate: 'B 2233 XYZ', supplier: 'PT Auto Sumber', price: 240_000_000, adminFee: 2_500_000, status: 'Selesai', paymentMethod: 'Transfer', image: '/cars/city.jpg' },
  { id: '2', invoice: 'POB-2026-0402', date: '03/09/2026', unit: 'Toyota Avanza 1.5 G 2019', plate: 'F 3344 ABC', supplier: 'CV Mobil Jaya', price: 155_000_000, adminFee: 1_500_000, status: 'Selesai', paymentMethod: 'Transfer', image: '/cars/ertiga.jpg' },
  { id: '3', invoice: 'POB-2026-0403', date: '05/09/2026', unit: 'Suzuki Jimny JLX 2021', plate: 'B 4455 DEF', supplier: 'PT Mitra Kendaraan', price: 210_000_000, adminFee: 2_000_000, status: 'Diproses', paymentMethod: 'Transfer', image: '/cars/fortuner.jpg' },
  { id: '4', invoice: 'POB-2026-0404', date: '07/09/2026', unit: 'Mitsubishi Pajero Sport Dakar', plate: 'B 5566 GHI', supplier: 'PT Global Mobil', price: 350_000_000, adminFee: 3_500_000, status: 'Diproses', paymentMethod: 'Transfer', image: '/cars/xpander.jpg' },
  { id: '5', invoice: 'POB-2026-0405', date: '10/09/2026', unit: 'Kia Sportage EX 2018', plate: 'F 6677 JKL', supplier: 'CV Sentosa Auto', price: 230_000_000, adminFee: 2_000_000, status: 'Selesai', paymentMethod: 'Transfer', image: '/cars/raize.jpg' },
  { id: '6', invoice: 'POB-2026-0406', date: '12/09/2026', unit: 'Honda BR-V E 2021', plate: 'B 7788 MNO', supplier: 'PT Auto Sumber', price: 185_000_000, adminFee: 1_800_000, status: 'Dibatalkan', paymentMethod: 'Tunai', image: '/cars/serena.jpg' },
  { id: '7', invoice: 'POB-2026-0407', date: '15/09/2026', unit: 'Toyota Fortuner 2.4 VRZ', plate: 'B 8899 PQR', supplier: 'CV Mobil Jaya', price: 310_000_000, adminFee: 3_000_000, status: 'Selesai', paymentMethod: 'Transfer', image: '/cars/fortuner.jpg' },
  { id: '8', invoice: 'POB-2026-0408', date: '18/09/2026', unit: 'Hyundai Stargazer Prime', plate: 'F 9900 STU', supplier: 'PT Mitra Kendaraan', price: 175_000_000, adminFee: 1_500_000, status: 'Selesai', paymentMethod: 'Transfer', image: '/cars/xpander.jpg' },
]
