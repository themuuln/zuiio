# Interactive UI Gaps — Feature Opportunities

> Feasibility analysis for adding creative interactions to Onoo.
> Generated 2026-07-18. Verified against database schema, data layer, and core domain model.

---

## Database State

### What exists

| Table / View | Key columns | Used by |
|---|---|---|
| `stat_events` | `event_type`, `period`, `clock_seconds`, `player_id`, `team_season_id`, `payload` (JSON) | Tracker, play-by-play |
| `game_player_stats` | `game_id`, `player_id`, all stat columns (pts, fgm, fga, …) | Box scores, player pages |
| `game_team_stats` | `game_id`, `team_season_id`, all stat columns | Team totals |
| `season_player_stats` | `competition_id`, `player_id`, `gp`, all stat columns | Season averages |
| `standings` | `competition_id`, `team_season_id`, `w`, `l`, `points_for`, `points_against` | Standings page |
| `games` | `home_score`, `away_score`, `status`, `current_period`, `scheduled_at` | Game pages, live scores |
| `v_public_standings` | extends standings with `streak`, `last10`, `win_pct`, `gb`, team metadata | Standings page |
| `v_public_leaders` | per-player season aggregates with team/league context | Leaders page |
| `v_public_box_score` | per-player per-game stats with revision context | Game detail |
| `v_public_games` | denormalized game + teams + venue + revision metadata | All game surfaces |

### Shot location data

Shot payloads already define `x, y` coordinates:

```ts
// packages/core/src/events/payloads.ts
export const ShotMadePayload = z.object({
  assisted_by: z.string().optional(),
  x: z.number().optional(),   // ← court x coordinate
  y: z.number().optional(),   // ← court y coordinate
});

export const ShotMissedPayload = z.object({
  blocked_by: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
});
```

The `stat_events.payload` column is JSON, so `x,y` values are stored when present. The tracker UI does not currently prompt for shot location — scorekeepers tap the event type without placing a shot on a court. Coordinates are **schema-ready** but **capture-absent**.

### What's missing

| Gap | Impact | Difficulty to add |
|---|---|---|
| Shot location capture in tracker | Enables heatmap, shot charts | Medium — tracker UX change, no schema change |
| Period-by-period stat aggregation | Per-quarter breakdowns | Low — derive from `stat_events` grouped by `period` |
| Head-to-head game history | Player/team comparisons | Low — compute from `games` + `box_score` |
| Real-time court positions | Full live court animation | High — requires new data model for player positions |

---

## Landing Page & IA Gaps (Competitive Research)

> Competitive analysis of NBA.com, Basketball-Reference, FIBA.basketball, and MaxPreps.
> These gaps target landing page engagement and information architecture — different from the interactive UI features below.

### 11. Multi-Category Leaderboard Strip

**Surfaces:** Landing page, Leaders page

**Concept:** Show leaders across 3-5 stat categories (PTS, REB, AST, STL, BLK), not just scoring. Each category shows top 3 with player avatar, name, team, and stat value. "View All" link per category.

**Data required:**
- `v_public_leaders` — already has per-player season aggregates

**Database changes:** None

**Implementation:**
- Add horizontal scrollable strips below the current podium section
- Each strip has a category header, top 3 players, and "View All →" link to `/leaders`

**Libraries:** None

**Complexity:** Low. ~150 lines. Reuse existing `PlayerAvatar` and leader data.

**Evidence:** NBA (top-10 per category), FIBA (top-3 per category), MaxPreps (top-5 per category). All 3/3 visual competitors do this.

**Priority:** P0

---

### 12. Tournament Hub Pages

**Surfaces:** New route `/tournaments/[id]`

**Concept:** Each tournament gets its own branded page with games grouped by phase/round, group standings, knockout bracket, tournament leaders, and news. Self-contained microsite pattern from FIBA.

