import { Play } from 'lucide-react'
import { useState } from 'react'
import { MIGRATION_BATCHES, type MigrationBatch } from '../data/migration'

const STATUS_BADGE: Record<MigrationBatch['status'], string> = {
  Selesai: 'bg-emerald-50 text-emerald-700',
  Berjalan: 'bg-blue-50 text-blue-700',
  Antrian: 'bg-slate-100 text-slate-500',
  Gagal: 'bg-red-50 text-red-700',
}

const SOURCE_BADGE: Record<MigrationBatch['source'], string> = {
  'Analytics Bozzmobil': 'bg-blue-50 text-blue-700',
  'Spreadsheet Excel': 'bg-slate-100 text-slate-500',
}

const mappingPct = (fieldMapping: string) => {
  const [done, total] = fieldMapping.split('/').map((n) => parseInt(n, 10))
  if (!total) return 0
  return Math.round((done / total) * 100)
}

export function MigrasiPage() {
  const [batches] = useState<MigrationBatch[]>(MIGRATION_BATCHES)

  const totalBatch = batches.length
  const selesaiCount = batches.filter((b) => b.status === 'Selesai').length
  const totalMapped = batches.reduce((s, b) => s + b.mappedRows, 0)
  const avgMapping = Math.round(batches.reduce((s, b) => s + mappingPct(b.fieldMapping), 0) / batches.length)

  return (
    <div className="px-4 py-5 lg:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[15px] font-bold text-slate-900">Migrasi &amp; Integrasi Data</p>
          <p className="text-[12px] text-slate-400">{batches.length} batch migrasi dari aplikasi lama &amp; spreadsheet</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,110,253,0.35)] hover:bg-primary-hover">
          <Play className="h-4 w-4" /> Jalankan Migrasi
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-slate-400">TOTAL BATCH</p>
          <p className="mt-1 text-[20px] font-bold text-slate-900">{totalBatch}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-emerald-600">SELESAI</p>
          <p className="mt-1 text-[20px] font-bold text-emerald-600">{selesaiCount}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-slate-400">DATA DIPETAIKAN</p>
          <p className="mt-1 text-[20px] font-bold text-slate-900">{totalMapped.toLocaleString('id-ID')}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[10px] font-semibold tracking-wider text-slate-400">FIELD MAPPING</p>
          <p className="mt-1 text-[20px] font-bold text-slate-900">{avgMapping}%</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="inline-flex items-center gap-2 rounded-[10px] border border-line bg-white px-3 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-[12px] font-semibold text-slate-700">Analytics Bozzmobil</span>
          <span className="text-[11px] text-slate-400">{batches.filter((b) => b.source === 'Analytics Bozzmobil').length} sumber</span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-[10px] border border-line bg-white px-3 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <span className="h-2 w-2 rounded-full bg-slate-400" />
          <span className="text-[12px] font-semibold text-slate-700">Spreadsheet Excel</span>
          <span className="text-[11px] text-slate-400">{batches.filter((b) => b.source === 'Spreadsheet Excel').length} sumber</span>
        </div>
      </div>

      <div className="rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {['Sumber', 'Dataset', 'Baris', 'Gagal', 'Field Mapping', 'Status', 'Terakhir Dijalankan'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => {
                const pct = mappingPct(b.fieldMapping)
                return (
                  <tr key={b.id} className="h-[60px] border-b border-line last:border-0 hover:bg-slate-50">
                    <td className="px-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${SOURCE_BADGE[b.source]}`}>{b.source}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 text-[13px] font-semibold text-slate-900">{b.dataset}</td>
                    <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{b.mappedRows.toLocaleString('id-ID')}/{b.totalRows.toLocaleString('id-ID')}</td>
                    <td className="whitespace-nowrap px-4">
                      <span className={`text-[13px] font-semibold ${b.failedRows > 0 ? 'text-red-500' : 'text-slate-400'}`}>{b.failedRows}</span>
                    </td>
                    <td className="px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 bg-slate-100 rounded">
                          <div className="h-1.5 bg-primary rounded" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] text-slate-500">{b.fieldMapping}</span>
                      </div>
                    </td>
                    <td className="px-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_BADGE[b.status]}`}>{b.status}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 text-[13px] text-slate-600">{b.lastRun}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
