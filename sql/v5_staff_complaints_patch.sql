-- SDN Larangan 11 Website V5
-- Patch: Profil Pendidik & Tenaga Kependidikan + Pengaduan
-- Aman dijalankan ulang (idempotent) dan tidak merusak data existing.

-- 1. Tabel Profil Pendidik & Tenaga Kependidikan
create table if not exists public.staff_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null check (role in ('principal', 'teacher', 'supervisor')),
  subject text,
  quote text,
  bio text,
  photo_url text,
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Pastikan RLS aktif untuk staff_profiles
alter table public.staff_profiles enable row level security;

-- IMPORTANT: This policy model assumes all authenticated users are trusted school admins. Public signup MUST remain disabled.

-- Policy staff_profiles: Publik hanya bisa membaca profil yang published (atau role authenticated)
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='staff_profiles' and policyname='public staff profiles read') then
    create policy "public staff profiles read" on public.staff_profiles
      for select using (published = true or auth.role() = 'authenticated');
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='staff_profiles' and policyname='admin staff profiles') then
    create policy "admin staff profiles" on public.staff_profiles
      for all to authenticated using (true) with check (true);
  end if;
end $$;

-- Index untuk performa query publik & sorting admin
create index if not exists idx_staff_role_order on public.staff_profiles(role, sort_order);
create index if not exists idx_staff_published on public.staff_profiles(published);


-- 2. Tabel Pengaduan (Complaints)
create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  reporter_name text not null,
  email text,
  whatsapp text,
  category text not null,
  title text not null,
  body text not null,
  attachment_url text,
  status text not null default 'new' check (status in ('new', 'reviewing', 'resolved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Pastikan RLS aktif untuk complaints
alter table public.complaints enable row level security;

-- PENTING & AMAN:
-- Publik HANYA boleh INSERT pengaduan baru.
-- Publik DILARANG SELECT, UPDATE, DELETE!
-- Hanya role 'authenticated' (Admin) yang dapat SELECT, UPDATE, DELETE.
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='complaints' and policyname='public insert complaints') then
    create policy "public insert complaints" on public.complaints
      for insert to anon, authenticated with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='complaints' and policyname='admin complaints all') then
    create policy "admin complaints all" on public.complaints
      for all to authenticated using (true) with check (true);
  end if;
end $$;

-- Index untuk filtering status & pengurutan tanggal pengaduan
create index if not exists idx_complaints_status on public.complaints(status);
create index if not exists idx_complaints_created_at on public.complaints(created_at desc);


-- 3. Storage Bucket & Policies
-- Bucket public existing 'school-media' digunakan untuk foto staff (folder: staff/)
-- Pastikan bucket 'school-media' tersedia
insert into storage.buckets (id, name, public)
values ('school-media', 'school-media', true)
on conflict (id) do update set public = true;

-- Bucket PRIVATE khusus untuk lampiran pengaduan: 'complaint-attachments'
-- File pengaduan TIDAK BOLEH berstatus public!
insert into storage.buckets (id, name, public)
values ('complaint-attachments', 'complaint-attachments', false)
on conflict (id) do update set public = false;

-- Storage policies untuk bucket 'complaint-attachments':
-- 1. Publik (anon + authenticated) hanya boleh upload (INSERT) lampiran pengaduan
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='public upload complaint attachments') then
    create policy "public upload complaint attachments" on storage.objects
      for insert to anon, authenticated
      with check (bucket_id = 'complaint-attachments');
  end if;

  -- 2. Hanya admin (authenticated) yang boleh membaca/mengunduh lampiran pengaduan
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='admin read complaint attachments') then
    create policy "admin read complaint attachments" on storage.objects
      for select to authenticated
      using (bucket_id = 'complaint-attachments');
  end if;

  -- 3. Hanya admin (authenticated) yang boleh menghapus lampiran pengaduan
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='admin delete complaint attachments') then
    create policy "admin delete complaint attachments" on storage.objects
      for delete to authenticated
      using (bucket_id = 'complaint-attachments');
  end if;
end $$;

-- Trigger update updated_at jika belum ada
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_staff_profiles_updated_at on public.staff_profiles;
create trigger set_staff_profiles_updated_at
  before update on public.staff_profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists set_complaints_updated_at on public.complaints;
create trigger set_complaints_updated_at
  before update on public.complaints
  for each row execute function public.handle_updated_at();
