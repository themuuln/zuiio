-- Public academy views — expose curated academy info to public pages.
-- Programs, trainers, and locations that are active and belong to a published academy.
-- All views use security_invoker and rely on the anon-read policies below.

-- Step 1: Allow anon SELECT so security_invoker views can read the underlying tables.
do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'public_read_academy_profiles' and tablename = 'academy_profiles'
  ) then
    create policy public_read_academy_profiles on public.academy_profiles
      for select to anon, authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies where policyname = 'public_read_academy_programs' and tablename = 'academy_programs'
  ) then
    create policy public_read_academy_programs on public.academy_programs
      for select to anon, authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies where policyname = 'public_read_academy_trainers' and tablename = 'academy_trainers'
  ) then
    create policy public_read_academy_trainers on public.academy_trainers
      for select to anon, authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies where policyname = 'public_read_academy_locations' and tablename = 'academy_locations'
  ) then
    create policy public_read_academy_locations on public.academy_locations
      for select to anon, authenticated using (true);
  end if;
end $$;

-- Step 2: Curated public views (matching v_public_* naming convention).

-- Active programs with academy and location context.
create or replace view public.v_public_academy_programs
with (security_invoker = true) as
select
  p.id,
  p.academy_id,
  a.name as academy_name,
  a.logo_url as academy_logo_url,
  p.name,
  p.description,
  p.age_group,
  p.price_mnt,
  p.duration_weeks,
  p.is_active,
  l.id as location_id,
  l.name as location_name,
  l.address as location_address,
  l.city as location_city
from public.academy_programs p
join public.academy_profiles a on a.id = p.academy_id
left join public.academy_locations l on l.id = p.location_id
where p.is_active = true;

-- Active trainers with specialties array.
create or replace view public.v_public_academy_trainers
with (security_invoker = true) as
select
  t.id,
  t.academy_id,
  a.name as academy_name,
  a.logo_url as academy_logo_url,
  t.name,
  t.photo_url,
  t.specialties,
  t.bio
from public.academy_trainers t
join public.academy_profiles a on a.id = t.academy_id
where t.is_active = true;

-- Active locations with contact info.
create or replace view public.v_public_academy_locations
with (security_invoker = true) as
select
  l.id,
  l.academy_id,
  a.name as academy_name,
  l.name,
  l.address,
  l.city,
  l.hours,
  l.is_active,
  a.logo_url as academy_logo_url
from public.academy_locations l
join public.academy_profiles a on a.id = l.academy_id
where l.is_active = true;

-- Step 3: Grant access.
grant select on public.v_public_academy_programs, public.v_public_academy_trainers,
  public.v_public_academy_locations to anon, authenticated;
