# Leaders Page — Critique & Fix

## Context
Run an impeccable critique on the Onoo leaders page (`src/app/leaders/`). The page has a solid foundation — good typography hierarchy, proper use of design system components, and clean card-based layout. However, it's missing error/loading boundaries (optimistic path only), has duplicated DOM, unused dead code, and accessibility gaps.

## Heuristic Scores (0–4 each, total /40)

| # | Heuristic | Score | Notes |
|---|-----------|-------|-------|
| 1 | Visibility of System Status | 2 | No loading.tsx, no error.tsx — user sees blank on failure |
| 2 | Match Between System & Real World | 4 | Accurate Mongolian sports terminology |
| 3 | User Control and Freedom | 3 | Tab switching works, but compare only on ranks 4–10 |
| 4 | Consistency and Standards | 3 | Follows card patterns; `shortLabel` dead code; `data-icon` no CSS |
| 5 | Error Prevention | 2 | No error boundary; getLeaders() crash = white screen |
| 6 | Recognition vs Recall | 3 | Photos + logos aid recognition; tabs labeled |
| 7 | Flexibility & Efficiency | 3 | Tab navigation efficient; no shortcut for power users |
| 8 | Aesthetic & Minimalist Design | 3 | Clean cards; qualification card duplicated 5× unnecessarily |
| 9 | Help Recover from Errors | 1 | Zero error recovery — no error.tsx, no try/catch |
| 10 | Help & Documentation | 3 | Header + subtitle + qualification explanation |
| | **TOTAL** | **27/40** | |

## Issues Found

### P0 (Critical)
1. **No `error.tsx`** — if `getLeaders()` throws, root error.tsx catches with generic "Нүүр хуудсын мэдээллийг ачаалахад алдаа гарлаа" (homepage message). No route-specific recovery.
2. **No `loading.tsx`** — `LeaderTabsSkeleton` is exported but never used. Page shows nothing while async data loads.

### P1 (High)
3. **Qualification card duplicated** — "Эрэмбийн шаардлага" card is identical in every TabsContent, rendered 5× per tab switch. Should render once outside Tabs.
4. **Missing `aria-label` on Tabs** — screen readers have no context for what the tab group controls.
5. **Dead code: `shortLabel`** — defined in CategoryConfig, never read anywhere.
6. **Missing `aria-label` on `<ol>`** — the remaining rankings list has no accessible name.

### P2 (Medium)
7. **Medal badge missing space** — `#` immediately follows the icon span with no separator, rendering as `Medal#1` in some contexts.
8. **`data-icon` attributes** — used throughout codebase but no CSS definition exists. Cosmetic, not page-specific; skip (codebase-wide issue).

## Files to Change

| File | Action | What changes |
|------|--------|-------------|
| `src/app/leaders/error.tsx` | **Create** | Route-specific error boundary (follows `players/[id]/error.tsx` pattern) |
| `src/app/leaders/loading.tsx` | **Create** | Loading skeleton using exported `LeaderTabsSkeleton` + header skeleton |
| `src/app/leaders/page.tsx` | **Modify** | No changes needed — server component already clean |
| `src/app/leaders/components/leader-tabs.tsx` | **Modify** | Move qualification card outside Tabs, add aria-labels, remove dead shortLabel, fix Medal badge space |

## Implementation Order

1. Create `error.tsx` (no dependencies)
2. Create `loading.tsx` (depends on existing `LeaderTabsSkeleton`)
3. Fix `leader-tabs.tsx` (4 surgical edits)

## Edge Cases
- `getLeaders()` returns empty → existing empty state handles it ✓
- `getLeaders()` throws → new error.tsx catches ✓
- Tab list overflows on mobile → existing `overflow-x-auto` handles it ✓
- 12-col grid on small screens → column widths flex, content stays readable ✓

## Verification
1. `npx next build` — zero errors
2. Visually confirm: loading skeleton appears, error boundary works, tabs render once with qualification card below
3. `grep -r shortLabel src/app/leaders` — zero hits after fix
