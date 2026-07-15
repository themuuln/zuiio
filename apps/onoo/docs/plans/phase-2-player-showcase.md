# Phase 2 — Player profile as showcase (execution spec)

Prereq reading: `docs/plans/00-conventions.md`. Target page: `src/app/players/[id]/page.tsx` (Server Component, fetches via `getPlayerById` in `src/app/lib/data.ts`, already exports `generateMetadata`). Task order matters: 2.1 → 2.2 → 2.3 first; charts (2.4, 2.5, 2.7) after the chart install in 2.4.

## Task 2.1 — Roster onboarding kit (photos, logos, placeholder identity)

**Goal:** Every showcase surface can rely on player photos, team logos/colors, or a designed placeholder.
**Touches:** new migration (buckets); `src/app/admin/players/page.tsx`, `src/app/admin/teams/page.tsx` (upload UI); new `src/components/player-avatar.tsx`, `src/components/team-logo.tsx`; admin API `src/app/admin/api/players/[id]/photo/route.ts` and `.../teams/[id]/logo/route.ts`.
**Data:** `players.photo_url`, `teams.logo_url`, `teams.primary_color` (all exist as text fields; no storage buckets exist yet).
**Steps:**
1. Migration: public-read Supabase Storage buckets `player-photos`, `team-logos`; write restricted to authenticated users (admin-gated at the API layer). Max size 2MB, allowed types jpeg/png/webp.
2. Photo/logo API routes: auth check → upload to bucket (path `<entity_id>.<ext>`) → update `photo_url`/`logo_url` with the public URL via the existing admin PUT routes' table access (these columns are not protected tables).
3. Admin UI: file input + preview on the existing player/team forms (react-hook-form field, client-side size/type validation, sonner toast on success).
4. `PlayerAvatar`: renders `photo_url` if set, else initials from `canonical_name` on a background of the team's `primary_color` (fallback `#1e293b`). Sizes: `sm|md|lg|xl`. `TeamLogo` same pattern with `short_code`.
5. Replace every raw `<img>`/initials hack on public pages with these components (grep `photo_url` and `logo_url` under `src/app/`).
**Done when:** uploading a photo in admin shows it on the public player page; players without photos show the placeholder everywhere.

## Task 2.2 — Consent & takedown

**Goal:** The league can hide any player from all public surfaces instantly, and consent capture is recorded.
**Touches:** new migration; `src/app/admin/players/page.tsx`.
**Steps:**
1. Migration: `ALTER TABLE players ADD COLUMN visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','hidden'))`, `ADD COLUMN consent_recorded_at timestamptz`, `ADD COLUMN consent_note text`. Then `CREATE OR REPLACE` **every** `v_public_*` view that exposes player identity (`v_public_box_score`, `v_public_leaders`, `v_public_team_roster`) to render hidden players as `canonical_name = 'Нэргүй тоглогч'`, `photo_url = NULL`, `player_id` kept (stats remain, identity masked — final scores must stay accurate).
2. Admin player form: visibility toggle + consent date/note fields; hidden players get a gray badge in the admin list.
3. Document the takedown procedure (one paragraph) in `docs/runbook.md`.
**Done when:** toggling a seeded player to hidden anonymizes them on player page, leaders, box scores, and roster within one refresh.

## Task 2.3 — Hero identity card

**Goal:** Top of the player page reads like a trading card.
**Touches:** new `src/app/players/[id]/components/hero-card.tsx` (Server Component) + new client hook `src/lib/hooks/use-count-up.ts` + tiny client wrapper `src/app/players/[id]/components/stat-number.tsx`.
**Data:** `getPlayerById` (bio) + season averages from `v_public_leaders` for the player's current competition (add helper `getPlayerSeasonAverages(playerId)` to `src/app/lib/data.ts`).
**Steps:**
1. Layout: `PlayerAvatar` size `xl` left; name (`formatPlayerName`), jersey `#`, position, team chip (logo + name link) right; below, a 3–5 column row of big numbers: PPG, RPG, APG (+ SPG, BPG at ≥sm breakpoint) with `getStatLabel(stat, 'mn')` captions.
2. Team color theming: set `style={{ "--team-color": primary_color }}` on the card root; use `var(--team-color)` for the accent border/gradient. Guard contrast: text stays on neutral background, color is accent-only.
3. `useCountUp(target, {duration: 800})`: rAF-based, starts on mount, respects `prefers-reduced-motion` (jump straight to target). `StatNumber` is the only client part.
**Done when:** page at 360px shows avatar + 3 stats without horizontal scroll; numbers animate once; zero-game players show `–` (not `NaN`).

