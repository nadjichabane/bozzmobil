# 01 — BOZZMOBIL System Overview

BOZZMOBIL adalah sistem operasional showroom mobil yang mengelola lifecycle unit dari lead inspeksi sampai transaksi penjualan.

## Main process

```text
LEADS INSPEKSI
      ↓
INSPEKSI & HASIL
      ↓
HASIL INSPEKSI
  ├── REJECT / TOLAK
  └── LULUS
        ↓
DATA PEMBELIAN
        ↓
NEGOSIASI HARGA
        ↓
PROSES PEMBELIAN
        ↓
DATA STOCK UNIT
 READY / NOT READY
        ↓
QC UNIT
        ↓
PROSES PENJUALAN
        ↓
BAST / BUKTI TRANSAKSI
```

## Main entities

- MASTER UNIT
- LEADS INSPEKSI
- INSPEKSI DAN HASIL
- DATA PEMBELIAN
- DATA STOCK UNIT
- PROSES PENJUALAN

## Master vs transaction

`MASTER UNIT` = snapshot/current state kendaraan.

Tabel lain = histori/proses transaksi kendaraan.
