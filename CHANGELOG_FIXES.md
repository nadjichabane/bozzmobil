# CHANGELOG_FIXES.md

Berlaku untuk project BOZZMOBIL.

## Aturan
- Tambah entri baru di ATAS (terbaru → terlama).
- Nomor fix bersifat final; jangan menggeser nomor lama.
- Bila dua sesi paralel mengambil nomor yang sama, tulis berikutnya dengan sufiks huruf (`#N b`).

---

### Fix #71 - Rekening komisi, kategori, dan rekening terpisah per pembayaran

| Field | Detail |
|---|---|
| Tanggal | 2026-10-24 |
| File | src/components/ProsesPembayaran.tsx; src/data/payments.ts; src/context/PipelineContext.tsx; src/__tests__/commissionAccountCategory.test.tsx; src/__tests__/paymentProofReview.test.tsx; architecture/07_PURCHASE_PAYMENT.md |
| Masalah | Alokasi komisi tidak membawa rekening terpisah; kategori pembayaran tidak tersimpan di entry; legacy payment request tanpa alokasi tidak bisa diberi kategori. |
| Akar | PaymentEntry tidak punya paymentCategory, bank, accountNumber, accountHolder; ProsesPembayaran pre-fill komisi dari alokasi tanpa metadata rekening. |
| Fix | PaymentEntry baru fields: paymentCategory (EntryPaymentCategory), bank, accountNumber, accountHolder, actualRecipient. Komisi otomatis satu draft awal; rekening komisi dari alokasi (fallback kosong, tidak dari master supplier). Kategori per row dan legacy selectable. Review bukti menampilkan kategori + rekening. Duplikat guard memperhitungkan category/account. Legacy entry mendukung kategori. |
| Verifikasi | commissionAccountCategory 5/5 pass; paymentProofReview 4/4; paymentAllocations 20/20; full suite 662/662 pass 63 files, 52.11s, exit0. tsc --noEmit exit0. Vite build 2157 modul, 3.79s; chunk warning existing. |
| Pelajaran | Rekening komisi tidak boleh fallback ke master supplier saat alokasi tanpa metadata; kategori tidak mengubah role/total/guard. |
| Log Keyword | pembayaran-komisi-rekening-kategori; commissionAccountCategory; PaymentEntry paymentCategory; EntryPaymentCategory; rekening komisi |
| Deploy | PENDING - commit + push master trigger GitHub Pages |

### Fix #70 - Preview pembelian tersimpan tetap tersedia setelah stok atau terjual

| Field | Detail |
|---|---|
| Tanggal | 2026-10-24 |
| File | src/components/PurchasePreview.tsx; src/pages/PembelianContent.tsx; src/__tests__/purchasePreview.test.tsx; architecture/07_PURCHASE_PAYMENT.md |
| Masalah | Data Pembelian hanya menyediakan hasil inspeksi pada unit stok/terjual; rincian proses pembelian tersimpan tidak dapat dibuka sebagai preview. |
| Akar | Tampilan proses pembelian berupa form editable untuk tahap purchasing; belum ada komponen read-only untuk tahap berikutnya. |
| Fix | Tombol LIHAT PEMBELIAN membuka unit, penjual/rekening, ID terkait, alokasi, ringkasan dan riwayat pembayaran, catatan serta metadata dokumen. Tersedia setelah proses dimasuki/request tersedia dan untuk stok/terjual. Tidak membuat ID/request atau mutasi. Canonical payment entries menggantikan mirror legacy agar tidak double count. Dokumen metadata tidak diberi link file rekaan. |
| Verifikasi | RED 5 gagal/1 lulus; final 13/13 tes terkait, 3 file, 10.54s. Termasuk purchasing/qc/available/sold/rejected, tanpa form edit dan sumber tetap ketika buka/tutup, paid40/balance60 walau legacy mirror40. Build/tsc exit0, 2157 modul, Vite2.87s; scoped lint0error/2warning render refs existing. Review tanpa blocker. CUA apps=[]/browsers=[]: visual aktual PENDING. Full suite tidak diulang. |
| Pelajaran | Preview memakai data terkini canonical, bukan snapshot immutable. Metadata nama file tidak membuktikan byte file tersimpan. |
| Log Keyword | pembelian-preview-rincian; PurchasePreview; LIHAT PEMBELIAN |
| Deploy | LIVE DEMO 2026-10-24 - dpl_He5jEstmr734YY8D3ysm1UYMdF9o READY. Public HTML/JS/CSS200; index-CAXYsgwJ.js SHA256 DFC831959E1511223794BA83CDE24AA9D06074289230E0A81887487C03A65647 cocok dist. Artifact r9 dry28files/1,974,162bytes/0privatepaths; visual PENDING. |

### Fix #69 - ID Inspeksi di sebelah ID Payment pada antrian pembayaran

| Field | Detail |
|---|---|
| Tanggal | 2026-10-24 |
| File | src/pages/ProsesPembayaranPage.tsx, src/__tests__/paymentInspectionId.test.tsx |
| Masalah | Antrian Proses Pembayaran belum menampilkan kode inspeksi sumber di samping PAY. |
| Akar | Header/row grid hanya memiliki ID Payment dan belum membaca purchaseRows.inspection.code. |
| Fix | Tambah kolom ID Inspeksi tepat setelah ID Payment, lookup purchaseRows sesuai sourceId PURCHASE_UNIT. Tanpa relasi tampil minus; source lain tidak diberi kode rekaan. Grid header/row sama-sama10kolom dan minwidth1140 dengan horizontal scroll existing. Tidak mengubah ID/relasi/source records. |
| Verifikasi | RED1/1 sebelum perubahan. Final8/8pass3files7.79s, test2unit kode berbeda tidak tertukar dan source tanpa record tidak memakai kode lain. Build/tsc0,2156modules,Vite2.35s; scopedlint0error/0warning. CUA apps=[]/browsers=[]: actual visual PENDING. Full suite tidak diulang untuk kolom baca UI. |
| Pelajaran | Fixture awal menggunakan MAINTENANCE yang tidak didukung type PaymentRequest saat ini, tsc menolaknya; fixture diganti request PURCHASE_UNIT tanpa linked inspection, tanpa mengubah source enum untuk memuaskan tes. |
| Log Keyword | pembayaran-id-inspeksi; paymentInspectionId; ID Payment; ID Inspeksi |
| Deploy | LIVE DEMO 2026-10-24 - dpl_7tbizqBkz9heDtcY1Khd398wJ2jY READY; publicHTML/JS/CSS200; index-D1-ggfKh.js SHA256693D78453DFC4C93AFBD44E011C0CF366B3933C179431258188119336EE69DB9 cocok dist. Artifactr8 dry28files/1,967,116bytes/0privatepaths; visual PENDING. |

### Fix #68 - Review bukti sebelum Proses Pembayaran menyimpan entry

| Field | Detail |
|---|---|
| Tanggal | 2026-10-24 |
| File | ProsesPembayaran.tsx, PaymentProofReview.tsx, paymentProofReview.test.tsx, architecture/07_PURCHASE_PAYMENT.md |
| Masalah | Submit langsung mencatat pembayaran tanpa peringatan bukti kosong atau preview bukti terpilih. |
| Akar | Multi-row handleProcessAll dan legacy single-entry langsung memanggil addPaymentEntry; preview hanya tersedia pada entry yang sudah tercatat. |
| Fix | Popup semua pending kolom berisi nominal/penerima/preview gambar atau PDF. Baris tanpa bukti ditandai dan menanyakan Lanjutkan tanpa bukti bayar; tetap opsional setelah konfirmasi. Batal menjaga draft/file, Ya lanjutkan baru memanggil mutation existing. Fingerprint request/total/remaining/allocations/rows/proof mengikat review ke isian terkini; perubahan meminta review ulang. Ref confirm mencegah double-submit, committed rows tetap skipped, guard duplikat/nominal/verification existing tetap. Legacy single-entry mengikuti gate sama. |
| Verifikasi | RED4/4 sebelum implementasi. Focused43/43pass4files9.75s + independent review4/4pass tanpa blocker; ditambah test mixedproof/no-proofcancel, full final650/650pass60files107.59s,exit0. Build/tsc0,2156modules,Vite2.83s; scopedlint0error/7existingwarnings. CUA apps=[]/browsers=[]: actual rendered/focus/PDF preview PENDING. |
| Pelajaran | Preview tidak boleh menyimpan entry; confirmation harus terikat snapshot pending, bukan boolean global yang bisa dipakai setelah draft berubah. Recipient preview memakai fallback allocation yang sama dengan payload; preventScroll menjaga popup mulai dari preview atas. |
| Log Keyword | pembayaran-konfirmasi-preview-bukti; PaymentProofReview; requireProofReview; optional proof review |
| Deploy | LIVE DEMO 2026-10-24 - dpl_FGuwhZDdwFEGKduuSw1Dm2ZHd1q5 READY; publicHTML/JS/CSS200; index-OIHdcXnS.js SHA2564D3CB80F8A5C0843B2648D9621D6422CD1DD70A357D81C19CD4196957B7C72CA cocok dist. Artifactr7 dry28files/1,966,592bytes/0privatepaths; visual PENDING. |

### Fix #67 - Kartu temuan Data Pembelian membuka galeri foto yang dapat digeser

| Field | Detail |
|---|---|
| Tanggal | 2026-10-24 |
| File | src/pages/PembelianContent.tsx, src/__tests__/purchaseFindingGallery.test.tsx |
| Masalah | Pada Hasil Inspeksi Data Pembelian, daftar temuan statis sehingga klik kartu tidak membuka foto. |
| Akar | Kartu hanya li teks dan jumlah foto; gallery existing berada terpisah di bawah hasil. |
| Fix | Kartu menjadi tombol accessible untuk galeri foto milik temuan terpilih, sumber canonical inspection terhubung. Reuse InspectionPhotoLightbox dengan catatan, swipe, keyboard/panah; reset pilihan saat tutup/ganti unit. Tanpa byte foto tidak membuka galeri kosong meski photoCount legacy positif; keterangan Foto belum tersedia. |
| Verifikasi | RED2/2 sebelum perubahan. Final9/9pass3files9.34s; test kartu->foto1/caption->swipefoto2->ArrowLeft->Escape tetap parent Hasil Inspeksi; noemptygallery legacycount. Build/tsc0,2155modules,Vite2.12s; scopedlint0error/2existingwarnings. CUA apps=[]/browsers=[]: visual PENDING. Full suite tidak diulang untuk kartu/galeri UI. |
| Pelajaran | Jumlah foto legacy bukan bukti file tersedia; navigasi memakai photos aktual dan tetap terisolasi per temuan. |
| Log Keyword | pembelian-temuan-galeri; findingPhotoId; purchaseFindingGallery |
| Deploy | LIVE DEMO 2026-10-24 - dpl_25JTCwQub2doDG9DLjiLFdBtoHK6 READY; publicHTML/JS/CSS200; index-vD7Pn1Ns.js SHA256010B23CAD0CA7F758768F8896D340E609B37DB3DD77A58F33BEC5626D7901D5C cocok dist. Artifactr6 dry28files/1,963,071bytes/0privatepaths; visual PENDING. |

### Fix #66 - Catatan temuan tampil saat foto kerusakan dibuka

| Field | Detail |
|---|---|
| Tanggal | 2026-10-24 |
| File | InspectionPhotoGallery.tsx, InspectionPage.tsx, PembelianContent.tsx, findingPhotoCaption.test.tsx |
| Masalah | Lightbox foto temuan hanya menampilkan nama/jumlah foto, tanpa catatan kerusakan yang sudah diisi. |
| Akar | GalleryPhoto tidak membawa description temuan dan lightbox tidak punya caption note. |
| Fix | Optional GalleryPhoto.note dari Finding.description di Inspeksi dan hasil Pembelian; caption multiline bila nonkosong. Caption mengikuti foto, note kosong disembunyikan; gambar/note dibatasi tinggi agar teks panjang dapat digulir. Tidak mengubah data/hasil temuan. |
| Verifikasi | RED2/2 sebelum implementasi. Final12/12pass3files8.22s mencakup actual history finding click/caption, navigasi note/kosong, riwayat/photo regressions; build/tsc0,2155modules,Vite2.14s. Scopedlint0error/5existingwarnings. CUA apps=[]/browsers=[]: actual visual PENDING. Full suite tidak diulang untuk caption UI. |
| Pelajaran | Catatan harus dibawa bersama metadata foto, bukan mengambil teks dari kartu di belakang modal; original note tetap dibaca dari finding. |
| Log Keyword | inspeksi-foto-temuan-catatan; GalleryPhoto.note; Finding.description; lightbox caption |
| Deploy | LIVE DEMO 2026-10-24 - dpl_C8EhPsgqPoZQurJy25s1uUMzRVuB READY; publicHTML/JS/CSS200; index-hH19Wx6x.js SHA256AC471AF49161174DF919523457A034E375929B6A8D52856381685F084A55D394 cocok dist. Artifactr5 dry28files/1,961,938bytes/0privatepaths; visual PENDING. |

### Fix #65 - Multi-select foto pada Tambah dan Edit Kerusakan

| Field | Detail |
|---|---|
| Tanggal | 2026-10-24 |
| File | src/components/FindingEditor.tsx, src/__tests__/findingMultiPhoto.test.tsx |
| Masalah | Pilih Galeri pada Tambah Kerusakan hanya bisa satu foto. |
| Akar | FindingEditor belum mengaktifkan multiPhoto dan onAddMany milik PhotoSlot yang sudah tersedia. |
| Fix | Galeri multi-select menggunakan ordered batch PhotoSlot, append functional ke photos temuan tanpa menimpa foto lama. Kamera tetap tunggal; save photos/photoCount dan hapus individual existing. Shared editor juga berlaku pada mode edit/QC tanpa perubahan field/aturan. |
| Verifikasi | RED2/2 gagal sebelum implementasi. Final12/12pass3files7.70s termasuk create/edit masing-masing2file urut, mempertahankan foto lama, saved count; build/tsc0,2155modules,Vite7.69s. Scopedoxlint0error/0warning. CUA apps=[]/browsers=[]: rendered/native picker visual PENDING. Full suite tidak diulang untuk perubahan2props UI; suite terkait lulus. |
| Pelajaran | Gunakan batch callback existing, bukan loop callback yang berisiko menimpa refs/render state; penghitung berasal photos.length. |
| Log Keyword | inspeksi-kerusakan-multi-foto; FindingEditor; multiPhoto; onAddMany |
| Deploy | LIVE DEMO 2026-10-24 - dpl_3A2Kw3T3mmKfxgvq62SuKxXkNa1p READY; publicHTML/JS/CSS200; index-Z0esrSg4.js SHA256F8600B265C825132FB6C36F95C5AACC8B77014431834B138D8E7FD32B4C8A0FA cocok dist. Artifactr4 dry28files/1,961,527bytes/0privatepaths; visual PENDING. |

### Fix #64 - Catatan dan foto inspeksi terlihat pada riwayat serta hasil pembelian

| Field | Detail |
|---|---|
| Tanggal | 2026-10-24 |
| File | InspectionPage.tsx, InspectionChecklistNotes.tsx, PembelianContent.tsx, ProsesPembelianPage.tsx, checklist.ts, inspectionConditionNotes.test.tsx, architecture/05_BUSINESS_RULES.md |
| Masalah | Catatan kondisi tersimpan tetapi tidak ditampilkan di hasil; Buku Service/Manual tidak menawarkan note; catatan tanpa foto dan foto dokumen hilang dari riwayat/hasil pembelian. User juga meminta istilah Settlement diganti Pembayaran. |
| Akar | Detail riwayat hanya merender foto kendaraan terisi dan temuan; metadata allowsNote=false untuk buku; collector pembelian mengambil record pertama berdasarkan unit. Legacy sparse note map-before-fill menjatuhkan perubahan pertama. |
| Fix | Textarea berlabel Kondisi/Dokumen; note boleh saat BELUM DIPERIKSA tanpa mengubah jawaban. Isi missing item sebelum map untuk menjaga first paste. Shared read-only notes Kondisi/Dokumen/Foto terisi tanpa syarat gambar/status di riwayat dan hasil pembelian. Galeri dokumen riwayat; purchase evidence cocok carKey+kode inspeksi. UI Settlement Kendaraan/Penerima Settlement menjadi Pembayaran Kendaraan/Penerima Pembayaran tanpa mengubah enum role/nominal. |
| Verifikasi | Initial RED2; tambahan sparse/doc RED2; tambahan integrasi foto/purchase RED1. Final focused16/16pass,3files,9.17s; independent review5/5pass. Build/tsc0,2155modules,Vite2.88s; scopedlint0error/5existingwarnings. Full final639/639pass,56files,116.16s,exit0. CUA apps=[]/browsers=[]: visual/native picker PENDING. |
| Pelajaran | Review menemukan first-paste note pada sparse record hilang; diperbaiki dan regression ditambah. Test navigasi awal mencoba membaca detail setelah complete kembali ke list, diperbaiki dengan membuka Riwayat; query foto memakai img.closest(button) agar tidak bergantung accessible name thumbnail gabungan. Artifact r1/r2 hanya staging sebelum scope akhir, tidak dideploy. |
| Log Keyword | inspeksi-catatan-kondisi-riwayat; Buku Service; BELUM DIPERIKSA; photo notes without images; Pembayaran Kendaraan |
| Deploy | LIVE DEMO 2026-10-24 - dpl_7SxfWEYKkiru38Z1MUAJ8jPhMJU2 READY; publicHTML/JS/CSS200; index-DVHXS92V.js SHA2564E6CD7D9E2DABA38ED1E94E4CE9C5BB320E3068DE62325E3E8EFEA8AE21BA3FE cocok dist. Artifact20261024-r3 dry28files/1,961,482bytes/0privatepaths. Visual PENDING. |

### Fix #63 - Revisi checklist owner, feedback foto dan penanda koreksi/galeri riwayat

| Field | Detail |
|---|---|
| Tanggal | 2026-10-21 |
| File | src/data/checklist.ts, src/components/PhotoSlot.tsx, src/components/InspectionPhotoGallery.tsx, src/pages/InspectionPage.tsx, src/context/PipelineContext.tsx, src/context/usePipelineData.ts, src/__tests__/inspectionOwnerRevision.test.tsx, architecture/05_BUSINESS_RULES.md |
| Masalah | Kepemilikan memakai opsi lama; Scanner/Krom tidak diperlukan; foto kurang feedback; riwayat tidak menandai koreksi; galeri belum mendukung swipe dan navigasi lintas part. |
| Akar | Template lama, label audit belum disajikan, preview hanya memakai refs part terpilih, belum ada touch navigation. |
| Fix | Lima opsi kepemilikan + belum diperiksa; retired Scanner/Krom dari template aktif tanpa menghapus response/media lama. Semua hitungan structured progress/start/save/completion/display memakai template aktif; legacy tanpa responses tetap fallback. Centang/jumlah foto per slot, badge Diedit tanggal/jam audit correction terbaru di list/detail, galeri lintas part dengan horizontal swipe50px/vertical guard, tombol dan keyboard tetap. |
| Verifikasi | RED4/4 gagal sebelum implementasi; final focused20/20pass,4files,11.03s; independent review5/5pass. Final full634/634pass,55files,95.80s,exit0. Build/tsc0,2154modules,Vite2.68s. Scoped oxlint0error/8existingwarnings. CUA apps=[]/browsers=[]: rendered UI/native picker/touch visual PENDING. |
| Pelajaran | Draft sendiri sempat menghapus import isResolved sebelum start diubah; build1error dan full awal9fail/624pass menunjukkannya. Diperbaiki dengan canonical computeProgress. Review menemukan display/start menghitung retired responses meski save memakai template; seluruh jalur disamakan dan regression retained evidence ditambahkan. Full final dijalankan setelah source stabil. |
| Log Keyword | inspeksi-revisi-owner-enam-poin; ownership; foto_scanner; kondisi_krom; Diedit; swipe; retired progress |
| Deploy | LIVE DEMO 2026-10-21 - dpl_8GobwRp6BHwUUpkjVxFA6GFFLPdV READY; public HTML/JS/CSS200, JSindex-CDgRLwFP.js SHA2566073D8678165E22880A689B5EC0021553A67F8E6A762C29649F3892C0D361152 cocok dist. Artifact r3 dry28files/1,958,737bytes/0privatepaths. Visual PENDING. |

### Fix #62 - Multi foto setiap item inspeksi tanpa menimpa foto/jawaban

| Field | Detail |
|---|---|
| Tanggal | 2026-10-21 |
| File | src/components/PhotoSlot.tsx, src/pages/InspectionPage.tsx, src/context/PipelineContext.tsx, src/context/usePipelineData.ts, src/__tests__/inspectionMultiPhoto.test.tsx, architecture/05_BUSINESS_RULES.md |
| Masalah | Galeri setiap part kendaraan hanya memilih satu foto, kecuali Tools. Callback per-file berisiko menimpa refs dari render lama. |
| Akar | multiPhoto hanya metadata Tools; append UI membangun ulang vector dari closure. |
| Fix | Semua part inspeksi mendukung multi-select galeri. Promise.all mempertahankan urutan, satu canonical append per batch/item; error baca/format tidak commit parsial. Kamera satu foto. Phase guards tetap. Foto bukti non-foto mempertahankan jawaban/catatan. |
| Verifikasi | RED awal 3/3 gagal sebelum implementasi; focused 12/12 lulus; independent review 4/4 lulus; final full 629/629,54 files,104.37s,exit0. Tsc/build0,Vite2.76s; scoped oxlint0error/6existingwarnings. CUA apps=[]/browsers=[] sehingga rendered UI/native picker PENDING. |
| Pelajaran | Review menangkap kesalahan implementasi awal yang mengubah jawaban non-foto menjadi ADA; diperbaiki dan ditambah test BPKB TIDAK ADA/Nomor Rangka BERMASALAH. Tsc menangkap union mediaRefs dan diperbaiki dengan annotation. ESLint bukan tool repo; gunakan oxlint. |
| Log Keyword | inspeksi-multi-foto-per-item, onAddMany, addInspectionPhotos, Foto Kendaraan |
| Deploy | LIVE DEMO 2026-10-21 - dpl_GAYbJewDJ5YNUcQ9GSUbMrsALVif READY; public HTML/JS/CSS200, index-CuiyWBtl.js SHA256 F051CA88D62742E20A3CC5C7D4020844FC72358FE607879CA5310F2D99823381 cocok dist. Artifact r2:28 files/1,956,988 bytes/0 private paths. Visual/native picker PENDING. |

### Fix #61 - Terjadwal tidak boleh Tambah Kerusakan sebelum Mulai Inspeksi