## Task 2.4 — Season story arc chart (installs charts)

**Goal:** Game-by-game PTS/REB/AST trend.
**Touches:** run `pnpm dlx shadcn@latest add chart` (installs Recharts + `src/components/ui/chart.tsx`); new `src/app/players/[id]/components/season-arc.tsx` (`"use client"`).
**Data:** new helper `getPlayerGameLog(playerId, competitionId)` in `src/app/lib/data.ts` reading `v_public_box_score` joined to `v_public_games` (date, opponent, pts, reb = oreb+dreb, ast), ordered by game date.
**Steps:** shadcn `ChartContainer` + Recharts `AreaChart`; one `Area` for PTS, toggleable `Line`s for REB/AST via shadcn tabs above the chart; tooltip shows opponent + date via `ChartTooltipContent`. X axis: game index (not dates) with date in tooltip. Empty/1-game state: render the recent-games strip message instead of a degenerate chart (see conventions: cold-start).
**Done when:** chart renders for a seeded multi-game player, is legible at 360px (height ~200px, no legend overflow), and hides itself gracefully under 2 games.

## Task 2.5 — Shooting profile

**Goal:** FG / 3P / FT visualized, not tabled.
**Touches:** new `src/app/players/[id]/components/shooting-profile.tsx` (`"use client"`, needs Task 2.4's chart install).
**Data:** season totals from `v_public_leaders` (fgm/fga, tpm/tpa, ftm/fta).
**Steps:** three Recharts `RadialBarChart` gauges (FG%, 3P%, FT%) side by side, percentage centered (`formatStat`), made/attempted caption under each. Color: `var(--team-color)` accent. Below the gauges, one horizontal stacked bar: share of points from 2P / 3P / FT (compute: 2P pts = (fgm−tpm)×2, 3P pts = tpm×3, FT pts = ftm).
**Done when:** gauges match hand-computed percentages for a seed player; 0-attempt splits render an em-dash gauge, not 0%.

## Task 2.6 — Career highs & milestones

**Goal:** Auto-detected bests shown as badges.
**Touches:** new `packages/core/src/stats/milestones.ts` + tests; new `src/app/players/[id]/components/milestones.tsx`; export from `packages/core/src/index.ts`.
**Steps:**
1. Core: `detectMilestones(gameLines: GameLine[]): Milestone[]` — pure function. Detect: career-high per stat (pts/reb/ast/stl/blk with game date), double-doubles count, triple-doubles count, 20+ point games count, current streak of double-digit scoring. Types exported. Unit tests with fixture arrays including empty and 1-game inputs.
2. UI: badge grid using shadcn `badge`; label text from a new small dictionary `MILESTONE_LABELS` in `packages/core/src/i18n/stats.ts` (mn + en). Career-high badges show the value + date.
**Done when:** core tests pass; a seeded 30-point game shows the career-high badge with the right date.

## Task 2.7 — Radar chart vs league average

**Goal:** Skill-shape at a glance.
**Touches:** new `src/app/players/[id]/components/skill-radar.tsx` (`"use client"`).
**Data:** helper `getLeagueAverages(competitionId)` in `src/app/lib/data.ts`: mean of per-game PTS/REB/AST/STL/BLK across **qualified** players in `v_public_leaders` (after Task 3.4 lands use its `qualified` flag; until then use `gp >= 5` and leave a `TODO(3.4)` comment).
**Steps:** Recharts `RadarChart`, two `Radar` series (player vs league avg, league in muted gray), 5 axes labeled via `getStatLabel`. Normalize each axis to league-max = 100 so shapes are comparable; document the normalization in a code comment (it's a constraint the chart can't show).
**Done when:** player and league shapes both render; a below-average player visibly sits inside the gray shape.

## Task 2.8 — Recent games strip

**Goal:** Last-5 capsules with W/L and standout stat.
**Touches:** new `src/app/players/[id]/components/recent-games.tsx` (Server Component).
**Data:** last 5 rows of `getPlayerGameLog` + game result from `v_public_games`.
**Steps:** horizontal scroll row of cards: opponent short_code + `TeamLogo`, W/L chip (green/red), the player's best stat that game ("24 оноо" — pick max of pts / (reb×1.2) / (ast×1.5) weighted heuristic; document weights in a comment), date via date-fns-tz `Asia/Ulaanbaatar`. Each card links to `games/[id]`.
**Done when:** strip scrolls horizontally at 360px with snap, and games render newest-first.

## Task 2.9 — Plain-language game summaries

**Goal:** Auto one-liners family can read.
**Touches:** new `packages/core/src/i18n/summaries.ts` + tests + export; used in `recent-games.tsx` tooltips and game pages (Phase 4 recaps reuse it).
**Steps:** `describePlayerGame(line, {isCareerHigh, isSeasonHigh, teamWon}): {mn: string, en: string}`. Rules, first match wins: career high → "Карьерийн дээд амжилт: X оноо"; triple-double; double-double; 20+ pts; team-high pts; else "X оноо, Y самбар, Z дамжуулалт". Include shooting note when fga ≥ 10 and fg% ≥ 60 ("60% пүршилттэй"— use correct Mongolian basketball terminology from `STAT_LABELS`; if a term is missing, add it to the dictionary rather than inventing inline strings). Tests cover each rule boundary.
**Done when:** core tests pass; recent-games strip shows the one-liner as the card subtitle.

## Task 2.10 — "Report a stat error" intake

**Goal:** Public visitors can flag a wrong stat; reports land in the admin queue.
**Touches:** new migration; new `src/app/api/report-error/route.ts`; new `src/components/report-error-dialog.tsx`; ops console section (extends Task 1.9 page).
**Steps:**
1. Migration: table `public_error_reports (id uuid pk default gen_random_uuid(), game_id uuid null references games, player_id uuid null references players, message text not null check (char_length(message) between 5 and 500), contact text, created_at timestamptz default now(), status text not null default 'open' check (status in ('open','resolved','dismissed')), reporter_hash text not null)`. RLS: no public select; insert only via `cmd_report_public_error(p_game_id, p_player_id, p_message, p_contact, p_reporter_hash)` — SECURITY DEFINER, rejects when the same `reporter_hash` has >5 reports that day.
2. Route handler: derives `reporter_hash = sha256(ip + UTC date)` server-side, calls the RPC with the anon server client, returns 201/429. Never store the raw IP.
3. Dialog: flag icon button on player page (near box score) and game page; textarea + optional contact; success toast "Мэдээлсэнд баярлалаа".
4. Ops console: "Алдааны мэдээлэл" table (open reports, link to game/player, resolve/dismiss buttons via a small admin API route that updates status — `public_error_reports` is not a protected table; direct update in the admin route is acceptable, mirror existing admin route style).
**Done when:** submitting from an incognito window creates a row visible in ops console; the 6th same-day report returns 429.

## Task 2.11 — Season selector & career view

**Goal:** Profiles work across seasons.
**Touches:** `src/app/players/[id]/page.tsx` (accept `searchParams.season`), new `src/app/players/[id]/components/season-selector.tsx` (client, pushes `?season=<competition_id>` via `useRouter`), helpers in `data.ts`.
**Data:** distinct competitions for the player from `v_public_box_score`→`v_public_games`; career totals = SUM over all competitions.
**Steps:** selector defaults to the latest competition; every section (hero averages, arc, shooting, radar, log) scopes to the selected competition; a "Карьер" option aggregates all seasons (radar hides in career mode — league-average baseline is per-competition). Career totals row (GP, PTS, REB, AST) always visible under the hero.
**Done when:** a player seeded in two competitions switches cleanly via the selector and career sums equal the two seasons' sums.

## Task 2.12 — Box-score history below the fold

**Goal:** Keep the full log one tap away without dominating the page.
**Touches:** `src/app/players/[id]/page.tsx` — wrap the existing game-log table in shadcn `tabs` ("Тойм" default | "Бүх тоглолт"), the visual sections under Тойм.
**Done when:** default view is the showcase; the full table is intact under the second tab with all columns it has today.
