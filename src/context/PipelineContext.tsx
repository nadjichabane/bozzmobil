import { createContext, useContext, useState, type ReactNode } from 'react'
import { PIPELINE, type PipelineCar, type Stage } from '../data/pipeline'

/**
 * Pipeline terpusat — satu source of truth untuk semua modul.
 * Setiap transisi stage memicu update state global;
 * UI di seluruh halaman reaktif ke perubahan ini.
 */
type PipelineState = {
  cars: PipelineCar[]
  /** Ganti stage satu mobil (transisi pipeline) */
  advance: (key: string, next: Stage) => void
  /** Tambah mobil baru ke pipeline (stage 'lead') */
  addCar: (car: Omit<PipelineCar, 'key'> & { key: string }) => void
  /** Hapus mobil dari pipeline */
  removeCar: (key: string) => void
  /** Reset ke data awal */
  reset: () => void
  /** Cari mobil berdasarkan key */
  getCar: (key: string) => PipelineCar | undefined
}

const PipelineCtx = createContext<PipelineState | null>(null)

export function PipelineProvider({ children }: { children: ReactNode }) {
  const [cars, setCars] = useState<PipelineCar[]>(PIPELINE)

  const advance: PipelineState['advance'] = (key, next) =>
    setCars((prev) => prev.map((c) => (c.key === key ? { ...c, stage: next } : c)))

  const addCar: PipelineState['addCar'] = (car) =>
    setCars((prev) => [car, ...prev])

  const removeCar: PipelineState['removeCar'] = (key) =>
    setCars((prev) => prev.filter((c) => c.key !== key))

  const reset = () => setCars(PIPELINE)
  const getCar = (key: string) => cars.find((c) => c.key === key)

  return (
    <PipelineCtx.Provider value={{ cars, advance, addCar, removeCar, reset, getCar }}>
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