| Field | Detail |
|---|---|
| Tanggal | 2026-10-21 |
| File | src/context/PipelineContext.tsx, src/__tests__/inspectionHistoryEditing.test.tsx, architecture/05_BUSINESS_RULES.md |
| Masalah | User masih dapat menambah kerusakan saat status Terjadwal dan belum menekan Mulai Inspeksi. |
| Akar | Regresi Fix #58: canEditInspection juga mengizinkan Terjadwal agar start/reschedule bekerja, lalu UI dan correctInspection memakai izin yang sama untuk content editing. |
| Fix | Pisahkan canManageInspection (eligibility latest/stage/downstream untuk start/reschedule) dari canEditInspection (Dalam Inspeksi/Selesai eligible). Enam jalur content mutation dan UI existing kini locked sebelum mulai. Tidak menghapus temuan lama; history correction sebelum purchase dan stale lock tetap. |
| Verifikasi | New2 stages lead/inspecting: UI tidak menawarkan Tambah Kerusakan,6commands tidak mengubah record; reschedule/start sukses kemudian addFinding sukses. Focused11/11pass,2files,12.07s; full625/625pass,53files,91.31s,VITEST_EXIT=0. Tsc/build0,2154modules,Vite7.74s; scopedlint0error/4existingwarnings. CUA apps=[]/browsers=[]: actual visual PENDING. |
| Pelajaran | Izin mengelola jadwal berbeda dari izin mengisi hasil. Uji awal6/6 sempat memuat source setelah edit karena startup lambat, sehingga tidak dipakai sebagai bukti RED sebelum fix; targeted/full stabil menjadi bukti akhir. Regresi berasal dari perubahan sendiri pada Fix #58 dan kini dicakup dua test baru. |
| Log Keyword | inspeksi-kunci-sebelum-mulai; canManageInspection; Terjadwal Tambah Kerusakan; regression Fix #58; Fix #61 |
| Deploy | LIVE DEMO 2026-10-21: https://bozzmobil-demo.vercel.app/bozzmobil/; dpl_CVMu6RqFG2TTrfgQqaeHYitd4veY READY.20261021-r1 dry-run28files/1,955,058bytes/0privatepaths; publicHTML/JS/CSS200; index-DclGb-nL.js SHA256B714DFC1E3D153843DA82AD204ED90C58F8E8D835D47BA30CB3AE757499B08B9 cocok dist. Report publikasi-demo-sementara-2026-10-21-r1.md; visual pending. |

### Fix #60 - Efek mouse halus global dan hover transition

| Field | Detail |
|---|---|
| Tanggal | 2026-10-20 |
| File | src/components/SoftPointer.tsx, src/App.tsx, src/index.css |
| Masalah | User ingin gerakan mouse terasa halus dengan efek visual. |
| Akar | Belum ada efek pointer/decorative feedback global. |
| Fix | Halo biru transparan mengikuti mouse dengan interpolasi requestAnimationFrame, hover ring pada kontrol dan press compression. Portal aria-hidden/pointer-events none; native cursor tetap. Fine mouse+hover+no-reduced-motion saja; touch/pen diabaikan, preference dinamis, hide saat blur/out/hidden. RAF berhenti saat settle dan semua listener/frame dibersihkan. Subtle hover transitions memakai low-specificity :where agar style komponen tetap berwenang. Tidak React render per move/layout reads/data changes. |
| Verifikasi | Existing App navigation20/20pass,1file,41.27s. Tsc/build exit0,2154modules,Vite7.05s; scopedlint0error/1existing App setState-effect warning. Tidak menambah test untuk efek dekoratif kecil. Test path storage awal salah .tsx (actual .ts) sehingga tidak terpilih; hasil20 hanya navigation, bukan storage. CUA apps=[]/browsers=[]: actual motion/touch/reduced-motion/visual PENDING. |
| Pelajaran | Pointer dekoratif harus menjaga native cursor, clicks, form selection dan preferensi gerak; hentikan animation loop saat idle. Build/JSDOM bukan bukti feel visual. |
| Log Keyword | soft-pointer-global; SoftPointer; mouse halo; pointer-events none; reduced motion; Fix #60 |
| Deploy | LIVE DEMO 2026-10-20: https://bozzmobil-demo.vercel.app/bozzmobil/; dpl_HnLP1XCV1vuVEZEqkZfZGe9usxdH READY. Artifact20261020-r1 dry-run28files/1,954,949bytes/0privatepaths; HTML/JS/CSS200; index-iWM9S4Ry.js SHA256BEA7948F9942C9442D4F94725D6DE5BD980A72A3096E4803A314A969EAF93D3E cocok dist. Report publikasi-demo-sementara-2026-10-20-r1.md; actual feel/visual pending. |

### Fix #59 - Popup hasil Catat Pembayaran, field wajib dan upload bukti lebih jelas

| Field | Detail |
|---|---|
| Tanggal | 2026-10-19 |
| File | SaleDetail, SalePaymentRows, PaymentResultDialog, PenjualanForm, FormSection, RupiahInput, salePaymentDraft, index.css, salePaymentFeedback.test.tsx |
| Masalah | Hasil submit hanya teks jauh di atas, field wajib tidak jelas dan native choose files samar pada pembayaran bertahap. |
| Akar | Tidak ada popup hasil/field-level preflight, label tidak menandai required dan file input native tanpa tombol kontras. |
| Fix | Animated accessible alertdialog hasil Catat Pembayaran, success setelah canonical command ok; failed draft/files retained. Shared row preflight tanggal/nominal positif/sumber/metode/bukti, Wajib diisi, field message/aria-invalid dan focus invalid setelah popup ditutup. Referensi/catatan optional. Visible Upload button minimum44px, filename/count/remove cards. Initial sale payment rows mendapat preflight/inline/file UI yang sama; main sale save success flow tetap. Reduced-motion/focus trap/Escape/body restoration; tanpa dependency baru atau perubahan ledger. |
| Verifikasi | RED2 sebelum wiring; focused3/3 dan independent review clear. Full623/623pass,53files,119.69s,VITEST_EXIT=0. Tsc/build exit0,2153modules,Vite8.19s; scopedlint0error/3existing RupiahInput warnings. No receipt on invalid, focus invalid, failed domain retains draft/files, success after real receipt. CUA apps=[]/browsers=[]: actual visual/animation/native chooser PENDING. |
| Pelajaran | Popup gagal harus memberi tindakan koreksi dan inline context, bukan membuang draft. Sukses command tidak sama dengan durable IndexedDB; indikator Tersimpan tetap acuan. aria-required tidak boleh mengubah referensi/catatan optional menjadi wajib. |
| Log Keyword | penjualan-feedback-pembayaran; PaymentResultDialog; paymentDraftIssues; required field feedback; visible file upload; Fix #59 |
| Deploy | LIVE DEMO 2026-10-19: https://bozzmobil-demo.vercel.app/bozzmobil/; dpl_GFzMtvNxQQZKis7aA9GZeNnHi1y2 READY. R13 dry-run28files/1,952,100bytes/0privatepaths; HTML/JS/CSS/cars200,/.env.local404; index-t1yLSxDD.js SHA2567A083A64C63F8399D0E5B86A6EE5D01A10E334FD415EF63B683D6620E7DC8ADF cocok dist. Report publikasi-demo-sementara-2026-10-19-r13.md; visual pending. |

### Fix #58 - Koreksi Riwayat Inspeksi sebelum diteruskan ke Pembelian

| Field | Detail |
|---|---|
| Tanggal | 2026-10-19 |
| File | PipelineContext, usePipelineData, InspectionPage, pipeline.ts, inspectionHistoryEditing.test.tsx, architecture/05 |
| Masalah | Semua Riwayat Inspeksi terkunci sehingga inspector tidak bisa mengoreksi foto/informasi sebelum Lanjutkan ke Pembelian; perintah simpan lama belum mengunci downstream. |
| Akar | UI memakai tab history/status selesai sebagai larangan mutlak; checklist/findings commands tidak memeriksa latest round dan tahap unit. Inspection commands membaca render closure sehingga ref-aware forwarding dapat disusul stale completion. |
| Fix | Shared canEditInspection latest-only sebelum purchase/downstream; checklist/foto/findings/status penilaian/reason guarded. Completed corrections tetap pada record sama, progress derived dan event inspection_corrected; keputusan/time/relasi tidak dibuka ulang. History category drawer dan Edit Foto Kendaraan aktif bila eligible, preview tetap, completed result panel tetap. Source notes autosave; failed forward tidak navigasi. Inspection state/ref setter sinkron; start/complete/reschedule membaca ref+shared guard, forwarding latest-only. |
| Verifikasi | RED3 sebelum implementasi; final focused9/9 dan independent review/repro clear. Full621/621pass,52files,86.86s,VITEST_EXIT=0. Tsc/build exit0,2152modules,Vite1.94s; scopedlint0error/6existingwarnings. UI test memilih Tahun, delete/upload replacement photo bytes, reopen saved value dan open drawer disabled setelah purchase. Domain test locks6mutationpaths same tick; stale start/complete/reschedule false. Browser CUA apps=[]/browsers=[]: actual visual PENDING. |
| Pelajaran | Review draft menemukan stale complete dapat menolak/memundurkan unit setelah forwarding; diperbaiki sebelum deploy dan ditambah regression retaining callback. Full pertama saat source berubah+build paralel619pass/2fail (stale test oldcode dan QC5s timeout); final stabil621/621 tanpa menaikkan timeout. Test UI awal ambiguous karena preview dan editor menampilkan judul foto sama; query kini scoped dialog/exact edit action. TS regression kurang argumen reason diperbaiki sebelum build final. |
| Log Keyword | inspeksi-koreksi-sebelum-pembelian; canEditInspection; inspection_corrected; stale completion purchase; Fix #58 |
| Deploy | LIVE DEMO 2026-10-19: https://bozzmobil-demo.vercel.app/bozzmobil/; dpl_Fq1hWAaZWKu7FmAreH419oomCJVB READY. R12 dry-run28files/1,945,379bytes/0private paths; HTML/JS/CSS/cars200,/.env.local404; index-xB2Ogobx.js SHA25607BA9A9C214979756D47212559FFFD634FB9D3FE94F2EDD1C9A3B793DC6625D0 cocok dist. Report publikasi-demo-sementara-2026-10-19-r12.md; visual pending. |

### Fix #57 - Dropdown Transmisi dan Tahun pada Dokumen Identitas Inspeksi

| Field | Detail |
|---|---|
| Tanggal | 2026-10-19 |
| File | src/pages/InspectionPage.tsx |
| Masalah | Tahun dan Transmisi inspeksi masih berupa input teks bebas. |
| Akar | Generic checklist text renderer tidak membedakan dua field identitas ini. |
| Fix | Dua controlled select khusus pada doc_tahun/doc_transmisi. Transmisi memakai shared TRANSMISSION_OPTIONS milik Leads (AT/MT/EV/Hybrid). Tahun empat digit1900 sampai tahun berjalan+1, urut menurun. Nilai lama di luar opsi tetap terlihat sebagai disabled legacy option; AT/MT legacy dipetakan untuk display tanpa mutation saat load. Handler simpan ChecklistResponse dan disabled history existing dipertahankan; tidak mengubah car/schema/enum/checklist template. |
| Verifikasi | Existing inspection/history/photo/STNK/freshLifecycle/leadFormRevision tests35/35pass,5files,17.72s. Build/tsc exit0,2152modules,Vite2.68s. Scopedlint0error/1existing Date.now warning. Source traced controlled value/onChange/read-only; interaksi dropdown baru dan actual visual PENDING karena CUA apps=[]/browsers=[]. Tidak menambah test untuk perubahan UI kecil ini. |
| Pelajaran | Label AT/MT menggunakan nilai canonical Otomatis/Manual shared; jangan menghapus nilai inspeksi lama hanya karena opsi input berubah. |
| Log Keyword | inspeksi-dropdown-tahun-transmisi; doc_tahun; doc_transmisi; TRANSMISSION_OPTIONS; Fix #57 |
| Deploy | LIVE DEMO 2026-10-19: https://bozzmobil-demo.vercel.app/bozzmobil/; dpl_B9bT6LSbYNxxgGtrEKZpWg9zeAHA READY. Artifact r11 dry-run28files/1,942,760bytes/0private paths; public HTML/JS/CSS/cars200,/.env.local404; index-CCwqtPbH.js SHA256DA77D473825BC3891CB43C5F1AEB9FDAA0FF0E859D7F2C41DB42DCE42B75BFD4 cocok dist. Report publikasi-demo-sementara-2026-10-19-r11.md. Interaksi dropdown/visual PENDING. |

### Fix #56 - Laporan Keuangan menampilkan bukti pembayaran pembelian, penjualan dan refund

| Field | Detail |
|---|---|
| Tanggal | 2026-10-19 |
| File | src/lib/financeReport.ts, src/pages/FinanceReportPage.tsx, src/components/FinanceProofLinks.tsx, src/__tests__/financeProofs.test.tsx, architecture/05_BUSINESS_RULES.md |
| Masalah | Bukti upload pada modul sumber belum dapat dilihat dari Laporan Keuangan. |
| Akar | CashMovement/FinanceTransaction hanya memproyeksikan nominal dan referensi; UI tidak memiliki kolom bukti. |
| Fix | Proyeksi read-only proof PaymentEntry/refund dan SaleDocument yang cocok saleId/receiptId/kategori. Rekap mengagregasi bukti transaksi tanpa mengubah kas; Arus Kas menyajikan bukti masing-masing pembayaran. Multi bukti tetap terpisah; umum/KTP/foreign proof dikecualikan. Legacy filename ditandai file belum tersedia; URL executable tidak menjadi link. Banner diperbarui sesuai IndexedDB existing. CSV tidak berisi URL blob sementara. |
| Verifikasi | RED3/3 sebelum implementasi; targeted16/16 pass dan independent review no blocker. Full617/617pass,51files,95.16s,VITEST_EXIT=0. Tsc/build exit0,2152modules,Vite2.24s; scopedlint0error/0warning. UI integration real provider membuktikan source replacement/removal memperbarui laporan tanpa perubahan receipt. CUA apps=[]/browsers=[]: actual rendered visual PENDING. |
| Pelajaran | Bukti mengikuti pembayaran individual, bukan seluruh dokumen transaksi. Test awal salah mengasumsikan transaksi pertama adalah sale padahal purchase juga direkap; diganti explicit kind lookup. Script edit awal gagal matching Unicode di pipeline PowerShell (tidak menulis file); diperbaiki memakai apply_patch. |
| Log Keyword | keuangan-bukti-pembayaran; FinanceProofLinks; CashMovement proofs; finance receipt evidence; Fix #56 |
| Deploy | LIVE DEMO 2026-10-19: https://bozzmobil-demo.vercel.app/bozzmobil/; dpl_5SKZ2YS7QYZXnAj7jnhEsE8oPiDe READY. Artifact r10 dry-run28files/1,941,937bytes/0private paths; HTML/JS/CSS/cars200,/.env.local404; index-CxLKDVTh.js SHA25600A660A0998009EE35EE31514B68D020048715A1DD84D0EAEEDA5CF22163FE3E cocok dist. Report publikasi-demo-sementara-2026-10-19-r10.md. Actual visual PENDING. |

### Fix #55 - Diagnostik record lokal dan penolakan angka unit invalid sebelum state berubah

| Field | Detail |
|---|---|
| Tanggal | 2026-10-19 |
| File | PipelineContext, pipelineSnapshot, LeadsPage, saleBankPersistence.test.tsx |
| Masalah | Screenshot menunjukkan penyimpanan lokal gagal dengan pesan umum. Data spesifik screenshot belum dapat diakses/reproduksi. |
| Akar | Kandidat teruji: addCar/saveCarCorrections menerima angka negatif/non-finite, tetapi snapshot menolaknya. Ini penyebab yang dapat direproduksi, bukan konfirmasi akar data screenshot. |
| Fix | Guard angka unit sebelum mutation, error form saat add gagal, diagnostics aman id.field tanpa isi data sensitif. Tidak reset/menghapus/mengonversi record lama. |
| Verifikasi | RED lalu2/2 persistence/guard tests pass; full613/613,50files,99.65s; tsc/build exit0. Exact screenshot/visual tetap PENDING. |
| Pelajaran | Reproduksi error di boundary write sebelum menyalahkan enum QC atau menghapus penyimpanan. Field path membantu mengisolasi record tanpa membocorkan nilai. |
| Log Keyword | penjualan-rekening-multi-pembayaran; isi record lokal tidak valid; mileage; addCar; saveCarCorrections; Fix #55 |
| Deploy | LIVE DEMO 2026-10-19 bersama Fix #54, dpl_8vhx8dS1Et2BeExY66KD7PHENvKH READY/HTTP+hash cocok; data screenshot spesifik belum direproduksi. |

### Fix #54 - Rekening pembeli dan pembayaran penjualan bertahap dengan bukti per penerimaan

| Field | Detail |
|---|---|
| Tanggal | 2026-10-19 |
| File | PenjualanForm, SaleDetail, SalePaymentRows, salePaymentDraft, saleLedger, PipelineContext, pipelineSnapshot, saleCompleteness, SaleUploadGrid; 3 test files baru dan existing navigation/completeness tests; architecture/05 |
| Masalah | Rekening pembeli belum tersedia; user membutuhkan beberapa pembayaran, masing-masing nominal/tanggal/bukti, untuk Cash dan Credit. |
| Akar | Form tidak membawa rekening dan penerimaan baru masih single-row/terpisah dari bukti; ledger belum memiliki operasi batch yang menyiapkan seluruh bukti sebelum publish. |
| Fix | Rekening string optional berpasangan, nol depan utuh; Supplier autofill master menjadi snapshot transaksi. Initial/later batch pada sale yang sama, staged canonical receipt validation, cap Customer/Leasing, duplicate token/reference dan overpayment guard; URL proof dipersiapkan sebelum satu publish. Setiap pembayaran baru wajib bukti, dapat multi-file. Riwayat/detail dan checklist menghubungkan setiap bukti ke receipt; penggantian Tunai/Cek memakai Faktur/Kwitansi. Snapshot v1 backward compatible dan IndexedDB menyimpan bytes bukti. |
| Verifikasi | Full 613/613 pass,50 files,99.65s,VITEST_EXIT=0; review independen14/14 pass/no blocker. tsc/build exit0,2151modules,Vite2.60s; scoped oxlint0error/6existing warnings. IndexedDB save/load memverifikasi bytes proof, rekening dan append setelah reopen. CUA apps=[]/browsers=[]: visual PENDING. |
| Pelajaran | Review menemukan draft implementasi menggugurkan receiptId saat mengganti Faktur Tunai/Cek; RED2 lalu ledger/UI diperbaiki dan UI integration memverifikasi link history tetap ada. Monitoring bukti harus mencakup semua metode. General upload tidak berarti pembayaran. |
| Log Keyword | penjualan-rekening-multi-pembayaran; SaleReceiptDraft; receiveBatch; accountNumber; Faktur/Kwitansi receiptId; Fix #54 |
| Deploy | LIVE DEMO 2026-10-19: https://bozzmobil-demo.vercel.app/bozzmobil/; dpl_8vhx8dS1Et2BeExY66KD7PHENvKH READY. Artifact r9/dry-run28files/1,940,194bytes/0private paths. HTML/JS/CSS200; /.env.local404; index-BxOG82YK.js SHA25689066D25D1184E5CB1F197D15F2847590DC15C88A140FF700D2A5F8411F992E0 cocok dist. Report publikasi-demo-sementara-2026-10-19-r9.md. Visual PENDING. |

### Fix #53 - QC IN input hanya Layak Jual atau Perlu Perbaikan

| Field | Detail |
|---|---|
| Tanggal | 2026-10-19 |
| File | src/data/qc.ts, src/pages/QcInPage.tsx, src/context/PipelineContext.tsx, src/__tests__/qcInResultOptions.test.tsx, architecture/05/06 |
| Masalah | Owner menghapus pilihan input TIDAK LAYAK JUAL pada QC. |
| Akar | Daftar UI dan guard completion memakai union hasil historis sekaligus untuk input baru. Stale active record dapat membawa hasil lama menjadi pilihan tersembunyi. |
| Fix | Current QC_IN_INPUT_RESULTS berisi LAYAK JUAL/PERLU PERBAIKAN dan isQcInInputResult dipakai pada UI/completeQcIn. Stale active result tidak otomatis dipilih; user wajib memilih opsi current. Broad QcInResult/isQcInResult tetap untuk read/history/snapshot legacy; record lama, filter hasil, finding, notes dan reinspection chain tidak ditimpa. QC OUT/BAST tidak berubah. |
| Verifikasi | RED3/3 sebelum implementasi; targeted18/18 pass, 3 files, 11.13 s. Full603/603 pass, 47 files, 91.39 s, VITEST_EXIT=0. tsc/build exit0, 2149 modules, Vite2.29 s; scoped lint0error/8warning existing. Review independen clear dan3/3 focused pass. Browser apps=[]/browsers=[]: visual PENDING. |
| Pelajaran | Menghapus pilihan input tidak berarti menghapus sejarah enum. Pisahkan validasi input dari pembacaan arsip. Tes stale awal mengharapkan alert padahal submit native memang disabled saat hasil belum dipilih; assertion diperbaiki menjadi disabled dan record tetap aktif. |
| Log Keyword | qc-in-dua-pilihan; QC_IN_INPUT_RESULTS; discontinued result; TIDAK LAYAK JUAL; Fix #53 |
| Deploy | LIVE DEMO 2026-10-19: https://bozzmobil-demo.vercel.app/bozzmobil/; dpl_AcEpmr6a5VMvtKgtK8UfMGMxxjZe READY. Artifact r8/dry-run28files/1,933,258bytes/0private paths. HTML/JS/CSS/cars200, /.env.local404; SHA256 CA9F1D0722240B162B36AC4CA4773D58F49EA41E14929F1DA6F06A8CAFF10FB2 cocok dist. Report publikasi-demo-sementara-2026-10-19-r8.md; visual pending. |

### Fix #52 - Masuk Stock hanya setelah input Proses Pembelian berhasil diajukan

| Field | Detail |
|---|---|
| Tanggal | 2026-10-19 |
| File | src/components/StockEntryButton.tsx, src/context/PipelineContext.tsx, src/__tests__/stockPurchaseSubmission.test.tsx, purchaseRefund.test.tsx, freshLifecycle.test.tsx, architecture/07_PURCHASE_PAYMENT.md |
| Masalah | Owner meminta MASUK STOCK disembunyikan sebelum input Proses Pembelian selesai; tombol muncul setelah pengajuan pembelian berhasil. |
| Akar | Fix #37 mewajibkan konfirmasi saldo tetapi belum mewajibkan submission pembelian. Harga beli dari inspeksi sudah cukup membentuk snapshot, sehingga unit tanpa form submitted masih bisa dipindah. |
| Fix | Shared button mensyaratkan canonical PURCHASE_UNIT request, stage purchasing, belum stock/rejected. Command enterStockUnit wajib request untuk carKey yang sama sebelum guard saldo existing; generic advance ikut terlindungi. enteredPurchaseProcess/legacy submitted flags bukan bukti submission. Paid canonical auto-Stock dan unpaid/partial review tetap berlaku. Tidak mengubah PaymentStore atau unit yang sudah masuk stok. |
| Verifikasi | New RED 3 fitur + 1 fixture invalid-plate yang dikoreksi, GREEN 4/4. Targeted 29/29 pass, 3 files, 8.65 s; full 600/600 pass, 46 files, 87.61 s, VITEST_EXIT=0. npx.cmd tsc -b/npm.cmd run build exit 0, 2149 modules, Vite 2.60 s; scoped lint 0 error/4 Fast Refresh warning existing. Review independen clear dan 4/4 focused pass. CUA apps=[]/browsers=[]: visual PENDING. |
| Pelajaran | Review nominal dan kelengkapan pengajuan adalah dua gate berbeda. Gunakan canonical request synchronous, bukan flag React atau kunjungan halaman; handler lunas masih dapat membaca request yang sama sebelum render. Tes koreksi plate kosong semula salah karena command koreksi memang menolak plate invalid; gunakan initial fixture invalid untuk menguji submit gagal. |
| Log Keyword | stock-setelah-input-pembelian; purchase submission gate; MASUK STOCK; follow-up Fix #37; Fix #52 |
| Deploy | LIVE DEMO 2026-10-19: https://bozzmobil-demo.vercel.app/bozzmobil/; dpl_6j2ztzXNL1AH1iSr1KfgjQziVWae READY. Artifact r7, dry-run 28 file/1,933,290 bytes/0 private paths. HTML/JS/CSS/cars HTTP 200, /.env.local 404; SHA256 BC4C85349E1248097351FB0BD95F64FCD6AC52B112DFD19DC487441656D27542 cocok dist. Report publikasi-demo-sementara-2026-10-19-r7.md; visual pending. |

