---
**ID:** `G-06`
**Name:** Card Flip Stats
**Priority:** `P1`
**Status:** `⬜`
**Effort:** `S` (2-4h)
**Tags:** `frontend`, `animation`, `interaction`, `player-profile`
**DB Readiness:** `✅` Fully supported by current schema

---

## Goal

Each stat card on the player hero (PPG, RPG, APG, etc.) flips on click to show a secondary stat on the back — "per 36 minutes", "league rank", or "career high". The flip uses a 3D CSS transform with a satisfying rotation.

## Why

Stat cards show one number, but each number has multiple meaningful interpretations. The card flip pattern uses the physical metaphor of turning a card over to reveal more context, keeping the UI compact while doubling the information density. It invites interaction — users will tap every card to see what's on the back.

## Technical Approach

### Flip Mechanics

- Pure CSS 3D transform using `perspective` + `rotateY`
- Each card is a container with `perspective: 1000px`
- Inner container has `transform-style: preserve-3d`
- Front face: `backface-visibility: hidden`
- Back face: `backface-visibility: hidden`, `transform: rotateY(180deg)`
- On click: the inner container gets class `flipped` → `transform: rotateY(180deg)`
- Transition: `600ms ease-in-out`

### Component Structure

```
<StatCard>
  └─ .card-container (perspective)
      └─ .card-inner (transform-style: preserve-3d, transition: rotateY)
          ├─ .card-front (backface-visibility: hidden)
          │   └─ Stat label (e.g., "PPG")
          │   └─ Stat value (e.g., "22.4")
          │   └─ Flip icon (↻, subtle)
          └─ .card-back (backface-visibility: hidden, rotateY(180deg))
              └─ Secondary label (e.g., "Per 36 min")
              └─ Secondary value (e.g., "25.1")
```

### Secondary Stat Computations

| Primary | Secondary | Computation |
|---------|-----------|-------------|
| PPG | Per 36 min | `(pts / min) * 36` |
| RPG | League rank | `rank_in_league('reb')` from `v_public_leaders` |
| APG | Career high | `getPlayerCareerTotals.max_assists` |
| SPG | Per 36 min | `(stl / min) * 36` |
| BPG | League rank | `rank_in_league('blk')` from `v_public_leaders` |
| FG% | Season high | Max FGM in any single game from `game_player_stats` |
| 3P% | Per game avg | Already shown; flip to career `3pm_per_game` average |

### Data Flow

- Player page data fetcher already has `pointsPerGame`, `minutesPerGame`, `gamesPlayed`, `game_player_stats`
- League ranks: computed from `v_public_leaders` (sorted, indexed by player_id)
- Career totals: `getPlayerCareerTotals` already exists
- Pass a `secondaryStats` object alongside `primaryStats` to the `<StatCard>` component

### Interaction Affordance

- Small flip icon (`↻` or similar) in corner of front face signals interactivity
- On hover (desktop): subtle 5deg tilt to indicate tap target
- On tap/click: full 180deg flip

## Data Dependencies

| Entity | Access | Purpose |
|--------|--------|---------|
| `PlayerProfileRow` | Already loaded | `pointsPerGame`, `minutesPerGame`, `gamesPlayed` |
| `v_public_leaders` | Already loaded | League rank per stat category |
| `game_player_stats` | Read | Career highs (career max FGM, etc.) |
| `getPlayerCareerTotals` | Already exists | Career averages and totals |

No database changes needed.

## Implementation Steps

1. **Create `FlipStatCard` component:**
   - 3D CSS structure with front/back faces
   - Props: `frontLabel`, `frontValue`, `backLabel`, `backValue`
   - Click handler toggles `.flipped` class
   - Accessible: `role="button"`, `tabIndex={0}`, `aria-label`

2. **Compute secondary stats:**
   - Add `secondaryStats` to the player page data model
   - League rank computation from sorted leader data
   - "Per 36" computation: `(primaryStat / mpg) * 36`
   - Career high lookup from `getPlayerCareerTotals`

3. **Replace existing stat cards:**
   - Find the hero section stat card component
   - Swap `<StatCard>` for `<FlipStatCard>` with dual data props

4. **Style the flip:**
   - Shadow on both faces
   - Card thickness feel via padding + border
   - Back face background slightly different (muted variant)

5. **Test:**
   - Click flips card with smooth 600ms animation
   - Both sides render correctly
   - Works on touch devices

## Implementation Complexity & Effort

**Complexity:** Low. ~120 lines for the flip component + rank computation. The CSS is the bulk.

**Effort:** S (2-4 hours)
- Component + CSS: 1.5h
- Secondary stat computation: 1h
- Integration into hero section: 30min

## Dependencies / Prereqs

**Blocked by:** None
**Prereqs:** Player hero section exists with stat cards. League rank data computable from `v_public_leaders`.

## Design Decisions

- **Pure CSS 3D transform, no JS animation library.** `rotateY` + `backface-visibility` is well-supported across all modern browsers.
- **600ms transition** gives the flip a deliberate feel — not too fast (jaring) and not too slow (tedious).
- **Flip on click, not hover.** Hover-only would exclude mobile. Click works universally.
- **Back face has a different background** to reinforce the mental model of "this is the other side of the card."

## Risks & Gotchas

- **`rotateY` in Safari** can render glitchy on nested `backface-visibility` elements. Test explicitly in Safari (desktop + mobile).
- **`preserve-3d` on transformed children** can clip if `overflow: hidden` is set on the card container. Ensure overflow is visible on the inner container.
- **Accessibility:** Users who navigate by keyboard need focus styles on the card. Use `<button>` or `tabIndex=0` + `role="button"`.
- **Rapid clicking** should not break the flip state. The class toggle is idempotent.
- **Reduced motion:** Respect `prefers-reduced-motion` — skip the flip animation, just swap content instantly.

## Verification

```bash
# Type check
pnpm exec tsc --noEmit

# Build
pnpm build
```

### Done When

- [ ] Stat card flips on click with 3D CSS animation
- [ ] Front shows primary stat (e.g., "22.4 PPG")
- [ ] Back shows secondary stat (e.g., "25.1 per 36" or "#2 in league")
- [ ] Flip icon visible on front face
- [ ] Works on mobile (touch) and desktop (click)
- [ ] `prefers-reduced-motion` swaps content instantly
- [ ] TypeScript compilation passes

---

_Last updated: 2026-07-21 | Status: ⬜_
