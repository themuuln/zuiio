---
**ID:** `G-02`
**Name:** Skill Radar League Overlay
**Priority:** `P0`
**Status:** `⬜`
**Effort:** `S` (2-4h)
**Tags:** `frontend`, `chart`, `animation`, `player-profile`
**DB Readiness:** `✅` Fully supported by current schema

---

## Goal

Add a semi-transparent ghost polygon behind the existing player skill radar chart representing league averages. A toggle lets users show/hide the overlay. The two overlapping shapes immediately reveal strengths (player spikes above league) and weaknesses (player dips below).

## Why

The existing radar chart is the centerpiece of the player profile — but it only shows the player's shape. Without league context, "22.4 PPG" is just a number. The overlay turns the chart into an instant diagnostic: you can see in one glance whether a player is above or below average in any category. This converts the radar from decoration to analysis tool.

## Technical Approach

### Overlay Polygon

- Add a second `<Radar>` component inside the existing `<RadarChart>` from recharts
- Data source: `leagueAverages` array (already passed to `SkillRadar` as a prop), normalized to the same 0-100 scale using `leagueMaxes`
- Fill: transparent with `opacity: 0.15`, stroke: dashed light gray with `opacity: 0.4`
- The league polygon is **not interactive** (no tooltip on hover) — it's a background reference

### Toggle Mechanism

- Small toggle button/switch positioned near the chart legend
- Label: "vs League" or a Venn-diagram icon
- Toggle state in `useState`: `showLeagueAverage`
- CSS `transition: opacity 300ms ease` on the overlay polygon for smooth fade
- Default state: overlay **visible** (P0 feature should be on by default — users discover the insight immediately)

### Component Changes

- File: `packages/ui/skill-radar.tsx` (or equivalent)
- Props added: `leagueAverages: number[]`, `leagueMaxes: number[]`
- If `leagueAverages` is null/undefined, the overlay is hidden (graceful fallback)

### Radar Structure

```
<RadarChart>
  <Radar dataKey="playerValue" ... />           {/* existing — player shape */}
  <Radar dataKey="leagueAvg"                     {/* new — league ghost */}
    fill="var(--muted-foreground)"
    fillOpacity={0.15}
    stroke="var(--muted-foreground)"
    strokeOpacity={0.4}
    strokeDasharray="4 4"
    isAnimationActive={false}                    {/* no entrance animation for overlay */}
  />
  {/* existing Tooltip, PolarGrid, etc. */}
</RadarChart>
```

### Tooltip Enhancement

- On hover, the tooltip shows both player and league values side by side:
  - "PPG: 22.4 | League: 14.2"
  - Green up-arrow / red down-arrow indicator for above/below league average

## Data Dependencies

| Entity | Access | Purpose |
|--------|--------|---------|
| `playerStats` | Already in component | Player's per-game averages |
| `leagueAverages` | Already in component | League mean per stat |
| `leagueMaxes` | Already in component | League max for normalization |

No database changes needed.

## Implementation Steps

1. **Add overlay data prop to `SkillRadar`:**
   - Add `leagueAverages?: number[]` and `leagueMaxes?: number[]` props
   - If absent, skip overlay rendering

2. **Add second `<Radar>` element:**
   - Maps `leagueAvg` key, uses muted/ghost styling
   - No entrance animation

3. **Add toggle button:**
   - Position: near chart title or legend
   - State: `showLeagueAverage` (default: `true`)
   - CSS transition on `opacity` of the overlay Radar
   - Tooltip label update

4. **Update tooltip:**
   - `CustomTooltip` detects whether `payload` has league data
   - Renders both rows with visual comparison indicator (color + arrow)

5. **Wire up props from player page:**
   - Player page data fetcher already retrieves `leagueAverages` and `leagueMaxes` (used for normalization)
   - Pass through to `SkillRadar`

6. **Verify:**
   - Overlay appears below player shape
   - Toggle hides/shows smoothly
   - Overlay is not interactive (no hover state)

## Implementation Complexity & Effort

**Complexity:** Low. ~50 lines of changes to existing `skill-radar.tsx`. The data is already flowing — just a new rendering layer.

**Effort:** S (2-4 hours)
- Component changes: 1h
- Toggle + tooltip: 1h
- Style polish: 30min

## Dependencies / Prereqs

**Blocked by:** None
**Prereqs:** `SkillRadar` component exists and renders player data. `leagueAverages`/`leagueMaxes` already in the data flow.

## Design Decisions

- **Ghost polygon is non-interactive.** It's a reference, not a data-drill target. Keep it visually subordinate to the player polygon.
- **Default on**, not opt-in. P0 features should surprise users with value on first visit.
- **recharts Radar reuses the same PolarGrid/PolarAngleAxis** — the overlay automatically inherits the correct axes and grid. No structural changes.
- **Dashed stroke + low opacity fill** distinguishes the overlay from the player's solid, more saturated polygon.

## Risks & Gotchas

- **League data may be null for some players** (e.g., small sample size). The prop contract accepts optional data and renders nothing if absent.
- **Radar normalization must match.** Both player and league values are normalized to `(value / max) * 100`. Verify the normalization function is identical for both datasets.
- **Tooltip already renders player-only content.** Must extend, not replace.

## Verification

```bash
# Type check
pnpm exec tsc --noEmit

# Build
pnpm build
```

### Done When

- [ ] League average ghost polygon renders behind player shape
- [ ] Toggle shows/hides overlay with smooth CSS transition
- [ ] Tooltip shows both player and league values with comparison indicator
- [ ] No data = no overlay (graceful fallback)
- [ ] TypeScript compilation passes
- [ ] Player page test renders with overlay visible by default

---

_Last updated: 2026-07-21 | Status: ⬜_