### Fix #51 - Kartu QC IN Dalam Perbaikan membuka daftar unit terkini

| Field | Detail |
|---|---|
| Tanggal | 2026-10-19 |
| File | src/pages/QcInPage.tsx, src/__tests__/qcInRepairSummary.test.tsx |
| Masalah | Ringkasan QC IN hanya menampilkan total/dalam proses; owner meminta jumlah unit dalam perbaikan yang bisa diklik untuk melihat daftar. |
| Akar | Hasil PERLU PERBAIKAN sudah ditampilkan sebagai DALAM PERBAIKAN di tabel/filter, tetapi belum memiliki summary action yang memakai selector hasil terkini. |
| Fix | Tambah native button DALAM PERBAIKAN dengan jumlah operational units dari getQcDisplayStatus. Klik kembali ke Proses QC IN, reset query/schema, pilih status repair dan tutup drawer. Unit sold preBAST tetap dihitung, final BAST/historical repair yang sudah pass/active IN tidak dihitung. Count unik per carKey canonical, tanpa perubahan record. Tiga kartu sejajar pada sm+, satu kolom mobile, catatan full-width; pressed/focus dan empty-state spesifik. |
| Verifikasi | RED 2/2 sebelum kartu; regression empty-state juga RED lalu GREEN. Targeted 18/18 pass, 3 files, 6.88 s. Review independen clear dan 2/2 focused pass. Full 596/596 pass, 45 files, 84.69 s, VITEST_EXIT=0. tsc/build exit 0, 2149 modules, Vite 2.10 s; scoped lint 0 error/4 warning hook existing. Browser apps=[]/browsers=[]: visual PENDING. |
| Pelajaran | Hitungan kartu dan daftar harus memakai hasil terkini, bukan pernah memiliki hasil repair. Summary click perlu menghapus filter lain agar angka tidak menjanjikan jumlah yang tersembunyi. Query awal tes menemukan note dua kali di history/detail; assertion diperbaiki untuk tampilan existing tersebut. |
| Log Keyword | qc-in-kartu-perbaikan; QC IN DALAM PERBAIKAN; repair summary; Fix #51 |
| Deploy | LIVE DEMO 2026-10-19: https://bozzmobil-demo.vercel.app/bozzmobil/; dpl_8FmB6WQwnUdnyN9QscCZg3Crvnck READY. Artifact r6/dry-run 28 files, 1,933,105 bytes, 0 private paths. HTML/JS/CSS/cars HTTP 200, /.env.local 404; SHA256 BAA9585C97D4E1E434CEF713BDAC8F8F178534A76F5E8360A439D8EC5E1A68B2 cocok dist. Report publikasi-demo-sementara-2026-10-19-r6.md; visual pending. |

### Fix #50 - Penjualan hasil QC negatif wajib disertai Catatan QC canonical

| Field | Detail |
|---|---|
| Tanggal | 2026-10-19 |
| File | lib/saleEligibility.ts, context/PipelineContext.tsx, components/PenjualanForm.tsx, SaleDetail.tsx; saleQcParallel/saleEligibility/readySaleUnits tests; architecture/04/05 |
| Masalah | Klarifikasi owner setelah Fix #49: penjualan hasil PERLU PERBAIKAN/TIDAK LAYAK JUAL harus disertai Catatan QC. |
| Akar | Fix #49 mengizinkan hasil IN apa pun, tetapi belum mensyaratkan catatan dan detail/form hanya menampilkan status QC. |
| Fix | Selector getSaleQcIn menyatukan sumber eligibility dan catatan form/detail pada latest completed IN canonical. Hasil non-LAYAK JUAL memerlukan notes.trim() nonkosong; undefined/kosong/spasi ditolak di shared eligibility dan commitSale dengan pesan spesifik. Catatan lama atau draft reinspection tidak menggantikan catatan hasil terbaru. Replay existing sale tetap idempotent; tidak menimpa hasil/history atau menyalin note ke record terpisah. |
| Verifikasi | RED 4/10 (guard 2 hasil, old/draft note, tampilan), GREEN 10/10. Full 594/594 pass, 44 files, 88.88 s, exit 0; npx.cmd tsc -b dan npm.cmd run build exit 0, 2149 modules, Vite 2.43 s. Scoped lint 0 error/4 warning Fast Refresh existing. Independent review clear dan 10/10 focused tests pass. CUA apps=[]/browsers=[]: visual PENDING. |
| Pelajaran | Izin hasil negatif bukan izin kehilangan penjelasan kondisi. Read-only QC selesai tidak ditulis ulang; pemeriksaan ulang dipakai bila data lama belum memiliki catatan. Catatan harus berasal dari hasil pemeriksaan yang menjadi dasar transaksi. |
| Log Keyword | penjualan-qc-paralel; qc-note-required; Catatan QC IN; Fix #50; follow-up Fix #49 |
| Deploy | LIVE DEMO 2026-10-19: https://bozzmobil-demo.vercel.app/bozzmobil/; dpl_Bf7GieGjZKcgmpZvVh6BQgzwBG6K READY. r5 dry-run 28 file/1,931,507 bytes, 0 private paths. HTML/JS/CSS/cars 200, /.env.local 404; SHA256 AFAC3C92990138351D4E265F10D33D5DCA1F340E35671D8981A21DBCB554D9C8 cocok dist. Laporan publikasi-demo-sementara-2026-10-19-r5.md. Visual pending. |

### Fix #49 - Penjualan boleh berjalan dengan hasil QC IN perbaikan atau tidak layak

| Field | Detail |
|---|---|
| Tanggal | 2026-10-19 |
| File | lib/saleEligibility.ts, lib/inventory.ts, context/PipelineContext.tsx, pages/QcInPage.tsx, components/ReadySaleUnits.tsx, PenjualanForm.tsx, SaleDetail.tsx, QcOutDetailDrawer.tsx; 5 regression files dan architecture/04/05/06 |
| Masalah | Revisi owner memperbolehkan Proses Penjualan dengan QC IN PERLU PERBAIKAN/TIDAK LAYAK JUAL dan QC IN/OUT tetap berjalan selama penjualan. |
| Akar | Eligibility mengikat penjualan pada available/LAYAK JUAL/no blocker/no active IN; command/UI QC IN hanya menerima stage qc. Label CERTIFIED statis dapat salah menggambarkan hasil pemeriksaan. |
| Fix | Eligibility canonical qc/available + Stock READY + latest completed IN hasil valid apa pun; reinspection aktif diperbolehkan setelah satu IN selesai. commitSale tetap tunggal/idempotent dan menolak rejected purchase. IN tersedia qc/available/sold sebelum BAST; draft/completion terkunci setelah final. Retry IN/OUT record baru tanpa menimpa history; hasil QC tampil pada form, daftar eligible dan detail sale. Tidak rollback sold, auto-resolve atau melonggarkan hasil LAYAK JUAL/SIAP SERAH maupun BAST. |
| Verifikasi | RED awal 5/5, GREEN 5/5; tambahan detail/OUT retry RED 1/6 lalu GREEN. Targeted 51/51 pass, 8.29 s. Full 590/590 pass, 44 files, 95.09 s; tsc/build berhasil, 2149 modules, Vite 2.10 s. Lint 0 error/8 warning existing. Review independen tanpa blocking finding, menjalankan 6/6 test baru. Browser apps=[]/browsers=[]; visual PENDING. |
| Pelajaran | Izin memulai transaksi berbeda dari hasil pemeriksaan dan izin serah terima. Menghapus gate QC pada tombol saja gagal pada commit/stage; perubahan harus menyentuh command canonical dan akses pemeriksaan selama sale. Tes kebijakan lama diperbarui tanpa mengubah validator hasil/finding chain. |
| Log Keyword | penjualan-qc-paralel; QC IN repair sale; QC IN sold; TIDAK LAYAK JUAL; Fix #49 |
| Deploy | LIVE DEMO 2026-10-19: https://bozzmobil-demo.vercel.app/bozzmobil/; dpl_9hQMrhTVUwpYmPj4DCiL5jaXhEna READY. Artifact r4, dry-run 28 file/1,930,720 bytes/0 private paths. HTML/JS/CSS/cars 200, /.env.local 404; SHA256 bundle cocok dist. Full ulang dengan npm notifier disabled: 590/590, 44 files, 70.41 s, VITEST_EXIT=0 (wrapper PowerShell redirect awal terpengaruh npm notice). Visual pending. Laporan publikasi-demo-sementara-2026-10-19-r4.md. |

### Fix #48 - Status hasil QC dan pemeriksaan ulang IN/OUT tanpa menimpa riwayat

| Field | Detail |
|---|---|
| Tanggal | 2026-10-19 |
| File | src/lib/qcDisplayStatus.ts; src/lib/qcInRepairs.ts; src/lib/inventory.ts; src/data/qc.ts; src/context/PipelineContext.tsx; src/pages/QcInPage.tsx; src/pages/QcOutPage.tsx; src/pages/StockUnitPage.tsx; src/components/QcOutDetailDrawer.tsx; src/components/FindingEditor.tsx; src/__tests__/qcResultRetry.test.tsx; architecture/05_BUSINESS_RULES.md; architecture/06_STATUS_AND_UNIT_CATEGORIES.md |
| Masalah | Record selesai yang masih perlu perbaikan ditampilkan SELESAI; OUT tidak punya aksi ulang dan findings tidak diwariskan. Sold sebelum BAST tidak bisa mengakses OUT sehingga dua tes lifecycle lama gagal. |
| Akar | Badge memakai completion status, bukan hasil. OUT completed drawer hanya read-only, start tidak membawa repair chain, guard selector/command menganggap sold sudah keluar tanpa melihat BAST. |
| Fix | Derived label IN DALAM PERBAIKAN/TIDAK LAYAK JUAL/LAYAK JUAL dan OUT TUNDA SERAH/SIAP SERAH pada daftar/detail/Stock/filter; tidak mengganti enum record. OUT ulang membuat record baru, checklist kosong, unresolved findings linked dan history read-only. SIAP SERAH memeriksa historical blocker; edit mengganti finding by ID dan melindungi reference/area/flag inherited. OUT tersedia untuk available/sold sebelum BAST, final BAST/rejected/active menolak start. Latest completed tie memilih record terakhir. Predicate BAST/latest-authority dan note waiver Fix #47 tetap. |
| Verifikasi | RED awal 5/5 baru gagal; RED tie selector memilih record lama; RED inherited reference tidak terkunci. Targeted 17/17 (6 baru + 6 IN repair + 5 lifecycle) pass sebelum tambahan lock assertion, 11.06 s. Final full --maxWorkers=2 585/585 pass, 43 files, 72.37 s; semua 6 regression baru dan 2 tes lama QC OUT setelah sale lulus. tsc/build exit 0, 2149 modules, Vite 2.36 s; lint scope 0 error/8 warning lama. Review dua temuan diperbaiki, recheck clear. Browser inventory kosong, visual PENDING. |
| Pelajaran | SELESAI adalah status record, bukan hasil lolos. Retry harus membawa history blocker dan menjaga link; sekadar tombol ulang dapat membuat verifikasi buntu/terlewat. Selector completedAt descending + first salah pada timestamp sama; ascending + last selaras dengan urutan append. Percobaan test awal memakai label uppercase padahal tombol lama Selesaikan QC OUT; query case-insensitive diperbaiki. |
| Log Keyword | status-qc-pemeriksaan-ulang, Fix #48, qc-result-status, qc-out-retry, repair-chain-out, sold-before-bast, qa-leads-qcout-bast |
| Deploy | LIVE DEMO 2026-10-19 https://bozzmobil-demo.vercel.app/bozzmobil/; dpl_EoQntS7eZQk5hkagR2dMeHe2RDAU READY. Public HTML/JS/CSS/cars 200/hash sama lokal; visual pending. Laporan publikasi-demo-sementara-2026-10-19-r3.md. Tidak Supabase/schema baru/persistence/PaymentStore/reset/commit/push. |

---

### Fix #47 - QC IN PERLU PERBAIKAN boleh submit dengan catatan pengganti bukti

| Field | Detail |
|---|---|
| Tanggal | 2026-10-19 |
| File | src/data/qc.ts; src/context/PipelineContext.tsx; src/pages/QcInPage.tsx; src/__tests__/qcInCompletionNote.test.tsx; architecture/05_BUSINESS_RULES.md |
| Masalah | Setelah Fix #46 menampilkan error yang spesifik, user meminta hasil PERLU PERBAIKAN tetap bisa disubmit dengan Catatan QC meskipun TEMUAN/BERMASALAH belum memiliki foto atau finding terkait. |
| Akar | Validator evidence dipakai sama untuk semua hasil QC; catatan global tidak dipertimbangkan sebagai alternatif pada hasil perbaikan. |
| Fix | Shared validateQcInChecklist pada UI dan command mengizinkan catatan nonblank sebagai pengganti evidence hanya untuk PERLU PERBAIKAN. Catatan payload atau draft dipakai; explicit kosong/spasi tetap ditolak bila evidence kurang. Alasan N/A per item, hasil lainnya, validator generic/QC OUT dan blocker sale tetap strict. Simpan notes/responses/findings existing, tanpa jawaban BAIK/auto-resolve/advance. Label dan bantuan Catatan QC menjelaskan ketentuan. |
| Verifikasi | RED 2/7 test baru gagal; targeted 10/10 pass (7 baru + 3 feedback existing), 7.64 s. Dua kasus tambahan QC OUT command dan checklist-only tanpa blocker lulus dalam full suite. Full --maxWorkers=2: 577 pass/2 gagal lama QC OUT dari 579 tests, 42 files, 66.28 s; semua 9 tes baru lulus. Default run awal 574 pass/4 fail dari 578: 2 gagal lama + 2 UI timeout 5 s saat parallel build, tanpa assertion gagal; rerun membatasi worker tanpa menaikkan timeout. tsc/build exit 0, 2148 modules, Vite 4.22 s; lint scope 0 error/8 warning lama. Review tanpa temuan; Browser inventory kosong, visual PENDING. |
| Pelajaran | Pengecualian hasil perbaikan harus ditetapkan di command, bukan UI saja, dan jangan melonggarkan QC OUT/hasil saleable. Catatan tersimpan pada field existing, sehingga snapshot/reopen tetap utuh. Tes awal mengasumsikan teks catatan tampil sekali padahal tabel dan drawer sama-sama menampilkannya; assertion diperbaiki tanpa mengubah produk. |
| Log Keyword | qc-in-catatan-perbaikan, Fix #47, repair-note-evidence, validateQcInChecklist, missing-finding-proof, Fix #46 |
| Deploy | LIVE DEMO 2026-10-19: https://bozzmobil-demo.vercel.app/bozzmobil/; dpl_HNZxDqutRTGuAjpySB16XLYPvE9L READY. HTML/JS/CSS/cars 200, hash bundle cocok dist lokal. Visual browser PENDING; laporan publikasi-demo-sementara-2026-10-19-r2.md. Tidak Supabase/schema/storage baru/PaymentStore/QC OUT/BAST, commit/push atau mengubah data user. |

---

### Fix #46 - Submit QC IN memberi pesan bloker umum meskipun hasil PERLU PERBAIKAN

| Field | Detail |
|---|---|
| Tanggal | 2026-10-19 |
| File | src/pages/QcInPage.tsx; src/__tests__/qcInCompletionErrors.test.tsx |
| Masalah | User memilih PERLU PERBAIKAN dan submit gagal; UI menyalahkan bloker/hasil tanpa menyebut checklist mana yang invalid. Penyebab spesifik data user tidak terbaca dari screenshot/browser sesi ini. |
| Akar | completeQcIn sudah mengizinkan PERLU PERBAIKAN dengan blocker unresolved, tetapi juga memvalidasi alasan N/A dan evidence temuan. Semua boolean false ditampilkan sebagai satu pesan bloker pada handleComplete. |
| Fix | Sebelum memanggil command, jalankan validator checklist existing dengan template version record, responses dan findings yang sama; tampilkan seluruh error beserta label item melalui alert multi-line. Pesan blocker khusus LAYAK JUAL; fallback hasil non-saleable meminta cek status data terbaru. Tidak melonggarkan validator/domain guard atau mengubah record user. |
| Verifikasi | RED 1/3 test baru gagal karena detail/alert tidak ada; 2 test membuktikan domain sudah menerima hasil perbaikan dan menolak LAYAK JUAL dengan blocker. GREEN targeted 9/9 pass (3 baru + 6 repair-chain UI), 2 files, 7.52 s. Tes alasan N/A → isi alasan → submit sukses PERLU PERBAIKAN dengan blocker tetap UNRESOLVED/stage qc. Full 568 pass/2 gagal lama QC OUT dari 570 tests, 41 files, 42.66 s. tsc/build exit 0, 2148 modules, Vite 5.13 s. Lint 0 error/4 warning hook lama. Browser inventory kosong, visual PENDING. |
| Pelajaran | Jangan menyimpulkan blocker sebagai penyebab setiap penolakan command boolean; tampilkan validator existing, jangan menghapus blocker atau mengubah hasil agar bisa submit. Screenshot tidak memperlihatkan semua jawaban checklist; diagnosis item user menunggu retry/pesan rinci. Perilaku Fix #32 tetap dipertahankan. |
| Log Keyword | qc-in-submit-validasi, Fix #46, repair-outcome-blocker, checklist-validation-feedback, qc-na-reason, Fix #32 |
| Deploy | LIVE DEMO 2026-10-19: https://bozzmobil-demo.vercel.app/bozzmobil/; dpl_86nvn47gCtNNA8uFpchWn2Z65rq4 READY. HTML/JS/CSS 200 dan hash cocok dist. Visual/repro data user PENDING. Laporan publikasi-demo-sementara-2026-10-19-r1.md. Tidak Supabase/persistence/PaymentStore/QC OUT/BAST, commit/push atau menghapus data. |

---

### Fix #45 - Hapus foto wajib inspeksi sulit diakses: kontrol hanya muncul saat hover

| Field | Detail |
|---|---|
| Tanggal | 2026-10-17 |
| File | src/components/PhotoSlot.tsx; src/__tests__/inspectionPhotoDelete.test.tsx |
| Masalah | Inspector kesulitan menghapus foto salah pada kartu foto wajib; tombol ikon tersembunyi tanpa hover. Foto tambahan hanya badge/Lihat dan tidak punya hapus per foto. |
| Akar | Card variant memakai overlay opacity-0/group-hover untuk action utama dan hanya onRemove(0); extra refs tidak dirender sebagai thumbnail yang memiliki kontrol sendiri. Handler penghapusan canonical sebenarnya sudah mendukung reset value bila mediaRefs kosong. |
| Fix | Kontrol Ganti/Hapus Foto selalu terlihat saat slot editable, label Hapus foto N aksesibel; setiap extra photo mendapat thumbnail preview dan Hapus Foto sesuai indeks. Disabled/read-only tetap tanpa kontrol hapus. Memakai handler existing; tidak mengubah status/validasi wajib, storage atau record historis. |
| Verifikasi | RED 2/3 test baru gagal karena tidak ada kontrol hapus per indeks. GREEN 8/8 targeted (3 hapus + 5 preview) pass, 2 files, 3.87 s. Tes menghapus foto tengah tanpa mengubah lainnya, disabled tanpa hapus, aktif wajib → kosong/BELUM DIPERIKSA/isResolved false → unggah pengganti/isResolved true; foto item lain utuh. Full 565 pass/2 kegagalan lama QC OUT dari 567 tests, 40 files, 35.62 s. tsc/build exit 0, 2148 modules, Vite 1.67 s; lint scope 0 error/0 warning. Browser inventory kosong; visual touch/desktop PENDING. |
| Pelajaran | Kontrol koreksi wajib terlihat pada perangkat tanpa hover. Keberadaan onRemove di source tidak membuktikan operator dapat menemukan tombol; foto tambahan harus bisa dipilih/dihapus per indeks. |
| Log Keyword | inspeksi-hapus-foto-wajib, Fix #45, photo-card-delete, touch-hover-delete, extra-photo-remove, required-photo-replacement |
| Deploy | LIVE DEMO 2026-10-17: https://bozzmobil-demo.vercel.app/bozzmobil/; dpl_JBxG5Kjyv2AxG6vmLJ5x72gg5s3W READY. HTML/JS/CSS/cars 200, bundle hash cocok lokal; visual browser masih PENDING. Laporan publikasi-demo-sementara-2026-10-17-r2.md. Tanpa menghapus data user, Supabase, commit/push. |

---

### Fix #44 - Foto Riwayat Inspeksi tidak terbuka: thumbnail memakai tab baru

| Field | Detail |
|---|---|
| Tanggal | 2026-10-17 |
| File | src/pages/InspectionPage.tsx; src/components/InspectionPhotoGallery.tsx; src/__tests__/inspectionHistoryPhotos.test.tsx |
| Masalah | Thumbnail terlihat di Riwayat namun klik tidak memberi pratinjau di aplikasi; multiPhoto lebih dari 3 hanya menampilkan badge tanpa akses ke foto berikutnya. |
| Akar | Riwayat dan foto temuan memakai window.open pada URL foto, sedangkan lightbox yang sudah ada hanya dipakai galeri Pembelian. Grid riwayat memotong mediaRefs dengan slice(0,3). |
| Fix | Gunakan shared InspectionPhotoLightbox pada Riwayat/temuan tanpa tab baru; semua thumbnail dapat dibuka, label aksesibel, prev/next, Escape/tombol/backdrop, error fallback. Portal body z150 di atas banner persistence, focus trap/restore. Escape capture hanya menutup preview teratas; scroll lock hanya dikembalikan bila dimiliki lightbox. Tidak mengubah record/status/mediaRefs/byte atau storage. |
| Verifikasi | RED klik thumbnail asli gagal karena dialog tidak ada; dua test nested modal tambahan RED gagal sebelum perbaikan Escape/cleanup. Final 10/10 targeted tests pass, 2 files, 4.86 s (5 regression foto + 5 existing UI). Full 562 pass/2 gagal lama QC OUT dari 564 tests, 39 files, 33.58 s. tsc exit 0; build exit 0, 2148 modules, 3.63 s; lint scope 0 error/3 warning lama. Review ulang tanpa temuan tersisa. Browser inventory kosong, visual PENDING. |
| Pelajaran | Memakai ulang viewer harus diuji di konteks parent aslinya: review menemukan Escape document Modal menutup parent sebelum handler window lightbox dan cleanup bisa mengembalikan hidden yang sudah basi. Capture+stopPropagation dan ownership scroll lock teruji dengan Modal asli. Fixture awal temuan kurang system/area/photoCount; diperbaiki; tes shared gallery awal mengira accessible name First padahal FirstFirst, query title disesuaikan. |
| Log Keyword | riwayat-inspeksi-preview-foto, Fix #44, history-photo-preview, data-url-window-open, multiphoto-fourth, nested-modal-escape, scroll-lock-ownership |
| Deploy | LIVE DEMO 2026-10-17: https://bozzmobil-demo.vercel.app/bozzmobil/; dpl_Ao6cmafpy3Acwqt7dKtAXvbHeT1M READY. HTML/JS/CSS/foto HTTP 200, bundle hash cocok lokal. Visual browser tetap PENDING; lihat publikasi-demo-sementara-2026-10-17-r1.md. Tanpa edit data user, Supabase, commit/push. |

