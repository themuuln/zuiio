-- Task T-4.5: Sponsor placements
-- Sponsors + sponsor_placements tables, storage bucket, SECURITY DEFINER commands

-- ============================================================================
-- 1. Sponsors table
-- ============================================================================
create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  link_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 2. Sponsor placements table
-- ============================================================================
create table if not exists public.sponsor_placements (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references public.sponsors(id) on delete cascade,
  competition_id uuid not null references public.competitions(id) on delete cascade,
  slot text not null check (slot in ('standings', 'leaders', 'game', 'recap', 'award_card', 'home')),
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 3. Storage bucket for sponsor logos
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sponsor-logos', 'sponsor-logos', true, 2097152, '{image/jpeg,image/png,image/webp}')
on conflict (id) do nothing;

-- Public read access
create policy "Public read sponsor-logos" on storage.objects
  for select using (bucket_id = 'sponsor-logos');

-- Authenticated upload (admin-gated at API layer)
create policy "Authenticated upload sponsor-logos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'sponsor-logos');

-- Authenticated update
create policy "Authenticated update sponsor-logos" on storage.objects
  for update to authenticated
  using (bucket_id = 'sponsor-logos')
  with check (bucket_id = 'sponsor-logos');

-- Authenticated delete
create policy "Authenticated delete sponsor-logos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'sponsor-logos');

-- ============================================================================
-- 4. RLS — tables closed to public, access via SECURITY DEFINER only
-- ============================================================================
alter table if exists public.sponsors enable row level security;
alter table if exists public.sponsor_placements enable row level security;

-- No SELECT/INSERT/UPDATE/DELETE policies for unprivileged roles.
-- Only service_role bypasses RLS.

-- ============================================================================
-- 5. cmd_upsert_sponsor — SECURITY DEFINER
-- ============================================================================
create or replace function public.cmd_upsert_sponsor(
  p_name text,
  p_logo_url text default null,
  p_link_url text default null,
  p_id uuid default null,
  p_active boolean default true
) returns public.sponsors
language plpgsql security definer
set search_path = '' as $$
declare
  v_result public.sponsors;
begin
  if p_id is not null then
    update public.sponsors
    set name = p_name,
        logo_url = p_logo_url,
        link_url = p_link_url,
        active = p_active,
        updated_at = now()
    where id = p_id
    returning * into v_result;
    if not found then
      raise exception 'Sponsor not found' using errcode = 'P0002';
    end if;
  else
    insert into public.sponsors (name, logo_url, link_url, active)
    values (p_name, p_logo_url, p_link_url, p_active)
    returning * into v_result;
  end if;
  return v_result;
end;
$$;

-- ============================================================================
-- 6. cmd_set_placement — SECURITY DEFINER
-- ============================================================================
create or replace function public.cmd_set_placement(
  p_sponsor_id uuid,
  p_competition_id uuid,
  p_slot text,
  p_starts_on date,
  p_ends_on date
) returns public.sponsor_placements
language plpgsql security definer
set search_path = '' as $$
declare
  v_result public.sponsor_placements;
begin
  if p_slot not in ('standings', 'leaders', 'game', 'recap', 'award_card', 'home') then
    raise exception 'Invalid slot: %', p_slot;
  end if;

  insert into public.sponsor_placements (sponsor_id, competition_id, slot, starts_on, ends_on)
  values (p_sponsor_id, p_competition_id, p_slot, p_starts_on, p_ends_on)
  returning * into v_result;
  return v_result;
end;
$$;

-- ============================================================================
-- 7. v_public_sponsor_slots — active, date-valid placements
-- ============================================================================
create or replace view public.v_public_sponsor_slots
with (security_invoker = true)
as
select
  sp.id as placement_id,
  s.id as sponsor_id,
  s.name as sponsor_name,
  s.logo_url,
  s.link_url,
  sp.competition_id,
  sp.slot,
  sp.starts_on,
  sp.ends_on
from public.sponsor_placements sp
join public.sponsors s on s.id = sp.sponsor_id
where s.active = true
  and sp.starts_on <= current_date
  and sp.ends_on >= current_date;
