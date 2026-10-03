# 05 — BOZZMOBIL Business Rules

## Inspection
- Lead dapat masuk ke inspeksi.
- Inspeksi menyimpan checklist, foto, hasil, inspector, dan tanggal.
- Hasil inspeksi dapat menyebabkan unit ditolak atau dilanjutkan.

## Purchase
- Hanya inspeksi yang dilanjutkan ke proses pembelian yang memiliki transaksi pembelian.
- **Satu inspeksi maksimal satu transaksi pembelian.**

## Stock
- **Satu transaksi pembelian menghasilkan satu stock unit.**
- Stock memiliki status seperti READY / NOT READY sesuai proses operasional.

## Sales
- Stock dapat belum terjual.
- **Satu stock unit maksimal satu transaksi penjualan.**
- Setelah transaksi penjualan, proses dapat menghasilkan BAST / bukti transaksi.

## MASTER UNIT
- Menyimpan status terakhir/current state kendaraan.
- Tidak menggantikan tabel histori transaksi.

## SCHEMA UNIT
Kategori unit wajib konsisten sepanjang lifecycle:
- REGULER
- CARVIAN
- TRADE IN
