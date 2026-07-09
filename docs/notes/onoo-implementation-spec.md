# Onoo — Implementation Spec (instructions for the implementing agent)

> Companion to `onoo-sports-stats-platform-plan.md` (the "why/what"). This document is the "how".
> It is written for an AI coding agent. Follow it **exactly**. Where this spec and your own judgment
> conflict, follow the spec. Where the spec is silent, follow §2 Conventions, then existing repo patterns.

---

## 0. Rules for the implementing agent — READ FIRST

1. **Work through §11 Task Plan in order.** Do not start a task before its `depends` tasks pass their acceptance checks.
2. **Run every acceptance check** at the end of each task. If a check fails, fix it before moving on. Never mark a task done with failing checks.
3. **Do not invent scope.** No extra features, tables, routes, deps, or "improvements" beyond what a task lists. If something seems missing, add a `TODO(spec):` comment and continue.
4. **Do not modify anything outside** `apps/onoo/`, `apps/onoo-app/`, `apps/onoo/packages/`, and `supabase/` inside those apps — except the single root `pnpm-workspace.yaml` check in T-001 (read-only) and lockfile changes from installs. Never edit other apps or root `packages/*`.
5. **Copy SQL from this spec verbatim** into migration files. Do not "clean up" or reorder SQL.
6. **One migration file per numbered section in §4/§5/§6.** Never edit an already-applied migration; create a new one.
7. **Derived data is never hand-written.** `game_player_stats`, `game_team_stats`, `season_player_stats`, `standings` are written ONLY by the derive/refresh functions in §8. No UI or query may insert/update them.
8. **All stat math lives in `@onoo/core`** (`src/stats/`). Never duplicate stat calculations in app code or SQL (season rollups in §5.6 are the only SQL aggregation allowed).
9. Commit after every completed task: `feat(onoo): T-0XX <task title>`. Do not commit `.env*` files.
10. If a command fails twice for environment reasons (network, missing login), stop and report; do not work around by mocking or skipping.

---

## 1. Deliverables & repo layout

Three new workspace packages (pnpm already includes `apps/*` and `apps/*/packages/*`):

```
apps/
  onoo/                          # Next.js 16 App Router — public web + /admin + /tracker
    supabase/                    # supabase project: config.toml, migrations/, functions/, seed.sql
    src/app/...                  # routes per §9
    packages/
      core/                      # @onoo/core — pure TS shared domain package (no React, no DOM, no RN)
  onoo-app/                      # Expo ~57 — fan & athlete app (phase 3; scaffold only until T-030)
```

Package names: `onoo-web` (apps/onoo), `onoo-app`, `@onoo/core`. Both apps depend on `"@onoo/core": "workspace:*"` (pnpm resolves by name; nesting under apps/onoo/packages is fine).

---

## 2. Conventions (match the existing repo)

| Concern | Rule |
|---|---|
| Package manager | `pnpm`, workspace protocol `workspace:*`. Install with `pnpm -F <pkg> add <dep>` from repo root |
| Web | `next@16.2.7`, `react@19.2.4`, Tailwind v4 (`@tailwindcss/postcss`), shadcn/ui, `lucide-react` — mirror `apps/tamga-web/package.json` |
| Mobile | `expo@~57`, RN `0.86`, `expo-router`, NativeWind 4, `@tanstack/react-query@^5` — mirror `apps/tolom-mobile/package.json` |
| Lint/format | Biome (`"lint": "biome check"`, `"format": "biome format --write"`); copy biome config pattern from `apps/tamga-web` |
| Internal package | `"type": "module"`, `exports` map to `./src/*.ts` source (no build step), `typescript` devDep — mirror `packages/supabase/package.json` |
| TypeScript | strict; **`any` is forbidden**; `tsc --noEmit` must pass (script name: `validate:types`) |
| Tests | `vitest` in `@onoo/core` only (for now). Script: `"test": "vitest run"` |
| Supabase JS | `@supabase/supabase-js@^2` |
| IDs | `uuid` PKs via `gen_random_uuid()`; slugs for public URLs where specified |
| Naming | tables `snake_case` plural; TS types `PascalCase`; files `kebab-case.ts` |
| i18n | UI strings in `mn` (default) and `en`; no hardcoded UI strings in components — use the dictionary module (§9.6) |
| Env vars | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (web); `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (app). Provide `.env.example` in both apps. Service role key ONLY inside Edge Functions (auto-injected) — never in app code |

---

## 3. Environment & Supabase setup

```bash
# From repo root
supabase --version                     # requires v2+; if missing: brew install supabase/tap/supabase
cd apps/onoo
supabase init                          # creates supabase/config.toml
supabase start                         # local stack (Docker required)
supabase db reset                      # applies migrations + seed.sql (run after every new migration)
supabase gen types typescript --local > packages/core/src/types/database.ts
```

- Local dev uses `supabase start` URLs/keys (printed by the CLI) in `.env.local`.
- Hosted project creation/linking (`supabase link`) is a HUMAN step — if credentials are absent, develop fully against local and note it.
- Realtime must be enabled for `stat_events` and `games` (done in migration 004).
- Storage buckets `team-logos`, `player-photos` (public read) — migration 006.

---

## 4. Database migrations — schema (copy verbatim)

File naming: `apps/onoo/supabase/migrations/<timestamp>_<name>.sql` via `supabase migration new <name>`.

### 4.1 Migration `001_enums_and_registry`

```sql
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
  key text not null unique,                       -- 'basketball_5x5'
  name_mn text not null,
  name_en text not null,
  config jsonb not null default '{}',             -- see §6 seed for shape
  created_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'league_operator',   -- 'federation' | 'league_operator' | 'club'
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
  name text not null,                             -- '2026-2027'
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  unique (league_id, name)
);

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id),
  name text not null,                             -- 'Улирлын тоглолт'
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
  short_code text not null,                       -- 3-5 chars, e.g. 'ХАС'
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
  canonical_name text not null,                   -- display name, Cyrillic
  name_latin text,                                -- romanized
  dob date,
  height_cm smallint,
  weight_kg smallint,
  position text,                                  -- 'PG'|'SG'|'SF'|'PF'|'C' (free text, validated in app)
  nationality text default 'MN',
  photo_url text,
  user_id uuid references auth.users(id),         -- set when athlete claims profile (phase 3)
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
```

### 4.2 Migration `002_games_and_events`

```sql
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
  key text primary key,                           -- see §6 seed for the full dictionary
  sport_key text not null,
  category text not null,
  requires_player boolean not null default true
);

