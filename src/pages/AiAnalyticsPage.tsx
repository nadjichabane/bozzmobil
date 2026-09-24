import { Sparkles, TrendingUp, TrendingDown, ArrowUpRight, Clock, Target } from 'lucide-react'
import { useState } from 'react'
import { SALES } from '../data/sales'

const SALES_TREND = [
  { week: 'Mg 1', actual: 5, predicted: 4.5 },
  { week: 'Mg 2', actual: 7, predicted: 6 },
  { week: 'Mg 3', actual: 8, predicted: 7.5 },
  { week: 'Mg 4', actual: 8, predicted: 8 },
]

const FORECAST = [
  { month: 'Sep', predicted: 32, confidence: 87 },
  { month: 'Okt', predicted: 35, confidence: 72 },
  { month: 'Nov', predicted: 30, confidence: 58 },
  { month: 'Des', predicted: 42, confidence: 45 },
]

const INSIGHTS = [
  { type: 'tip', text: 'Unit Toyota Fortuner VRZ (B 1355 NJK) telah 45 hari di stok. Pertimbangkan diskon 3% untuk percepatan penjualan.' },
  { type: 'success', text: 'Rudi Hartono menunjukkan performa konsisten tertinggi. Pertimbangkan insentif tambahan untuk target 12 unit/bulan.' },
  { type: 'alert', text: 'Stok 5 unit dengan umur >30 hari. Rata-rata margin turun 1.5% per minggu jika tidak terjual.' },
  { type: 'tip', text: 'Permintaan Honda Brio dan Toyota Agya meningkat 22%. Disarankan menambah stok city car.' },
]

export function AiAnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('Agustus 2026')
  const currentSales = SALES.length
  const targetSales = 35

  return (
    <div className="px-4 py-5 lg:px-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[15px] font-bold text-slate-900">AI Analytics</p>
          <p className="text-[12px] text-slate-400">Insight prediktif performa penjualan</p>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="h-[38px] rounded-[8px] border border-line bg-white px-3 text-[13px] text-slate-700">
            <option>Agustus 2026</option>
            <option>Q3 2026</option>
            <option>Tahun 2026</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Predicted Next Month', value: '32 Unit', icon: Target, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+14%' },
          { label: 'Confidence Score', value: '87%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+3.2%' },
          { label: 'Recommended Price Cut', value: '-3%', icon: TrendingDown, color: 'text-amber-600', bg: 'bg-amber-50', trend: 'Fortuner' },
          { label: 'Overdue Stock Risk', value: '5 Unit', icon: Clock, color: 'text-red-600', bg: 'bg-red-50', trend: '> 30 days' },
        ].map((card) => (
          <div key={card.label} className={`rounded-[12px] border border-line bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]`}>
            <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-full ${card.bg}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <p className="text-[10px] font-semibold tracking-wider text-slate-400">{card.label}</p>
            <p className={`mt-1 text-[18px] font-bold ${card.color}`}>{card.value}</p>
            <p className="mt-1 text-[10px] text-slate-400">{card.trend}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-[12px] border border-line bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-slate-900">Penjualan Aktual vs Prediksi</p>
              <p className="text-[11px] text-slate-400">4 minggu terakhir</p>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Aktual</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-300" /> Prediksi</span>
            </div>
          </div>
          <div className="flex items-end justify-around gap-3">
            {SALES_TREND.map((d) => (
              <div key={d.week} className="flex flex-col items-center gap-1.5 flex-1">
                <span className="text-[10px] text-slate-500">{d.actual} unit</span>
                <div className="flex items-end gap-1 h-28">
                  <div className="w-5 rounded-t bg-primary" style={{ height: `${(d.actual / 10) * 100}%` }} />
                  <div className="w-5 rounded-t bg-slate-300" style={{ height: `${(d.predicted / 10) * 100}%` }} />
                </div>
                <span className="text-[11px] text-slate-500">{d.week}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[12px] border border-line bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="mb-4 text-[13px] font-semibold text-slate-900">Forecast 4 Bulan</p>
          <div className="space-y-3">
            {FORECAST.map((f) => (
              <div key={f.month} className="flex items-center gap-3">
                <span className="text-[12px] font-medium text-slate-700 w-8">{f.month}</span>
                <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(f.predicted / 45) * 100}%` }} />
                </div>
                <span className="text-[12px] font-semibold text-slate-900 w-12 text-right">{f.predicted}</span>
                <span className="text-[10px] text-slate-400 w-8 text-right">{f.confidence}%</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-[8px] bg-blue-50 p-3">
            <div className="flex items-center gap-1.5">
              <ArrowUpRight className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-[11px] font-medium text-blue-700">Target bulan depan: 35 unit</span>
            </div>
            <p className="mt-1 text-[11px] text-blue-600">Kesenjangan: {targetSales - currentSales} unit lagi diperlukan</p>
          </div>
        </div>
      </div>

      <div className="rounded-[12px] border border-line bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <p className="text-[13px] font-semibold text-slate-900">AI Insights & Rekomendasi</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {INSIGHTS.map((insight, i) => {
            const colors = {
              tip: 'border-l-amber-400 bg-amber-50',
              success: 'border-l-emerald-400 bg-emerald-50',
              alert: 'border-l-red-400 bg-red-50',
            }
            const icons = {
              tip: '💡',
              success: '✅',
              alert: '⚠️',
            }
            return (
              <div key={i} className={`rounded-[8px] border-l-4 px-4 py-3 ${colors[insight.type as keyof typeof colors]}`}>
                <div className="flex items-start gap-2">
                  <span className="text-lg">{icons[insight.type as keyof typeof icons]}</span>
                  <p className="text-[12.5px] text-slate-700 leading-relaxed">{insight.text}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
