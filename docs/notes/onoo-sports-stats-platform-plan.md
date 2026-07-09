# Оноо (Onoo) — Sports Stats & Athlete Performance Platform

> **One-line pitch:** The single source of truth for every Mongolian athlete's stats, performance, and career — starting with basketball (Дээд лиг, Space League), expanding to every sport and every operational layer around it.
>
> Status: Planning · Created: 2026-07-09 · Owner: Temuulen
>
> **Implementing agents:** do not implement from this document. Follow the step-by-step spec in
> [`onoo-implementation-spec.md`](./onoo-implementation-spec.md) — it contains the exact schema,
> task order, and acceptance checks. This document is background context only.

---

## 1. Vision & Positioning

### 1.1 Vision

Become the **Basketball-Reference + Synergy Sports + LeagueOS of Mongolia** — the canonical database and operations layer for athletes, teams, leagues, and fans:

1. **Records layer** — every game, every stat, every athlete, permanently and accurately recorded.
2. **Live layer** — real-time scores, play-by-play, and box scores as games happen.
3. **Insight layer** — advanced analytics, shot charts, trends, scouting profiles.
4. **Operations layer** — registration, rosters, scheduling, standings, and eventually payments/ticketing for leagues and clubs.

### 1.2 Why now / why us

- **Almost no competitors.** Mongolian leagues today run on Facebook posts, Excel sheets, and paper scoresheets. There is no persistent, queryable athlete record.
- **Concrete beachhead:** Дээд лиг (Mongolian National Basketball Superleague) and **Space League** — a small number of teams, games, and stakeholders means we can achieve *complete* coverage fast. Completeness is the moat: once Onoo has every game of a season, it *is* the record.
- **Athletes want it.** Players going for national team selection, overseas opportunities (Japan B.League, KBL tryouts, US colleges), or sponsorships have no verified stat profile today.

### 1.3 Strategy in one sentence

**Win by being the scorekeeper.** Whoever enters the stats owns the data. So the #1 product priority is a courtside stat-tracking tool so good that leagues and teams *want* us at the scorer's table — everything else (fan app, athlete profiles, analytics) is downstream of that data.

### 1.4 Non-goals (for now)

- Video streaming/broadcast (link out to existing streams; clip integration later).
- Betting/odds products.
- International markets before Mongolia is fully covered.
- Amateur/pickup game tracking (until league layer is solid — but keep the schema ready for it).

---

## 2. Market & Users

### 2.1 Target leagues (in order)

| Priority | League | Notes |
|---|---|---|
| 1 | **Дээд лиг** (Superleague) | Top men's/women's national league; the credibility anchor |
| 2 | **Space League** | Newer pro league, media-forward, likely most receptive partner |
| 3 | University / Дунд лиг / youth | Volume + recruiting-pipeline value |
| 4 | 3x3 (Mongolia is strong here) | Different stat model — validates the multi-sport engine |
| 5 | Volleyball, football, wrestling... | After basketball engine is proven |

### 2.2 Personas

| Persona | Core need | Surface |
|---|---|---|
| **Scorekeeper / statistician** | Enter live stats fast, offline-safe, fix mistakes | Tablet web app / Expo tablet mode |
| **League admin** | Schedule games, manage teams/refs, publish standings, verify stats | Web admin panel |
| **Team manager / coach** | Rosters, team stats, opponent scouting, player development | Web + mobile |
| **Athlete** | Own verified profile, career stats, highlights, visibility | Mobile app |
| **Fan** | Live scores, box scores, standings, player pages, notifications | Mobile app + public web |
| **Media / scouts / federations** | Reliable data to cite, exportable, API access | Public web + API (later) |

---

## 3. Product Surfaces

Four surfaces, two codebases:

1. **`onoo-web` (Next.js)** — public site: league pages, live game center, box scores, standings, player/team profiles, leaderboards. SEO is critical — player pages should be the top Google result for every athlete's name.
2. **`onoo-web /admin`** — role-gated admin panel inside the same Next.js app: league ops, team ops, game management, stat verification, user/role management.
3. **`onoo-web /tracker`** — the courtside live stat tracker. Web-first (tablet browser), offline-capable (PWA + local queue). Optimized for landscape tablet.
4. **`onoo-app` (Expo / React Native)** — fan + athlete app: live scores, notifications, personal athlete profile, team following. *Not* the stat tracker in v1 (keep the tracker on web to iterate fast; port to Expo later if needed for reliability).

---

## 4. Feature Plan (MoSCoW)

### 4.1 MUST — MVP (Phase 1–2)