create table public.stat_events (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id),
  client_id uuid not null,                        -- generated on device; idempotency key
  local_seq integer not null,                     -- monotonic per device per game
  event_type text not null references public.stat_event_types(key),
  period smallint not null,
  clock_seconds smallint not null,                -- seconds REMAINING in period at event time
  team_season_id uuid references public.team_seasons(id),
  player_id uuid references public.players(id),
  payload jsonb not null default '{}',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,                         -- soft delete (undo)
  superseded_by uuid references public.stat_events(id),
  unique (game_id, client_id)
);
create index stat_events_game_idx on public.stat_events (game_id, period, clock_seconds desc, local_seq);
```

### 4.3 Migration `003_derived_and_membership`

```sql
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

-- Derived tables. Columns must match BoxScoreLine in @onoo/core exactly (§7.4).
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
  gp smallint not null default 0,
  seconds_played integer,
  pts integer not null default 0,
  fgm integer not null default 0, fga integer not null default 0,
  tpm integer not null default 0, tpa integer not null default 0,
  ftm integer not null default 0, fta integer not null default 0,
  oreb integer not null default 0, dreb integer not null default 0,
  ast integer not null default 0, stl integer not null default 0,
  blk integer not null default 0, tov integer not null default 0,
  pf integer not null default 0,
  primary key (competition_id, player_id)
);

create table public.standings (
  competition_id uuid not null references public.competitions(id),
  team_season_id uuid not null references public.team_seasons(id),
  w smallint not null default 0,
  l smallint not null default 0,
  points_for integer not null default 0,
  points_against integer not null default 0,
  primary key (competition_id, team_season_id)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);
