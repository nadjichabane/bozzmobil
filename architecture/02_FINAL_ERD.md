# 02 — BOZZMOBIL Final ERD

Visual reference: `images/BOZZMOBIL_ERD.png`

```mermaid
erDiagram
    LEADS_INSPEKSI ||--o{ INSPEKSI_DAN_HASIL : "memiliki"
    INSPEKSI_DAN_HASIL ||--o| DATA_PEMBELIAN : "menghasilkan"
    DATA_PEMBELIAN ||--|| DATA_STOCK_UNIT : "menjadi"
    DATA_STOCK_UNIT ||--o| PROSES_PENJUALAN : "dijual"

    LEADS_INSPEKSI {
        bigint id_leads PK
        varchar sumber
        varchar nama_customer
        varchar nama_inspector
        varchar nopol
        text alamat_customer
        varchar merk_mobil
        smallint tahun_mobil
        varchar status_mobil
        datetime tanggal_leads
        varchar no_hp_customer
        enum schema_unit
    }

    INSPEKSI_DAN_HASIL {
        bigint id_inspeksi PK
        bigint id_leads FK
        varchar nama_inspector
        varchar nopol
        json item_checklist
        json upload_foto_inspeksi
        smallint tahun_mobil
        varchar sumber
        varchar status_mobil
        datetime tanggal_inspeksi
        varchar hasil_inspeksi
        varchar no_hp_customer
        varchar status_hasil_inspeksi
        enum schema_unit
    }

    DATA_PEMBELIAN {
        bigint id_transaksi_pembelian PK
        bigint id_inspeksi FK_UK
        varchar nopol
        json hasil_checklist_inspeksi
        json hasil_foto_inspeksi
        smallint tahun_mobil
        varchar sumber
        varchar status_mobil
        datetime tanggal_inspeksi
        varchar hasil_inspeksi
        varchar no_hp_customer
        varchar jenis_transaksi_pembelian
        varchar status_unit_pembelian
        enum schema_unit
    }

    DATA_STOCK_UNIT {
        bigint id_transaksi_pembelian PK_FK
        varchar nopol
        smallint tahun_mobil
        varchar sumber
        varchar status_mobil
        datetime tanggal_inspeksi
        varchar hasil_inspeksi
        varchar no_hp_customer
        varchar jenis_transaksi
        varchar status_stock_unit
        enum schema_unit
    }

    PROSES_PENJUALAN {
        bigint id_transaksi_penjualan PK
        bigint id_transaksi_pembelian FK_UK
        smallint tahun_mobil
        varchar sumber
        varchar status_mobil
        datetime tanggal_inspeksi
        varchar hasil_inspeksi
        varchar no_hp_customer
        varchar jenis_transaksi
        enum schema_unit
    }

    MASTER_UNIT {
        bigint id_status_terakhir PK
        varchar nopol UK
        varchar informasi_status_terakhir
        datetime tanggal_status_terakhir
        smallint tahun_mobil
        varchar sumber
        varchar status_mobil_terakhir
        varchar no_hp_customer
        enum schema_unit
    }
```

## Relationship interpretation

- Lead → Inspection = 1:N, sehingga inspeksi ulang memungkinkan.
- Inspection → Purchase = 1:0..1. Inspeksi yang ditolak tidak memiliki transaksi pembelian; inspeksi yang dibeli hanya boleh memiliki satu.
- Purchase → Stock = 1:1.
- Stock → Sale = 1:0..1. Stock belum terjual tidak memiliki transaksi penjualan; jika sudah terjual hanya boleh satu transaksi.
