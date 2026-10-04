import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { usePipelineData } from '../context/usePipelineData'
import { formatRupiah } from '../data/sales'
import { Pagination } from '../components/Pagination'

const PAGE_SIZE = 8

const STATUS_COLOR: Record<string, string> = {
  Selesai: 'bg-emerald-50 text-emerald-700',
  Diproses: 'bg-blue-50 text-blue-700',
  Dibatalkan: 'bg-red-50 text-red-700',
}

export function PembelianPageContent() {
  const { purchases, advance } = usePipelineData()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [notice, setNotice] = useState<string | null>(null)

  const filtered = purchases.filter((p) => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      p.invoice.toLowerCase().includes(q) ||
      p.unit.toLowerCase().includes(q) ||
      p.supplier.toLowerCase().includes(q)
    )
  })

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const start = (safePage - 1) * PAGE_SIZE
  const rows = filtered.slice(start, start + PAGE_SIZE)

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[15px] font-bold text-slate-900">Data Pembelian</p>
          <p className="text-[12px] text-slate-400">{filtered.length} transaksi pembelian unit</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,110,253,0.35)] hover:bg-primary-hover">
          <Plus className="h-4 w-4" /> Tambah Pembelian
        </button>
      </div>

      {notice && (
        <div className="mb-4 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          {notice}
        </div>
      )}

      <div className="mb-4 flex items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Cari invoice, unit, supplier..."
            className="h-[38px] w-[300px] rounded-[8px] border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {['No. Invoice', 'Tanggal', 'Unit', 'Nopol', 'Supplier', 'Jenis Transaksi', 'Harga Beli', 'Biaya Admin', 'Metode Bayar', 'Status', 'Aksi'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="h-[60px] border-b border-line last:border-0 hover:bg-slate-50">
                  <td className="px-4"><span className="text-[13px] font-medium text-primary">{p.invoice}</span></td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{p.date}</td>
                  <td className="px-4"><span className="text-[13px] font-medium text-slate-900">{p.unit}</span></td>
                  <td className="whitespace-nowrap px-4 text-[13px] font-mono text-slate-500">{p.plate}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{p.supplier}</td>
                  <td className="whitespace-nowrap px-4 text-[12px] text-slate-500">{p.jenisTransaksi}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] font-semibold text-slate-800">{formatRupiah(p.price)}</td>
                  <td className="whitespace-nowrap px-4 text-[13px] text-slate-500">{formatRupiah(p.adminFee)}</td>
                  <td className="whitespace-nowrap px-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${p.paymentMethod === 'Transfer' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>{p.paymentMethod}</span></td>
                  <td className="px-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_COLOR[p.status]}`}>{p.status}</span></td>
                  <td className="px-4 pr-4 text-right">
                    {p.status === 'Diproses' && p.car.stage === 'purchasing' && (
                      <button
                        type="button"
                        onClick={() => {
                          const ok = advance(p.id, 'qc')
                          setNotice(
                            ok
                              ? `${p.invoice} — pembelian selesai, unit masuk stok NOT READY & proses QC.`
                              : `Transisi ke QC tidak valid untuk ${p.invoice}.`,
                          )
                        }}
                        className="rounded-[6px] bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-600"
                      >
                        Selesaikan → QC
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          page={safePage}
          pageCount={pageCount}
          from={filtered.length === 0 ? 0 : start + 1}
          to={Math.min(start + PAGE_SIZE, filtered.length)}
          total={filtered.length}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
