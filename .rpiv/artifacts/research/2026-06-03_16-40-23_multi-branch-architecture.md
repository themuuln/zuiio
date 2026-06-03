---
date: 2026-06-03T16:40:23+0800
author: Temuulen Undrakhbayar
commit: 01f1bedd
branch: main
repository: tolom
topic: "Multi-Branch Architecture"
tags: [research, codebase, branch, withBranchFilter, architecture]
status: complete
last_updated: 2026-06-03T16:40:23+0800
last_updated_by: Temuulen Undrakhbayar
---

# Research: Multi-Branch Architecture

## Research Question

How to implement a shared `withBranchFilter` utility that standardizes branch-scoped data filtering across all services, normalizes param naming to `branchId`, enforces `branch_id` on creates with main-branch fallback, and handles the `"all"` sentinel internally.

## Summary

The codebase has **53 existing branch-filter sites** (22 inline `if (branchId) query.eq(...)` patterns + 31 `withBranchFilter` calls) across 10 service files, with **5 Create\*Params that completely lack `branch_id`** — causing invisible records in branch-filtered views. Two duplicate helpers already exist (`report-service.ts:33`, `bay-view-service.ts:1092`). The `"all"` sentinel is normalized at up to 3 layers (page, API, service) depending on the domain, with 8 pages acting as the sole guard. The FRD calls for a single generic function in `src/lib/supabase/with-branch.ts` that absorbs all this duplication.

## Detailed Findings

### Sentinel Normalization Chain

The `"all"` sentinel from the Zustand store (`ui-store.ts:27`) flows through 4 layers:

1. **Zustand store**: `selectedBranchId: "all"` persisted to localStorage (`ui-store.ts:27,54-57`)
2. **Page level** (10 pages): `branchFilter = selectedBranchId === "all" ? null : selectedBranchId` duplicated identically
3. **API level** (reports route only): `branchParam !== "all" ? branchParam : null` at `reports/route.ts:124`
4. **Service level**: `withBranchFilter` truthiness check at `report-service.ts:33`

**Critical insight — 8 pages are load-bearing for sentinel normalization** (customers, vehicles, work-orders, appointments, payroll, inventory, valuation, estimates). The reports and dashboard page normalizations are **cancelled out** by their hooks' `?? "all"` reversal, making the API route normalization the sole effective guard for those 2 pages. The remaining 8 pages' normalization is the ONLY barrier preventing `"all"` from reaching service `.eq("branch_id", "all")` calls (which would silently return zero rows).

The API routes for estimates (`estimates/route.ts:16`), appointments (`appointments/route.ts:21`), and work-orders (`work-orders/route.ts:23`) do **NOT** normalize `"all"` — they pass the raw search param through.

### Inline Branch Filter Patterns — Complete Inventory

**53 total replacement sites** across 10 service files:

| Service | Inline Patterns | `withBranchFilter` uses | Param Naming | `(as any)` Casts |
|---|---|---|---|---|
| `appointment-service.ts` | 1 | 0 | `params?.branch_id` | 0 |
| `work-order-service.ts` | 1 | 0 | `filters?.branch_id` | 0 |
| `estimate-service.ts` | 1 | 0 | `params?.branch_id` | 0 |
| `customer-service.ts` | 1 | 0 | `options?.branch_id` | 0 |
| `vehicle-service.ts` | 1 | 0 | `options?.branchId` | 0 |
| `expense-service.ts` | 1 | 0 | `options?.branchId` | 0 |
| `inventory-service.ts` | 5 | 0 | `branchId` (standalone) | 0 |
| `inventory-reports-service.ts` | 4 | 0 | `branchId` (standalone) | 0 |
| `service-reminder-service.ts` | 1 | 0 | `branchId` (standalone) | **1** |
| `bay-view-service.ts` | 2 | 0 | `branchId` (standalone) | **2** |
| `report-service.ts` | 4 inline | **31** | `branchId` (standalone) | 0 inline, **1** in helper |
| **Total** | **22** | **31** | 3 conventions | **4** |

