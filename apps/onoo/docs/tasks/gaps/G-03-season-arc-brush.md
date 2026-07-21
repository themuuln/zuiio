---
**ID:** `G-03`
**Name:** Season Arc Brush Selection
**Priority:** `P0`
**Status:** `⬜`
**Effort:** `S` (2-4h)
**Tags:** `frontend`, `chart`, `interaction`, `player-profile`
**DB Readiness:** `✅` Fully supported by current schema

---

## Goal

Add a brush control on the x-axis of the existing season arc area chart that lets users drag to select a date range. Selecting 5 games recalculates and displays averages for just those games. Tapping a data point highlights the corresponding row in the Recent Games table below.

## Why

The season arc chart shows the full season narrative, but fans want to analyze stretches — "how did he play in February?", "what were his averages during the championship series?" The brush turns the chart from passive viewing into a selection tool that drives the entire page. Cross-highlighting with the games table creates the "detail on demand" pattern that makes stats feel alive.

## Technical Approach

### Brush Control

- Add recharts `<Brush>` component below the x-axis of the existing `<AreaChart>`
- `<Brush>` renders a miniaturized version of the chart as a range selector
- Props:
  - `dataKey="game_date"` — time-based x-axis
  - `height={40}` — compact enough to not dominate the chart area
  - `stroke="var(--primary)"` — tint matches brand
  - `onChange` handler fires with the `startIndex` and `endIndex` of the selection

### State Propagation

```ts
const [brushRange, setBrushRange] = useState<[number, number] | null>(null);
// null = no selection = show all games
```

- On brush change: filter the `data` array to the selected range
- Compute summary stats (avg PPG, avg RPG, avg APG) from the filtered range
- Display summary as small stat badges above the chart: "Selected (12 games): 24.1 PPG | 8.3 RPG | 5.1 APG"

### Cross-Highlighting

- On `onMouseEnter` or `onClick` on an `<Area>` data point:
  - Set `selectedGameId` state to the `game_id` of that data point
  - Pass `selectedGameId` down to `<RecentGames>` component
  - `<RecentGames>` highlights the matching row (background color, subtle pulse animation)
- On brush change: clear `selectedGameId` (selection is superseded by range)

### Component Changes

- File: `packages/ui/season-arc.tsx`
- Add `<Brush>` inside the existing `<AreaChart>`
- Add `onChange` → filters data array → recalculates summary stats
- Add `onMouseEnter` on `<Area>` data points → `onPointHover(game_id)`
- Add callback prop: `onGameSelect: (gameId: string | null) => void`
- Export filtered range stats as a new sub-component `<SelectedRangeStats>`
- File: `pages/players/[id]/page.tsx` or parent
- Wire `onGameSelect` → state → pass to `<RecentGames>`

## Data Dependencies

| Entity | Access | Purpose |
|--------|--------|---------|
| `GameDataPoint[]` | Already in component | Array with `game_id`, `game_date`, `pts`, `reb`, `ast`, `result`, `opponent` |

No database changes needed.

## Implementation Steps

1. **Add `<Brush>` to existing `<AreaChart>`:**
   - Place after the last `<Tooltip />` component
   - Set `dataKey="game_date"`, `height={40}`
   - Style with theme tokens (stroke, fill)

2. **Add brush state and summary component:**
   - `useState` for `brushRange`
   - Compute filtered stats on range change
   - Render `<SelectedRangeStats>` above the chart

3. **Add point hover handler:**
   - `onMouseEnter` on `<Area>` → call `onGameSelect(game_id)`
   - Store in parent component state

4. **Wire cross-highlighting to parent page:**
   - Parent holds `selectedGameId` state
   - Pass to both `<SeasonArc>` and `<RecentGames>`
   - `RecentGames` applies background highlight to matching row

5. **Handle edge cases:**
   - Empty brush range (return to full dataset)
   - Single data point selection
   - Mobile: brush interaction needs touch support (recharts handles this)

6. **Test:**
   - Verify brush range filtering recalculates averages correctly
   - Verify cross-highlight shows in Recent Games
   - Verify clearing brush restores full view

## Implementation Complexity & Effort

**Complexity:** Low. ~100 lines of changes to existing `season-arc.tsx` + callback wiring to `recent-games.tsx`. recharts `<Brush>` is built-in — zero additional deps.

**Effort:** S (2-4 hours)
- Brush component integration: 1h
- Summary stats logic: 30min
- Cross-highlight wiring: 1h
- Polish + edge cases: 30min

## Dependencies / Prereqs

**Blocked by:** None
**Prereqs:** `SeasonArc` component exists with recharts `<AreaChart>`. `RecentGames` component exists and accepts a `highlightedGameId` prop.

## Design Decisions

- **Use recharts built-in `<Brush>`, not a custom slider.** Zero additional dependency, consistent with existing chart stack.
- **Cross-highlight is one-way (chart → table), not bidirectional.** Keeping the coupling simple. Bidirectional (clicking a table row highlights the chart point) can be a later enhancement.
- **Summary stats show above the chart, not inside it.** Keeps the chart clean and the filter effect visually obvious.
- **Clearing brush selection reverts to full-season view.** No permanent filter state.

## Risks & Gotchas

- **recharts `<Brush>` may have layout quirks** with vertical area charts. Test with different data densities (10 games vs 40 games).
- **Cross-highlight must survive data refetches.** Use `game_id` (stable key), not index.
- **Mobile: brush drag on small screens** can be fiddly. recharts Brush has basic touch support; verify on 360px viewport.
- **Performance with large datasets:** If a player has 80+ games, the Brush's mini-chart rendering may lag. Consider virtualization or skip rendering Brush when `data.length > 100`.

## Verification

```bash
# Type check
pnpm exec tsc --noEmit

# Build
pnpm build
```

### Done When

- [ ] `<Brush>` renders below the area chart x-axis
- [ ] Dragging brush range filters data and recalculates summary stats
- [ ] Summary stat badges show above chart (avg PPG, RPG, APG for selected range)
- [ ] Hovering/clicking a data point highlights the matching row in Recent Games
- [ ] Clearing brush restores full season view
- [ ] TypeScript compilation passes

---

_Last updated: 2026-07-21 | Status: ⬜_
