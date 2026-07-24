# Phase 6: Quality Control (Чанарын хяналт)

## Context
Manufacturing module needs quality control to track pass/fail/conditional checks on production orders. Append-only audit trail with photo evidence. Completion validation ensures orders can't be marked done without passing quality checks.

## Files to Change

| File | Action | What changes |
|------|--------|--------------|
| `supabase/migrations/20260717140000_manufacturing_quality.sql` | Create | quality_checks table, RLS, indexes, defect-photos storage bucket |
| `src/app/(dashboard)/quality/quality-actions.ts` | Create | Server actions: list, create, upload photo, summary |
| `src/app/(dashboard)/quality/page.tsx` | Create | PPR page shell with metadata |
| `src/app/(dashboard)/quality/quality-content.tsx` | Create | Client DataTable with filters + create button |
| `src/app/(dashboard)/quality/quality-create-drawer.tsx` | Create | Slide-in drawer form for new quality check |
| `src/app/(dashboard)/quality/loading.tsx` | Create | Skeleton loading state |
| `src/lib/query/keys.ts` | Modify | Add qualityKeys factory |
| `src/lib/revalidate.ts` | Modify | Add production/quality entity paths |
| `src/lib/permissions.ts` | Modify | Add quality_checks permissions |
| `src/app/(dashboard)/production/production-actions.ts` | Modify | Add completion validation in updateProductionOrderStatus |

## Implementation Order
1. Migration (no deps)
2. Permissions + revalidate + query keys (no deps, can be parallel with migration)
3. Server actions (depends on migration schema)
4. UI components (depends on actions)
5. Production completion validation (depends on quality_checks schema)

## Edge Cases
- Empty quality checks → completion blocked with clear Mongolian error
- Failed final check → completion blocked
- Conditional pass → allowed to complete
- No stages → skip stage validation
- Photo upload failure → check record still created, photos field stays empty

## Verification
1. `bun run typecheck` — zero new errors
2. `bun run lint` — passes
3. Manual: create quality check via drawer, verify in list
4. Manual: try completing order without final check → blocked
