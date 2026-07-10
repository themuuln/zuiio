-- Onoo V2 clean baseline. Apply only to a new pilot project.
-- RLS, commands, grants, views, and seed data are intentionally defined in later migrations.

create type public.game_status as enum (
  'scheduled', 'live_provisional', 'final_pending_review',
  'league_verified', 'official', 'cancelled', 'postponed'
);
create type public.membership_role as enum ('owner', 'admin', 'manager', 'scorekeeper');
create type public.membership_scope as enum ('org', 'league', 'team');
create type public.competition_type as enum ('regular', 'playoff', 'cup', 'friendly');

create table public.sports (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name_mn text not null,
  name_en text not null,
  config jsonb not null default '{}'::jsonb,
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
  organization_id uuid not null references public.organizations(id) on delete restrict,
  sport_id uuid not null references public.sports(id) on delete restrict,
  name text not null,
  slug text not null unique,
  logo_url text,
  created_at timestamptz not null default now()
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete restrict,
  name text not null,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  unique (league_id, name),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete restrict,
  name text not null,
  type public.competition_type not null default 'regular',
  tiebreaker_rules jsonb not null default '["head_to_head", "point_diff", "points_for"]'::jsonb,
  created_at timestamptz not null default now(),
  unique (season_id, name)
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  capacity integer check (capacity is null or capacity >= 0),
  created_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete restrict,
  name text not null,
  short_code text not null,
  slug text not null,
  primary_color text,
  logo_url text,
  created_at timestamptz not null default now(),
  unique (league_id, slug),
  unique (league_id, short_code)
);

create table public.team_seasons (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete restrict,
  competition_id uuid not null references public.competitions(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (team_id, competition_id)
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  name_latin text,
  dob date,
  height_cm smallint check (height_cm is null or height_cm > 0),
  weight_kg smallint check (weight_kg is null or weight_kg > 0),
  position text,
  nationality text not null default 'MN',
  photo_url text,
  user_id uuid unique references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index players_canonical_name_idx on public.players using gin (to_tsvector('simple', canonical_name));

create table public.roster_entries (
  id uuid primary key default gen_random_uuid(),
  team_season_id uuid not null references public.team_seasons(id) on delete restrict,
  player_id uuid not null references public.players(id) on delete restrict,
  jersey_number smallint check (jersey_number is null or jersey_number between 0 and 99),
  position text,
  joined_at date not null default current_date,
  left_at date,
  created_at timestamptz not null default now(),
  unique (team_season_id, player_id),
  check (left_at is null or left_at >= joined_at)
);

create table public.basketball_rulesets (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete restrict,
  version text not null,
  name text not null,
  rules jsonb not null,
  effective_from date not null,
  retired_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (league_id, version),
  check (retired_at is null or retired_at >= effective_from)
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete restrict,
  ruleset_id uuid not null references public.basketball_rulesets(id) on delete restrict,
  home_team_season_id uuid not null references public.team_seasons(id) on delete restrict,
  away_team_season_id uuid not null references public.team_seasons(id) on delete restrict,
  venue_id uuid references public.venues(id) on delete set null,
  scheduled_at timestamptz not null,
  status public.game_status not null default 'scheduled',
  current_period smallint not null default 0 check (current_period >= 0),
  home_score smallint check (home_score is null or home_score >= 0),
  away_score smallint check (away_score is null or away_score >= 0),
  current_revision_number integer not null default 0 check (current_revision_number >= 0),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  check (home_team_season_id <> away_team_season_id)
);
create index games_competition_idx on public.games (competition_id, scheduled_at);
create index games_status_idx on public.games (status) where status = 'live_provisional';

create table public.game_rosters (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  team_season_id uuid not null references public.team_seasons(id) on delete restrict,
  player_id uuid not null references public.players(id) on delete restrict,
  is_starter boolean not null default false,
  dnp_reason text,
  unique (game_id, player_id)
);

create table public.game_assignments (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('lead_scorer', 'backup_scorer', 'approving_official')),
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (game_id, user_id, role)
);

create table public.stat_event_types (
  key text primary key,
  sport_key text not null,
  category text not null,
  requires_player boolean not null default true
);

create table public.tracker_sessions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  scorer_id uuid not null references auth.users(id) on delete restrict,
  role text not null check (role in ('lead_scorer', 'backup_scorer')),
  device_info jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'transferred', 'closed', 'revoked')),
  last_acknowledged_sequence integer not null default 0 check (last_acknowledged_sequence >= 0),
  handed_off_to_session_id uuid references public.tracker_sessions(id) on delete set null,
  closure_reason text,
  started_at timestamptz not null default now(),
  closed_at timestamptz,
  check ((status = 'active') = (closed_at is null))
);
create unique index tracker_sessions_one_active_writer_idx
  on public.tracker_sessions (game_id) where status = 'active';
create index tracker_sessions_scorer_idx on public.tracker_sessions (scorer_id) where status = 'active';

