# Audit UI repository V3 → keputusan V4

## Kondisi V3 yang diaudit
- Public UI sudah responsif dan terhubung Supabase, tetapi tampilannya cenderung generik: hero gradient + kartu sekolah, logo masih berupa mark teks L11, navigasi cukup padat, dan hierarki visual belum sekuat template Professional/V2.
- V3 memiliki fondasi data yang lebih lengkap daripada V2: rombel, ekstrakurikuler + kegiatan, program, berita, pengumuman, prestasi, galeri, dokumen, jadwal, Auth, Storage, RLS, dan staging.
- Admin V3 sudah lebih tepat untuk dipertahankan karena sidebar/panel lebih scalable daripada admin V2.
- Sinkronisasi V3 masih manual melalui URL yang di-fetch browser; ini rentan CORS dan staging masih berupa payload mentah.

## Keputusan V4
1. Pertahankan backend dan model konten V3.
2. Terapkan kembali karakter UI Professional/V2 pada website publik: topbar navy, header putih, logo sekolah nyata, hero besar, statistik mengambang, section editorial, visi navy, kartu berita/eskul, galeri editorial, dan footer institusional.
3. Pertahankan admin V3, lalu tambah pengelola logo dan Smart Sync.
4. Pindahkan pengambilan sumber internet ke Supabase Edge Function `school-sync`.
5. Semua perbedaan internet masuk `sync_staging`; admin memilih Gunakan Data atau Tolak.
6. Sumber harus didaftarkan dan dibatasi field yang boleh dibaca.
