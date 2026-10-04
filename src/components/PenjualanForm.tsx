import { Check, FileText, UploadCloud } from 'lucide-react'
import { useMemo, useState } from 'react'
import { TransactionStepper } from './TransactionStepper'
import { formatRupiah } from '../data/sales'
import { inputCls, selectCls, Field, ToggleRow } from './FormSection'
import { usePipelineData } from '../context/usePipelineData'

type PenjualanFormProps = {
  onDraft?: () => void
  /** Dipanggil dengan key internal unit yang dipilih user; parent meneruskan ke action sale. */
  onProcess?: (unitKey: string) => void
}

type UnitOption = {
  id: string
  label: string
  image: string
  price: number
  plate: string
}

export function PenjualanForm({ onDraft, onProcess }: PenjualanFormProps) {
  const { masterUnits } = usePipelineData()

  // Unit READY dari state pipeline live — bukan static MASTER_UNITS.
  const UNITS: UnitOption[] = useMemo(
    () =>
      masterUnits
        .filter((u) => u.available)
        .map((u) => ({
          id: u.id,
          label: `${u.name} ${u.year}`,
          image: u.imageUrl,
          price: u.sellingPrice,
          plate: u.car.plate,
        })),
    [masterUnits],
  )

  const [step, setStep] = useState(1)
  const [isCash, setIsCash] = useState(true)
  const [isCarpain, setIsCarpain] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState(UNITS[0]?.id ?? '')
  const [jenisBayar, setJenisBayar] = useState('Transfer')
  const [garansi, setGaransi] = useState(false)
  const [statusBpkb, setStatusBpkb] = useState('Lunas')
  const [docUploaded, setDocUploaded] = useState<string[]>([])

  const unit = UNITS.find((u) => u.id === selectedUnit) ?? UNITS[0] ?? {
    id: '',
    label: 'Tidak ada unit READY',
    image: '',
    price: 0,
    plate: '',
  }
  const isFinished = step === 5

  const kpi = [
    { label: 'TOTAL PENJUALAN (UNIT)', value: '12', sub: 'unit terjual bulan ini', up: true },
    { label: 'TOTAL OMZET', value: 'Rp 4.58M', sub: 'akumulasi omzet bulan', up: true },
    { label: 'LABA KOTOR', value: 'Rp 784Jt', sub: 'laba kotor bulan ini', up: true },
    { label: 'RATA-RATA MARGIN', value: '17.2%', sub: 'margin rata-rata', up: true },
  ]

  const docs = ['KTP Customer', 'Bukti Transfer', 'Faktur Pajak', 'Dokumen Lain']

  const handleProcess = () => {
    if (unit.id) onProcess?.(unit.id)
  }

  return (
    <div className="px-4 py-5 lg:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[15px] font-bold text-slate-900">Input Penjualan {isCash ? '(Cash)' : '(Kredit)'}</p>
          <p className="text-[12px] text-slate-400">Buat transaksi penjualan unit baru</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDraft}
            className="h-[38px] rounded-[8px] border border-line bg-white px-4 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
          >
            Simpan Draft
          </button>
          <button
            type="button"
            onClick={handleProcess}
            disabled={!unit.id}
            className="h-[38px] rounded-[8px] bg-primary px-4 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,110,253,0.35)] hover:bg-primary-hover disabled:opacity-50"
          >
            Simpan & Proses
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {kpi.map((c) => (
              <div key={c.label} className="rounded-[10px] border border-line bg-white px-3.5 py-3">
                <p className="text-[10px] font-semibold tracking-[0.04em] text-slate-400">{c.label}</p>
                <p className="mt-1 text-[16px] font-bold text-slate-900">{c.value}</p>
              </div>
            ))}
          </div>

          <TransactionStepper currentStep={step} />

          {/* 1. Informasi Penjualan */}
          <div className="rounded-[12px] border border-line bg-white p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">1</span>
              <p className="text-[14px] font-semibold text-slate-900">Informasi Penjualan</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="No. Invoice / SPK">
                <input defaultValue="INV-2026-0901" className={inputCls} />
              </Field>
              <Field label="Tanggal">
                <input type="date" defaultValue="2026-09-15" className={inputCls} />
              </Field>
              <Field label="Cabang">
                <select className={selectCls}><option>Pusat</option><option>Cab 1</option></select>
              </Field>
              <Field label="Sales">
                <select className={selectCls}><option>Rudi Hartono</option><option>Maya Putri</option><option>Andi Saputra</option></select>
              </Field>
              <div className="sm:col-span-2">
                <p className="mb-2 text-[11.5px] font-medium text-slate-500">Jenis Transaksi</p>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-[13px] text-slate-700">
                    <input type="radio" name="jenis" checked={isCash} onChange={() => setIsCash(true)} className="accent-[#0D6EFD]" /> CASH
                  </label>
                  <label className="flex items-center gap-2 text-[13px] text-slate-700">
                    <input type="radio" name="jenis" checked={!isCash} onChange={() => setIsCash(false)} className="accent-[#0D6EFD]" /> CREDIT
                  </label>
                  <div className="ml-auto flex items-center gap-3">
                    <ToggleRow label="CarPain" checked={isCarpain} onChange={setIsCarpain} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Data Unit */}
          <div className="rounded-[12px] border border-line bg-white p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">2</span>
              <p className="text-[14px] font-semibold text-slate-900">Data Unit</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-[220px]">
                <Field label="Pilih Unit (hanya READY)">
                  <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} disabled={UNITS.length === 0} className={selectCls}>
                    {UNITS.length === 0 ? (
                      <option value="">Tidak ada unit READY</option>
                    ) : (
                      UNITS.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)
                    )}
                  </select>
                </Field>
              </div>
              <div className="relative flex items-center gap-2 rounded-[8px] bg-emerald-50 px-3 py-2">
                <img src={unit.image} alt={unit.label} className="h-8 w-8 rounded object-cover" />
                <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10.5px] font-bold text-white">CERTIFIED</span>
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-slate-900">{unit.label}</p>
                <p className="text-[12px] text-slate-500">Nopol {unit.plate || '—'}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-[11px] text-slate-400">Harga Jual</p>
                <p className="text-[15px] font-bold text-slate-900">{formatRupiah(unit.price)}</p>
              </div>
            </div>
          </div>

          {/* 3. Data Customer */}
          <div className="rounded-[12px] border border-line bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">3</span>
                <p className="text-[14px] font-semibold text-slate-900">Data Customer</p>
              </div>
              <button type="button" className="text-[12px] font-semibold text-primary hover:underline">+ Tambah Customer</button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nama Customer"><input defaultValue="Budi Santoso" className={inputCls} /></Field>
              <Field label="No. Telepon"><input defaultValue="0812-3456-7890" className={inputCls} /></Field>
              <Field label="Email"><input defaultValue="budi.santoso@mail.com" className={inputCls} /></Field>
              <Field label="Alamat"><textarea rows={2} defaultValue="Jl. Sudirman No. 10, Jakarta" className="rounded-[8px] border border-line bg-white p-3 text-[13px] outline-none focus:border-primary" /></Field>
              <Field label="KTP / NIK"><input placeholder="32.01.01.123456" className={inputCls} /></Field>
              <Field label="Pekerjaan"><input defaultValue="Wiraswasta" className={inputCls} /></Field>
            </div>
          </div>

          {/* 4. Detail Penjualan */}
          <div className="rounded-[12px] border border-line bg-white p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">4</span>
              <p className="text-[14px] font-semibold text-slate-900">Detail Penjualan {isCash ? '(Cash)' : '(Kredit)'}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Jenis Pembayaran">
                <select value={jenisBayar} onChange={(e) => setJenisBayar(e.target.value)} className={selectCls}>
                  <option>Transfer</option><option>Tunai</option><option>Cek</option>
                </select>
              </Field>
              <Field label="Harga Jual"><input defaultValue="105000000" type="number" className={inputCls} /></Field>
              <Field label="Diskon"><input defaultValue="0" type="number" className={inputCls} /></Field>
              {isCash && (
                <Field label="Komisi Sales"><input defaultValue="500000" type="number" className={inputCls} /></Field>
              )}
            </div>
            {isCash && (
              <div className="mt-4 space-y-3 border-t border-line pt-4">
                <ToggleRow label="Garansi Otosector" hint="Sertakan garansi tambahan dari otosector" checked={garansi} onChange={setGaransi} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Status BPKB">
                    <select value={statusBpkb} onChange={(e) => setStatusBpkb(e.target.value)} className={selectCls}>
                      <option>Lunas</option><option>Terblokir</option>
                    </select>
                  </Field>
                  <Field label="Status Transaksi">
                    <select className={selectCls}><option>Draft</option><option>Proses</option><option>Selesai</option></select>
                  </Field>
                </div>
              </div>
            )}
          </div>

          {/* 6. Dokumen (sub baru setelah pembayaran) */}
          {!isFinished && (
            <div className="rounded-[12px] border border-line bg-white p-5">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">6</span>
                <p className="text-[14px] font-semibold text-slate-900">Dokumen</p>
                <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600"><Check className="h-3 w-3" /> Sub baru setelah pembayaran</span>
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
          )}

          <div className="flex items-center justify-end gap-2">
            {step < 5 && (
              <button type="button" onClick={() => setStep(step + 1)} className="h-[38px] rounded-[8px] border border-line bg-white px-4 text-[13px] font-medium text-slate-600 hover:bg-slate-50">
                Lanjut
              </button>
            )}
            <button type="button" onClick={onDraft} className="h-[38px] rounded-[8px] border border-line bg-white px-4 text-[13px] font-medium text-slate-600 hover:bg-slate-50">
              Simpan Draft
            </button>
            <button type="button" onClick={handleProcess} disabled={!unit.id} className="h-[38px] rounded-[8px] bg-primary px-4 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,110,253,0.35)] hover:bg-primary-hover disabled:opacity-50">
              {isFinished ? 'Simpan & Selesai' : 'Simpan & Proses'}
            </button>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          <div className="rounded-[12px] border border-line bg-white p-5">
            <p className="text-[13px] font-semibold text-slate-900">Ringkasan Penjualan</p>
            <div className="mt-3 space-y-2.5 text-[12.5px]">
              <div className="flex justify-between"><span className="text-slate-500">Unit</span><span className="font-semibold text-slate-900">{unit.label}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Harga Jual</span><span className="font-semibold text-slate-900">{formatRupiah(unit.price)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Diskon</span><span className="text-slate-900">Rp 0</span></div>
              <div className="flex justify-between border-t border-line pt-2.5"><span className="text-slate-500">Jenis</span><span className="font-semibold text-primary">{isCash ? 'Cash' : 'Kredit'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Jenis Bayar</span><span className="text-slate-900">{jenisBayar}</span></div>
            </div>
            <div className="mt-4 rounded-[8px] bg-slate-50 p-3">
              <p className="text-[11px] font-medium text-slate-500">Total Tagihan</p>
              <p className="text-[16px] font-bold text-primary">{formatRupiah(unit.price)}</p>
            </div>
          </div>

          <div className="rounded-[12px] border border-line bg-white p-5">
            <p className="text-[13px] font-semibold text-slate-900">Progress Transaksi</p>
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
