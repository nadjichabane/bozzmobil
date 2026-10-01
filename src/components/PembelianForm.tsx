import { FileText, Search, UploadCloud } from 'lucide-react'
import { useState } from 'react'
import { MASTER_UNITS } from '../data/masterUnits'
import { SUPPLIERS } from '../data/suppliers'
import { formatRupiah } from '../data/sales'
import { inputCls, selectCls, Field, CheckRow } from './FormSection'
import { TransactionStepper } from './TransactionStepper'

type PembelianFormProps = {
  onDraft?: () => void
  onProcess?: () => void
}

const UNITS = MASTER_UNITS.map((u) => ({
  id: u.id,
  label: `${u.name} ${u.year}`,
  image: u.imageUrl,
}))

export function PembelianForm({ onDraft, onProcess }: PembelianFormProps) {
  const [step] = useState(0)
  const [isTradeIn, setIsTradeIn] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState(UNITS[0].id)
  const [selectedSupplier, setSelectedSupplier] = useState(SUPPLIERS[0].name)
  const [kelengkapan, setKelengkapan] = useState<Record<string, boolean>>({
    kunci: true,
    faktur: true,
    sertifikat: false,
    bukuManual: true,
    bukuService: false,
  })

  const unit = UNITS.find((u) => u.id === selectedUnit) ?? UNITS[0]

  const kelengkapanItems = [
    { key: 'kunci', label: 'Kunci Serep' },
    { key: 'faktur', label: 'Faktur' },
    { key: 'sertifikat', label: 'Sertifikat' },
    { key: 'bukuManual', label: 'Buku Manual' },
    { key: 'bukuService', label: 'Buku Service' },
  ]

  const docs = ['Faktur Pembelian', 'Bukti Transfer', 'Dokumen STNK', 'Dokumen Lain']
  const [docUploaded, setDocUploaded] = useState<string[]>([])

  return (
    <div className="px-4 py-5 lg:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[15px] font-bold text-slate-900">Tambah Pembelian</p>
          <p className="text-[12px] text-slate-400">Catat transaksi pembelian unit baru</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onDraft} className="h-[38px] rounded-[8px] border border-line bg-white px-4 text-[13px] font-medium text-slate-600 hover:bg-slate-50">
            Simpan Draft
          </button>
          <button type="button" onClick={onProcess} className="h-[38px] rounded-[8px] bg-primary px-4 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,110,253,0.35)] hover:bg-primary-hover">
            Simpan & Proses
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <TransactionStepper currentStep={step} />

          {/* 1. Informasi Pembelian */}
          <div className="rounded-[12px] border border-line bg-white p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">1</span>
              <p className="text-[14px] font-semibold text-slate-900">Informasi Pembelian</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="No. Pembelian"><input defaultValue="POB-2026-0401" className={inputCls} /></Field>
              <Field label="Tanggal"><input type="date" defaultValue="2026-09-15" className={inputCls} /></Field>
              <Field label="Cabang">
                <select className={selectCls}><option>Pusat</option><option>Cab 1</option></select>
              </Field>
              <Field label="Status">
                <select className={selectCls}><option>Draft</option><option>Proses</option><option>Selesai</option></select>
              </Field>
              <Field label="PIC / Buyer"><input defaultValue="Rudi Hartono" className={inputCls} /></Field>
              <Field label="Nama Inspektur"><input defaultValue="Andi Saputra" className={inputCls} /></Field>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between rounded-[8px] border border-line px-4 py-3">
                <div>
                  <p className="text-[13px] font-medium text-slate-800">Trade-in</p>
                  <p className="text-[11px] text-slate-400">Unit masuk dari tukar tambah customer</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTradeIn((v) => !v)}
                  className={`relative h-[20px] w-[36px] rounded-full transition-colors ${isTradeIn ? 'bg-primary' : 'bg-slate-200'}`}
                >
                  <span className={`absolute top-[2px] h-4 w-4 rounded-full bg-white shadow transition-all ${isTradeIn ? 'left-[18px]' : 'left-[2px]'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* 2. Data Unit */}
          <div className="rounded-[12px] border border-line bg-white p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">2</span>
              <p className="text-[14px] font-semibold text-slate-900">Data Unit</p>
            </div>
            <div className="mb-4 flex items-center gap-2 rounded-[8px] border border-line bg-white px-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input placeholder="Cari unit..." className="h-[38px] w-full bg-transparent text-[13px] outline-none" />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-[220px]">
                <Field label="Pilih Unit">
                  <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className={selectCls}>
                    {UNITS.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
                  </select>
                </Field>
              </div>
              <img src={unit.image} alt={unit.label} className="h-12 w-20 rounded-[8px] object-cover" />
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-slate-900">{unit.label}</p>
                <p className="text-[12px] text-slate-500">Nopol B 1505 TAG</p>
              </div>
            </div>
          </div>

          {/* 3. Data Supplier */}
          <div className="rounded-[12px] border border-line bg-white p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">3</span>
              <p className="text-[14px] font-semibold text-slate-900">Data Supplier</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Supplier">
                <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} className={selectCls}>
                  {SUPPLIERS.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </Field>
              <Field label="No. Telepon"><input defaultValue="021-5551234" className={inputCls} /></Field>
              <Field label="Kota"><input defaultValue="Jakarta Timur" className={inputCls} /></Field>
              <Field label="Nama Bank"><input defaultValue="BCA" className={inputCls} /></Field>
              <Field label="No. Rekening"><input defaultValue="0210123456" className={inputCls} /></Field>
              <Field label="Atas Nama"><input defaultValue="PT Auto Sumber Makmur" className={inputCls} /></Field>
              <Field label="Email"><input defaultValue="hendra@autosumber.co.id" className={inputCls} /></Field>
              <Field label="Alamat" className="sm:col-span-2">
                <input defaultValue="Jl. Raya Bekasi No. 45, Jakarta Timur" className={inputCls} />
              </Field>
            </div>
          </div>

          {/* 4. Kelengkapan Unit */}
          <div className="rounded-[12px] border border-line bg-white p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">4</span>
              <p className="text-[14px] font-semibold text-slate-900">Kelengkapan Unit</p>
            </div>
            <div className="space-y-3">
              {kelengkapanItems.map((item) => (
                <CheckRow
                  key={item.key}
                  label={item.label}
                  checked={kelengkapan[item.key]}
                  onChange={(v) => setKelengkapan((prev) => ({ ...prev, [item.key]: v }))}
                  note={undefined}
                />
              ))}
              <div className="rounded-[8px] border border-line bg-slate-50 px-4 py-3">
                <p className="mb-1.5 text-[12px] font-medium text-slate-600">Catatan</p>
                <textarea rows={2} placeholder="Tuliskan catatan tambahan..." className="w-full resize-none rounded-[6px] border border-line bg-white p-2 text-[12.5px] outline-none focus:border-primary" />
              </div>
            </div>
          </div>

          {/* 5. Detail Transaksi */}
          <div className="rounded-[12px] border border-line bg-white p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">5</span>
              <p className="text-[14px] font-semibold text-slate-900">Detail Transaksi</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Dibeli Oleh">
                <select className={selectCls}><option>Pusat</option><option>Cab 1</option></select>
              </Field>
              <Field label="Harga Beli"><input defaultValue="85000000" type="number" className={inputCls} /></Field>
              <Field label="Komisi"><input defaultValue="1000000" type="number" className={inputCls} /></Field>
              <Field label="Total Pembayaran"><input defaultValue="86000000" type="number" className={inputCls} /></Field>
              <Field label="Dibayar"><input defaultValue="86000000" type="number" className={inputCls} /></Field>
              <Field label="Sisa Pembayaran"><input defaultValue="0" type="number" className={inputCls} /></Field>
            </div>
          </div>

          {/* 6. Dokumen */}
          <div className="rounded-[12px] border border-line bg-white p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">6</span>
              <p className="text-[14px] font-semibold text-slate-900">Dokumen</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {docs.map((d) => {
                const uploaded = docUploaded.includes(d)
                return (
                  <div key={d} className={`flex items-center justify-between rounded-[8px] border px-4 py-3 ${uploaded ? 'border-emerald-200 bg-emerald-50' : 'border-line bg-white'}`}>
                    <div className="flex items-center gap-2.5">
                      <FileText className={`h-4 w-4 ${uploaded ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <div>
                        <p className="text-[13px] font-medium text-slate-800">{d}</p>
                        <p className="text-[11px] text-slate-400">{uploaded ? 'sudah diunggah' : 'belum diunggah'}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDocUploaded((prev) => (uploaded ? prev.filter((x) => x !== d) : [...prev, d]))}
                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline"
                    >
                      <UploadCloud className="h-3.5 w-3.5" /> {uploaded ? 'Ganti' : 'Unggah'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onDraft} className="h-[38px] rounded-[8px] border border-line bg-white px-4 text-[13px] font-medium text-slate-600 hover:bg-slate-50">
              Simpan Draft
            </button>
            <button type="button" onClick={onProcess} className="h-[38px] rounded-[8px] bg-primary px-4 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,110,253,0.35)] hover:bg-primary-hover">
              Simpan & Proses
            </button>
          </div>
        </div>

        {/* Right panel: ringkasan pembelian */}
        <div className="space-y-4">
          <div className="rounded-[12px] border border-line bg-white p-5">
            <p className="text-[13px] font-semibold text-slate-900">Ringkasan Pembelian</p>
            <div className="mt-3 space-y-2.5 text-[12.5px]">
              <div className="flex justify-between"><span className="text-slate-500">Unit</span><span className="font-semibold text-slate-900">{unit.label}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Supplier</span><span className="font-semibold text-slate-900">{selectedSupplier}</span></div>
              <div className="flex justify-between border-t border-line pt-2.5"><span className="text-slate-500">Harga Beli</span><span className="font-semibold text-slate-900">{formatRupiah(85_000_000)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Komisi</span><span className="text-slate-900">{formatRupiah(1_000_000)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Sisa Bayar</span><span className="text-slate-900">{formatRupiah(0)}</span></div>
            </div>
            <div className="mt-4 rounded-[8px] bg-slate-50 p-3">
              <p className="text-[11px] font-medium text-slate-500">Total Pembayaran</p>
              <p className="text-[16px] font-bold text-primary">{formatRupiah(86_000_000)}</p>
            </div>
          </div>

          <div className="rounded-[12px] border border-line bg-white p-5">
            <p className="text-[13px] font-semibold text-slate-900">Progress</p>
            <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-primary" style={{ width: `${((step + 1) / 6) * 100}%` }} />
            </div>
            <p className="mt-2 text-[11.5px] text-slate-400">Langkah {step + 1} dari 6</p>
          </div>
        </div>
      </div>
    </div>
  )
}