---

### Fix #43 - Data demo hilang saat refresh: snapshot lokal seluruh canonical stores

| Field | Detail |
|---|---|
| Tanggal | 2026-10-16 |
| File | src/data/pipelineSnapshot.ts; src/lib/localDemoStorage.ts; src/components/LocalDemoApp.tsx; src/main.tsx; src/App.tsx; src/context/PipelineContext.tsx; src/data/payments.ts; src/data/saleLedger.ts; src/data/purchaseRefunds.ts; src/data/leasing.ts; src/__tests__/localDemoStorage.test.ts; src/__tests__/localDemoPersistence.test.tsx; src/__tests__/localDemoBootstrap.test.tsx; src/__tests__/stockSaleNavigation.test.tsx; package.json/package-lock.json; architecture/03_DATABASE_SCHEMA.md; architecture/07_PURCHASE_PAYMENT.md |
| Masalah | Leads/transaksi/master edit dan supported lampiran hanya berada dalam memory; refresh menginisialisasi provider baru. User memilih penyimpanan pada browser/perangkat yang sama dahulu. |
| Akar | Entry langsung merender App tanpa load/save adapter; mutable stores serta sequence tidak memiliki hydration; object URL saja tidak dapat bertahan antar halaman. |
| Fix | Native IndexedDB menyimpan snapshot versioned atomik beserta transaksi, inspeksi/QC, master, flags, verifikasi/audit dan counters. CAS revision menolak tab lama; antrean save menjaga urutan, status saved sesudah transaction complete. File/Blob disimpan sebagai byte, object URL bersama direkonstruksi. Bootstrap memuat sebelum App; read/schema error tidak membuka state kosong/menimpa data. Indikator dan beforeunload pending/error, retry write. Store hydration dan ID berikutnya diteruskan. Tidak menambah runtime dependency; fake-indexeddb 6.2.6 dev-only. |
| Verifikasi | RED awal 2 test provider gagal sebelum hydration/counter fix; adapter suite awal gagal import sebelum implementasi. Final targeted 15/15 pass, 3 files (2.80 s); integrasi provider → IndexedDB → provider dengan pembayaran/master/QC diperluas dan 3/3 provider pass (2.52 s). Full 557 pass/2 kegagalan lama QC OUT dari 559 tests, 38 files, 28.42 s. tsc exit 0; build exit 0, 2148 modules, 1.42 s. Lint scope 0 error/5 warning lama. Quota/attachment error mempertahankan revision lama; retry, CAS, byte File dan startup/StrictMode teruji. Browser inventory kosong: visual refresh PENDING. |
| Pelajaran | Review menemukan malformed sale yang lolos container checks; required nested fields termasuk idTransaksi sekarang divalidasi dengan regression. Implementasi awal memakai instanceof ArrayBuffer yang gagal lintas realm jsdom/fake-IDB; validasi tag buffer memperbaikinya. Deferred disposal untuk StrictMode membuat assertion cleanup sinkron lama gagal; assertion kini menunggu disposal, bukan menghapus pemeriksaan, dan test StrictMode membuktikan URL valid hingga unmount nyata. |
| Log Keyword | penyimpanan-demo-lokal, Fix #43, indexeddb, refresh-persistence, blob-bytes, local-snapshot-cas, hydrate-before-render |
| Deploy | LIVE DEMO 2026-10-16: https://bozzmobil-demo.vercel.app/bozzmobil/; dpl_AkLnCEYf5Jk9ujT7M2ZQABb2yVZb READY. HTML/JS/CSS/foto 200, bundle SHA256 cocok dist lokal. Tidak Supabase/SQL/server, menghapus data, commit atau push. Visual browser tetap PENDING; lihat publikasi-demo-sementara-2026-10-16-r4.md. |

---

### Fix #42 - Proses Pembayaran: kategori, rekening dan label tambah isian

| Field | Detail |
|---|---|
| Tanggal | 2026-10-16 |
| File | src/lib/purchasePaymentCategory.ts; src/pages/ProsesPembayaranPage.tsx; src/pages/ProsesPembelianPage.tsx; src/components/ProsesPembayaran.tsx; src/__tests__/paymentCategoryBank.test.tsx; architecture/07_PURCHASE_PAYMENT.md |
| Masalah | Antrian hanya memfilter sourceType; kategori pilihan Pembelian belum tampil/filter pada daftar. Bank/rekening/atas nama yang diinput di Pembelian belum ditampilkan pada pembayaran. Tombol Tambah Unit menyiratkan kendaraan baru. |
| Akar | SourceType berbeda dari car.payment.paymentCategory; detail supplier transaksi belum diproyeksikan pada UI pembayaran; label role settlement terlalu singkat. |
| Fix | Shared kategori Unit/Sparepart/Jasa pada form sumber, dropdown kategori dan kolom antrian; baca kategori canonical, legacy kosong Belum diisi. Panel Rekening Penjual membaca supplierDetail pembelian (bank/accountNumber/accountHolder), mempertahankan nol awal dan tanda minus untuk kosong, tanpa fallback ke master. Tambah Kolom Pembayaran/Komisi dan Tambahkan Kolom mempertahankan addRow draft yang sama; tidak membuat kendaraan/request/entry otomatis. |
| Verifikasi | RED test transfer Pembelian ke pembayaran gagal karena filter belum ada. Final 2/2 test integrasi lulus (4.72 s): input kategori/rekening koreksi, filter, perubahan master, nol awal, missing bank, tambah draft tanpa record baru. Full suite 542 pass/2 gagal lama dari 544 tests, 35 files, 33.05 s. npx.cmd tsc -b exit 0; npm.cmd run build exit 0, 2145 modules, 1.82 s; lint scope 0 error/9 warning lama. Review kode independen tanpa temuan. Browser inventory kosong; visual PENDING. |
| Pelajaran | Jangan memakai Master Supplier sebagai fallback rekening transaksi yang kosong; sourceType bukan kategori administrasi. Test awal menamai tombol konfirmasi Tambah padahal UI lama Tambah Baris; assertion diselaraskan dengan label final Tambahkan Kolom. |
| Log Keyword | pembayaran-kategori-rekening, Fix #42, purchase-payment-category, account-leading-zero, payment-draft-fields |
| Deploy | ✅ LIVE DEMO 2026-10-16: https://bozzmobil-demo.vercel.app/bozzmobil/ — dpl_B2MAcxrssGBQekB74SwaRdq6i1Uh READY. HTML/JS/CSS HTTP 200; bundle SHA256 identik dengan dist lokal. Visual browser tetap PENDING. Laporan publikasi-demo-sementara-2026-10-16-r3.md. Tidak mengubah PaymentStore, nominal/histori, QC/BAST, Supabase/persistence; tidak commit/push. |

---

### Fix #41 - Revisi UI Leads, keputusan Inspeksi dan Proses Pembelian

| Field | Detail |
|---|---|
| Tanggal | 2026-10-16 |
| File | src/components/LeadPriceRangeInput.tsx; src/lib/leadPriceRange.ts; src/pages/LeadsPage.tsx; src/pages/InspectionPage.tsx; src/pages/ProsesPembelianPage.tsx; src/context/PipelineContext.tsx; src/__tests__/leadFormRevision.test.tsx; src/__tests__/purchaseUiRevision.test.tsx; architecture/07_PURCHASE_PAYMENT.md |
| Masalah | Estimasi diketik tanpa titik ribuan; keputusan Inspeksi tampil dua kali; Proses Pembelian tidak memiliki input Nopol wajib; form eksekusi pembayaran tersisip di Proses Pembelian. |
| Akar | Draft range belum diformat, duplicate action section, koreksi kendaraan belum memasukkan plate, dan reuse ProsesPembayaran pada halaman yang seharusnya hanya menyiapkan request/monitoring. |
| Fix | Format titik ribuan saat mengetik kedua endpoint dengan caret restoration. Hapus pasangan keputusan atas saja. Tambah Nopol wajib di Data Unit, normalisasi/validasi/simpan canonical; Leads/Inspeksi ikut membaca koreksi tanpa mengganti ID atau histori. Preflight/confirm memeriksa canonical plate dan perubahan belum disimpan; command PURCHASE_UNIT request menolak unit hilang/Nopol invalid. Hapus embedded ProsesPembayaran, pertahankan input pada modul dedicated. Ringkasan read-only selalu menampilkan dibayar dari total, sisa dan status/pesan unpaid; list/KPI memakai fallback legacy sama dengan detail tanpa double-count canonical. |
| Verifikasi | Test awal membuktikan 6 assertion gagal terkait fitur; test Inspeksi awal salah import lalu dikoreksi dan membuktikan 2 pasangan tombol. Full suite final 540 pass/2 gagal lama dari 542 tests, 34 files, 31.41 s. Targeted final 19/19 pass, 7.03 s. npx.cmd tsc -b exit 0; npm.cmd run build exit 0, 2144 modules, 1.35 s. Lint scope 0 errors/8 warning lama. Kegagalan lama freshLifecycle.test.tsx:206 (QC OUT setelah sale) tetap terpisah. Browser inventory apps=[]/browsers=[], visual PENDING. |
| Pelajaran | Review menemukan bug caret buatan sendiri: spasi separator ikut dihitung sehingga digit maksimum masuk ke minimum; test incremental mereproduksi, lalu counting hanya digit/hyphen dan caret akhir diperbaiki. Test legacy awal mencari plat yang tidak ada pada kolom list; selector diperbaiki ke row tombol. Ringkasan tanpa request sempat mengakses request.id undefined karena replacement tidak cocok; diperbaiki, tests/tsc lulus. Test pembayaran sempat tidak membawa alokasi wajib dan mengeklik ID non-button; harness diperbaiki mengikuti flow produksi. |
| Log Keyword | leads-inspeksi-pembelian-revisi-ui, Fix #41, price-range-caret, purchase-required-plate, read-only-payment-summary, inspection-upper-actions |
| Deploy | ✅ LIVE DEMO 2026-10-16: https://bozzmobil-demo.vercel.app/bozzmobil/ — dpl_DHjEaFcX1fECUQ8p9FnLWT6WZLwW READY. HTTP 200 dan SHA256 bundle identik dengan build lokal. Browser visual tetap PENDING. Laporan publikasi-demo-sementara-2026-10-16-r2.md; handoff leads-inspeksi-pembelian-revisi-ui.md. Tanpa Supabase/migrasi/persistence/commit/push. |

---

### Fix #40 - Nopol Leads wajib diisi padahal boleh belum tersedia

| Field | Detail |
|---|---|
| Tanggal | 2026-10-16 |
| File | src/pages/LeadsPage.tsx; src/lib/licensePlate.ts; src/lib/leadEditing.ts; src/context/PipelineContext.tsx; src/__tests__/optionalLeadPlate.test.tsx; architecture/05_BUSINESS_RULES.md |
| Masalah | Simpan tambah/edit Leads diblokir saat Nopol kosong. |
| Akar | Form dan command intake memakai isValidPlate yang sengaja menolak kosong; duplicate tracking juga menganggap dua nilai kosong sebagai nopol duplikat. |
| Fix | Tambah isValidOptionalPlate untuk intake saja, gunakan pada form dan command tambah stage lead/updateLead. Input terisi tetap divalidasi dan dinormalisasi. Kosong tidak dibuatkan nilai rekaan dan tidak masuk duplicate tracking; tampilkan tanda minus pada daftar/detail. Konfirmasi kedatangan tetap memakai validasi nopol strict. |
| Verifikasi | RED 2/2 test baru gagal sebelum implementasi; GREEN 43/43 test Leads/edit/form/nopol lulus, 4 files, 6.54 s. Full suite 534 lulus/2 gagal lama dari 536 tests, 33 files, 28.64 s; kegagalan lama freshLifecycle.test.tsx:206 QC OUT setelah sold. npm.cmd run build exit 0 (termasuk tsc -b), 2143 modules, 1.76 s; lint scope 0 error/5 warning Fast Refresh lama. Browser inventory kosong sehingga visual PENDING. |
| Pelajaran | Nopol belum diketahui bukan identitas unit bersama; gunakan canonical key dan jangan tandai nilai kosong sebagai duplikat. Pisahkan validasi intake opsional dari validasi konfirmasi fisik. |
| Log Keyword | leads-edit-sebelum-pembelian, Fix #40, optional-lead-plate, empty-plate-duplicate, isValidOptionalPlate |
| Deploy | ? LIVE DEMO 2026-10-16: https://bozzmobil-demo.vercel.app/bozzmobil/ ? dpl_BZnZSo3L74pqBhiJ6aVJs5e3n5yt READY. HTTP 200, bundle SHA256 identik dengan build lokal. PENDING verifikasi visual (browser tidak terhubung). Laporan docs/reports/publikasi-demo-sementara-2026-10-16.md; handoff leads-edit-sebelum-pembelian.md tetap untuk visual. Tanpa Supabase/commit/push. |

---

### Fix #39 - Form Leads: Supplier tidak diperlukan, transmisi dan estimasi belum sesuai

| Field | Detail |
|---|---|
| Tanggal | 2026-10-16 |
| File | src/pages/LeadsPage.tsx; src/lib/leadPriceRange.ts; src/lib/vehicleTransmission.ts; src/lib/leadEditing.ts; src/context/PipelineContext.tsx; src/context/usePipelineData.ts; src/data/pipeline.ts; src/data/leads.ts; src/data/masterUnits.ts; src/data/inspections.ts; src/data/sales.ts; src/data/saleLedger.ts; src/pages/InspectionPage.tsx; src/pages/PembelianContent.tsx; src/pages/ProsesPembelianPage.tsx; src/pages/PipelineSimulatorPage.tsx; src/components/ProsesPembayaran.tsx; src/__tests__/leadFormRevision.test.tsx; architecture/05_BUSINESS_RULES.md |
| Masalah | Supplier masih diminta di Leads; pilihan transmisi hanya dua, nilai selain Otomatis diproyeksikan sebagai Manual; estimasi hanya satu nominal; susunan alamat/maps, tipe/transmisi dan kontak belum berdekatan. |
| Akar | Form intake dan proyeksi memakai enum biner dan scalar expectedPrice, belum mendukung rentang dan pengelompokan field. |
| Fix | Hapus input Supplier tanpa menghapus histori. Pilihan AT/MT memakai nilai legacy Otomatis/Manual, tambah EV/Hybrid dalam canonical type dan helper label, termasuk picker koreksi Pembelian. Simpan batas bawah expectedPrice dan atas expectedPriceMax; parser minimum - maksimum menolak format tidak valid, angka tidak aman, negatif dan rentang terbalik. Range divalidasi pada add/update command dan tetap utuh saat reopen serta ditampilkan di inspeksi/pembelian/pembayaran/simulator. Harga beli dan transaksi tetap terpisah; label selisih Pembelian menyebut estimasi minimum saat range tersedia. Pasangkan tipe/transmisi, tahun/kilometer, mediator/HP, PIC/HP; maps tepat setelah alamat. |
| Verifikasi | RED awal 8/8 gagal sebelum implementasi. FINAL: 9 test revisi baru lulus; 40 test Leads/edit/nopol lulus sebelum penambahan satu test parser; full suite 532 lulus/2 gagal lama dari 534 tests, 32 files, 30.24 s. Setelah perubahan label terakhir: 17/17 test terkait Leads/Pembelian lulus, 4.43 s. npx.cmd tsc -b exit 0; npm.cmd run build exit 0, 2143 modules, Vite 1.29 s. Lint scope awal 0 errors/19 warnings, satu unused import baru dihapus; recheck UI/helper/test 0 errors/2 warning lama. Local HTTP 200. Review kode independen tanpa blocker. |
| Pelajaran | Label baru memerlukan penelusuran semua proyeksi; jangan gunakan ternary AT/MT yang mengubah EV menjadi MT. Kesalahan sendiri: skrip awal memakai python yang tidak tersedia (tidak menulis file); diganti Node. Import formatRupiah tersisa di InspectionPage membuat tsc/build awal gagal; dihapus dan checks dijalankan ulang. Review menemukan label Selisih ambigu setelah nominal menjadi range; diperjelas tanpa mengubah hitungan pembayaran. |
| Log Keyword | leads-edit-sebelum-pembelian, Fix #39, lead-form-revision, expectedPriceMax, AT-MT-EV-Hybrid, grouped-lead-fields |
| Deploy | ? LIVE DEMO 2026-10-16: https://bozzmobil-demo.vercel.app/bozzmobil/ ? dpl_BZnZSo3L74pqBhiJ6aVJs5e3n5yt READY. HTTP 200, bundle SHA256 identik dengan build lokal. PENDING verifikasi visual (browser tidak terhubung). Laporan docs/reports/publikasi-demo-sementara-2026-10-16.md; handoff leads-edit-sebelum-pembelian.md tetap untuk visual. Tanpa Supabase/commit/push. |

---

### Fix #38 - Leads tidak bisa diedit sebelum masuk Pembelian

| Field | Detail |
|---|---|
| Tanggal | 2026-10-16 |
| File | src/pages/LeadsPage.tsx; src/context/PipelineContext.tsx; src/context/usePipelineData.ts; src/lib/leadEditing.ts; src/__tests__/leadEditing.test.tsx; architecture/05_BUSINESS_RULES.md |
| Masalah | Leads hanya memiliki Tambah/Lihat; kesalahan input tidak dapat dikoreksi sebelum Pembelian. |
| Akar | Tidak ada form edit atau command khusus koreksi intake dengan batas lifecycle. Detail juga menyimpan salinan Lead di state. |
| Fix | Tombol Edit memakai form tambah dengan prefill dan Simpan Perubahan. canEditLead/updateLead membaca canonical carsRef sinkron, hanya mengizinkan lead/inspecting/rejected tanpa bukti Pembelian/Stock/penjualan. Allowlist intake melindungi key, stage, harga beli, pembayaran, inspection records dan BAST. Model multi-kata dipertahankan saat koreksi. Detail membaca proyeksi terbaru berdasarkan key; cancel tidak mengubah data. Sumber dan Catatan Leads tersedia dalam form. |
| Verifikasi | RED: 10/10 regression tests gagal sebelum implementasi. FINAL: 11/11 test Edit Leads lulus; full suite 523 lulus/2 gagal lama dari 525 tests, 31 files, 24.21 s. Dua kegagalan QC OUT setelah sold pada freshLifecycle.test.tsx:206 tetap terbuka terpisah. npx.cmd tsc -b exit 0; npm.cmd run build exit 0, 2141 modules, Vite 3.51 s. Lint file terkait 0 errors/6 warning lama. Local HTTP 200 pada port 5173. Review kode independen: tidak ditemukan bug pada scope perubahan. |
| Pelajaran | Jangan memakai builder unit baru untuk mengganti seluruh record yang diedit; allowlist command menjaga histori. Kesalahan sendiri: test awal memakai opsi getByRole exact yang tidak didukung TypeScript; dihapus sebelum tsc/build final. Test awal bukti PaymentRequest sempat mengasumsikan simulator dapat mundur stage; asumsi dihapus dan assertion disesuaikan dengan perilaku aktual. |
| Log Keyword | leads-edit-sebelum-pembelian, Fix #38, updateLead, canEditLead, stale-editor, protected-intake-fields |
| Deploy | ? LIVE DEMO 2026-10-16: https://bozzmobil-demo.vercel.app/bozzmobil/ ? dpl_BZnZSo3L74pqBhiJ6aVJs5e3n5yt READY. HTTP 200, bundle SHA256 identik dengan build lokal. PENDING verifikasi visual (browser tidak terhubung). Laporan docs/reports/publikasi-demo-sementara-2026-10-16.md; handoff leads-edit-sebelum-pembelian.md tetap untuk visual. Tanpa Supabase/commit/push. |

---

### Fix #37 - Masuk Stock tanpa pembayaran: konfirmasi belum dijaga di command utama

| Field | Detail |
|---|---|
| Tanggal | 2026-10-15 |
| File | StockEntryButton.tsx; purchaseStock.ts; PipelineContext/usePipelineData; PembelianContent/ProsesPembelianPage/PipelineSimulatorPage; purchaseRefund/acceptance tests; architecture/07. Daftar lengkap docs/reports/validasi-stock-pembayaran.md. |
| Masalah | User melaporkan bisa masuk Stock tanpa pembayaran dan meminta peringatan belum dibayar/belum lunas berikut nominal sisa. |
| Akar | Kekurangan Fix #36: modal hanya di Proses Pembelian, bukan guard command. enterStockUnit dan generic advance masih dapat melewati review; Simulasi memakai advance. Tidak ada tombol Stock pada Data Pembelian versi lokal yang diperiksa. |
| Fix | Shared StockEntryButton pada 3 halaman; status belum dibayar/parsial + total/dibayar/sisa. Command wajib snapshot terkini untuk sisa >0; snapshot lama ditolak, perubahan saldo perlu review ulang. advance purchasing→qc melewati command sama. Pelunasan otomatis tetap berjalan. |
| Verifikasi | Red 2 failures; final 512/512 tes/30 file, 20.34 s; tsc exit 0; build 2140 modules, 1.25 s; scoped oxlint 0 errors/10 warnings existing; diff-check exit 0. 4 regression scenarios baru. Browser inventory kosong: visual PENDING. |
| Pelajaran | Keberhasilan test modal satu halaman tidak membuktikan semua entry point. Jangan hanya memasang konfirmasi di UI; command harus memverifikasi nominal yang direview. Klaim Fix #36 kurang lengkap untuk bypass command dan harus dikoreksi, bukan mengulang hasil tes lama. |
| Log Keyword | pembelian-stock-refund, validasi-stock-pembayaran, unpaid-stock-confirmation, stale-payment-review, advance-stock-bypass |
| Deploy | ✅ LIVE DEMO 2026-10-15: https://bozzmobil-demo.vercel.app, dpl_35J4K1R1eWSa1Zt7ijPxRwyjp8A2 READY; entry/JS/CSS/foto 200, .env.local 404. PENDING VISUAL. QA perluasan 512 lulus/2 gagal (QC OUT sesudah sale), terpisah dari guard Stock. Laporan publikasi-demo-sementara-2026-10-15.md; hosting-demo-sementara ditutup. Tidak Supabase/persistence/reset data/commit/push. |

