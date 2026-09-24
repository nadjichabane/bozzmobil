export type TradeIn = {
  id: string
  invoice: string
  date: string
  customerName: string
  customerPhone: string
  newUnit: string
  newPrice: number
  tradeUnit: string
  tradeYear: number
  tradePlate: string
  tradeCondition: 'Berkondisi Baik' | 'Butuh Perbaikan Ringan' | 'Butuh Perbaikan Besar'
  tradeValuation: number
  diffAmount: number
  status: 'Selesai' | 'Penilaian' | 'Pending Approval'
}

export const TRADE_INS: TradeIn[] = [
  {
    id: '1', invoice: 'TI-2026-0101', date: '28/08/2026',
    customerName: 'Yudi Handoko', customerPhone: '0813-3333-8888',
    newUnit: 'Nissan Serena HWS 2012', newPrice: 120_000_000,
    tradeUnit: 'Honda Jazz 1.5 EX', tradeYear: 2014, tradePlate: 'B 1234 JAZ',
    tradeCondition: 'Berkondisi Baik', tradeValuation: 85_000_000,
    diffAmount: 35_000_000, status: 'Selesai',
  },
  {
    id: '2', invoice: 'TI-2026-0102', date: '15/09/2026',
    customerName: 'Agus Salim', customerPhone: '0812-1111-2222',
    newUnit: 'Honda Brio Satya RS 2022', newPrice: 165_000_000,
    tradeUnit: 'Toyota Agya 1.0 G', tradeYear: 2016, tradePlate: 'F 5678 AGY',
    tradeCondition: 'Butuh Perbaikan Ringan', tradeValuation: 60_000_000,
    diffAmount: 105_000_000, status: 'Penilaian',
  },
  {
    id: '3', invoice: 'TI-2026-0103', date: '20/09/2026',
    customerName: 'Lina Kartika', customerPhone: '0813-4444-5555',
    newUnit: 'Mitsubishi Xpander Ultimate', newPrice: 245_000_000,
    tradeUnit: 'Suzuki Ertiga GX 2015', tradeYear: 2015, tradePlate: 'B 9012 ERT',
    tradeCondition: 'Berkondisi Baik', tradeValuation: 88_000_000,
    diffAmount: 157_000_000, status: 'Pending Approval',
  },
  {
    id: '4', invoice: 'TI-2026-0104', date: '22/09/2026',
    customerName: 'Eko Prasetyo', customerPhone: '0812-2323-4545',
    newUnit: 'Toyota Innova Reborn 2.0 G', newPrice: 280_000_000,
    tradeUnit: 'Honda CR-V 2.4 VTi', tradeYear: 2013, tradePlate: 'F 3456 CRV',
    tradeCondition: 'Butuh Perbaikan Besar', tradeValuation: 110_000_000,
    diffAmount: 170_000_000, status: 'Penilaian',
  },
]
