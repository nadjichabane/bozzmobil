# 07 — Proses Pembayaran Pembelian

Ditetapkan: 2026-10-05. Dokumen ini menetapkan kebutuhan bisnis dan mencatat batas implementasi saat ini.

## Posisi dalam alur

Data Pembelian → Proses Pembayaran (subproses pembelian yang sama).
Pembayaran tidak menciptakan unit/transaksi pembelian kedua. Sesuai perubahan owner 2026-10-15, pembayaran LUNAS otomatis memasukkan unit yang masih purchasing ke Stock INCOMING. Pembayaran parsial tidak otomatis memindahkan unit; operator dapat memasukkannya melalui konfirmasi sisa pembayaran. Penerimaan fisik, QC dan BAST tetap wajib.

Persiapan pembelian tersedia untuk stage purchasing yang tidak ditolak. Request pembayaran yang sudah dibuat tetap dapat dilunasi setelah unit masuk Stock manual. Pembelian ditolak hanya menampilkan histori/refund di modul pembayaran. Relasi struktural Lead → Inspection → Purchase → Stock → Sale tetap mengikuti ERD. carKey pada frontend adalah pengenal state unit, bukan bukti adanya FK pembayaran di database.

## Stock, reject dan refund — keputusan owner 2026-10-15

- Revisi owner 2026-10-19: MASUK STOCK hanya tersedia setelah input Proses
  Pembelian berhasil diajukan dan canonical PaymentRequest PURCHASE_UNIT untuk
  unit tersebut sudah terbentuk. Membuka form, menekan YA PROSES PEMBELIAN,
  menyimpan sebagian koreksi atau legacy submitted flag bukan bukti pengajuan
  selesai. Shared button dan command enterStockUnit wajib memeriksa request yang
  sama; generic advance juga tidak boleh melewati syarat ini. Request belum
  dibayar/parsial tetap memerlukan konfirmasi sisa; pelunasan canonical otomatis
  tetap masuk Stock INCOMING. Tidak mengubah unit yang sudah berada di stok.

- Pelunasan PaymentRequest berdasarkan PaymentEntry kanonis memanggil command
  Stock yang sama dengan aksi manual. Termasuk pelunasan melalui override duplikat
  yang telah direview. Unit yang sudah berada di Stock tidak dibuat ulang atau
  direset penerimaannya. Bayar parsial tetap purchasing sampai aksi manual.
- MASUK STOCK manual membuka konfirmasi nominal sisa. Jika sisa berubah sebelum
  konfirmasi, operator perlu membaca dan mengonfirmasi nilai terbaru.
  Data Pembelian, Proses Pembelian dan Simulasi memakai dialog yang sama: belum
  ada pembayaran / belum lunas, total pembelian, nominal dibayar dan sisa.
  Command enterStockUnit memerlukan snapshot nominal yang telah direview untuk
  pembayaran belum lunas; snapshot lama ditolak. advance(purchasing → qc) wajib
  melalui command ini sehingga tidak ada jalur perpindahan stage tanpa review.
- Pembelian belum lunas boleh di-reject dari purchasing/qc/available selama belum
  ada SaleRecord. Pembelian lunas dan unit terjual tidak dapat di-reject.
- Reject mengembalikan current-stage unit ke bucket purchasing yang ditandai
  Ditolak; unit dikeluarkan dari daftar Stock/QC aktif. Arrival, inspeksi, record QC,
  purchase ID dan pembayaran tidak dihapus. Tidak ada enum stage baru. Record QC
  yang belum selesai tidak boleh diedit/diselesaikan lewat tampilan lama.
- Semua jalur pembayaran baru diblokir setelah reject, termasuk override duplikat.
  PaymentRequest.status tetap status historis pembayaran; Ditolak disajikan
  terpisah, bukan mengubah pembayaran menjadi negatif atau status LUNAS palsu.
- Refund hanya setelah reject dan setelah uang diterima kembali. Bisa bertahap;
  nominal integer Rupiah positif, kumulatif <= PaymentEntry keluar. Tanggal,
  metode, referensi dan file bukti wajib. JPG/PNG/WebP/PDF maksimal 10 MB.
- Refund append-only dengan token idempotensi dan referensi unik per request.
  Pembayaran keluar asli tetap utuh. Arus Kas menambahkan refund sebagai Masuk
  jenis Pembelian; tidak menambah omzet Penjualan. Sisa refund dimonitor terpisah
  dari sisa tagihan aktif; pembelian ditolak tidak ikut kewajiban aktif.
