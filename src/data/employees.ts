export type Employee = {
  id: string
  name: string
  nric: string
  position: string
  department: string
  status: 'Aktif' | 'Cuti' | 'Resign'
  hireDate: string
  phone: string
  email: string
  salary: number
  lastCompany: string
  workYears: number
}

export const EMPLOYEES: Employee[] = [
  {
    id: 'EMP-001', name: 'Rudi Hartono', nric: '3174011122334401',
    position: 'Sales Executive', department: 'Sales', status: 'Aktif',
    hireDate: '12/03/2024', phone: '0812-4433-1101', email: 'rudi.hartono@bozzmobil.co.id',
    salary: 9_500_000, lastCompany: 'Toyota Astra Motor', workYears: 7,
  },
  {
    id: 'EMP-002', name: 'Maya Putri', nric: '3174012233445502',
    position: 'Senior Sales Officer', department: 'Sales', status: 'Aktif',
    hireDate: '02/07/2023', phone: '0813-6677-2202', email: 'maya.putri@bozzmobil.co.id',
    salary: 12_000_000, lastCompany: 'Honda Prospect Motor', workYears: 5,
  },
  {
    id: 'EMP-003', name: 'Andi Saputra', nric: '3174013344556603',
    position: 'Sales Officer', department: 'Sales', status: 'Cuti',
    hireDate: '20/01/2025', phone: '0812-8899-3303', email: 'andi.saputra@bozzmobil.co.id',
    salary: 8_000_000, lastCompany: 'Bekerasi Otomax', workYears: 2,
  },
  {
    id: 'EMP-004', name: 'Siti Rahmawati', nric: '3174014455667704',
    position: 'Finance Supervisor', department: 'Finance', status: 'Aktif',
    hireDate: '15/09/2022', phone: '0813-1122-4404', email: 'siti.rahmawati@bozzmobil.co.id',
    salary: 11_500_000, lastCompany: 'BCA Finance', workYears: 9,
  },
  {
    id: 'EMP-005', name: 'Dewi Lestari', nric: '3174015566778805',
    position: 'Accounting Staff', department: 'Finance', status: 'Aktif',
    hireDate: '08/05/2024', phone: '0812-3344-5505', email: 'dewi.lestari@bozzmobil.co.id',
    salary: 7_500_000, lastCompany: 'Kantor Akuntan Publik Kurnia', workYears: 3,
  },
  {
    id: 'EMP-006', name: 'Budi Setiawan', nric: '3174016677889906',
    position: 'HR Officer', department: 'HRD', status: 'Aktif',
    hireDate: '01/02/2023', phone: '0813-5566-6606', email: 'budi.setiawan@bozzmobil.co.id',
    salary: 10_000_000, lastCompany: 'PT Sinar Prima Group', workYears: 6,
  },
  {
    id: 'EMP-007', name: 'Joko Widodo', nric: '3174017788990007',
    position: 'Service Advisor', department: 'Operasional', status: 'Resign',
    hireDate: '11/08/2021', phone: '0812-7788-7707', email: 'joko.widodo@bozzmobil.co.id',
    salary: 8_500_000, lastCompany: 'Nissan Dealer Cikarang', workYears: 10,
  },
  {
    id: 'EMP-008', name: 'Fitri Handayani', nric: '3174018899001108',
    position: 'Admin Support', department: 'Admin', status: 'Aktif',
    hireDate: '19/06/2025', phone: '0813-9900-8808', email: 'fitri.handayani@bozzmobil.co.id',
    salary: 6_500_000, lastCompany: 'Fresh Graduate', workYears: 1,
  },
]
