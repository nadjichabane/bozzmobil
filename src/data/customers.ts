export type Customer = {
  id: string
  name: string
  phone: string
  email: string
  address: string
  idCard: string
  totalPurchases: number
  totalSpent: number
  joinedDate: string
  notes: string
}

export const CUSTOMERS: Customer[] = [
  {
    id: '1', name: 'Budi Santoso', phone: '0812-3456-7890',
    email: 'budi.santoso@email.com', address: 'Jl. Merdeka No. 15, Jakarta Selatan',
    idCard: '3174012345678901', totalPurchases: 1, totalSpent: 105_000_000,
    joinedDate: '20/08/2026', notes: 'Pelanggan setia, preferensi Honda',
  },
  {
    id: '2', name: 'Andi Wijaya', phone: '0813-2222-4444',
    email: 'andi.wijaya@email.com', address: 'Jl. Kemang Raya No. 8, Jakarta Selatan',
    idCard: '3175012345678902', totalPurchases: 1, totalSpent: 187_000_000,
    joinedDate: '25/08/2026', notes: '',
  },
  {
    id: '3', name: 'Dina Marlina', phone: '0812-8888-9999',
    email: 'dina.marlina@email.com', address: 'Jl. Fatmawati No. 22, Jakarta Selatan',
    idCard: '3176012345678903', totalPurchases: 1, totalSpent: 225_000_000,
    joinedDate: '10/08/2026', notes: 'Referral dari Budi Santoso',
  },
  {
    id: '4', name: 'Rizky Pratama', phone: '0812-1212-3434',
    email: 'rizky.pratama@email.com', address: 'Jl. Ciputat Raya No. 5, Tangerang',
    idCard: '3177012345678904', totalPurchases: 1, totalSpent: 230_000_000,
    joinedDate: '05/08/2026', notes: 'Cash buyer, proses cepat',
  },
  {
    id: '5', name: 'Siti Aisyah', phone: '0813-7777-6666',
    email: 'siti.aisyah@email.com', address: 'Jl. Kelapa Gading Barat No. 10, Jakarta Utara',
    idCard: '3178012345678905', totalPurchases: 2, totalSpent: 182_000_000,
    joinedDate: '01/07/2026', notes: 'Customer repeat, beli 2 unit untuk keluarga',
  },
  {
    id: '6', name: 'Faisal Rahman', phone: '0812-5555-1212',
    email: 'faisal.rahman@email.com', address: 'Jl. Pondok Indah No. 33, Jakarta Selatan',
    idCard: '3179012345678906', totalPurchases: 1, totalSpent: 217_000_000,
    joinedDate: '12/08/2026', notes: '',
  },
  {
    id: '7', name: 'Yudi Handoko', phone: '0813-3333-8888',
    email: 'yudi.handoko@email.com', address: 'Jl. Kuningan No. 7, Jakarta Selatan',
    idCard: '3180012345678907', totalPurchases: 1, totalSpent: 120_000_000,
    joinedDate: '18/08/2026', notes: 'Trade-in unit lama',
  },
  {
    id: '8', name: 'Novi Febriana', phone: '0812-9999-0000',
    email: 'novi.febriana@email.com', address: 'Jl. Senopati No. 44, Jakarta Selatan',
    idCard: '3181012345678908', totalPurchases: 1, totalSpent: 102_000_000,
    joinedDate: '22/08/2026', notes: 'First-time buyer',
  },
]
