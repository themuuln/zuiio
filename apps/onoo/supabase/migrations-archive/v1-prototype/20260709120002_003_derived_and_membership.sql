create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  scope_type public.membership_scope not null,
  scope_id uuid not null,
  role public.membership_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, scope_type, scope_id, role)
);

create table public.profiles (
  id uuid primary key references auth.users(id),
  display_name text,
  created_at timestamptz not null default now()
);

-- Derived tables. Columns must match BoxScoreLine in @onoo/core exactly.
create table public.game_player_stats (
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null references public.players(id),
  team_season_id uuid not null references public.team_seasons(id),
  seconds_played integer,
  pts smallint not null default 0,
  fgm smallint not null default 0, fga smallint not null default 0,
  tpm smallint not null default 0, tpa smallint not null default 0,
  ftm smallint not null default 0, fta smallint not null default 0,
  oreb smallint not null default 0, dreb smallint not null default 0,
  ast smallint not null default 0, stl smallint not null default 0,
  blk smallint not null default 0, tov smallint not null default 0,
  pf smallint not null default 0,
  primary key (game_id, player_id)
);

create table public.game_team_stats (
  game_id uuid not null references public.games(id) on delete cascade,
  team_season_id uuid not null references public.team_seasons(id),
  pts smallint not null default 0,
  fgm smallint not null default 0, fga smallint not null default 0,
  tpm smallint not null default 0, tpa smallint not null default 0,
  ftm smallint not null default 0, fta smallint not null default 0,
  oreb smallint not null default 0, dreb smallint not null default 0,
  team_reb smallint not null default 0,
  ast smallint not null default 0, stl smallint not null default 0,
  blk smallint not null default 0, tov smallint not null default 0,
  pf smallint not null default 0,
  primary key (game_id, team_season_id)
);

create table public.season_player_stats (
  competition_id uuid not null references public.competitions(id),
  player_id uuid not null references public.players(id),
  team_season_id uuid not null references public.team_seasons(id),
  gp smallint not null default 0,
  mpg real,
  pts real, fgm real, fga real, tpm real, tpa real,
  ftm real, fta real, oreb real, dreb real,
  ast real, stl real, blk real, tov real, pf real,
  primary key (competition_id, player_id)
);

create table public.standings (
  competition_id uuid not null references public.competitions(id),
  team_season_id uuid not null references public.team_seasons(id),
  wins smallint not null default 0,
  losses smallint not null default 0,
  win_pct real not null default 0,
  gb real,
  streak text,
  last10 text,
  points_for real,
  points_against real,
  primary key (competition_id, team_season_id)
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);
