// Single source of truth: 30 mobil mengikuti lifecycle
// Leads -> Inspeksi -> (lulus) Pembelian -> Unit Tersedia -> Penjualan
// Modul lain (leads, inspections, purchases, masterUnits, sales) di-derive dari sini.

export type Stage =
  | 'lead'          // masuk, belum diinspeksi
  | 'inspecting'    // sedang diinspeksi
  | 'rejected'      // gagal inspeksi
  | 'purchasing'    // lulus, pembelian diproses
  | 'available'     // unit tersedia (sudah dibeli, belum terjual)
  | 'sold'          // terjual

export type PipelineCar = {
  key: string
  stage: Stage
  customer: string
  phone: string
  address: string
  plate: string
  brand: string
  model: string
  year: number
  mileage: number
  source: string
  expectedPrice: number
  buyPrice: number
  sellPrice: number
  image: string
  color: string
  transmission: 'Manual' | 'Otomatis'
}

const CARS: PipelineCar[] = [
  // ===== LEADS (10) — belum / menunggu inspeksi =====
  { key: 'honda-city', stage: 'lead', customer: 'Budi Santoso', phone: '0812-3456-7890', address: 'Jl. Melati No. 12, Jakarta Timur', plate: 'B 1505 TAG', brand: 'Honda', model: 'City', year: 2012, mileage: 85_000, source: 'Walk In', expectedPrice: 95_000_000, buyPrice: 85_000_000, sellPrice: 105_000_000, image: '/cars/city.jpg', color: 'Hitam', transmission: 'Manual' },
  { key: 'toyota-raize', stage: 'lead', customer: 'Andi Wijaya', phone: '0813-2222-4444', address: 'Jl. Kenanga No. 5, Bekasi', plate: 'F 1573 AHW', brand: 'Toyota', model: 'Raize', year: 2022, mileage: 22_000, source: 'Referral', expectedPrice: 180_000_000, buyPrice: 155_000_000, sellPrice: 187_000_000, image: '/cars/raize.jpg', color: 'Putih', transmission: 'Otomatis' },
  { key: 'mitsubishi-xpander', stage: 'lead', customer: 'Dina Marlina', phone: '0812-8888-9999', address: 'Jl. Mawar No. 21, Depok', plate: 'B 1469 OKH', brand: 'Mitsubishi', model: 'Xpander', year: 2021, mileage: 45_000, source: 'Iklan Online', expectedPrice: 215_000_000, buyPrice: 190_000_000, sellPrice: 225_000_000, image: '/cars/xpander.jpg', color: 'Silver', transmission: 'Otomatis' },
  { key: 'suzuki-ertiga', stage: 'lead', customer: 'Siti Aisyah', phone: '0813-7777-6666', address: 'Jl. Anggrek No. 8, Tangerang', plate: 'F 1522 FNC', brand: 'Suzuki', model: 'Ertiga', year: 2014, mileage: 120_000, source: 'Media Sosial', expectedPrice: 88_000_000, buyPrice: 72_000_000, sellPrice: 90_000_000, image: '/cars/ertiga.jpg', color: 'Merah', transmission: 'Manual' },
  { key: 'toyota-fortuner', stage: 'lead', customer: 'Rizky Pratama', phone: '0812-1212-3434', address: 'Jl. Padi No. 3, Jakarta Barat', plate: 'B 1355 NJK', brand: 'Toyota', model: 'Fortuner', year: 2020, mileage: 58_000, source: 'Lelang', expectedPrice: 340_000_000, buyPrice: 310_000_000, sellPrice: 350_000_000, image: '/cars/fortuner.jpg', color: 'Hitam', transmission: 'Otomatis' },
  // ===== INSPEKSI (5) — sedang diinspeksi =====
  { key: 'honda-hrv', stage: 'inspecting', customer: 'Budi Hermanto', phone: '0812-3456-1111', address: 'Jl. Melati No. 20, Jakarta Timur', plate: 'B 1999 HRV', brand: 'Honda', model: 'HR-V', year: 2023, mileage: 40_000, source: 'Pembelian Toko', expectedPrice: 243_000_000, buyPrice: 205_000_000, sellPrice: 260_000_000, image: '/cars/serena.jpg', color: 'Putih', transmission: 'Otomatis' },
  { key: 'suzuki-erlinga', stage: 'inspecting', customer: 'Dedi Kurnia', phone: '0812-8888-2222', address: 'Jl. Mawar No. 33, Depok', plate: 'B 7788 MNO', brand: 'Suzuki', model: 'Ertiga', year: 2014, mileage: 120_000, source: 'Pembelian Toko', expectedPrice: 92_000_000, buyPrice: 75_000_000, sellPrice: 95_000_000, image: '/cars/ertiga.jpg', color: 'Merah', transmission: 'Manual' },
  { key: 'toyota-fortuner2', stage: 'inspecting', customer: 'Ibu Sari', phone: '0813-2222-5555', address: 'Jl. Kenanga No. 12, Bekasi', plate: 'B 5566 PQR', brand: 'Toyota', model: 'Fortuner', year: 2020, mileage: 58_000, source: 'Pembelian Toko', expectedPrice: 350_000_000, buyPrice: 305_000_000, sellPrice: 360_000_000, image: '/cars/fortuner.jpg', color: 'Hitam', transmission: 'Otomatis' },
  { key: 'honda-civic', stage: 'inspecting', customer: 'Rina Kartika', phone: '0811-5566-7788', address: 'Jl. Anggrek No. 4, Tangerang', plate: 'B 4455 DEF', brand: 'Honda', model: 'Civic', year: 2020, mileage: 35_000, source: 'Lelang', expectedPrice: 330_000_000, buyPrice: 290_000_000, sellPrice: 340_000_000, image: '/cars/city.jpg', color: 'Hitam', transmission: 'Otomatis' },
  { key: 'toyota-avanza', stage: 'inspecting', customer: 'Tono Saputra', phone: '0821-9900-1122', address: 'Jl. Padi No. 5, Jakarta Barat', plate: 'F 3344 ABC', brand: 'Toyota', model: 'Avanza', year: 2019, mileage: 88_000, source: 'Walk In', expectedPrice: 150_000_000, buyPrice: 128_000_000, sellPrice: 158_000_000, image: '/cars/ertiga.jpg', color: 'Silver', transmission: 'Manual' },
  // ===== DITOLAK (5) — gagal inspeksi, tidak dibeli =====
  { key: 'toyota-avanza2', stage: 'rejected', customer: 'Hendra Gunawan', phone: '0812-6666-7777', address: 'Jl. Melati No. 30, Jakarta Timur', plate: 'B 9900 STU', brand: 'Toyota', model: 'Avanza', year: 2015, mileage: 160_000, source: 'Lelang', expectedPrice: 130_000_000, buyPrice: 0, sellPrice: 0, image: '/cars/ertiga.jpg', color: 'Hitam', transmission: 'Manual' },
  { key: 'nissan-livina', stage: 'rejected', customer: 'Fitri Handayani', phone: '0812-2222-2323', address: 'Jl. Kenanga No. 18, Bekasi', plate: 'F 1222 AYL', brand: 'Nissan', model: 'Livina', year: 2019, mileage: 150_000, source: 'Iklan Online', expectedPrice: 160_000_000, buyPrice: 0, sellPrice: 0, image: '/cars/serena.jpg', color: 'Putih', transmission: 'Otomatis' },
  { key: 'honda-brio', stage: 'rejected', customer: 'Arif Nugroho', phone: '0813-2424-2525', address: 'Jl. Mawar No. 40, Depok', plate: 'B 1890 KLM', brand: 'Honda', model: 'Brio', year: 2016, mileage: 130_000, source: 'Media Sosial', expectedPrice: 120_000_000, buyPrice: 0, sellPrice: 0, image: '/cars/city.jpg', color: 'Merah', transmission: 'Otomatis' },
  { key: 'daihatsu-ayla', stage: 'rejected', customer: 'Sari Melati', phone: '0812-1414-1515', address: 'Jl. Anggrek No. 22, Tangerang', plate: 'B 1888 WLG', brand: 'Daihatsu', model: 'Ayla', year: 2018, mileage: 140_000, source: 'Walk In', expectedPrice: 95_000_000, buyPrice: 0, sellPrice: 0, image: '/cars/agya.jpg', color: 'Putih', transmission: 'Manual' },
  { key: 'mitsubishi-xpander2', stage: 'rejected', customer: 'Joko Susilo', phone: '0813-8181-9191', address: 'Jl. Padi No. 9, Jakarta Barat', plate: 'F 1444 QWE', brand: 'Mitsubishi', model: 'Xpander', year: 2017, mileage: 170_000, source: 'Lelang', expectedPrice: 180_000_000, buyPrice: 0, sellPrice: 0, image: '/cars/xpander.jpg', color: 'Silver', transmission: 'Otomatis' },
  // ===== MEMBELI / DIPROSES (5) — lulus inspeksi, pembelian diproses =====
  { key: 'honda-civic2', stage: 'purchasing', customer: 'Agus Salim', phone: '0812-1111-2222', address: 'Jl. Dahlia No. 15, Cibubur', plate: 'B 2233 XYZ', brand: 'Honda', model: 'Civic', year: 2020, mileage: 30_000, source: 'Pembelian Toko', expectedPrice: 320_000_000, buyPrice: 240_000_000, sellPrice: 345_000_000, image: '/cars/city.jpg', color: 'Hitam', transmission: 'Otomatis' },
  { key: 'suzuki-jimny', stage: 'purchasing', customer: 'Teguh Santosa', phone: '0813-1616-1717', address: 'Jl. Flamboyan No. 7, Bekasi', plate: 'B 4455 DEF', brand: 'Suzuki', model: 'Jimny', year: 2021, mileage: 42_000, source: 'Pembelian Toko', expectedPrice: 400_000_000, buyPrice: 360_000_000, sellPrice: 440_000_000, image: '/cars/fortuner.jpg', color: 'Hitam', transmission: 'Otomatis' },
  { key: 'mitsubishi-pajero', stage: 'purchasing', customer: 'Irwan Setiawan', phone: '0813-3030-4040', address: 'Jl. Anggrek No. 30, Tangerang', plate: 'B 5566 GHI', brand: 'Mitsubishi', model: 'Pajero', year: 2018, mileage: 70_000, source: 'Pembelian Toko', expectedPrice: 340_000_000, buyPrice: 350_000_000, sellPrice: 410_000_000, image: '/cars/xpander.jpg', color: 'Hitam', transmission: 'Otomatis' },
  { key: 'kia-sportage', stage: 'purchasing', customer: 'Wahyu Hidayat', phone: '0813-2020-2121', address: 'Jl. Padi No. 14, Jakarta Barat', plate: 'F 6677 JKL', brand: 'Kia', model: 'Sportage', year: 2018, mileage: 75_000, source: 'Pembelian Toko', expectedPrice: 300_000_000, buyPrice: 230_000_000, sellPrice: 305_000_000, image: '/cars/raize.jpg', color: 'Putih', transmission: 'Otomatis' },
  { key: 'honda-brv', stage: 'purchasing', customer: 'Nadia Putri', phone: '0812-1818-1919', address: 'Jl. Melati No. 44, Jakarta Timur', plate: 'B 7788 MNO', brand: 'Honda', model: 'BR-V', year: 2021, mileage: 50_000, source: 'Pembelian Toko', expectedPrice: 250_000_000, buyPrice: 185_000_000, sellPrice: 262_000_000, image: '/cars/serena.jpg', color: 'Merah', transmission: 'Otomatis' },
  // ===== UNIT TERSEDIA (5) — sudah dibeli, di stok, belum terjual =====
  { key: 'hyundai-stargazer', stage: 'available', customer: 'Rina Oktaviani', phone: '0812-7070-8080', address: 'Jl. Kenanga No. 25, Bekasi', plate: 'F 9900 STU', brand: 'Hyundai', model: 'Stargazer', year: 2023, mileage: 18_000, source: 'Pembelian Toko', expectedPrice: 250_000_000, buyPrice: 175_000_000, sellPrice: 240_000_000, image: '/cars/xpander.jpg', color: 'Biru', transmission: 'Otomatis' },
  { key: 'suzuki-xl7', stage: 'available', customer: 'Bambang Sutrisno', phone: '0812-9090-1010', address: 'Jl. Mawar No. 50, Depok', plate: 'B 1765 XL7', brand: 'Suzuki', model: 'XL7', year: 2021, mileage: 48_000, source: 'Pembelian Toko', expectedPrice: 210_000_000, buyPrice: 178_000_000, sellPrice: 198_000_000, image: '/cars/ertiga.jpg', color: 'Putih', transmission: 'Otomatis' },
  { key: 'toyota-innova', stage: 'available', customer: 'Lina Kartika', phone: '0813-4444-5555', address: 'Jl. Anggrek No. 38, Tangerang', plate: 'B 1677 PST', brand: 'Toyota', model: 'Innova', year: 2018, mileage: 82_000, source: 'Pembelian Toko', expectedPrice: 255_000_000, buyPrice: 215_000_000, sellPrice: 265_000_000, image: '/cars/city.jpg', color: 'Silver', transmission: 'Otomatis' },
  { key: 'daihatsu-terios', stage: 'available', customer: 'Hendra Gunawan', phone: '0812-6666-8888', address: 'Jl. Padi No. 20, Jakarta Barat', plate: 'F 1444 QWE', brand: 'Daihatsu', model: 'Terios', year: 2019, mileage: 60_000, source: 'Pembelian Toko', expectedPrice: 185_000_000, buyPrice: 140_000_000, sellPrice: 175_000_000, image: '/cars/fortuner.jpg', color: 'Putih', transmission: 'Otomatis' },
  { key: 'honda-jazz', stage: 'available', customer: 'Eko Prasetyo', phone: '0812-2323-4545', address: 'Jl. Dahlia No. 22, Cibubur', plate: 'F 1333 JZZ', brand: 'Honda', model: 'Jazz', year: 2017, mileage: 90_000, source: 'Pembelian Toko', expectedPrice: 165_000_000, buyPrice: 138_000_000, sellPrice: 155_000_000, image: '/cars/agya.jpg', color: 'Hitam', transmission: 'Otomatis' },
  // ===== TERJUAL (5) — pipeline lengkap: unit sudah terjual =====
  { key: 'toyota-terjual1', stage: 'sold', customer: 'Rudi Hartono', phone: '0812-1111-3333', address: 'Jl. Melati No. 55, Jakarta Timur', plate: 'B 1505 TAG', brand: 'Toyota', model: 'Calaya', year: 2020, mileage: 35_000, source: 'Pembelian Toko', expectedPrice: 135_000_000, buyPrice: 118_000_000, sellPrice: 128_000_000, image: '/cars/agya.jpg', color: 'Putih', transmission: 'Otomatis' },
  { key: 'honda-terjual2', stage: 'sold', customer: 'Maya Putri', phone: '0813-2222-6666', address: 'Jl. Kenanga No. 33, Bekasi', plate: 'F 1573 AHW', brand: 'Honda', model: 'Mobilio', year: 2016, mileage: 100_000, source: 'Pembelian Toko', expectedPrice: 122_000_000, buyPrice: 108_000_000, sellPrice: 115_000_000, image: '/cars/ertiga.jpg', color: 'Silver', transmission: 'Otomatis' },
  { key: 'mitsubishi-terjual3', stage: 'sold', customer: 'Andi Saputra', phone: '0812-9999-1111', address: 'Jl. Mawar No. 60, Depok', plate: 'B 1469 OKH', brand: 'Mitsubishi', model: 'Triton', year: 2015, mileage: 130_000, source: 'Pembelian Toko', expectedPrice: 220_000_000, buyPrice: 190_000_000, sellPrice: 210_000_000, image: '/cars/xpander.jpg', color: 'Hitam', transmission: 'Otomatis' },
  { key: 'suzuki-terjual4', stage: 'sold', customer: 'Fitri Handayani', phone: '0812-2222-7777', address: 'Jl. Anggrek No. 45, Tangerang', plate: 'B 1888 WLG', brand: 'Suzuki', model: 'Ciaz', year: 2019, mileage: 70_000, source: 'Pembelian Toko', expectedPrice: 145_000_000, buyPrice: 125_000_000, sellPrice: 140_000_000, image: '/cars/serena.jpg', color: 'Putih', transmission: 'Otomatis' },
  { key: 'toyota-terjual5', stage: 'sold', customer: 'Arif Nugroho', phone: '0813-2424-3333', address: 'Jl. Padi No. 25, Jakarta Barat', plate: 'F 1444 RSH', brand: 'Toyota', model: 'Rush', year: 2020, mileage: 55_000, source: 'Pembelian Toko', expectedPrice: 215_000_000, buyPrice: 188_000_000, sellPrice: 205_000_000, image: '/cars/fortuner.jpg', color: 'Hitam', transmission: 'Otomatis' },
]

export const PIPELINE: PipelineCar[] = CARS

// ===== DERIVED VIEWS — modul lain baca dari sini =====

export const byStage = (s: Stage) => PIPELINE.filter((c) => c.stage === s)

export const LEAD_CARS = PIPELINE.filter(
  (c) => c.stage === 'lead' || c.stage === 'rejected' || c.stage === 'inspecting'
)

export const INSPECTION_CARS = PIPELINE.filter(
  (c) => c.stage === 'inspecting' || c.stage === 'rejected' || c.stage === 'purchasing'
)

export const PURCHASE_CARS = PIPELINE.filter((c) => c.stage !== 'lead' && c.stage !== 'rejected')

export const UNIT_CARS = PIPELINE.filter((c) => c.stage === 'available' || c.stage === 'sold')

export const SOLD_CARS = PIPELINE.filter((c) => c.stage === 'sold')

// Helper untuk master unit (hanya unit yang punya harga beli)
export function masterChassis(key: string): string {
  const map: Record<string, string> = {
    'honda-city': 'MHFGD18DEBG000123',
    'toyota-raize': 'NTDA21GK0N000456',
  }
  return map[key] ?? `CH-${key.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 8)}`
}
