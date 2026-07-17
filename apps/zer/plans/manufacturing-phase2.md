# Manufacturing Phase 2: Production Orders

## Context
Phase 1 created BOM tables. Phase 2 adds production order tracking — orders, stages, and material snapshots — plus server actions following the exact bom-actions.ts patterns.

## Files to Change
| File | Action | What changes |
|------|--------|--------------|
| supabase/migrations/20260717120000_manufacturing_orders.sql | Create | 3 tables, RLS, indexes, 2 RPC functions, triggers |
| src/app/(dashboard)/production/production-actions.ts | Create | 6 server actions for production orders |

## Implementation Order
1. Create migration (tables → indexes → triggers → RLS → RPC functions)
2. Create server actions (types → list → get → create → update status → advance stage → cancel)

## Edge Cases
- Race-safe order numbering via SQL RPC with MAX+1
- BOM snapshot must multiply quantities by order quantity
- Status transitions validated server-side (pending→in_progress→completed, cancel from any non-completed)
- All queries branch-scoped via branch_id
- Soft delete via deleted_at, not hard delete

## Verification
1. TypeScript: `npx tsc --noEmit` — zero new errors
2. Migration applies cleanly to local Supabase
