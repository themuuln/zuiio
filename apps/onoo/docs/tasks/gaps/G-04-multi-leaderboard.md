---
**ID:** `G-04`
**Name:** Multi-Category Leaderboard Strip
**Priority:** `P0`
**Status:** `⬜`
**Effort:** `S` (2-4h)
**Tags:** `frontend`, `layout`, `landing-page`, `leaders`
**DB Readiness:** `✅` Fully supported by current schema

---

## Goal

Show leaders across 3-5 stat categories (PTS, REB, AST, STL, BLK), not just scoring. Each category shows top 3 with player avatar, name, team, and stat value. "View All" link per category. Rendered as horizontal scrollable strips below the current podium section on the landing page and expanded on the Leaders page.

## Why

Every competitor (NBA, FIBA, MaxPreps) shows multi-category leaderboards — not just the scoring leader. Basketball fans care about different stats: "who leads in steals?" matters as much as "who leads in scoring." The current landing page highlights only PTS. Adding strips for REB, AST, STL, BLK immediately communicates depth and invites exploration.

## Technical Approach

### Layout Structure

```
┌─────────────────────────────────────────────────┐
│ 🏀 Scoring Leaders          View All →         │
│ ┌──────┐ ┌──────┐ ┌──────┐                     │
│ │Player│ │Player│ │Player│  ← horizontal scroll │
│ │Avatar│ │Avatar│ │Avatar│                     │
│ │Name  │ │Name  │ │Name  │                     │
│ │TEAM  │ │TEAM  │ │TEAM  │                     │
│ │ 24.1 │ │ 22.0 │ │ 19.7 │                     │
│ └──────┘ └──────┘ └──────┘                     │
├─────────────────────────────────────────────────┤
│ 🏀 Rebounds Leaders          View All →        │
│ ...similar strip...                             │
├─────────────────────────────────────────────────┤
│ 🏀 Assists Leaders           View All →        │
│ ...similar strip...                             │
└─────────────────────────────────────────────────┘
```

### Component Architecture

- **`LeaderCategoryStrip`** — renders one category strip:
  - Props: `title: string`, `statKey: string`, `players: LeaderPlayer[]`, `color: string`
  - Horizontally scrollable (`overflow-x: auto`, `scroll-snap-type: x mandatory`)
  - 3 player cards per strip with `PlayerAvatar`, name, team abbreviation, stat value
  - "View All →" link in header → `/leaders?stat=${statKey}`
  - CSS `scrollbar-width: none` on desktop, visible on mobile

- **Player Card (compact):**
  - Avatar circle (36px), name (14px, truncate), team (12px, muted), stat value (bold, 16px)
  - Aspect ratio preserved, min-width `140px`
  - Click navigates to `/players/[id]`

- **`MultiLeaderboardSection`** — renders all strips:
  - Data: `{[key: string]: LeaderPlayer[]}` — grouped by stat category
  - Ordered: PTS, REB, AST, STL, BLK (configurable)
  - Each strip spaced with `gap: 24px` vertical

### Data Flow

- Landing page data fetcher already calls `getLeaders()` → returns `v_public_leaders` rows
- Group by stat category client-side (simple `groupBy` on the `stat_key` field)
- Each category has its own top-3 slice

## Data Dependencies

| Entity | Access | Purpose |
|--------|--------|---------|
| `v_public_leaders` | Read | Per-player season aggregates with team/league context |

No database changes needed.

## Implementation Steps

1. **Create `LeaderCategoryStrip` component:**
   - Horizontal scrolling container with snap points
   - 3 player cards with avatar, name, team, stat value
   - Category header with icon + "View All" link

2. **Create `MultiLeaderboardSection` container:**
   - Accepts grouped leader data
   - Renders strips in order: PTS, REB, AST, STL, BLK
   - Responsive: 3 columns on desktop, scrollable on mobile

3. **Integrate into landing page:**
   - Place below the existing podium/top-3 section
   - Use existing data fetcher + group by stat key
   - Pass to `<MultiLeaderboardSection>`

4. **Integrate into `/leaders` page:**
   - Expand the concept — show 5 strips (not just active tab)
   - Each strip is a preview of that tab's content

5. **Test:**
   - Verify scroll works on mobile (touch drag)
   - Verify snap points align to card boundaries
   - Verify "View All" links filter to correct category

## Implementation Complexity & Effort

**Complexity:** Low. ~150 lines. Reuses existing `PlayerAvatar` and leader data.

**Effort:** S (2-4 hours)
- Components: 1.5h
- Integration: 1h
- Responsive polish: 30min

## Dependencies / Prereqs

**Blocked by:** None
**Prereqs:** Landing page exists with leader data. `PlayerAvatar` component exists. Leader data grouped by stat category is straightforward from `v_public_leaders`.

## Design Decisions

- **Horizontal scroll with snap, not carousel with arrows.** Native scroll behavior is more reliable, accessible, and doesn't need JS for scrolling logic.
- **Show 3 players per category, not 5.** 3 fits in a single mobile viewport without scrolling. "View All" is the path to the full list.
- **Stat categories in a fixed order**, not alphabetically. PTS first (most popular), then descending by general recognition.
- **Reuses existing `PlayerAvatar`** — visual consistency with the rest of the app.

## Risks & Gotchas

- **Data may not have enough qualified players** for all categories. Show "No data" empty state if fewer than 3.
- **Hover on touch devices** — player cards should be tappable, not require hover. Ensure click target is large enough.
- **Scroll-container with `overflow-x: auto` on desktop** should show scrollbar on hover only, to avoid double scrollbars on the page.
- **Performance with many categories:** Each strip is a network-independent render. Fine since data is already in memory.

## Verification

```bash
# Type check
pnpm exec tsc --noEmit

# Build
pnpm build
```

### Done When

- [ ] 5 leader category strips (PTS, REB, AST, STL, BLK) render on landing page
- [ ] Each strip shows top 3 players with avatar, name, team, stat value
- [ ] Horizontal scroll works on mobile with snap points
- [ ] "View All →" links navigate to `/leaders?stat=<key>`
- [ ] Empty categories show "No data" or are hidden
- [ ] TypeScript compilation passes

---

_Last updated: 2026-07-21 | Status: ⬜_
