-- Уралдааны хүснэгт
-- 024_races.sql

create table if not exists public.races (
  id text primary key,
  name text not null,
  location text,
  date timestamptz,
  type text not null default 'local' check (type in ('naadam', 'regional', 'local')),
  status text not null default 'upcoming' check (status in ('upcoming', 'ongoing', 'completed', 'cancelled')),
  max_entries integer,
  entry_fee integer not null default 0,
  organizer_id text not null default '',
  description text,
  prize_distribution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for filtering by type
create index if not exists idx_races_type on public.races (type);

-- Index for filtering by status
create index if not exists idx_races_status on public.races (status);

-- Index for filtering by organizer
create index if not exists idx_races_organizer on public.races (organizer_id);

-- Index for date ordering
create index if not exists idx_races_date on public.races (date desc);

-- Enable RLS
alter table public.races enable row level security;

-- Everyone can read races
create policy "Anyone can read races"
  on public.races
  for select
  using (true);

-- Authenticated users can create races (organizers)
create policy "Authenticated users can create races"
  on public.races
  for insert
  with check (auth.role() = 'authenticated');

-- Organizers can update their own races
create policy "Organizers can update their own races"
  on public.races
  for update
  using (organizer_id = auth.uid()::text);

-- Organizers can delete their own races
create policy "Organizers can delete their own races"
  on public.races
  for delete
  using (organizer_id = auth.uid()::text);