### Fix #36 - Pembelian: pelunasan belum masuk Stock dan belum ada reject/refund setelah Stock

| Field | Detail |
|---|---|
| Tanggal | 2026-10-15 |
| File | Context Pipeline/usePipelineData; payments/purchaseRefunds; ProsesPembayaran/PurchaseRefundPanel; halaman pembelian/pembayaran/finance; financeReport; 2 test suites; AGENTS dan architecture 01/04/05/07. Daftar lengkap docs/reports/pembelian-stock-refund.md. |
| Masalah | Owner mengubah flow: LUNAS harus auto-Stock; parsial manual dengan konfirmasi; reject sebelum penjualan termasuk sesudah Stock/QC; refund bertahap dengan bukti. |
| Akar | Aturan lama Fix #28 sengaja manual-only, reject hanya purchasing; belum ada ledger refund/monitoring. Ini revisi kebutuhan owner, bukan membatalkan guard first-partial-payment Fix #28. |
| Fix | Auto-Stock hanya LUNAS melalui command kanonis; manual konfirmasi sisa; reject belum lunas tanpa sale, keluar inventory aktif dengan histori utuh; sync guard mencegah stale payouts/QC/advance. Refund append-only capped/idempotent + bukti dan referensi; laporan kas Masuk terpisah dari omzet. |
| Verifikasi | Red 2 failures sebelum perubahan. Final tsc exit 0; 508/508 tes, 30 file, 21.29 s (16 skenario baru); build exit 0, 2138 modules, 1.25 s; scoped oxlint 0 errors/16 warnings existing. Browser inventory kosong: visual PENDING. |
| Pelajaran | Pelunasan boleh menggerakkan lifecycle hanya jika eksplisit disetujui owner; parsial tetap tidak auto. Refund bukan pembayaran negatif. Kesalahan tooling: mencoba eslint yang tidak tersedia; gunakan oxlint package.json tanpa install. Native file required di jsdom tidak menganggap files sintetis sebagai dialog native, sehingga tes handler submit memakai fireEvent.submit; browser nyata tetap wajib. |
| Log Keyword | pembelian-stock-refund, full-payment-auto-stock, partial-stock-confirmation, reject-stock, manual-refund-proof |
| Deploy | ✅ LIVE DEMO 2026-10-15: https://bozzmobil-demo.vercel.app (paket termasuk koreksi #37), READY dan HTTP entry/assets 200. PENDING VISUAL, memory-only. QA lanjutan 512/514: 2 failures QC OUT sesudah sale, belum diperbaiki. Laporan publikasi-demo-sementara-2026-10-15.md; hosting-demo-sementara ditutup. Tidak Supabase/commit/push/reset data. |

### Fix #35 - Supplier belum terdaftar: admin harus meninggalkan form transaksi

| Field | Detail |
|---|---|
| Tanggal | 2026-10-15 |
| File | MasterSupplierPicker.tsx; ProsesPembelianPage.tsx; PenjualanForm.tsx; SupplierFormModal.tsx; ui/Modal.tsx; inlineSupplierCreate.test.tsx; architecture/07_PURCHASE_PAYMENT.md |
| Masalah | Pemilihan supplier hanya membaca master; tidak ada pendaftaran supplier baru dari form Pembelian/Penjualan. |
| Akar | Picker tidak mempunyai create callback/modal dan parent perlu object hasil create untuk auto-select sebelum React mempublikasikan array supplier baru. |
| Fix | Tombol Tambah Supplier menggunakan form/validasi master yang sama, shared addSupplier, result-object autofill, query reset, cancel/reopen bersih dan synchronous double-submit guard. Tidak membuat transaksi saat menambah master. |
| Verifikasi | RED 4 expected failures; GREEN targeted 4/4. Full 492/492 tests, 29 files, 22.23 s; tsc exit 0; build 2136 modules, 3.77 s; scoped lint 0 errors/3 existing warnings. |
| Pelajaran | Shared master create harus mengembalikan canonical object untuk preselection, bukan mencari ID pada stale closure. Kesalahan iterasi: extra parenthesis JSX dikoreksi sebelum verification; tidak reset file setelah listrik padam. |
| Log Keyword | tambah-supplier-dari-transaksi, inline-supplier-create, shared-master-modal, supplier-autoselect |
| Deploy | LOCALLY VERIFIED TESTS/BUILD; PENDING VISUAL: UI inventory apps/browsers kosong. Memory-only, belum persistence. Tidak Supabase/reset/commit/push/deploy. Laporan docs/reports/tambah-supplier-dari-transaksi.md. |

### Fix #34 - Pembelian/Penjualan: pilihan Perorangan atau Supplier belum tersedia

| Field | Detail |
|---|---|
| Tanggal | 2026-10-14 |
| File | PartyTypeToggle.tsx; ProsesPembelianPage.tsx; PenjualanForm.tsx; PipelineContext.tsx; pipeline/payments/saleLedger.ts; saleCompleteness/financeReport.ts; SalesTable/SaleDetail/FinanceReportPage; partyType.test.tsx; architecture 05/07 |
| Masalah | Pembelian hanya memilih supplier master, penjualan hanya identitas manual; owner memerlukan jenis pihak Perorangan/Supplier pada keduanya. |
| Akar | Identitas pihak belum dimodelkan terpisah dari Cash/Credit; supplier pembeli tidak boleh memakai ID supplier asal kendaraan. |
| Fix | Toggle jenis penjual/pembeli; per-type drafts; manual individual atau master supplier; metadata car/request/sale; source ID buyer terpisah; identity locks setelah request/receipt; list/detail/finance labels; personal-only NIK/KTP reminders. Legacy kompatibel, metadata PaymentStore saja tanpa algoritma pembayaran berubah. |
| Verifikasi | 488/488 tests, 28 files, 20.58 s; final targeted 6/6, 5.00 s; tsc exit 0; build 2136 modules, 1.64 s; lint 0 errors/6 existing warnings. Buyer types × Cash/Credit, personal purchase reopen, role/source identity/payment invariants teruji. |
| Pelajaran | Jenis pihak independen dari pembayaran dan SCHEMA UNIT. Supplier pembeli bukan supplier penjual sumber unit. Kesalahan iterasi TS2353 provider inline type dan optional undefined-key assertions diperbaiki; buyer mutation guard dipasang sebelum document preparation. |
| Log Keyword | pihak-perorangan-supplier, buyer-supplier-id, purchase-party-type, vendor-type, cash-credit-independent |
| Deploy | LOCALLY VERIFIED TESTS/BUILD; PENDING VISUAL: No browser is available. Belum persistence/backend. Tidak Supabase/SQL/reset/commit/push/deploy. Laporan docs/reports/pihak-perorangan-supplier.md. |

### Fix #33 - Proses Pembelian: supplier masih teks bebas dari Leads

| Field | Detail |
|---|---|
| Tanggal | 2026-10-14 |
| File | MasterSupplierPicker.tsx; ProsesPembelianPage.tsx; PipelineContext.tsx; ProsesPembayaran.tsx; purchaseSupplierPicker.test.tsx; architecture/07_PURCHASE_PAYMENT.md |
| Masalah | Admin Support tidak dapat memilih supplier terdaftar dari master; nama awal Leads dapat menjadi vendor tanpa supplierId dan snapshot form pembayaran tetap nama lama. |
| Akar | Form memakai free text dan tidak mengirim optional supplierId yang sudah tersedia pada canonical car/PaymentRequest. |
| Fix | Search/dropdown ID + nama master, explicit active selection, auto-fill/correction snapshot, save supplier ID, payment request vendor canonical, lock replacement, current vendor display. Legacy tanpa ID tetap terbaca; tidak membuat supplier otomatis. |
| Verifikasi | 482/482 tests, 27 files, 18.84 s; tsc exit 0; build 2135 modules, 1.52 s; scoped lint 0 errors/13 existing warnings. Empat new scenarios selection/new master/search/autofill/reopen/request/missing/inactive/locked guards. |
| Pelajaran | Nama Leads bukan relasi supplier yang disahkan admin. Gunakan stable master ID; detail transaksi dapat dikoreksi tanpa mengubah master atau vendor historis request. |
| Log Keyword | pembelian-master-supplier, supplier-id-picker, canonical-supplier-payment, supplier-autofill |
| Deploy | LOCALLY VERIFIED TESTS/BUILD; PENDING VISUAL: No browser is available. Tidak PaymentStore/QC/BAST/Supabase/persistence/reset/commit/push/deploy. Laporan docs/reports/pembelian-master-supplier.md. |

### Fix #32 - QC IN setelah perbaikan: aksi ulang dan repair-chain belum lengkap

| Field | Detail |
|---|---|
| Tanggal | 2026-10-14 |
| File | QcInPage.tsx; QcInHistory.tsx; qcInRepairs.ts; PipelineContext.tsx; saleEligibility.ts; inspections.ts; qcInReinspection.test.tsx; architecture/05_BUSINESS_RULES.md |
| Masalah | Completed QC drawer read-only tanpa ulang/history; historical blocker tidak mendukung beberapa repair rounds. Same-tick QC allocator menghasilkan ID identik. |
| Akar | UI tidak mengekspos startQcIn untuk hasil non-saleable; repair links diperiksa satu tingkat; ID counter berasal dari stale render. |
| Fix | Tombol QC IN ULANG, inherited unresolved linked findings, edit by ID dan history tab/drawer; shared chain guard untuk completion/sale; QC counter ref sinkron. Completed records tidak diubah, tidak auto-resolve/checklist/sale. |
| Verifikasi | 478/478 tests, 26 files, 17.30 s; tsc exit 0; build 2134 modules, 1.45 s; scoped lint 0 errors/8 existing warnings. Enam cases UI/integrity; sebelum allocator fix second/third ID sama, setelahnya 3 unique IDs. |
| Pelajaran | Perbaikan harus diverifikasi di record baru, bukan mengubah hasil lama. Linking harus mengikuti chain berulang. Kesalahan sendiri: TS getByRole exact option dan 5 s timeout complex DOM test; dihapus option dan case timeout 15 s tanpa global change. |
| Log Keyword | qc-in-ulang-perbaikan, qc-in-reinspection, outstanding-blocker-chain, immutable-qc-history, same-tick-qc-id |
| Deploy | LOCALLY VERIFIED TESTS/BUILD; PENDING VISUAL: No browser is available. Memory-only; tidak Supabase/PaymentStore/QC OUT/BAST rules/commit/push/deploy. Laporan docs/reports/qc-in-ulang-perbaikan.md. |

### Fix #31 - Data Penjualan: unit siap jual setelah QC IN belum muncul

| Field | Detail |
|---|---|
| Tanggal | 2026-10-14 |
| File | ReadySaleUnits.tsx; SalesPage.tsx; AddSaleModal.tsx; App.tsx; readySaleUnits/freshLifecycle/stockSaleNavigation tests |
| Masalah | QC IN LAYAK JUAL menghasilkan unit available, tetapi Data Penjualan hanya menampilkan transaksi yang sudah dibuat. |
| Akar | Daftar berasal dari SaleRecord tanpa tampilan unit eligible yang belum dijual. |
| Fix | Bagian Unit Siap Dijual menggunakan canonical getSaleEligibility dan source records; action membawa carKey ke Proses Penjualan. Modal fallback preselected. Unit keluar sesudah commit sale; tidak membuat transaksi/invoice/omzet saat QC selesai. |
| Verifikasi | 472/472 tests, 25 files, 14.64 s; targeted fixture tests 8/8 setelah koreksi metadata; tsc exit 0; build 2132 modules, 1.36 s; scoped lint 0 errors/3 existing warnings. |
| Pelajaran | Kesiapan jual perlu ditampilkan tanpa mengubahnya menjadi transaksi. Kesalahan iterasi: test header global bentrok dengan tabel baru dan fixture QC kurang template metadata; diperbaiki dengan scope tabel dan template canonical. |
| Log Keyword | data-penjualan-unit-siap-dijual, qc-in-available-list, canonical-sale-navigation |
| Deploy | LOCALLY VERIFIED TESTS/BUILD; PENDING VISUAL: No browser is available. Tidak QC/BAST/PaymentStore/Supabase/persistence/commit/push/deploy. Laporan docs/reports/data-penjualan-unit-siap-dijual.md. |

### Fix #30 - Masa Berlaku STNK: pilihan kalender belum tersedia

| Field | Detail |
|---|---|
| Tanggal | 2026-10-14 |
| File | src/components/StnkExpiryInput.tsx; src/lib/stnkDate.ts; src/__tests__/stnkDate.test.tsx |
| Masalah | Input tanggal pada Fix #29 hanya dapat diketik; user meminta pilihan kalender. |
| Akar | Controlled text mask belum memiliki native date picker. |
| Fix | Ikon kalender dengan native date input dan showPicker pada klik; fallback fokus/native control. Calendar ISO value dikonversi ke DD/MM/YYYY pada onChange. Manual dan calendar berbagi canonical response value; disabled berlaku pada keduanya. |
| Verifikasi | 463/463 tests, 24 files, 16.22 s; tsc exit 0; build 2131 modules, 1.45 s; scoped lint 0 errors/warnings. Dua regression tambahan untuk calendar/manual sync, clear, legacy/partial dan read-only. |
| Pelajaran | Format internal native picker ISO berbeda dari tampilan DD/MM/YYYY; konversi string menghindari timezone shift dan state ganda. |
| Log Keyword | stnk-format-tanggal, native-calendar-picker, DD-MM-YYYY, read-only-inspection |
| Deploy | LOCALLY VERIFIED TESTS/BUILD; PENDING VISUAL: No browser is available. Popup native belum diverifikasi di browser aktual. Tidak Supabase/commit/push/deploy. |

### Fix #29 - Masa Berlaku STNK: teks bebas tanpa format tanggal dan validasi

| Field | Detail |
|---|---|
| Tanggal | 2026-10-14 |
| File | src/components/StnkExpiryInput.tsx; src/lib/stnkDate.ts; src/pages/InspectionPage.tsx; src/data/checklist.ts; src/__tests__/stnkDate.test.tsx; src/__tests__/freshLifecycle.test.tsx |
| Masalah | Kolom Masa Berlaku STNK berupa teks bebas dengan placeholder Belum diisi; teks/tanggal tidak valid dapat dianggap checklist lengkap. |
| Akar | Generic text control dan isResolved hanya memeriksa BELUM DIPERIKSA, tanpa kontrak tanggal STNK. |
| Fix | Input numeric dengan mask DD/MM/YYYY, kalender valid termasuk leap year, aria-label/error; input invalid tidak resolved. ISO legacy valid ditampilkan DD/MM/YYYY tanpa mutasi histori. Nilai tetap ChecklistResponse.value string; tidak schema/persistence/QC change. |
| Verifikasi | 461/461 tests, 24 files, 14.95 s; 10 tests baru mask/invalid/leap year/legacy/progress/reopen component; fresh-flow fixture mengisi tanggal sebenarnya. tsc exit 0; build 2131 modules, 1.39 s; scoped lint 0 errors/1 existing Date.now warning. |
| Pelajaran | Native date display mengikuti locale browser; controlled text mask memastikan urutan DD/MM/YYYY. Validasi kalender harus membandingkan tanggal hasil parsing agar 31 Februari tidak dianggap valid. |
| Log Keyword | stnk-format-tanggal, doc_masa_berlaku_stnk, DD-MM-YYYY, invalid-calendar-date |
| Deploy | LOCALLY VERIFIED TESTS/BUILD; PENDING VISUAL: No browser is available. Tidak Supabase/commit/push/deploy. |

### Fix #28 - Alur data baru: pembayaran memindahkan Stock tanpa aksi operator

| Field | Detail |
|---|---|
| Tanggal | 2026-10-14 |
| File | src/context/PipelineContext.tsx; src/pages/ProsesPembelianPage.tsx; freshLifecycle.test.tsx; lima regression suites payment/acceptance |
| Masalah | Alur baru dari default provider kosong otomatis berpindah purchasing ke qc/INCOMING saat pembayaran pertama; tidak ada aksi UI terpisah untuk masuk Stock. |
| Akar | Reconciliation useEffect memetakan PaymentEntry ke perpindahan lifecycle, bertentangan dengan AGENTS/architecture 01,04,05,07. Tes lama mengabadikan perilaku itu. |
| Fix | Hapus effect auto-stock; MASUK STOCK menggunakan command canonical enterStockUnit pada Proses Pembelian. PaymentStore, QC dan BAST rules tetap. Tes lama diselaraskan dengan arsitektur. |
| Verifikasi | Sebelum: 2 fresh-flow failures expected purchasing/received qc. Sesudah: 451/451 tests, 23 files, 13.78 s; tsc exit 0; build 2129 modules, 1.46 s; scoped lint 0 errors/11 existing warnings. Cash/Credit dari form Leads sampai invoice/ID inspeksi/rekap kas teruji. |
| Pelajaran | Fixture unit siap jual tidak membuktikan alur pembuatan baru. Payment state dan lifecycle harus terpisah. Kesalahan iterasi: variable storeVersion tidak dipakai setelah effect dihapus menyebabkan TS6133; diperbaiki dengan state setter saja. |
| Log Keyword | validasi-alur-data-baru, fresh-provider-lifecycle, explicit-stock-entry, payment-no-auto-stock, cash-credit-new-sale |
| Deploy | LOCALLY VERIFIED TESTS/BUILD; PENDING VISUAL: No browser is available. Memory-only; belum persistence. Tidak Supabase/reset live/commit/push/deploy. Laporan docs/reports/validasi-alur-data-baru.md. |

### Fix #27 - Koreksi Fix #26: unit, inspeksi dan stock dummy masih dimuat

| Field | Detail |
|---|---|
| Tanggal | 2026-10-14 |
| File | src/lib/initialPipeline.ts; src/context/PipelineContext.tsx; src/__tests__/fixtures/pipeline.ts; dummyBuyerCleanup dan 10 suites fixture injection |
| Masalah | Screenshot user masih menunjukkan unit Stock, riwayat inspeksi dan simulator dummy setelah Fix #26. |
| Akar | Saya membatasi cleanup ke field buyer dan sale seed; initial cars/inspection/QC masih dimuat oleh provider. |
| Fix | Default canonical pipeline, inspeksi dan QC kosong; seed hanya di-inject eksplisit pada tests. Master Supplier/Leasing dan checklist tetap. Reset default tidak menghidupkan contoh. |
| Verifikasi | tsc exit 0; Vitest 448/448 tests, 22 files, 12.88 s; build 2129 modules, 1.42 s; scoped lint 0 errors/4 existing warnings. Delapan halaman kosong dirender dalam regression jsdom. |
| Pelajaran | Membersihkan field identitas bukan membersihkan record operasional. Fixture regression tidak boleh menjadi default initialization aplikasi. HMR mempertahankan state lama sampai reload. |
| Log Keyword | kosongkan-data-dummy, empty-operational-pipeline, initial-inspections, initial-qc, correction-Fix-26 |
| Deploy | LOCALLY VERIFIED TESTS/BUILD; PENDING VISUAL: No browser is available. Tidak reset sesi user, SQL/delete DB/commit/push/deploy. Laporan docs/reports/kosongkan-dummy-operasional.md. |

### Fix #26 - Data awal: pembeli Leads dan penjualan dummy masih muncul

| Field | Detail |
|---|---|
| Tanggal | 2026-10-14 |
| File | src/lib/initialPipeline.ts; src/data/saleLedger.ts; src/context/PipelineContext.tsx; src/context/usePipelineData.ts; src/__tests__/fixtures/sales.ts; src/__tests__/dummyBuyerCleanup.test.tsx; lima regression suites sale/completeness/leasing/finance/navigation |
| Masalah | Buyer dummy di Leads dan dua seed penjualan otomatis muncul pada awal aplikasi meskipun user ingin mengosongkan keduanya; modul lain harus dipertahankan. |
| Akar | Buyer merupakan field car yang dibaca semua lifecycle; seed penjualan tertanam dalam store. Menghapus car akan ikut menghapus relasi/unit yang bukan scope. |
| Fix | Initializer kosongkan customer/phone/address tanpa mengubah field unit lain; Leads hanya buyer nonempty. SaleLedger default kosong dan reset tidak menghidupkan seed. Seed sale dipindah ke test fixtures, provider mendukung explicit initialCars/initialSales untuk regression. |
| Verifikasi | tsc exit 0; Vitest 439/439, 22 files, 15.59 s (+3); build exit 0, 2129 modules, 1.57 s. Scoped lint 0 errors/5 existing warnings. New tests memastikan Leads/sale kosong, unit/master/inspection/QC dipertahankan, buyer baru tidak terhapus, fixture tidak resurrect. Browser unavailable, visual PENDING. |
| Pelajaran | Jangan menghapus canonical car untuk mengosongkan buyer. Perubahan initializer tidak sama dengan menyapu sesi browser yang sedang terbuka. Status sold lama dipertahankan, gap sale ditampilkan agar tidak membuat sale kedua. |
| Log Keyword | kosongkan-data-dummy, dummy-buyer-cleanup, empty-sale-initialization, preserve-unit-history, Fix #26 |
| Deploy | LOCALLY VERIFIED TESTS/BUILD; PENDING VISUAL. Tidak SQL/delete DB/reset command/file delete/commit/push/deploy. Laporan docs/reports/kosongkan-dummy-pembeli-penjualan.md. |

---

### Fix #25 - Laporan Keuangan: pembelian/penjualan live belum terekap dan harga dianggap kas

| Field | Detail |
|---|---|
| Tanggal | 2026-10-14 |
| File | src/lib/financeReport.ts; src/pages/FinanceReportPage.tsx; src/pages/LaporanKeuanganPage.tsx; src/__tests__/financeReport.test.tsx |
| Masalah | Laporan memakai SALES/EXPENSES statis, harga sale dianggap uang masuk, pembayaran pembelian/receipt live tidak tercatat. |
| Akar | Laporan tidak membaca shared stores dan tidak memisahkan nilai kontrak, pembayaran serta unknown history. |
| Fix | Readonly canonical rekap/flows, PaymentEntry dan SaleReceipt, legacy fallback tanpa double-count, rejected history, known/unknown balances, filters/timezone/CSV/pemeriksaan. Tidak ada store atau business command baru. |
| Verifikasi | tsc exit 0; Vitest 436/436, 21 files, 14.85 s (+12); build exit 0, 2128 modules, 1.27 s; scoped lint 0 errors/0 warnings; HTTP 200; Browser unavailable, visual PENDING. |
| Pelajaran | Harga/plan/status Lunas bukan arus kas; commission allocation bagian gross yang sama; UTC timestamp harus tanggal aplikasi. Kesalahan iterasi: 2 fixture recipient type errors dan 1 kegagalan karena fixture shallow array mencemari car seed; diperbaiki dengan recipient dan clone car. |
| Log Keyword | laporan-keuangan-integrasi, financial-live-report, purchase-sale-cashflow, unknown-history, csv-export, Fix #25 |
| Deploy | LOCALLY VERIFIED TESTS/BUILD; PENDING VISUAL/REVIEW USER. Frontend memory-only; tanpa Supabase/persistence/commit/push/deploy. Laporan docs/reports/laporan-keuangan-integrasi-v1.md. |

---

### Fix #24 - Data Penjualan: ID Inspeksi belum tampil di sebelah invoice

