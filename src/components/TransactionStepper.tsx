import { Check } from 'lucide-react'

const STEPS = ['Input Penjualan', 'Administrasi', 'Pembayaran', 'Dokumen', 'Serah Terima', 'Selesai']

type TransactionStepperProps = {
  currentStep: number
}

export function TransactionStepper({ currentStep }: TransactionStepperProps) {
  const progress = Math.round(((currentStep + 1) / STEPS.length) * 100)

  return (
    <div className="rounded-[12px] border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[13px] font-semibold text-slate-900">Status Proses Transaksi</p>
        <span className="text-[12px] font-semibold text-primary">Progress {progress}%</span>
      </div>
      <div className="flex items-start">
        {STEPS.map((step, i) => {
          const done = i < currentStep
          const active = i === currentStep
          return (
            <div key={step} className="flex flex-1 items-start last:flex-none">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold ${
                    done
                      ? 'bg-emerald-500 text-white'
                      : active
                        ? 'bg-primary text-white ring-4 ring-primary/15'
                        : 'border-2 border-line bg-white text-slate-400'
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span
                  className={`mt-2 max-w-[80px] text-center text-[10.5px] leading-tight ${
                    active ? 'font-semibold text-primary' : done ? 'font-medium text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  {step}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`mx-2 mt-[15px] h-0.5 flex-1 rounded-full ${i < currentStep ? 'bg-emerald-400' : 'bg-line'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
