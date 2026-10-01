export type AppUser = {
  id: string
  name: string
  email: string
  role: 'Admin' | 'Manager' | 'Sales' | 'Finance' | 'HR'
  status: 'Aktif' | 'Nonaktif'
  lastLogin: string
  accessModules: number
}

export const APP_USERS: AppUser[] = [
  {
    id: 'U-001',
    name: 'Rudi Hartono',
    email: 'rudi.hartono@bozzmobil.co.id',
    role: 'Admin',
    status: 'Aktif',
    lastLogin: '01/10/2026 08:12',
    accessModules: 15,
  },
  {
    id: 'U-002',
    name: 'Maya Putri',
    email: 'maya.putri@bozzmobil.co.id',
    role: 'Manager',
    status: 'Aktif',
    lastLogin: '01/10/2026 07:45',
    accessModules: 12,
  },
  {
    id: 'U-003',
    name: 'Andi Saputra',
    email: 'andi.saputra@bozzmobil.co.id',
    role: 'Sales',
    status: 'Aktif',
    lastLogin: '30/09/2026 16:20',
    accessModules: 8,
  },
  {
    id: 'U-004',
    name: 'Sari Melati',
    email: 'sari.melati@bozzmobil.co.id',
    role: 'Finance',
    status: 'Aktif',
    lastLogin: '01/10/2026 08:02',
    accessModules: 7,
  },
  {
    id: 'U-005',
    name: 'Dewi Lestari',
    email: 'dewi.lestari@bozzmobil.co.id',
    role: 'HR',
    status: 'Aktif',
    lastLogin: '29/09/2026 14:11',
    accessModules: 6,
  },
  {
    id: 'U-006',
    name: 'Bambang Sutrisno',
    email: 'bambang.sutrisno@bozzmobil.co.id',
    role: 'Sales',
    status: 'Aktif',
    lastLogin: '01/10/2026 09:05',
    accessModules: 8,
  },
  {
    id: 'U-007',
    name: 'Agus Salim',
    email: 'agus.salim@bozzmobil.co.id',
    role: 'Manager',
    status: 'Nonaktif',
    lastLogin: '12/09/2026 10:33',
    accessModules: 0,
  },
  {
    id: 'U-008',
    name: 'Putri Ananda',
    email: 'putri.ananda@bozzmobil.co.id',
    role: 'Finance',
    status: 'Nonaktif',
    lastLogin: '05/09/2026 15:48',
    accessModules: 0,
  },
]
