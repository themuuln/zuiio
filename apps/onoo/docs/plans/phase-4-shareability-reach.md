# Phase 4 — Shareability & reach (execution spec)

Prereq reading: `docs/plans/00-conventions.md`. OG/image tasks use `ImageResponse` from `next/og` (built into Next 16 — **no new dependency**). Cyrillic text in generated images requires a bundled font: first task that needs it downloads `NotoSans-Bold.ttf` + `NotoSans-Regular.ttf` into `src/assets/fonts/` (if network access is unavailable, stop and ask a human to place the files; do not substitute a non-Cyrillic font).

## Task 4.1 — OG images

**Goal:** Links pasted into Messenger/Facebook render branded stat cards.
**Touches:** new `src/app/players/[id]/opengraph-image.tsx`, `src/app/games/[id]/opengraph-image.tsx`, `src/app/teams/[slug]/opengraph-image.tsx`; shared template helpers in `src/lib/og/` (new: `theme.ts` for colors/fonts, `load-fonts.ts`).
**Data:** same helpers the pages use (`getPlayerById` + season averages; `getGameById`; `getTeamBySlug`). `opengraph-image.tsx` runs server-side — reuse `src/app/lib/data.ts` directly.
**Steps:**
1. `load-fonts.ts`: read the two Noto files with `fs.readFile` and export for `ImageResponse` `fonts` option. Size 1200×630, `alt` text set, `contentType = 'image/png'`.
2. Player card: dark background, team-color accent bar, photo (fetched `photo_url`; placeholder initials block when null), name, team, three big numbers (PPG/RPG/APG) with `STAT_LABELS.mn` captions, "onoo.mn" wordmark bottom-right.
3. Game card: both team logos + short_codes, final score huge center, status chip ("Баталгаажсан" for league_verified|official), date. Team card: logo, name, W–L, top scorer line.
4. Each existing `generateMetadata` on these pages already exists — verify it doesn't override `openGraph.images` (file-convention wins only if metadata doesn't set images; remove any hardcoded image entries).
**Done when:** `curl` of `/players/<id>/opengraph-image` returns a PNG with correct Cyrillic rendering; the local OG debugger (paste URL into `https://www.opengraph.xyz` or check `<meta property="og:image">` in page source) shows the card.

## Task 4.2 — Shareable stat cards (download)

**Goal:** Players download a game-line or award image to post themselves.
**Touches:** new `src/app/api/og/player-card/route.tsx` (query: `playerId`, `gameId?`, `awardId?`); new client `src/components/share-card-button.tsx`; mounted on player page (hero + awards shelf) and game box-score rows.
**Steps:**
1. Route returns `ImageResponse` 1080×1350 (feed portrait): game mode = player photo, one-liner from `describePlayerGame` (Task 2.9), full stat line, opponent + date; award mode = award badge layout from `v_public_awards`. Reuse `src/lib/og/theme.ts`.
2. Sponsor strip: if Task 4.5 has landed, render the `award_card`/`recap` slot sponsor logo bottom strip; else leave a clearly-marked placeholder region (comment `SPONSOR SLOT — filled by Task 4.5`).
3. `ShareCardButton`: fetches the route as blob → triggers download (`a[download]`); on Web Share API support (`navigator.canShare` with files), offer native share instead. Label "Зураг татах".
**Done when:** tapping the button on a seeded player's game row downloads a PNG whose numbers match the box score.

## Task 4.3 — Game recap pages

