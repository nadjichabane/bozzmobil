# 03 — BOZZMOBIL Database Schema

## Primary identifiers

| Table | Primary Key |
|---|---|
| leads_inspeksi | id_leads |
| inspeksi_dan_hasil | id_inspeksi |
| data_pembelian | id_transaksi_pembelian |
| data_stock_unit | id_transaksi_pembelian |
| proses_penjualan | id_transaksi_penjualan |
| master_unit | id_status_terakhir |

## Foreign keys

| Child | FK | Parent |
|---|---|---|
| inspeksi_dan_hasil | id_leads | leads_inspeksi.id_leads |
| data_pembelian | id_inspeksi | inspeksi_dan_hasil.id_inspeksi |
| data_stock_unit | id_transaksi_pembelian | data_pembelian.id_transaksi_pembelian |
| proses_penjualan | id_transaksi_pembelian | data_stock_unit.id_transaksi_pembelian |

## Uniqueness enforcing business rules

`data_pembelian.id_inspeksi` is UNIQUE → satu inspeksi maksimal satu pembelian.

`data_stock_unit.id_transaksi_pembelian` is PRIMARY KEY → satu transaksi pembelian satu stock record.

`proses_penjualan.id_transaksi_pembelian` is UNIQUE → satu stock maksimal satu transaksi penjualan.

## MASTER UNIT

`id_status_terakhir` tidak boleh dibuat sebagai FK ke beberapa tabel berbeda. MASTER UNIT adalah current-state/master record, sedangkan histori transaksi disimpan di tabel proses.
