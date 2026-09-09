-- SDN Larangan 11 Website V4.3
-- Jalankan SETELAH schema.sql dan v4_patch.sql.
-- Aman dijalankan ulang.

alter table public.school_profile add column if not exists instagram_url text;
alter table public.school_profile add column if not exists facebook_url text;
alter table public.school_profile add column if not exists youtube_url text;
alter table public.school_profile add column if not exists tiktok_url text;
alter table public.school_profile add column if not exists whatsapp_url text;

-- extracurriculars.image_url sudah tersedia pada schema V3/V4.
-- Patch ini menjaga kompatibilitas bila database lama belum memiliki kolom tersebut.
alter table public.extracurriculars add column if not exists image_url text;
alter table public.extracurricular_activities add column if not exists image_url text;

-- Tidak ada auto-overwrite dari internet. Smart Sync tetap masuk staging.
