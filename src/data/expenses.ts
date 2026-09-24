export type Expense = {
  id: string
  date: string
  category: string
  description: string
  amount: number
  paymentMethod: 'Transfer' | 'Tunai' | 'Kartu'
  reference: string
  approvedBy: string
}

export const EXPENSES: Expense[] = [
  { id: '1', date: '25/09/2026', category: 'Operasional', description: 'Listrik bulan September', amount: 3_500_000, paymentMethod: 'Transfer', reference: 'PLN-INV-0926', approvedBy: 'Dede Prasetyo' },
  { id: '2', date: '24/09/2026', category: 'Marketing', description: 'Iklan Facebook Ads - Campaign Ramadhan', amount: 5_000_000, paymentMethod: 'Transfer', reference: 'FB-ADS-0926', approvedBy: 'Dede Prasetyo' },
  { id: '3', date: '22/09/2026', category: 'Operasional', description: 'Internet & telekomunikasi', amount: 1_200_000, paymentMethod: 'Transfer', reference: 'INDO-TEL-0926', approvedBy: 'Dede Prasetyo' },
  { id: '4', date: '20/09/2026', category: 'Service Unit', description: 'Detailing & pembersihan 5 unit', amount: 2_500_000, paymentMethod: 'Tunai', reference: 'DL-2026-0920', approvedBy: 'Dede Prasetyo' },
  { id: '5', date: '18/09/2026', category: 'Legal', description: 'Biaya perpanjangan STNK 3 unit', amount: 450_000, paymentMethod: 'Tunai', reference: 'STNK-2026-0918', approvedBy: 'Dede Prasetyo' },
  { id: '6', date: '15/09/2026', category: 'Operasional', description: 'Gaji staf receptionist', amount: 3_000_000, paymentMethod: 'Transfer', reference: 'GAJI-SEP-2026', approvedBy: 'Dede Prasetyo' },
  { id: '7', date: '12/09/2026', category: 'Maintenance', description: 'Perbaikan AC showroom', amount: 850_000, paymentMethod: 'Tunai', reference: 'AC-FIX-0926', approvedBy: 'Dede Prasetyo' },
  { id: '8', date: '10/09/2026', category: 'Marketing', description: 'Cetak brosur & banner', amount: 1_800_000, paymentMethod: 'Transfer', reference: 'PRINT-0926', approvedBy: 'Dede Prasetyo' },
  { id: '9', date: '05/09/2026', category: 'Operasional', description: 'Sewa tempat bulan September', amount: 15_000_000, paymentMethod: 'Transfer', reference: 'SEWA-SEP-2026', approvedBy: 'Dede Prasetyo' },
  { id: '10', date: '01/09/2026', category: 'Service Unit', description: 'Penggantian oli & servis 8 unit', amount: 4_000_000, paymentMethod: 'Transfer', reference: 'SERVICE-0926', approvedBy: 'Dede Prasetyo' },
]

export const EXPENSE_CATEGORIES = ['Semua Kategori', 'Operasional', 'Marketing', 'Service Unit', 'Legal', 'Maintenance']
