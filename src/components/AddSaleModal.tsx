import { X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { type PaymentType, type Sale, type SaleStatus } from '../data/sales'

type AddSaleModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (sale: Sale) => void
}

const UNITS = [
  'Honda City E MT 2012',
  'Toyota Raize GR 2022',
  'Mitsubishi Xpander 2021',
  'Toyota Fortuner VRZ 2020',
  'Honda CR-V 2.4 2015',
]

export function AddSaleModal({ open, onClose, onSubmit }: AddSaleModalProps) {
  const [unit, setUnit] = useState(UNITS[0])
  const [plate, setPlate] = useState('')
  const [customer, setCustomer] = useState('')
  const [phone, setPhone] = useState('')
  const [payment, setPayment] = useState<PaymentType>('Cash')
  const [finance, setFinance] = useState('-')
  const [price, setPrice] = useState('100000000')
  const [profit, setProfit] = useState('10000000')
  const [status, setStatus] = useState<SaleStatus>('Lunas')

  if (!open) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const now = new Date()
    const invoice = `INV-2026-${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${now.getHours()}${now.getMinutes()}`
    onSubmit({
      id: crypto.randomUUID(),
      invoice,
      date: now.toLocaleDateString('id-ID'),
      unit,
      plate: plate || 'B 0000 XXX',
      customer: customer || 'Customer Baru',
      phone: phone || '0812-0000-0000',
      payment,
      finance: payment === 'Cash' ? '-' : finance,
      price: Number(price) || 0,
      profit: Number(profit) || 0,
      status,
      completeness: status === 'Lunas' ? 100 : 70,
      image: '/cars/serena.jpg',
      salesPerson: 'Rudi Hartono',
    })
    onClose()
    setPlate('')
    setCustomer('')
    setPhone('')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] rounded-[12px] border border-line bg-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900">Tambah Penjualan</h2>
            <p className="text-[12px] text-slate-400">Catat transaksi penjualan unit baru</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-slate-400 hover:bg-slate-50"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-2">
          <label className="block text-[12px] font-medium text-slate-600">
            Unit
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="mt-1 h-[38px] w-full rounded-[8px] border border-line px-3 text-[13px] text-slate-800"
            >
              {UNITS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </label>
          <label className="block text-[12px] font-medium text-slate-600">
            Nopol
            <input
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              placeholder="B 1234 ABC"
              className="mt-1 h-[38px] w-full rounded-[8px] border border-line px-3 text-[13px]"
            />
          </label>
          <label className="block text-[12px] font-medium text-slate-600">
            Customer
            <input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Nama customer"
              className="mt-1 h-[38px] w-full rounded-[8px] border border-line px-3 text-[13px]"
            />
          </label>
          <label className="block text-[12px] font-medium text-slate-600">
            Telepon
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0812-xxxx-xxxx"
              className="mt-1 h-[38px] w-full rounded-[8px] border border-line px-3 text-[13px]"
            />
          </label>
          <label className="block text-[12px] font-medium text-slate-600">
            Jenis Bayar
            <select
              value={payment}
              onChange={(e) => setPayment(e.target.value as PaymentType)}
              className="mt-1 h-[38px] w-full rounded-[8px] border border-line px-3 text-[13px]"
            >
              <option value="Cash">Cash</option>
              <option value="Credit">Credit</option>
            </select>
          </label>
          <label className="block text-[12px] font-medium text-slate-600">
            Finance
            <select
              value={finance}
              onChange={(e) => setFinance(e.target.value)}
              disabled={payment === 'Cash'}
              className="mt-1 h-[38px] w-full rounded-[8px] border border-line px-3 text-[13px] disabled:bg-slate-50"
            >
              <option value="-">-</option>
              <option>BCA Finance</option>
              <option>ACC Finance</option>
              <option>Mandiri Tunas</option>
            </select>
          </label>
          <label className="block text-[12px] font-medium text-slate-600">
            Harga Jual
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-1 h-[38px] w-full rounded-[8px] border border-line px-3 text-[13px]"
            />
          </label>
          <label className="block text-[12px] font-medium text-slate-600">
            Laba Kotor
            <input
              type="number"
              value={profit}
              onChange={(e) => setProfit(e.target.value)}
              className="mt-1 h-[38px] w-full rounded-[8px] border border-line px-3 text-[13px]"
            />
          </label>
          <label className="block text-[12px] font-medium text-slate-600 sm:col-span-2">
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SaleStatus)}
              className="mt-1 h-[38px] w-full rounded-[8px] border border-line px-3 text-[13px]"
            >
              <option>Lunas</option>
              <option>Proses STNK</option>
              <option>Proses BPKB</option>
            </select>
          </label>
          <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="h-[38px] rounded-[8px] border border-line px-4 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="h-[38px] rounded-[8px] bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary-hover"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
