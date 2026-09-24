export type DocItem = {
  id: string
  unit: string
  plate: string
  documentType: 'STNK' | 'BPKB' | 'KTP' | 'KK' | 'FP' | 'Bon'
  status: 'Lengkap' | 'Belum Lengkap' | 'Dalam Proses'
  expiryDate?: string
  lastUpdated: string
  remarks: string
}

export const DOC_ITEMS: DocItem[] = [
  { id: '1', unit: 'Honda City E MT 2012', plate: 'B 1505 TAG', documentType: 'STNK', status: 'Lengkap', expiryDate: '15/03/2027', lastUpdated: '31/08/2026', remarks: '' },
  { id: '2', unit: 'Honda City E MT 2012', plate: 'B 1505 TAG', documentType: 'BPKB', status: 'Lengkap', lastUpdated: '31/08/2026', remarks: 'BPKB asli dari supplier' },
  { id: '3', unit: 'Toyota Raize GR 2022', plate: 'F 1573 AHW', documentType: 'STNK', status: 'Lengkap', expiryDate: '10/06/2027', lastUpdated: '30/08/2026', remarks: '' },
  { id: '4', unit: 'Toyota Raize GR 2022', plate: 'F 1573 AHW', documentType: 'BPKB', status: 'Lengkap', lastUpdated: '30/08/2026', remarks: '' },
  { id: '5', unit: 'Mitsubishi Xpander 2021', plate: 'B 1469 OKH', documentType: 'STNK', status: 'Dalam Proses', expiryDate: '20/12/2026', lastUpdated: '15/09/2026', remarks: 'Proses perpanjangan STNK' },
  { id: '6', unit: 'Mitsubishi Xpander 2021', plate: 'B 1469 OKH', documentType: 'BPKB', status: 'Belum Lengkap', lastUpdated: '10/09/2026', remarks: 'Menunggu BPKB dari BCA Finance' },
  { id: '7', unit: 'Toyota Fortuner VRZ 2020', plate: 'B 1355 NJK', documentType: 'STNK', status: 'Lengkap', expiryDate: '05/08/2027', lastUpdated: '27/08/2026', remarks: '' },
  { id: '8', unit: 'Toyota Fortuner VRZ 2020', plate: 'B 1355 NJK', documentType: 'BPKB', status: 'Lengkap', lastUpdated: '27/08/2026', remarks: '' },
  { id: '9', unit: 'Suzuki Ertiga GX 2014', plate: 'F 1522 FNC', documentType: 'STNK', status: 'Dalam Proses', expiryDate: '01/01/2027', lastUpdated: '26/08/2026', remarks: 'STNK habis masa berlaku' },
  { id: '10', unit: 'Suzuki Ertiga GX 2014', plate: 'F 1522 FNC', documentType: 'BPKB', status: 'Belum Lengkap', lastUpdated: '26/08/2026', remarks: 'BPKB di tahan finance ACC' },
  { id: '11', unit: 'Honda CR-V 2.4 2015', plate: 'B 1010 KJJ', documentType: 'STNK', status: 'Lengkap', expiryDate: '22/04/2027', lastUpdated: '25/08/2026', remarks: '' },
  { id: '12', unit: 'Honda CR-V 2.4 2015', plate: 'B 1010 KJJ', documentType: 'BPKB', status: 'Dalam Proses', lastUpdated: '20/09/2026', remarks: 'Proses pengurusan BPKB baru' },
  { id: '13', unit: 'Nissan Serena HWS 2012', plate: 'B 2144 UKL', documentType: 'STNK', status: 'Belum Lengkap', expiryDate: '10/02/2027', lastUpdated: '23/08/2026', remarks: 'STNK belum diambil dari supplier' },
  { id: '14', unit: 'Toyota Agya 1.2 TRD 2019', plate: 'F 1309 OHM', documentType: 'STNK', status: 'Lengkap', expiryDate: '18/11/2026', lastUpdated: '22/08/2026', remarks: '' },
  { id: '15', unit: 'Toyota Agya 1.2 TRD 2019', plate: 'F 1309 OHM', documentType: 'BPKB', status: 'Lengkap', lastUpdated: '22/08/2026', remarks: '' },
]
