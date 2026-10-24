import { useEffect, useRef } from 'react'
import type { ProofMeta } from '../data/payments'
import { formatRupiah } from '../data/sales'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'

export type ProofReviewItem = { key: string; label: string; amount: number; recipient: string; proof: ProofMeta | null; paymentCategory?: string; bank?: string; accountNumber?: string; accountHolder?: string }
export function PaymentProofReview({ items, onCancel, onConfirm }: { items: ProofReviewItem[]; onCancel: () => void; onConfirm: () => void }) {
  const content = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null
    content.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
    return () => before?.focus()
  }, [])
  const missing = items.some(item => !item.proof)
  return <Modal open onClose={onCancel} title="Konfirmasi bukti pembayaran" dialogLabel="Konfirmasi bukti pembayaran" size="lg">
    <div ref={content} onKeyDown={event => {
      if (event.key !== 'Tab') return
      const buttons = content.current?.querySelectorAll<HTMLElement>('button, a[href], iframe')
      if (!buttons?.length) return
      const first = buttons[0], last = buttons[buttons.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }}>
      <p className="mb-3 rounded-lg bg-blue-50 p-3 text-[13px] text-blue-900">Periksa kembali nominal, penerima dan bukti bayar. Bukti bayar sudah benar?</p>
      {missing && <p role="alert" className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-[13px] font-semibold text-amber-900">Lanjutkan tanpa bukti bayar? Kolom yang belum memiliki bukti ditandai di bawah.</p>}
      <div className="space-y-3">
        {items.map(item => <section key={item.key} className="rounded-lg border border-slate-200 p-3">
          <p className="text-[13px] font-bold">{item.label} · {formatRupiah(item.amount)}</p>
          <p className="mt-1 text-[12px] text-slate-600">Penerima: {item.recipient || 'Belum diisi'}</p>
          {item.paymentCategory && <p className="mt-1 text-[12px] text-slate-600">Kategori: {item.paymentCategory}</p>}
          {(item.accountNumber || item.accountHolder || item.bank) && <p className="mt-1 break-words text-[12px] text-slate-600">Rekening: {item.bank || '-'} / {item.accountNumber || '-'} / a.n. {item.accountHolder || '-'}</p>}
          {!item.proof ? <p className="mt-2 font-semibold text-amber-800">Belum ada bukti bayar.</p> : <>
            <p className="my-2 break-words text-[12px] text-slate-700">{item.proof.name}</p>
            {item.proof.type.startsWith('image/') ? <img src={item.proof.objectUrl} alt={item.proof.name} className="max-h-[300px] w-full rounded-lg bg-slate-50 object-contain" /> :
              item.proof.type === 'application/pdf' ? <iframe src={item.proof.objectUrl} title={'Preview bukti ' + item.proof.name} className="h-[320px] w-full rounded-lg border border-slate-200" /> : <p className="text-[12px] text-slate-600">Preview tidak tersedia untuk tipe berkas ini.</p>}
            <a href={item.proof.objectUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[12px] font-semibold text-blue-700 underline">Buka bukti {item.proof.name}</a>
          </>}
        </section>)}
      </div>
      <div className="sticky bottom-0 mt-4 flex justify-end gap-2 border-t border-slate-200 bg-white py-3">
        <Button variant="secondary" onClick={onCancel}>Batal</Button>
        <Button variant="primary" onClick={onConfirm}>Ya, lanjutkan</Button>
      </div>
    </div>
  </Modal>
}