| Field | Detail |
|---|---|
| Tanggal | 2026-10-14 |
| File | src/components/SalesTable.tsx; src/__tests__/stockSaleNavigation.test.tsx |
| Masalah | Tabel Data Penjualan tidak menampilkan kode inspeksi sumber transaksi. |
| Akar | Kolom invoice tidak diikuti kolom inspeksi canonical. |
| Fix | Kolom ID Inspeksi tepat setelah No. Invoice; ambil record.code melalui getLatestLulusRecord(inspectionRecords, sale.car.key), selector yang sama dengan pembelian. Missing source ditampilkan —; empty row colSpan 17. |
| Verifikasi | tsc exit 0; Vitest 424/424, 20 files, 49.78 s; existing flow assertion memastikan header bersebelahan dan kode inspeksi source setelah create/reopen sale. Build exit 0, 2127 modules, Vite 3.44 s. Browser unavailable, visual PENDING. |
| Pelajaran | ID Inspeksi tampilan adalah record.code, bukan nomor yang dibentuk dari index/nopol atau transaksi penjualan. Tidak ada kegagalan pemeriksaan pada perubahan ini. |
| Log Keyword | data-penjualan-id-inspeksi, inspection-invoice-column, canonical-inspection-code, Fix #24 |
| Deploy | LOCALLY VERIFIED TESTS/BUILD; PENDING VISUAL. Tidak commit/push/deploy atau mengubah Supabase/persistence. Laporan docs/reports/data-penjualan-id-inspeksi.md. |

---

### Fix #23 - Form penjualan: upload dokumen belum tersedia dan foto BASTK terpisah

| Field | Detail |
|---|---|
| Tanggal | 2026-10-12 |
| File | src/components/SaleUploadGrid.tsx; src/components/PenjualanForm.tsx; src/data/saleLedger.ts; src/context/PipelineContext.tsx; src/pages/ProsesPenjualanPage.tsx; src/__tests__/saleLedger.test.ts; src/__tests__/stockSaleNavigation.test.tsx |
| Masalah | Upload hanya tersedia setelah sale pada tab Dokumen; form Cash/Credit tidak memiliki kartu KTP/faktur/file lain. Bukti BAST berada pada panel lain sebelum form. |
| Akar | Fix #19/#20 belum menangani file pending sebelum create; UI foto BAST terpisah. |
| Fix | Grid bawah form, draft File/previews; batch atomic create/update/replay/rollback; Foto BASTK terhubung ke draft handover, removal/replace sinkron dan final evidence guard; BAST list di bawah form. Predicates QC/markBast tidak berubah. |
| Verifikasi | tsc exit 0; Vitest 424/424, 20 files, 11.72 s (+6); build exit 0, 2127 modules, Vite 2.97 s; scoped lint 0 errors/2 effect warnings; Browser unavailable, visual PENDING. |
| Pelajaran | File pending dan preview URL bukan file store. Persiapkan batch sebelum publish/advance. Initial lint menemukan 7 conditional-hook errors panel lama plus effect baru; semua hook dipindah sebelum guard. Preview URL dibuat via effect untuk cleanup StrictMode; final checks lulus. |
| Log Keyword | penjualan-upload-dokumen, draft-sale-documents, atomic-file-batch, bastk-photo-grid, Fix #23 |
| Deploy | LOCALLY VERIFIED TESTS/BUILD; PENDING VISUAL/REVIEW USER. Memory-only, tanpa Supabase/persistence/commit/push/deploy. Laporan docs/reports/penjualan-upload-v1.md. |

---

### Fix #22 - Input nopol: spasi dan huruf kecil tidak konsisten

| Field | Detail |
|---|---|
| Tanggal | 2026-10-11 |
| File | src/lib/licensePlate.ts; src/pages/LeadsPage.tsx; src/pages/StockUnitPage.tsx; src/context/PipelineContext.tsx; src/context/usePipelineData.ts; src/__tests__/licensePlate.test.tsx |
| Masalah | Nopol input bebas/spaced, misalnya B 2334 TY vs B2334TY; format tidak divalidasi pada create/koreksi; tracking duplicate Leads memakai exact raw string. |
| Akar | Belum ada normalisasi dan validasi format bersama. |
| Fix | Uppercase/remove whitespace pada input Leads/kedatangan dan builder; lexical plate guard pada addCar/koreksi; clone koreksi sebelum normalisasi; duplicate tracking/search Leads mengabaikan case/spasi. Tidak mengubah kebijakan duplikasi, seed/histori atau relasi. |
| Verifikasi | tsc exit 0; Vitest 418/418, 20 files, 12.86 s (+21); build exit 0, 2126 modules, Vite 1.38 s; lint 4 file 0 errors/1 existing warning. Browser No browser is available, visual PENDING. |
| Pelajaran | Normalisasi whitespace bukan menghapus karakter salah. Lexical format bukan pengecekan registrasi/kode wilayah. Kesalahan sendiri: fixture test builder sempat tidak menyertakan schemaUnit wajib; diperbaiki, final tsc/tests/build lulus. |
| Log Keyword | nopol-input, compact-license-plate, plate-normalization, plate-validation, Fix #22 |
| Deploy | LOCALLY VERIFIED TESTS/BUILD; PENDING VISUAL. Tidak commit/push/deploy/Supabase/persistence. Laporan docs/reports/validasi-nopol-v1.md; handoff validasi-nopol.md. |

---

### Fix #21 - Master Leasing: pilihan Credit belum terhubung ke master

| Field | Detail |
|---|---|
| Tanggal | 2026-10-11 |
| File | src/data/leasing.ts; src/pages/MasterLeasingPage.tsx; src/__tests__/masterLeasing.test.tsx; src/App.tsx; src/components/Sidebar.tsx; src/components/PenjualanForm.tsx; src/context/PipelineContext.tsx; src/data/saleLedger.ts; src/components/FilterBar.tsx; src/pages/SalesPage.tsx; src/__tests__/stockSaleNavigation.test.tsx |
| Masalah | Nama leasing berupa input bebas dan filter finance statis; tidak ada pengelolaan master/contact/status atau ringkasan pencairan dari receipt. |
| Akar | Tidak ada shared master canonical ID untuk pilihan Credit. |
| Fix | Master Leasing in-memory, halaman/dialog/detail/filter/chart, leasingId dan current-master command resolver; rename snapshot/nonaktif continuity; lock pergantian setelah pencairan; statistik receipt Leasing saja. |
| Verifikasi | tsc exit 0; Vitest 397/397, 19 files, 14.19 s (+13); build exit 0, 2125 modules, 1.31 s; lint scoped 0 errors/6 existing warnings; HTTP 200; Browser unavailable, PENDING visual. |
| Pelajaran | Relasi menggunakan ID, nama historis snapshot, DP/rencana bukan pencairan. Kesalahan sendiri: 2 tsc errors awal map NavId/Pagination API serta 2 lint findings kode baru; dikoreksi, final checks lulus. |
| Log Keyword | master-leasing, canonical-leasing-id, leasing-disbursement, inactive-leasing, Fix #21 |
| Deploy | LOCALLY VERIFIED TESTS/BUILD; PENDING VISUAL/REVIEW USER. Memory-only, belum database. Tidak commit/push/deploy/Supabase. Laporan docs/reports/master-leasing-v1.md. |

---

### Fix #20 - Kelengkapan penjualan: angka statis tidak menunjukkan data/dokumen kurang

| Field | Detail |
|---|---|
| Tanggal | 2026-10-11 |
| File | src/lib/saleCompleteness.ts; src/data/saleLedger.ts; src/context/PipelineContext.tsx; src/components/SaleDetail.tsx; src/components/SalesTable.tsx; src/pages/SalesPage.tsx; src/__tests__/saleCompleteness.test.tsx |
| Masalah | Kelengkapan seed 100/80 dan record baru 0 tidak berubah sesuai data/file; operator sulit menemukan KTP/NIK/faktur yang kurang. |
| Akar | Nilai legacy statis; lampiran hanya sale-level sehingga belum bisa memastikan bukti setiap transfer. Kekurangan lanjutan Fix #19. |
| Fix | Checklist derived data/file aktual, filter dan detail kekurangan, shortcut editor/dokumen; optional receiptId dengan owner/category guard dan bukti per penerimaan Transfer. Nilai legacy dipertahankan untuk kompatibilitas tetapi tidak dipakai indikator UI. |
| Verifikasi | tsc -b exit 0; Vitest 384/384, 18 files, 11.20 s (+6); build exit 0, 2123 modules, Vite 1.28 s. Enam tests baru mencakup legacy, upload/removal, NIK, Credit/DP nol, ownership/proof per receipt, UI/filter. Browser discovery 0, visual PENDING. |
| Pelajaran | Lampiran umum tidak membuktikan semua transfer. Checklist isian/keberadaan file bukan verifikasi keaslian, pelunasan, atau izin BAST. Tidak ada kegagalan tes pada iterasi fitur ini. |
| Log Keyword | penjualan-cash-credit, sale-completeness, missing-ktp, receipt-document-link, Fix #20 |
| Deploy | LOCALLY VERIFIED TESTS/BUILD; PENDING VISUAL/REVIEW USER. Memory-only, tidak commit/push/deploy/Supabase. Laporan docs/reports/penjualan-kelengkapan-v1.md. |

---

### Fix #19 - Penjualan Cash/Credit: record dan monitoring penerimaan terpisah

| Field | Detail |
|---|---|
| Tanggal | 2026-10-11 |
| File | src/data/saleLedger.ts; src/context/PipelineContext.tsx; src/context/usePipelineData.ts; src/components/PenjualanForm.tsx; src/components/SaleDetail.tsx; src/components/AddSaleModal.tsx; src/components/SalesTable.tsx; src/pages/ProsesPenjualanPage.tsx; src/pages/SalesPage.tsx; src/pages/TransaksiPage.tsx; src/__tests__/saleLedger.test.ts; src/__tests__/stockSaleNavigation.test.tsx |
| Masalah | Form hanya mengubah stage; buyer/harga/kontrak tidak masuk record; invoice/status tergantung indeks; tidak ada monitoring Cash partial/DP/pencairan leasing atau file nyata. |
| Akar | Penjualan derived dari cars sold; tidak ada ledger transaksi/penerimaan dan command bersama. |
| Fix | In-memory SaleRecord satu carKey; commit sinkron dengan current cars/QC refs; replay/conflict/stale guards; receipts append-only dengan allocation/overpayment/duplicate/reference guards; views/list/detail/tab dokumen aktual. Data seed pembayaran unknown, bukan fake Lunas. |
| Verifikasi | LOCAL: tsc -b exit 0; Vitest 378/378, 17 files, 10.87 s (+29 dari baseline 349); build exit 0, 2123 modules, 1.30 s. Server HTTP 200. PENDING Browser: discovery 0, tanpa screenshot/console rendered. |
| Pelajaran | DP agreed bukan uang diterima; preserve transaksi lama tanpa mengarang receipt. Kesalahan iterasi: nopol gabungan mematahkan 2 DOM tests, fixture QC available melanggar guard qc existing, dan guard tanggal awal menghalangi booking/DP sebelum penjualan; dikoreksi dan seluruh final tests lulus. |
| Log Keyword | penjualan-cash-credit, sale-ledger, sale-receipts, cash-partial, leasing-disbursement, stale-editor, canonical-sale-record, Fix #19 |
| Deploy | LOCALLY VERIFIED TESTS/BUILD; PENDING VISUAL/REVIEW USER. Frontend memory-only, belum persistence. Tidak commit/push/deploy. Laporan docs/reports/penjualan-monitoring-v1.md; handoff penjualan-cash-credit.md. |

---

### Fix #18 - Pemilihan unit penjualan: pencarian nopol, ID dan tipe

| Field | Detail |
|---|---|
| Tanggal | 2026-10-11 |
| File | src/components/PenjualanForm.tsx; src/__tests__/stockSaleNavigation.test.tsx |
| Masalah | Dropdown hanya menampilkan nama/tahun dan tidak punya pencarian nopol atau ID. |
| Akar | Pilihan unit berupa native select tanpa filter dan tanpa identitas pada label. |
| Fix | Tambah Cari Unit untuk nopol/ID canonical/merek/model/tahun/transmisi; label tipe + nopol + ID; pertahankan selected key/harga saat query berubah; feedback kosong tanpa fallback otomatis. Eligibility Fix #16 tetap digunakan. |
| Verifikasi | tsc -b exit 0; Vitest 349/349, 16 files, 7.36 s; build exit 0, 2.60 s. Test nopol tanpa spasi, ID huruf besar/tanpa separator, model/merek/transmisi, no-result, sold exclusion, retensi pilihan/harga dan clear/select. PENDING Browser: discovery 0. |
| Pelajaran | Filter hasil pencarian tidak boleh mengganti identitas transaksi. Pilihan sebelumnya di luar hasil tetap ditandai Terpilih. Saat menyusun fixture test, nama model awal disesuaikan dengan seed Stargazer sebelum verifikasi akhir. |
| Log Keyword | penjualan-cash-credit, sale-unit-search, nopol-search, canonical-id-search, Fix #18 |
| Deploy | LOCALLY VERIFIED TESTS/BUILD; PENDING VISUAL. Belum commit/push/deploy. Laporan docs/reports/penjualan-cash-credit-ui-v2.md. |

---

### Fix #17 - UI Cash/Credit: field tidak sesuai dan ringkasan harga statis

| Field | Detail |
|---|---|
| Tanggal | 2026-10-11 |
| File | src/components/PenjualanForm.tsx; src/__tests__/stockSaleNavigation.test.tsx |
| Masalah | Diskon/Komisi/progress masih muncul; Credit tidak punya rincian; BPKB masih pelunasan; ringkasan mengabaikan harga edit. |
| Akar | Form presentasional lama dengan field contoh, status khusus Cash dan ringkasan dari unit.price. |
| Fix | Patch UI: hapus kontrol yang ditolak; panel Credit dan status kedua metode; field lokal controlled; total harga final dan pembiayaan terpisah; buyer tidak menimpa sumber; hapus upload semu. |
| Verifikasi | LOCAL: tsc -b exit 0; Vitest 348/348, 16 files, 7.29 s; build exit 0. Tiga regression tests baru. PENDING Browser: 0 browser terhubung, tanpa screenshot/rendered claim. |
| Pelajaran | UI lokal bukan penyimpanan transaksi. Callback proses lama tetap memakai carKey dan belum menyimpan rincian baru; label pratinjau menjelaskan batas itu. |
| Log Keyword | penjualan-cash-credit, cash-credit-ui, no-discount, bpkb-location, credit-summary, Fix #17 |
| Deploy | LOCALLY VERIFIED TESTS/BUILD; PENDING VISUAL. Belum commit/push/deploy. Laporan docs/reports/penjualan-cash-credit-ui-v1.md. |

---

### Fix #16 - Stock -> Proses Jual: QC aktif terlewat dan transaksi salah dibuka

| Field | Detail |
|---|---|
| Tanggal | 2026-10-10 |
| File | src/lib/saleEligibility.ts; src/pages/StockUnitPage.tsx; src/components/PenjualanForm.tsx; src/pages/ProsesPenjualanPage.tsx; src/__tests__/saleEligibility.test.ts; src/__tests__/stockSaleNavigation.test.tsx |
| Masalah | QC lama yang LAYAK JUAL menutupi QC aktif/blocker; LANJUTKAN membuka wizard baru dan memilih unit lain; aktif disimpulkan dari BAST; tests lama tidak mengeklik navigasi/form. |
| Akar | Selector hanya QC completed; tidak lookup record penjualan canonical; fallback ke UNITS[0]; tidak ada guard sinkron klik simpan berulang. |
| Fix | Periksa QC aktif/latest started dan blocker historis beserta resolved follow-up; lookup Sale.car.key dan status transaksi yang sudah ada; buka detail transaksi spesifik tanpa wizard baru; form fail-closed untuk key unavailable; eligibility diperiksa di form dan sebelum proses, dengan ref mencegah submit berulang. |
| Verifikasi | LOCAL: npx.cmd tsc -b exit 0; npx.cmd vitest run 345/345 pass, 16 files, 8.32 s; npm.cmd run build exit 0, 2122 modules, Vite 1.39 s. 16 regression tests tambahan dibanding baseline 329. PENDING verifikasi browser: Browser discovery mengembalikan 0 browser; tidak ada screenshot atau klaim UI rendered lokal. |
| Pelajaran | Test memakai App/Stock/Form/Page nyata dengan provider produksi dan seed terisolasi; Sidebar layout dimock. Kesalahan iterasi sendiri: opsi exact pada getByRole tidak valid dan harness seed meng-unmount children saat stage sold; keduanya diperbaiki sebelum seluruh checks lulus. JSDOM bukan verifikasi Browser. |
| Log Keyword | stock-unit-proses-jual, Fix #16, canonical-sale-key, qc-active-blocker, selected-sale-detail, double-submit, unavailable-key |
| Deploy | LOCALLY VERIFIED; PENDING UI browser. Belum commit/push/deploy. Handoff: handoffs/stock-unit-proses-jual.md. |

---

### Fix #15.1 — Store-level duplicate guard (DUPLICATE_DETECTED) + reviewed-snapshot binding

| Field | Nilai |
|---|---|
| Tanggal | 2026-10-10 |
| File | `src/data/payments.ts` (DUPLICATE_DETECTED failure type, `ReviewedDuplicateMatches` type, `duplicateMatchKey`, `areDuplicateSnapshotsEqual`, `detectDuplicatePayments` sort, store-level duplicate guard in `addEntry`, `validateEntryFinancial` + `commitEntry` helpers, `confirmDuplicatePayment` snapshot binding), `src/context/PipelineContext.tsx` (interface: `reviewedMatches` in confirmDuplicatePayment options, `MATCH_SET_CHANGED` failure, `DUPLICATE_DETECTED` in EntryValidationFailure), `src/components/ProsesPembayaran.tsx` (DUPLICATE_DETECTED → open dup dialog flow, MATCH_SET_CHANGED → re-review, DRAFT_INVALIDATED/RESET → discard draft), `src/__tests__/fix15_1_duplicateGuard.test.tsx` (25 regression tests), `src/__tests__/duplicatePayment.test.tsx` (T13 fix: stale snapshot), `src/__tests__/paymentAllocations.test.tsx` (Test 19: r2 date differs) |
| Masalah | Setelah Fix #15, `addEntry` tidak menjalankan duplicate detection secara store-level — hanya UI preflight (React state) melakukannya. Dua hal bisa terjadi: (1) race condition: dua `addPaymentEntry` call dalam satu tick sama-sama lolos preflight (stale state) dan keduanya commit; (2) bypass: caller yang memanggil `store.addEntry` langsung (tanpa UI) tidak pernah lewat deteksi duplikat. `confirmDuplicatePayment` juga tidak memvalidasi bahwa snapshot match yang direview operator masih valid saat commit — jika match baru muncul antara review dan commit, entry tetap diterima. |
| Akar | (A) UI preflight memakai snapshot React (`paymentEntries` from context value) — stale saat dua panggilan dalam satu tick. (B) `confirmDuplicatePayment` tidak menyimpan atau memvalidasi snapshot match yang direview operator; hanya mengandalkan recompute di commit time tanpa membandingkan terhadap yang direview. |
| Fix | **Part A — Reviewed-snapshot binding:** 1) `ReviewedDuplicateMatches` type + `duplicateMatchKey` (entryId::reason) + `areDuplicateSnapshotsEqual` (order-independent map count). 2) `confirmDuplicatePayment` kini menerima `options.reviewedMatches`; recompute matches di commit time, bandingkan dengan reviewed snapshot; jika berbeda → `MATCH_SET_CHANGED` + `currentMatches`. 3) Audit record (`PaymentOverrideAuditRecord`) kini menyimpan `reviewedMatches`. **Part B — Store-level duplicate guard:** 4) `EntryValidationFailure` ditambah `{ reason: 'DUPLICATE_DETECTED'; matches: DuplicatePaymentMatch[] }`. 5) `addEntry` sekarang: validasi financial guards → `detectDuplicatePayments` → jika match ditemukan, return `DUPLICATE_DETECTED` (TANPA commit) → jika tidak, commit normal. 6) Ekstraksi `validateEntryFinancial` + `commitEntry` helper agar `addEntry` dan `confirmDuplicatePayment` berbagi guard sinkron. 7) `PipelineContext.tsx`: `addPaymentEntry` dan `confirmDuplicatePayment` return type diperluas; caller (UI) menangani `DUPLICATE_DETECTED` dengan membuka dialog override. **Part C — UI:** `ProsesPembayaran.tsx`: `openDupDialog`/`resetEntryForm` helpers; `DUPLICATE_DETECTED` → buka dialog konfirmasi; `MATCH_SET_CHANGED` → re-review dengan snapshot baru; `DRAFT_INVALIDATED` → discard draft, reset form. |
| Verifikasi | `npx tsc -b` → 0 error. `npx vitest run` → 292/292 pass (13 files). `npm run build` → sukses (chunk-size warning lama, unrelated). |
| Pelajaran | Store-level guard adalah lapisan terakhir yang tidak bisa di-bypass — setiap commit path (`addEntry`, `confirmDuplicatePayment`) melewati guard yang sama. Reviewed-snapshot binding memastikan operator tidak mengesahkan match set yang sudah berubah; `MATCH_SET_CHANGED` memaksa re-review. `duplicateMatchKey` + `areDuplicateSnapshotsEqual` (order-independent) membuat pembanding deterministik tanpa asumsi urutan array. |
| Log Keyword | duplicate-payment-guard, DUPLICATE_DETECTED, MATCH_SET_CHANGED, reviewed-snapshot-binding, DuplicateMatchKey, areDuplicateSnapshotsEqual, store-level-duplicate, confirmDuplicatePayment-options, audit-reviewed-matches |
| Deploy | Build lokal 2026-10-10; belum commit/push. Handoff: `handoffs/duplicate-payment-override.md` |

---

### Fix #15 — Duplicate payment warning, operator confirmation & audit trail (Phase 1B-2E)

