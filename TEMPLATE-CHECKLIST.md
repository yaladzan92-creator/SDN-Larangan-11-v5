# Panduan Re-use & Checklist Template Website Sekolah

Panduan ini berisi checklist langkah-demi-langkah bagi pengembang atau admin sekolah yang ingin menggunakan kembali (re-use) master template ini untuk sekolah baru.

---

## 📋 Checklist Migrasi Sekolah Baru

### Langkah 1: Kloning & Pembersihan Awal
* [ ] **Salin Repositori**: Lakukan kloning atau salin kode repositori ini ke folder proyek baru Anda.
* [ ] **Bersihkan Riwayat Git (Opsional)**: Hapus folder `.git` lama dan jalankan `git init` untuk memulai riwayat pengembangan baru yang bersih.

### Langkah 2: Konfigurasi Identitas Dasar (`js/site-defaults.js`)
* [ ] Buka file `/js/site-defaults.js`.
* [ ] Sesuaikan seluruh nilai konfigurasi bawaan dengan informasi resmi sekolah baru Anda:
  ```javascript
  window.SDN_SITE_DEFAULTS = {
    schoolName: "Nama Resmi Sekolah Baru",
    schoolShortName: "Inisial/Singkatan",
    npsn: "NPSN_SEKOLAH_BARU",
    level: "Sekolah Dasar", // atau Sekolah Menengah Pertama, dll.
    village: "Kelurahan/Desa",
    district: "Kecamatan",
    city: "Kota/Kabupaten",
    province: "Provinsi",
    address: "Alamat lengkap sekolah baru Anda...",
    logoPath: "assets/logo-sekolah.jpeg" // sesuaikan path logo jika ada
  };
  ```

### Langkah 3: Menghubungkan ke Database Supabase Baru
* [ ] **Buat Proyek Supabase**: Masuk ke [Supabase Console](https://supabase.com/) dan buat proyek baru.
* [ ] **Jalankan Skema SQL**: Jalankan script SQL inisialisasi tabel di database baru Anda (baca petunjuk setup tabel di panduan Supabase proyek ini).
* [ ] **Konfigurasi Variabel Lingkungan**:
  * Perbarui file `js/config.js` dengan **Supabase URL** dan **Anon Key/Publishable Key** proyek Supabase Anda.
  * Perbarui file `admin/js/config.js` dengan kredensial yang sama.
* [ ] **Konfigurasi Supabase Storage**:
  * Pastikan Anda telah membuat bucket publik bernama `school-media` di Supabase Storage untuk kebutuhan upload logo, foto pendidik, berita, galeri, dll.
  * Pastikan Anda telah membuat bucket privat bernama `complaint-attachments` untuk file lampiran pengaduan masyarakat.

### Langkah 4: Setup Autentikasi Admin
* [ ] **Buat Akun Admin**: Di dasbor Supabase baru Anda, buka menu **Authentication > Users** lalu tambahkan akun pengguna baru (Email & Password) yang akan bertindak sebagai Administrator Sekolah.

### Langkah 5: Pengisian Konten Awal di Admin Panel
* [ ] **Masuk ke Admin Panel**: Buka halaman `/admin/` di browser Anda, kemudian login menggunakan akun admin yang telah dibuat di Langkah 4.
* [ ] **Isi Identitas Utama (Menu Data Sekolah)**:
  * Lengkapi seluruh kolom identitas di tab **Data Sekolah** (Nama, Alamat, Akreditasi, Kepala Sekolah, Jumlah Siswa, Telepon, Media Sosial, Google Maps, dll.).
  * Klik tombol **Simpan Perubahan** untuk menyimpan data ke tabel `school_profile` di database Supabase Anda.
* [ ] **Upload Aset Resmi**:
  * Pada tab yang sama, upload file logo resmi sekolah (disarankan format PNG/JPEG dengan latar transparan atau putih).
  * Upload foto gedung sekolah atau foto kegiatan utama sebagai gambar Hero halaman depan.
* [ ] **Kelola Menu Publik**:
  * Buka tab **Pengaturan** di Admin Panel.
  * Tentukan visibilitas bagian-bagian menu website publik (Profil, Berita, Galeri, Prestasi, Pengaduan, Rombel, Dokumen, dll.) sesuai dengan kebutuhan dan ketersediaan data awal Anda.

### Langkah 6: Publikasikan Website
* [ ] **Verifikasi Tampilan Publik**: Buka halaman utama website publik (`/index.html` atau root URL) di browser. Pastikan seluruh identitas default, logo, favicon, judul halaman, deskripsi meta SEO, dan menu-menu sudah termuat dengan sempurna dari database dan file default konfigurasi.
* [ ] **Uji Coba Formulir Pengaduan**: Masukkan satu pengaduan tes dari website publik dan verifikasi bahwa datanya masuk secara aman di menu **Pengaduan** Admin Panel.

---
*Proyek master template ini dikembangkan dengan arsitektur bersih tanpa hardcode identitas di file HTML/JS utama untuk memastikan kemudahan re-use dan pemeliharaan jangka panjang.*
