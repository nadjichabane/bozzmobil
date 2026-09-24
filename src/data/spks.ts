export type SPK = {
  id: string
  spkNumber: string
  date: string
  customerName: string
  customerPhone: string
  customerAddress: string
  unit: string
  price: number
  downPayment: number
  installment: number
  tenor: number
  finance: string
  status: 'Draft' | 'Aktif' | 'Selesai' | 'Batal'
}

export const SPKS: SPK[] = [
  {
    id: '1', spkNumber: 'SPK-2026-0201', date: '01/09/2026',
    customerName: 'Budi Santoso', customerPhone: '0812-3456-7890',
    customerAddress: 'Jl. Merdeka No. 15, Jakarta Selatan',
    unit: 'Honda City E MT 2012', price: 105_000_000, downPayment: 30_000_000,
    installment: 2_850_000, tenor: 12, finance: 'BCA Finance', status: 'Selesai',
  },
  {
    id: '2', spkNumber: 'SPK-2026-0202', date: '05/09/2026',
    customerName: 'Andi Wijaya', customerPhone: '0813-2222-4444',
    customerAddress: 'Jl. Kemang Raya No. 8, Jakarta Selatan',
    unit: 'Toyota Raize GR 2022', price: 187_000_000, downPayment: 55_000_000,
    installment: 4_200_000, tenor: 24, finance: '-', status: 'Selesai',
  },
  {
    id: '3', spkNumber: 'SPK-2026-0203', date: '10/09/2026',
    customerName: 'Siti Aisyah', customerPhone: '0813-7777-6666',
    customerAddress: 'Jl. Kelapa Gading Barat No. 10, Jakarta Utara',
    unit: 'Suzuki Ertiga GX 2014', price: 90_000_000, downPayment: 20_000_000,
    installment: 2_100_000, tenor: 12, finance: 'ACC Finance', status: 'Aktif',
  },
  {
    id: '4', spkNumber: 'SPK-2026-0204', date: '15/09/2026',
    customerName: 'Dewi Lestari', customerPhone: '0813-5656-7878',
    customerAddress: 'Jl. Senopati No. 44, Jakarta Selatan',
    unit: 'Toyota Yaris G 2018', price: 168_000_000, downPayment: 50_000_000,
    installment: 3_800_000, tenor: 24, finance: 'Mandiri Tunas', status: 'Aktif',
  },
  {
    id: '5', spkNumber: 'SPK-2026-0205', date: '20/09/2026',
    customerName: 'Agus Salim', customerPhone: '0812-1111-2222',
    customerAddress: 'Jl. Cempaka Putih No. 5, Jakarta Pusat',
    unit: 'Honda Brio Satya 2021', price: 148_000_000, downPayment: 40_000_000,
    installment: 3_500_000, tenor: 12, finance: 'BCA Finance', status: 'Draft',
  },
  {
    id: '6', spkNumber: 'SPK-2026-0206', date: '22/09/2026',
    customerName: 'Ratna Sari', customerPhone: '0812-3030-3131',
    customerAddress: 'Jl. Tebet Timur No. 22, Jakarta Selatan',
    unit: 'Toyota Avanza Veloz 2019', price: 158_000_000, downPayment: 45_000_000,
    installment: 3_600_000, tenor: 24, finance: 'ACC Finance', status: 'Batal',
  },
]
