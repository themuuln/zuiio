# Manufacturing Job Costing (Phase 4)

## Context
Phase 2 (production_orders) and Phase 3 (material issue/return) are complete. Phase 4 adds labor tracking per stage and a cost summary for each production order. Hourly rate is entered manually at time of recording (no auto-conversion from monthly salary yet).

## Files to Change
| File | Action | What changes |
|------|--------|--------------|
| `supabase/migrations/20260717150000_manufacturing_costing.sql` | Create | production_stage_labor table, RLS, indexes, trigger |
| `src/app/(dashboard)/production/labor-actions.ts` | Create | Server actions: addLaborRecord, removeLaborRecord, getStageLaborSummary, getOrderCostSummary |
| `src/lib/query/keys.ts` | Modify | Add laborKeys factory |
| `src/app/(dashboard)/production/production-detail-drawer.tsx` | Modify | Add Labor section per stage + Cost Summary section at bottom |

## Implementation Order
1. Migration (no deps)
2. Query keys (no deps) — parallel with #1
3. Server actions (depends on #1 for types, but types aren't in database.types.ts yet)
4. Detail drawer (depends on #2 + #3)

## Key Decisions
- material_actual_cost uses `production_materials.issued_quantity * estimated_unit_cost_snapshot` minus returns — simpler than querying stock_movements (which don't have a guaranteed link in client code yet)
- labor_cost is a PostgreSQL GENERATED ALWAYS column — never computed in app code
- hourly_rate_snapshot is mandatory at recording time — never read from employee.base_salary
- Revenue from sale_items.total_price via production_orders.sale_item_id
- No revenue link → show "Орлого холбоогүй", don't show profit as 0-cost

## Edge Cases
- Empty labor records → show "Ажилтан бүртгээгүй" placeholder
- No materials issued → material cost = 0
- No sale_item_id → revenue/profit hidden
- Stage not in_progress → "Ажилтан нэмэх" button disabled

## Verification
1. TypeScript: `npx tsc --noEmit` — zero errors
2. Migration: `supabase db push` or manual apply
3. Manual: Open production order drawer → see labor section → add worker → verify cost updates
