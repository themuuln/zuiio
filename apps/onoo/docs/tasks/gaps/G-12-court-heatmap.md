---
**ID:** `G-12`
**Name:** Interactive Court Heatmap
**Priority:** `P2`
**Status:** `⬜`
**Effort:** `M` (1-2d)
**Tags:** `frontend`, `svg`, `visualization`, `player-profile`, `shot-chart`
**DB Readiness:** `⚠️` Partial — shot coordinates (`x, y`) exist in schema but capture is pending

---

## Goal

An SVG basketball half-court divided into zones (paint, mid-range left/right, three-point arc segments). Tap a zone to see FGM/FGA and percentage for that area. Shot attempts are plotted as dots with made/missed color coding. Falls back gracefully when no shot data exists.

## Why

Shot charts are the most informative single visualization in basketball analytics. They answer: "where does this player score from?" at a glance. The court heatmap turns abstract shooting percentages into spatial intelligence — seeing a cluster of makes in the paint vs. scattered misses from deep tells a story no table can.

## Data Dependencies

| Entity | Access | Purpose |
|--------|--------|---------|
| `stat_events.payload.x, y` | Read | Shot location coordinates |
| `stat_events.event_type` | Read | Filter to `shot_made` / `shot_missed` |

**Pre-requisite:** Shot location capture must be added to the tracker before real data flows. The component should be built to gracefully handle an empty state with "No shot data available" message and optionally show demo/synthetic data for development.

## Technical Approach

### Court SVG

The half-court SVG uses standard proportions (94ft × 50ft court, half = 47ft × 50ft, scaled to viewBox):

```
<svg viewBox="0 0 500 470">
  <!-- Court outline -->
  <rect x="0" y="0" width="500" height="470" fill="var(--court-floor)" />
  <rect x="10" y="10" width="480" height="450" fill="none" stroke="var(--court-line)" />

  <!-- Key/paint -->
  <rect x="175" y="0" width="150" height="190" {...} />

  <!-- Free throw circle -->
  <circle cx="250" cy="190" r="60" {...} />

  <!-- Three-point arc -->
  <path d="..." {...} />

  <!-- Half-court line -->
  <line x1="0" y1="470" x2="500" y2="470" {...} />
</svg>
```

Court coordinates from `stat_events.payload` are normalized to the SVG viewBox.

### Clickable Zones

Zones are defined as SVG `<path>` elements with hit detection:

| Zone | Path description |
|------|-----------------|
| Paint (Restricted Area) | Rectangle near basket |
| Paint (Low Post) | Extended rectangle areas |
| Mid-Range Left | Polygonal arc area |
| Mid-Range Right | Polygonal arc area |
| Corner 3 Left | Triangle zone |
| Corner 3 Right | Triangle zone |
| Above Break 3 | Arc-top zone |

Each zone is a `<path>` with:
- `fill`: transparent initially, colored on hover/active
- `stroke`: visible when hovered
- `onClick`: sets `selectedZone` state
- `onMouseEnter`: highlights zone
- `aria-label`: "Paint: 45 FGM, 62 FGA (72.6%)"

### Shot Dots

- Each shot is rendered as a `<circle>` at the `(x, y)` position
- Fill color: `green` (made) or `red` (missed), `opacity: 0.5`
- Size: `r=3` (scaled), larger for more recent games
- On hover (desktop): tooltip with "2nd quarter, vs Team X"

### Zone Stats Computation

```ts
interface ZoneStat {
  zoneId: string;
  label: string;
  fgm: number;
  fga: number;
  pct: number;
}
```

Computations done client-side:
1. Filter stat_events array to `shot_made` and `shot_missed` event types
2. For each shot, determine which zone its `(x, y)` falls in
3. Count FGM and FGA per zone
4. Compute `pct = fgm / fga * 100`

### Empty State

When no shot location data exists:
- Render the court outline (no dots, no zones)
- Center text: "No shot data available"
- Small subtitle: "Shot tracking will be available in a future update"

