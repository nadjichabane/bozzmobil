import { useState } from 'react'
import {
  ArrowRight,
  Car,
  CheckCircle2,
  Circle,
  Eye,
  ListChecks,
  RotateCcw,
  Search,
  X,
} from 'lucide-react'
import { usePipeline, usePipelineByStage } from '../context/PipelineContext'
import type { PipelineCar, Stage } from '../data/pipeline'
import { formatRupiah } from '../data/sales'

type StepDef = {
  stage: Stage
  label: string
  desc: string
  color: string
  bgColor: string
  borderColor: string
  icon: typeof Car
}

const STEPS: StepDef[] = [
  {
    stage: 'lead',
    label: 'Lead Masuk',
    desc: 'Mobil datang — data customer, nopol, tahun, sumber diinput',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    icon: Search,
  },
  {
    stage: 'inspecting',
    label: 'Inspeksi',
    desc: 'Tim inspeksi cek fisik — checklist, foto, temuan',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    icon: ListChecks,
  },
  {
    stage: 'rejected',
    label: 'Ditolak',
    desc: 'Gagal inspeksi — unit tidak direkomendasikan untuk dibeli',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    icon: X,
  },
  {
    stage: 'purchasing',
    label: 'Pembelian',
    desc: 'Lulus inspeksi — admin input proses pembelian',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-300',
    icon: Car,
  },
  {
    stage: 'available',
    label: 'Unit Tersedia',
    desc: 'Pembelian selesai — unit masuk ke data stok, siap dijual',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-300',
    icon: Circle,
  },
  {
    stage: 'sold',
    label: 'Terjual',
    desc: 'Unit laku — masuk ke data penjualan, pipeline selesai',
    color: 'text-slate-800',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-300',
    icon: CheckCircle2,
  },
]

const FLOW: Stage[] = ['lead', 'inspecting', 'purchasing', 'available', 'sold']
const REJECT_PATH: Stage[] = ['lead', 'inspecting', 'rejected']

function stageIndex(stage: Stage): number {
  if (stage === 'rejected') return 2
  return FLOW.indexOf(stage)
}