- Revisi 2026-10-16: entry demo memakai snapshot IndexedDB lokal pada browser yang
  sama, termasuk byte bukti/refund yang didukung. Object URL dipulihkan saat load.
  Tidak ada migrasi, Supabase, sinkron antarperangkat atau transfer bank otomatis.

## Kontrak form dan kepemilikan data

### Revisi UI owner 2026-10-16
- Revisi owner 2026-10-24: alokasi komisi menyimpan nama penerima, bank, nomor
  rekening dan atas nama rekening terpisah. Jika opsi sama dengan penerima
  pembayaran dicentang, detail rekening mengikuti draft penjual saat pengajuan.
  Snapshot opsional disimpan pada PaymentAllocation; histori lama tanpa rekening
  komisi tetap kosong, tanpa fallback rekening penjual atau Master Supplier.
- Setiap baris Proses Pembayaran memiliki kategori administrasi Pembayaran
  Kendaraan/Komisi/Maintenance/Lainnya dan detail rekening penerima. Kategori
  berbeda dari AllocationRole dan kategori request pembelian; tidak mengubah
  total/role/batas alokasi. Alokasi positif otomatis membuat draft awal, bukan
  entry tercatat. PaymentEntry menyimpan kategori dan rekening yang dikonfirmasi;
  review bukti, riwayat dan preview pembelian menampilkan nilai tersebut.
  Edit/hapus baris membatalkan draft konfirmasi duplikat lama. Data tambahan ikut
  snapshot IndexedDB lokal; tidak ada API/backend/migrasi SQL baru.
- Proses Pembelian wajib menyediakan input Nopol. Bila masih kosong dari Leads/
  Inspeksi, isi dan Simpan Koreksi pada Data Unit sebelum membuat PaymentRequest.
  Input dinormalisasi tanpa spasi, uppercase dan divalidasi format; canonical unit
  yang sama diperbarui sehingga Leads, Inspeksi dan daftar unit menampilkan koreksi.
  Record hasil/checklist inspeksi tidak ditimpa; ID/relasi unit tetap.
- Command createPaymentRequest untuk PURCHASE_UNIT menolak unit tidak ditemukan
  atau Nopol kosong/tidak valid, termasuk pemanggilan langsung/form lama.
- Proses Pembelian tetap menyiapkan informasi, alokasi rencana dan request;
  tidak menyisipkan form ProsesPembayaran. Pencatatan pembayaran, verifikasi nominal
  dan upload bukti pembayaran hanya pada modul Proses Pembayaran.
- Proses Pembelian menampilkan ringkasan read-only dari PaymentRequest/PaymentEntry:
  dibayar dari total, sisa, BELUM DIBAYAR/BELUM LUNAS/LUNAS dan pesan belum ada
  pembayaran. Tanpa request, tampilkan harga beli dan pembayaran legacy jika ada.
  Jangan menjumlahkan entry canonical dengan pembayaran legacy dua kali.
- Proses Pembayaran menampilkan kolom/filter kategori sesuai paymentCategory yang
  dipilih pada Proses Pembelian (Pembelian Unit/Sparepart/Jasa); kategori berbeda
  dari sourceType dan bukan perubahan lifecycle/transaksi. Legacy kosong ditampilkan
  Belum diisi, tidak diberi kategori rekaan.
- Bank, nomor rekening dan atas nama penjual dibaca dari supplierDetail pembelian
  pada canonical unit. Tampilkan tanda minus jika kosong, pertahankan nol awal;
  jangan mengganti detail koreksi transaksi dengan nilai Master Supplier.
- Tambah Kolom Pembayaran/Komisi menambah draft isian nominal/metode/penerima/bukti
  untuk request yang sama. Tidak membuat kendaraan, pembelian atau pembayaran
  tercatat sampai operator menjalankan proses pembayaran dengan validasi yang ada.

