# Phase 3 — Discovery & league surfaces (execution spec)

Prereq reading: `docs/plans/00-conventions.md`. Depends on Task 2.1 (`PlayerAvatar`, `TeamLogo`) and Task 2.4 (chart install). The homepage (`src/app/page.tsx`) already fetches `getGamesByDate`, `getLiveGames`, `getStandings` from `src/app/lib/data.ts` — Phase 3 upgrades presentation, it does not re-plumb data.

## Task 3.1 — Home: tonight's games

**Goal:** Homepage answers "who plays tonight / what's the score / who won" at a glance.
**Touches:** `src/app/page.tsx`; new `src/app/components/game-card.tsx`, `src/app/components/live-score-card.tsx`; reuse `src/app/games/components/date-nav.tsx`.
**Steps:**
1. Section order: live games (if any, red "LIVE" pulse chip) → today's schedule → yesterday's results → compact standings top-4 with link. Remove nothing that exists without replacing it.
2. `GameCard`: `TeamLogo` + short_code both sides, score center (or start time via date-fns-tz `Asia/Ulaanbaatar` for scheduled), venue small, status chip. Winner's score bold. Links to `games/[id]`.
3. Live cards poll: client wrapper re-fetches every 20s via a route handler `src/app/api/live/route.ts` that returns `getLiveGames()` (Phase 5 replaces polling with realtime — leave a `TODO(5.1)`).
4. Empty day: keep the existing Mongolian empty-state sentence; add prev/next day nav.
**Done when:** with seeded live + scheduled + finished games, the three sections render correctly at 360px and the live score updates without reload.

## Task 3.2 — Standings redesign

**Goal:** The most-screenshotted surface looks the part.
**Touches:** `src/app/standings/page.tsx`; new `src/app/standings/components/standings-table.tsx`.
**Data:** `v_public_standings` already has `wins, losses, win_pct, games_back, streak, last_10, points_for/against` — no schema change.
**Steps:**
1. Rows: rank number, `TeamLogo` + name (accent left-border in `primary_color`), W–L, win% (`formatStat`), GB, streak chip (W3 green / L2 red), last-10 as ten 6px dots (green/red) at ≥sm, hidden at 360px.
2. Top-N playoff line: horizontal rule after position N — read N from `competitions` config if a column exists, else default 4 with a `TODO` comment.
3. Zebra rows, sticky header, the user's own team page link on row tap.
**Done when:** matches seed data exactly against SQL, fits 360px with columns rank/team/W–L/win% minimum.

## Task 3.3 — Leaders redesign

**Goal:** Podiums, not table rows.
**Touches:** `src/app/leaders/page.tsx`, `src/app/leaders/components/leader-tabs.tsx` (exists — extend), new `src/app/leaders/components/podium.tsx`, `leader-row.tsx`.
**Data:** `getLeaders` (`v_public_leaders`), stat tab set: PTS/REB/AST/STL/BLK per game.
**Steps:** per stat tab: top-3 as podium cards (rank 1 center, larger `PlayerAvatar`, big per-game number, team chip), ranks 4–10 as compact rows (avatar, name, team short_code, value). All link to player pages. Keep tabs server-driven via searchParams (`?stat=pts`) so the page stays a Server Component; `leader-tabs` renders links, not client state.
**Done when:** podium renders with photos or placeholders; tab switch is a full navigation that preserves scroll position ≤ minor jump; ranks match view ordering.

## Task 3.4 — Leaderboard qualification rules