export function PipelineSimulatorPage() {
  const { cars, advance, reset } = usePipeline()
  const [selected, setSelected] = useState<PipelineCar | null>(null)
  const [filterStage, setFilterStage] = useState<Stage | 'all'>('lead')
  const [query, setQuery] = useState('')

  const pool = usePipelineByStage(['lead', 'inspecting', 'purchasing', 'available', 'sold', 'rejected'])

  const filtered = pool.filter((c) => {
    if (filterStage !== 'all' && c.stage !== filterStage) return false
    if (!query) return true
    const q = query.toLowerCase()
    return (
      c.brand.toLowerCase().includes(q) ||
      c.model.toLowerCase().includes(q) ||
      c.customer.toLowerCase().includes(q) ||
      c.plate.toLowerCase().includes(q)
    )
  })

  const car = selected ?? filtered[0] ?? pool[0] ?? cars[0]

  const currentIdx = car ? stageIndex(car.stage) : 0
  const isRejectedPath = car?.stage === 'rejected'

  const doAdvance = (next: Stage) => {
    if (!car) return
    advance(car.key, next)
  }

  const stepCount = isRejectedPath ? REJECT_PATH.length : FLOW.length
  const stepStages = isRejectedPath ? REJECT_PATH : FLOW

  return (
    <div className="px-4 py-5 lg:px-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[15px] font-bold text-slate-900">Simulasi Pipeline</p>
          <p className="text-[12px] text-slate-400">
            Ikuti alur lengkap: Lead → Inspeksi → Pembelian → Stok → Penjualan
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-[8px] border border-line bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset Data
        </button>
      </div>

      {/* Step indicator */}
      <div className="mb-5 rounded-[12px] border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[13px] font-bold text-slate-800">
            {car ? `${car.brand} ${car.model} ${car.year} — ${car.plate}` : 'Pilih mobil'}
          </p>
          <div className="flex gap-3 text-[11px] text-slate-400">
            {STEPS.map((s) => (
              <div key={s.stage} className="flex items-center gap-1">
                <span
                  className={`h-2 w-2 rounded-full ${
                    car && stepStages.includes(s.stage) && stageIndex(car.stage) >= stageIndex(s.stage)
                      ? 'bg-primary'
                      : car && s.stage === 'rejected' && car.stage === 'rejected'
                        ? 'bg-red-400'
                        : 'bg-slate-200'
                  }`}
                />
                {s.label}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => {
            const isDone = car ? stageIndex(car.stage) > i && !(s.stage === 'rejected' && isRejectedPath) : false
            const isCurrent = car?.stage === s.stage
            const isRejected = s.stage === 'rejected' && car?.stage === 'rejected'
            return (
              <div key={s.stage} className="flex flex-1 items-center gap-1.5">
                <div
                  className={`flex flex-1 items-center gap-2 rounded-[8px] border px-3 py-2.5 ${
                    isCurrent || isRejected
                      ? isRejected
                        ? 'border-red-300 bg-red-50'
                        : s.borderColor + ' ' + s.bgColor
                      : isDone
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-line bg-white'
                  }`}
                >
                  <s.icon className={`h-4 w-4 shrink-0 ${isCurrent || isRejected ? s.color : isDone ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <div className="min-w-0">
                    <p className={`text-[11px] font-semibold ${isCurrent || isRejected ? s.color : isDone ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {s.label}
                    </p>
                    <p className="text-[10px] text-slate-400">{s.desc}</p>
                  </div>
                </div>
                {i < STEPS.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Main layout: car selector + actions + detail */}
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[280px_1fr_320px]">
        {/* Car selector */}
        <div className="rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="border-b border-line p-3">
            <p className="text-[11px] font-semibold text-slate-400">PILIH MOBIL</p>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari mobil / nopol / customer..."
              className="mt-2 h-8 w-full rounded-[6px] border border-line bg-white px-2.5 text-[12px] outline-none focus:border-primary"
            />
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value as Stage | 'all')}
              className="mt-2 h-8 w-full rounded-[6px] border border-line bg-white px-2 text-[12px] text-slate-600"
            >
              <option value="all">Semua Stage</option>
              {STEPS.map((s) => (
                <option key={s.stage} value={s.stage}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setSelected(c)}
                className={`flex w-full items-center gap-2.5 border-b border-line px-3 py-2.5 text-left transition ${
                  car?.key === c.key ? 'bg-primary/5' : 'hover:bg-slate-50'
                }`}
              >
                <img
                  src={c.image}
                  alt=""
                  className="h-9 w-14 shrink-0 rounded-[6px] bg-slate-100 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-slate-800">
                    {c.brand} {c.model} {c.year}
                  </p>
                  <p className="text-[10.5px] font-mono text-slate-400">{c.plate}</p>
                </div>
                <StagePill stage={c.stage} />
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-6 text-center text-[12px] text-slate-400">
                Tidak ada mobil yang cocok.
              </p>
            )}
          </div>
        </div>

        {/* Action panel */}
        {car && (
          <div className="rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="border-b border-line px-4 py-3">
              <p className="text-[11px] font-semibold text-slate-400">AKSI SIMULASI</p>
              <p className="text-[13px] font-bold text-slate-800">
                {car.brand} {car.model} {car.year} · {car.transmission}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <StagePill stage={car.stage} />
                <span className="text-[11px] text-slate-400">
                  {formatRupiah(car.buyPrice)} → {formatRupiah(car.sellPrice)}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 p-4">
              {car.stage === 'lead' && (
                <ActionBtn
                  label="Jadwalkan Inspeksi"
                  desc="Unit masuk ke antrian tim inspeksi"
                  onClick={() => doAdvance('inspecting')}
                  color="amber"
                />
              )}

              {car.stage === 'inspecting' && (
                <>
                  <ActionBtn
                    label="Lulus Inspeksi — Masuk Pembelian"
                    desc="Unit direkomendasikan, admin input pembelian"
                    onClick={() => doAdvance('purchasing')}
                    color="indigo"
                  />
                  <ActionBtn
                    label="Tolak Unit — Gagal Inspeksi"
                    desc="Biaya perbaikan melebihi nilai jual"
                    onClick={() => doAdvance('rejected')}
                    color="red"
                  />
                </>
              )}

              {car.stage === 'purchasing' && (
                <ActionBtn
                  label="Selesaikan Pembelian — Masuk Stok"
                  desc="Pembayaran supplier selesai, unit masuk ke Master Unit"
                  onClick={() => doAdvance('available')}
                  color="emerald"
                />
              )}

              {car.stage === 'available' && (
                <ActionBtn
                  label="Tandai Terjual"
                  desc="Unit laku, masuk ke Data Penjualan"
                  onClick={() => doAdvance('sold')}
                  color="slate"
                />
              )}

              {car.stage === 'rejected' && (
                <div className="rounded-[8px] bg-red-50 p-3 text-[12px] text-red-700">
                  <p className="font-semibold">Unit Ditolak</p>
                  <p className="mt-0.5 text-[11px] text-red-500">
                    Tidak masuk ke pembelian. Tidak ada aksi lanjutan.
                  </p>
                </div>
              )}

              {car.stage === 'sold' && (
                <div className="rounded-[8px] bg-emerald-50 p-3 text-[12px] text-emerald-700">
                  <p className="font-semibold">Pipeline Selesai</p>
                  <p className="mt-0.5 text-[11px] text-emerald-500">
                    Unit terjual. Margin: {formatRupiah(car.sellPrice - car.buyPrice)}
                  </p>
                </div>
              )}

              <div className="border-t border-line pt-3">
                <p className="mb-2 text-[11px] font-semibold text-slate-400">PROGRESS</p>
                <div className="flex items-center gap-1">
                  {Array.from({ length: stepCount }).map((_, i) => {
                    const done = currentIdx > i || (i === 2 && isRejectedPath)
                    const current = i === currentIdx && !isRejectedPath
                    const rejectCurrent = i === 2 && isRejectedPath
                    return (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded-full ${
                          done ? 'bg-emerald-400' : current || rejectCurrent ? 'bg-primary' : 'bg-slate-200'
                        }`}
                      />
                    )
                  })}
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400">
                  {isRejectedPath
                    ? 'Ditolak di tahap inspeksi — pipeline tidak berlanjut'
                    : `${Math.min(currentIdx + 1, stepCount)} / ${stepCount} langkah selesai`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Detail panel */}
        {car && (
          <div className="rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="border-b border-line px-4 py-3">
              <p className="text-[11px] font-semibold text-slate-400">DETAIL UNIT</p>
            </div>
            <div className="space-y-2.5 p-4 text-[12.5px]">
              <DetailRow label="Nopol" value={car.plate} mono />
              <DetailRow label="Tahun" value={String(car.year)} />
              <DetailRow label="Kilometer" value={`${car.mileage.toLocaleString('id-ID')} km`} />
              <DetailRow label="Transmisi" value={car.transmission} />
              <DetailRow label="Warna" value={car.color} />
              <DetailRow label="Sumber" value={car.source} />
              <DetailRow label="Customer" value={car.customer} />
              <DetailRow label="No. HP" value={car.phone} mono />
              <DetailRow label="Harga Estimasi" value={formatRupiah(car.expectedPrice)} />
              <DetailRow label="Harga Beli" value={car.buyPrice ? formatRupiah(car.buyPrice) : '—'} />
              <DetailRow label="Harga Jual" value={car.sellPrice ? formatRupiah(car.sellPrice) : '—'} />
              {car.stage === 'sold' && (
                <div className="rounded-[6px] bg-emerald-50 p-2.5">
                  <p className="text-[11px] font-semibold text-emerald-700">MARGIN</p>
                  <p className="text-[14px] font-bold text-emerald-700">
                    {formatRupiah(car.sellPrice - car.buyPrice)}
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={() => window.location.hash = '#/leads'}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-[8px] border border-line bg-white px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
              >
                <Eye className="h-3.5 w-3.5" /> Lihat di Leads
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StagePill({ stage }: { stage: Stage }) {
  const map: Record<Stage, string> = {
    lead: 'bg-blue-50 text-blue-700',
    inspecting: 'bg-amber-50 text-amber-700',
    rejected: 'bg-red-50 text-red-700',
    purchasing: 'bg-indigo-50 text-indigo-700',
    available: 'bg-emerald-50 text-emerald-700',
    sold: 'bg-slate-100 text-slate-700',
  }
  const label: Record<Stage, string> = {
    lead: 'Lead',
    inspecting: 'Inspeksi',
    rejected: 'Ditolak',
    purchasing: 'Pembelian',
    available: 'Tersedia',
    sold: 'Terjual',
  }
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${map[stage]}`}>
      {label[stage]}
    </span>
  )
}

function ActionBtn({
  label,
  desc,
  onClick,
  color,
}: {
  label: string
  desc: string
  onClick: () => void
  color: 'amber' | 'indigo' | 'emerald' | 'red' | 'slate'
}) {
  const map = {
    amber: 'bg-amber-500 hover:bg-amber-600',
    indigo: 'bg-indigo-500 hover:bg-indigo-600',
    emerald: 'bg-emerald-500 hover:bg-emerald-600',
    red: 'bg-red-500 hover:bg-red-600',
    slate: 'bg-slate-700 hover:bg-slate-800',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-[8px] px-4 py-3 text-left text-white shadow-[0_1px_2px_rgba(0,0,0,0.15)] transition ${map[color]}`}
    >
      <div className="flex-1">
        <p className="text-[13px] font-semibold">{label}</p>
        <p className="text-[11px] opacity-80">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0" />
    </button>
  )
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="shrink-0 text-slate-400">{label}</span>
      <span className={`text-right text-slate-700 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}