| Field | Nilai |
|---|---|
| Tanggal | 2026-10-10 |
| File | `src/data/payments.ts` (detectDuplicatePayments, PaymentOverrideAuditRecord, PaymentStore.audit, checkForDuplicates, confirmDuplicatePayment, draftFingerprint, getAuditForEntry), `src/context/PipelineContext.tsx` (5 new PipelineState fields + impl + context value), `src/context/usePipelineData.ts` (5 new destructured + exposed fields), `src/components/ProsesPembayaran.tsx` (two-step duplicate confirmation dialog, audit inspection modal, override badge in history table), `src/__tests__/duplicatePayment.test.tsx` (23 tests: pure unit + React Context integration), `src/__tests__/acceptance1B2D2.test.tsx` (TS type-narrowing fix) |
| Masalah | PaymentStore tidak punya deteksi pembayaran duplikat. Operator tidak mendapat peringatan saat memasukkan data yang sudah tercatat, dan tidak ada mekanisme audit trail untuk pembayaran yang dikonfirmasi melewati peringatan duplikat. |
| Akar | Tidak ada module deteksi duplikat dan tidak ada jenis audit record di PaymentStore. |
| Fix | 1) `detectDuplicatePayments` — pure helper: D1 REFERENCE_MATCH (HIGH) saat kedua reference identik setelah normalize; D2 DETAILS_MATCH (POSSIBLE) saat date+amount+recipient+method semua cocok dan field tersedia di entry existing; D3 amount saja tidak cukup; D4 scope per-request; D5 field missing → tidak bisa match. 2) `PaymentOverrideAuditRecord` — committed atomically dengan PaymentEntry di `confirmDuplicatePayment`. 3) `confirmDuplicatePayment` — revalidasi lengkap: financial guards, draftFingerprint binding, recomputed duplicate check, commit entry + audit record dalam satu sync call. 4) `draftFingerprint` — stable hash dari field-field draft untuk binding exact-draft. 5) UI: dialog konfirmasi duplikat (wajib isi alasan), badge "KONFIRMASI DUPLIKAT" di history, modal inspeksi audit. 6) 23 test baru (20 skenario wajib + 3 tambahan). |
| Verifikasi | `npx tsc -b` → 0 error. `npx vitest run` → 267/267 pass (12 files). `npm run build` → sukses. |
| Pelajaran | Duplicate detection adalah safeguard operasional, bukan replacement financial guard — confirmDuplicatePayment MUST re-run all financial guards sebelum commit. DraftFingerprint binding mencegah stale confirmation: jika draft berubah setelah operator review, fingerprint berubah dan commit ditolak dengan DRAFT_INVALIDATED. |
| Log Keyword | duplicate-payment, DUPLICATE_PAYMENT_OVERRIDE, detectDuplicatePayments, confirmDuplicatePayment, draftFingerprint, PaymentOverrideAuditRecord, dup-reference-match, dup-details-match, audit-trail, override-badge |
| Deploy | Build lokal 2026-10-10; belum commit/push. Handoff: `handoffs/duplicate-payment-override.md` |

---

### Fix #14 — PaymentStore refactoring: 5 race condition (RC-1 s.d. RC-5) pada addPaymentEntry/createPaymentRequest

| Field | Nilai |
|---|---|
| Tanggal | 2026-10-10 |
| File | `src/data/payments.ts` (PaymentStore, EntryAddResult, EntryValidationFailure, createPaymentStore), `src/context/PipelineContext.tsx` (store ref, storeVersion, accessor rewrite), `src/components/ProsesPembayaran.tsx` (EntryAddResult consumption), `src/__tests__/payments.test.ts` (13 store test), `src/__tests__/paymentStoreIntegration.test.tsx` (6 React test, baru), `vitest.config.ts` (jsdom env), `package.json` (test libs) |
| Masalah | 5 race condition (RC-1 s.d. RC-5) pada `addPaymentEntry` dan `createPaymentRequest` di `PipelineContext.tsx`. Akar: stale-closure reads pada `useState` — saat dua panggilan dalam satu event-loop tick (double-click), keduanya membaca snapshot React dari render yang sama sehingga: (RC-1) PMT ID duplikat, (RC-2) overpayment guard tak melihat entry pertama, (RC-3) status drift pada entry kedua, (RC-4) PAY ID duplikat, (RC-5) verification record ditulis dua kali. |
| Akar | `useState` closure: setiap render membuat snapshot `paymentEntries`, `paySeq`, `pmtSeq` yang stale saat dua mutasi terjadi dalam satu tick async. Guard memakai snapshot lama → hasil salah. |
| Fix | 1) `PaymentStore` interface + `createPaymentStore()` factory di `payments.ts`: 5 state slice (`requests`, `entries`, `verifications`, `paySeq`, `pmtSeq`) digabung jadi mutable ref dengan immutable array update pattern (`_requests = [..._requests, req]`). 2) `PipelineContext.tsx`: 5 `useState` diganti `useRef<PaymentStore>` + `storeVersion` counter; `createPaymentRequest`/`addPaymentEntry` delegasikan ke store sinkron, lalu `setStoreVersion` untuk trigger re-render. 3) `addPaymentEntry` kini return `EntryAddResult` (discriminated union: `ok:true + entry + status + totalPaid` atau `ok:false + failure.reason`). 4) `ProsesPembayaran.tsx` `handleAddEntry` consume `EntryAddResult`; pesan error spesifik per `failure.reason`. 5) Reconciliation `useEffect` baca dari `paymentStoreRef.current` (bukan dari state yang sudah dihapus). 6) 13 store unit test + 6 React integration test. |
| Verifikasi | `npx tsc --noEmit` → 0 error. `npx vitest run` → 214/214 pass (9 files). `npm run build` → sukses (chunk-size warning lama, unrelated). Sebelum refactor: RC-2 dapat direproduksi — overpayment guard membaca snapshot lama, dua entry 70M+40M terhadap total 100M lolos kedua-duanya. Setelah refactor: seluruh 5 RC ter-cover; store unit test + React integration test keduanya pass. |
| Pelajaran | Stale-closure pada `useState` adalah anti-pattern untuk transaction sinkron multi-step. Saat dua mutasi terjadi dalam satu event-loop tick, guard yang membaca closure snapshot tidak melihat mutasi pertama. Solusi: mutable ref + sync guard + `storeVersion` counter untuk re-render; immutable array update (spread) menjaga `useMemo` di `usePipelineData.ts` tetap reaktif (referensi array baru setiap commit). Untuk Supabase migration: cukup ganti `paymentStoreRef.current` dengan adapter; transaction function bodies tak berubah. |
| Log Keyword | paymentstore-refactor, stale-closure, race-condition, rc1-rc5, pmt-id-duplicate, overpayment-guard, request-lunas, storeVersion, entry-add-result, verification-idempotent, addPaymentEntry-return-type, jsdom-test-env |
| Deploy | Build lokal 2026-10-10; belum commit/push. Handoff: `handoffs/pembelian-payment-ui-review.md` (ditutup item race-condition). |

### Fix #13 — Halaman Proses Pembelian blank white page setelah penambahan KPI

| Field | Nilai |
|---|---|
| Tanggal | 2026-10-09 |
| File | `src/pages/ProsesPembelianPage.tsx`, `src/__tests__/prosesPembelianHooks.test.ts` (baru) |
| Masalah | Klik sidebar "Proses Pembelian" → halaman blank putih. Terjadi setelah penambahan KPI Summary di halaman yang sama. Tidak ada crash saat membuka halaman pertama kali TANPA klik; blank terjadi konsisten di browser. |
| Akar | Pelanggaran Rules of Hooks (React error #418 "Rendered fewer hooks than expected"), dua lokasi: **(1)** view daftar: `useMemo` (KPI) diletakkan SETELAH early-return `if (selected) return <PurchaseInfoForm …/>`. Saat render dengan `selected=null` → 4 hook; render berikutnya dengan `selected` terisi (klik LIHAT/EDIT) → 3 hook → mismatch → React unmount seluruh subtree → blank page. **(2)** detail form `PurchaseInfoForm`: blok `if (!car) return` diletakkan SEBELUM ~30 panggilan `useState`/`useRef` — form selalu crash saat car ada (path normal). **(3)** satu `const ref = useRef(car.buyPrice)` masih tersisa SETELAH guard — latent violation ketiga. Akar perubahannya: sesi KPI (2026-10-09) menambahkan useMemo tanpa memperhatikan posisi early-return. |
| Fix | 1) View daftar: pindahkan `useMemo` KPI ke ATAS (sebelum early-return) — hook selalu jalan; KPI cards/tabel/filter/aksi tak berubah. 2) `PurchaseInfoForm`: pindahkan SEMUA `useState`/`useRef` (termasuk `paymentCategory` dari `liveCar`, field Data Unit dari `liveCar?.x ?? row.car.x`, field supplier, 3 doc refs, toast/error/buyPrice/confirmOpen, dan `priceRef`) ke ATAS sebelum guard `!car`; guard menjadi murni data-integrity return setelah semua hook. 3) Test regresi `src/__tests__/prosesPembelianHooks.test.ts` (4 test, tanpa DOM): verifikasi di level source bahwa tak ada `use*(` setelah early-return di view daftar ATAU setelah guard `!car` di form, plus arithmetic KPI seed-data. |
| Verifikasi | `npx tsc --noEmit` → 0 error. `npx vitest run` → 71/71 pass (3 file, +4 test baru). `npm run build` → sukses (chunk-size warning lama, unrelated). Sebelum fix: test regresi gagal di 2/3 assertion (memperlihatkan hook setelah return). Setelah fix: 3/3 hook-ordering assertions pass. |
| Pelajaran | Penambahan hook di komponen yang sudah punya early-return HARUS di posisi ATAS (sebelum return), bukan disisipkan di bawahnya — ini sumber bug klasik "blank page" yang baru muncul saat state tertentu terisi. Detail form dengan guard `!car` punya risiko sama: semua hook harus di atas guard. Regresi terdeteksi tanpa DOM: cukup cek urutan source (use* vs return). |
| Log Keyword | proses-pembelian-blank, rules-of-hooks, usememo-after-early-return, error-418, rendered-fewer-hooks, kpi-proses-pembelian, purchaseinfoform-guard, useRef-after-guard |
| Deploy | Build lokal 2026-10-09; belum commit/push. Handoff: `handoffs/pembelian-payment-ui-review.md` (ditutup item hook-ordering). |

### Fix #12 — Legacy 'Dalam Inspeksi' record tanpa checklistResponses menampilkan "0/158" + "legacy data"

| Field | Nilai |
|---|---|
| Tanggal | 2026-10-07 |
| File | `src/context/PipelineContext.tsx`, `src/pages/InspectionPage.tsx` |
| Masalah | Aktif inspection "Dalam Inspeksi" yang dibuat via `assignInspector`/`scheduleReinspection` dan di-start via `startInspection` lama tidak pernah di-seed `checklistResponses`. Akibat: `deriveInspections` jatuh ke legacy fallback (`pointsDone=0`, `totalPoints=158`), UI menampilkan "0 / 158 item selesai" + "Checklist template belum tersedia untuk record ini (legacy data)". `sel.progress` undefined karena `rec.checklistResponses` undefined. |
| Akar | `assignInspector` dan `scheduleReinspection` membuat `InspectionRecord` tanpa `checklistResponses`. `startInspection` lama hanya mengubah status/startedAt tanpa mengisi `checklistResponses`. Record yang sudah di-start sebelum fix tetap legacy. |
| Fix | 1) **PipelineContext.startInspection**: saat transisi ke 'Dalam Inspeksi', jika `record.checklistResponses` undefined → seed via `seedResponsesFromCar(car)` dan set `pointsDone`/`totalPoints` ter-derive dari responses. 2) **InspectionPage**: `initDoneRef` (useRef Set) + `useEffect` — ketika `selectedId` ter-set dan `rec.status === 'Dalam Inspeksi'` + `checklistResponses` undefined/kosong + belum di-init → call `saveChecklistResponses(id, seedResponsesFromCar(car))`. Idempotent per record id; tidak berulang. 3) **InfoTile Progress**: gunakan `sel.progress` jika tersedia, fallback `sel.pointsDone/totalPoints` hanya untuk record yang benar-benar tidak punya responses. |
| Verifikasi | `npm run build` sukses: 2109 modules, 0 TypeScript errors. Alur: `assignInspector` → record 'Terjadwal' tanpa checklistResponses → `startInspection` → record 'Dalam Inspeksi' dengan checklistResponses ter-seed → `deriveInspections` → `sel.progress` tidak undefined → `sel.categories` terisi → "legacy data" message hilang, kategori tile tampil, progress ter-derive dari template. Record 'Selesai' tanpa checklistResponses tetap menggunakan legacy path (tanpa fabricasi data historis). |
| Pelajaran | `startInspection` adalah titik yang tepat untuk seed checklistResponses (bukan `assignInspector` karena itu belum mulai inspeksi). Lazy init di UI menangani record yang sudah di-start sebelum fix deploy. |
| Log Keyword | startInspection-seed, checklistResponses-undefined, legacy-data-fallback, 0-of-158, initDoneRef, seedResponsesFromCar-start |
| Deploy | Build lokal 2026-10-07; belum commit/push. |

### Fix #11 — FOTO KENDARAAN checklist: perbarui template, Tools multi-photo, Karpet note, label cleanup

| Field | Nilai |
|---|---|
| Tanggal | 2026-10-07 |
| File | `src/data/checklist.ts`, `src/components/PhotoSlot.tsx`, `src/pages/InspectionPage.tsx` |
| Masalah | Template FOTO KENDARAAN tidak sesuai referensi owner: (1) Scanner bersifat opsional padahal wajib; (2) label typo/alternatif ("Ban / Velg / Angle Full", "Panel / Suhu AC", "Bagasi Terbuka", "Serong Depan Kan"); (3) Tools berupa 5 slot foto individual — seharusnya 1 area multi-upload + 5 toggle checkbox; (4) Karpet tidak punya catatan kondisi; (5) Jok Tengah seharusnya WAJIB. |
| Akar | Template awal dibuat dari draft desain yang belum final; referensi owner baru mengklarifikasi item, status, dan interaksi Tools/Karpet. |
| Fix | 1) **checklist.ts**: `foto_scanner` → `required: true`; label `foto_banvelg` → `'Ban (Angle Full)'`; `foto_banprod` → `'Ban (Produksi Tahun)'`; `foto_joktengah` → `required: true`; `foto_bagasi` → `'Pintu Bagasi Terbuka'`; `foto_panel_ac` → `'Suhu AC'`; `foto_karpet` → `'Foto Karpet'`; tambah `foto_karpet_catatan` (inputType: text, required: false, allowsNote: true). Tools: ganti 5 item foto individual dengan 1 item `foto_tools` (inputType: photo, multiPhoto: true, required: false) + 5 item boolean `tools_p3k/segitiga/apar/dongkrak/kunciroda` (inputType: boolean, required: false). Tambah field `multiPhoto?: boolean` ke `ChecklistItem`. 2) **PhotoSlot.tsx**: terima `multiPhoto` prop; when set: file input `multiple={true}` + `capture` dihapus + empty-state text `"Pilih Foto"`; `handleFile` kini iterate `files` (bukan hanya `[0]`). 3) **InspectionPage.tsx**: `handleItemValueChange` callback baru (update `ChecklistValue` field, bukan `note`/`mediaRefs`); import `ChecklistValue`; di photo card grid — filter `inputType === 'photo'` untuk card tiles, render `inputType === 'boolean'` sebagai checkbox toggle panel, render `inputType === 'text'` sebagai textarea; photo items kini tampilkan WAJIB/OPSIONAL badge inline + `multiPhoto` prop diteruskan ke `PhotoSlot`. |
| Verifikasi | Count: EKSTERIOR 11 wajib + 2 opsional; INTERIOR 9 wajib + 2 opsional; TOOLS 6 item seluruhnya opsional (1 foto multiPhoto + 5 boolean); KARPET 1 wajib (foto) + 1 opsional (note). `isResolved` untuk Scanner kosong → false (blok completion). `npm run build` sukses: 2109 modules, 0 TypeScript errors. |
| Pelajaran | `multiPhoto` adalah penambahan field opsional ke `ChecklistItem` — tidak mengubah arsitektur response; `mediaRefs[]` sudah mendukung multi-file, hanya `handleFile` dan input `multiple` yang perlu diubah di PhotoSlot. |
| Log Keyword | foto-tools-multifoto, foto-karpet-catatan, scanner-wajib, jok-tengah-wajib, ban-angle-full, pintu-bagasi-terbuka, suhu-ac-label, checklist-item-multiphoto, boolean-tools-toggle |
| Deploy | Build lokal 2026-10-07; belum commit/push. |

### Fix #10 — Harga Beli Rp0 bug + remove Supplier Invoice from purchase workflow

| Field | Nilai |
|---|---|
| Tanggal | 2026-10-07 |
| File | `src/context/usePipelineData.ts`, `src/pages/PembelianContent.tsx`, `src/pages/ProsesPembelianPage.tsx`, `src/components/ProsesPembayaran.tsx` |
| Masalah | (A) `newPipelineCar` hardcode `buyPrice: 0` — harga dari form Leads (`expectedPrice`) tidak terpropagasi ke `PipelineCar.buyPrice`, sehingga Data Pembelian menampilkan Harga Beli Rp0 untuk unit baru. (B) Field "NO. INVOICE SUPPLIER" masih ada di Proses Pembelian (form + validasi) dan Proses Pembayaran (display block + legacy section), padahal bukan bagian workflow pembelian unit BOZZMOBIL. (C) Tidak ada gate validasi `buyPrice > 0` di modal konfirmasi PROSES PEMBELIAN — unit dengan Rp0 bisa masuk Proses Pembelian. (D) Harga Beli tidak bisa di-edit di Data Pembelian (read-only di Proses Pembelian, tidak ada input di Data Pembelian). (E) Harga Beli tidak terkunci setelah PaymentRequest dibuat — admin bisa mengubah buyPrice padahal PaymentRequest.totalAmount sudah ter-create. |
| Akar | `newPipelineCar` tidak memetakan `input.expectedPrice` ke `buyPrice` — keduanya harus terisi sejak Lead creation. Supplier invoice ditambahkan Fix #8 sebagai field manual, tapi tidak sesuai arsitektur PURCHASE_UNIT yang diidentifikasi oleh Purchase ID (auto) + Payment Request ID (auto) + Payment Entry ID (auto). Gate validasi dan lock belum diimplementasikan. |
| Fix | 1) **usePipelineData.ts**: `newPipelineCar` kini set `buyPrice: input.expectedPrice ?? 0` (bukan hardcoded 0). Leads price kini ter-propagasi ke `PipelineCar.buyPrice` sebagai canonical value. 2) **PembelianContent.tsx**: (a) `BuyPriceCell` komponen baru — input editable untuk Harga Beli di table Data Pembelian, simpan via `saveCarCorrections(carKey, { buyPrice })`; parse format Rupiah id-ID (dot thousands); (b) saat `hasActivePaymentRequest('PURCHASE_UNIT', carKey)` → input di-lock + badge "TERKUNCI"; (c) modal konfirmasi PROSES PEMBELIAN: button "YA, PROSES PEMBELIAN" disabled + warning message "Harga Beli belum diisi…" jika `price <= 0`; 3) **ProsesPembelianPage.tsx**: hapus state `invoiceId`, validasi `invoiceId`, input "NO. INVOICE SUPPLIER", dan referensi `invoiceId` di `CarPayment` creation; grid Section 1 kini 3 kolom (Purchase ID, Kategori Pembayaran, Harga Beli formatted); 4) **ProsesPembayaran.tsx**: block transaksi identity kini 2 kolom (ID Pembayaran + Purchase ID); legacy "Informasi Pembelian" section kini tampil hanya jika `paymentCategory` ada (bukan `invoiceId`), 3 kolom tanpa invoice. 5) **payments.ts**: type `PaymentRequest` tidak pernah punya `invoiceId` field — arsitektur generic payment tetap bersih, tidak perlu ubah. `CarPayment.invoiceId` (pipeline.ts) tetap di type untuk backward compat data lama, tapi tidak di-reference UI. |
| Verifikasi | `npm run build` sukses (2106 modules, 0 TypeScript errors). Konfirmasi static: (1) `newPipelineCar` dengan `expectedPrice: 240000000` → `PipelineCar.buyPrice = 240000000`; (2) `assignInspector`, `startInspection`, `completeInspection`, `validateToPurchase` tidak menyentuh price fields — buyPrice terjaga; (3) Data Pembelian: unit purchasing stage → input editable, save via `saveCarCorrections`; (4) modal konfirmasi: `price <= 0` → button disabled + warning; (5) Proses Pembelian: tidak ada field invoice, hanya Purchase ID + Kategori + Harga Beli (disabled); (6) `LANJUTKAN KE PEMBAYARAN`: tidak require invoice, validasi hanya `paymentCategory` + `buyPrice > 0`; (7) `PaymentRequest.totalAmount = car.buyPrice` (bukan expectedPrice, bukan 0); (8) Proses Pembayaran: transaksi block 2 kolom (PAY-ID + PUR-ID), tidak ada invoice; (9) lock: setelah PaymentRequest → BuyPriceCell menampilkan "TERKUNCI"; (10) seed data demo-001..015 buyPrice unchanged; (11) `CarPayment.invoiceId` tetap di type untuk legacy — UI tidak crash saat data lama punya field ini. |
| Pelajaran | (1) `newPipelineCar` adalah satu-satunya tempat `buyPrice` di-init — propagasi price dari upstream form harus terjadi di sini, bukan di display layer. (2) Supplier invoice tidak masuk arsitektur generic payment (PaymentRequest tidak punya invoice field); internal ID (PUR/PAY/PMT auto) menggantikan kebutuhan external invoice untuk PURCHASE_UNIT. (3) Lock Harga Beli setelah PaymentRequest = transaction-state integrity (bukan RBAC): prevents mismatch antara PipelineCar.buyPrice dan PaymentRequest.totalAmount. |
| Log Keyword | buyprice-zero, price-propagation, supplier-invoice-removed, harga-beli-editable, buyprice-lock, pay-request-totalamount, no-invoice-supplier-removed, purchase-unit-identity |
| Deploy | Build lokal 2026-10-07; belum commit/push. |

### Fix #9 — Payment proof per-entry + modal LIHAT BUKTI di Riwayat Pembayaran

| Field | Nilai |
|---|---|
| Tanggal | 2026-10-06 |
| File | `src/data/payments.ts`, `src/components/ProsesPembayaran.tsx` |
| Masalah | `PaymentEntry.proof` hanya menyimpan nama file (string). Riwayat pembayaran menampilkan badge "Ada" tanpa cara melihat bukti. Tiap PaymentEntry tidak punya bukti yang bisa dipreview/dilihat. |
| Akar | Struktur proof minimal (`string`) tidak cukup untuk preview. Tidak ada modal/overlay untuk menampilkan bukti. |
| Fix | 1) **payments.ts**: tambah type `ProofMeta` = `{ name, type, size, objectUrl }`; `PaymentEntry.proof` kini `ProofMeta?` (bukan string). 2) **ProsesPembayaran.tsx**: state `proofFile` kini `ProofMeta \| null`; `handleProofFile` buat object URL (`URL.createObjectURL`), simpan metadata lengkap; `handleAddEntry` revoce object URL form saat reset, pass `ProofMeta` penuh ke `addPaymentEntry`; BUKTI column: badge "Ada" → tombol **LIHAT BUKTI** (ikon Eye); jika tidak ada → "TIDAK ADA". Modal overlay `BUKTI PEMBAYARAN`: metadata (ID Transaksi, Tanggal, Metode, Nominal, Referensi, Keterangan, Nama File, Tipe/Ukuran) + preview image (`<img object-contain max-h-480px>`) atau PDF (`<iframe>`) atau fallback file info + **BUKA FILE** link (target `_blank`); tombol **TUTUP**. File input di-reset setelah proses selesai agar file yang sama bisa dipilih ulang untuk PaymentEntry lain. |
| Verifikasi | `npm run build` sukses (2099 modules, 0 TypeScript errors). Konfirmasi static: (1) tiap PaymentEntry menyimpan proof-nya sendiri — menambah PMT-0002 tidak mengubah proof PMT-0001; (2) object URL direvoke hanya saat form reset setelah entry sukses dibuat (bukan saat proof masih di-associate ke entry); (3) same-file edge case: file input `value` di-reset setelah setiap proses, jadi file fisik yang sama bisa dipilih lagi; (4) `ProsesPembelianPage` `hasProof` check masih valid (object truthy); (5) build bersih. |
| Pelajaran | Object URL harus di-revoke hanya saat proof benar-benar dihapus/diganti, bukan saat form di-reset setelah entry dibuat — proof tetap di-associate ke PaymentEntry di state. |
| Log Keyword | proof-meta, lihat-bukti, payment-proof-modal, object-url, pmt-proof, riw-pembayaran |
| Deploy | Build lokal 2026-10-06; belum commit/push. |

