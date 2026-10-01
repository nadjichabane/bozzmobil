export type WarehouseItem = {
  id: string
  code: string
  name: string
  category: 'Sparepart' | 'Aksesoris' | 'Kelengkapan Unit' | 'Konsumables'
  stock: number
  minStock: number
  unit: string
  location: string
  supplier: string
}

export type StockMove = {
  id: string
  item: string
  type: 'Masuk' | 'Keluar'
  qty: number
  date: string
  by: string
  ref: string
}

export const WAREHOUSE_ITEMS: WarehouseItem[] = [
  { id: '1', code: 'SP-001', name: 'Minyak Mesin 4T 0W-20', category: 'Sparepart', stock: 48, minStock: 24, unit: 'liter', location: 'Rak A1', supplier: 'Total Lubricant' },
  { id: '2', code: 'SP-002', name: 'Filter Oli Honda', category: 'Sparepart', stock: 30, minStock: 15, unit: 'pcs', location: 'Rak A2', supplier: 'Genting' },
  { id: '3', code: 'SP-003', name: 'Filter Udara Toyota', category: 'Sparepart', stock: 12, minStock: 10, unit: 'pcs', location: 'Rak A3', supplier: 'Denso' },
  { id: '4', code: 'SP-004', name: 'Kampas Rem Depan', category: 'Sparepart', stock: 8, minStock: 12, unit: 'set', location: 'Rak B1', supplier: 'Bosch' },
  { id: '5', code: 'SP-005', name: 'Ban 185/65 R15', category: 'Kelengkapan Unit', stock: 16, minStock: 8, unit: 'pcs', location: 'Rak B2', supplier: 'Giti Tire' },
  { id: '6', code: 'AX-001', name: 'Sapu Kaca / Wiper 600mm', category: 'Aksesoris', stock: 22, minStock: 10, unit: 'pcs', location: 'Rak C1', supplier: 'Bosch' },
  { id: '7', code: 'AX-002', name: 'Karpet Roda Mobil', category: 'Aksesoris', stock: 40, minStock: 20, unit: 'paket', location: 'Rak C2', supplier: 'JVC' },
  { id: '8', code: 'AX-003', name: 'Kaca Film 3M', category: 'Aksesoris', stock: 6, minStock: 8, unit: 'roll', location: 'Rak C3', supplier: '3M' },
  { id: '9', code: 'KM-001', name: 'Sabun Cuci Mobil 5kg', category: 'Konsumables', stock: 14, minStock: 10, unit: 'tenggul', location: 'Lantai 2', supplier: 'Sonax' },
  { id: '10', code: 'KM-002', name: 'Air Filter Kabin', category: 'Sparepart', stock: 18, minStock: 6, unit: 'pcs', location: 'Rak A4', supplier: 'Panda' },
]

export const STOCK_MOVES: StockMove[] = [
  { id: '1', item: 'Minyak Mesin 4T 0W-20', type: 'Masuk', qty: 40, date: '22/09/2026', by: 'Rudi Hartono', ref: 'PO-0412' },
  { id: '2', item: 'Filter Oli Honda', type: 'Keluar', qty: 12, date: '21/09/2026', by: 'Maya Putri', ref: 'JOB-1188' },
  { id: '3', item: 'Kampas Rem Depan', type: 'Keluar', qty: 6, date: '20/09/2026', by: 'Andi Saputra', ref: 'JOB-1184' },
  { id: '4', item: 'Ban 185/65 R15', type: 'Masuk', qty: 8, date: '19/09/2026', by: 'Rudi Hartono', ref: 'PO-0409' },
  { id: '5', item: 'Sapu Kaca / Wiper 600mm', type: 'Keluar', qty: 4, date: '18/09/2026', by: 'Maya Putri', ref: 'JOB-1179' },
  { id: '6', item: 'Karpet Roda Mobil', type: 'Masuk', qty: 20, date: '17/09/2026', by: 'Andi Saputra', ref: 'PO-0405' },
  { id: '7', item: 'Filter Udara Toyota', type: 'Keluar', qty: 3, date: '15/09/2026', by: 'Rudi Hartono', ref: 'JOB-1172' },
  { id: '8', item: 'Kaca Film 3M', type: 'Keluar', qty: 2, date: '14/09/2026', by: 'Maya Putri', ref: 'JOB-1168' },
  { id: '9', item: 'Sabun Cuci Mobil 5kg', type: 'Masuk', qty: 10, date: '12/09/2026', by: 'Andi Saputra', ref: 'PO-0398' },
  { id: '10', item: 'Air Filter Kabin', type: 'Keluar', qty: 5, date: '10/09/2026', by: 'Rudi Hartono', ref: 'JOB-1161' },
  { id: '11', item: 'Minyak Mesin 4T 0W-20', type: 'Keluar', qty: 16, date: '08/09/2026', by: 'Maya Putri', ref: 'JOB-1155' },
  { id: '12', item: 'Filter Oli Honda', type: 'Masuk', qty: 24, date: '05/09/2026', by: 'Andi Saputra', ref: 'PO-0390' },
]
