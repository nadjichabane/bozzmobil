import { formatLeadPriceRange } from '../lib/leadPriceRange'
import { PURCHASE_PAYMENT_CATEGORIES } from '../lib/purchasePaymentCategory'
import { GanttChartSquare, ArrowLeft, CheckCircle2, FileText, Car, Users, Upload, Shield, Receipt, FileCheck, ArrowRight, Clock, FileCheck2, Search, Wallet, Ban, Hourglass } from 'lucide-react'
import { useRef, useState, useMemo } from 'react'
import { usePipelineData, type PurchaseRow } from '../context/usePipelineData'
import { RupiahInput } from '../components/RupiahInput'
import { formatRupiah } from '../data/sales'
import { SectionCard, Field, inputCls, selectCls } from '../components/FormSection'
import { type PipelineCar, type CarPayment, SCHEMA_UNITS, type SchemaUnit } from '../data/pipeline'
import { type PurchaseDocument, type PaymentAllocation, sumPaymentEntries, computePaymentStatus } from '../data/payments'
import { StatCard } from '../components/StatCard'
import { isValidPlate, normalizePlate, PLATE_FORMAT_MESSAGE } from '../lib/licensePlate'
import { Pagination } from '../components/Pagination'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { MasterSupplierPicker } from '../components/MasterSupplierPicker'
import { StockEntryButton } from '../components/StockEntryButton'
import { PartyTypeToggle, type PartyType } from '../components/PartyTypeToggle'
import type { Supplier } from '../data/suppliers'

const PAYMENT_CATEGORIES = PURCHASE_PAYMENT_CATEGORIES
const PAGE_SIZE = 8

// ── Payment status badge mapping to Badge tones ────────────────────────────
const PAY_STATUS_TONE: Record<string, 'neutral' | 'warning' | 'success'> = {
  'BELUM DIBAYAR': 'neutral',
  'BELUM LUNAS': 'warning',
  'LUNAS': 'success',
}