**Goal:** One hot game can't top a per-game leaderboard.
**Touches:** new migration (`CREATE OR REPLACE VIEW v_public_leaders`); `src/app/lib/data.ts` (`getLeaders`); leaders + radar consumers.
**Steps:**
1. View change: add columns `team_games_played` (count of league_verified|official games for the player's team in the competition) and `qualified boolean` = `gp >= GREATEST(3, CEIL(0.5 * team_games_played))`. Keep every existing column unchanged (Task 2 consumers rely on them).
2. `getLeaders`: default filters `qualified = true`; optional `includeUnqualified` param.
3. Leaders page: unqualified players appear only in an expandable "Шалгуур хангаагүй" section showing "N тоглолт дутуу" (needed = threshold − gp).
4. Update Task 2.7's league-average helper to use `qualified` and remove its `TODO(3.4)`.
**Done when:** a seeded 1-game 30-point player is absent from the podium, present in the expandable section with the correct games-needed count.

## Task 3.5 — Awards & MVP races

**Goal:** Weekly/season recognition the league grants and players share.
**Touches:** new migration; admin page `src/app/admin/awards/page.tsx` + API `src/app/admin/api/awards/route.ts`; public components `src/app/players/[id]/components/awards-shelf.tsx`, homepage award banner; helper `getPlayerAwards`, `getMvpRace` in `data.ts`.
**Steps:**
1. Migration: table `awards (id uuid pk, competition_id uuid not null references competitions, award_type text not null check (award_type in ('player_of_week','mvp','top_scorer')), period_start date, period_end date, player_id uuid not null references players, granted_by uuid not null, granted_at timestamptz default now(), note text)`; RLS no public access; `cmd_grant_award(...)` SECURITY DEFINER guarded by `private.user_can_approve_game`-style admin check (follow that function's pattern); view `v_public_awards` joining player + competition, hidden players masked per Task 2.2.
2. MVP race is **computed, not stored**: `getMvpRace(competitionId)` ranks qualified leaders by EFF = pts + reb + 1.5·ast + 2·stl + 2·blk − tov per game (weights in one constant with a comment). Top-5 shown on the leaders page as a "MVP уралдаан" card with rank deltas omitted (no history yet — note as future work).
3. Admin page: pick competition + week range → shows the computed top-5 for that window (reuse game-log helper aggregated over the range) → grant button → `cmd_grant_award`.
4. Player page: awards shelf badges (from `v_public_awards`); shareable award graphic is Phase 4 (Task 4.2 reuses this data — keep the query shape documented).
**Done when:** granting a seeded award shows it on the player page and the MVP race card matches hand-computed EFF ordering.

## Task 3.6 — Player comparison upgrade

**Goal:** Visual duel instead of a numbers grid.
**Touches:** `src/app/players/compare/page.tsx` (existing Client Component using TanStack Query + `/api/stats/compare-players` — keep both), new `components/compare-bars.tsx`, `compare-radar.tsx` under that route.
**Steps:** for 2 players: mirrored horizontal bars per stat (left player's bar grows leftward, right grows rightward, larger value's bar in team color, loser muted); radar overlay of both (Task 2.7 component generalized — extract the radar into `src/components/stat-radar.tsx` and reuse). 3–5 players: fall back to the existing grid + grouped bars, no radar. `PlayerAvatar` header row with jersey numbers.
**Done when:** 2-player compare shows mirrored bars + radar; 3-player compare still works; API untouched.

## Task 3.7 — Team pages

**Goal:** Roster grid of mini player cards, team identity throughout.
**Touches:** `src/app/teams/[slug]/page.tsx`; new `src/app/teams/[slug]/components/roster-grid.tsx`, `team-header.tsx`.
**Data:** `getTeamBySlug` + `v_public_team_roster` (add `getTeamRoster(teamSeasonId)` helper if absent); form guide: last 5 results from `v_public_games` filtered by team.
**Steps:** header with `TeamLogo` xl, name, W–L record, form-guide dots, `--team-color` accent band; roster grid (2 cols at 360px, 4 at md) of mini cards: `PlayerAvatar` md, name, jersey, position, PPG if qualified. Cards link to player pages. Keep the existing stats table below the grid.
**Done when:** seeded team renders grid + header at 360px; players missing from `v_public_leaders` still render (no PPG shown).

## Task 3.8 — Search & browse

**Goal:** Any player/team reachable in two taps from anywhere.
**Touches:** new `src/app/api/search/route.ts`; new `src/components/search-command.tsx`; mount in the shared header/nav (locate the nav in `src/app/layout.tsx` or its imported component and add the search trigger there).
**Steps:**
1. API: `?q=` (min 2 chars) → up to 8 players (`players` search must go through a public-safe path: add `v_public_players` view — id, canonical_name, name_latin, photo_url, current team short_code, visibility-filtered per Task 2.2 — in a migration) + up to 4 teams by name/short_code, `ilike` on both name fields. Return `{players: [], teams: []}`.
2. UI: shadcn `dialog` opened by a search button (and `Cmd/Ctrl+K`); input debounced 250ms via TanStack Query; results grouped with avatars; Enter navigates to first result. No results → "Илэрц олдсонгүй".
**Done when:** typing a seeded player's Latin or Cyrillic name from the homepage reaches their page in two interactions; hidden players never appear.