### Fix #8 — Proses Pembelian tabel ringkas + arsitektur ID transaksi otomatis

| Field | Nilai |
|---|---|
| Tanggal | 2026-10-06 |
| File | `src/data/payments.ts`, `src/context/PipelineContext.tsx`, `src/context/usePipelineData.ts`, `src/pages/ProsesPembelianPage.tsx`, `src/pages/ProsesPembayaranPage.tsx`, `src/components/ProsesPembayaran.tsx` |
| Masalah | 1) Proses Pembelian masih berupa kartu horizontal, bukan tabel ringkas yang memonitor pembayaran. 2) Tidak ada Purchase ID otomatis; "ID Invoice" ambigu (internal vs. eksternal supplier). 3) PaymentEntry ID format lama (`PAY-...-E01`), tidak sesuai standar PMT-YYYY-NNNN. 4) Status pembayaran parsial "DIBAYAR SEBAGIAN" tidak sesuai label bisnis "BELUM LUNAS". |
| Akar | UI Proses Pembelian dibuat sebagai shortcut navigasi, bukan monitoring pembayaran. ID transaksi tidak dibedakan antara internal BOZZMOBIL (auto) dan eksternal supplier (manual). Status parsial memakai istilah ambigu. |
| Fix | 1) **payments.ts**: `PaymentStatus` "DIBAYAR SEBAGIAN" → "BELUM LUNAS"; `computePaymentStatus` update. 2) **PipelineContext.tsx**: tambah `purchaseSeq` + `purchaseIdMap` — Purchase ID (`PUR-YYYY-NNNN`) auto-generasi saat `markEnteredPurchaseProcess`; `getPurchaseId` function baru. 3) **PipelineContext.tsx**: tambah `pmtSeq` counter — PaymentEntry ID kini `PMT-YYYY-NNNN` (global sequence), bukan per-request. 4) **usePipelineData.ts**: expose `getPurchaseId`. 5) **ProsesPembelianPage.tsx**: list view diganti dari kartu → tabel ringkas 9 kolom (ID Inspeksi, Nama Customer, Unit, Harga Beli, Schema Unit, Nominal Dibayar, Sisa Pembayaran, Status Pembayaran, Aksi) dengan search + pagination. Data pembayaran derivasi dari `PaymentRequest` + `PaymentEntry` (read-only, tidak di-edit manual). Detail form: field baru "Purchase ID (Otomatis)" (read-only), field "ID Invoice" → "NO. INVOICE SUPPLIER" (manual, placeholder `INV-HONDA-1026-019`). 6) **ProsesPembayaranPage.tsx**: `STATUS_META` update (BELUM DIBAYAR=gray, BELUM LUNAS=amber, LUNAS=green); summary card "Sebagian" → "Belum Lunas". 7) **ProsesPembayaran.tsx**: block referensi ID transaksi baru (ID Pembayaran, Purchase ID, No. Invoice Supplier); riwayat pembayaran kini tabel dengan kolom ID Transaksi (PMT-YYYY-NNNN). |
| Verifikasi | `npm run build` sukses (2099 modules, 0 TypeScript errors). Konfirmasi static: (1) Proses Pembelian hanya tampil unit `enteredPurchaseProcess`; (2) Nominal Dibayar = `sumPaymentEntries(entries)`; Sisa = `max(totalAmount - totalPaid, 0)`; Status parsial = "BELUM LUNAS"; (3) Purchase ID digenerasi sekali saat `markEnteredPurchaseProcess`, stabil pada re-render; (4) PaymentEntry ID format PMT-YYYY-NNNN (global sequence, bukan per-request); (5) `addPaymentEntry` overpayment guard tetap aktif; (6) LUNAS tidak memicu transisi `purchasing → qc`; (7) No. Invoice Supplier tetap manual input, tidak di-generate sistem. |
| Pelajaran | Separasi internal ID (auto) vs. eksternal (manual) harus jelas dari awal; status parsial "BELUM LUNAS" lebih presisi dari "DIBAYAR SEBAGIAN"; pembayaran di Proses Pembelian murni derivasi, bukan input manual. |
| Log Keyword | proses-pembelian-tabel, PUR-ID, PAY-ID, PMT-ID, BELUM-LUNAS, no-invoice-supplier, nominal-dibayar, sisa-pembayaran, purchaseIdMap, pmtSeq |
| Deploy | Build lokal 2026-10-06; belum commit/push. |

### Fix #7 — LULUS dengan checklist belum lengkap kini diizinkan + catatan wajib

| Field | Nilai |
|---|---|
| Tanggal | 2026-10-06 |
| File | `src/data/pipeline.ts`, `src/data/inspections.ts`, `src/context/PipelineContext.tsx`, `src/context/usePipelineData.ts`, `src/pages/InspectionPage.tsx` |
| Masalah | Guard H4 di `completeInspection` (Fix #2) menolak LULUS otomatis bila `pointsDone < totalPoints`. Tidak ada path untuk meluluskan unit dengan checklist belum lengkap. |
| Akar | H4 diterapkan sebagai hard block, padahal business rule baru: LULUS dengan checklist belum lengkap dibolehkan asalkan CATATAN LULUS diisi. |
| Fix | 1) `pipeline.ts`: tambah field `lulusOverrideNote?: string` ke `InspectionRecord`. 2) `PipelineContext.tsx`: `completeInspection` menerima parameter ke-5 `lulusOverrideNote?` — guard baru: LULUS + `pointsDone < totalPoints` + note kosong → `return false`; note non-empty → continue dan simpan `lulusOverrideNote` di record. 3) `inspections.ts`: tambah `lulusOverrideNote?: string` ke type `Inspection`. 4) `usePipelineData.ts`: `deriveInspections` men-map `rec.lulusOverrideNote` ke `Inspection.lulusOverrideNote`. 5) `InspectionPage.tsx`: state `lulusOverrideNote` baru; `doComplete` memvalidasi UI (note wajib saat incomplete); modal LULUS: bila incomplete → warning amber + textarea "CATATAN LULUS *" (button disabled selama note kosong); bila complete → modal tetap normal; RIWAYAT detail: `SectionCard` "CATATAN LULUS" tampil hanya saat `sel.lulusOverrideNote` ada. |
| Verifikasi | `npm run build` sukses (2096 modules, 0 TypeScript errors). Alur lengkap diuji secara static: (1) LULUS checklist lengkap → modal tanpa textarea, submit sukses; (2) LULUS checklist belum lengkap + note kosong → button disabled, `doComplete` reject dengan pesan; (3) LULUS checklist belum lengkap + note terisi → `completeInspection` berhasil, `lulusOverrideNote` tersimpan di record, tombol tetap muncul di RIWAYAT; (4) car tetap di `inspecting` stage — flow Leader/SPV approval tidak terpengaruh; (5) `rejected` flow tidak berubah. |
| Pelajaran | Guard H4 (Fix #2) harus diupdate, bukan dihapus — business rule berubah dari "lengkap wajib" menjadi "catatan wajib bila belum lengkap". |
| Log Keyword | lulusOverrideNote, CATATAN LULUS, LULUS-checklist-tidak-lengkap, completeInspection-guard, h4-update |
| Deploy | Build lokal 2026-10-06; belum commit/push. |

### Fix #6 — LULUS tidak otomatis masuk Pembelian — approval Leader/SPV manual

| Field | Nilai |
|---|---|
| Tanggal | 2026-10-06 |
| File | `src/pages/InspectionPage.tsx` |
| Masalah | Teks status di RIWAYAT INSPEKSI pasca-LULUS pasif ("Unit lulus — siap dilanjutkan…"), tidak ada label APPROVED setelah unit masuk Pembelian. |
| Akar | UI teks tidak diperbarui saat `validateToPurchase` berhasil; alur domain sudah benar (LULUS → stage tetap `inspecting`, menunggu approval), hanya layer tampilan yang belum mencerminkan status approval. |
| Fix | 1) Ganti teks pasif: jika `decision='lulus' && car.stage='inspecting'` → "LULUS — Menunggu approval Leader/SPV untuk dilanjutkan ke Pembelian"; jika `decision='lulus' && car.stage!=='inspecting'` → "APPROVED — Unit telah dilanjutkan ke proses Pembelian"; jika `decision='rejected'` → "Unit tidak lulus — tidak masuk proses pembelian." 2) Label tombol "LANJUTKAN KE DATA PEMBELIAN" di-ganti ke "LANJUTKAN KE PEMBELIAN" + komentar role-preparation di atasnya (gate Leader/SPV/Admin bisa ditambahkan tanpa ubah alur domain). 3) Modal konfirmasi: judul "Lanjutkan ke Data Pembelian?" → "Lanjutkan ke Pembelian?"; deskripsi disesuaikan. 4) Komentar di `doConfirmPurchase` menandai titik di mana role check akan dipasang nanti. |
| Verifikasi | `npm run build` sukses (2096 modules, 0 TypeScript errors). Guard visual: tombol hanya render bila `sel.decision==='lulus' && sel.car.stage==='inspecting'` — sudah ada di kode (tidak berubah). REJECT: tombol dan teks approval tidak pernah muncul. Downstream stage (purchasing/qc/available/sold): tombol hilang, teks "APPROVED" tampil. |
| Pelajaran | Domain layer (`PipelineContext`) sudah memisahkan LULUS dan approval secara benar sejak Fix #2 — hanya UI status text yang belum follow. Tidak perlu ubah `PipelineContext.tsx` atau `usePipelineData.ts` untuk fitur ini. |
| Log Keyword | validateToPurchase, approval-leader, lulus-menunggu, lanjutkan-ke-pembelian, inspection-status-text |
| Deploy | Build lokal 2026-10-06; belum commit/push. |

### Fix #5 — Proses Pembayaran form dari Data Pembelian belum ada

| Field | Nilai |
|---|---|
| Tanggal | 2026-10-05 |
| File | `src/data/pipeline.ts`, `src/context/PipelineContext.tsx`, `src/context/usePipelineData.ts`, `src/components/ProsesPembayaran.tsx`, `src/pages/PembelianContent.tsx` |
| Masalah | Tidak ada form "Proses Pembayaran" yang dapat diakses dari Data Pembelian; pembayaran pembelian unit tidak bisa dicatat. |
| Akar | Fitur belum diimplementasikan — bagian dari lifecycle Pembelian yang belum dibuat. |
| Fix | 1) **pipeline.ts**: tambah type `CreditDetail`, `PaymentRecord`, `CarPayment`; `PipelineCar` extended dengan `supplierDetail` dan `payment` field. 2) **PipelineContext.tsx**: 4 fungsi baru — `saveCarPayment`, `addCarPaymentRecord`, `saveCarCorrections`, `saveSupplierDetail`; semua menulis ke `PipelineCar` yang ada (tidak membuat record baru). 3) **usePipelineData.ts**: re-export 4 fungsi tersebut. 4) **ProsesPembayaran.tsx** (baru): form 4 section (Informasi Pembelian, Data Unit, Data Supplier, Input Pembayaran) + panel Credit + summary sidebar; auto-fill dari `PurchaseRow`; koreksi tersimpan via `saveCarCorrections`/`saveSupplierDetail`; pembayaran via `saveCarPayment`/`addCarPaymentRecord`. 5) **PembelianContent.tsx**: tombol "PROSES PEMBAYARAN" (stage='purchasing' && !rejected) → render `ProsesPembayaran` full-page view. |
| Verifikasi | `npm run build` sukses (2096 modules, 0 TypeScript errors). Kriteria 8 poin: (1) form auto-fill dari PurchaseRow; (2) koreksi simpan via saveCarCorrections; (3) Cash → panel credit tersembunyi; (4) Credit → panel credit tampil; (5) 100.000.000 + 5.000.000 = 105.000.000, dibayar 30.000.000 = sisa 75.000.000; (6) tidak ada record pipeline baru; (7) 15 unit tetap terjaga; (8) build sukses. |
| Pelajaran | Pembayaran adalah koreksi data (bukan transisi stage) — simpan di `PipelineCar.payment` agar persisten tanpa membuat record pipeline baru. |
| Log Keyword | proses-pembayaran, CarPayment, PaymentRecord, saveCarPayment, addCarPaymentRecord, saveCarCorrections, saveSupplierDetail, ProsesPembayaran |
| Deploy | Build lokal 2026-10-05; belum commit/push. |

### Fix #4 — Dummy lifecycle masih 32 unit: ganti dengan 15 unit baru

| Field | Nilai |
|---|---|
| Tanggal | 2026-10-05 |
| File | src/data/pipeline.ts |
| Masalah | Komentar menyebut 15 unit, tetapi seed berisi 32 unit lama; beberapa nopol dipakai lebih dari satu unit. |
| Akar | Dataset lama belum diganti sesuai instruksi 15 unit total sepanjang lifecycle. |
| Fix | Ganti seluruh 32 record dengan demo-001 sampai demo-015, pelanggan/kontak/nopol baru. Sebaran: 3 lead, 3 inspeksi (2 berlangsung + 1 terjadwal), 1 ditolak, 2 pembelian, 2 QC, 2 READY, 2 terjual (1 selesai BAST). Jadwal dan informasi operasional mengikuti ID baru; inspeksi terjadwal memiliki 0 poin dan tanpa startedAt. |
| Verifikasi | Build sukses; lint 0 error, 12 warning pada kode di luar perubahan. Assertion runtime PASS: 15 unit/15 ID/15 nopol unik, 12 record inspeksi tanpa referensi yatim, 5 unit per schema, 2 penjualan/1 BAST selesai, 6 nomor chassis stok unik. Browser lokal menampilkan TOTAL LEADS 15 dan Menampilkan 1 - 8 dari 15 data. |
| Pelajaran | Jumlah unit dihitung dari sumber PIPELINE; record turunan bukan unit tambahan. Seed terjadwal tidak boleh memiliki timestamp mulai. |
| Log Keyword | dummy-15, seed, PIPELINE, INITIAL_INSPECTIONS, demo-001, BAST |
| Deploy | Terverifikasi web lokal 2026-10-05; belum commit/push/deploy production. |

### Fix #3 — Web lokal tidak dapat diakses: server development belum aktif

| Field | Nilai |
|---|---|
| Tanggal | 2026-10-05 |
| File | Tidak ada perubahan kode aplikasi |
| Masalah | Web lokal tidak dapat dibuka; pemeriksaan awal tidak menemukan listener port 5173. |
| Akar | Server Vite belum aktif. Percobaan menjalankan dalam sandbox menghasilkan timeout HTTP 10 detik. |
| Fix | Jalankan npm run dev -- --host 127.0.0.1 dengan akses di luar sandbox. URL memakai base /bozzmobil/. |
| Verifikasi | GET http://127.0.0.1:5173/bozzmobil/ menghasilkan HTTP 200 setelah server dijalankan ulang; Vite siap dalam 779 ms. |
| Pelajaran | Pastikan server berjalan dan verifikasi HTTP; alamat lokal mengikuti base Vite. |
| Log Keyword | localhost, vite, port 5173, sandbox, local-web |
| Deploy | Terverifikasi lokal; tidak membutuhkan deploy. |

### Fix #2 — Leads → Inspection Lifecycle Integrity (C1, C2, C3, H3, H4, H1, H2)

| Field | Nilai |
|---|---|
| Tanggal | 2026-10-05 |
| Status | ✅ LIVE (build sukses) |
| File | `src/context/PipelineContext.tsx`, `src/context/usePipelineData.ts`, `src/pages/LeadsPage.tsx`, `src/pages/InspectionPage.tsx` |
| Masalah | (C1) `assignInspector` tidak punya guard stage — bisa membuat record `Terjadwal` untuk car di stage `purchasing`/`qc`/`available`/`sold`/`inspecting`. (C2) Tombol "Jadwalkan Inspeksi" di LeadsPage masih terlihat untuk `Lulus`/`Terbeli` status. (C3) `deriveLeads` pakai `.find()` (record terlama), `findLulusRecord` pakai array-end (record terbaru) — dua definisi "current inspection" yang bertentangan. (H3) `rescheduleInspection` hanya cek status record, tidak cek stage mobil. (H4) `completeInspection` tidak validasi `pointsDone` vs `totalPoints` — bisa LULUS tanpa inspeksi lengkap. |
| Akar | C1/H3: guard di domain logic tidak ada sejak awal; C2: UI visibility based on display status, bukan car.stage; C3: dua selector berbeda dipakai di dua tempat berbeda; H4: domain guard tidak diimplementasikan, hanya UI `recommend()` sebagai gate. |
| Fix | 1) **C1**: `assignInspector` di `PipelineContext` kini menolak bila `car.stage !== 'lead'`. Stage `rejected` ditangani oleh `scheduleReinspection` (alur terpisah, tidak berubah). 2) **C2**: `LeadsPage` kini me-lookup `selCar?.stage` dari `cars` (sumber dari `usePipelineData`). Block `selected.status !== 'Baru'` dipecah: `stage='rejected'` → form inspeksi ulang (`scheduleReinspection`), `stage='inspecting'` → label "Sedang Diinspeksi", `stage='purchasing'` → label "Masuk Proses Pembelian", `stage='qc'/'available'` → label "QC Proses"/"Siap Dijual", `stage='sold'` → label "Terjual". Tombol "Jadwalkan Inspeksi" hilang untuk semua stage non-lead. 3) **C3**: `usePipelineData` sekarang export `getInspectionRecordsForCar`, `getLatestInspectionForCar` (array-end = terbaru), `getLatestLulusRecord` (record LULUS terbaru). `deriveLeads` diganti dari `.find()` (terlama) ke `getLatestInspectionForCar`. `findLulusRecord` (lokal) dihapus; `derivePurchaseRows` kini pakai `getLatestLulusRecord`. 4) **H3**: `rescheduleInspection` kini cek `car.stage` — hanya sah bila car stage adalah `'lead'` atau `'inspecting'`. `scheduleReinspection` (rejected → inspecting) tidak terpengaruh. 5) **H4**: `completeInspection` menolak `decision='lulus'` bila `totalPoints > 0 && pointsDone < totalPoints`. UI: `completeFailMsg` state baru di `InspectionPage` menampilkan pesan "Inspeksi belum lengkap: X/Y poin selesai" di dalam complete modal. |
| H1 (audit log seed) | Record seed `INITIAL_INSPECTIONS` (dari `seedInspectionRecords`) tidak punya `auditLog` — ini expected: audit log system ditambahkan di Fix #1; seed data predates fitur tersebut. Tidak ada code path yang menulis record tanpa audit event saat runtime (semua fungsi di `PipelineContext` yang membuat/memodifikasi record selalu append audit event). Kesimpulan: H1 bukan bug, hanya gap data seed; tidak perlu fix. |
| H2 (Draft status) | `InspectionLifecycleStatus` di `inspections.ts` punya `'Draft'` yang dipetakan oleh `stageToInspectionStatus` (legacy static `INSPECTIONS` array). Record live dari `PipelineContext` hanya pakai `InspectionStatus = 'Terjadwal' | 'Dalam Inspeksi' | 'Selesai'` (tidak ada `'Draft'`). `deriveInspections` men-mapas `rec.status` langsung — record PipelineContext tidak pernah menghasilkan `'Draft'`. Kesimpulan: `'Draft'` adalah dead state untuk alur live; hanya muncul di seed `INSPECTIONS` (tidak dipakai pipeline). Aman untuk tetap ada di type union — tidak perlu refactor. |
| M2/M3 (deferred) | `rejectedPurchases: Set<string>` tetap volatile (hilang saat refresh). Persistensi akan ditangani di milestone Supabase. Tidak ada hack localStorage/DB di task ini. |
| Verifikasi | `npm run build` sukses (2095 modules, 0 TypeScript errors). Semua 16 regression requirement diuji secara static: (1)-(6) jalur normal lead→inspeksi→lulus/rejected tetap berjalan; (7) `getLatestInspectionForCar` dan `getLatestLulusRecord` sekarang konsisten di semua consumer; (8) record history tetap di-array dan accessible via Riwayat tab; (9) `validateToPurchase` guard tidak berubah; (10)-(13) C1 guard di `assignInspector` + C2 UI di LeadsPage menolak scheduling untuk semua stage downstream; (14) H3 guard di `rescheduleInspection`; (15) H4 guard di `completeInspection`; (16) `rejectPurchase`/`rejectedPurchases` tidak disentuh. |
| Pelajaran | Guard di UI (button visibility) tidak cukup — harus di domain logic (`PipelineContext`) agar tak bisa di-bypass. Satu canonical selector untuk "current inspection" mencegah drift antar consumer. |
| Log Keyword | assignInspector, rescheduleInspection, completeInspection, getLatestInspectionForCar, getLatestLulusRecord, leads-page-c2, inspection-lifecycle-integrity |
| Deploy | Build lokal 2026-10-05; belum commit/push. |

| Field | Nilai |
|---|---|
| Tanggal | 2026-10-05 |
| Status | ✅ LIVE (build sukses) |
| File | `src/data/pipeline.ts`, `src/context/PipelineContext.tsx`, `src/context/usePipelineData.ts`, `src/data/inspections.ts`, `src/lib/inspectionExport.ts`, `src/pages/InspectionPage.tsx` |
| Masalah | Tidak ada persistensi SLA flag, audit trail field-level, reschedule UI, atau export CSV/PDF pada record inspeksi. |
| Akar | Fitur tambahan, bukan bug — belum diimplementasikan sebelum milestone ini. |
| Fix | 1) `InspectionAuditEvent` type + `slaBreached`/`templateId`/`templateVersion`/`auditLog` added ke `InspectionRecord` (semua optional). 2) `rescheduleInspection` + `computeSlaBreached` ke `PipelineContext`. 3) Audit event di-append pada `assignInspector`, `startInspection`, `completeInspection`, `scheduleReinspection`, `rescheduleInspection`. 4) Passthrough ke `Inspection` type. 5) `inspectionExport.ts` — CSV (20 kolom template-independent, BOM-prefixed) + PDF (jsPDF, one-page summary). 6) InspectionPage: tombol CSV/PDF di detail `Selesai`, tombol "JADWALKAN ULANG" untuk record `Terjadwal`, modal reschedule (tanggal+jam), audit trail section "RIWAYAT AKTIVITAS". |
| Verifikasi | `npm run build` sukses tanpa error TypeScript. CSV 20 kolom diverifikasi secara statis. jsPDF v4 API (`setFont('bold'/'normal')`) sesuai type signature. |
| Pelajaran | jsPDF v4 tidak menerima `undefined` sebagai font family — harus string eksplisit ('Helvetica' atau 'bold'/'normal'). |
| Log Keyword | inspectionExport, rescheduleInspection, computeSlaBreached, auditLog, slaBreached, templateId, jspdf, inspection-sla-milestone |
| Deploy | Build lokal 2026-10-05; belum push. |