export function ProsesPembelianPage() {
  const {
    purchaseRows,
    isPurchaseRejected,
    isEnteredPurchaseProcess,
    getPaymentRequestForSource,
    getEntriesForRequest,
    getCar,
  } = usePipelineData()

  const [selected, setSelected] = useState<PurchaseRow | null>(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  // Only units explicitly confirmed via Data Pembelian → "YA, PROSES PEMBELIAN"
  const pending = purchaseRows.filter(
    (r) =>
      r.car.stage === 'purchasing' &&
      !isPurchaseRejected(r.id) &&
      isEnteredPurchaseProcess(r.id),
  )

  // ── KPI Proses Pembelian ─────────────────────────────────────────────────
  // Counts are derived from the live pending set (stage 'purchasing', not
  // rejected, entered purchase process) and rejected purchaseRows.
  // The hook must run unconditionally every render — placing it after an
  // early return violates the Rules of Hooks (crash when `selected` is set,
  // plus a sibling hook count mismatch because the detail form also calls
  // usePipelineData at a different depth).
  const kpi = useMemo(() => {
    let menunggu = 0, parsial = 0, lunas = 0
    for (const r of pending) {
      const liveCar = getCar(r.id)
      const req = getPaymentRequestForSource('PURCHASE_UNIT', r.id)
      const entries = req ? getEntriesForRequest(req.id) : []
      const totalPaid = req ? sumPaymentEntries(entries) : (liveCar?.payment?.payments ?? []).reduce((sum, payment) => sum + payment.amount, 0)
      const displayTotal = req ? req.totalAmount : (liveCar?.buyPrice ?? r.price)
      const status = totalPaid === 0 ? 'BELUM DIBAYAR' : computePaymentStatus(displayTotal, totalPaid)
      if (status === 'BELUM DIBAYAR') menunggu++
      else if (status === 'BELUM LUNAS') parsial++
      else if (status === 'LUNAS') lunas++
    }
    const rejectCount = purchaseRows.filter((r) => isPurchaseRejected(r.id)).length
    return { total: pending.length, menunggu, parsial, lunas, reject: rejectCount }
  }, [pending, getCar, getPaymentRequestForSource, getEntriesForRequest, purchaseRows, isPurchaseRejected])

  // ── When a unit is selected, show the detail form ────────────────────────
  if (selected) {
    return <PurchaseInfoForm row={selected} onBack={() => setSelected(null)} />
  }

  const kpiCards = [
    { label: 'TOTAL UNIT PROSES', value: String(kpi.total), sub: 'unit dalam proses pembelian',
      Icon: GanttChartSquare, iconBg: 'bg-[#2F80ED]' },
    { label: 'MENUNGGU PEMBAYARAN', value: String(kpi.menunggu), sub: 'belum ada pembayaran',
      Icon: Hourglass, iconBg: 'bg-[#F59E0B]' },
    { label: 'PEMBAYARAN PARSIAL', value: String(kpi.parsial), sub: 'belum lunas',
      Icon: Wallet, iconBg: 'bg-[#8B5CF6]' },
    { label: 'PEMBAYARAN LUNAS', value: String(kpi.lunas), sub: 'lunas sepenuhnya',
      Icon: CheckCircle2, iconBg: 'bg-[#22C55E]' },
    { label: 'REJECT PEMBELIAN', value: String(kpi.reject), sub: 'pembelian ditolak',
      Icon: Ban, iconBg: 'bg-[#EF4444]' },
  ]

  // ── Search & pagination ─────────────────────────────────────────────────
  const filtered = pending.filter((r) => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      r.inspection.code.toLowerCase().includes(q) ||
      r.customer.toLowerCase().includes(q) ||
      r.unit.toLowerCase().includes(q) ||
      r.plate.toLowerCase().includes(q)
    )
  })

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const start = (safePage - 1) * PAGE_SIZE
  const rows = filtered.slice(start, start + PAGE_SIZE)

  // ── Helper: derive payment data for a row ───────────────────────────────
  // Reads the canonical car from pipeline context so live buyPrice is used
  // (not a stale row snapshot). If the car no longer exists, show the last
  // known row price — the request total (if any) is still authoritative.
  const getPaymentData = (r: PurchaseRow) => {
    const liveCar = getCar(r.id)
    const req = getPaymentRequestForSource('PURCHASE_UNIT', r.id)
    const entries = req ? getEntriesForRequest(req.id) : []
    const totalPaid = req ? sumPaymentEntries(entries) : (liveCar?.payment?.payments ?? []).reduce((sum, payment) => sum + payment.amount, 0)
    const displayTotal = req ? req.totalAmount : (liveCar?.buyPrice ?? r.price)
    const remaining = Math.max(0, displayTotal - totalPaid)
    const status = totalPaid === 0 ? 'BELUM DIBAYAR' : computePaymentStatus(displayTotal, totalPaid)
    return { totalPaid, remaining, status, displayTotal }
  }

  // ── Unit list as compact table ─────────────────────────────────────────
  return (
    <div>
      {/* KPI Cards — Proses Pembelian */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {kpiCards.map((c) => (
          <StatCard
            key={c.label}
            title={c.label}
            value={c.value}
            trend={c.sub}
            trendUp
            icon={c.Icon}
            iconBg={c.iconBg}
          />
        ))}
      </div>

      <div className="mt-5 mb-4">
        <div className="flex items-center gap-2">
          <GanttChartSquare className="h-5 w-5 text-slate-400" />
          <p className="text-[15px] font-bold text-slate-900">Proses Pembelian</p>
        </div>
        <p className="mt-0.5 text-[12px] text-slate-400">
          {pending.length} unit dalam proses pembelian
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="rounded-[12px] border border-line bg-white p-8 text-center">
          <p className="text-[13px] font-medium text-slate-500">
            Belum ada unit yang masuk proses pembelian.
          </p>
          <p className="mt-1 text-[12px] text-slate-400">
            Unit muncul di sini setelah admin konfirmasi "YA, PROSES PEMBELIAN" dari halaman Data Pembelian.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1) }}
                placeholder="Cari ID inspeksi, customer, unit, nopol..."
                className="h-[38px] w-[320px] rounded-[8px] border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line">
                    {[
                      'ID Inspeksi', 'Nama Customer', 'Unit', 'Harga Awal', 'Harga Beli',
                      'Schema Unit', 'Nominal Dibayar', 'Sisa Pembayaran',
                      'Status Pembayaran', 'Aksi',
                    ].map((h) => (
                      <th key={h} className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold text-slate-500 first:pl-5 last:pr-5 last:text-right">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const pd = getPaymentData(r)
                    return (
                      <tr key={r.id} className="h-[60px] border-b border-line last:border-0 hover:bg-slate-50">
                        <td className="px-4 first:pl-5">
                          <span className="text-[13px] font-medium text-primary">{r.inspection.code}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 text-[13px] text-slate-700">{r.car.supplierDetail?.name ?? r.customer ?? '—'}<p className="text-[11px] text-slate-500">{r.car.purchasePartyType ?? (r.car.supplierId ? 'Supplier' : 'Belum ditentukan')}</p></td>
                        <td className="px-4">
                          <span className="text-[13px] font-medium text-slate-900">{r.unit}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 text-[13px] text-slate-500" title="Harga Awal — dari Leads">{formatLeadPriceRange(r.car)}</td>
                        <td className="whitespace-nowrap px-4 text-[13px] font-semibold text-slate-800">{formatRupiah(r.car.buyPrice)}</td>
                        <td className="px-4">
                          <span className="rounded-[6px] bg-slate-100 px-2 py-0.5 text-[12px] font-medium text-slate-600">{r.car.schemaUnit}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 text-[13px] text-slate-800">{formatRupiah(pd.totalPaid)}</td>
                        <td className={`whitespace-nowrap px-4 text-[13px] font-semibold ${pd.remaining > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {formatRupiah(pd.remaining)}
                        </td>
                        <td className="px-4">
                          <Badge tone={PAY_STATUS_TONE[pd.status] ?? 'neutral'} withDot>
                            {pd.status}
                          </Badge>
                        </td>
                        <td className="px-4 last:pr-5">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <Button variant="secondary" size="sm" onClick={() => setSelected(r)}>
                              LIHAT / EDIT
                            </Button>
                            <StockEntryButton carKey={r.id} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-5 py-16 text-center text-[13px] text-slate-400">
                        Tidak ada unit yang sesuai pencarian.
                      </td>
                    </tr>
                  )}
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
        </>
      )}
    </div>
  )
}

// ── Detail form for a selected unit ─────────────────────────────────────────

function PurchaseInfoForm({ row, onBack }: { row: PurchaseRow; onBack: () => void }) {
  const { suppliers, addSupplier, getSupplierById, saveCarPayment, saveCarCorrections, saveSupplierDetail, createPaymentRequest, getPaymentRequestForSource, getEntriesForRequest, purchaseDocuments, updatePurchaseDocument, getPurchaseId, getCar, hasActivePaymentRequest } = usePipelineData()

  // ── Data Unit correction fields (initialized from the live car when available)
  const liveCar = getCar(row.id)
  const [paymentCategory, setPaymentCategory] = useState<string>(liveCar?.payment?.paymentCategory ?? '')
  const [brand, setBrand] = useState(liveCar?.brand ?? row.car.brand)
  const [plate, setPlate] = useState(liveCar?.plate ?? row.car.plate)
  const [model, setModel] = useState(liveCar?.model ?? row.car.model)
  const [year, setYear] = useState(String(liveCar?.year ?? row.car.year))
  const [transmission, setTransmission] = useState(liveCar?.transmission ?? row.car.transmission)
  const [mileage, setMileage] = useState(String(liveCar?.mileage ?? row.car.mileage))
  const [schemaUnit, setSchemaUnit] = useState(liveCar?.schemaUnit ?? row.car.schemaUnit)
  const [color, setColor] = useState(liveCar?.color ?? row.car.color)

  // ── Data Supplier fields
  const [supName, setSupName] = useState(row.car.supplierDetail?.name ?? row.car.supplier ?? '')
  const [supplierId, setSupplierId] = useState(liveCar?.supplierId ?? '')
  const [partyType, setPartyType] = useState<PartyType>(liveCar?.purchasePartyType ?? 'Supplier')
  const [supPhone, setSupPhone] = useState(row.car.supplierDetail?.phone ?? '')
  const [supAddress, setSupAddress] = useState(row.car.supplierDetail?.address ?? '')
  const [supBank, setSupBank] = useState(row.car.supplierDetail?.bank ?? '')
  const [supAcctNum, setSupAcctNum] = useState(row.car.supplierDetail?.accountNumber ?? '')
  const [supAcctHolder, setSupAcctHolder] = useState(row.car.supplierDetail?.accountHolder ?? '')
  const [supEmail, setSupEmail] = useState(row.car.supplierDetail?.email ?? '')
  const [partyDrafts, setPartyDrafts] = useState<Record<PartyType, { id: string; name: string; phone: string; address: string; bank: string; accountNumber: string; accountHolder: string; email: string }>>({
    Supplier: { id: liveCar?.supplierId ?? '', name: row.car.supplier ?? '', phone: '', address: '', bank: '', accountNumber: '', accountHolder: '', email: '' },
    Perorangan: { id: '', name: row.customer ?? '', phone: row.customerPhone ?? '', address: row.car.address ?? '', bank: '', accountNumber: '', accountHolder: '', email: '' },
  })

  // ── File input refs — one per doc slot, used to reset value after selection
  const ktpInputRef = useRef<HTMLInputElement>(null)
  const kwitansiInputRef = useRef<HTMLInputElement>(null)
  const bastkInputRef = useRef<HTMLInputElement>(null)
  const docInputRefs: Record<PurchaseDocument['key'], React.RefObject<HTMLInputElement | null>> = {
    KTP: ktpInputRef,
    KWITANSI: kwitansiInputRef,
    BASTK: bastkInputRef,
  }

  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [buyPrice, setBuyPrice] = useState<number | undefined>(row.car.buyPrice || undefined)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const priceRef = useRef(row.car.buyPrice)

  // ── Alokasi pembayaran (planned breakdown of gross buyPrice) ─────────────
  // Pre-filled with buyPrice (pembayaran) + 0 (commission) when the form opens.
  // Both recipients default to the supplier name.
  const initialBuyPrice = row.car.buyPrice
  const [settleAmount, setSettleAmount] = useState<number | undefined>(initialBuyPrice > 0 ? initialBuyPrice : undefined)
  const [commAmount, setCommAmount] = useState<number | undefined>(0)
  const [settleRecipient, setSettleRecipient] = useState(row.car.supplierDetail?.name ?? row.car.supplier ?? '')
  const [commRecipient, setCommRecipient] = useState(row.car.supplierDetail?.name ?? row.car.supplier ?? '')
  const [sameRecipient, setSameRecipient] = useState(true)
  const [commBank, setCommBank] = useState('')
  const [commAccountNumber, setCommAccountNumber] = useState('')
  const [commAccountHolder, setCommAccountHolder] = useState('')

  // ── Data-integrity guard: financial submission requires the canonical car to exist.
  if (!liveCar) {
    return (
      <div>
        <div className="mb-5 flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={onBack}>
            &larr; Kembali ke Daftar
          </Button>
          <p className="text-[15px] font-bold text-slate-900">Informasi Pembelian — {row.unit}</p>
        </div>
        <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-800">
          Data unit tidak ditemukan di pipeline. Pembelian tidak dapat diproses.
        </div>
      </div>
    )
  }
  const car = liveCar
  const existing = car.payment
  const priceLocked = hasActivePaymentRequest('PURCHASE_UNIT', car.key)

  // Purchase Admin Documents (KTP, KWITANSI, BASTK)
  const docs: PurchaseDocument[] = purchaseDocuments[car.key] ?? [
    { key: 'KTP', status: 'BELUM UPLOAD' },
    { key: 'KWITANSI', status: 'BELUM UPLOAD' },
    { key: 'BASTK', status: 'BELUM UPLOAD' },
  ]

  const handleDocUpload = (docKey: PurchaseDocument['key']) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const f = e.target.files?.[0]
    if (f) {
      updatePurchaseDocument(car.key, docKey, 'TERUPLOAD', f.name)
    }
    // Reset so the same physical file can be re-selected in the same slot
    if (docInputRefs[docKey].current) {
      docInputRefs[docKey].current.value = ''
    }
  }

  // Payment request state for this purchase
  const existingPaymentRequest = getPaymentRequestForSource('PURCHASE_UNIT', car.key)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // HARGA BELI — editable until a PURCHASE_UNIT PaymentRequest exists.
  // Local state syncs with the canonical car; explicit save persists the edit.
  // Sync with the canonical car when its buyPrice changes between renders.
  if (priceRef.current !== car.buyPrice) {
    priceRef.current = car.buyPrice
    if (!buyPrice) setBuyPrice(car.buyPrice)
  }
  const priceDirty = (buyPrice ?? 0) !== car.buyPrice

  const handleSavePrice = () => {
    if (priceLocked) return
    const v = buyPrice ?? 0
    if (v <= 0) {
      setError('Harga Beli harus lebih dari 0.')
      return
    }
    setError(null)
    saveCarCorrections(car.key, { buyPrice: v })
    setBuyPrice(undefined) // adopt the saved value as the synced baseline
    showToast('Harga Beli tersimpan.')
  }

  const handleSaveCorrections = () => {
    if (!isValidPlate(plate)) { setError('Nopol wajib diisi dengan format valid sebelum menyimpan koreksi.'); return }
    const saved = saveCarCorrections(car.key, {
      plate,
      brand: brand.trim() || car.brand,
      model: model.trim() || car.model,
      year: parseInt(year) || car.year,
      color: color.trim() || car.color,
      transmission: transmission as PipelineCar['transmission'],
      mileage: Math.max(0, parseFloat(mileage) || 0),
      schemaUnit: schemaUnit,
    })
    if (!saved) { setError('Koreksi tidak dapat disimpan. Periksa kembali data unit.'); return }
    setError(null)
    showToast('Koreksi tersimpan.')
  }

  const supplierSnapshot = () => ({
      name: partyType === 'Supplier' ? getSupplierById(supplierId)?.name ?? supName.trim() : supName.trim(),
      phone: supPhone.trim(),
      address: supAddress.trim(),
      bank: supBank.trim(),
      accountNumber: supAcctNum.trim(),
      accountHolder: supAcctHolder.trim(),
      email: supEmail.trim(),
  })
  const selectedSupplierIsValid = () => {
    if (partyType === 'Perorangan') {
      if (supName.trim().length >= 2) return true
      setError('Nama penjual perorangan wajib diisi, minimal dua karakter.')
      return false
    }
    const supplier = getSupplierById(supplierId)
    if (!supplier || supplier.status === 'Nonaktif') {
      setError('Pilih supplier aktif yang sudah terdaftar di Master Supplier.')
      return false
    }
    return true
  }
  const selectSupplier = (id: string, created?: Supplier) => {
    if (priceLocked) return
    if (!id) {
      setSupplierId(''); setSupName(''); setSupPhone(''); setSupAddress('')
      setSupBank(''); setSupAcctNum(''); setSupAcctHolder(''); setSupEmail('')
      setSettleRecipient(''); if (sameRecipient) setCommRecipient('')
      return
    }
    const supplier = created ?? getSupplierById(id)
    if (!supplier || supplier.status === 'Nonaktif') return
    setSupplierId(id); setSupName(supplier.name); setSupPhone(supplier.phone)
    setSupAddress(supplier.address || supplier.kota || ''); setSupBank(supplier.bank ?? '')
    setSupAcctNum(supplier.accountNumber ?? ''); setSupAcctHolder(supplier.accountHolder ?? '')
    setSupEmail(supplier.email); setSettleRecipient(supplier.name)
    if (sameRecipient) setCommRecipient(supplier.name)
    setError(null)
  }
  const handleSaveSupplier = () => {
    if (!selectedSupplierIsValid()) return
    saveSupplierDetail(car.key, supplierSnapshot(), partyType === 'Supplier' ? supplierId : undefined, partyType)
    showToast('Supplier tersimpan.')
  }
  const changePartyType = (next: PartyType) => {
    if (priceLocked || next === partyType) return
    setPartyDrafts({ ...partyDrafts, [partyType]: { id: supplierId, name: supName, phone: supPhone, address: supAddress, bank: supBank, accountNumber: supAcctNum, accountHolder: supAcctHolder, email: supEmail } })
    const draft = partyDrafts[next]
    setPartyType(next); setSupplierId(draft.id); setSupName(draft.name); setSupPhone(draft.phone)
    setSupAddress(draft.address); setSupBank(draft.bank); setSupAcctNum(draft.accountNumber); setSupAcctHolder(draft.accountHolder); setSupEmail(draft.email)
    setSettleRecipient(draft.name); if (sameRecipient) setCommRecipient(draft.name)
    setError(null)
  }

  const handleRequestSubmit = () => {
    const current = getCar(car.key)
    if (!isValidPlate(plate) || !current || !isValidPlate(current.plate)) {
      setError('Nopol wajib diisi dan disimpan pada Data Unit sebelum melanjutkan ke pembayaran.')
      return
    }
    if (normalizePlate(plate) !== normalizePlate(current.plate)) {
      setError('Ada perubahan Nopol yang belum disimpan. Klik Simpan Koreksi terlebih dahulu.')
      return
    }
    if (!selectedSupplierIsValid()) { setConfirmOpen(false); return }
    if (!paymentCategory) { setError('Kategori pembayaran wajib dipilih.'); setConfirmOpen(false); return }
    // Always validate against the canonical car's latest saved buyPrice —
    // never the row snapshot. Unsaved price edits must be committed first.
    const liveCar = getCar(car.key)
    if (!liveCar) {
      setError('Data unit tidak ditemukan di pipeline — pembayaran tidak dapat dibuat.')
      setConfirmOpen(false)
      return
    }
    if (liveCar.buyPrice <= 0) {
      setError('Harga Beli harus lebih dari 0. Simpan Harga Beli sebelum melanjutkan.')
      setConfirmOpen(false)
      return
    }
    if (priceDirty) {
      setError('Ada perubahan Harga Beli yang belum disimpan. Simpan Harga Beli terlebih dahulu.')
      setConfirmOpen(false)
      return
    }
    // Validate allocation amounts
    const s = settleAmount ?? 0
    const c = commAmount ?? 0
    if (s < 0 || c < 0) {
      setError('Nominal alokasi tidak boleh negatif.')
      setConfirmOpen(false)
      return
    }
    if (!Number.isFinite(s) || !Number.isFinite(c)) {
      setError('Nominal alokasi tidak valid.')
      setConfirmOpen(false)
      return
    }
    if (s + c !== liveCar.buyPrice) {
      setError(
        `Total alokasi (${s + c}) harus sama dengan Harga Beli (${liveCar.buyPrice}). Perbaiki nominal sebelum melanjutkan.`,
      )
      setConfirmOpen(false)
      return
    }
    if (c > 0 && !commRecipient.trim()) {
      setError('Penerima komisi wajib diisi saat nominal komisi > 0.')
      setConfirmOpen(false)
      return
    }
    if (!settleRecipient.trim() && s > 0) {
      setError('Penerima pembayaran wajib diisi saat nominal pembayaran > 0.')
      setConfirmOpen(false)
      return
    }
    setError(null)
    setConfirmOpen(true)
  }

  const doSubmit = () => {
    setConfirmOpen(false)
    if (!selectedSupplierIsValid()) return

    // Re-read the canonical car so totalAmount uses the latest saved buyPrice,
    // not the stale `car` snapshot from this render.
    const liveCar = getCar(car.key)
    if (!liveCar || !isValidPlate(liveCar.plate) || normalizePlate(plate) !== normalizePlate(liveCar.plate) || liveCar.buyPrice <= 0) {
      setError('Data unit tidak valid — pembayaran tidak dapat dibuat.')
      return
    }

    // Build allocation set (planned breakdown of gross buyPrice).
    const s = settleAmount ?? 0
    const c = commAmount ?? 0
    const finalRecipient = sameRecipient ? settleRecipient : commRecipient
    const allocations: PaymentAllocation[] = []
    if (s > 0) {
      allocations.push({ role: 'VEHICLE_SETTLEMENT', amount: s, recipient: settleRecipient.trim(), bank: supBank.trim(), accountNumber: supAcctNum.trim(), accountHolder: supAcctHolder.trim() })
    }
    if (c > 0) {
      allocations.push({ role: 'COMMISSION', amount: c, recipient: finalRecipient.trim(), bank: (sameRecipient ? supBank : commBank).trim(), accountNumber: (sameRecipient ? supAcctNum : commAccountNumber).trim(), accountHolder: (sameRecipient ? supAcctHolder : commAccountHolder).trim() })
    }

    const payment: CarPayment = {
      carKey: liveCar.key,
      paymentType: existing?.paymentType ?? 'Cash',
      commission: c,
      payments: existing?.payments ?? [],
      paymentCategory,
      ...(existing?.creditDetail ? { creditDetail: existing.creditDetail } : {}),
    }
    saveCarPayment(liveCar.key, payment)

    const result = createPaymentRequest({
      sourceType: 'PURCHASE_UNIT',
      sourceId: liveCar.key,
      title: `${liveCar.brand} ${liveCar.model} - ${liveCar.plate}`,
      vendor: supName.trim() || liveCar.supplier || '—',
      ...(partyType === 'Supplier' ? { supplierId } : {}),
      vendorType: partyType,
      totalAmount: liveCar.buyPrice,
      ...(allocations.length > 0 ? { allocations } : {}),
    })

    if (result) {
      saveSupplierDetail(liveCar.key, supplierSnapshot(), partyType === 'Supplier' ? supplierId : undefined, partyType)
      showToast(`${result.id} dibuat — tersedia di Management Pembayaran.`)
    } else {
      setError('Payment request tidak dapat dibuat. Payment request mungkin sudah ada untuk pembelian ini.')
    }
  }

  return (
    <div>
      {/* Header with back button */}
      <div className="mb-5 flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={onBack} icon={<ArrowLeft className="h-3 w-3" />}>
          Kembali ke Daftar
        </Button>
        <div>
          <p className="text-[15px] font-bold text-slate-900">Informasi Pembelian — {row.unit}</p>
          <p className="text-[12px] text-slate-400">
            Nopol: {car.plate || '-'} · ID Inspeksi: {row.inspection.code}
          </p>
        </div>
      </div>

      {toast && (
        <div className="mb-4 flex items-center gap-2 rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {toast}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] text-red-800">
          {error}
        </div>
      )}

      {/* Read-only canonical info */}
      <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-2 rounded-[10px] bg-slate-50 p-4 text-[12px] sm:grid-cols-4">
        <div><p className="text-[10px] font-semibold uppercase text-slate-400">Unit</p><p className="font-semibold text-slate-800">{row.unit}</p></div>
        <div><p className="text-[10px] font-semibold uppercase text-slate-400">Nopol</p><p className="font-mono font-semibold text-slate-800">{car.plate || '-'}</p></div>
        <div><p className="text-[10px] font-semibold uppercase text-slate-400">Customer</p><p className="font-semibold text-slate-800">{row.customer || '—'}</p></div>
        <div><p className="text-[10px] font-semibold uppercase text-slate-400">Tipe</p><p className="font-semibold text-slate-800">{row.car.transmission}</p></div>
        <div><p className="text-[10px] font-semibold uppercase text-slate-400">Tahun</p><p className="font-semibold text-slate-800">{row.car.year}</p></div>
        <div><p className="text-[10px] font-semibold uppercase text-slate-400">Schema Unit</p><p className="font-semibold text-slate-800">{row.car.schemaUnit}</p></div>
        <div><p className="text-[10px] font-semibold uppercase text-slate-400">Harga Awal</p><p className="font-semibold text-slate-600">{formatLeadPriceRange(car)}</p></div>
        <div><p className="text-[10px] font-semibold uppercase text-slate-400">Harga Beli</p><p className="font-semibold text-slate-800">{formatRupiah(car.buyPrice)}</p></div>
        <div><p className="text-[10px] font-semibold uppercase text-slate-400">Supplier</p><p className="font-semibold text-slate-800">{row.supplier ?? '—'}</p></div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {/* Section 1: Informasi Pembelian */}
          <SectionCard index={1} title="Informasi Pembelian" icon={FileText}
            action={
              priceDirty && !priceLocked ? (
                <Button variant="primary" size="sm" onClick={handleSavePrice}>
                  Simpan Harga
                </Button>
              ) : undefined
            }>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              <Field label="Purchase ID (Otomatis)">
                <input type="text" value={getPurchaseId(car.key) ?? ''} disabled
                  className={`${inputCls} bg-slate-50 font-mono`} />
              </Field>
              <Field label="Kategori Pembayaran">
                <select aria-label="Kategori Pembayaran" value={paymentCategory} onChange={(e) => setPaymentCategory(e.target.value)} className={selectCls}>
                  <option value="">Pilih kategori...</option>
                  {PAYMENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Harga Awal (Rp)">
                <input type="text" value={formatLeadPriceRange(car)} disabled
                  className={`${inputCls} bg-slate-50 text-slate-600`} />
              </Field>
              <Field label="Harga Beli (Rp)">
                {priceLocked ? (
                  <div className="flex items-center gap-1.5">
                    <input type="text" value={formatRupiah(car.buyPrice)} disabled
                      className={`${inputCls} bg-slate-50 font-semibold text-slate-800`} />
                    <span className="rounded-[4px] bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                      TERKUNCI
                    </span>
                  </div>
                ) : (
                  <RupiahInput
                    value={buyPrice}
                    onChange={setBuyPrice}
                    placeholder="0"
                    className={`${inputCls} font-semibold ${
                      priceDirty ? 'border-primary bg-primary/5' : 'bg-white'
                    }`}
                    ariaLabel="Harga beli"
                  />
                )}
              </Field>
            </div>
            {priceDirty && !priceLocked && (
              <p className="mt-2 text-[11px] font-medium text-amber-600">
                Harga Beli belum disimpan — gunakan tombol “Simpan Harga” agar tercatat ke unit.
              </p>
            )}
          </SectionCard>

          {/* Section 1b: Alokasi Pembayaran (planned breakdown of gross) */}
          {!existingPaymentRequest && (
            <SectionCard title="Alokasi Pembayaran" icon={Wallet}>
              <p className="mb-3 text-[11px] text-slate-400">
                Alokasi ini menggambarkan rincian penggunaan total gros Harga Beli.
                Total nominal tagihan tetap {formatRupiah(car.buyPrice)} — komisi tidak ditambahkan di atasnya.
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                <Field label="Pembayaran Kendaraan (Rp)">
                  <RupiahInput
                    value={settleAmount}
                    onChange={setSettleAmount}
                    placeholder="0"
                    className={inputCls}
                    ariaLabel="Pembayaran kendaraan"
                  />
                </Field>
                <Field label="Komisi (Rp)">
                  <RupiahInput
                    value={commAmount}
                    onChange={setCommAmount}
                    placeholder="0"
                    className={inputCls}
                    ariaLabel="Komisi"
                  />
                </Field>
                <Field label="Penerima Pembayaran">
                  <input
                    type="text"
                    value={settleRecipient}
                    onChange={(e) => { setSettleRecipient(e.target.value); if (sameRecipient) setCommRecipient(e.target.value) }}
                    className={inputCls}
                    placeholder="Nama / referensi penerima"
                  />
                </Field>
                <Field label="Penerima Komisi">
                  <div>
                    <input
                      type="text"
                      value={sameRecipient ? settleRecipient : commRecipient}
                      aria-label="Penerima Komisi"
                      disabled={sameRecipient}
                      onChange={(e) => setCommRecipient(e.target.value)}
                      className={`${inputCls} ${sameRecipient ? 'bg-slate-50 text-slate-500' : ''}`}
                      placeholder="Nama / referensi penerima komisi"
                    />
                    <label className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                      <input
                        type="checkbox"
                        checked={sameRecipient}
                        onChange={(e) => {
                          setSameRecipient(e.target.checked)
                          if (e.target.checked) setCommRecipient(settleRecipient)
                        }}
                        className="h-3.5 w-3.5 accent-primary"
                      />
                      Sama dengan penerima pembayaran
                    </label>
                  </div>
                </Field>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Bank Komisi"><input aria-label="Bank Komisi" value={sameRecipient ? supBank : commBank} disabled={sameRecipient} onChange={e => setCommBank(e.target.value)} className={inputCls} placeholder="Nama bank (opsional)" /></Field>
                <Field label="Nomor Rekening Komisi"><input aria-label="Nomor Rekening Komisi" type="text" inputMode="numeric" value={sameRecipient ? supAcctNum : commAccountNumber} disabled={sameRecipient} onChange={e => setCommAccountNumber(e.target.value)} className={inputCls} placeholder="Nomor rekening komisi" /></Field>
                <Field label="Atas Nama Rekening Komisi"><input aria-label="Atas Nama Rekening Komisi" value={sameRecipient ? supAcctHolder : commAccountHolder} disabled={sameRecipient} onChange={e => setCommAccountHolder(e.target.value)} className={inputCls} placeholder="Atas nama rekening komisi" /></Field>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">Jika sama dengan penerima pembayaran, rekening komisi mengikuti rekening penjual di bawah. Hapus centang untuk penerima dan rekening komisi yang berbeda.</p>
              {/* Live allocation check */}
              {(() => {
                const sVal = settleAmount ?? 0
                const cVal = commAmount ?? 0
                const sum = sVal + cVal
                const gross = car.buyPrice
                const match = sum === gross && gross > 0
                return (
                  <div className={`mt-3 rounded-[8px] px-3 py-2 text-[12px] ${
                    match ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    <span className="font-semibold">
                      Total alokasi: {formatRupiah(sum)}{' '}
                      {match
                        ? `= Harga Beli ✓`
                        : `(target: ${formatRupiah(gross)} — selisih ${formatRupiah(gross - sum)})`}
                    </span>
                  </div>
                )
              })()}
            </SectionCard>
          )}

          {/* Section 2: Data Unit (correction) */}
          <SectionCard index={2} title="Data Unit" icon={Car}
            action={
              <Button variant="secondary" size="sm" onClick={handleSaveCorrections}>
                Simpan Koreksi
              </Button>
            }>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              <Field label="Nopol *"><input aria-label="Nopol" required value={plate} onChange={(e) => setPlate(normalizePlate(e.target.value))} aria-invalid={!isValidPlate(plate)} aria-describedby="purchase-plate-help" placeholder="B2334TY" className={inputCls} /><p id="purchase-plate-help" className="mt-1 text-[11px] text-slate-500">Wajib diisi. {PLATE_FORMAT_MESSAGE}</p></Field>
              <Field label="Merek"><input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className={inputCls} /></Field>
              <Field label="Model"><input type="text" value={model} onChange={(e) => setModel(e.target.value)} className={inputCls} /></Field>
              <Field label="Tahun"><input type="text" value={year} onChange={(e) => setYear(e.target.value)} className={inputCls} /></Field>
              <Field label="Transmisi">
                <select value={transmission} onChange={(e) => setTransmission(e.target.value as PipelineCar['transmission'])} className={selectCls}>
                  <option value="Manual">Manual</option><option value="Otomatis">Otomatis</option><option value="EV">EV</option><option value="Hybrid">Hybrid</option>
                </select>
              </Field>
              <Field label="Kilometer"><input type="text" inputMode="numeric" value={mileage} onChange={(e) => setMileage(e.target.value)} className={inputCls} /></Field>
              <Field label="Schema Unit">
                <select value={schemaUnit} onChange={(e) => setSchemaUnit(e.target.value as SchemaUnit)} className={selectCls}>
                  {SCHEMA_UNITS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Warna"><input type="text" value={color} onChange={(e) => setColor(e.target.value)} className={inputCls} /></Field>
            </div>
          </SectionCard>

          {/* Section 3: Data Supplier */}
          <SectionCard index={3} title="Data Penjual" icon={Users}>
            <PartyTypeToggle label="Jenis Penjual" value={partyType} onChange={changePartyType} disabled={priceLocked} />
            <p className="mb-3 text-[12px] text-slate-500">Nama dari Leads/unit: {row.car.supplier ?? '—'}. Pilih supplier terdaftar untuk pembelian ini.</p>
            {partyType === 'Supplier' && <MasterSupplierPicker suppliers={suppliers} value={supplierId} disabled={priceLocked} onChange={selectSupplier} onCreate={addSupplier} onCreated={supplier => selectSupplier(supplier.id, supplier)} />}
            {partyType === 'Supplier' && <p className="mb-3 text-[12px] text-slate-500">Kode/ID Supplier: {supplierId || 'Belum dipilih'}</p>}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              <Field label={partyType === 'Supplier' ? 'Nama Supplier' : 'Nama Penjual'}><input aria-label={partyType === 'Supplier' ? 'Nama Supplier' : 'Nama Penjual'} type="text" value={supName} readOnly={partyType === 'Supplier' || priceLocked} onChange={event => { setSupName(event.target.value); setSettleRecipient(event.target.value); if (sameRecipient) setCommRecipient(event.target.value) }} className={inputCls} /></Field>
              <Field label="Telepon"><input aria-label="Telepon Supplier" type="text" value={supPhone} onChange={(e) => setSupPhone(e.target.value)} className={inputCls} /></Field>
              <Field label="Alamat / Kota"><input aria-label="Alamat Supplier" type="text" value={supAddress} onChange={(e) => setSupAddress(e.target.value)} className={inputCls} /></Field>
              <Field label="Bank"><input aria-label="Bank Supplier" type="text" value={supBank} onChange={(e) => setSupBank(e.target.value)} className={inputCls} /></Field>
              <Field label="No. Rekening"><input aria-label="Rekening Supplier" type="text" value={supAcctNum} onChange={(e) => setSupAcctNum(e.target.value)} className={inputCls} /></Field>
              <Field label="Atas Nama"><input aria-label="Atas Nama Supplier" type="text" value={supAcctHolder} onChange={(e) => setSupAcctHolder(e.target.value)} className={inputCls} /></Field>
              <Field label="Email"><input aria-label="Email Supplier" type="email" value={supEmail} onChange={(e) => setSupEmail(e.target.value)} className={inputCls} /></Field>
            </div>
            <Button variant="secondary" size="sm" className="mt-3" onClick={handleSaveSupplier}>Simpan Supplier</Button>
          </SectionCard>

          {/* Section 4: Dokumen Pembelian (KTP, KWITANSI, BASTK) */}
          <SectionCard index={4} title="Dokumen Pembelian" icon={FileCheck2}>
            <p className="mb-3 text-[11px] text-slate-400">
              Dokumen ini milik Purchase Admin — berbeda dari bukti pembayaran (akunting).
            </p>

            {(() => {
              const ALL_DOC_KEYS: PurchaseDocument['key'][] = ['KTP', 'KWITANSI', 'BASTK']
              const DOC_ICON = {
                KTP: Shield,
                KWITANSI: Receipt,
                BASTK: FileCheck,
              } as const
              // Ensure all 3 slots render even if purchaseDocuments doesn't have all of them
              const slots: PurchaseDocument[] = ALL_DOC_KEYS.map((k) => {
                const found = docs.find((d) => d.key === k)
                return found ?? { key: k, status: 'BELUM UPLOAD' as const }
              })

              return (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {slots.map((doc) => {
                    const Icon = DOC_ICON[doc.key]
                    const isUploaded = doc.status === 'TERUPLOAD'
                    return (
                      <div
                        key={doc.key}
                        className="rounded-[8px] border border-line bg-white px-3 py-3"
                      >
                        {/* Header row: icon + label + status badge */}
                        <div className="mb-2 flex items-center gap-2">
                          <Icon className="h-4 w-4 text-slate-400" />
                          <span className="text-[12px] font-semibold text-slate-800">{doc.key}</span>
                          <span
                            className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              isUploaded
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {isUploaded ? 'TERUPLOAD' : 'BELUM UPLOAD'}
                          </span>
                        </div>

                        {/* Uploaded file name */}
                        {isUploaded && doc.fileName && (
                          <p className="mb-2 truncate rounded-[6px] bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                            {doc.fileName}
                          </p>
                        )}

                        {/* Upload / Replace control — always visible, independent per slot */}
                        <label
                          htmlFor={`purchase-${doc.key.toLowerCase()}-${car.key}`}
                          className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                        >
                          <Upload className="h-3 w-3" />
                          {isUploaded ? 'GANTI FILE' : 'UPLOAD'}
                        </label>
                        <input
                          id={`purchase-${doc.key.toLowerCase()}-${car.key}`}
                          ref={docInputRefs[doc.key]}
                          type="file"
                          className="hidden"
                          onChange={handleDocUpload(doc.key)}
                        />
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </SectionCard>

          {/* Read-only payment summary; entry belongs to Management Pembayaran. */}
          {(() => {
            const entries = existingPaymentRequest ? getEntriesForRequest(existingPaymentRequest.id) : []
            const totalPaid = existingPaymentRequest ? sumPaymentEntries(entries) : (car.payment?.payments ?? []).reduce((sum, payment) => sum + payment.amount, 0)
            const total = existingPaymentRequest?.totalAmount ?? car.buyPrice
            const st = totalPaid === 0 ? 'BELUM DIBAYAR' : computePaymentStatus(total, totalPaid)
            const hasProof = entries.some((e) => e.proof)
            return (
              <div role="region" aria-label="Ringkasan Pembayaran" className="rounded-[10px] border border-line bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-[12px] font-semibold text-slate-700">Status Pembayaran</span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                    st === 'LUNAS' ? 'bg-emerald-50 text-emerald-700' :
                    st === 'BELUM LUNAS' ? 'bg-amber-50 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {st}
                  </span>
                  <span className="text-[13px] font-medium text-slate-700">
                    {formatRupiah(totalPaid)} / {formatRupiah(total)}
                  </span>
                  {hasProof && (
                    <span className="text-[11px] text-emerald-600">✓ Bukti pembayaran tersedia</span>
                  )}
                </div>
                <p className="mt-2 text-[12px] text-slate-600">Sisa pembayaran: <strong>{formatRupiah(total - totalPaid)}</strong></p>
                {totalPaid === 0 && <p className="mt-1 text-[12px] text-amber-700">Belum ada pembayaran.</p>}
                <p className="mt-1.5 text-[11px] text-slate-400">
                  {existingPaymentRequest ? `${existingPaymentRequest.id} · ${existingPaymentRequest.status}` : 'Request pembayaran belum dibuat.'}
                </p>
              </div>
            )
          })()}

          {/* SUBMIT / LANJUTKAN KE PEMBAYARAN */}
          {!existingPaymentRequest && (
            <div className="flex items-center gap-3">
              <Button variant="primary" icon={<ArrowRight className="h-4 w-4" />} onClick={handleRequestSubmit}>
                LANJUTKAN KE PEMBAYARAN
              </Button>
              <p className="text-[11px] text-slate-400">
                Membuat Payment Request → tersedia di Management Pembayaran.
              </p>
            </div>
          )}
          {existingPaymentRequest && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Badge tone="success">SUDAH DISUBMIT → {existingPaymentRequest.id}</Badge>
                <p className="text-[11px] text-slate-400">Vendor: {existingPaymentRequest.vendor}. Input dan bukti pembayaran tersedia di modul Proses Pembayaran.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar: summary */}
        <div className="space-y-4">
          <div className="rounded-[12px] border border-line bg-white p-5">
            <p className="mb-3 text-[13px] font-semibold text-slate-900">Ringkasan</p>
            <div className="mb-3 flex items-center gap-3">
              <img src={row.image} alt="" className="h-14 w-20 rounded-[8px] bg-slate-100 object-cover" />
              <div>
                <p className="text-[13px] font-bold text-slate-900">{row.unit}</p>
                <p className="font-mono text-[11px] text-slate-500">{car.plate || '-'}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-[12px]">
              <div className="flex justify-between"><span className="text-slate-500">Customer</span><span className="font-semibold text-slate-800">{row.customer || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Schema</span><span className="font-semibold text-slate-800">{row.car.schemaUnit}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Harga Awal</span><span className="font-semibold text-slate-600">{formatLeadPriceRange(car)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Harga Beli</span><span className="font-bold text-primary">{formatRupiah(car.buyPrice)}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation modal: price check before creating payment request */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Konfirmasi Harga Beli"
        subtitle={`${row.unit} · ${car.plate || '-'} · ${row.inspection.code}`}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setConfirmOpen(false)}>
              PERIKSA LAGI
            </Button>
            <Button variant="primary" size="sm" onClick={doSubmit}>
              YA, BUAT PAYMENT REQUEST
            </Button>
          </>
        }
      >
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-slate-500">Harga Awal (Estimasi Lead)</span>
            <span className="font-medium text-slate-700">{formatLeadPriceRange(car)}</span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-slate-500">Harga Negosiasi</span>
            <span className="font-medium text-slate-700">{formatRupiah(car.buyPrice)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between rounded-[8px] bg-slate-50 px-3 py-2.5">
            <span className="text-[12px] font-semibold text-slate-700">{car.expectedPriceMax === undefined ? 'Selisih' : 'Selisih dari estimasi minimum'}</span>
            <span className={`text-[13px] font-bold ${car.buyPrice <= car.expectedPrice ? 'text-emerald-600' : 'text-red-600'}`}>
              {car.buyPrice - car.expectedPrice >= 0 ? '+' : ''}{formatRupiah(car.buyPrice - car.expectedPrice)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2.5 text-[13px]">
            <span className="font-semibold text-slate-800">Nominal Payment Request (Gross)</span>
            <span className="font-bold text-primary">{formatRupiah(car.buyPrice)}</span>
          </div>
          {/* Allocation breakdown (if non-zero commission entered) */}
          {(commAmount ?? 0) > 0 && (
            <div className="mt-1 rounded-[8px] bg-slate-50 px-3 py-2 text-[11.5px] text-slate-600">
              <div className="flex items-center justify-between">
                <span>Pembayaran Kendaraan</span>
                <span className="font-semibold text-slate-800">{formatRupiah(settleAmount ?? 0)}</span>
              </div>
              <div className="mt-0.5 flex items-center justify-between">
                <span>Komisi</span>
                <span className="font-semibold text-slate-800">{formatRupiah(commAmount ?? 0)}</span>
              </div>
              {settleRecipient && (
                <p className="mt-1 text-[10.5px] text-slate-400">
                  Penerima pembayaran: {settleRecipient}
                  {(!sameRecipient && commRecipient) ? ` · Penerima komisi: ${commRecipient}` : ''}
                </p>
              )}
            </div>
          )}
          <p className="pt-1 text-[11px] text-slate-400">
            Kategori: {paymentCategory} · Payment request akan tersedia di Management Pembayaran untuk diproses akunting.
          </p>
        </div>
      </Modal>
    </div>
  )
}