**Data required:**
- `games` filtered by tournament/competition, `standings` by competition, `v_public_leaders` by competition

**Database changes:** Audit whether data model distinguishes tournaments from seasons. May need `competitions` table or tournament grouping.

**Implementation:**
- Create `/tournaments/[id]/page.tsx` with: games grouped by round, group standings tables, bracket visualization, tournament leaders, editorial content

**Libraries:** None

**Complexity:** Medium. ~400 lines for the page + components.

**Evidence:** FIBA (every competition is a self-contained microsite). No other competitor does this at local level.

**Priority:** P1

---

### 13. Tournament Bracket Visualization

**Surfaces:** Tournament hub pages, Playoffs section

**Concept:** SVG or CSS-based bracket showing knockout round matchups with scores, team logos, and advancement lines. Include classification rounds (9-12, 13-16) following FIBA's model.

**Data required:**
- `games` with round/bracket metadata, team info

**Database changes:** May need bracket positioning data or compute from game ordering

**Implementation:**
- SVG bracket component with team logos, scores, connecting lines
- Standard 8-team single-elimination first, extend to classification

**Libraries:** None — pure SVG + CSS

**Complexity:** Medium. ~300 lines for bracket component.

**Evidence:** FIBA (visual brackets for knockout + classification). Only 1/4 competitors.

**Priority:** P1

---

### 14. Season/Competition Selector

**Surfaces:** Landing page leaders section, Leaders page, Standings page

**Concept:** Dropdown to switch between seasons/competitions. Default to current. Enables historical data browsing.

**Data required:**
- List of seasons/competitions (new query or from existing data)

**Database changes:** None — seasons already exist in data model

**Implementation:**
- Add a `<Select>` dropdown above leader/standing sections
- On change, re-fetch data for selected season/competition

**Libraries:** shadcn `Select` (already installed)

**Complexity:** Low. ~80 lines for the selector + data refetch logic.

**Evidence:** NBA (season dropdown), BBRef (season dropdown on every page), FIBA (historical date selector). 3/4 competitors.

**Priority:** P2

---

### 15. Countdown Timer for Next Game

**Surfaces:** Landing page hero section

**Concept:** Live countdown below the hero showing days/hours/minutes/seconds until the next scheduled game. Creates urgency and return visits.

**Data required:**
- `scheduled_at` from next game — already fetched in `getGamesByDate` / `getLiveGames`

**Database changes:** None

**Implementation:**
- Simple countdown component using `Intl.DateTimeFormat` for Ulaanbaatar timezone
- Remove when game starts, replace with live score

**Libraries:** None

**Complexity:** Low. ~60 lines for countdown component.

**Evidence:** FIBA (countdown timers to Women's WC, Men's WC 2027). Unique pattern — only 1/4.

**Priority:** P2

---

### 16. Shareable Stat Cards

**Surfaces:** Player pages, Game result pages

**Concept:** Generate Instagram/Twitter-ready stat graphics showing a player's top performance or game result. OG-image-style cards rendered server-side.

**Data required:**
- Player stats, game results — all existing

**Database changes:** None

**Implementation:**
- Use `@vercel/og` or Satori to render stat cards server-side
- Add share buttons on player/game pages
- Generate OG images for social preview

**Libraries:** `@vercel/og` or `satori` (new dep)

**Complexity:** Medium. ~200 lines for card template + generation endpoint.

**Evidence:** Gap in all 4 competitors — no one generates shareable stat graphics.

**Priority:** P3
---

## Feature Ideas

### 1. Score Flip Animation

**Surfaces:** Game detail page header, Tracker live scoreboard

**Concept:** Score digits use a flip-clock animation (like airport departure boards) when points are scored. Each digit column rotates vertically with a shadow fold, creating anticipation before the new number settles.

**Data required:**
- `home_score`, `away_score` from `v_public_games` — **already exist**

**Database changes:** None

