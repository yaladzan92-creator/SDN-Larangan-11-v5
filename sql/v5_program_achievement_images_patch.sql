-- SDN Larangan 11 V5 - Program and Achievement Images Patch
-- Idempotent patch: adds image_url column to programs and achievements tables

alter table public.programs
add column if not exists image_url text;

alter table public.achievements
add column if not exists image_url text;
