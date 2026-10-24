// @vitest-environment jsdom
import { useLayoutEffect } from 'react'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { PipelineProvider, usePipeline } from '../context/PipelineContext'
import { ProsesPembayaranPage } from '../pages/ProsesPembayaranPage'
import { PIPELINE, INITIAL_INSPECTIONS } from '../data/pipeline'
let api: ReturnType<typeof usePipeline>
function Probe() { const context = usePipeline(); useLayoutEffect(() => { api = context }, [context]); return null }
const car = {...PIPELINE[0],key:'proof-review',stage:'purchasing' as const,plate:'B1234TY',buyPrice:100}
const inspection = {...INITIAL_INSPECTIONS.find(i => i.decision === 'lulus')!,carKey:car.key}
beforeEach(() => { const Original = URL; vi.stubGlobal('URL', class extends Original { static createObjectURL(file: Blob) { return 'blob:proof-' + file.type } static revokeObjectURL() {} }) })
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
function mount(allocated = true) {
  const props = {initialCars:[car],initialInspections:[inspection]}
  const view = render(<PipelineProvider {...props}><Probe /></PipelineProvider>)
  act(() => {
    const req = api.createPaymentRequest({sourceType:'PURCHASE_UNIT',sourceId:car.key,title:'Pembelian test',vendor:'Supplier',totalAmount:100,
      ...(allocated ? {allocations:[{role:'VEHICLE_SETTLEMENT' as const,amount:80,recipient:'Supplier'},{role:'COMMISSION' as const,amount:20,recipient:'Broker'}]} : {})})!
    api.verifyPaymentRequestAmount(req.id)
  })
  view.rerender(<PipelineProvider {...props}><Probe /><ProsesPembayaranPage /></PipelineProvider>)
  fireEvent.click(screen.getByRole('button',{name:'PROSES'}))
  return view
}
it('warns for missing proofs, preserves drafts on cancel, and commits only after confirmation', () => {
  mount()
  fireEvent.click(screen.getByRole('button',{name:'PROSES PEMBAYARAN'}))
  expect(api.paymentEntries).toHaveLength(0)
  const review = within(screen.getByRole('dialog',{name:'Konfirmasi bukti pembayaran'}))
  expect(review.getByText(/Lanjutkan tanpa bukti bayar/)).toBeTruthy()
  fireEvent.click(review.getByRole('button',{name:'Batal'}))
  expect(api.paymentEntries).toHaveLength(0)
  expect((screen.getByLabelText('Nominal Pembayaran Unit') as HTMLInputElement).value).toBe('80')
  fireEvent.click(screen.getByRole('button',{name:'PROSES PEMBAYARAN'}))
  fireEvent.click(screen.getByRole('button',{name:'Ya, lanjutkan'}))
  expect(api.paymentEntries).toHaveLength(2)
  expect(api.paymentEntries.reduce((sum,e) => sum+e.amount,0)).toBe(100)
  fireEvent.click(screen.getByRole('button',{name:'PROSES PEMBAYARAN'}))
  expect(api.paymentEntries).toHaveLength(2)
})
it('previews image and PDF proof for each pending payment before committing', () => {
  const view = mount()
  const files = view.container.querySelectorAll<HTMLInputElement>('input[type="file"]')
  fireEvent.change(files[0],{target:{files:[new File(['image'],'transfer.png',{type:'image/png'})]}})
  fireEvent.change(files[1],{target:{files:[new File(['pdf'],'komisi.pdf',{type:'application/pdf'})]}})
  fireEvent.click(screen.getByRole('button',{name:'PROSES PEMBAYARAN'}))
  const review = within(screen.getByRole('dialog',{name:'Konfirmasi bukti pembayaran'}))
  expect(review.getByRole('img',{name:'transfer.png'})).toBeTruthy()
  expect(review.getByTitle('Preview bukti komisi.pdf')).toBeTruthy()
  expect(api.paymentEntries).toHaveLength(0)
  fireEvent.click(review.getByRole('button',{name:'Ya, lanjutkan'}))
  expect(api.paymentEntries.map(e=>e.proof?.name)).toEqual(['transfer.png','komisi.pdf'])
})
it('requires a new review when a draft changes while the review is open', () => {
  mount()
  fireEvent.click(screen.getByRole('button',{name:'PROSES PEMBAYARAN'}))
  fireEvent.change(screen.getByLabelText('Nominal Pembayaran Unit'),{target:{value:'50'}})
  fireEvent.click(screen.getByRole('button',{name:'Ya, lanjutkan'}))
  expect(api.paymentEntries).toHaveLength(0)
  expect(screen.getByRole('dialog',{name:'Konfirmasi bukti pembayaran'})).toBeTruthy()
})
it('also reviews legacy single payments before saving', () => {
  mount(false)
  fireEvent.change(screen.getByLabelText('Nominal pembayaran'),{target:{value:'50'}})
  fireEvent.click(screen.getByRole('button',{name:'Tambah Pembayaran'}))
  expect(api.paymentEntries).toHaveLength(0)
  expect(screen.getByRole('dialog',{name:'Konfirmasi bukti pembayaran'})).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:'Ya, lanjutkan'}))
  expect(api.paymentEntries).toHaveLength(1)
})
it('shows both the preview and missing-proof warning for a mixed batch and preserves the file on cancel', () => {
  const view = mount()
  fireEvent.change(view.container.querySelector<HTMLInputElement>('input[type="file"]')!, {target:{files:[new File(['image'],'unit.png',{type:'image/png'})]}})
  fireEvent.click(screen.getByRole('button',{name:'PROSES PEMBAYARAN'}))
  const review = within(screen.getByRole('dialog',{name:'Konfirmasi bukti pembayaran'}))
  expect(review.getByRole('img',{name:'unit.png'})).toBeTruthy()
  expect(review.getByText('Belum ada bukti bayar.')).toBeTruthy()
  fireEvent.click(review.getByRole('button',{name:'Batal'}))
  expect(screen.getByText('unit.png')).toBeTruthy()
  expect(api.paymentEntries).toHaveLength(0)
})
