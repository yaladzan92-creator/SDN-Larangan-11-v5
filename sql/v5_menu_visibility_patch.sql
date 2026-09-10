-- SDN Larangan 11 V5 - Menu & Section Visibility Patch
-- Idempotent patch: adds menu_visibility jsonb column to school_profile

alter table public.school_profile
add column if not exists menu_visibility jsonb
default '{
  "profile": true,
  "staff": true,
  "programs": true,
  "news": true,
  "achievements": true,
  "gallery": true,
  "complaints": true,
  "contact": true,
  "more": true,
  "spmb": true
}'::jsonb;
