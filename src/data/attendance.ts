export type Attendance = {
  id: string
  employee: string
  date: string
  inTime: string
  outTime: string
  status: 'Hadir' | 'Terlambat' | 'Sakit' | 'Cuti' | 'Alpa'
  note: string
}

export const ATTENDANCE: Attendance[] = [
  { id: 'ATD-001', employee: 'Rudi Hartono', date: '01/09/2026', inTime: '08:02', outTime: '17:15', status: 'Hadir', note: '-' },
  { id: 'ATD-002', employee: 'Maya Putri', date: '01/09/2026', inTime: '08:00', outTime: '17:30', status: 'Hadir', note: '-' },
  { id: 'ATD-003', employee: 'Andi Saputra', date: '02/09/2026', inTime: '09:14', outTime: '17:00', status: 'Terlambat', note: 'Macet saat masuk' },
  { id: 'ATD-004', employee: 'Siti Rahmawati', date: '03/09/2026', inTime: '08:05', outTime: '17:00', status: 'Hadir', note: '-' },
  { id: 'ATD-005', employee: 'Dewi Lestari', date: '04/09/2026', inTime: '-', outTime: '-', status: 'Sakit', note: 'Izin dokter 2 hari' },
  { id: 'ATD-006', employee: 'Budi Setiawan', date: '05/09/2026', inTime: '08:00', outTime: '17:00', status: 'Hadir', note: '-' },
  { id: 'ATD-007', employee: 'Andi Saputra', date: '07/09/2026', inTime: '10:02', outTime: '17:45', status: 'Terlambat', note: 'Keterlambatan berkala' },
  { id: 'ATD-008', employee: 'Maya Putri', date: '15/09/2026', inTime: '-', outTime: '-', status: 'Cuti', note: 'Cuti tahunan 5 hari' },
  { id: 'ATD-009', employee: 'Fitri Handayani', date: '18/09/2026', inTime: '08:00', outTime: '17:00', status: 'Hadir', note: '-' },
  { id: 'ATD-010', employee: 'Joko Widodo', date: '22/09/2026', inTime: '-', outTime: '-', status: 'Alpa', note: 'Tanpa keterangan' },
  { id: 'ATD-011', employee: 'Rudi Hartono', date: '01/10/2026', inTime: '08:12', outTime: '17:00', status: 'Terlambat', note: 'Hujan deras' },
  { id: 'ATD-012', employee: 'Siti Rahmawati', date: '02/10/2026', inTime: '08:00', outTime: '17:10', status: 'Hadir', note: '-' },
]
