# Production Orders UI — Migration from Pages to App Router

## Context
The production orders page currently uses the Pages Router pattern (`src/pages/production/`) with a standalone Supabase client (`supabase-browser.ts`). It needs to be migrated to the App Router pattern (`src/app/(dashboard)/production/`) using the established patterns from `bom/` and the shared Supabase client from `@/lib/supabase/client`.

## Files to Create / Modify
| File | Action | What changes |
|------|--------|--------------|
| `src/app/(dashboard)/production/page.tsx` | **Create** | Server Component wrapper (pattern from BOM) |
| `src/app/(dashboard)/production/loading.tsx` | **Create** | Loading skeleton |
| `src/app/(dashboard)/production/production-content.tsx` | **Create** | Client Component with full production orders UI |
| `src/app/(dashboard)/production/production-actions.ts` | **Modify** | Add `listProductionOrders()` + `getProductionOrder()` + `getProductionOrderStats()` |
| `src/pages/production/production-orders.tsx` | **Delete** | Old Pages Router version |
| `src/lib/supabase/supabase-browser.ts` | **Delete** | Old standalone browser client (replaced by `@/lib/supabase/client`) |

## Implementation Order
1. Add server actions to `production-actions.ts` (list + get + stats)
2. Create `page.tsx` (server component wrapper)
3. Create `loading.tsx` (skeleton)
4. Create `production-content.tsx` (client component — the bulk of the work)
5. Delete old files

## UI Design (matching existing BOM/loyalty patterns)
- `ProductionHeader` — title + stats cards + status tabs + Create button
- `ProductionTable` — sortable data table with status badges, priority indicators
- `ProductionStatusBadge` — colored badge per status (pending=yellow, in_progress=blue, completed=green, cancelled=gray)
- `ProductionPriorityIndicator` — icon/badge for low/normal/high/urgent
- Inline actions: View details, Start (pending→in_progress), Complete (in_progress→completed), Cancel

## Edge Cases
- Empty state: "Үйлдвэрлэлийн захиалга байхгүй байна" with create CTA
- Loading state: skeleton matching table rows
- Status transitions are validated server-side
- Branch-scoped: uses branchId from auth context
- Soft delete: `deleted_at` filter on all queries

## Verification
1. TypeScript: `npx tsc --noEmit` — no new errors
2. Visual: Production orders page loads with correct layout
3. Navigation: Sidebar link works, page renders under dashboard shell
4. No 404: Confirm route resolves correctly