**Foundation / registry**
- [ ] Sports registry (basketball 5x5 first; schema supports N sports)
- [ ] Organizations → leagues → seasons → competitions (regular season, playoffs, cups)
- [ ] Teams, venues, officials
- [ ] Player registry with identity: photo, DOB, height/weight, position, jersey #, bio — **one canonical player record across teams/seasons/leagues** (this is the "source of every athlete" promise; get identity right from day one)
- [ ] Rosters per team-season with transfer history

**Stat tracking (the core)**
- [ ] Live play-by-play event entry: 2PT/3PT/FT made+missed, rebounds (off/def), assists, steals, blocks, turnovers, fouls (personal/technical), substitutions, timeouts
- [ ] Game clock + period management synced with events
- [ ] Undo / edit / insert-missed-event (mistakes are constant courtside — correction UX is a must, not a nice-to-have)
- [ ] Offline-first: events queue locally, sync when connection returns; never lose a game to gym wifi
- [ ] Derived box score (player + team) computed live from events
- [ ] Post-game verification workflow: scorekeeper submits → league admin reviews → **official** lock (locked stats are the canonical record; corrections create an audit trail)
- [ ] Manual box-score-only entry mode (for backfilling historical games and leagues we don't cover live)

**Public web**
- [ ] Live game center: score, play-by-play feed, live box score (Supabase Realtime)
- [ ] Game pages (final box score, team comparison)
- [ ] Standings (auto-computed, tiebreaker rules configurable per league)
- [ ] Player profile pages: career stats by season/team, game log, per-game/totals toggle
- [ ] Team pages: roster, schedule, results, team stats
- [ ] League leaders (PPG, RPG, APG, SPG, BPG, FG%, 3P%, FT%)
- [ ] Schedule/results calendar
- [ ] Mongolian-first UI with English toggle (use existing `@zuiio/i18n`); Cyrillic search/collation handled correctly

**Admin panel**
- [ ] League/season/competition CRUD, game scheduling
- [ ] Team & roster management (league admin + delegated team manager roles)
- [ ] Scorekeeper assignment per game
- [ ] Stat verification queue + audit log
- [ ] Role management (see §6.3)

**Mobile app (fan/athlete v1)**
- [ ] Live scores + game center (read-only mirror of web game center)
- [ ] Follow teams/players → push notifications (game start, close game, final)
- [ ] Standings, leaders, schedules
- [ ] Athlete claim flow: player verifies identity → claims their profile → can edit bio/photo (stats stay locked)

### 4.2 SHOULD — V1.x (Phase 3)

- [ ] Shot charts (x,y court coordinates on shot events; tracker gets tap-on-court input)
- [ ] Advanced stats: eFG%, TS%, usage rate, +/-, per-36, pace, ORtg/DRtg, four factors
- [ ] Lineup tracking (who's on floor → lineup +/- and combinations)
- [ ] Head-to-head & player comparison pages
- [ ] Season awards / records pages (single-game highs, franchise records)
- [ ] Dual-scorekeeper mode: two trackers on one game, discrepancy diff for verification
- [ ] Game highlights: attach media (photos/clips) to events by timestamp
- [ ] Exports: PDF box scores / scoresheets for leagues, CSV for media
- [ ] Public read API (become the data source others build on — cements "source of truth")
- [ ] 3x3 basketball rule set (different periods, scoring 1s/2s, shot clock)

### 4.3 COULD — V2+ (Phase 4+)

- [ ] Second sport (volleyball is the natural next: set-based, rally events)
- [ ] League operations suite: player registration + license fees, team entry fees (payments via local providers — QPay/SocialPay/khan bank), digital player licenses/ID cards
- [ ] Ticketing for games
- [ ] Scouting/recruiting profiles: verified stat resume, video links, agent contact — monetizable for athletes seeking overseas/college opportunities
- [ ] Coach tools: practice tracking, player development plans, wellness check-ins
- [ ] Fantasy / pick'em games for fan engagement
- [ ] Federation-grade features: national team pools, eligibility tracking, FIBA reporting formats
- [ ] AI layer: natural-language stat queries ("Хэн энэ улиралд хамгийн олон гурван оноо оруулсан бэ?"), auto game recaps in Mongolian, anomaly detection on stat entry

### 4.4 WON'T (explicitly)

- Video hosting/streaming infrastructure
- Betting integrations
- Live stat entry from the mobile fan app (crowd-sourced stats destroy trust in the record)

---

## 5. Domain Model & Supabase Schema

### 5.1 Design principles

1. **Event-sourced stats.** The `stat_events` play-by-play log is the source of truth; box scores, season stats, standings, and leaders are *derived* (and cached/materialized). This gives you: full auditability, retroactive corrections, shot charts, lineup analytics, and future sports for free.
2. **Sport-agnostic core, sport-specific dictionaries.** Tables like `games`, `teams`, `players` are generic; what varies per sport lives in `sports.config` (period structure, clock rules) and `stat_event_types` (the per-sport event dictionary with validation rules).
3. **One player, one row, forever.** `players` is independent of teams/seasons. Team membership is a dated join table. Duplicate-player merge tooling from day one.
4. **Everything official is locked + audited.** Post-verification edits go through a corrections table.

### 5.2 Core tables (abridged)

```sql
-- Registry
sports              (id, key, name_mn, name_en, config jsonb)         -- periods, clock, roster sizes
organizations       (id, name, type)                                  -- federation | league operator | club
leagues             (id, org_id, sport_id, name, slug, logo)
seasons             (id, league_id, name, starts_on, ends_on)
competitions        (id, season_id, type, format, tiebreaker_rules jsonb)  -- regular | playoff | cup
venues              (id, name, city, capacity)

-- Participants
teams               (id, league_id, name, short_code, colors, logo)
team_seasons        (id, team_id, competition_id)
players             (id, canonical_name, name_mn, name_latin, dob, height_cm,
                     weight_kg, photo, nationality, user_id nullable)  -- user_id set when athlete claims profile
roster_entries      (id, team_season_id, player_id, jersey_number, position,
                     joined_at, left_at)                               -- transfer history falls out of this
officials           (id, name, role)                                   -- referees, commissioners

-- Games
games               (id, competition_id, home_team_season_id, away_team_season_id,
                     venue_id, scheduled_at, status,                   -- scheduled|live|final|verified|official
                     current_period, clock_state jsonb)
game_rosters        (id, game_id, player_id, team_season_id, is_starter, dnp_reason)
game_assignments    (id, game_id, user_id, role)                       -- scorekeeper, referee

-- The heart: event log
stat_event_types    (id, sport_id, key, category, value_rules jsonb)   -- 'shot_2pt_made', 'rebound_def', ...
stat_events         (id, game_id, seq, event_type_key, period, clock_seconds,
                     player_id, team_season_id,
                     payload jsonb,                                    -- {x, y, assisted_by, fouled_by, ...}
                     client_id uuid, device_id, created_by, created_at,
                     deleted_at, superseded_by)                        -- soft-delete for undo/corrections
                     -- UNIQUE (game_id, client_id) → idempotent offline sync

-- Derived / materialized (rebuilt from stat_events, cached for reads)
game_player_stats   (game_id, player_id, minutes, pts, fgm, fga, tpm, tpa, ftm, fta,
                     oreb, dreb, ast, stl, blk, tov, pf, plus_minus, ...)
game_team_stats     (game_id, team_season_id, ...)
season_player_stats (competition_id, player_id, gp, totals..., averages...)
standings           (competition_id, team_season_id, w, l, pct, gb, streak, points_for/against)

-- Trust & ops
stat_corrections    (id, game_id, requested_by, description, diff jsonb, status, reviewed_by)
audit_log           (id, actor_id, action, entity, entity_id, before jsonb, after jsonb, at)
```

### 5.3 Derivation strategy

- **Live:** tracker computes box score client-side from the event stream (instant); server recomputes via Postgres function triggered per event batch → broadcasts via Realtime.
- **Post-game:** `verify_game(game_id)` Postgres function rebuilds `game_*_stats` from scratch, then upserts season aggregates and standings inside one transaction.
- Never hand-edit derived tables. Fix the events, re-derive.

### 5.4 Auth & RLS (Supabase)

- Roles table: `memberships (user_id, scope_type, scope_id, role)` where scope is org/league/team — e.g. `('league', deed_lig_id, 'admin')`, `('team', team_id, 'manager')`, `('game', game_id, 'scorekeeper')` via `game_assignments`.
- **RLS policy sketch:**
  - Public (anon): read `games`, `stat_events` (non-deleted), derived stats, registry — everything public reads free.
  - Scorekeeper: insert `stat_events` only for games they're assigned to and only while `games.status = 'live'`.
  - Team manager: manage own `roster_entries`, propose corrections.
  - League admin: full write within their league scope; verify/lock games.
  - Athlete: update `players` bio fields on their claimed row only (via `players.user_id`).
- Auth methods: phone OTP (dominant in Mongolia) + Google/Apple; admin accounts email+password with MFA.

---

## 6. Architecture

### 6.1 Monorepo layout (fits existing zuiio conventions)

```
apps/
  onoo/                      # Next.js — public web + /admin + /tracker
  onoo-app/                  # Expo RN — fan & athlete app
  onoo/packages/             # app-scoped internal packages (workspace already allows apps/*/packages/*)
    core/                    # ← THE shared internal package (see 6.2)
```

Reuse existing root packages where they fit: `@zuiio/supabase` (client factories), `@zuiio/auth`, `@zuiio/ui` (web), `@zuiio/i18n`, `@zuiio/query`, `@zuiio/realtime`, `@zuiio/offline`. Anything Onoo-domain-specific stays in `apps/onoo/packages/core` so the root packages stay generic.

### 6.2 `@onoo/core` — the shared internal package (web + mobile)

Pure TypeScript, **no React, no platform APIs** — importable by both Next.js and Expo:

- `types/` — DB row types (generated via `supabase gen types`), domain types, Zod schemas
- `stats/` — **the stat engine**: `deriveBoxScore(events)`, `deriveAdvanced(box)`, standings calculator, leaders, per-sport event dictionaries + validation. Pure functions → trivially unit-tested, runs identically courtside (offline), on server (verification), and in app (display)
- `queries/` — typed Supabase query builders / RPC wrappers shared by web and app
- `realtime/` — channel names, payload contracts for live games
- `sync/` — offline event queue logic: append-only local log, idempotency keys (`client_id`), reconciliation
- `i18n/` — stat terms dictionary (mn/en): оноо, самбар, дамжуулалт...
- `format/` — number/name/clock formatting shared everywhere

React-specific shared hooks (e.g. `useLiveGame`) can live in `apps/onoo/packages/hooks` if needed, split so RN and web both consume them (headless hooks only, no DOM).

### 6.3 Tech stack (confirmed + specifics)

| Layer | Choice | Notes |
|---|---|---|
| Web | **Next.js (App Router)** | RSC for public pages (SEO), ISR for stats pages, client components for tracker/live |
| Mobile | **Expo (RN)** + expo-router | EAS builds; push via expo-notifications |
| Backend | **Supabase** | Postgres + RLS, Realtime (live games), Auth, Storage (photos/logos), Edge Functions (verification, notifications fan-out), pg_cron (nightly re-aggregation sanity job) |
| State/data | TanStack Query (`@zuiio/query`) + Supabase Realtime subscriptions | |
| Offline tracker | PWA + IndexedDB event queue (build on `@zuiio/offline`) | Tracker must survive full connectivity loss for an entire game |
| UI web | Tailwind + shadcn/ui via `@zuiio/ui`, `@zuiio/branding` tokens | |
| UI mobile | NativeWind + existing native-shadcn components | Already set up in repo |
| Analytics/errors | Sentry + PostHog | |
| CI/CD | Existing repo setup; Vercel (web) + EAS (app) | |

### 6.4 The tracker — key design decisions

The tracker is the product. Design constraints:

1. **≤2 taps per event** for the common path: tap player (bench rail of 5 on-court players per side) → tap action grid. Shot location tap added in Phase 3.
2. **Clock is king.** Big start/stop; every event stamps `(period, clock_seconds)`; clock adjustable retroactively.
3. **Undo stack + event timeline** always visible; long-press any event to edit/delete/reassign player.
4. **Offline-native:** every event written to IndexedDB first with a UUID `client_id`, then synced in order; server dedupes on `(game_id, client_id)`. Sync status indicator (queued/synced counts) always on screen.
5. **Validation guards** from the event dictionary: can't record a stat for a benched player, FT sequence prompts, foul counts auto-tracked (team fouls, bonus, foul-out warnings).
6. **Fast substitution UI** — subs are the highest-frequency non-stat event and where trackers usually fall behind.
7. **Panic-proof:** if the tracker crashes, reopening resumes the game exactly from the local log.

---

## 7. Roadmap

### Phase 0 — Foundation (2–3 weeks)
Scaffold `apps/onoo`, `apps/onoo-app`, `@onoo/core`. Supabase project + migrations for core schema. Auth + memberships/RLS skeleton. CI, type generation, seed scripts with one fake league.
**Exit:** deployed skeleton, fake season browsable.

### Phase 1 — Registry + manual stats + public web (5–7 weeks)
Admin panel (leagues/seasons/teams/players/rosters/schedule). Manual box-score entry + backfill tooling. Public pages: standings, schedules, game/team/player pages, leaders. i18n mn/en.
**Exit:** one real league's *past* season fully backfilled and public. This is demo material for league negotiations — do this with Space League or Дээд лиг historical data even before a partnership.

### Phase 2 — Live tracker + realtime + verification (6–8 weeks)
Event-sourced tracker (offline-first), live game center on web, verification workflow, audit log.
**Exit:** track 3+ real games live courtside (scrimmages or friendly agreement) with zero data loss. **This is the make-or-break milestone.**

### Phase 3 — Mobile app + depth (6–8 weeks)
Expo app: live scores, follows, push notifications, athlete profile claim. Shot charts, advanced stats, exports, dual-scorekeeper verification.
**Exit:** app in stores; one league season covered live end-to-end.

### Phase 4 — Operations + expansion (ongoing)
League ops (registration, licenses, payments), public API, second sport (volleyball or 3x3), scouting profiles.

### Season-driven sequencing ⚠️
Work backwards from league calendars: figure out when the Дээд лиг / Space League seasons tip off and make Phase 2's tracker rock-solid *before* opening day, even if it means cutting Phase 1 scope. Missing a season start costs a year of data.

---

## 8. Go-to-Market (Mongolia-specific)

1. **Backfill before you ask.** Show up to league meetings with their own last season already in the product. Cost: days of data entry. Effect: the conversation changes from "would you use this" to "this exists, want it live?"
2. **Free for leagues in year one.** The data is the payment. Charge later for ops tooling, not for record-keeping.
3. **Be the scorer's table.** Offer to provide/train scorekeepers for partner leagues initially — quality control + relationship + we own the pipeline.
4. **Athlete-led growth.** Every player page is a shareable profile; players sharing their own stats on Instagram/Facebook is the fan acquisition channel.
5. **Media partnership.** Give sports media free embeds/exports with "Powered by Onoo" attribution — citations build the "official source" brand.

## 9. Monetization (later, in order of likelihood)

1. **League SaaS** — ops suite subscription (registration, licensing, scheduling, official stats service)
2. **Team subscriptions** — advanced analytics, opponent scouting, exports
3. **Athlete premium** — verified recruiting profile, highlight hosting, multilingual stat resume
4. **Sponsorship/ads** — "Player of the week presented by X", banner inventory on live game center
5. **API licensing** — media, apps, (eventually, carefully) data partners
6. **Ticketing/payments take rate** — Phase 4+

## 10. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| League politics / access denied | Start with the friendlier league; backfill public data regardless (results are public information); athlete-first growth doesn't need league permission |
| Tracker fails mid-game → trust destroyed | Offline-first architecture, local log recovery, manual box-score fallback, dual-scorekeeper mode; rehearse at scrimmages before real games |
| Data quality (wrong player, missed events) | Verification workflow, corrections audit trail, dual-entry diffing, anomaly checks (e.g., team FGM > FGA) |
| Player identity duplicates (Cyrillic/Latin spellings) | Canonical player registry + merge tooling + fuzzy matching on create; store both scripts |
| Small-market revenue ceiling | Ops layer (registration/payments/ticketing) monetizes beyond stats; multi-sport expands TAM domestically |
| Solo/small team burnout | Phase gates are strict; manual entry mode means the platform is useful even when live coverage isn't possible |

## 11. Success Metrics

- **Coverage:** % of target-league games in Onoo (goal: 100% of one league in season one)
- **Liveness:** % of games tracked live vs backfilled
- **Data trust:** corrections per game trending down; leagues citing Onoo as official
- **Athlete adoption:** % of active league players with claimed profiles
- **Fan traction:** MAU, game-center concurrent viewers, push opt-in rate
- **SEO:** Onoo player page ranks #1 for athlete-name searches

## 12. Open Questions

- [ ] Final product name/branding — "Onoo" (оноо) as working title; check domain (onoo.mn?) and trademark
- [ ] Which league first — Space League (likely more receptive) vs Дээд лиг (more prestige)?
- [ ] Women's league coverage from day one? (Recommend yes — low marginal cost, differentiator, goodwill)
- [ ] Historical depth of backfill — current season only, or multi-year archives where scoresheets exist?
- [ ] Does the federation (MBA — Монголын сагсан бөмбөгийн холбоо) need to be a partner, or can leagues sign independently?
- [ ] Scorekeeper staffing model: our people vs training league staff?
- [ ] Tracker on tablet web (PWA) confirmed for v1 — revisit native tracker only if PWA reliability disappoints
