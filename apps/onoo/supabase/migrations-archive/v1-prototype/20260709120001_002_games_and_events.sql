create table public.games (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id),
  home_team_season_id uuid not null references public.team_seasons(id),
  away_team_season_id uuid not null references public.team_seasons(id),
  venue_id uuid references public.venues(id),
  scheduled_at timestamptz not null,
  status public.game_status not null default 'scheduled',
  current_period smallint not null default 0,
  home_score smallint,
  away_score smallint,
  created_at timestamptz not null default now(),
  check (home_team_season_id <> away_team_season_id)
);
create index games_competition_idx on public.games (competition_id, scheduled_at);
create index games_status_idx on public.games (status) where status = 'live';

create table public.game_rosters (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  team_season_id uuid not null references public.team_seasons(id),
  player_id uuid not null references public.players(id),
  is_starter boolean not null default false,
  dnp_reason text,
  unique (game_id, player_id)
);

create table public.game_assignments (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  role text not null default 'scorekeeper',
  unique (game_id, user_id, role)
);

create table public.stat_event_types (
  key text primary key,
  sport_key text not null,
  category text not null,
  requires_player boolean not null default true
);

create table public.stat_events (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id),
  client_id uuid not null,
  local_seq integer not null,
  event_type text not null references public.stat_event_types(key),
  period smallint not null,
  clock_seconds smallint not null,
  team_season_id uuid references public.team_seasons(id),
  player_id uuid references public.players(id),
  payload jsonb not null default '{}',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  superseded_by uuid references public.stat_events(id),
  unique (game_id, client_id)
);
create index stat_events_game_idx on public.stat_events (game_id, period, clock_seconds desc, local_seq);
