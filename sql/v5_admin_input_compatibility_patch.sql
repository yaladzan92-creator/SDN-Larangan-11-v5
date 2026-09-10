-- SDN Larangan 11 Website V5
-- Patch: Admin Input Compatibility & Database Hardening
-- Aman dijalankan ulang (idempotent) pada production database tanpa drop table atau menghapus data.

-- 1. Kompatibilitas Kolom school_profile
-- Memastikan seluruh field yang dikirim form Data Sekolah Admin tersedia di database.
alter table public.school_profile add column if not exists instagram_url text;
alter table public.school_profile add column if not exists facebook_url text;
alter table public.school_profile add column if not exists youtube_url text;
alter table public.school_profile add column if not exists tiktok_url text;
alter table public.school_profile add column if not exists whatsapp_url text;
alter table public.school_profile add column if not exists logo_url text;
alter table public.school_profile add column if not exists hero_image_url text;
alter table public.school_profile add column if not exists maps_url text;
alter table public.school_profile add column if not exists hero_subtitle text;
alter table public.school_profile add column if not exists spmb_title text;
alter table public.school_profile add column if not exists spmb_description text;
alter table public.school_profile add column if not exists spmb_url text;
alter table public.school_profile add column if not exists profile_title text;
alter table public.school_profile add column if not exists description text;
alter table public.school_profile add column if not exists vision text;
alter table public.school_profile add column if not exists mission jsonb not null default '[]'::jsonb;
alter table public.school_profile add column if not exists students integer;
alter table public.school_profile add column if not exists staff integer;
alter table public.school_profile add column if not exists updated_at timestamptz not null default now();

-- 2. Kompatibilitas Kolom Media pada Modul Lain
alter table public.extracurriculars add column if not exists image_url text;
alter table public.extracurricular_activities add column if not exists image_url text;
alter table public.news add column if not exists image_url text;
alter table public.gallery add column if not exists image_url text;
alter table public.documents add column if not exists file_url text;

-- 3. Pastikan record default id=1 ada di school_profile
insert into public.school_profile (id, name)
values (1, 'Nama Sekolah')
on conflict (id) do nothing;
