-- Phase 0 seed: Demo organization "хантайшир моторс"
-- Slug: "khantaishir-motors" (Cyrillic transliteration)
-- This seed runs after foundation migration and requires at least one
-- registered user to own the org. The application layer handles membership
-- assignment via the auth callback route.

-- Insert the demo organization
insert into public.organizations (id, name, slug, settings, is_active)
values (
  '00000000-0000-0000-0000-000000000001',
  'хантайшир моторс',
  'khantaishir-motors',
  '{}'::jsonb,
  true
) on conflict (slug) do nothing;
