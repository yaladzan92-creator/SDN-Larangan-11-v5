-- Seed Data Resmi: SDN Larangan 11 Kota Tangerang
-- Gunakan script ini jika Anda menginisialisasi database baru khusus untuk instansi SDN Larangan 11.
-- Untuk sekolah lain, sesuaikan data profil sesuai identitas sekolah masing-masing.

insert into public.school_profile(
  id, name, npsn, status, level, address, city, profile_title, description,
  vision, mission, spmb_title, spmb_description, spmb_url
) values (
  1,
  'SDN Larangan 11',
  '20607216',
  'Negeri',
  'Sekolah Dasar',
  'Jl. H. Majuk No. 180, Larangan Utara, Kecamatan Larangan, Kota Tangerang, Banten 15154',
  'Kota Tangerang',
  'Rumah Belajar yang Aman, Aktif, dan Berkarakter',
  'Website ini menjadi pusat informasi digital SDN Larangan 11 untuk murid, orang tua/wali, guru, tenaga kependidikan, dan masyarakat.',
  'Membentuk generasi yang religius, disiplin, jujur, kreatif dan berkarakter yang peduli terhadap lingkungan.',
  '["Religius", "Disiplin", "Jujur", "Kreatif", "Berkarakter", "Peduli Lingkungan"]'::jsonb,
  'Informasi SPMB',
  'Jadwal, persyaratan, jalur, daya tampung dan tautan pendaftaran dapat diperbarui oleh admin.',
  'https://spmb.tangerangkota.go.id/'
)
on conflict(id) do update set
  name = excluded.name,
  npsn = excluded.npsn,
  status = excluded.status,
  level = excluded.level,
  address = excluded.address,
  city = excluded.city,
  profile_title = excluded.profile_title,
  description = excluded.description,
  vision = excluded.vision,
  mission = excluded.mission,
  spmb_title = excluded.spmb_title,
  spmb_description = excluded.spmb_description,
  spmb_url = excluded.spmb_url;
