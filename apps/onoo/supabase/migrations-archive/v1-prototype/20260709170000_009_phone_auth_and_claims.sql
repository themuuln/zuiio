-- Phone OTP auth support
-- Note: Supabase Auth handles phone OTP natively, we just need to ensure phone numbers are stored

-- Add phone number to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone text unique;
  END IF;
END $$;

-- Athlete claim requests table
create table public.athlete_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (player_id, status) -- only one pending claim per player
);

-- RLS policies for athlete_claims
alter table public.athlete_claims enable row level security;

-- Users can view their own claims
create policy "Users can view their own athlete claims"
  on public.athlete_claims for select
  using (auth.uid() = user_id);

-- Users can create claims for themselves
create policy "Users can create athlete claims"
  on public.athlete_claims for insert
  with check (auth.uid() = user_id);

-- League admins can view all claims for their leagues
create policy "Admins can view claims for their leagues"
  on public.athlete_claims for select
  using (
    exists (
      select 1 from public.memberships m
      join public.games g on g.competition_id in (
        select c.id from public.competitions c
        join public.seasons s on s.id = c.season_id
        join public.leagues l on l.id = s.league_id
        where l.organization_id = m.organization_id
      )
      where m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
    )
  );

-- League admins can update claims
create policy "Admins can update athlete claims"
  on public.athlete_claims for update
  using (
    exists (
      select 1 from public.memberships m
      where m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
    )
  );

-- Add player_id to profiles to link verified athletes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'player_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN player_id uuid references public.players(id) on delete set null;
  END IF;
END $$;

-- Indexes
create index idx_athlete_claims_user_id on public.athlete_claims(user_id);
create index idx_athlete_claims_player_id on public.athlete_claims(player_id);
create index idx_athlete_claims_status on public.athlete_claims(status);
