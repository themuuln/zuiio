# TOLOM Fix Session Summary

## Schema & Data Fixes

### New migration: `supabase/migrations/00012_fix_schema_drift_and_payments.sql`

**Column renames to match service code:**

| Table | Before (SQL) | After (matches code) | Impact |
|-------|-------------|----------------------|--------|
| `work_order_services` | `name`, `base_price`, `discount_amount_mnt`, `discount_percent` | `service_name`, `unit_price`, `discount_amount`, `discount_percentage` | **Critical** — inserts were silently failing, all prices saved as 0 |
| `service_price_history` | `base_price`, `discount_amount_mnt`, `discount_percent` | `unit_price`, `discount_amount`, `discount_percentage` | **Critical** — same silent failure |
| Added `organization_id`, `mechanic_id`, `last_sold_price` to `work_order_services` | | | Enables direct queries, RLS |
| Added `organization_id`, `discount_amount`, `discount_percentage`, `last_sold_price` to `work_order_parts` | | | Enables discount recording |
| Added `subtotal`, `discount_total`, `total` to `work_orders` | | | Matches TypeScript types, enables cached totals |
| Added `service_name`, `vehicle_id`, `work_order_service_id` to `service_price_history` | | | Enables richer price history |
| Added `discount_amount`, `discount_percentage`, `vehicle_id`, `work_order_part_id` to `part_price_history` | | | Enables richer price history |

**New table: `payments`** — manual payment recording (was throwing 500)
- `payment_method CHECK ('cash', 'card', 'internet_bank')`
- RLS enabled, 4 policies, indexes on org/work_order/paid_at/method

### Fixed: `src/lib/database.types.ts`
- Removed 7 phantom columns from `WorkOrderService`, `WorkOrderPart`, `ServicePriceHistory`, `PartPriceHistory`
- Added `Payment` type + `PaymentMethod` union type
- Registered `payments` table in `Database` interface

## Architecture Refactoring

### New: `src/lib/api-handler.ts`
Two factory functions that eliminate the 4-line auth boilerplate pattern:
```typescript
// Before (65+ copies across 27 files):
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new UnauthorizedError();
// ... try/catch with handleApiError

// After:
export const GET = createRouteHandler(async ({ orgId, params, supabase }) => {
  return NextResponse.json({ data: result });
});
```

### Refactored: 27 API route files (~65 handler functions)
All org-scoped routes use `createRouteHandler`, non-org routes use `createSimpleRouteHandler`. Business logic preserved exactly. `TypeScript: 0 errors`.

## Already in place (analysis was stale)
- ✅ `src/middleware.ts` — middleware already exists and is wired
- ✅ Circular dependency in report-service — already fixed via `_queries/work-order-queries.ts`
- ✅ React Query hooks — `useDashboard`, `useCurrentOrg`, `useCustomers` already exist and dashboard uses them
- ✅ Route handler factory — now complete (27 files)

## Files changed
- **New**: `supabase/migrations/00012_fix_schema_drift_and_payments.sql`
- **New**: `src/lib/api-handler.ts`
- **Modified**: `src/lib/database.types.ts`
- **Modified**: 27 `route.ts` files across `src/app/api/`
- **New**: `docs/architecture/fix-route-handler-factory.md`
- **New**: `docs/architecture/00-synthesis.md`

## Still open (lower priority)
- Split `?type=` god routes (inventory handles 6 entity types)
- Decompose 900-line WO wizard into step components
- Remove duplicate auth tree (non-locale `app/auth/` parallel tree)
- Wire cache invalidation (cache tags defined but never called by routes)
