# SDN Larangan 11 Website V4

V4 menggabungkan UI Professional/V2 dengan fondasi produksi V3.

Fitur utama:
- UI publik bergaya Professional/V2 dan responsif.
- Supabase Auth + Postgres + Storage.
- Admin untuk profil, rombel, eskul, kegiatan eskul, program, berita, pengumuman, prestasi, galeri, dokumen, dan jadwal.
- Upload logo sekolah dari admin.
- Smart Sync berbasis Supabase Edge Function.
- Daftar sumber tepercaya/whitelist melalui `sync_sources`.
- Perbandingan per-field pada `sync_staging` dengan approval/reject admin.
- Tidak ada auto-overwrite dari internet.

Untuk upgrade dari V3 baca `DEPLOY-V4.md` dan jalankan `sql/v4_patch.sql`.


## V5 Template Generalization & Master Cleanups
Proyek ini sekarang mendukung **Generalisasi Template** penuh sehingga sangat mudah digunakan kembali (reusable) sebagai template website sekolah lain tanpa melakukan pengerjaan ulang (hardcoding) pada file-file kode.

### Fitur Generalisasi Baru:
1. **Satu Sumber Konfigurasi Identitas (`/js/site-defaults.js`)**: Semua identitas default sekolah (Nama, NPSN, Alamat, Logo, Kota, dll.) sekarang terpusat di satu file ini.
2. **Metadata & SEO Dinamis**: Tag `<title>`, `<meta name="description">`, Open Graph (OG) tags akan diperbarui secara otomatis di runtime berdasarkan data aktif di database atau nilai default konfigurasi.
3. **Pembersihan Modul Usang**: Seluruh referensi menu/halaman "Pengumuman" (UI, Admin, kode) telah dihapus sepenuhnya demi menyederhanakan arsitektur dan kegunaan template.
4. **Local Placeholder Assets**: Menggunakan SVG placeholder lokal (`/assets/school-hero-placeholder.svg` & `/assets/school-profile-placeholder.svg`) yang elegan sebagai fallback jika logo atau foto sekolah belum diunggah di database.
5. **Dukungan Alias Backward Compatibility**: Mendukung penamaan variabel global generik (`window.SDN_CONFIG` & `window.SDN_APP`) untuk mempermudah migrasi masa depan.

### Cara Menggunakan Kembali untuk Sekolah Lain:
Silakan baca panduan lengkap, langkah demi langkah, dan checklist migrasi pada file **`TEMPLATE-CHECKLIST.md`** di direktori root.


## V4.1 Visual Fidelity
- UI publik diselaraskan lebih ketat dengan Professional V2/mockup: header putih, hero foto sekolah penuh, overlay navy, logo besar, statistik mengambang, kartu sambutan/visi-misi, berita dan footer navy.
- Foto hero default memakai referensi publik SDN Larangan 11 dan dapat diganti melalui Admin > Data Sekolah.
- Logo dan foto hero dapat diunggah ke Supabase Storage tanpa mengubah kode.