**Implementation:**
- Pure CSS `@keyframes` with `rotateX` transform
- Each digit is a separate element; on score change, the top half flips down revealing the new digit
- Triggered by Supabase Realtime subscription on the `games` table (already used by tracker)
- Works on both server-rendered game pages (static snapshot) and client-tracked live games (animated updates)

**Libraries:** None — CSS only. Can use the `--animate-bay-assigned` pattern from Tolom as reference for spring easing.

**Complexity:** Low. ~200 lines of CSS + a small `FlipDigit` component.

---

### 2. Skill Radar League Overlay

**Surfaces:** Player page skill radar chart

**Concept:** The existing radar chart shows the player's normalized shape. Add a semi-transparent ghost polygon behind it representing league averages. A toggle lets users show/hide the overlay. The two overlapping shapes immediately reveal strengths (player spikes above league) and weaknesses (player dips below).

**Data required:**
- `playerStats` — player's per-game averages (already passed to `SkillRadar`)
- `leagueAverages` — league mean per stat (already passed)
- `leagueMaxes` — league max per stat for normalization (already passed)

**Database changes:** None

**Implementation:**
- Add a second `<Radar>` component inside the existing `<RadarChart>` with semi-transparent fill (`opacity: 0.15`)
- Animate overlay in with CSS transition on toggle
- The league average polygon uses `leagueAverages` values normalized to the same 0-100 scale
- Tooltip on hover shows both player and league values

**Libraries:** recharts (already installed)

**Complexity:** Low. ~50 lines of changes to existing `skill-radar.tsx`.

---

### 3. Interactive Court Heatmap

**Surfaces:** Player page, Game detail page

**Concept:** An SVG basketball half-court divided into zones (paint, mid-range left/right, three-point arc segments). Tap a zone to see FGM/FGA and percentage for that area. Shot attempts are plotted as dots with made/missed color coding. The court IS the data.

**Data required:**
- Shot location coordinates (`x, y`) from `stat_events.payload` — **schema exists, capture pending**
- FGM/FGA per zone — derivable from shot events grouped by coordinate ranges

**Database changes:** None (if shot capture is added to tracker). Without it, the court shows an honest empty state or uses synthetic demo data.

**Implementation:**
- SVG half-court with clickable zones (path-based hit detection)
- Each zone is a `<path>` with hover highlight and click handler
- Shot dots rendered as `<circle>` elements at `x,y` positions
- Color coding: green = made, red = missed, size = recency (larger = more recent)
- Zone stats computed client-side from shot event array
- Falls back to "No shot data available" empty state when coordinates are absent

**Libraries:** None — pure SVG + React state.

**Complexity:** Medium. ~400 lines for the court component + zone logic. The hard part is the coordinate-to-zone mapping, not the rendering.

**Pre-requisite:** Tracker needs to capture shot locations. This can be a future tracker enhancement — the heatmap component should be built to gracefully handle empty data.

---

### 4. Season Arc Brush Selection

**Surfaces:** Player page season arc chart

**Concept:** The existing area chart shows points/rebounds/assists over games. Add a brush control on the x-axis that lets users drag to select a date range. Selecting 5 games recalculates and displays stats for just those games. Tapping a data point highlights the corresponding row in the Recent Games table below.

**Data required:**
- `GameDataPoint[]` with `game_id`, `game_date`, `pts`, `reb`, `ast`, `result`, `opponent` — **already exists**

**Database changes:** None

**Implementation:**
- Add recharts `<Brush>` component below the x-axis — it renders a miniaturized version of the chart as a range selector
- On brush change, filter `data` array to selected range and recalculate summary stats
- Add `onMouseEnter`/`onClick` handlers to `<Area>` data points
- Pass selected `game_id` up to parent, which highlights the matching row in `RecentGames`
- Summary stats (avg PPG, avg RPG in selection) shown as small badges above the chart

**Libraries:** recharts `<Brush>` — built-in, zero additional deps.

