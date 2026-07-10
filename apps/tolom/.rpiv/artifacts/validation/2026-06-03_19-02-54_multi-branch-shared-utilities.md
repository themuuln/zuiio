---
date: 2026-06-03T19:02:54+0800
author: Temuulen Undrakhbayar
commit: 01f1bedd
branch: main
repository: tolom
topic: "Validation of Multi-Branch Shared Utilities"
status: complete
parent: ".rpiv/artifacts/plans/2026-06-03_16-51-58_multi-branch-shared-utilities.md"
tags: [validation, branch-filter, refactor, utilities]
last_updated: 2026-06-03T19:02:54+0800
---

## Validation Report: Multi-Branch Shared Utilities

### Implementation Status

- ✓ **Phase 1: Foundation — Shared Utility File** — Fully implemented (`src/lib/supabase/with-branch.ts`)
- ✓ **Phase 2: Report + Bay View — Replace Local Helpers** — Fully implemented
- ✓ **Phase 3: Remaining 9 Services — Inline Patterns → Shared Import** — Fully implemented
- ✓ **Phase 4: Param Standardization + Create\*Params Enforcement** — Fully implemented

### Automated Verification Results

- ✓ **Type check (source only)**: `npm run validate:types` — 0 errors from implementation files. Only pre-existing errors in test files (`work-order-service.test.ts`, `vehicle-service.test.ts`) and unrelated API routes remain.
- ✓ **Phase 1 — File exists**: `src/lib/supabase/with-branch.ts` created with `withBranchFilter<T>` and `resolveBranchId` exports.
- ✓ **Phase 2 — Local helpers removed**: `grep -n "function withBranchFilter" src/lib/services/report-service.ts` → empty. `grep -n "const branchFilter" src/lib/services/bay-view-service.ts` → empty.
- ✓ **Phase 2 — Shared imports**: Both `report-service.ts` and `bay-view-service.ts` import from `@/lib/supabase/with-branch`.
- ✓ **Phase 2 — withCache ordering preserved**: Client created before cached scope in all `withCache`-wrapped functions in `report-service.ts`.
- ✓ **Phase 3 — Imports added**: All 9 services (appointment, work-order, estimate, customer, vehicle, expense, inventory, inventory-reports, service-reminder) import from shared utility.
- ✓ **Phase 3 — No remaining `(query as any).eq("branch_id"` casts**: Zero matches outside `with-branch.ts`.
- ✓ **Phase 3 — service-reminder `(as any)` cast eliminated**: No remaining `(as any)` casts in service-reminder-service.ts.
- ✓ **Phase 4 — Param rename**: No `branch_id?: string` remains in `service-params.ts`. All 4 Create\*Params use `branchId`.
- ✓ **Phase 4 — Create\*Params types complete**: `CreateCustomerParams`, `CreateVehicleParams`, `CreateMovementParams`, `CreateSupplierParams`, `CreatePurchaseOrderParams`, `CreateStockThresholdParams` all have `branchId?: string | null`.
- ✓ **Phase 4 — `resolveBranchId` in all create-touch services**: customer-service (2), vehicle-service (2), expense-service (2), work-order-service (2), estimate-service (3), appointment-service (2), inventory-service (5).
- ✓ **Phase 4 — Inline main-branch queries removed**: `grep -n "is_main" src/lib/services/estimate-service.ts` → empty. `convertEstimateToWorkOrder` uses `resolveBranchId` instead.
- ✓ **Phase 4 — API routes updated**: No `branch_id:` property assignments remain in 4 route files (`customers`, `appointments`, `estimates`, `work-orders`). URL query param `.get("branch_id")` reads preserved (unchanged convention).
- ✓ **Phase 4 — `searchCustomers` options use `branchId`**: Options type shows `branchId?: string`, not `branch_id`.
- ✓ No test regressions introduced: All 97 failing tests are pre-existing (`search-input.test.tsx` component tests).

### Code Review Findings

#### Matches Plan:

