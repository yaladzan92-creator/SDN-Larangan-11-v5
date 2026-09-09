-- SDN Larangan 11 Website V4 - additive patch for an existing V3 database
-- Safe to run after V3 schema. This patch does not delete existing data.

alter table public.school_profile add column if not exists logo_url text;
alter table public.school_profile add column if not exists hero_image_url text;

alter table public.sync_staging add column if not exists source_name text;
alter table public.sync_staging add column if not exists field_name text;
alter table public.sync_staging add column if not exists current_value jsonb;
alter table public.sync_staging add column if not exists candidate_value jsonb;
alter table public.sync_staging add column if not exists confidence numeric(5,2);
alter table public.sync_staging add column if not exists fetched_at timestamptz default now();

create table if not exists public.sync_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_url text not null,
  source_type text not null default 'html' check (source_type in ('html','json')),
  enabled boolean not null default true,
  priority integer not null default 100,
  allowed_fields jsonb not null default '["name","npsn","status","level","accreditation","principal","students","staff","address","city"]'::jsonb,
  parser_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sync_sources enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='sync_sources' and policyname='admin sync sources') then
    create policy "admin sync sources" on public.sync_sources for all to authenticated using (true) with check (true);
  end if;
end $$;

-- Edge Function uses service_role server-side. No public read policy is created for sync_sources/staging.
create index if not exists idx_sync_staging_status on public.sync_staging(status);
create index if not exists idx_sync_staging_field on public.sync_staging(field_name);
create index if not exists idx_sync_sources_enabled on public.sync_sources(enabled, priority);
