# Cara menerapkan V4

## A. GitHub Pages
Upload/replace isi repository dengan isi ZIP V4. Struktur root harus langsung berisi `index.html`, `css/`, `js/`, `admin/`, `assets/`, `sql/`, dan `supabase/`.

Konfigurasi Supabase pada V4 sudah memakai Project URL + publishable key yang sebelumnya dipakai project ini. Jangan pernah menaruh `service_role` key di GitHub.

## B. Upgrade database V3 → V4
Di Supabase Dashboard → SQL Editor → New query, buka `sql/v4_patch.sql`, copy seluruh isi, lalu Run.

Untuk project yang sudah V3, gunakan `v4_patch.sql`. Jangan menjalankan ulang seluruh `schema.sql` hanya untuk upgrade karena policy V3 lama bisa sudah ada.

Patch menambah:
- `school_profile.logo_url`
- field perbandingan pada `sync_staging`
- tabel `sync_sources`

## C. Deploy Edge Function Smart Sync
File fungsi: `supabase/functions/school-sync/index.ts`.

Dengan Supabase CLI dari folder project:

```bash
supabase login
supabase link --project-ref wmaujhootjritclkyvef
supabase functions deploy school-sync
```

Edge Function menggunakan environment bawaan Supabase (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) di sisi server. Service-role tidak dikirim ke browser/GitHub config.

## D. Upload logo
1. Buka `/admin/` dan login.
2. Masuk `Data Sekolah`.
3. Pada bagian Logo Sekolah pilih PNG/JPG/WebP/SVG.
4. Klik `Upload & Gunakan Logo`.
5. Logo disimpan di bucket `school-media`, URL-nya disimpan di `school_profile.logo_url`, lalu website publik menggunakannya otomatis.

Logo yang diberikan pada chat ini juga sudah disertakan sebagai fallback di `assets/logo-sekolah.jpeg`.

## E. Smart Sync
1. Admin → Sinkronisasi.
2. Daftarkan sumber: nama, URL, tipe HTML/JSON, dan field yang boleh dibaca. Contoh field: `students,staff,principal,accreditation`.
3. Klik `Periksa Pembaruan Data Internet`.
4. Edge Function mengambil semua sumber aktif, mengekstrak field yang diizinkan, membandingkannya dengan `school_profile`, lalu memasukkan perbedaan ke staging.
5. Admin klik `Gunakan Data` untuk satu kandidat yang sudah diverifikasi atau `Tolak`.

Smart Sync tidak auto-overwrite data sekolah.

## Parser sumber
Untuk JSON, fungsi dapat menemukan nama key umum secara otomatis. Untuk API yang strukturnya khusus, isi `parser_config` di tabel `sync_sources` dapat memakai contoh:

```json
{"paths":{"students":"data.students","principal":"data.principal"}}
```

Untuk HTML, parser memiliki pola umum Indonesia. Jika suatu situs membutuhkan pola khusus, `parser_config` dapat memakai:

```json
{"regex":{"students":"Jumlah Siswa\\s*:\\s*(\\d+)","principal":"Kepala Sekolah\\s*:\\s*([^|]+)"}}
```
