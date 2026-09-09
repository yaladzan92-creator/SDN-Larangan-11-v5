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


## V4.1 Visual Fidelity
- UI publik diselaraskan lebih ketat dengan Professional V2/mockup: header putih, hero foto sekolah penuh, overlay navy, logo besar, statistik mengambang, kartu sambutan/visi-misi, berita dan footer navy.
- Foto hero default memakai referensi publik SDN Larangan 11 dan dapat diganti melalui Admin > Data Sekolah.
- Logo dan foto hero dapat diunggah ke Supabase Storage tanpa mengubah kode.
