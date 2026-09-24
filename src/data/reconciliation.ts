export type RecItem = {
  id: string
  date: string
  finance: string
  transactionRef: string
  amount: number
  bankDebit: number
  bankCredit: number
  status: 'Cocok' | 'Selisih' | 'Belum Cocok'
  discrepancy?: number
}

export const RECONCILIATIONS: RecItem[] = [
  { id: '1', date: '31/08/2026', finance: 'BCA Finance', transactionRef: 'DIS-BCA-0826-001', amount: 85_000_000, bankDebit: 85_000_000, bankCredit: 0, status: 'Cocok' },
  { id: '2', date: '30/08/2026', finance: 'BCA Finance', transactionRef: 'DIS-BCA-0826-002', amount: 120_000_000, bankDebit: 120_000_000, bankCredit: 0, status: 'Cocok' },
  { id: '3', date: '29/08/2026', finance: 'ACC Finance', transactionRef: 'DIS-ACC-0826-003', amount: 65_000_000, bankDebit: 62_500_000, bankCredit: 0, status: 'Selisih', discrepancy: 2_500_000 },
  { id: '4', date: '28/08/2026', finance: 'Mandiri Tunas', transactionRef: 'DIS-MANDIRI-0826-004', amount: 95_000_000, bankDebit: 0, bankCredit: 95_000_000, status: 'Cocok' },
  { id: '5', date: '27/08/2026', finance: 'BCA Finance', transactionRef: 'DIS-BCA-0826-005', amount: 110_000_000, bankDebit: 110_000_000, bankCredit: 0, status: 'Cocok' },
  { id: '6', date: '25/08/2026', finance: 'ACC Finance', transactionRef: 'DIS-ACC-0826-006', amount: 78_000_000, bankDebit: 0, bankCredit: 0, status: 'Belum Cocok' },
  { id: '7', date: '24/08/2026', finance: 'Mandiri Tunas', transactionRef: 'DIS-MANDIRI-0826-007', amount: 145_000_000, bankDebit: 145_000_000, bankCredit: 0, status: 'Cocok' },
  { id: '8', date: '22/08/2026', finance: 'BCA Finance', transactionRef: 'DIS-BCA-0826-008', amount: 55_000_000, bankDebit: 55_000_000, bankCredit: 0, status: 'Cocok' },
  { id: '9', date: '20/08/2026', finance: 'Bank BRI', transactionRef: 'DIS-BRI-0826-009', amount: 200_000_000, bankDebit: 198_000_000, bankCredit: 0, status: 'Selisih', discrepancy: 2_000_000 },
  { id: '10', date: '18/08/2026', finance: 'ACC Finance', transactionRef: 'DIS-ACC-0826-010', amount: 92_000_000, bankDebit: 0, bankCredit: 0, status: 'Belum Cocok' },
]
