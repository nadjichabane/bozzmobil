-- BOZZMOBIL FINAL DATABASE SCHEMA
-- MySQL 8.x

CREATE TABLE leads_inspeksi (
    id_leads BIGINT AUTO_INCREMENT PRIMARY KEY,
    sumber VARCHAR(100),
    nama_customer VARCHAR(255) NOT NULL,
    nama_inspector VARCHAR(255),
    nopol VARCHAR(20) NOT NULL,
    alamat_customer TEXT,
    merk_mobil VARCHAR(100),
    tahun_mobil SMALLINT,
    status_mobil VARCHAR(100),
    tanggal_leads DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    no_hp_customer VARCHAR(30),
    schema_unit ENUM('REGULER','CARVIAN','TRADE IN') NOT NULL
);

CREATE TABLE inspeksi_dan_hasil (
    id_inspeksi BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_leads BIGINT NOT NULL,
    nama_inspector VARCHAR(255),
    nopol VARCHAR(20) NOT NULL,
    item_checklist JSON,
    upload_foto_inspeksi JSON,
    tahun_mobil SMALLINT,
    sumber VARCHAR(100),
    status_mobil VARCHAR(100),
    tanggal_inspeksi DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    hasil_inspeksi VARCHAR(100),
    no_hp_customer VARCHAR(30),
    status_hasil_inspeksi VARCHAR(100),
    schema_unit ENUM('REGULER','CARVIAN','TRADE IN') NOT NULL,
    CONSTRAINT fk_inspeksi_lead
      FOREIGN KEY (id_leads) REFERENCES leads_inspeksi(id_leads)
      ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE data_pembelian (
    id_transaksi_pembelian BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_inspeksi BIGINT NOT NULL,
    nopol VARCHAR(20) NOT NULL,
    hasil_checklist_inspeksi JSON,
    hasil_foto_inspeksi JSON,
    tahun_mobil SMALLINT,
    sumber VARCHAR(100),
    status_mobil VARCHAR(100),
    tanggal_inspeksi DATETIME,
    hasil_inspeksi VARCHAR(100),
    no_hp_customer VARCHAR(30),
    jenis_transaksi_pembelian VARCHAR(100),
    status_unit_pembelian VARCHAR(100),
    schema_unit ENUM('REGULER','CARVIAN','TRADE IN') NOT NULL,
    CONSTRAINT fk_pembelian_inspeksi
      FOREIGN KEY (id_inspeksi) REFERENCES inspeksi_dan_hasil(id_inspeksi)
      ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE KEY uq_pembelian_id_inspeksi (id_inspeksi)
);

CREATE TABLE data_stock_unit (
    id_transaksi_pembelian BIGINT PRIMARY KEY,
    nopol VARCHAR(20) NOT NULL,
    tahun_mobil SMALLINT,
    sumber VARCHAR(100),
    status_mobil VARCHAR(100),
    tanggal_inspeksi DATETIME,
    hasil_inspeksi VARCHAR(100),
    no_hp_customer VARCHAR(30),
    jenis_transaksi VARCHAR(100),
    status_stock_unit VARCHAR(100),
    schema_unit ENUM('REGULER','CARVIAN','TRADE IN') NOT NULL,
    CONSTRAINT fk_stock_pembelian
      FOREIGN KEY (id_transaksi_pembelian)
      REFERENCES data_pembelian(id_transaksi_pembelian)
      ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE proses_penjualan (
    id_transaksi_penjualan BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_transaksi_pembelian BIGINT NOT NULL,
    tahun_mobil SMALLINT,
    sumber VARCHAR(100),
    status_mobil VARCHAR(100),
    tanggal_inspeksi DATETIME,
    hasil_inspeksi VARCHAR(100),
    no_hp_customer VARCHAR(30),
    jenis_transaksi VARCHAR(100),
    schema_unit ENUM('REGULER','CARVIAN','TRADE IN') NOT NULL,
    CONSTRAINT fk_penjualan_stock
      FOREIGN KEY (id_transaksi_pembelian)
      REFERENCES data_stock_unit(id_transaksi_pembelian)
      ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE KEY uq_penjualan_id_pembelian (id_transaksi_pembelian)
);

CREATE TABLE master_unit (
    id_status_terakhir BIGINT AUTO_INCREMENT PRIMARY KEY,
    nopol VARCHAR(20) NOT NULL,
    informasi_status_terakhir VARCHAR(255),
    tanggal_status_terakhir DATETIME,
    tahun_mobil SMALLINT,
    sumber VARCHAR(100),
    status_mobil_terakhir VARCHAR(100),
    no_hp_customer VARCHAR(30),
    schema_unit ENUM('REGULER','CARVIAN','TRADE IN') NOT NULL,
    UNIQUE KEY uq_master_unit_nopol (nopol)
);

-- IMPORTANT:
-- master_unit.id_status_terakhir is NOT a polymorphic FK.
-- Transaction history stays in the transaction tables.