**3 naming conventions** exist:
- `params?.branch_id` (snake_case): appointment-service, work-order-service, customer-service, estimate-service
- `options?.branchId` (camelCase): vehicle-service, expense-service
- `branchId` as standalone param (camelCase): inventory-service, inventory-reports-service, service-reminder-service, bay-view-service, report-service

**Developer checkpoint decision**: Standardize all param names to camelCase `branchId` in one pass.

### Create\*Params branch_id Gap

**Types WITH `branch_id`** (optional):
- `CreateAppointmentParams` (`service-params.ts:82`) — `branch_id?: string | null`
- `CreateEstimateParams` (`service-params.ts:107`) — `branch_id?: string | null`
- `CreateWorkOrderParams` (`service-params.ts:156`) — `branch_id?: string`

**Types WITHOUT `branch_id`:**
- `CreateCustomerParams` (`service-params.ts:529`) — no branch_id field → customers created with `branch_id IS NULL`
- `CreateVehicleParams` (`service-params.ts:597`) — no branch_id field → vehicles created with `branch_id IS NULL`
- `CreatePartParams` (`inventory.ts:33`) — no branch_id field
- `CreateMovementParams` (`inventory.ts:53`) — no branch_id field
- `CreateSupplierParams` (`inventory.ts:68`) — no branch_id field
- `CreatePurchaseOrderParams` (`inventory.ts:83`) — no branch_id field
- `CreateStockThresholdParams` (`inventory.ts:113`) — no branch_id field

**Impact**: `customer-service.ts:349` inserts customers without `branch_id`, and the `getCustomers` function at line 67 filters by `options?.branch_id` — so these customers are **invisible** in branch-filtered views. Same bug affects vehicles (`vehicle-service.ts:62,164`) and inventory records.

All database `branch_id` columns are nullable (inserts succeed without them), so no constraint errors — just silent invisibility.

**Developer checkpoint decision**: All 5 missing Create\*Params are in scope — add `branchId` + main branch fallback.

### Main Branch Resolution

The pattern is duplicated in **3 places**:
1. `bay-view-actions.ts:605-615` — queries `branches.is_main = true` with `maybeSingle()` when `branchId` is falsy, throws `ValidationError` if still falsy
2. `estimate-service.ts:350-355` — same inline query pattern for `convertEstimateToWorkOrder`
3. `bay-view-service.ts:1137-1143` — same inline query for `seedWaitingQueue`

All three follow the identical pattern but are never extracted to a shared `resolveBranchId(orgId, branchId?)` helper.

The create-side defaulting is inconsistent:
- `work-order-service.ts:208`: `branch_id: params.branch_id ?? null` — inserts null
- `expense-service.ts:350`: `branch_id: params.branchId ?? null` — inserts null  
- `bay-view-actions.ts:638`: `branch_id: branchId` — already resolved via main branch lookup

### Type-Safety Gap

Current `withBranchFilter` at `report-service.ts:33-35`:
```ts
function withBranchFilter<T>(query: T, branchId: string | null): T {
  return (branchId ? (query as any).eq("branch_id", branchId) : query) as T;
}
```

**`PostgrestFilterBuilder` is exported** from both `@supabase/postgrest-js` and `@supabase/supabase-js`. At every call site, the query is always `PostgrestFilterBuilder<ClientOptions, Schema, Row, Result, RelationName, Relationships, Method>` (after `.select()` returns).

A type-safe constraint is possible:
```ts
import type { PostgrestFilterBuilder } from "@supabase/supabase-js";
function withBranchFilter<
  T extends PostgrestFilterBuilder<any, any, any, any, any, any, any>
>(query: T, branchId: string | null): T { ... }
```