**Complexity:** Low. ~100 lines of changes to existing `season-arc.tsx` + callback wiring to `recent-games.tsx`.

---

### 5. Standings Row Expansion

**Surfaces:** Standings page

**Concept:** Click/tap a team row → it expands inline (accordion) to show the team's last 5 games, key players (top 3 scorers), and a mini point-differential chart. No page navigation needed.

**Data required:**
- `streak`, `last10` — **already in `v_public_standings`**
- Recent games — queryable via `v_public_games` filtered by team
- Top players — queryable via `v_public_leaders` filtered by team

**Database changes:** None

**Implementation:**
- Wrap each `<TableRow>` in a `Collapsible` (shadcn) or use CSS `grid-template-rows: 0fr → 1fr` animation
- On expand, fetch team's last 5 games and top 3 players (lazy load via TanStack Query)
- Render mini content: W/L badges for recent games, player avatars with PPG, tiny bar chart of point differential
- Smooth height animation with `transition: grid-template-rows 300ms ease`

**Libraries:** shadcn `Collapsible` (already installed) or CSS-only accordion.

**Complexity:** Low. ~150 lines for the expansion content + lazy data fetch.

---

### 6. Drag-to-Compare Players

**Surfaces:** Leaders page, Player page → Player Compare

**Concept:** From the leaders page, drag a player card onto another to open a head-to-head comparison. Or: on any player page, drag their hero card to a "compare zone" that appears on hover, then drop to open comparison. The compare page shows side-by-side radar charts that animate into each other.

**Data required:**
- Player stats for both players — **`/api/stats/compare-players/route.ts` already exists**
- Player profiles — `getPlayerById` returns full profiles
- Compare page (`players/compare/`) and `compare-players-client.tsx` already exist

**Database changes:** None