### Selected Zone/Active State

When user taps/clicks a zone:
- Zone fills with gradient (blue → green for high %, red for low %)
- Side panel or tooltip shows:
  - Zone name
  - FGM / FGA
  - FG%
  - Compare to league average at that zone

## Implementation Steps

1. **Create court SVG component:**
   - Half-court layout with standard zone markings
   - ViewBox that scales to container width
   - Responsive: court fills available width, maintains aspect ratio

2. **Define zone paths:**
   - 7-8 shooting zones with SVG `<path>` definitions
   - Precise path coordinates matching court geometry
   - Zone metadata map: `id`, `label`, `pathData`

3. **Create shot dot rendering:**
   - Filter events to `shot_made`/`shot_missed`
   - Map coordinates to SVG space
   - Render dots with color coding

4. **Compute zone stats:**
   - Point-in-zone detection function
   - Aggregate FGM/FGA per zone
   - Display on click

5. **Add interaction layer:**
   - Zone hover highlighting
   - Zone click → selected zone detail
   - Dot hover → tooltip with game context

6. **Add empty state:**
   - Detect no shot coordinates → render empty court
   - Display informative empty state message

7. **Integrate into player page:**
   - Add as a new section on the player profile
   - Or replace the existing shooting profile section

## Implementation Complexity & Effort

**Complexity:** Medium. ~400 lines for the court component + zone logic. The coordinate-to-zone mapping is the hardest part.

**Effort:** M (1-2 days)
- SVG court drawing: 2-3h
- Zone path definitions: 2h
- Shot dot rendering: 1h
- Zone stats computation: 1h
- Interaction layer: 1-2h
- Integration: 1h

## Dependencies / Prereqs

**Blocked by:** G-00 (Tracker shot location capture) — for real data. The component itself can be built and tested with synthetic data.
**Prereqs:** `stat_events` with `x, y` payload fields (schema exists). Tracker enhancement to capture shot location is a separate work item.

## Design Decisions

- **SVG over Canvas.** SVG handles mouse events per-element naturally (hover, click). Canvas would need manual hit detection. For the number of elements in a shot chart (< 1000 dots), SVG performance is fine.
- **Zone-based, not heatmap-contour.** Zone-based is simpler to implement and more informative (you get exact FGM/FGA per zone). Contour heatmaps look cooler but are harder to build and interpret.
- **Graceful empty state.** Since shot capture isn't implemented in the tracker yet, the heatmap should be shippable without data. It becomes a placeholder that primes users for the feature.
- **Client-side zone computation.** The data set (a player's shots for a season) is small enough to process in the browser. No need for a database aggregation step.

## Risks & Gotchas

- **Coordinate-to-zone mapping** is the most error-prone part. Test with sample shot coordinates to verify every zone boundary is correct.
- **Court SVG path definitions** need to match real basketball court proportions. Verify against FIBA/NCAA court dimensions.
- **No shot data = entire component is empty.** Emphasize the empty state design — it should be informative, not broken-looking.
- **Performance with many shots** (500+ per season). SVG with 500 circles should be fine, but test on lower-end mobile devices.
- **Touch interaction:** Zone tap on mobile should show a popover (not hover) with zone stats.

## Verification

```bash
# Type check
pnpm exec tsc --noEmit

# Build
pnpm build
```

### Done When

- [ ] SVG half-court renders with correct court markings
- [ ] Shot dots render at correct coordinates (green = made, red = missed)
- [ ] Tap/click a zone shows FGM, FGA, FG% for that zone
- [ ] Zone highlights on hover (desktop) or tap (mobile)
- [ ] Empty state shows "No shot data available" when no coordinates exist
- [ ] Falls back gracefully to synthetic/demo data for development
- [ ] Responsive: court fills available width
- [ ] TypeScript compilation passes

---

_Last updated: 2026-07-21 | Status: ⬜_
