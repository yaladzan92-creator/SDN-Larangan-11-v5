-- SDN Larangan 11 V5 - Rombel Visibility Patch
-- Idempotent patch: adds 'rombel' key to menu_visibility in school_profile if not present

update public.school_profile
set menu_visibility =
  coalesce(menu_visibility, '{}'::jsonb)
  || jsonb_build_object(
    'rombel',
    coalesce(
      (menu_visibility ->> 'rombel')::boolean,
      true
    )
  )
where id = 1;
