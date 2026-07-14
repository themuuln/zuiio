-- Уралдааны бүртгэлийн хүснэгт
-- 025_race_entries.sql

create table if not exists public.race_entries (
  id text primary key,
  race_id text not null references public.races(id) on delete cascade,
  horse_id text not null,
  owner_id text not null default '',
  jockey_name text,
  status text not null default 'registered' check (status in ('registered', 'confirmed', 'competed', 'scratched')),
  result text,
  placement integer,
  prize integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for filtering by race
create index if not exists idx_race_entries_race on public.race_entries (race_id);

-- Index for filtering by horse
create index if not exists idx_race_entries_horse on public.race_entries (horse_id);

-- Index for unique constraint (race + horse)
create unique index if not exists idx_race_entries_unique_race_horse
  on public.race_entries (race_id, horse_id)
  where status != 'scratched';

-- Enable RLS
alter table public.race_entries enable row level security;

-- Everyone can read race entries
create policy "Anyone can read race entries"
  on public.race_entries
  for select
  using (true);

-- Authenticated users can register their horses
create policy "Authenticated users can register entries"
  on public.race_entries
  for insert
  with check (auth.role() = 'authenticated');

-- Owners can update their own entries
create policy "Owners can update their own entries"
  on public.race_entries
  for update
  using (owner_id = auth.uid()::text);

-- Organizers can update any entry in their race (for results)
create policy "Organizers can update entries in their races"
  on public.race_entries
  for update
  using (
    exists (
      select 1 from public.races
      where races.id = race_entries.race_id
      and races.organizer_id = auth.uid()::text
    )
  );