create table public.stat_events (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  tracker_session_id uuid not null references public.tracker_sessions(id) on delete restrict,
  operation_id uuid not null,
  client_id uuid not null,
  local_seq integer not null check (local_seq > 0),
  event_type text not null references public.stat_event_types(key) on delete restrict,
  period smallint not null check (period > 0),
  clock_seconds smallint not null check (clock_seconds >= 0),
  team_season_id uuid references public.team_seasons(id) on delete restrict,
  player_id uuid references public.players(id) on delete restrict,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  voided_at timestamptz,
  voided_by uuid references auth.users(id) on delete set null,
  void_reason text,
  superseded_by uuid references public.stat_events(id) on delete set null,
  unique (operation_id),
  unique (game_id, client_id),
  unique (tracker_session_id, local_seq)
);
create index stat_events_game_idx on public.stat_events (game_id, period, clock_seconds desc, local_seq);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope_type public.membership_scope not null,
  scope_id uuid not null,
  role public.membership_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, scope_type, scope_id, role)
);
create index memberships_user_scope_idx on public.memberships (user_id, scope_type, scope_id);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.source_submissions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete restrict,
  source_type text not null check (source_type in ('tracker_journal', 'official_score_sheet', 'manual_box_score', 'import')),
  evidence_url text,
  rights_confirmed_at timestamptz,
  submitted_by uuid not null references auth.users(id) on delete restrict,
  submitted_at timestamptz not null default now(),
  normalized_payload jsonb not null,
  confidence numeric(3,2) check (confidence is null or confidence between 0 and 1),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'superseded')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  idempotency_key uuid,
  unique (submitted_by, idempotency_key),
  check ((status in ('approved', 'rejected')) = (reviewed_at is not null))
);
create index source_submissions_game_idx on public.source_submissions (game_id, submitted_at desc);
create index source_submissions_pending_idx on public.source_submissions (game_id) where status = 'pending';

create table public.game_revisions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  revision_number integer not null check (revision_number > 0),
  source_submission_id uuid not null references public.source_submissions(id) on delete restrict,
  parent_revision_id uuid references public.game_revisions(id) on delete restrict,
  state text not null default 'pending' check (state in ('pending', 'approved', 'rejected', 'superseded')),
  journal jsonb not null,
  projection jsonb not null,
  validation_warnings jsonb not null default '[]'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  unique (game_id, revision_number),
  check ((state = 'approved') = (approved_at is not null))
);
create index game_revisions_game_idx on public.game_revisions (game_id, revision_number desc);

create table public.correction_records (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete restrict,
  requested_at timestamptz not null default now(),
  reason text not null,
  evidence_url text,
  proposed_change jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'applied')),
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  resulting_revision_id uuid references public.game_revisions(id) on delete set null,
  check ((status in ('approved', 'rejected', 'applied')) = (resolved_at is not null))
);
create index correction_records_game_idx on public.correction_records (game_id, requested_at desc);
create index correction_records_pending_idx on public.correction_records (game_id) where status = 'pending';

create table public.player_aliases (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  source_submission_id uuid references public.source_submissions(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (normalized_alias)
);
create index player_aliases_player_idx on public.player_aliases (player_id);

create table public.player_merge_history (
  id uuid primary key default gen_random_uuid(),
  kept_player_id uuid not null references public.players(id) on delete restrict,
  merged_player_id uuid not null references public.players(id) on delete restrict,
  merged_by uuid not null references auth.users(id) on delete restrict,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (merged_player_id),
  check (kept_player_id <> merged_player_id)
);

create table public.game_player_stats (
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete restrict,
  team_season_id uuid not null references public.team_seasons(id) on delete restrict,
  revision_id uuid not null references public.game_revisions(id) on delete restrict,
  seconds_played integer check (seconds_played is null or seconds_played >= 0),
  pts smallint not null default 0, fgm smallint not null default 0, fga smallint not null default 0,
  tpm smallint not null default 0, tpa smallint not null default 0, ftm smallint not null default 0,
  fta smallint not null default 0, oreb smallint not null default 0, dreb smallint not null default 0,
  ast smallint not null default 0, stl smallint not null default 0, blk smallint not null default 0,
  tov smallint not null default 0, pf smallint not null default 0,
  primary key (game_id, player_id)
);

create table public.game_team_stats (
  game_id uuid not null references public.games(id) on delete cascade,
  team_season_id uuid not null references public.team_seasons(id) on delete restrict,
  revision_id uuid not null references public.game_revisions(id) on delete restrict,
  pts smallint not null default 0, fgm smallint not null default 0, fga smallint not null default 0,
  tpm smallint not null default 0, tpa smallint not null default 0, ftm smallint not null default 0,
  fta smallint not null default 0, oreb smallint not null default 0, dreb smallint not null default 0,
  team_reb smallint not null default 0, ast smallint not null default 0, stl smallint not null default 0,
  blk smallint not null default 0, tov smallint not null default 0, pf smallint not null default 0,
  primary key (game_id, team_season_id)
);

create table public.season_player_stats (
  competition_id uuid not null references public.competitions(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete restrict,
  team_season_id uuid not null references public.team_seasons(id) on delete restrict,
  gp smallint not null default 0, mpg real, pts real, fgm real, fga real, tpm real, tpa real,
  ftm real, fta real, oreb real, dreb real, ast real, stl real, blk real, tov real, pf real,
  primary key (competition_id, player_id)
);

create table public.standings (
  competition_id uuid not null references public.competitions(id) on delete cascade,
  team_season_id uuid not null references public.team_seasons(id) on delete restrict,
  wins smallint not null default 0, losses smallint not null default 0, win_pct real not null default 0,
  gb real, streak text, last10 text, points_for real, points_against real,
  primary key (competition_id, team_season_id)
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_entity_idx on public.audit_log (entity_type, entity_id, created_at desc);
create index audit_log_user_idx on public.audit_log (user_id, created_at desc);