| Bagian | Sumber pengisian | Aturan koreksi |
|---|---|---|
| Informasi Pembelian | Pembelian terpilih dan inspeksi terkait | Field bisnis dapat dikoreksi; nomor otomatis dan ID relasi terlindungi. Tidak ada dropdown Status/Draft manual. |
| Data Unit | Unit yang sama dan data inspeksinya | Koreksi atribut kendaraan memperbarui keadaan terkini pada unit sumber; tidak memilih/membuat unit baru. |
| Data Supplier | Supplier/detail supplier pada pembelian/unit terkait | Data tersedia diisi otomatis; data kosong dilengkapi tanpa nilai fiktif. |
| Input Pembayaran | Harga beli dan konfigurasi/riwayat pembayaran | Pilihan Cash/Credit, komisi, pencatatan pembayaran, dan ringkasan otomatis. |

Informasi pembelian mencakup tanggal, dibeli oleh, PIC/buyer, dan inspektor jika tersedia. Data unit mencakup foto, nopol, merek, model/tipe, tahun, warna, VIN, nomor mesin, odometer, dan SCHEMA UNIT jika tersedia. Detail supplier mencakup nama, telepon, alamat/kota, bank, rekening, atas nama, dan email.

Pada Proses Pembelian, Purchase Admin memilih supplier terdaftar dari Master
Supplier melalui pencarian nama/ID dan dropdown. Nama awal dari Leads adalah
informasi sumber, bukan otomatis pengesahan relasi supplier. Pilihan supplier
mengisi detail yang tersedia; detail kontak/rekening dapat dikoreksi untuk pembelian
tanpa mengubah Master Supplier. supplierId pada canonical car dan PaymentRequest
harus menunjuk supplier terpilih yang sama. Setelah request dibuat, identitas supplier
tidak dapat diganti; vendor request tetap snapshot historis. Nama legacy tanpa ID
tetap terbaca, dan tidak otomatis dibuatkan master/relasi berdasarkan kemiripan nama.
Ini kontrak frontend, belum merupakan foreign key atau persistence database.

Jika supplier belum terdaftar, admin dapat memakai Tambah Supplier pada picker
Pembelian/Penjualan. Form dan validasi sama dengan Master Supplier; record baru
ditambahkan ke master bersama dan dipilih otomatis. Cancel mempertahankan draft
transaksi. Menambah supplier tidak otomatis membuat transaksi atau pembayaran.

Pilihan Jenis Penjual pada Proses Pembelian: Perorangan atau Supplier, terpisah
dari Cash/Credit. Supplier memilih record Master Supplier; Perorangan memakai
identitas manual dan tidak menyimpan supplierId master. purchasePartyType pada
unit dan vendorType pada PaymentRequest merekam pilihan, tanpa membuat unit atau
pembelian baru. Setelah request ada, jenis/identitas penjual tidak diganti.
Snapshot kontak dapat dikoreksi pada pihak yang sama. Record lama tanpa metadata
tetap dapat dibaca; tidak dilakukan migrasi atau klasifikasi massal atas histori.

Koreksi field wajib melalui form → state → validasi → API/DTO/service → database → response → daftar/detail/laporan ketika lapisan tersebut tersedia. Histori inspeksi/transaksi tidak boleh ditimpa diam-diam untuk mengubah keadaan terkini. Gunakan audit perubahan jika tersedia; dukungan yang belum ada harus dinyatakan.

## Perhitungan dan validasi wajib

- Revisi owner 2026-10-24: submit Proses Pembayaran membuka review sebelum
  pencatatan. Setiap kolom pending menampilkan nominal/penerima dan preview bukti
  gambar/PDF; kolom tanpa bukti diberi peringatan Lanjutkan tanpa bukti bayar.
  Bukti tetap opsional setelah operator menekan Ya, lanjutkan. Batal tidak
  mengubah entry atau membuang draft/file. Review berlaku juga untuk pembayaran
  legacy tanpa alokasi. Snapshot isian harus sama saat dikonfirmasi; perubahan
  memerlukan review ulang. Guard nominal, verifikasi tagihan, committed rows,
  duplikat dan penolakan pembelian tetap otoritas canonical saat simpan.

- Total pembayaran = total gros pembelian (sudah termasuk komisi secara internal). Komisi adalah alokasi dari total gros, bukan nominal tambahan di atasnya.
- Dibayar = jumlah amount dari seluruh record pembayaran pembelian ini.
- Sisa = total pembayaran - dibayar; total, dibayar, dan sisa dihitung otomatis.
- Nominal harus finite dan tidak negatif; pembayaran baru tidak boleh melebihi sisa.
- Koreksi harga/komisi tidak boleh menurunkan total di bawah jumlah yang sudah dibayar. Jangan menyembunyikan overpayment dengan membatasi sisa menjadi nol.
- Contoh: total gros pembelian Rp100.000.000. Alokasi internal: settlement supplier Rp95.000.000 + komisi Rp5.000.000 = Rp100.000.000. Total PaymentRequest = Rp100.000.000. Dibayar Rp30.000.000 → sisa Rp70.000.000.

