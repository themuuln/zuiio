---
**ID:** `G-05`
**Name:** Standings Row Expansion
**Priority:** `P1`
**Status:** `⬜`
**Effort:** `S` (2-4h)
**Tags:** `frontend`, `interaction`, `standings`, `accordion`
**DB Readiness:** `✅` Fully supported by current schema

---

## Goal

Click/tap a team standings row → it expands inline (accordion) to show the team's last 5 games, key players (top 3 scorers), and a mini point-differential chart. No page navigation needed.

## Why

Standings tables communicate ranking but not context. A single row click reveals the "story behind the rank" — recent form, key contributors, scoring trends — without leaving the page. This turns the standings from a static table into an interactive exploration surface.

## Technical Approach

### Expandable Row

- Wrap each `<TableRow>` in a shadcn `<Collapsible>` component (already installed)
- Expands on click/tap on the row (or a dedicated "expand" button in the last cell)
- Uses CSS `grid-template-rows: 0fr → 1fr` animation for smooth height transition
- `transition: grid-template-rows 300ms ease`

### Expanded Content Layout

```
┌─────────────────────────────────────────────────────┐
│ Rank │ Team │ W │ L │ PCT │ GB │ STRK │ L10 │ ▶    │ ← collapsible trigger
├─────────────────────────────────────────────────────┤
│ ┌─ Last 5 Games ─────┐ ┌─ Top Scorers ───────────┐ │
│ │ ✅ W 78-72 vs MAG  │ │ 🏀 B. Bat-Erdene  22.1  │ │
│ │ ❌ L 65-70 at TIT  │ │ 🏀 T. Battulga    16.8  │ │
│ │ ✅ W 80-65 vs TIG  │ │ 🏀 S. Davaajav    14.2  │ │
│ │ ✅ W 72-68 at MAG  │ │                        │ │
│ │ ❌ L 60-62 vs TIT  │ │                        │ │
│ └─────────────────────┘ └────────────────────────┘ │
│ ┌─ Point Differential ───────────────────────────┐ │
│ │ ██████████████░░░░░░░  +5.2                     │ │
│ │ Mini bar chart of last 10 game diff             │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Data Loading

- **Lazy load via TanStack Query** — on expand, fire queries for:
  1. Team's last 5 games: `getTeamRecentGames(teamSeasonId, 5)` via `v_public_games`
  2. Top 3 scorers: `getTeamLeaders(teamSeasonId, 'pts', 3)` via `v_public_leaders`
- Show loading skeleton (3 shimmer lines) while data loads
- Cache with `staleTime: 60_000` (1 min) — expanded content doesn't need high freshness

### Point Differential Mini Chart

- Simple horizontal bar: green portion = games with positive diff, red = negative
- Or: mini sparkline using SVG (small `<polyline>` or 10 `<rect>` bars)
- Show net differential as a number

## Data Dependencies

| Entity | Access | Purpose |
|--------|--------|---------|
| `v_public_standings` | Already loaded | Team row data (W, L, PCT, GB, streak, last10) |
| `v_public_games` | Lazy read | Team's recent 5 games filtered by team |
| `v_public_leaders` | Lazy read | Top 3 players filtered by team |

No database changes needed.

## Implementation Steps

1. **Wrap standings rows in `<Collapsible>`:**
   - Import shadcn `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`
   - Trigger: the entire `<TableRow>` or a caret button in the last cell
   - Content: the expanded section

2. **Create `ExpandedStandingsRow` component:**
   - Props: `teamSeasonId: string`
   - Queries: `getTeamRecentGames(teamSeasonId, 5)`, `getTeamLeaders(teamSeasonId, 'pts', 3)`
   - Loading state: skeleton shimmer
   - Error state: "Could not load team details"
   - Empty state: "No recent games"

3. **Create mini point differential chart:**
   - SVG-based 10-bar sparkline
   - Green bar = positive diff, red = negative, height proportional to |diff|
   - Label with net differential

4. **Style the expansion:**
   - Rounded corners on the expanded panel
   - Subtle background color to distinguish from row
   - Smooth height animation

5. **Handle multiple expanded rows:**
   - Allow only one expanded row at a time (accordion pattern)
   - Or allow multiple (optional). Default: single.

6. **Test:**
   - Click row → expand animation plays
   - Data loads with skeleton
   - Click another row → first collapses, second expands

## Implementation Complexity & Effort

**Complexity:** Low. ~150 lines for the expansion content + lazy data fetch.

**Effort:** S (2-4 hours)
- Collapsible wrapper + state: 30min
- Expanded content layout: 1h
- Data queries + loading states: 1h
- Mini chart: 30min

## Dependencies / Prereqs

**Blocked by:** None
**Prereqs:** Standings page renders with `v_public_standings` data. shadcn `Collapsible` installed in the app. TanStack Query available.

## Design Decisions

- **Use shadcn `Collapsible` over custom CSS.** Already installed, accessible (keyboard + screen reader), consistent with component library.
- **Single-expand accordion by default.** Prevents information overload and keeps the table scannable.
- **Lazy load on expand, not preload.** Standings are visited often but expansions are intermittent. Avoid fetching data for all 10+ teams on page load.
- **Mini SVG chart over recharts.** Simpler, no import overhead, and the data is small (10 bars).

## Risks & Gotchas

- **CSS `grid-template-rows` animation** has browser support caveats. Test in Safari (may need explicit grid row tracking). Fallback: `max-height` transition.
- **Multiple expanded rows** on narrower screens may push content below the fold. The accordion pattern mitigates this.
- **Slow network:** Expanded row shows data loading. Skeleton should be compact (3 lines, not full page).
- **Collapsed → expanded transition** may cause the standings table to grow below viewport. The page should scroll smoothly with `scroll-margin`.

## Verification

```bash
# Type check
pnpm exec tsc --noEmit

# Build
pnpm build
```

### Done When

- [ ] Clicking a standings row expands inline with last 5 games
- [ ] Top 3 team scorers shown in expanded section
- [ ] Mini point-differential chart renders
- [ ] Skeleton loading state shown while data loads
- [ ] Clicking another row collapses the first (accordion mode)
- [ ] Smooth height animation on expand/collapse
- [ ] TypeScript compilation passes

---

_Last updated: 2026-07-21 | Status: ⬜_
