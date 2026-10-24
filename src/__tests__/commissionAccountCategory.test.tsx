// @vitest-environment jsdom
import { useLayoutEffect } from 'react'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { PipelineProvider, usePipeline } from '../context/PipelineContext'
import { ProsesPembelianPage } from '../pages/ProsesPembelianPage'
import { ProsesPembayaranPage } from '../pages/ProsesPembayaranPage'
import { PIPELINE, INITIAL_INSPECTIONS } from '../data/pipeline'
import type { PipelineSnapshot } from '../data/pipelineSnapshot'
import { createLocalDemoStorage } from '../lib/localDemoStorage'
import { IDBFactory } from 'fake-indexeddb'

let api: ReturnType<typeof usePipeline>
function Probe() { const value = usePipeline(); useLayoutEffect(() => { api = value }, [value]); return null }
const car = { ...PIPELINE[0], key: 'commission-account', stage: 'purchasing' as const, plate: 'B1234TY', buyPrice: 100 }
const inspection = { ...INITIAL_INSPECTIONS.find(r => r.decision === 'lulus')!, carKey: car.key }
afterEach(() => { cleanup(); vi.restoreAllMocks() })

it('carries a separate commission account into its automatic payment row and saves category/account without changing allocation', async () => {
  const props = { initialCars: [car], initialInspections: [inspection] }
  let saved: PipelineSnapshot | undefined
  const capture = (value: PipelineSnapshot) => { saved = value }
  const view = render(<PipelineProvider {...props} onSnapshot={capture}><Probe /><ProsesPembelianPage /></PipelineProvider>)
  act(() => api.markEnteredPurchaseProcess(car.key))
  fireEvent.click(screen.getByRole('button', { name: 'LIHAT / EDIT' }))
  fireEvent.change(screen.getByLabelText('Pilih Master Supplier'), { target: { value: '1' } })
  fireEvent.change(screen.getByLabelText('Kategori Pembayaran'), { target: { value: 'Pembelian Unit' } })
  fireEvent.change(screen.getByLabelText('Rekening Supplier'), { target: { value: '000111' } })
  fireEvent.change(screen.getByLabelText('Atas Nama Supplier'), { target: { value: 'Pemilik Kendaraan' } })
  fireEvent.change(screen.getByLabelText('Pembayaran kendaraan'), { target: { value: '80' } })
  fireEvent.change(screen.getByLabelText('Komisi'), { target: { value: '20' } })
  fireEvent.click(screen.getByRole('checkbox', { name: 'Sama dengan penerima pembayaran' }))
  fireEvent.change(screen.getByLabelText('Penerima Komisi'), { target: { value: 'Broker Terpisah' } })
  fireEvent.change(screen.getByLabelText('Nomor Rekening Komisi'), { target: { value: '009876' } })
  fireEvent.change(screen.getByLabelText('Atas Nama Rekening Komisi'), { target: { value: 'Pemilik Rekening Broker' } })
  fireEvent.click(screen.getByRole('button', { name: 'LANJUTKAN KE PEMBAYARAN' }))
  fireEvent.click(screen.getByRole('button', { name: 'YA, BUAT PAYMENT REQUEST' }))
  expect(api.paymentRequests).toHaveLength(1)
  expect(api.paymentRequests[0].totalAmount).toBe(100)
  expect(api.paymentRequests[0].allocations?.find(a => a.role === 'COMMISSION')).toMatchObject({ recipient: 'Broker Terpisah', accountNumber: '009876', accountHolder: 'Pemilik Rekening Broker' })
  view.rerender(<PipelineProvider {...props} onSnapshot={capture}><Probe /><ProsesPembayaranPage /></PipelineProvider>)
  fireEvent.click(screen.getByRole('button', { name: 'PROSES' }))
  expect(screen.getAllByLabelText('Kategori pembayaran baris')).toHaveLength(2)
  expect(screen.getByLabelText('Rekening Pembayaran Komisi')).toHaveProperty('value', '009876')
  expect(screen.getByLabelText('Atas Nama Pembayaran Komisi')).toHaveProperty('value', 'Pemilik Rekening Broker')
  const categories = screen.getAllByLabelText('Kategori pembayaran baris')
  expect(categories[1]).toHaveProperty('value', 'Komisi')
  fireEvent.change(categories[1], { target: { value: 'Maintenance' } })
  fireEvent.click(screen.getByRole('button', { name: 'VERIFIKASI' }))
  fireEvent.click(screen.getByRole('button', { name: 'PROSES PEMBAYARAN' }))
  const review = within(screen.getByRole('dialog', { name: 'Konfirmasi bukti pembayaran' }))
  expect(review.getByText(/009876/)).toBeTruthy()
  expect(review.getByText(/Maintenance/)).toBeTruthy()
  expect(api.paymentEntries).toHaveLength(0)
  fireEvent.click(review.getByRole('button', { name: 'Ya, lanjutkan' }))
  expect(api.paymentEntries).toHaveLength(2)
  const commission = api.paymentEntries.find(e => e.allocations?.[0].role === 'COMMISSION')!
  expect(commission).toMatchObject({ amount: 20, paymentCategory: 'Maintenance', accountNumber: '009876', accountHolder: 'Pemilik Rekening Broker', actualRecipient: 'Broker Terpisah' })
  expect(api.paymentEntries.reduce((s, e) => s + e.amount, 0)).toBe(100)
  expect(api.getCar(car.key)?.supplierDetail?.accountNumber).toBe('000111')
  const storage = createLocalDemoStorage({ indexedDB: new IDBFactory(), name: 'commission-roundtrip' })
  await storage.save(saved!, 0)
  view.unmount()
  const { snapshot } = await storage.load()
  render(<PipelineProvider initialSnapshot={snapshot}><Probe /><ProsesPembayaranPage /></PipelineProvider>)
  expect(api.paymentRequests[0].allocations?.find(a => a.role === 'COMMISSION')?.accountNumber).toBe('009876')
  expect(api.paymentEntries.find(e => e.allocations?.[0].role === 'COMMISSION')).toMatchObject({ paymentCategory: 'Maintenance', accountNumber: '009876', accountHolder: 'Pemilik Rekening Broker' })
  fireEvent.click(screen.getByRole('button', { name: 'PROSES' }))
  expect(screen.getByText(/Kategori: Maintenance/)).toBeTruthy()
})