## Cash dan Credit

Cash menyembunyikan panel kredit dan mengecualikan field kredit dari validasi/perhitungan aktif. Credit menampilkan leasing, pembayaran ke customer, pembayaran ke leasing, dan informasi BPKB. Rincian customer/leasing merupakan alokasi pembayaran yang sama, bukan pembayaran tambahan; harus konsisten dengan nominal yang dicatat. Pergantian jenis pembayaran tidak menghapus riwayat pembayaran.

Jenis pembayaran bukan stage unit. Status dokumen BPKB bukan status inspeksi, pembelian, atau stock. Nilai status baru memerlukan penetapan bisnis; referensi gambar bukan otorisasi menciptakan enum/status.

## Model frontend saat ini (hasil pembacaan kode)

- PipelineCar.payment?: CarPayment; PipelineCar.supplierDetail? menyimpan detail supplier.
- CarPayment: carKey, paymentType, commission, creditDetail?, payments[].
- PaymentRecord: id, carKey, amount, paidAt, note?.
- CreditDetail: leasing, paidToCustomer, paidToLeasing, bpkbStatus.
- PipelineContext menyediakan saveCarPayment, addCarPaymentRecord, saveCarCorrections, saveSupplierDetail.
- Komponen form: src/components/ProsesPembayaran.tsx; pintu masuk: src/pages/PembelianContent.tsx.

Ini model state frontend, bukan skema SQL yang sudah dimigrasikan. Entry demo memuat snapshot IndexedDB sebelum PipelineProvider dibuat, lalu menyimpan perubahan canonical secara atomik. Factory/provider tanpa wrapper tetap memory-only untuk fixture/tes. Persistensi lokal mencakup verifikasi/audit frontend yang sudah ada, bukan audit backend. Lihat docs/specs/penyimpanan-demo-lokal.md; visual refresh browser masih menunggu akses Browser.

## Keterbatasan yang harus ditelusuri saat implementasi berikutnya

- Data Pembelian menyediakan LIHAT PEMBELIAN untuk membaca rincian proses yang tersimpan, termasuk setelah stok/terjual/ditolak. Preview membaca unit, supplierDetail, PaymentRequest dan payment entries terkait tanpa mutasi. Jika request tersedia, entries canonical menggantikan mirror legacy dalam total dibayar. Ini tampilan data terkini, bukan snapshot historis yang immutable. Dokumen pembelian hanya metadata status/nama file; jangan membuat link file tanpa byte tersimpan.

- API saveCarCorrections saat ini hanya mencakup brand, model, year, color, transmission, mileage, plate, buyPrice. Dukungan koreksi semua informasi pembelian/VIN/nomor mesin tidak boleh dianggap selesai berdasarkan kontrak form saja.
- Guard nominal dan konsistensi alokasi wajib diverifikasi pada jalur simpan/state/backend, bukan hanya tampilan form.
- Persistensi server bersama, field yang belum didukung, audit backend, dan pengaitan pembayaran ke ID pembelian database memerlukan implementasi serta verifikasi tersendiri. PurchaseDocument saat ini hanya metadata, jangan mengklaim byte file pembelian ikut tersimpan.
- schema.sql belum mendefinisikan tabel riwayat pembayaran. Jangan mengarang tabel atau mengubah kardinalitas ERD tanpa desain/migrasi yang ditelusuri dan menjaga data lama.

## Verifikasi untuk perubahan berikutnya

Periksa auto-fill, koreksi tersimpan pada sumber, Cash/Credit, contoh hitungan di atas, penolakan overpayment, histori tetap ada ketika metode berubah, tidak ada duplikasi relasi, dan dataset tetap 15 unit. Klaim persistensi baru boleh dibuat setelah simpan → refresh → baca ulang dari penyimpanan permanen berhasil. Jalankan build dan pemeriksaan relevan; catat bukti nyata dalam CHANGELOG_FIXES.md setelah fix terverifikasi.
