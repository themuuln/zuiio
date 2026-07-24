# Games Pages Critique + Fix Plan

## Context
Impeccable critique of both games pages and all their components. Two routes (`/games` and `/games/[id]`) plus 4 components (date-nav, live-game-center, game-card, game-status-badge). Fix all P0-P2 issues.

## Issues Found

### P0 — Critical
1. **No `error.tsx`** for either route — data fetch crashes with no recovery
2. **`live-game-center.tsx:184`** — `player.playerId.slice(0, 8)` displays truncated UUID instead of player name

### P1 — Major
3. **No `loading.tsx`** for either route — no loading UX during server-side data fetch
4. **`live-game-center.tsx` hardcoded gray colors** — `bg-gray-900`, `text-gray-400`, `text-gray-500`, `hover:text-gray-700`, `bg-gray-50` bypass design tokens (AI slop)
5. **`live-game-center.tsx` custom tabs lack ARIA** — No `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected` — keyboard navigation broken
6. **`live-game-center.tsx` mixed EN/MN labels** — "HOME"/"AWAY" alongside Mongolian
7. **`live-game-center.tsx` raw `<table>` without shadcn `<Table>`** — bypasses design system

### P2 — Moderate
8. **`live-game-center.tsx` inline template literals** — Not using `cn()` for className
9. **`live-game-center.tsx` `<th>` missing `scope="col"`**
10. **`TeamComparison` SVG bars** — aria-hidden with no sr-only data fallback

## Files to Change
| File | Action | What changes |
|------|--------|-------------|
| `src/app/games/error.tsx` | Create | Client error boundary for /games |
| `src/app/games/[id]/error.tsx` | Create | Client error boundary for /games/[id] |
| `src/app/games/loading.tsx` | Create | Skeleton loading state for /games |
| `src/app/games/[id]/loading.tsx` | Create | Skeleton loading state for /games/[id] |
| `src/app/games/[id]/components/live-game-center.tsx` | Modify | Fix P0 UUID, P1 colors/tabs/table/labels, P2 a11y |

## NOT in scope (Karpathy anti-pattern guard)
- game-card.tsx — lives outside games dir, already has good a11y
- game-status-badge.tsx — display primitive, already clean
- public-empty-state.tsx — shared component, no games-specific issues
- date-nav.tsx — already clean, proper aria-label, keyboard accessible

## Verification
1. TypeScript compilation check
2. Visually verify via dev server that pages render