However, **`as T` is still required** on the return — TypeScript cannot prove that `.eq()`'s `this` return matches the narrower `T` through generic constraints. The previous typed attempt using `T extends { eq: ... }` broke immediately (`bacf79b8`).

### Query Key Architecture (Cache)

**3 fundamentally different strategies** exist across domains:

| Strategy | Domains | Key Length |
|---|---|---|
| `branchId ?? "all"` default value | report, dashboard, vehicle, payroll, serviceReminder | Stable |
| Conditional spread (branchId omitted when absent) | inventoryKeys (all sub-keys) | Variable (4 vs 5 elements) |
| Embedded in `JSON.stringify(filters)` | expenseKeys.list | Stable |

**Cache bugs found:**
- Pay rate upsert (`use-payroll.ts:95-96`) invalidates with `payrollKeys.payRates(orgId ?? "")` → `["...", "all"]` — branch-specific cache entries (`["...", "branch-123"]`) are **not** invalidated
- Payroll record update (`use-payroll.ts:159`) — same prefix-matching problem
- Finance tab expenses (`finance/page.tsx:544`) calls `useExpenses(orgId)` without branch param — ignores branch selection entirely

**FRD constraint**: "No changes to the Zustand store, React Query hooks, or API route signatures." The `withBranchFilter` utility is server-side only — cache architecture is out of scope for this work.

### useSelectedBranchGuard Invariant

The guard at `use-selected-branch-guard.ts:14-28` resets `selectedBranchId` to `"all"` when the selected branch no longer exists. The centralized utility's sentinel normalization (treating `"all"` same as `null`/`undefined`) satisfies this invariant — the guard's fallback always produces a safe "no-filter" state.

**Critical dependency**: The guard's safety depends on `"all"` being universally treated as "no filter." The centralized utility must be adopted by **all** services (or the API layer) to maintain this invariant if page-level normalization is removed.

## Code References

- `src/lib/services/report-service.ts:33-35` — Existing `withBranchFilter<T>` helper (template for shared utility)
- `src/lib/services/bay-view-service.ts:1092` — Duplicate `branchFilter<T>` helper (same logic, independently created)
- `src/lib/services/bay-view-actions.ts:605-615` — Main branch resolution pattern (template for `resolveBranchId`)
- `src/lib/services/estimate-service.ts:350-355` — Duplicate main branch resolution
- `src/lib/services/bay-view-service.ts:1137-1143` — Duplicate main branch resolution
- `src/lib/stores/ui-store.ts:27` — `selectedBranchId: "all"` sentinel initialization
- `src/lib/stores/ui-store.ts:66` — `useSelectedBranchId()` selector
- `src/lib/hooks/use-selected-branch-guard.ts:14-28` — Branch existence guard (resets to `"all"` on deletion)
- `src/lib/queries/keys.ts:89-118` — `reportKeys` (consistent `?? "all"`)
- `src/lib/queries/keys.ts:135-172` — `inventoryKeys` (conditional spread, variable-length)
- `src/lib/queries/keys.ts:130-133` — `dashboardKeys` (consistent `?? "all"`)
- `src/lib/queries/keys.ts:123-128` — `payrollKeys` (consistent `?? "all"`, invalidation bug)
- `src/lib/queries/keys.ts:186-188` — `expenseKeys.list` (no explicit branchId)
- `src/lib/supabase/` — Target directory for shared utility; contains 7 files (client.ts, server.ts, service-role.ts, etc.)
- `src/lib/types/service-params.ts:82` — `CreateAppointmentParams` (branch_id optional)
- `src/lib/types/service-params.ts:107` — `CreateEstimateParams` (branch_id optional)
- `src/lib/types/service-params.ts:156` — `CreateWorkOrderParams` (branch_id optional)
- `src/lib/types/service-params.ts:529` — `CreateCustomerParams` (branch_id MISSING)
- `src/lib/types/service-params.ts:597` — `CreateVehicleParams` (branch_id MISSING)
- `src/lib/types/inventory.ts:33-115` — All 5 inventory Create*Params (branch_id MISSING)
- `src/lib/services/work-order-service.ts:208` — `branch_id: params.branch_id ?? null` (null default)
- `src/lib/services/expense-service.ts:350` — `branch_id: params.branchId ?? null` (null default)
- `src/lib/services/customer-service.ts:349` — No `branch_id` in insert (invisible records)
- `src/lib/services/vehicle-service.ts:164` — No `branch_id` in insert (invisible records)
- `src/app/api/organizations/[id]/reports/route.ts:124` — API normalizes `"all"` → `null`
- `src/app/api/organizations/[id]/estimates/route.ts:16` — Raw pass-through (no normalization)
- `src/app/api/organizations/[id]/appointments/route.ts:21` — Raw pass-through
- `src/app/api/organizations/[id]/work-orders/route.ts:23` — Raw pass-through