**Goal:** Final score, top performers, lead flow — visual.
**Touches:** `src/app/games/[id]/page.tsx` (recap section when status ∈ final_pending_review|league_verified|official); new components under `src/app/games/[id]/components/`: `recap-header.tsx`, `top-performers.tsx`, `score-worm.tsx` (client, Recharts).
**Data:** `getGameById`, `getPlayByPlay` (exists in `data.ts`), `v_public_box_score`.
**Steps:**
1. Header: score, status chip — `final_pending_review` renders a visible "Урьдчилсан дүн" (provisional) badge; verified renders "Баталгаажсан". Provisional games must be readable here even though `v_public_games` hides them — this is delivered by Task 5.1's `v_public_live_games` view; if 5.1 hasn't landed, recap covers verified games only and a `TODO(5.1)` comment marks the gate.
2. Top performers: top-3 by EFF (same constant as Task 3.5 — import, don't redefine) as cards with `PlayerAvatar`, stat line, one-liner from `describePlayerGame`.
3. Score worm: cumulative score differential over event sequence from play-by-play as a Recharts `AreaChart` around zero (positive = home lead, team-colored fills); quarter boundaries as reference lines.
4. Wire the whistle-to-recap measure: this page must render correctly the moment `cmd_transition_game` moves a game to `final_pending_review` (verify with the integration script from Task 1.10).
**Done when:** a seeded finished game shows header/performers/worm; worm crosses zero where the play-by-play says the lead changed.

## Task 4.4 — Embeds

**Goal:** League/team sites can iframe a game or player widget.
**Touches:** new routes `src/app/embed/game/[id]/page.tsx`, `src/app/embed/player/[id]/page.tsx`; new `src/app/embed/layout.tsx` (bare — no site nav, transparent-friendly background); header config.
**Steps:**
1. Widgets: game = compact `GameCard` (Task 3.1 component, reused); player = mini hero (avatar, name, 3 averages). Both fully server-rendered, zero client JS except none. Footer link "onoo.mn ↗" (target=_blank).
2. Allow framing for `/embed/*` only: in `next.config.ts` add a `headers()` entry setting `Content-Security-Policy: frame-ancestors *` for `/embed/:path*` and confirm no global `X-Frame-Options: DENY` exists (grep `frame` in `next.config.ts` and `vercel.json` first; report if a global header conflicts).
3. Document iframe snippet in `docs/embeds.md` (width/height recommendations).
**Done when:** an `<iframe>` in a plain local HTML file renders both widgets.

## Task 4.5 — Sponsor placements

**Goal:** Sellable "presented by" inventory, league-managed.
**Touches:** new migration; admin page `src/app/admin/sponsors/page.tsx` + API routes `src/app/admin/api/sponsors/...`; public component `src/components/sponsor-slot.tsx`; mounts on standings, leaders, game pages, stat cards (Task 4.2), recaps.
**Steps:**
1. Migration: `sponsors (id, name, logo_url, link_url, active bool default true)`; `sponsor_placements (id, sponsor_id references sponsors, competition_id references competitions, slot text not null check (slot in ('standings','leaders','game','recap','award_card','home')), starts_on date, ends_on date)`; storage bucket `sponsor-logos` (public read, admin write — mirror Task 2.1 bucket pattern); view `v_public_sponsor_slots` (active, date-window-valid placements with logo/link). RLS: tables closed; admin writes via admin API using service role is NOT allowed — add `cmd_upsert_sponsor` + `cmd_set_placement` SECURITY DEFINER commands following the Task 3.5 admin-guard pattern.
2. `SponsorSlot slot="standings" competitionId=...`: server component; renders "Ивээн тэтгэгч" caption + logo + link, or **nothing** (null) when no active placement — never an empty box.
3. Admin CRUD: sponsor list + placement calendar (simple table: slot × date range), logo upload.
4. Mount points: below standings table, leaders header, game page footer, recap header, stat-card strip (Task 4.2 placeholder), homepage footer.
**Done when:** placing a seeded sponsor on `standings` shows the logo on the standings page within its date window and hides it outside the window.

## Task 4.6 — League audience dashboard

**Goal:** Proof-of-audience numbers for sponsor pitches.
**Touches:** new migration; beacon `src/components/view-beacon.tsx` + route `src/app/api/track/route.ts`; admin page `src/app/admin/audience/page.tsx`.
**Steps:**
1. Migration: `daily_page_views (day date not null, entity_type text not null check (entity_type in ('player','game','team','home','leaders','standings')), entity_id uuid, views bigint not null default 0, primary key (day, entity_type, entity_id))`; function `cmd_increment_page_view(p_entity_type text, p_entity_id uuid)` SECURITY DEFINER doing an upsert `views = views + 1` on today's row; RLS closed to public; grant execute to `anon`.
2. `ViewBeacon entityType entityId`: client component, fires one `navigator.sendBeacon('/api/track', ...)` per mount (guard with a `useEffect` + `useRef` once-flag; skip when `document.visibilityState === 'prerender'`). Route calls the RPC. **No cookies, no IP storage, no user agent** — counts only.
3. Mount on player, game, team pages + home/leaders/standings (entity_id null → use a fixed zero-uuid `00000000-0000-0000-0000-000000000000`).
4. Admin page: date-range picker (default 30 days), totals per entity_type, top-10 most-viewed players and games (join names via views), one Recharts line of daily totals. Add a "views" column to the ops staleness check? No — keep audience and ops pages separate (they serve different buyers).
**Done when:** visiting a player page increments today's row exactly once per load; dashboard top-10 matches SQL.

## Task 4.7 — English profile view/export

**Goal:** Scout-facing English toggle + export.
**Touches:** player page tree (thread `locale` prop), `src/app/players/[id]/page.tsx` (`searchParams.lang`), small toggle component `src/app/players/[id]/components/lang-toggle.tsx`; `src/app/api/export/pdf/route.ts` (accept `lang=en`).
**Steps:**
1. `lang=en` → all stat labels via `getStatLabel(stat, 'en')` (the `en` dictionary already exists in `packages/core/src/i18n/stats.ts` — fill any missing keys there, never inline), names via `formatPlayerName(..., 'en')` (prefers `name_latin`), dates in `en-US` format, milestone/summary strings via the `en` variants from Tasks 2.6/2.9.
2. Toggle is a link (`?lang=en`), server-rendered — no client i18n state. Default stays `mn`; only the player page gets the toggle (site-wide EN is out of scope — do not add it to nav/layout).
3. PDF export: pass `lang` through; English header "Official player statistics — Onoo" + competition name.
**Done when:** `?lang=en` renders the full player page with zero Cyrillic stat labels remaining (grep the rendered HTML for known mn labels as a spot check) and the PDF matches.

## Task 4.8 — SEO basics

**Goal:** Profiles findable via Google/Facebook search, not just shared links.
**Touches:** new `src/app/sitemap.ts`, `src/app/robots.ts`; audit pass over existing `generateMetadata`.
**Steps:**
1. `sitemap.ts`: static routes (`/`, `/games`, `/leaders`, `/standings`, `/players`) + dynamic entries from `v_public_players` (Task 3.8 view), `v_public_games` (last 500), teams. Set `lastModified` where available; base URL from `process.env.NEXT_PUBLIC_SITE_URL` with a safe fallback — grep `.env` handling in the repo for the canonical var name before inventing one.
2. `robots.ts`: allow all, disallow `/admin`, `/tracker`, `/api`, `/embed`; point to the sitemap.
3. Metadata audit: every public page has unique `title` (player name — team — Оноо), `description` with a real stat, `alternates.canonical`. Hidden players (Task 2.2) must be excluded from the sitemap.
**Done when:** `/sitemap.xml` and `/robots.txt` respond correctly in `pnpm build && pnpm start`, and a hidden player's URL is absent from the sitemap.
