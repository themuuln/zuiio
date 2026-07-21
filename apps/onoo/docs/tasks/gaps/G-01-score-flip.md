---
**ID:** `G-01`
**Name:** Score Flip Animation
**Priority:** `P0`
**Status:** `⬜`
**Effort:** `S` (2-4h)
**Tags:** `frontend`, `animation`, `css`, `game-detail`
**DB Readiness:** `✅` Fully supported by current schema

---

## Goal

Add a flip-clock animation to score digits on the game detail page and tracker live scoreboard. Each digit column rotates vertically with a shadow fold when a point is scored, creating anticipation before the new number settles.

## Why

Live score updates are the most visible real-time element. A flip animation transforms a simple number change into a visceral, engaging moment that signals "something happened" — the same psychological hook airport departure boards and sports broadcasts use. Zero data work required; pure frontend delight.

## Technical Approach

### Animation Mechanics

- Pure CSS `@keyframes` using `rotateX` transform on each digit half
- Each score digit is a separate `<FlipDigit>` component with two halves:
  - **Top half:** Flips down (rotates 90deg around its bottom edge) showing the new digit's top
  - **Bottom half:** After the top settles, the bottom half flips down (rotates from -90deg to 0deg around its top edge)
- Shadow fold created with `::before`/`::after` pseudo-elements with gradient backgrounds that simulate the paper-fold crease
- Spring easing (`cubic-bezier(0.34, 1.56, 0.64, 1)` or Tolom's `--animate-bay-assigned` pattern) for the bounce feel at the end

### Trigger Mechanism

- **Live (tracker):** Supabase Realtime subscription on `games` table (already used by tracker). When `home_score` or `away_score` changes, the `FlipDigit` component detects the delta and triggers the animation sequence.
- **Static (server-rendered):** Initial page load shows plain digits with no animation. If a Realtime subscription detects a score change, animation kicks in. No SSR complexity.
- `useMemo` + `useEffect` to diff old vs new score values per digit position.

### Component Design

```
FlipDigit
├── DigitColumn           — one per score column (tens, units)
│   ├── .digit-top        — upper half (position: absolute, overflow: hidden, clip-path for top half)
│   ├── .digit-bottom     — lower half (same, but bottom half clip)
│   ├── .digit-flip-top   — animated element: the *new* top sliding in
│   └── .digit-flip-bottom— animated element: the *new* bottom settling
```

- Digits side by side in a `<ScoreBoard>` component
- Each digit is exactly `0.6em` wide, using monospace font (`font-variant-numeric: tabular-nums`)
- Score reads `HH:AA` (home : away) with a colon separator

### State Machine per Digit

1. **Idle:** Shows current digit, both halves static
2. **Animating (0–300ms):** New digit's top half flips in from above (top half only)
3. **Animating (300–600ms):** New digit's bottom half flips in (bottom half only)
4. **Done:** Both halves show new digit, no class

## Data Dependencies

| Entity | Access | Purpose |
|--------|--------|---------|
| `games.home_score` | Real-time subscription | Watch for score changes |
| `games.away_score` | Real-time subscription | Watch for score changes |
| `v_public_games` | Read | Initial server render of score data |

No database changes needed.

## Implementation Steps

1. **Create `FlipDigit.tsx` component:**
   - Props: `value: string` (the digit char), `prevValue?: string`
   - CSS module with `@keyframes flipTop` and `@keyframes flipBottom`
   - On mount + value change, detect difference and trigger animation

2. **Create `ScoreBoard.tsx` composition:**
   - Renders home score, colon, away score
   - Splits each score string into individual digit components
   - Handles 1→2 digit transitions (e.g., 9→10)

3. **Integrate into game detail page:**
   - Replace the plain score text in the game header with `<ScoreBoard>`
   - Wire the Realtime subscription for live updates

4. **Integrate into tracker:**
   - Replace score display in the tracker live scoreboard
   - Tracker already has Realtime subscription — just connect the prop change

5. **Style the shadow fold:**
   - `::before` on `.digit-flip-top`: linear-gradient from transparent to rgba(0,0,0,0.15)
   - `::after` on `.digit-flip-bottom`: reverse gradient

6. **Test:**
   - Verify 0→1 digit transition
   - Verify 9→10 tens digit appearing
   - Verify rapid successive scores (queue animation, don't skip)

## Implementation Complexity & Effort

**Complexity:** Low. ~200 lines of CSS + a small `FlipDigit` component. The CSS keyframes are the bulk. Logic is straightforward — value diff triggers animation class toggle.

**Effort:** S (2-4 hours)
- Component + CSS: 1-2h
- Integration: 30min
- Animation tuning: 30min-1h

## Dependencies / Prereqs

**Blocked by:** None
**Prereqs:** Game detail page must render score data from `v_public_games`. Tracker must have Realtime subscription on `games` (both already exist).

## Design Decisions

- **Pure CSS animations, no JS animation libraries.** The flip effect is entirely CSS `@keyframes` with springs. Cheaper, lighter, composable.
- **Each digit is a separate component**, not a single animated block. Stops concurrent animations interfering and lets each digit column flip independently when the score changes by more than 1.
- **Monospace font with `tabular-nums`** ensures digits have identical widths, preventing layout shift during animation.
- **Staggered half-animation (top then bottom)** mirrors real mechanical flip clocks. The top half flips first (exposing the new digit's top), then the bottom settles.
- **Reference Tolom's `--animate-bay-assigned`** for the spring easing curve — already vetted in the same repo.

## Risks & Gotchas

- **Rapid score changes (multiple points in succession):** The animation must queue. If a new score arrives while animating, store the pending score and transition again when the current animation completes. Use `useRef` for the animation lock.
- **Tens digit appearing (9→10):** The tens slot goes from `undefined`/hidden to `1`. The component needs to handle digit count changes gracefully.
- **Reduced motion preference:** Respect `prefers-reduced-motion` — fall back to instant digit swap with no animation.
- **Reactivity edge: multiple score changes before initial render.** The subscription handler must track the last rendered score, not the prop from render.

## Verification

```bash
# Type check
pnpm exec tsc --noEmit

# Build
pnpm build

# Manual: Open game detail page, verify static score renders correctly
# Manual: Trigger a score change via tracker, verify flip animation plays
# Manual: Verify rapid score changes animate without overlap
# Manual: Verify prefers-reduced-motion shows instant swap
```

### Done When

- [ ] `FlipDigit` component renders with flip animation on value change
- [ ] `ScoreBoard` composes digit columns for home/away scores
- [ ] Integration on game detail page works with Realtime subscription
- [ ] Rapid successive scores queue without animation overlap
- [ ] `prefers-reduced-motion` skips animation
- [ ] TypeScript compilation passes
- [ ] No layout shift during score update

---

_Last updated: 2026-07-21 | Status: ⬜_
