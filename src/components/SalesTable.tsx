import { MoreVertical } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { formatRupiah, type Sale } from '../data/sales'
import { Pagination } from './Pagination'
import { PaymentBadge } from './PaymentBadge'
import { ProgressBar } from './ProgressBar'
import { StatusBadge } from './StatusBadge'

type SalesTableProps = {
  rows: Sale[]
  page: number
  pageCount: number
  from: number
  to: number
  total: number
  onPageChange: (page: number) => void
}

function RowActions({ sale }: { sale: Sale }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div ref={ref} className="relative flex justify-end">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-[8px] text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        aria-label={`Aksi ${sale.invoice}`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-30 w-40 overflow-hidden rounded-[8px] border border-line bg-white py-1 shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
          <button type="button" className="block w-full px-3 py-2 text-left text-[12.5px] text-slate-700 hover:bg-slate-50">
            Lihat detail
          </button>
          <button type="button" className="block w-full px-3 py-2 text-left text-[12.5px] text-slate-700 hover:bg-slate-50">
            Edit
          </button>
          <button type="button" className="block w-full px-3 py-2 text-left text-[12.5px] text-slate-700 hover:bg-slate-50">
            Cetak invoice
          </button>
          <button type="button" className="block w-full px-3 py-2 text-left text-[12.5px] text-red-600 hover:bg-red-50">
            Hapus
          </button>
        </div>
      )}
    </div>
  )
}

export function SalesTable({
  rows,
  page,
  pageCount,
  from,
  to,
  total,
  onPageChange,
}: SalesTableProps) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line">
              {[
                'No. Invoice',
                'Tanggal',
                'Unit',
                'Customer',
                'Jenis Bayar',
                'Finance',
                'Harga Jual',
                'Laba Kotor',
                'Status',
                'Kelengkapan',
                'Aksi',
              ].map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold text-slate-500 first:pl-5 last:pr-5 last:text-right"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((sale) => (
              <tr
                key={sale.id}
                className="h-[75px] border-b border-line last:border-0 hover:bg-[#F8FAFC]"
              >
                <td className="px-4 first:pl-5">
                  <button type="button" className="text-[13px] font-medium text-primary hover:underline">
                    {sale.invoice}
                  </button>
                </td>
                <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">
                  {sale.date}
                </td>
                <td className="px-4">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={sale.image}
                      alt=""
                      className="h-11 w-[58px] shrink-0 rounded-[8px] bg-slate-100 object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          'data:image/svg+xml;charset=utf-8,' +
                          encodeURIComponent(
                            `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="44"><rect width="56" height="44" rx="6" fill="#E5E7EB"/><text x="28" y="26" text-anchor="middle" font-size="9" fill="#94A3B8" font-family="Inter,sans-serif">UNIT</text></svg>`,
                          )
                      }}
                    />
                    <div>
                      <p className="whitespace-nowrap text-[13px] font-semibold text-slate-900">
                        {sale.unit}
                      </p>
                      <p className="text-[11.5px] text-slate-400">{sale.plate}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4">
                  <p className="whitespace-nowrap text-[13px] font-semibold text-slate-900">
                    {sale.customer}
                  </p>
                  <p className="text-[11.5px] text-slate-400">{sale.phone}</p>
                </td>
                <td className="px-4">
                  <PaymentBadge type={sale.payment} />
                </td>
                <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">
                  {sale.finance}
                </td>
                <td className="whitespace-nowrap px-4 text-[13px] font-medium text-slate-800">
                  {formatRupiah(sale.price)}
                </td>
                <td className="whitespace-nowrap px-4 text-[13px] font-semibold text-[#16A34A]">
                  {formatRupiah(sale.profit)}
                </td>
                <td className="px-4">
                  <StatusBadge status={sale.status} />
                </td>
                <td className="px-4">
                  <ProgressBar value={sale.completeness} />
                </td>
                <td className="px-4 last:pr-5">
                  <RowActions sale={sale} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={11} className="px-5 py-16 text-center text-[13px] text-slate-400">
                  Tidak ada data penjualan yang sesuai filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        pageCount={Math.max(pageCount, 1)}
        from={total === 0 ? 0 : from}
        to={to}
        total={total}
        onPageChange={onPageChange}
      />
    </div>
  )
}