### Pages with branchFilter normalization (10 total)
- `src/app/[locale]/dashboard/reports/page.tsx:397` — NOT load-bearing (hook reverses)
- `src/app/[locale]/dashboard/page.tsx:82` — NOT load-bearing (hook reverses)
- `src/app/[locale]/dashboard/customers/page.tsx:80` — Load-bearing (sole guard)
- `src/app/[locale]/dashboard/vehicles/page.tsx:51` — Load-bearing (sole guard)
- `src/app/[locale]/dashboard/work-orders/page.tsx:166` — Load-bearing (sole guard)
- `src/app/[locale]/dashboard/appointments/page.tsx:51` — Load-bearing (sole guard)
- `src/app/[locale]/dashboard/payroll/page.tsx:57` — Load-bearing (sole guard)
- `src/app/[locale]/dashboard/inventory/page.tsx:42` — Load-bearing (sole guard)
- `src/app/[locale]/dashboard/inventory/valuation/page.tsx:27` — Load-bearing (sole guard)
- `src/app/[locale]/dashboard/estimates/page.tsx:54` — Load-bearing (sole guard)

## Integration Points

### Inbound References
- `src/lib/stores/ui-store.ts:27` → `selectedBranchId` feeds all 10 pages' normalization → hooks → API → services
- `src/lib/stores/ui-store.ts:66` → `useSelectedBranchId()` selector used by all branch-aware pages
- `src/lib/hooks/use-selected-branch-guard.ts:15` → consumes `selectedBranchId` to validate existence

### Outbound Dependencies
- `src/lib/supabase/server.ts` — `createClient()` returns `SupabaseClient<Database, 'public'>`, the foundation for all query builders
- `@supabase/supabase-js` — exports `PostgrestFilterBuilder` type for the type-safe constraint
- All 10 service files listed in Code References — consumers of the utility
- All 10 page files listed in Code References — currently normalizing `"all"` at the page level

### Infrastructure Wiring
- The utility file `src/lib/supabase/with-branch.ts` is a new file — no routing, DI, or middleware changes needed
- `src/lib/services/report-service.ts:33` — existing `withBranchFilter` will be replaced with `import { withBranchFilter } from "@/lib/supabase/with-branch"`
- `src/lib/services/bay-view-service.ts:1092` — duplicate `branchFilter` helper will be replaced with same import

## Architecture Insights

1. **Centralized sentinel normalization is safe at any layer** — each layer normalizes `"all"` to the same semantic "no-filter" state. The utility's internal normalization (treating `"all"` same as `null`/`undefined`) is compatible with all existing paths.

2. **The `(as any)` cast is pragmatically safe** — `.eq()` returns `this` at runtime, so the return object is always the same reference. The constraint `T extends PostgrestFilterBuilder<any, any, any, any, any, any, any>` prevents misuse on non-query types while `as T` on return is provably safe.

3. **3 naming conventions must be unified** — `params?.branch_id`, `options?.branchId`, and standalone `branchId`. Standardizing to `branchId` changes function signatures in 4 services (appointment, work-order, customer, estimate).

