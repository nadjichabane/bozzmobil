import { createContext, useContext, useState, type ReactNode } from 'react'
import { PIPELINE, type PipelineCar, type Stage } from '../data/pipeline'

/**
 * Pipeline terpusat — satu source of truth untuk semua modul.
 * Setiap transisi stage memicu update state global;
 * UI di seluruh halaman reaktif ke perubahan ini.
 */

// Aturan transisi sah (lifecycle arsitektur):
// Lead -> Inspeksi -> Lulus/Tolak -> Pembelian -> Stok (NOT READY/qc) -> READY(available) -> Terjual
// Unit yang belum READY (stage 'qc', NOT READY) tidak boleh langsung dijual.
const ALLOWED_TRANSITIONS: Record<Stage, Stage[]> = {
  lead: ['inspecting'],
  inspecting: ['purchasing', 'rejected'],
  rejected: [],
  purchasing: ['qc'],
  qc: ['available'],
  available: ['sold'],
  sold: [],
}

export function canTransition(from: Stage, to: Stage): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

type PipelineState = {
  cars: PipelineCar[]
  /** Ganti stage satu mobil (transisi pipeline), hanya bila transisinya sah */
  advance: (key: string, next: Stage) => boolean
  /** Tambah mobil baru ke pipeline (stage 'lead') */
  addCar: (car: Omit<PipelineCar, 'key'> & { key: string }) => void
  /** Hapus mobil dari pipeline */
  removeCar: (key: string) => void
  /** Reset ke data awal */
  reset: () => void
  /** Cari mobil berdasarkan key */
  getCar: (key: string) => PipelineCar | undefined
  /** Tandai BAST selesai untuk unit yang sudah 'sold'. Tidak mengubah stage. */
  markBast: (key: string) => boolean
}

const PipelineCtx = createContext<PipelineState | null>(null)

export function PipelineProvider({ children }: { children: ReactNode }) {
  const [cars, setCars] = useState<PipelineCar[]>(PIPELINE)

  const advance: PipelineState['advance'] = (key, next) => {
    const car = cars.find((c) => c.key === key)
    if (!car || !canTransition(car.stage, next)) return false
    setCars((prev) => prev.map((c) => (c.key === key ? { ...c, stage: next } : c)))
    return true
  }

  const addCar: PipelineState['addCar'] = (car) =>
    setCars((prev) => [car, ...prev])

  const removeCar: PipelineState['removeCar'] = (key) =>
    setCars((prev) => prev.filter((c) => c.key !== key))

  const reset = () => setCars(PIPELINE)
  const getCar = (key: string) => cars.find((c) => c.key === key)

  const markBast: PipelineState['markBast'] = (key) => {
    const car = cars.find((c) => c.key === key)
    if (!car || car.stage !== 'sold' || car.bastCompleted) return false
    setCars((prev) => prev.map((c) => (c.key === key ? { ...c, bastCompleted: true } : c)))
    return true
  }

  return (
    <PipelineCtx.Provider value={{ cars, advance, addCar, removeCar, reset, getCar, markBast }}>
      {children}
    </PipelineCtx.Provider>
  )
}

export function usePipeline() {
  const ctx = useContext(PipelineCtx)
  if (!ctx) throw new Error('usePipeline harus di dalam PipelineProvider')
  return ctx
}

/** Hook turunan: filter berdasarkan stage */
export function usePipelineByStage(stage: Stage | Stage[]) {
  const { cars } = usePipeline()
  const stages = Array.isArray(stage) ? stage : [stage]
  return cars.filter((c) => stages.includes(c.stage))
}
