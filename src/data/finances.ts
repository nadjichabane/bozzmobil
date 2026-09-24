export type Finance = {
  id: string
  name: string
  type: 'Bank' | 'Leasing'
  contact: string
  phone: string
  email: string
  address: string
  status: 'Aktif' | 'Nonaktif'
  approvedCredit: number
  totalDisbursed: number
  pendingApprovers: number
}

export const FINANCES: Finance[] = [
  {
    id: '1', name: 'BCA Finance', type: 'Leasing',
    contact: 'Surya Darma', phone: '021-5777-8888',
    email: 'surya@bcafinance.co.id', address: 'Gedung BCA, Jl. Jend. Gatot Subroto',
    status: 'Aktif', approvedCredit: 5_000_000_000, totalDisbursed: 3_200_000_000, pendingApprovers: 2,
  },
  {
    id: '2', name: 'ACC Finance', type: 'Leasing',
    contact: 'Bambang Irawan', phone: '021-520-6000',
    email: 'bambang@accfinance.co.id', address: 'Plaza Asia II, Jl. M.H. Thamrin',
    status: 'Aktif', approvedCredit: 3_000_000_000, totalDisbursed: 1_800_000_000, pendingApprovers: 1,
  },
  {
    id: '3', name: 'Mandiri Tunas Finance', type: 'Leasing',
    contact: 'Linda Kusuma', phone: '021-5085-8888',
    email: 'linda@mandaritunggas.co.id', address: 'Menara Mandiri, Jl. Jend. Sudirman',
    status: 'Aktif', approvedCredit: 4_000_000_000, totalDisbursed: 2_100_000_000, pendingApprovers: 3,
  },
  {
    id: '4', name: 'Bank BRI', type: 'Bank',
    contact: 'Agus Santoso', phone: '021-529-2000',
    email: 'agus.santoso@bri.co.id', address: 'Gedung BRI, Jl. Medan Merdeka Timur',
    status: 'Aktif', approvedCredit: 6_000_000_000, totalDisbursed: 4_500_000_000, pendingApprovers: 0,
  },
  {
    id: '5', name: 'Danareksa Finance', type: 'Leasing',
    contact: 'Rini Wulandari', phone: '021-2928-8888',
    email: 'rini@danareksa.co.id', address: 'Jl. H.R. Rasuna Said Kav. 6',
    status: 'Nonaktif', approvedCredit: 1_000_000_000, totalDisbursed: 1_000_000_000, pendingApprovers: 0,
  },
  {
    id: '6', name: 'Bank Mega', type: 'Bank',
    contact: 'Fajar Nugroho', phone: '021-3088-0000',
    email: 'fajar@bankmega.co.id', address: 'Jalan HR Rasuna Said Kav. 2',
    status: 'Aktif', approvedCredit: 2_000_000_000, totalDisbursed: 800_000_000, pendingApprovers: 1,
  },
]