4. **Main branch resolution is duplicated 3x** — extracting `resolveBranchId(orgId, branchId?)` to the shared utility file eliminates all three copies.

5. **Create*Params without branch_id produce invisible records** — the root cause bug that the FRD aims to prevent. All 5 missing types plus the 3 existing optional types need `branchId` made required with main-branch fallback.

6. **Page-level normalization can remain as a defensive guard** — removing it requires confidence the utility is adopted everywhere. Keeping it is safe (redundant normalization is idempotent).

7. **Query cache architecture is out of scope** — but the existing inconsistency (3 strategies) means any future cache-aware addition must account for differential key shapes.

## Precedents & Lessons

4 similar past changes analyzed.

### Precedent 1: withBranchFilter introduced in report-service.ts
**Commit(s)**: `64695ea1` — "backup" (2026-06-01)
**Blast radius**: 1 file across 1 layer
  services/report-service.ts — added `withBranchFilter<T>` helper + 20+ call sites

**Follow-up fixes**:
- `bacf79b8` — "fix: resolve build errors (Select types, report-service deep instantiation)" (2026-06-01) — Type constraint `T extends { eq: ... }` was too strict; relaxed to `(query as any).eq(...)` cast
- `54f26bf0` — "fix: move supabase client outside withCache to prevent cookies() error" (2026-06-01) — `withBranchFilter` queries wrapped in `withCache` must create supabase client *before* entering the cached scope

**Takeaway**: The typed version broke immediately — Supabase query builder types are too complex for a tight generic constraint. The `any` cast is the pragmatic fix. The `withCache` ordering issue means branch-filtered cached queries must create their supabase client outside the cached scope.

### Precedent 2: branchFilter helper in bay-view-service.ts
**Commit(s)**: `e34f3841` — "backup" (2026-05-14)
**Blast radius**: 1 file across 1 layer
  services/bay-view-service.ts — added inline `branchFilter<T>` helper at line 1092

**Takeaway**: Two identical helpers were independently created within 2 weeks because there was no shared utility. This is the exact DRY problem the planner prevents.

### Precedent 3: selectedBranchId in ui-store + page-level branching
**Commit(s)**: `fefdc87a` — "WIP on main" (2026-06-03, added selectedBranchId)
**Blast radius**: 2 files across 2 layers
  stores/ui-store.ts — added `selectedBranchId: "all"` + setter + persist
  services/bay-view-actions.ts — 44 lines for branch-aware queue operations

**Follow-up fixes**:
- `1667ae69` — "fix: remove unsupported filter param from listUsers in bay-view-actions" (2026-05-28) — Filter params to Supabase admin API are fragile

**Takeaway**: The `"all"` sentinel handling is repeated in 10+ pages. Centralizing it in a shared utility eliminates a whole class of inconsistency bugs.

### Precedent 4: Performance indexes for branch filtering
**Commit(s)**: `75bca02a` — "perf: fix 4 slow API endpoints with indexes + caching + parallel queries" (2026-06-01)
**Blast radius**: 6 files across 3 layers
  services/report-service.ts — +52/-25 LOC (withCache wrapping, withBranchFilter usage)
  services/work-order-service.ts — +8/-2 LOC (multi-status filter fix)
  services/time-tracking-service.ts — +6/-1 LOC
  types/service-params.ts — +1/-1 LOC (WorkOrderFilters.branch_id added)
  migrations — +58 LOC (SQL indexes: `idx_wo_org_branch_active`, `idx_invoices_org_branch_status`)

**Takeaway**: Branch-filtered queries need composite indexes on `(org_id, branch_id, ...)` to avoid performance regression on large orgs. The perf commit is the template for adding these.

