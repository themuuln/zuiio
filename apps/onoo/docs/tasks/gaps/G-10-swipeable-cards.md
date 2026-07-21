---
**ID:** `G-10`
**Name:** Swipeable Game Cards
**Priority:** `P2`
**Status:** `⬜`
**Effort:** `S` (2-4h)
**Tags:** `frontend`, `touch`, `mobile`, `games`, `interaction`
**DB Readiness:** `✅` Fully supported by current schema

---

## Goal

On mobile, each game card is swipeable left to reveal quick actions (view box score, view play-by-play, share). On desktop, hover reveals the same actions as a slide-in panel.

## Why

Game cards show scores and metadata, but taking action (viewing box score, play-by-play) requires tapping through to the game detail page. Swipe-to-reveal-actions is a mobile-native pattern (Mail, Messages) that surfaces secondary actions without navigating away. It makes the games list feel interactive and responsive.

## Technical Approach

### Touch Swipe Mechanics

- CSS `overflow: hidden` on the card container (masks the action panel)
- Inner content shifts with `transform: translateX()` — performant, GPU-accelerated
- Touch event handlers:
  - `touchstart`: Record `startX`, reset animation
  - `touchmove`: Calculate `deltaX = currentX - startX`. Apply `transform: translateX(deltaX)` if delta is negative (swipe left)
  - `touchend`: If `deltaX < -40px` (threshold), snap to show actions panel (translateX = -120px). If less, snap back to 0.
- CSS `transition: transform 250ms ease-out` for the snap behavior

### Action Panel

- Width: 120px (3 action buttons at 40px each, with 8px gaps)
- Actions:
  1. 📊 Box Score → `/games/[id]`
  2. 📋 Play-by-Play → `/games/[id]?tab=pbp`
  3. 📤 Share → `navigator.share({ url, title })`
- Background: light gray or muted brand color
- Buttons stacked vertically with icons only (compact)

### Desktop: Hover Reveal

- On desktop (no touch support detected or `@media (hover: hover)`):
  - On `:hover`, the card translates left by 120px revealing the action panel
  - CSS transition: `translateX(-120px)` on the card content
  - The action panel is always in the DOM, just hidden by `overflow: hidden`
  - Works alongside the touch behavior (touch takes priority)

### Component Structure

```
<GameCardSwipeable>
  └─ <div.card-container>                    {/* overflow: hidden, position: relative */}
      ├─ <div.card-content>                  {/* transform: translateX() */}
      │   └─ <GameCard />                    {/* existing card component */}
      └─ <div.action-panel>                  {/* position: absolute, right: 0, top: 0, height: 100% */}
          ├─ <ActionButton icon="chart_bar"  label="Box Score" onClick={...} />
          ├─ <ActionButton icon="list"       label="Play-by-Play" onClick={...} />
          └─ <ActionButton icon="share"      label="Share" onClick={...} />
```

## Data Dependencies

| Entity | Access | Purpose |
|--------|--------|---------|
| `v_public_games` | Already loaded | Game `id`, `status`, team metadata |

No database changes needed.

## Implementation Steps

1. **Create `GameCardSwipeable` component:**
   - Wraps existing `GameCard`
   - Touch event handlers for swipe detection
   - CSS `overflow: hidden` container with transitioning content

2. **Create action buttons:**
   - Box Score link
   - Play-by-Play link
   - Share button (uses `navigator.share` API with fallback to clipboard copy)

3. **Implement snap logic:**
   - Track `isSnapped` state (bool: is action panel visible?)
   - On swipe past threshold → snap open
   - Tap on card while snapped → snap closed
   - Or: swipe right when snapped → snap closed

4. **Add desktop hover:**
   - `@media (hover: hover)` CSS rule: card content translates left on hover
   - No JS hover tracking needed — pure CSS

5. **Replace existing game cards:**
   - In the games listing page, swap `<GameCard>` for `<GameCardSwipeable>`
   - Verify existing cards still render identically when not swiped/hovered

6. **Test:**
   - Touch swipe on mobile → actions reveal
   - Tap action → navigates correctly
   - Swipe back → card returns
   - Desktop hover → actions reveal
   - Insufficient swipe → snaps back

## Implementation Complexity & Effort

**Complexity:** Low. ~100 lines for swipe logic + action buttons.

**Effort:** S (2-4 hours)
- Touch event logic: 1-2h
- Action buttons + wiring: 30min
- Desktop hover + styling: 30min
- Integration: 30min

## Dependencies / Prereqs

**Blocked by:** None
**Prereqs:** `GameCard` component exists and renders in the games listing page.

## Design Decisions

- **Native touch events, not a library.** The pattern is simple (translateX on delta), and adding a touch-swipe library is overkill. CSS transitions handle the snap.
- **3 action buttons, not more.** 3 fits in 120px at a respectable 40px tap target. More would require scrolling the action panel or making buttons tiny.
- **Desktop via CSS `:hover`, not media query on pointer.** The `(hover: hover)` media query distinguishes touch-only devices where hover doesn't exist.
- **`navigator.share` for sharing** — the Web Share API is supported on modern mobile browsers. Fallback: copy URL to clipboard.

## Risks & Gotchas

- **Touch event conflicts with horizontal page scroll.** On the games list page, a horizontal swipe might be interpreted as page scroll or swipe-to-go-back. Use `touch-action: pan-y` on the card to restrict scroll to vertical only.
- **Rapid swipes** should not break state. The transition is idempotent — snapping open/closed is a simple state toggle.
- **Accessibility:** Swipe is not accessible by keyboard. Provide a small "..." button on each card that toggles the action panel (shown on all devices).
- **`navigator.share` may not be available** on desktop browsers or older mobile. Fallback: copy to clipboard with toast confirmation.

## Verification

```bash
# Type check
pnpm exec tsc --noEmit

# Build
pnpm build
```

### Done When

- [ ] Swiping left on a game card reveals 3 action buttons
- [ ] Tapping an action button navigates to correct page or shares
- [ ] Insufficient swipe (< 40px) snaps card back to closed
- [ ] Tap on card while open snaps it closed
- [ ] Desktop hover reveals actions
- [ ] Touch events don't conflict with page scroll (`touch-action: pan-y`)
- [ ] Fallback "..." button provided for keyboard/accessibility
- [ ] TypeScript compilation passes

---

_Last updated: 2026-07-21 | Status: ⬜_
