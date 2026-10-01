export type MigrationBatch = {
  id: string
  source: 'Analytics Bozzmobil' | 'Spreadsheet Excel'
  dataset: 'Customer' | 'Unit Kendaraan' | 'Transaksi Penjualan' | 'Absensi' | 'Stok Gudang'
  totalRows: number
  mappedRows: number
  failedRows: number
  status: 'Selesai' | 'Berjalan' | 'Antrian' | 'Gagal'
  fieldMapping: string
  lastRun: string
}

export const MIGRATION_BATCHES: MigrationBatch[] = [
  {
    id: 'MIG-001',
    source: 'Analytics Bozzmobil',
    dataset: 'Customer',
    totalRows: 12840,
    mappedRows: 12840,
    failedRows: 0,
    status: 'Selesai',
    fieldMapping: '24/24 field',
    lastRun: '28/09/2026 02:00',
  },
  {
    id: 'MIG-002',
    source: 'Analytics Bozzmobil',
    dataset: 'Transaksi Penjualan',
    totalRows: 8620,
    mappedRows: 8620,
    failedRows: 0,
    status: 'Selesai',
    fieldMapping: '22/22 field',
    lastRun: '28/09/2026 02:15',
  },
  {
    id: 'MIG-003',
    source: 'Spreadsheet Excel',
    dataset: 'Unit Kendaraan',
    totalRows: 3450,
    mappedRows: 3290,
    failedRows: 160,
    status: 'Selesai',
    fieldMapping: '19/24 field',
    lastRun: '29/09/2026 04:30',
  },
  {
    id: 'MIG-004',
    source: 'Spreadsheet Excel',
    dataset: 'Absensi',
    totalRows: 22100,
    mappedRows: 18600,
    failedRows: 0,
    status: 'Berjalan',
    fieldMapping: '14/16 field',
    lastRun: '01/10/2026 09:10',
  },
  {
    id: 'MIG-005',
    source: 'Analytics Bozzmobil',
    dataset: 'Stok Gudang',
    totalRows: 1520,
    mappedRows: 1520,
    failedRows: 0,
    status: 'Selesai',
    fieldMapping: '20/20 field',
    lastRun: '29/09/2026 05:00',
  },
  {
    id: 'MIG-006',
    source: 'Spreadsheet Excel',
    dataset: 'Customer',
    totalRows: 4860,
    mappedRows: 0,
    failedRows: 0,
    status: 'Antrian',
    fieldMapping: '24/24 field',
    lastRun: '-',
  },
  {
    id: 'MIG-007',
    source: 'Analytics Bozzmobil',
    dataset: 'Unit Kendaraan',
    totalRows: 3980,
    mappedRows: 3760,
    failedRows: 220,
    status: 'Gagal',
    fieldMapping: '18/24 field',
    lastRun: '30/09/2026 03:22',
  },
  {
    id: 'MIG-008',
    source: 'Spreadsheet Excel',
    dataset: 'Transaksi Penjualan',
    totalRows: 5140,
    mappedRows: 0,
    failedRows: 0,
    status: 'Antrian',
    fieldMapping: '22/22 field',
    lastRun: '-',
  },
]