**Implementation:**
- Use `@dnd-kit/core` for drag (already used in Tolom's bay view)
- Leader card becomes draggable; a drop zone appears on the compare page or as an overlay
- On drop, navigate to `/players/compare?p1=<id1>&p2=<id2>`
- Compare page renders two `<SkillRadar>` charts with animated overlay transition
- Side-by-side stat table with delta highlighting (green = better, red = worse)

**Libraries:** `@dnd-kit/core` + `@dnd-kit/sortable` (Tolom already uses these).

**Complexity:** Medium. ~300 lines for drag UX + compare page enhancements. The data layer is fully ready.

---

### 7. Card Flip Stats

**Surfaces:** Player hero card stat numbers

**Concept:** Each stat card (PPG, RPG, APG) flips on click to show a secondary stat on the back — "per 36 minutes", "league rank", or "career high". The flip uses a 3D CSS transform with a satisfying rotation.

**Data required:**
- `points_per_game`, `minutes_per_game`, `games_played` — **already in `PlayerProfileRow`**
- League ranks — derivable from `v_public_leaders` sorted by each stat
- Career totals — `getPlayerCareerTotals` already exists

**Database changes:** None

**Implementation:**
- CSS `perspective` + `transform: rotateY(180deg)` with `backface-visibility: hidden`
- Front face: current stat value (e.g., "22.4 PPG")
- Back face: computed value (e.g., "#2 in league" or "25.1 per 36min")
- Toggle on click/tap with 600ms transition
- Add small flip icon indicator to signal interactivity

**Libraries:** None — pure CSS.

**Complexity:** Low. ~120 lines for the flip component + rank computation.

---

### 8. Swipeable Game Cards

**Surfaces:** Games listing page

**Concept:** On mobile, each game card is swipeable left to reveal quick actions (view box score, view play-by-play, share). On desktop, hover reveals the same actions as a slide-in panel.

**Data required:**
- Game `id`, `status`, team metadata — **all in `v_public_games`**

**Database changes:** None

**Implementation:**
- CSS `overflow: hidden` on card container
- Touch event handlers: `touchstart` → `touchmove` → `touchend` with `transform: translateX()`
- Reveal panel width: 120px (3 action buttons at 40px each)
- Actions: Box Score (link), Play-by-Play (link), Share (navigator.share API)
- Desktop: `:hover` triggers same reveal via CSS transition
- Snap back on insufficient swipe distance (< 40px threshold)

**Libraries:** None — native touch events + CSS transitions.

**Complexity:** Low. ~100 lines for swipe logic + action buttons.

---

### 9. Drag-to-Reorder Leader Categories

**Surfaces:** Leaders page

**Concept:** The leader tabs (Points, Rebounds, Assists, etc.) can be reordered by dragging. Users pin their favorite stat categories to the top. Order persists in localStorage.

**Data required:**
- All stat columns from `v_public_leaders` — **already fetched**

**Database changes:** None

**Implementation:**
- `@dnd-kit/sortable` on the `<TabsList>` container
- Each `<TabsTrigger>` becomes a sortable item with a grip handle
- On drag end, reorder the `CATEGORIES` array in local state
- Persist order to `localStorage.setItem('onoo-leader-order', JSON.stringify(order))`
- On mount, read from localStorage to restore custom order
- Default order preserved for first-time visitors

**Libraries:** `@dnd-kit/sortable` (Tolom already uses it).

**Complexity:** Low. ~80 lines for sortable wrapper + localStorage persistence.

---

### 10. Live Court Animation (Full)

**Surfaces:** Tracker page, Live game center on game detail

**Concept:** A visual basketball court overlay where each scored event places a dot/pulse at the shot location. Players on court are shown as positioned dots that move on substitutions. Events animate in from the edge with scale + fade. The court updates in real-time as the tracker logs events.

**Data required:**
- Shot events with `x, y` coordinates — **schema exists, capture pending**
- Substitution events — **exist** (`substitution` event type in dictionary)
- Player court positions — **NOT in schema** (would need new data model)

**Database changes:** 
- Optional: Add `position_x`, `position_y` columns to a new `player_court_positions` table or extend `stat_events` payload
- Alternative: Compute positions from substitution events (5 players on court at any time) without storing explicit coordinates

**Implementation:**
- SVG court with animated elements (CSS `@keyframes` for pulse, fade-in, scale)
- Each shot event renders as a circle at `(x, y)` with color (green/red) and fade-in animation
- Player dots positioned based on substitution timeline
- Real-time updates via Supabase Realtime subscription on `stat_events`
- Event feed sidebar shows scrolling play-by-play alongside the court

**Libraries:** None — pure SVG + CSS animations + Supabase Realtime.

**Complexity:** High. ~600 lines for court + animation logic + position computation. Requires tracker UX changes for shot capture.

**Pre-requisite:** Tracker must capture shot locations. This is the most ambitious feature and should be built after the simpler interactions prove out.

---

## Priority Matrix

| Priority | Feature | DB Ready | Frontend Only | New Deps | Effort | Impact |
|---|---|---|---|---|---|---|
| **P0** | Score Flip Animation | ✅ | ✅ | None | Low | 🔥🔥🔥 |
| **P0** | Skill Radar Overlay | ✅ | ✅ | None | Low | 🔥🔥 |
| **P0** | Season Arc Brush | ✅ | ✅ | None | Low | 🔥🔥 |
| **P1** | Standings Expansion | ✅ | ✅ | None | Low | 🔥🔥 |
| **P1** | Card Flip Stats | ✅ | ✅ | None | Low | 🔥 |
| **P1** | Drag-to-Compare | ✅ | ✅ | @dnd-kit | Medium | 🔥🔥 |
| **P2** | Swipeable Game Cards | ✅ | ✅ | None | Low | 🔥 |
| **P2** | Reorder Leaders | ✅ | ✅ | @dnd-kit | Low | 🔥 |
| **P2** | Court Heatmap | ⚠️ | ✅ | None | Medium | 🔥🔥🔥 |
| **P3** | Live Court Animation | ⚠️ | ⚠️ | None | High | 🔥🔥🔥 |
| **P0** | Multi-Category Leaderboard | ✅ | ✅ | None | Low | 🔥🔥🔥 |
| **P1** | Tournament Hub Pages | ⚠️ | ✅ | None | Medium | 🔥🔥🔥 |
| **P1** | Tournament Bracket | ⚠️ | ✅ | None | Medium | 🔥🔥 |
| **P2** | Season Selector | ✅ | ✅ | shadcn Select | Low | 🔥🔥 |
| **P2** | Countdown Timer | ✅ | ✅ | None | Low | 🔥 |
| **P3** | Shareable Stat Cards | ✅ | ✅ | @vercel/og | Medium | 🔥 |

**Legend:**
- ✅ = fully supported by current schema
- ⚠️ = schema partially exists (shot coordinates optional in payloads)
- Frontend Only = no database migration needed
- New Deps = additional npm packages (all already used by Tolom)

---

## Recommended Build Order

### Batch 1: Pure frontend wins (zero risk)
1. Score flip animation
2. Skill radar league overlay
3. Season arc brush selection

### Batch 2: Interaction layer (low risk, new UX patterns)
4. Standings row expansion
5. Card flip stats
6. Swipeable game cards

### Batch 3: Drag-and-drop (new dependency, proven pattern)
7. Drag-to-reorder leaders
8. Drag-to-compare players

### Batch 4: Data-dependent (needs tracker enhancement)
9. Court heatmap (requires shot location capture)
10. Live court animation (requires shot capture + position model)

### Batch 5: Competitive UI gaps (from research)
11. Multi-category leaderboard strip
12. Season/competition selector
13. Countdown timer

### Batch 6: Tournament infrastructure (new routes)
14. Tournament hub pages
15. Tournament bracket visualization
16. Shareable stat cards

---

## Tolom Patterns to Reuse

| Pattern | Tolom source | Onoo target |
|---|---|---|
| `@dnd-kit` drag-and-drop | `bay-view-v2/_draggable-vehicle-wrapper.tsx` | Compare players, reorder leaders |
| Live elapsed timer | `bay-view-v2/_elapsed-display.tsx` | Tracker game clock enhancement |
| Custom CSS animations | `globals.css` `--animate-bay-assigned` | Score flip, court pulse effects |
| Celebration effects | `bay-view-v2/_drawer-celebration.tsx` | Milestone achievement animation |
| Touch-optimized interactions | `bay-view-v2/_types.tsx` TouchSensor/PointerSensor | Swipeable cards, court taps |
| View mode switching | `bay-view-v2/_view-selector.tsx` Grid/Kanban/List | Court view modes (heatmap/list/raw) |


---

## Testing & Infrastructure Gaps

> Research findings from 2026-07-22: compared against Next.js + Supabase testing best practices.

### CI Pipeline for Local Supabase Tests

**Context:** All tests (unit, integration, pgTAP, E2E) only run on a developer machine. No GitHub Actions workflow exists.

**What industry does:** A `.github/workflows/ci.yml` that starts Supabase locally in the runner, extracts credentials via `supabase status -o json | jq`, and runs all tests on every push.

**Implementation:**
- Create `.github/workflows/ci.yml`
- `supabase/setup-cli@v3` action
- `supabase start --exclude studio,imgproxy,inbucket,vector,logflare,edge-runtime,meta`
- `supabase status -o json | jq` to inject `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `DATABASE_URL`
- Run `pnpm test:all` and `supabase test db`

**Complexity:** Low. ~30 lines of YAML.

**Priority:** P2 (deferred — solo dev, free-tier CI minutes)

**Evidence:** Supabase docs, Chayut architecture report, 3/3 reference implementations.