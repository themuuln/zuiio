# Review Findings — Fix Plan

## Context
6 findings from the code review of uncommitted changes across 5 modules in the tolom app. Fixing all in a single pass since they're independent and touch disjoint files.

## Files to Change

| # | File | Action | What changes |
|---|------|--------|-------------|
| 1 | `src/hooks/use-navigation.ts` | Modify | Move Services nav item out of Inventory group to an ungated group |
| 2 | `src/app/[locale]/dashboard/organization/page.tsx` | Modify | Restore URL validation on logoUrl zod schema |
| 3 | `src/app/[locale]/dashboard/organization/_organization-workspace.tsx` | Modify | Reset `imageFailed` state when `logo_url` changes |
| 4 | `src/components/bay-view-v2/bay-card.tsx` | Modify | Remove urgency animation from BayCardDragPreview |
| 5 | `src/components/bay-view-v2/_drawer-header.tsx` | Modify | Gate customer picker button behind `!!wo` |
| 6 | `src/components/bay-view-v2/_drawer-skeleton-layout.tsx` + `work-order-detail-drawer.tsx` | Modify | Add `isFullScreen` prop to skeleton layout |

## Implementation Order
All independent — can be done in any order. Recommended:
1. `_organization-workspace.tsx` — imageFailed reset (simple effect)
2. `page.tsx` — URL validation (schema change)
3. `use-navigation.ts` — move Services item
4. `bay-card.tsx` — remove urgency from drag preview
5. `_drawer-header.tsx` — gate customer picker
6. `_drawer-skeleton-layout.tsx` + `work-order-detail-drawer.tsx` — full-screen skeleton

## Edge Cases
- **Services move**: Must remain accessible with `services.read` permission. Group must not be feature-gated.
- **URL validation**: Empty string should convert to `null` before PATCH (already done in `handleSave`).
- **imageFailed**: Reset must happen on change, not on every render — use useEffect dependency on `organization.logo_url`.
- **Customer picker gate**: Must still show skeleton while loading, hide button when null without data.
- **Skeleton full-screen**: Default `isFullScreen` to `false` to avoid breaking existing call sites.

## Verification
1. `pnpm validate` — typecheck + lint pass
2. `pnpm test` — existing tests pass
3. Targeted checks for each fix (#1 nav logic, #2 schema validation, etc.)