- `src/lib/supabase/with-branch.ts:30-32` — `withBranchFilter<T>(query, branchId?)` correctly handles `null`/`undefined`/`"all"` sentinel as no-op, applies `.eq("branch_id", branchId)` for real IDs. Generic `<T>` with `as T` return per plan (no `PostgrestFilterBuilder` constraint — per commit `bacf79b8` regression proof).
- `src/lib/supabase/with-branch.ts:57-80` — `resolveBranchId(supabase, orgId, branchId?, options?)` falls back to main branch, configurable strict mode (default: `true` throws `ValidationError`). All create callers use `{ strict: false }` (estimate-service "returns null" pattern).
- All 31 `withBranchFilter` calls in `report-service.ts` now resolve to the shared import.
- `bay-view-service.ts` local `branchFilter` helper removed, replaced with 3 `withBranchFilter()` calls plus 1 at the member-query site.
- 22 inline `if (branchId) query.eq(...)` patterns across 9 services replaced with `withBranchFilter(query, branchId)`.
- `service-reminder-service.ts` `(as any)` cast replaced with typed `withBranchFilter` call.
- All param naming standardized to camelCase `branchId` in service function signatures and type definitions.
- `resolveBranchId` called before inserts in `createCustomer`, `createVehicle`, `createAppointment`, `createEstimate`, `createWorkOrder`, `createExpense`, `createMovement`, `createSupplier`, `createPurchaseOrder`, `setStockThreshold`.

#### Deviations from Plan:

None. Implementation is a faithful realization of the plan.

#### Pattern Conformance:

- ✓ All service files follow the established pattern: one import from `with-branch.ts`, one-line `withBranchFilter` calls replacing inline `if` blocks.
- ✓ `resolveBranchId` + `{ strict: false }` is consistent across all create functions — aligns with the estimate-service non-strict pattern.
- ✓ `withCache` ordering preserved — supabase client created before cached scope in all `report-service.ts` functions.

**Minor observation (acceptable variation, not a deviation):**
- `src/lib/services/report-service.ts:131,345,503,785` — 4 internal helper functions use raw `query.eq("branch_id", branchId)` instead of `withBranchFilter(query, branchId)`. These helpers receive already-resolved `branchId: string | null` (no `"all"` sentinel), so behavior is identical. `report-service.ts` already imports `withBranchFilter`. Consider converting for consistency in a follow-up.

#### Potential Issues:

**Pre-existing test failures (unrelated):**
- 97 test failures in `search-input.test.tsx` (7 test files). These are pre-existing component test issues with the `SearchInput` component, entirely unrelated to the branch-filter implementation.
- Type errors in `work-order-service.test.ts` (`subTotal`, `totalDiscounts`, `servicesDiscount`) and `vehicle-service.test.ts` (mock Supabase type mismatch) are also pre-existing.

### Manual Testing Required:

1. **`withBranchFilter` behavior**:
   - [ ] Verify query passes through unchanged when `branchId` is `null`, `undefined`, `""`, or `"all"`
   - [ ] Verify `.eq("branch_id", branchId)` is applied when `branchId` is a real UUID

2. **`resolveBranchId` behavior**:
   - [ ] Verify returns input `branchId` directly when a real ID is provided
   - [ ] Verify falls back to main branch when `branchId` is `undefined`/`null`/`"all"`
   - [ ] Verify throws `ValidationError` when `strict: true` and no main branch exists
   - [ ] Verify returns `null` when `strict: false` and no main branch exists

3. **Created records include `branch_id`**:
   - [ ] Create a customer → verify `branch_id` is set (not null)
   - [ ] Create a vehicle → verify `branch_id` is set
   - [ ] Create an appointment → verify `branch_id` is set
   - [ ] Create an estimate → verify `branch_id` is set
   - [ ] Create a work order → verify `branch_id` is set
   - [ ] Record an inventory movement → verify `branch_id` is set

4. **Branch filter still works**:
   - [ ] Load reports page with branch filter → data should be scoped to selected branch
   - [ ] Load work orders with branch filter → only that branch's WOs shown
   - [ ] Switch to "All Branches" → full data visible
   - [ ] Load bay view → branch-scoped data correct

5. **URL convention preserved**:
   - [ ] API requests to `/api/organizations/*/work-orders?branch_id=XYZ` still work

### Recommendations:

- **Ready to commit** — implementation is complete and validated. The 4 unconverted raw `.eq("branch_id")` patterns in `report-service.ts` helpers are very low priority; they produce identical SQL and `withBranchFilter` is already imported. Convert at convenience for full consistency.
- **Test coverage**: The implementation has no test coverage. Adding a test for `with-branch.ts` (`withBranchFilter` no-op cases, `resolveBranchId` strict/non-strict) would be a good addition in a follow-up.
- **No documentation updates needed** — this is an internal refactoring with no user-facing changes (API URL convention unchanged).
