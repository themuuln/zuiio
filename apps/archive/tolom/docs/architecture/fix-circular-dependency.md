# Fix: Circular Dependency Between report-service and work-order-service

> Applied: 2026-05-12
> Problem: `report-service.ts` used `await import("./work-order-service")` to access `getWorkOrder`, creating a wasted Supabase client (one for the dynamic import wrapper, one inside the function) and a fragile dependency graph.

## Root Cause

`report-service.ts` had a local `getWorkOrder` wrapper at line 1129:

```typescript
async function getWorkOrder(id: string): Promise<WorkOrderDetail> {
  const _supabase = await createClient();  // wasted client
  const { getWorkOrder } = await import("./work-order-service");
  return getWorkOrder(id);
}
```

The dynamic `await import()` was used to avoid a circular import (report-service imports work-order-service which imports... nothing from report-service at the time, but the interdependency risk existed through shared types). The wrapper also created a Supabase client that was never used.

All call sites in `report-service.ts` (3 occurrences: `getDailyReport`, `getMonthlyReport`, `getEndOfDaySummary`) already had their own `supabase` client from `createClient()`.

## Solution

### 1. Created `src/lib/services/_queries/work-order-queries.ts`

Extracted the shared query logic into a module that both services can import normally:

```
src/lib/services/_queries/work-order-queries.ts
  └── getWorkOrderDetail(supabase, id) — accepts client as parameter
       ├── Fetches work_orders.* by id
       ├── 6 parallel queries: services, parts, status_history, customer, vehicle, mechanic
       └── Returns WorkOrderDetail
```

Key design choice: **accept SupabaseClient as first parameter** instead of creating one internally. This:
- Eliminates redundant client creation
- Makes the function testable (inject mock client)
- Follows the "inject dependencies" pattern from the architecture analysis

### 2. Updated `src/lib/services/work-order-service.ts`

`getWorkOrder(id)` now delegates to the shared function:

```typescript
export async function getWorkOrder(id: string): Promise<WorkOrderDetail> {
  const supabase = await createClient();
  return getWorkOrderDetail(supabase, id);
}
```

### 3. Updated `src/lib/services/report-service.ts`

- Added direct import: `import { getWorkOrderDetail } from "@/lib/services/_queries/work-order-queries"`
- Changed 3 call sites to use `getWorkOrderDetail(supabase, woId)` — passing their existing supabase client
- Removed the lazy `async function getWorkOrder(id)` wrapper entirely

## Benefits

| Before | After |
|--------|-------|
| ~2 Supabase clients created per work order detail fetch | ~1 Supabase client (caller passes theirs) |
| Dynamic `await import()` at runtime | Static import at build time |
| Cannot unit test independently | Can test with mock SupabaseClient |
| Dependency hidden behind lazy import | Dependency graph is transparent |
| Extra complexity for N+1 scenario | Clean pattern reusable anywhere |

## Verification

- `npx tsc --noEmit` — zero errors (pre-existing `recharts` module issue only)
- Dependency graph is now acyclic:
  ```
  work-order-service.ts → _queries/work-order-queries.ts
  report-service.ts     → _queries/work-order-queries.ts
  report-service.ts  ✗  → work-order-service.ts (removed)
  ```