it('allows a category on legacy payment requests and saves it only after proof review', () => {
  const props = { initialCars: [car], initialInspections: [inspection] }
  const view = render(<PipelineProvider {...props}><Probe /></PipelineProvider>)
  act(() => {
    const req = api.createPaymentRequest({ sourceType: 'PURCHASE_UNIT', sourceId: car.key, title: 'Unit', vendor: 'Seller', totalAmount: 100 })!
    api.verifyPaymentRequestAmount(req.id)
  })
  view.rerender(<PipelineProvider {...props}><Probe /><ProsesPembayaranPage /></PipelineProvider>)
  fireEvent.click(screen.getByRole('button', { name: 'PROSES' }))
  fireEvent.change(screen.getByLabelText('Kategori pembayaran baris'), { target: { value: 'Lainnya' } })
  fireEvent.change(screen.getByLabelText('Nominal pembayaran'), { target: { value: '10' } })
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Pembayaran' }))
  expect(api.paymentEntries).toHaveLength(0)
  fireEvent.click(screen.getByRole('button', { name: 'Ya, lanjutkan' }))
  expect(api.paymentEntries[0]).toMatchObject({ amount: 10, paymentCategory: 'Lainnya' })
})

it('does not borrow the seller account for historical commission allocations without account metadata', () => {
  const props = { initialCars: [{ ...car, supplierDetail: { name: 'Seller', phone: '', address: '', bank: 'Bank', accountNumber: '00111', accountHolder: 'Seller Holder', email: '' } }], initialInspections: [inspection] }
  const view = render(<PipelineProvider {...props}><Probe /></PipelineProvider>)
  act(() => api.createPaymentRequest({ sourceType: 'PURCHASE_UNIT', sourceId: car.key, title: 'Unit', vendor: 'Seller', totalAmount: 100, allocations: [{ role: 'VEHICLE_SETTLEMENT', amount: 80, recipient: 'Seller' }, { role: 'COMMISSION', amount: 20, recipient: 'Old Broker' }] }))
  view.rerender(<PipelineProvider {...props}><Probe /><ProsesPembayaranPage /></PipelineProvider>)
  fireEvent.click(screen.getByRole('button', { name: 'PROSES' }))
  expect(screen.getByLabelText('Rekening Pembayaran Komisi')).toHaveProperty('value', '')
  expect(api.paymentEntries).toHaveLength(0)
})

it.each(['account', 'proof'])('invalidates duplicate confirmation when %s in the visible row changes', (field) => {
  const props = { initialCars: [car], initialInspections: [inspection] }
  const view = render(<PipelineProvider {...props}><Probe /></PipelineProvider>)
  act(() => {
    const request = api.createPaymentRequest({ sourceType: 'PURCHASE_UNIT', sourceId: car.key, title: 'Unit', vendor: 'Seller', totalAmount: 100, allocations: [{ role: 'VEHICLE_SETTLEMENT', amount: 100, recipient: 'Seller' }] })!
    api.verifyPaymentRequestAmount(request.id)
    api.addPaymentEntry(request.id, { paymentRequestId: request.id, paymentDate: new Date().toISOString(), method: 'Transfer', amount: 20, actualRecipient: 'Seller', allocations: [{ role: 'VEHICLE_SETTLEMENT', amount: 20, recipient: 'Seller' }] })
  })
  view.rerender(<PipelineProvider {...props}><Probe /><ProsesPembayaranPage /></PipelineProvider>)
  fireEvent.click(screen.getByRole('button', { name: 'PROSES' }))
  fireEvent.change(screen.getByLabelText('Nominal Pembayaran Unit'), { target: { value: '20' } })
  fireEvent.click(screen.getByRole('button', { name: 'PROSES PEMBAYARAN' }))
  fireEvent.click(screen.getByRole('button', { name: 'Ya, lanjutkan' }))
  expect(screen.getByRole('button', { name: 'KONFIRMASI' })).toBeTruthy()
  if (field === 'proof') {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:new-proof')
    fireEvent.change(view.container.querySelector<HTMLInputElement>('input[type="file"]')!, { target: { files: [new File(['new'], 'new-proof.png', { type: 'image/png' })] } })
  } else fireEvent.change(screen.getByLabelText('Rekening Pembayaran Unit'), { target: { value: '000NEW' } })
  expect(screen.queryByRole('button', { name: 'KONFIRMASI' })).toBeNull()
  fireEvent.change(screen.getByLabelText('Kategori pembayaran baris'), { target: { value: 'Lainnya' } })
  fireEvent.click(screen.getByRole('button', { name: 'PROSES PEMBAYARAN' }))
  const review = within(screen.getByRole('dialog', { name: 'Konfirmasi bukti pembayaran' }))
  if (field === 'account') expect(review.getByText(/000NEW/)).toBeTruthy()
  else expect(review.getByRole('img', { name: 'new-proof.png' })).toBeTruthy()
  expect(review.getByText(/Kategori: Lainnya/)).toBeTruthy()
  expect(api.paymentEntries).toHaveLength(1)
})
