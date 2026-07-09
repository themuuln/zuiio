-- Enums
create type public.game_status as enum
  ('scheduled','live','final','verified','official','cancelled','postponed');
create type public.membership_role as enum
  ('owner','admin','manager','scorekeeper');
create type public.membership_scope as enum ('org','league','team');
create type public.competition_type as enum ('regular','playoff','cup','friendly');

-- Registry
create table public.sports (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name_mn text not null,
  name_en text not null,
  config jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'league_operator',
  created_at timestamptz not null default now()
);

create table public.leagues (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  sport_id uuid not null references public.sports(id),
  name text not null,
  slug text not null unique,
  logo_url text,
  created_at timestamptz not null default now()
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id),
  name text not null,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  unique (league_id, name)
);

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id),
  name text not null,
  type public.competition_type not null default 'regular',
  tiebreaker_rules jsonb not null default '["head_to_head","point_diff","points_for"]',
  created_at timestamptz not null default now()
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  capacity integer,
  created_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id),
  name text not null,
  short_code text not null,
  slug text not null,
  primary_color text,
  logo_url text,
  created_at timestamptz not null default now(),
  unique (league_id, slug)
);

create table public.team_seasons (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id),
  competition_id uuid not null references public.competitions(id),
  created_at timestamptz not null default now(),
  unique (team_id, competition_id)
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  name_latin text,
  dob date,
  height_cm smallint,
  weight_kg smallint,
  position text,
  nationality text default 'MN',
  photo_url text,
  user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index players_canonical_name_idx on public.players using gin (to_tsvector('simple', canonical_name));

create table public.roster_entries (
  id uuid primary key default gen_random_uuid(),
  team_season_id uuid not null references public.team_seasons(id),
  player_id uuid not null references public.players(id),
  jersey_number smallint,
  position text,
  joined_at date not null default current_date,
  left_at date,
  created_at timestamptz not null default now(),
  unique (team_season_id, player_id)
);