### Composite Lessons
1. **The typed generic immediately breaks** (`bacf79b8`) — `T extends { eq: ... }` constraint caused build errors. A type-safe constraint over Supabase query builders is provably difficult. Accept `as any` or use `PostgrestFilterBuilder<any, any, any, any, any, any, any>` with an `as T` return cast.
2. **Duplicate helpers multiply within 2 weeks** — Two identical helpers (`withBranchFilter` in report-service, `branchFilter` in bay-view-service) were independently created. The architecture review (`tolom_shared-helpers-dry-review.md`) explicitly flags this DRY problem.
3. **The `"all"` sentinel is handled 10+ places** — Every page independently normalizes. Centralizing eliminates this duplication.
4. **Branch-filtered queries need composite indexes** — The perf commit (`75bca02a`) proves this. Rolling out `withBranchFilter` to all services without corresponding indexes will cause slow queries.
5. **withCache + supabase client ordering is fragile** (`54f26bf0`) — When wrapping branch-filtered queries in `withCache`, the supabase client (which calls `cookies()`) must be created *outside* the cached scope.
6. **Bay view queue vs. slot semantics matter** — The service layer must own what's branch-filtered vs org-wide. The helper is mechanical; applying it to the wrong query (waiting queue) caused a visible bug.

## Historical Context (from `.rpiv/artifacts/`)
- `.rpiv/artifacts/discover/2026-06-03_16-08-12_multi-branch-architecture.md` — FRD defining the shared `withBranchFilter` utility, `resolveBranchId` helper, and Create*Params enforcement
- `.rpiv/artifacts/discover/2026-06-03_16-39-26_multi-branch-data-layer.md` — Second FRD reinforcing the same pattern: shared helper, `"all"` normalization, required `branchId` on creates
- `.rpiv/artifacts/architecture-reviews/tolom_shared-helpers-dry-review.md` — Flags 40 services with duplicated CRUD scaffolding; the branch-filter duplication is another instance
- `.rpiv/artifacts/plans/2026-06-03_11-20-14_multi-branch-finance-separation.md` — Plan for the earlier phase (sidebar + finance separation) that introduced the global branch store

## Developer Context

**Q (discover: Helper function signature): What should the helper function signature look like?**
A: Simple generic `function withBranchFilter<T>(query: T, branchId?: string | null): T`

**Q (discover: Scope — which services get the helper): Which services need the withBranchFilter helper?**
A: All data services

**Q (discover: File location): Where should the shared helper live?**
A: New file `src/lib/supabase/with-branch.ts`

**Q (discover: Sentinel handling): Should the helper handle the `"all"` sentinel internally?**
A: Handle internally

**Q (discover: RLS depth): Should we add branch-level RLS policies?**
A: Org-scoped is sufficient — branch filtering is an application concern

**Q (discover: Fallback behavior for creates): When branchId is not provided on create, what should happen?**
A: Auto-resolve main branch via shared `resolveBranchId(orgId, branchId?)` helper

**Q (discover: Param naming convention): Normalize inconsistent param naming?**
A: Standardize to `branchId` (camelCase) across all services

**Q (discover: Enforce branch_id on creates): Should branch_id be required in Create\*Params?**
A: Yes, require branch_id — the parameter becomes non-optional with main branch fallback

**Q (Checkpoint — Service patterns analysis, `service-params.ts:529,597`): 5 Create\*Params lack branch_id entirely. Should fixing them be in scope?**
A: Include now — add `branchId` + main branch fallback to all 5 missing types, their services, and callers.

**Q (Checkpoint — Naming convention analysis, `appointment-service.ts:50`): How to handle 3 services using snake_case `params?.branch_id`?**
A: Standardize now — rename all 3 service params + callers in one pass.

## Related Research
- (none)

## Open Questions
None — all decisions resolved during the interview (FRD) and checkpoint (this research).

## Suggested Follow-ups
- The `type-fest` `Except` utility or a similar pattern could simplify the Create\*Params migration, since many interfaces share `customer_id`, `vehicle_id`, and `branch_id` fields — worth investigating during implementation if it reduces boilerplate.
