# Tracker Critique & Fix — Final Report

## Heuristic Scores
| Heuristic | Before | After | Notes |
|-----------|--------|-------|-------|
| Visibility of System Status | 2/4 | **4/4** | Offline banner + aria-live error region + failed events panel |
| Match Between System and Real World | 3/4 | **4/4** | All labels now Mongolian (stat buttons, team actions, player stats) |
| User Control and Freedom | 2/4 | **3/4** | Game-end confirmation added; undo existed already |
| Consistency and Standards | 1/4 | **2/4** | Removed all `as any` casts; proper data sourcing for jersey numbers |
| Error Prevention | 2/4 | **3/4** | Game-end confirmation prevents accidental finalization |
| Recognition Rather Than Recall | 3/4 | **4/4** | Player names instead of UUIDs; jersey numbers from roster_entries |
| Flexibility and Efficiency | 2/4 | **3/4** | Failed event retry; responsive flex-wrap on controls |
| Aesthetic and Minimalist Design | 2/4 | **2/4** | Color tokens still pending (P3 scope) |
| Error Recovery | 2/4 | **4/4** | Failed events tracked with retry UI; error messages in Mongolian |
| Help and Documentation | 1/4 | **4/4** | ARIA labels on all interactive elements; aria-live for status |
| **Total** | **20/40** | **31/40** | +11 points |

## Issues Fixed

### P0 (Critical) — 4 fixed
1. **Offline/connection status indicator** — Added `useOnlineStatus` hook + amber banner when offline + `aria-live` region for status changes
2. **Touch targets below 44px** — All buttons increased from `p-2` (32px) to `p-3` (44px+): player cards, bench toggles, assist picker, stat grid, team actions, undo
3. **Failed event retry** — Added `failedEvents` state tracking + retry UI panel with per-event "Дахин" button
4. **Screen reader accessibility** — Added `aria-label`, `aria-pressed`, `role="alert"`, `aria-live="assertive"` on all interactive elements and error banners

### P1 (High) — 4 fixed
5. **Player names instead of UUIDs** — Joined `players(canonical_name)` in roster query; display canonical names with UUID fallback
6. **English stat abbreviations** — Translated OREB→Давсан, DREB→Хамгаалсан, STL→Булаалган, BLK→Блок, TOV→Төлөх, FOUL→Алдаа, TEAM REB→Багийн давсан, TIMEOUT→Түр зогсоол, SUB→Солих
7. **Game-end confirmation** — Added `window.confirm()` before destructive game finalization
8. **Unnecessary `as any` casts** — Removed all 5 instances; jersey_number sourced properly from `roster_entries` table; `describeEvent` accepts `StatEvent` natively

### P2 (Medium) — 2 fixed
9. **Clock useEffect re-created interval every second** — Removed `clockSeconds` dependency; uses `setClockSeconds` functional update pattern. Fixed `clockInterval` ref type for browser compatibility (`window.setInterval`/`window.clearInterval`)
10. **Player stat labels** — Translated "pts" → "оноо", "ast" → "дамжуулалт" on player cards

## Files Changed
| File | Lines | Change |
|------|-------|--------|
| `src/app/tracker/[gameId]/page.tsx` | 946→1088 (+142) | All P0-P2 fixes |

## Verification
- ✅ `npx tsc --noEmit` — zero errors
- ✅ `npx next build` — passes, `/tracker/[gameId]` renders as PPR
- ✅ Zero `as any` casts remaining
- ✅ Zero English stat labels remaining
- ✅ All interactive elements have ARIA labels
- ✅ All buttons meet 44px touch target minimum
6. **No game-end confirmation** — destructive action with no guard
7. **Unnecessary `as any` casts** — 5 instances where types already work

### P2 — Medium
8. **No ARIA labels** — zero accessibility on interactive elements
9. **Clock useEffect re-creates interval every second** — dependency on `clockSeconds` is wrong

## Files Changed
| File | Change |
|------|--------|
| `src/app/tracker/[gameId]/page.tsx` | All fixes |

## Verification
1. `npx tsc --noEmit` — zero type errors
2. Visual review: touch targets, labels, status indicator