```

### 4.4 Migration `004_realtime`

```sql
alter publication supabase_realtime add table public.stat_events;
alter publication supabase_realtime add table public.games;
```

---

## 5. Migration `005_rls` — security (copy verbatim)

```sql
-- Helper functions
create or replace function public.game_league_id(p_game_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select s.league_id
  from games g
  join competitions c on c.id = g.competition_id
  join seasons s on s.id = c.season_id
  where g.id = p_game_id;
$$;

create or replace function public.is_league_admin(p_league_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.user_id = auth.uid()
      and ((m.scope_type = 'league' and m.scope_id = p_league_id)
        or (m.scope_type = 'org' and m.scope_id =
              (select organization_id from leagues where id = p_league_id)))
      and m.role in ('owner','admin')
  );
$$;

create or replace function public.is_game_scorekeeper(p_game_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from game_assignments ga
    where ga.game_id = p_game_id and ga.user_id = auth.uid() and ga.role = 'scorekeeper'
  );
$$;

-- Enable RLS on ALL tables (public read for everything except memberships/audit_log)
do $$
declare t text;
begin
  foreach t in array array[
    'sports','organizations','leagues','seasons','competitions','venues','teams',
    'team_seasons','players','roster_entries','games','game_rosters','game_assignments',
    'stat_event_types','stat_events','memberships','profiles','game_player_stats',
    'game_team_stats','season_player_stats','standings','audit_log'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Public read (anon + authenticated) for everything fan-facing
do $$
declare t text;
begin
  foreach t in array array[
    'sports','organizations','leagues','seasons','competitions','venues','teams',
    'team_seasons','players','roster_entries','games','game_rosters',
    'stat_event_types','game_player_stats','game_team_stats',
    'season_player_stats','standings'
  ] loop
    execute format(
      'create policy %I_public_read on public.%I for select to anon, authenticated using (true)', t, t);
  end loop;
end $$;

-- stat_events: public read of non-deleted only
create policy stat_events_public_read on public.stat_events
  for select to anon, authenticated using (deleted_at is null);

-- memberships / profiles: users see their own
create policy memberships_own_read on public.memberships
  for select to authenticated using (user_id = auth.uid());
create policy profiles_own on public.profiles
  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- League-admin writes on registry tables scoped by league
create policy leagues_admin_write on public.leagues
  for update to authenticated using (public.is_league_admin(id));
create policy seasons_admin_write on public.seasons
  for all to authenticated
  using (public.is_league_admin(league_id)) with check (public.is_league_admin(league_id));
create policy competitions_admin_write on public.competitions
  for all to authenticated
  using (public.is_league_admin((select league_id from seasons where id = season_id)))
  with check (public.is_league_admin((select league_id from seasons where id = season_id)));
create policy teams_admin_write on public.teams
  for all to authenticated
  using (public.is_league_admin(league_id)) with check (public.is_league_admin(league_id));
create policy team_seasons_admin_write on public.team_seasons
  for all to authenticated
  using (public.is_league_admin((select league_id from teams where id = team_id)))
  with check (public.is_league_admin((select league_id from teams where id = team_id)));
create policy players_admin_write on public.players
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
  -- NOTE: players are global (cross-league). Any authenticated staff may create;
  -- tighten in a later migration when team-manager roles ship.
create policy roster_entries_admin_write on public.roster_entries
  for all to authenticated
  using (public.is_league_admin((select l.id from team_seasons ts
          join teams t on t.id = ts.team_id join leagues l on l.id = t.league_id
          where ts.id = team_season_id)))
  with check (public.is_league_admin((select l.id from team_seasons ts
          join teams t on t.id = ts.team_id join leagues l on l.id = t.league_id
          where ts.id = team_season_id)));
create policy venues_auth_write on public.venues
  for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

-- games: admin full write; scorekeeper limited update while game not locked
create policy games_admin_write on public.games
  for all to authenticated
  using (public.is_league_admin(public.game_league_id(id)))
  with check (public.is_league_admin(public.game_league_id(id)));
create policy games_scorekeeper_update on public.games
  for update to authenticated
  using (public.is_game_scorekeeper(id) and status in ('scheduled','live','final'))
  with check (status in ('scheduled','live','final'));

create policy game_rosters_write on public.game_rosters
  for all to authenticated
  using (public.is_league_admin(public.game_league_id(game_id))
         or public.is_game_scorekeeper(game_id))
  with check (public.is_league_admin(public.game_league_id(game_id))
         or public.is_game_scorekeeper(game_id));

create policy game_assignments_admin on public.game_assignments
  for all to authenticated
  using (public.is_league_admin(public.game_league_id(game_id)))
  with check (public.is_league_admin(public.game_league_id(game_id)));

-- stat_events: scorekeeper insert during live game; soft-delete/supersede only, never hard delete
create policy stat_events_scorekeeper_insert on public.stat_events
  for insert to authenticated
  with check (
    public.is_game_scorekeeper(game_id)
    and (select status from games where id = game_id) in ('live','final')
  );
create policy stat_events_scorekeeper_update on public.stat_events
  for update to authenticated
  using (
    public.is_game_scorekeeper(game_id)
    and (select status from games where id = game_id) in ('live','final')
  );
create policy stat_events_admin_update on public.stat_events
  for update to authenticated
  using (public.is_league_admin(public.game_league_id(game_id)));
-- NO delete policy on stat_events: hard deletes are impossible by design.

-- Derived tables: NO write policies. Only the service role (Edge Functions) writes them.
```

### 5.6 Migration `006_rollups_and_storage` — season rollup functions + buckets

```sql
-- Season aggregates: plain sums over per-game derived rows. The ONLY SQL aggregation allowed.
create or replace function public.refresh_season_player_stats(p_competition_id uuid)
returns void language sql security definer set search_path = public as $$
  delete from season_player_stats where competition_id = p_competition_id;
  insert into season_player_stats (competition_id, player_id, gp, seconds_played,
    pts, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, ast, stl, blk, tov, pf)
  select g.competition_id, s.player_id, count(*)::smallint, sum(s.seconds_played),
    sum(s.pts), sum(s.fgm), sum(s.fga), sum(s.tpm), sum(s.tpa), sum(s.ftm), sum(s.fta),
    sum(s.oreb), sum(s.dreb), sum(s.ast), sum(s.stl), sum(s.blk), sum(s.tov), sum(s.pf)
  from game_player_stats s
  join games g on g.id = s.game_id
  where g.competition_id = p_competition_id
    and g.status in ('final','verified','official')
  group by g.competition_id, s.player_id;
$$;

create or replace function public.refresh_standings(p_competition_id uuid)
returns void language sql security definer set search_path = public as $$
  delete from standings where competition_id = p_competition_id;
  insert into standings (competition_id, team_season_id, w, l, points_for, points_against)
  select p_competition_id, ts.id,
    count(*) filter (where (g.home_team_season_id = ts.id and g.home_score > g.away_score)
                     or (g.away_team_season_id = ts.id and g.away_score > g.home_score)),
    count(*) filter (where (g.home_team_season_id = ts.id and g.home_score < g.away_score)
                     or (g.away_team_season_id = ts.id and g.away_score < g.home_score)),
    coalesce(sum(case when g.home_team_season_id = ts.id then g.home_score else g.away_score end), 0),
    coalesce(sum(case when g.home_team_season_id = ts.id then g.away_score else g.home_score end), 0)
  from team_seasons ts
  left join games g on g.competition_id = p_competition_id
    and g.status in ('final','verified','official')
    and g.home_score is not null and g.away_score is not null
    and (g.home_team_season_id = ts.id or g.away_team_season_id = ts.id)
  where ts.competition_id = p_competition_id
  group by ts.id;
$$;

-- Storage buckets
insert into storage.buckets (id, name, public) values
  ('team-logos','team-logos', true), ('player-photos','player-photos', true)
on conflict (id) do nothing;
create policy storage_public_read on storage.objects for select to anon, authenticated
  using (bucket_id in ('team-logos','player-photos'));
create policy storage_auth_write on storage.objects for insert to authenticated
  with check (bucket_id in ('team-logos','player-photos'));
```

---

## 6. Seed data — `apps/onoo/supabase/seed.sql`

Must contain, with FIXED uuids (hardcode literal uuids so tests/dev links are stable):

1. **Sport** `basketball_5x5` with config:
   ```json
   {"periods": 4, "period_minutes": 10, "overtime_minutes": 5,
    "fouls_to_bonus": 5, "personal_foul_limit": 5, "players_on_court": 5}
   ```
2. **The full stat_event_types dictionary** (all rows, `sport_key = 'basketball_5x5'`):

   | key | category | requires_player |
   |---|---|---|
   | `shot_2pt_made` | shot | true |
   | `shot_2pt_missed` | shot | true |
   | `shot_3pt_made` | shot | true |
   | `shot_3pt_missed` | shot | true |
   | `ft_made` | shot | true |
   | `ft_missed` | shot | true |
   | `rebound_off` | rebound | true |
   | `rebound_def` | rebound | true |
   | `rebound_team` | rebound | false |
   | `steal` | defense | true |
   | `block` | defense | true |
   | `turnover` | offense | true |
   | `foul_personal` | foul | true |
   | `foul_technical` | foul | true |
   | `substitution` | admin | false |
   | `timeout` | admin | false |
   | `period_start` | admin | false |
   | `period_end` | admin | false |
   | `game_start` | admin | false |
   | `game_end` | admin | false |

   **Payload contracts** (enforced by Zod in `@onoo/core`, not by the DB):
   - `shot_*_made`: `{ assisted_by?: uuid, x?: number, y?: number }` — assists are ONLY recorded here, never as a separate event
   - `shot_*_missed`: `{ blocked_by?: uuid, x?: number, y?: number }` — blocks credit `blocked_by` AND require a separate `block` event? **No** — blocks are counted ONLY from the `block` event; `blocked_by` on the miss is informational. Single source per stat, always.
   - `turnover`: `{ stolen_by?: uuid }` — steals are counted ONLY from the `steal` event
   - `foul_personal`: `{ fouled_player?: uuid, foul_type?: 'shooting'|'non_shooting'|'offensive' }`
   - `substitution`: `{ in_player_id: uuid, out_player_id: uuid }`, `team_season_id` set, `player_id` null
   - `timeout`: `team_season_id` set
   - `period_start`/`period_end`: `period` set, `clock_seconds` = period length / 0
3. One organization, one league (`slug 'space-league'`), season `'2026-2027'`, one `regular` competition.
4. Two teams (slugs `team-a`, `team-b`), team_seasons, 10 players per team with Mongolian names, roster_entries with jersey numbers.
5. One venue; three games: one `scheduled` (in the future), one `scheduled` for tracker testing, one left for backfill testing.
6. Note in a SQL comment: dev auth users + memberships/game_assignments cannot be seeded portably; T-013 creates them via a script using the local service key.

---

## 7. `@onoo/core` — package spec

Location `apps/onoo/packages/core`. `package.json` mirrors `@zuiio/supabase` style:

```json
{
  "name": "@onoo/core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./types": "./src/types/index.ts",
    "./stats": "./src/stats/index.ts",
    "./events": "./src/events/index.ts",
    "./sync": "./src/sync/index.ts",
    "./format": "./src/format/index.ts"
  },
  "scripts": { "test": "vitest run", "validate:types": "tsc --noEmit" },
  "dependencies": { "zod": "^3" },
  "devDependencies": { "typescript": "^5", "vitest": "^3" }
}
```

**Hard constraints:** no React, no DOM APIs, no react-native imports, no `@supabase/supabase-js` runtime dependency (types only, via `import type`). Everything is pure functions — this package runs identically in Next.js server components, the browser tracker, Edge Functions (Deno), and Expo.

### 7.1 `src/types/`
- `database.ts` — generated by `supabase gen types` (never hand-edit)
- `index.ts` — domain aliases: `type StatEvent = Tables<'stat_events'>` etc., plus `SportConfig` (Zod-parsed from `sports.config`)

### 7.2 `src/events/`
- `dictionary.ts` — `export const EVENT_TYPES` mirroring §6.2 exactly (keys, categories, requires_player) as a `const` object; `EventTypeKey` union derived from it
- `payloads.ts` — Zod schema per event type (contracts in §6.2); `validateEvent(e): ValidationResult`
- `ordering.ts` — `export function sortEvents(events)`: order by `period ASC, clock_seconds DESC, local_seq ASC`. This is THE canonical ordering; import it everywhere, never re-implement.

### 7.3 `src/stats/derive.ts` — the box score derivation (single implementation for the whole product)

```ts
export function deriveBoxScore(input: {
  events: StatEvent[];          // caller must pre-filter deleted_at == null
  rosters: GameRoster[];
  sportConfig: SportConfig;
}): {
  players: BoxScoreLine[];      // one per rostered player who appeared or has a stat
  teams: TeamBoxScoreLine[];    // exactly 2
  homeAwayScore: { [teamSeasonId: string]: number };
  warnings: DeriveWarning[];    // never throw on bad data — warn and continue
}
```

**Stat increment table** (implement as a lookup, not a switch cascade):

| event_type | increments for `player_id` | other increments |
|---|---|---|
| shot_2pt_made | pts+2, fgm+1, fga+1 | `payload.assisted_by` → ast+1 |
| shot_2pt_missed | fga+1 | — |
| shot_3pt_made | pts+3, fgm+1, fga+1, tpm+1, tpa+1 | `payload.assisted_by` → ast+1 |
| shot_3pt_missed | fga+1, tpa+1 | — |
| ft_made | pts+1, ftm+1, fta+1 | — |
| ft_missed | fta+1 | — |
| rebound_off | oreb+1 | — |
| rebound_def | dreb+1 | — |
| rebound_team | — | team_reb+1 on team line |
| steal | stl+1 | — |
| block | blk+1 | — |
| turnover | tov+1 | — |
| foul_personal | pf+1 | — |
| foul_technical | pf+1 | — |
| all `admin` category | — | — (used for minutes/timeline only) |

Team lines = sum of their players' lines + team_reb. Team `pts` MUST equal the running score; `homeAwayScore` comes from the same accumulation (never track score separately).

**Minutes (`seconds_played`) algorithm:**
1. On-court set at period start: for period 1, `game_rosters.is_starter`; for later periods, carry over the on-court set from the previous period's end.
2. Process events in canonical order. `substitution` swaps `out_player_id` → `in_player_id` in the on-court set at that event's clock time.
3. Credit each on-court player `(clock_at_interval_start - clock_at_interval_end)` seconds per interval within a period; period boundaries close intervals at clock 0 and reopen at full period length.
4. Inconsistencies (sub-in for a player already on court, stat by a player not on court, >5 on court) do NOT throw — emit a `DeriveWarning` with event id, and for a stat-by-off-court player still count the stat.
5. If no `substitution`/`period_start` events exist at all (manual box entry games), return `seconds_played: null` for everyone.

### 7.4 `BoxScoreLine` type — must match `game_player_stats` columns 1:1
`{ playerId, teamSeasonId, secondsPlayed: number | null, pts, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, ast, stl, blk, tov, pf }`

### 7.5 `src/stats/derive.test.ts` — REQUIRED test vectors

Test 1 (counting): given this event list (period 1, clock counts down from 600), expect exactly the table below. Players: A1, A2, A3 (team A starters incl.), B1, B2 (team B).

| # | clock | event | player | payload |
|---|---|---|---|---|
| 1 | 600 | period_start | — | — |
| 2 | 580 | shot_2pt_made | A1 | `{assisted_by: A2}` |
| 3 | 560 | shot_3pt_missed | B1 | — |
| 4 | 558 | rebound_def | A3 | — |
| 5 | 540 | shot_3pt_made | A2 | — |
| 6 | 520 | turnover | B2 | `{stolen_by: A1}` |
| 7 | 519 | steal | A1 | — |
| 8 | 500 | foul_personal | B1 | `{fouled_player: A1, foul_type: 'shooting'}` |
| 9 | 499 | ft_made | A1 | — |
| 10 | 499 | ft_missed | A1 | — |
| 11 | 497 | rebound_off | A1 | — |
| 12 | 490 | shot_2pt_missed | A1 | `{blocked_by: B2}` |
| 13 | 490 | block | B2 | — |
| 14 | 488 | rebound_team | — (team B) | — |
| 15 | 0 | period_end | — | — |

Expected: A1 `{pts 3, fgm 1, fga 2, ftm 1, fta 2, oreb 1, stl 1}`; A2 `{pts 3, fgm 1, fga 1, tpm 1, tpa 1, ast 1}`; A3 `{dreb 1}`; B1 `{fga 1, tpa 1, pf 1}`; B2 `{tov 1, blk 1}`; team A pts 6, team B pts 0, team B team_reb 1; score `{A: 6, B: 0}`.

Test 2 (minutes): starters A1–A5 play period 1 (600s each); at clock 300 of period 2, `substitution {in: A6, out: A1}`; game ends after period 2. Expect A1 = 900s, A6 = 300s, A2–A5 = 1200s.

Test 3 (warnings): stat event for a player not on court → stat counted + 1 warning; 2 subs with same in-player → warning, no crash.

### 7.6 `src/stats/advanced.ts` (Phase 3, T-034) — eFG%, TS%, per-36; pure functions over `BoxScoreLine`.

### 7.7 `src/sync/` — offline event queue (used by the tracker)

- `queue.ts`: `EventQueue` interface + pure reducer. Storage adapter is injected (web: IndexedDB via `idb`; the adapter lives in the app, NOT here).
- Contract: `enqueue(event)` assigns `client_id` (caller passes a uuid factory), `local_seq` = last+1; `pendingBatch()` returns unsynced in `local_seq` order; `markSynced(clientIds)`.
- Sync rule (implemented in the app): push pending batch with `upsert(..., { onConflict: 'game_id,client_id', ignoreDuplicates: true })` every 3s and on `online` event. Retry forever with backoff; NEVER drop events.
- Undo = update `deleted_at` locally + queue a "tombstone" op; Edit = tombstone old + enqueue replacement with fresh `client_id` and `superseded_by` = old id. The queue stores ops `{kind: 'insert' | 'soft_delete'}`.

### 7.8 `src/format/` — `formatClock(seconds)` → `"7:42"`, name/percentage formatters. `src/i18n/stats.ts` — stat label dictionary mn/en (`pts` → `Оноо`/`PTS`, etc.).

---

## 8. Edge Function — `derive-game`

Path `apps/onoo/supabase/functions/derive-game/index.ts` (Deno). Single function, two modes.

Request: `POST { game_id: string, mode: 'finalize' | 'verify' }` with the caller's JWT.

Steps (in order, fail fast with 4xx on violations):
1. Auth: `finalize` requires scorekeeper-of-game or league admin; `verify` requires league admin. Check via the caller-JWT client + `is_game_scorekeeper` / `is_league_admin` RPC.
2. Load game, non-deleted `stat_events`, `game_rosters`, sport config (service-role client).
3. Run `deriveBoxScore` from `@onoo/core` (import via relative path or npm specifier per Supabase functions config).
4. In one transaction (use a single RPC `apply_derived_stats` defined in migration `007`, or sequential service-role writes if RPC is too complex — RPC preferred):
   delete + insert `game_player_stats` and `game_team_stats` rows; update `games.home_score/away_score` from derived score; set `games.status` = `'final'` (finalize, only from `live`) or `'verified'` (verify, only from `final`).
5. Call `refresh_season_player_stats(competition_id)` and `refresh_standings(competition_id)`.
6. Insert `audit_log` row (`action: 'derive-game:' || mode`).
7. Return `{ ok: true, warnings }`.

Status transitions allowed: `scheduled→live` (tracker), `live→final` (finalize), `final→verified` (verify), `verified→official` (admin UI, direct update). Reject anything else with 409.

Manual box-score entry (backfill) does NOT use this function: T-018 builds an admin form that writes `game_player_stats` directly via a second Edge Function `manual-box-entry` (league admin only; computes team lines from player lines; sets scores + status `final`; same rollup calls).

---

## 9. Web app `apps/onoo` (Next.js) — spec

Scaffold to mirror `apps/tamga-web` (Next 16.2.7, React 19.2.4, Tailwind v4, shadcn/ui, biome). Add deps: `@supabase/supabase-js`, `@supabase/ssr`, `@tanstack/react-query@^5`, `@onoo/core`, `idb`, `zod`.

### 9.1 Supabase clients
`src/lib/supabase/server.ts` (using `@supabase/ssr` `createServerClient` + Next cookies) and `src/lib/supabase/client.ts` (`createBrowserClient`). Follow the current `@supabase/ssr` docs (use `getAll`/`setAll` cookie methods — NOT the deprecated `get/set/remove`).

### 9.2 Route map (public — all RSC, fetch on server)

| Route | Data | Notes |
|---|---|---|
| `/` | today's + live games, standings snippet | revalidate 60 |
| `/games` | schedule/results by date | searchParams `?date=` |
| `/games/[id]` | game header + box score | **live**: client component subscribing to Realtime `stat_events` inserts for the game, deriving via `deriveBoxScore` in browser; **final/verified/official**: RSC reading `game_player_stats` |
| `/standings` | `standings` + team names | tiebreakers/pct/GB computed in `@onoo/core` |
| `/teams/[slug]` | team, roster, schedule, `game_team_stats` season sums | |
| `/players/[id]` | player bio, `season_player_stats` by competition, game log from `game_player_stats` | `generateMetadata` with player name — SEO critical |
| `/leaders` | `season_player_stats` sorted by per-game avgs, min GP filter `gp >= 1` MVP | |

All public pages: `generateMetadata`, mn-first strings via §9.6, mobile-responsive.

### 9.3 `/admin` (route group `(admin)`, layout enforces session + membership; redirect to `/admin/login` otherwise)

Pages, all thin CRUD over Supabase with Zod-validated forms (react-hook-form + shadcn):
`/admin` dashboard (games needing verification), `/admin/leagues`, `/admin/seasons`, `/admin/competitions`, `/admin/teams`, `/admin/teams/[id]/roster`, `/admin/players` (search + create + **duplicate warning**: on create, fuzzy-match `canonical_name`/`name_latin`, show existing matches before allowing save), `/admin/games` (schedule game: pick competition, teams, venue, datetime; assign scorekeeper by email lookup), `/admin/games/[id]` (detail: rosters, assignments, status; buttons: Verify → calls `derive-game` mode verify; Mark official), `/admin/games/[id]/box-entry` (manual backfill form per §8).

### 9.4 `/tracker/[gameId]` — the courtside tracker (client component, PWA-capable)

Layout (landscape tablet, three zones):
- **Top bar:** score, period, clock (mm:ss), clock start/stop (single large toggle), period advance, sync indicator (`n queued / synced ✓`), game status.
- **Left/right rails:** the 5 on-court players per team as large buttons (name + jersey); bench players in a drawer; tapping a bench player during sub flow completes a substitution.
- **Center action grid:** after selecting a player: `2PT ✓`, `2PT ✗`, `3PT ✓`, `3PT ✗`, `FT ✓`, `FT ✗`, `OREB`, `DREB`, `AST?` (only offered as follow-up after made shot: "assisted by?" → tap teammate or skip), `STL`, `BLK`, `TOV`, `FOUL`; team-level buttons: `TEAM REB`, `TIMEOUT`, `SUB`.
- **Bottom strip:** last 6 events, newest first; tap → undo (soft delete) or reassign player (tombstone + re-insert per §7.7).

State machine: `setup` (pick starters if not set → writes `game_rosters.is_starter`, sets status `live`, emits `game_start` + `period_start`) → `live` ⇄ `period_break` (emit `period_end`/`period_start`) → `finished` (emit `game_end`, call `derive-game` finalize).

Rules:
- Every user action creates an event through `@onoo/core` validation FIRST, queue SECOND (IndexedDB via `idb`), UI update from the local event list (derive box score client-side on every change — it's fast), network LAST (background sync per §7.7).
- Clock: local `setInterval` ticking `clock_seconds` down while running; events stamp current `(period, clock_seconds)`. Clock editable via tap-on-clock dialog.
- Foul bookkeeping: after `foul_personal`, show team foul count and the player's total; at limit (config `personal_foul_limit`) show foul-out banner (no auto-sub).
- Reload safety: on mount, hydrate the full local event log for the game from IndexedDB and resume exactly (period, clock, on-court set derived from events).
- FT sequence: after a shooting foul, prompt "How many FTs? 1/2/3" and step through each as `ft_made`/`ft_missed`.

### 9.5 Live game center (`/games/[id]` when live)
Subscribe once to `postgres_changes` INSERT+UPDATE on `stat_events` filtered by `game_id`; maintain event list in memory; derive on change; render score, box score tabs (home/away), and a play-by-play feed rendered from events via a `describeEvent(e, dictionary, locale)` helper in `@onoo/core/format`.

### 9.6 i18n
`src/i18n/{mn,en}.ts` typed dictionaries + `useT()`/`t()` helper; default locale `mn`, `?lang=en` switch (cookie). No routing-level i18n in MVP.

---

## 10. Mobile app `apps/onoo-app` (Expo) — Phase 3

Mirror `apps/tolom-mobile` structure (expo-router, NativeWind, TanStack Query, `expo-secure-store` for auth persistence). Screens: Home (live + today), Game center (read-only, same Realtime + derive pattern), Standings, Leaders, Team page, Player page, Follows (local db table `follows(user_id, entity_type, entity_id)` — add in a phase-3 migration), Auth (phone OTP), Athlete profile claim (phase 3.5, skip until told). Push notifications via `expo-notifications` + an Edge Function `notify-game-events` — build ONLY when T-032 says so.

---

## 11. Task plan (execute in order)

Phase 0 — Foundation
- **T-001** Verify workspace: read `pnpm-workspace.yaml` confirms `apps/*` + `apps/*/packages/*`. Create dirs. *Accept:* `pnpm ls -r` runs clean.
- **T-002** Scaffold `@onoo/core` per §7 (package.json, tsconfig — copy pattern from `packages/supabase`, empty src modules, vitest config). *Accept:* `pnpm -F @onoo/core test` (0 tests) + `validate:types` pass.
- **T-003** Scaffold `apps/onoo` Next.js per §9 conventions incl. biome, Tailwind v4, shadcn init, `.env.example`. *Accept:* `pnpm -F onoo-web build` succeeds.
- **T-004** `supabase init` + migrations 001–004 (§4) verbatim. *Accept:* `supabase db reset` clean.
- **T-005** Migration 005 RLS (§5) verbatim. *Accept:* `supabase db reset` clean; `select count(*) from pg_policies where schemaname='public'` ≥ 25.
- **T-006** Migration 006 rollups+storage (§5.6); seed.sql (§6). *Accept:* reset clean; seed queries return the fixed uuids.
- **T-007** Generate DB types into core; write `src/types/index.ts` aliases + `SportConfig` zod. *Accept:* `validate:types` passes.

Phase 1 — Core engine + registry + public read
- **T-008** `events/` dictionary + payload schemas + ordering (§7.2). *Accept:* unit tests for validation pass (write ≥6 cases incl. bad payloads rejected).
- **T-009** `stats/derive.ts` + REQUIRED vectors §7.5. *Accept:* all derive tests pass.
- **T-010** `sync/queue.ts` + tests (enqueue/seq/tombstone/markSynced). *Accept:* tests pass.
- **T-011** `format/` + i18n stat labels + `describeEvent`. *Accept:* tests for `formatClock`, `describeEvent` (mn + en) pass.
- **T-012** Web: supabase clients (§9.1), auth (email+password login page at `/admin/login`), admin layout gate. *Accept:* unauth `/admin` redirects; login works against local stack.
- **T-013** Dev-user script `apps/onoo/scripts/seed-users.ts` (service key, local only): creates admin@dev.local + scorer@dev.local, memberships (league admin), game_assignment for the seeded test game. *Accept:* script idempotent; users can log in.
- **T-014** Admin CRUD: leagues/seasons/competitions/teams/venues. *Accept:* create-edit flows work in browser (verify with webapp-testing/Playwright or manual note).
- **T-015** Admin: players (with duplicate warning) + roster management. *Accept:* create player, add to roster, duplicate name shows warning.
- **T-016** Admin: game scheduling + scorekeeper assignment + game detail page. *Accept:* schedule a game end-to-end.
- **T-017** Public pages: home, `/games`, `/standings`, `/teams/[slug]`, `/players/[id]`, `/leaders` (reading derived tables — empty until T-018). *Accept:* all render with seed data, `pnpm -F onoo-web build` passes.
- **T-018** Edge Function `manual-box-entry` + admin box-entry form; rollup functions wired. *Accept:* backfill one seeded game → box score on game page, standings + leaders update.

Phase 2 — Tracker + live
- **T-019** Migration 007: `apply_derived_stats` RPC (transactional delete+insert of derived rows + score/status update; service-role only — `revoke execute ... from anon, authenticated`). *Accept:* reset clean.
- **T-020** Edge Function `derive-game` (§8) incl. status-transition guards. *Accept:* deno tests or scripted local invocation: finalize on seeded events → derived rows correct vs `deriveBoxScore` output.
- **T-021** Tracker: IndexedDB adapter for `EventQueue` + background sync loop. *Accept:* unit-testable adapter; manual test: enqueue offline (devtools offline), reconnect, rows appear in DB exactly once.
- **T-022** Tracker UI: setup flow (starters, status→live) + top bar + clock. *Accept:* start a seeded game as scorer@dev.local.
- **T-023** Tracker UI: player rails + action grid + assist follow-up + FT sequence. *Accept:* record the §7.5 Test-1 sequence manually; box score panel matches expected table.
- **T-024** Tracker: subs, timeouts, period transitions, foul bookkeeping, undo/reassign, reload-resume. *Accept:* reload mid-game resumes exact state; undo removes stat everywhere.
- **T-025** Finish flow: `game_end` → `derive-game` finalize → redirect to game page. *Accept:* standings/leaders reflect the game.
- **T-026** Live game center (§9.5) + home page live section. *Accept:* two browser windows — tracker events appear in game center < 2s.
- **T-027** Verification: admin verify button (final→verified), corrections path (admin soft-deletes/re-inserts events on game detail, re-runs verify), audit log entries. *Accept:* full flow works; second verify is idempotent.
- **T-028** PWA hardening: manifest, service worker (app-shell cache only — do NOT cache Supabase requests), landscape lock hint, `beforeunload` guard while queue non-empty. *Accept:* Lighthouse PWA installable; offline reload of tracker resumes.

Phase 3 — Mobile + depth (start only when Phase 2 acceptance is fully green)
- **T-030** Scaffold `apps/onoo-app` (mirror tolom-mobile), supabase client + query provider, tab navigation.
- **T-031** Screens: home/live, game center (reuse `@onoo/core` derive), standings, leaders, team, player.
- **T-032** Follows + push notifications (migration for `follows` + `push_tokens`, Edge Function `notify-game-events` triggered on game status changes).
- **T-033** Auth phone OTP + athlete claim flow (admin approves claim linking `players.user_id`).
- **T-034** Advanced stats module + shot chart input (payload `x,y` on shots; court tap zone in tracker; shot chart on player/game pages).
- **T-035** Exports (PDF box score via server route, CSV endpoints).

---

## 12. Guardrails — DO NOT list

1. DO NOT write to derived tables from app code (rule §0.7). DO NOT put the service role key anywhere except Edge Functions.
2. DO NOT hard-delete `stat_events` rows anywhere — no code path, no admin tool. Soft-delete only.
3. DO NOT record the same stat two ways (assists ONLY via `payload.assisted_by`; blocks ONLY via `block` events; steals ONLY via `steal` events).
4. DO NOT track game score independently of derived team points — score IS the derivation output.
5. DO NOT re-implement event ordering or box-score math outside `@onoo/core`.
6. DO NOT add dependencies not named in this spec without a `TODO(spec):` note (exception: types-only devDeps).
7. DO NOT use `Date.now()` for `local_seq` (use a counter) or generate `client_id` server-side.
8. DO NOT block tracker UI on network calls — local queue first, always.
9. DO NOT edit applied migrations, other apps, or root `packages/*`.
10. DO NOT skip Zod validation on any event insert or admin form.
11. DO NOT use `getSession()` alone for server-side auth checks in Next.js — use `getUser()`/`getClaims()` per current Supabase SSR docs.
12. DO NOT hardcode UI strings in components (dictionary only), and DO NOT translate player/team names.

## 13. Definition of done (phase gates)

- **Phase 1:** A league admin can set up a league→game entirely in the UI; a backfilled game shows a correct box score, standings, and leaders; `pnpm -F onoo-web build`, all `@onoo/core` tests, and `validate:types` pass everywhere.
- **Phase 2:** A full 4-period game can be tracked start-to-finish with airplane-mode interruptions and a mid-game reload, producing zero lost events, a correct final box score (spot-check vs §7.5 math), live spectator view, and a verified locked record.
- **Phase 3:** App in TestFlight/internal track showing live games with push notifications; athlete can claim a profile.
