# Standings Page — Critique & Fix

## Context
Run impeccable critique on `src/app/standings/page.tsx` and fix all P0-P2 issues. The standings page is a server component showing league standings with a top-3 race section and a full table.

## Heuristic Scores (baseline)
| # | Heuristic | Score | Notes |
|---|-----------|-------|-------|
| 1 | Visibility of System Status | 3/4 | No loading state; empty state is good |
| 2 | Match Between System and Real World | 4/4 | Mongolian language, correct sports terms |
| 3 | User Control and Freedom | 4/4 | Competition switcher, team links |
| 4 | Consistency and Standards | 3/4 | Non-standard `data-icon` attribute (AI slop) |
| 5 | Error Prevention | 4/4 | Null coalescing, formatPercent edge case |
| 6 | Recognition Rather Than Recall | 4/4 | Legend explains abbreviations |
| 7 | Flexibility and Efficiency | 3/4 | No keyboard shortcuts (acceptable for content) |
| 8 | Aesthetic and Minimalist Design | 3/4 | No row hover, no semantic point-diff color |
| 9 | Help Users Recover from Errors | 2/4 | No error.tsx boundary |
| 10 | Help and Documentation | 4/4 | Footer legend, metadata |
| | **Total** | **32/40** | |

## Issues Found

### P0 — Accessibility / Critical
| # | Issue | Fix |
|---|-------|-----|
| 1 | No `<TableCaption>` — screen readers can't identify the table | Add `<TableCaption>` with descriptive text |
| 2 | No `error.tsx` — crashes show raw Next.js error page | Create `standings/error.tsx` matching player pattern |
| 3 | No Suspense/loading — full page blocks on slow DB | Create `standings/loading.tsx` with skeleton |

### P1 — Quality
| # | Issue | Fix |
|---|-------|-----|
| 4 | `data-icon="inline-start"` non-standard HTML attr (AI slop) | Remove the attribute |
| 5 | No row hover state — hard to track across wide table | Add `hover:bg-muted/50` to TableRow |
| 6 | Point difference has no semantic color (positive=green, negative=red) | Add conditional color classes |

### P2 — Polish
| # | Issue | Fix |
|---|-------|-----|
| 7 | GB column "—" could use tabular-nums for alignment | Already has tabular-nums ✓ (no fix needed) |
| 8 | Race section top-3 cards lack `aria-label` for the link | Add `aria-label` to Link wrapping each card |

## Files to Change
| File | Action | What changes |
|------|--------|--------------|
| `src/app/standings/page.tsx` | Edit | Table caption, remove data-icon, hover state, point-diff color, card aria-label |
| `src/app/standings/error.tsx` | Create | Error boundary matching `players/[id]/error.tsx` pattern |
| `src/app/standings/loading.tsx` | Create | Skeleton loading state matching `app/loading.tsx` pattern |

## Implementation Order
1. Create `error.tsx` (no dependencies)
2. Create `loading.tsx` (no dependencies)
3. Edit `page.tsx` — all P0-P2 fixes in one pass

## Edge Cases
- Empty standings → already handled with `PublicEmptyState` ✓
- Null values (gb, streak, last10) → already use `?? "—"` ✓
- Zero competitions → empty array, shows empty state ✓

## Verification
1. `npx next build` — zero errors in standings route
2. `npx tsc --noEmit` — type-check passes
3. Manual: page renders correctly, table scrolls on mobile, error boundary works
