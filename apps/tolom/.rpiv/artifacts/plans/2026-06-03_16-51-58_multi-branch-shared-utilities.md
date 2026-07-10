---
date: 2026-06-03T16:51:58+0800
author: Temuulen Undrakhbayar
commit: 01f1bedd
branch: main
repository: tolom
topic: "Multi-Branch Shared Utilities"
tags: [plan, type-safety, branch-filter, refactor, utilities]
status: ready
parent: ".rpiv/artifacts/research/2026-06-03_16-40-23_multi-branch-architecture.md"
phase_count: 4
unresolved_phase_count: 0
last_updated: 2026-06-03T16:51:58+0800
last_updated_by: Temuulen Undrakhbayar
---

# Multi-Branch Shared Utilities Implementation Plan

## Overview

Create a shared `withBranchFilter` and `resolveBranchId` utility in `src/lib/supabase/with-branch.ts` that standardizes branch-scoped data filtering across all 11 service files (53 total filter sites), normalizes param naming to camelCase `branchId`, and enforces `branch_id` on creates with main-branch fallback. Two existing duplicate helpers (`report-service.ts:33`, `bay-view-service.ts:1092`) are replaced with the shared import. Page-level `"all"` normalization is kept as a defensive guard.

## Requirements

- Create `src/lib/supabase/with-branch.ts` with `withBranchFilter<T>` and `resolveBranchId` exports
- Replace 2 local duplicate helpers with shared import
- Replace 22 inline `if (branchId) query.eq(...)` patterns across 9 services
- Fix 2 `(as any)` casts (service-reminder-service, bay-view-service inline)
- Standardize all param naming to camelCase `branchId` across all service function signatures
- Add `branchId` to 6 missing Create\*Params types (CreateCustomerParams, CreateVehicleParams, 4 inventory types — NOT CreatePartParams since `parts_catalog` has no `branch_id` column)
- Add `resolveBranchId` calls to all service create functions
- Handle `"all"` sentinel internally (treat same as `null`/`undefined`)
- Keep page-level `"all"` normalization as defensive guard (no changes to pages, hooks, or API routes)

## Current State Analysis

53 branch-filter sites across 11 service files: 31 `withBranchFilter` calls in `report-service.ts`, 22 inline `if (branchId)` patterns, plus 2 local helper definitions and 2 `(as any)` casts. Three naming conventions (snake_case `branch_id`, camelCase `branchId` in object, standalone `branchId` param). 7 Create\*Params lack `branch_id` entirely, causing invisible records in branch-filtered views.

### Key Discoveries

- `report-service.ts:33-35` — Local `withBranchFilter<T>` helper used 31 times; template for shared utility
- `bay-view-service.ts:1092-1093` — Duplicate curried `branchFilter<T>` helper used 3 times
- `bay-view-service.ts:258` — Inline `as typeof memberQuery` cast for branch filter
- `service-reminder-service.ts:68` — Sole remaining `(as any)` cast for branch filter
- `customer-service.ts:349` — Insert without `branch_id` → invisible records
- `vehicle-service.ts:164` — Insert without `branch_id` → invisible records
- `estimate-service.ts:428-432` — Main branch fallback with `branch?.id ?? null` pattern
- `bay-view-actions.ts:605-615` — Main branch fallback with `ValidationError` pattern
- `customer-service.ts:50` — `options?.branch_id` (snake_case) naming
- `vehicle-service.ts:57-58` — `options?.branchId` (camelCase) naming
- `appointment-service.ts:61` — `params?.branch_id` naming
- `work-order-service.ts:84` — `filters?.branch_id` naming
- `inventory-service.ts` — standalone `branchId` param across 5 functions

## Desired End State

```typescript
// Consumer usage — single import, zero boilerplate:
import { withBranchFilter, resolveBranchId } from "@/lib/supabase/with-branch";

// Filtering: one call wraps any query builder
const { data } = await withBranchFilter(
  supabase.from("work_orders").select("id").eq("organization_id", orgId),
  branchId,
);

// Creates: auto-resolve main branch when branchId not provided
const branchId = await resolveBranchId(supabase, orgId, params.branchId, { strict: true });
// branchId is always resolved — inserts always have a value
```

## What We're NOT Doing

- Query cache architecture consolidation (3 different key strategies — deferred)
- Page-level `"all" → null` normalization removal (page-level guard stays)
- Composite index migration for branch-filtered queries (separate perf work)
- RLS policy changes (org-scoped is sufficient)
- Type-safe generic constraint over `PostgrestFilterBuilder` (proven fragile in `bacf79b8`)

## Decisions

### Utility Location
- **Decision**: `src/lib/supabase/with-branch.ts`
- **Evidence**: FRD consensus; `src/lib/supabase/` already contains 7 shared utilities (client.ts, server.ts, etc.)

### withBranchFilter Signature
- **Decision**: `function withBranchFilter<T>(query: T, branchId?: string | null): T`
- **Rationale**: `branchId` optional for `"all"` sentinel; internal normalization treats `"all"`, `null`, `undefined` identically (no-op). Generic `<T>` with `as T` return — `PostgrestFilterBuilder<T>` constraint proven fragile at `bacf79b8`.

### Sentinel Handling
- **Decision**: Internal — `"all"` is treated as `null`/`undefined` (no-op filter)
- **Evidence**: FRD question + developer decision

### resolveBranchId Signature
- **Decision**: `async function resolveBranchId(supabase: SupabaseClient, orgId: string, branchId?: string | null, options?: { strict?: boolean }): Promise<string | null>`
- **Rationale**: Configurable strict mode — `strict: true` throws `ValidationError` (bay-view-actions pattern), `strict: false` returns null (estimate-service pattern). Default: strict (safer — prevents invisible records).

### Param Naming
- **Decision**: Standardize all to camelCase `branchId`
- **Evidence**: FRD question + developer decision. Affects appointment-service (`params?.branch_id`), estimate-service (`params?.branch_id`), work-order-service (`filters?.branch_id`), customer-service (`options?.branch_id`).

### Page-Level Normalization Guard
- **Decision**: Keep existing page-level normalization as defensive redundancy
- **Rationale**: Idempotent — `"all" → null` is a no-op after the utility's internal handling. Removing creates risk without benefit.

### RLS & Cache
- **Decision**: Out of scope
- **Evidence**: FRD constraints; branch filtering is an application-layer concern

## Phase 1: Foundation — Shared Utility File

### Overview
Create `src/lib/supabase/with-branch.ts` with `withBranchFilter<T>` and `resolveBranchId` exports. This is the foundation every subsequent phase imports from.

### Changes Required:

#### 1. src/lib/supabase/with-branch.ts
**File**: src/lib/supabase/with-branch.ts
**Changes**: NEW — Shared branch filter utility

```ts
import { ValidationError } from "@/lib/errors";
import type { SupabaseClient } from "@supabase/supabase-js";

// ── Branch Filter ────────────────────────────────────────────

/**
 * Conditionally applies a branch_id filter to any Supabase query builder.
 * Handles the `"all"` sentinel internally — treats it the same as
 * `null`/`undefined` (no-op). Callers never need to normalize `"all"`
 * before calling this function.
 *
 * @param query - Any Supabase query builder (after `.select()`, etc.)
 * @param branchId - Branch ID to filter by, or `"all"`/`null`/`undefined` for no filter
 * @returns The same query (possibly with `.eq("branch_id", branchId)` applied)
 *
 * @example
 * const { data } = await withBranchFilter(
 *   supabase.from("work_orders").select("id").eq("organization_id", orgId),
 *   branchId,
 * );
 *
 * @example
 * // Inside withCache — supabase client must be created before the cached scope
 * const supabase = await createClient();
 * return withCache(["key", branchId ?? "all"], () => withBranchFilter(
 *   supabase.from("work_orders").select("*"),
 *   branchId,
 * ));
 */
export function withBranchFilter<T>(query: T, branchId?: string | null): T {
  if (!branchId || branchId === "all") return query;
  return (query as any).eq("branch_id", branchId) as T;
}

// ── Main Branch Resolution ───────────────────────────────────

/**
 * Resolves a branch ID from an optional input, falling back to the
 * organization's main branch when none is provided.
 *
 * @param supabase - Supabase client instance (must be created before cached scope)
 * @param orgId - Organization ID to look up branches for
 * @param branchId - Optional branch ID input (`"all"`/`null`/`undefined` triggers fallback)
 * @param options - Optional configuration
 * @param options.strict - When true (default), throws ValidationError if no main branch exists.
 *                         When false, returns null silently.
 * @returns The resolved branch ID, or null if non-strict and no main branch exists
 *
 * @example
 * // Strict mode (default) — throws if no main branch
 * const bid = await resolveBranchId(supabase, orgId, params.branchId);
 *
 * @example
 * // Non-strict — returns null if no main branch
 * const bid = await resolveBranchId(supabase, orgId, branchId, { strict: false });
 */
export async function resolveBranchId(
  supabase: SupabaseClient,
  orgId: string,
  branchId?: string | null,
  options?: { strict?: boolean },
): Promise<string | null> {
  // If caller provided a real branch ID, use it directly
  if (branchId && branchId !== "all") {
    return branchId;
  }

  // Fall back to main branch
  const { data: mainBranch } = await supabase
    .from("branches")
    .select("id")
    .eq("organization_id", orgId)
    .eq("is_main", true)
    .maybeSingle();

  if (mainBranch) {
    return mainBranch.id;
  }

  // No main branch found
  const strict = options?.strict ?? true;
  if (strict) {
    throw new ValidationError(
      "No main branch found for this organization. " +
        "Please create a branch or provide a branch ID.",
    );
  }

  return null;
}
```

### Success Criteria:

#### Automated Verification:
- [x] Type checking passes: `npm run validate:types`
- [x] Import works from the new path: `grep -r "@/lib/supabase/with-branch" src/lib/services/ | wc -l` is 0 (before Phase 2)

#### Manual Verification:
- [ ] `withBranchFilter` returns query unchanged when branchId is `null`, `undefined`, or `"all"`
- [ ] `withBranchFilter` applies `.eq("branch_id", branchId)` when branchId is a real ID
- [ ] `resolveBranchId` returns the input branchId when a real ID is provided
- [ ] `resolveBranchId` queries main branch when branchId is `undefined`/`null`/`"all"`
- [ ] `resolveBranchId` throws `ValidationError` when strict=true and no main branch exists
- [ ] `resolveBranchId` returns `null` when strict=false and no main branch exists

## Phase 2: Report + Bay View — Replace Local Helpers

### Overview
Replace the two duplicate helpers (`report-service.ts:33`, `bay-view-service.ts:1092`) with imports from the shared utility in Phase 1.

### Changes Required:

#### 1. src/lib/services/report-service.ts:33-35
**File**: src/lib/services/report-service.ts
**Changes**: MODIFY — Remove local `withBranchFilter<T>` helper, add import from `@/lib/supabase/with-branch`

```ts
// Add import (after line 6):
import { withBranchFilter } from "@/lib/supabase/with-branch";

// Remove lines 33-35 (the local helper):
// ── Helpers ──────────────────────────────────────────────────
//
// function withBranchFilter<T>(query: T, branchId: string | null): T {
//   return (branchId ? (query as any).eq("branch_id", branchId) : query) as T;
// }
```

#### 2. src/lib/services/bay-view-service.ts:1092-1093
**File**: src/lib/services/bay-view-service.ts
**Changes**: MODIFY — Remove local `branchFilter<T>` helper (curried), replace 3 call sites with `withBranchFilter(query, branchId)`, fix inline `as typeof memberQuery` cast at line 258

```ts
// Add import (after line 12):
import { withBranchFilter } from "@/lib/supabase/with-branch";

// Line 258 — replace inline cast:
// From: memberQuery = memberQuery.eq("branch_id", branchId) as typeof memberQuery;
// To:
memberQuery = withBranchFilter(memberQuery, branchId) as typeof memberQuery;

// Lines 1090-1120 — remove local helper, replace 3 call sites:
// Remove:
//   // Helper to optionally add branch filter
//   const branchFilter = <T>(q: T): T =>
//     branchId ? ((q as any).eq("branch_id", branchId) as T) : q;

// Replace 3 branchFilter(...) calls with withBranchFilter(..., branchId):
const [{ data: completed }, { data: active }, { data: inBay }] =
  await Promise.all([
    withBranchFilter(
      supabase
        .from("work_orders")
        .select("total, completed_at, started_at")
        .eq("organization_id", orgId)
        .eq("status", "Completed")
        .gte("completed_at", todayStart.toISOString())
        .is("deleted_at", null),
      branchId,
    ),
    withBranchFilter(
      supabase
        .from("work_orders")
        .select("id")
        .eq("organization_id", orgId)
        .not("status", "in", '("Completed","Cancelled")')
        .is("deleted_at", null),
      branchId,
    ),
    withBranchFilter(
      supabase
        .from("work_orders")
        .select("id")
        .eq("organization_id", orgId)
        .not("status", "in", '("Completed","Cancelled")')
        .is("deleted_at", null)
        .not("bay_number", "is", null),
      branchId,
    ),
  ]);
```

### Success Criteria:

#### Automated Verification:
- [x] Type checking passes: `npm run validate:types`
- [x] No remaining `withBranchFilter` helper in report-service: `grep -n "function withBranchFilter" src/lib/services/report-service.ts` returns empty
- [x] No remaining `branchFilter` helper in bay-view-service: `grep -n "const branchFilter" src/lib/services/bay-view-service.ts` returns empty
- [x] Both services import from shared utility: `grep -n "@/lib/supabase/with-branch" src/lib/services/report-service.ts` returns a match
- [x] Both services import from shared utility: `grep -n "@/lib/supabase/with-branch" src/lib/services/bay-view-service.ts` returns a match
- [x] withCache ordering preserved: `grep -B5 "withCache\[" src/lib/services/report-service.ts | grep -c "createClient"` returns ≥ number of functions using withCache (each should create client before cached scope)

#### Manual Verification:
- [ ] report-service.ts still has 31 `withBranchFilter(` calls — they now resolve to the shared import
- [ ] bay-view-service.ts `getShiftReport` still applies branch filter to all 3 queries
- [ ] bay-view-service.ts line ~258 still applies branch filter to member query

## Phase 3: Remaining 9 Services — Inline Patterns → Shared Import

### Overview
Replace all 22 remaining inline `if (branchId)` patterns across 9 service files with `withBranchFilter` calls. Fix `service-reminder-service.ts:68` `(as any)` cast.

### Changes Required:

#### 1. src/lib/services/appointment-service.ts
**File**: src/lib/services/appointment-service.ts
**Changes**: MODIFY — Add import, replace inline `if (params?.branch_id)` pattern with `withBranchFilter`

```ts
// Add import (after last value import, before type imports):
import { withBranchFilter } from "@/lib/supabase/with-branch";

// Replace (line ~65):
// Old: if (params?.branch_id) query = query.eq("branch_id", params.branch_id);
// New:
if (params?.branch_id) query = withBranchFilter(query, params.branch_id);
```

#### 2. src/lib/services/work-order-service.ts
**File**: src/lib/services/work-order-service.ts
**Changes**: MODIFY — Add import, replace inline `if (filters?.branch_id)` pattern with `withBranchFilter`

```ts
// Add import (after last existing import):
import { withBranchFilter } from "@/lib/supabase/with-branch";

// Replace (line ~84):
// Old: if (filters?.branch_id) query = query.eq("branch_id", filters.branch_id);
// New:
if (filters?.branch_id) query = withBranchFilter(query, filters.branch_id);
```

#### 3. src/lib/services/estimate-service.ts
**File**: src/lib/services/estimate-service.ts
**Changes**: MODIFY — Add import, replace inline `if (params?.branch_id)` pattern with `withBranchFilter`

```ts
// Add import (after last existing import):
import { withBranchFilter } from "@/lib/supabase/with-branch";

// Replace (line ~137):
// Old: if (params?.branch_id) query = query.eq("branch_id", params.branch_id);
// New:
if (params?.branch_id) query = withBranchFilter(query, params.branch_id);
```

#### 4. src/lib/services/customer-service.ts
**File**: src/lib/services/customer-service.ts
**Changes**: MODIFY — Add import, replace inline `if (options?.branch_id)` pattern with `withBranchFilter`

```ts
// Add import (after line 4, before type imports):
import { withBranchFilter } from "@/lib/supabase/with-branch";

// Replace (line ~50):
// Old: if (options?.branch_id) query = query.eq("branch_id", options.branch_id);
// New:
if (options?.branch_id) query = withBranchFilter(query, options.branch_id);
```

#### 5. src/lib/services/vehicle-service.ts
**File**: src/lib/services/vehicle-service.ts
**Changes**: MODIFY — Add import, replace inline `if (options?.branchId)` pattern with `withBranchFilter`

```ts
// Add import (after line 8, after form-validation import, before type imports):
import { withBranchFilter } from "@/lib/supabase/with-branch";

// Replace (line ~57):
// Old: if (options?.branchId) { query = query.eq("branch_id", options.branchId); }
// New:
if (options?.branchId) query = withBranchFilter(query, options.branchId);
```

#### 6. src/lib/services/expense-service.ts
**File**: src/lib/services/expense-service.ts
**Changes**: MODIFY — Add import, replace inline `if (options?.branchId)` pattern with `withBranchFilter`

```ts
// Add import (after line 5, before type imports):
import { withBranchFilter } from "@/lib/supabase/with-branch";

// Replace (line ~153):
// Old: if (options?.branchId) { query = query.eq("branch_id", options.branchId); }
// New:
if (options?.branchId) query = withBranchFilter(query, options.branchId);
```

#### 7. src/lib/services/inventory-service.ts
**File**: src/lib/services/inventory-service.ts
**Changes**: MODIFY — Add import, replace 5 inline `if (branchId)` patterns with `withBranchFilter`

```ts
// Add import (after line 4):
import { withBranchFilter } from "@/lib/supabase/with-branch";

// Replace 5 identical patterns (lines ~295, ~315, ~370, ~588, ~802):
// Old: if (branchId) query = query.eq("branch_id", branchId);
// New:
if (branchId) query = withBranchFilter(query, branchId);
```

#### 8. src/lib/services/inventory-reports-service.ts
**File**: src/lib/services/inventory-reports-service.ts
**Changes**: MODIFY — Add import, replace 4 inline `if (branchId)` patterns with `withBranchFilter`

```ts
// Add import:
import { withBranchFilter } from "@/lib/supabase/with-branch";

// Replace 4 patterns (lines ~32, ~45, ~101, ~168):
// Old: if (branchId) purchasesQuery = purchasesQuery.eq("branch_id", branchId);
// New:
if (branchId) purchasesQuery = withBranchFilter(purchasesQuery, branchId);
```

#### 9. src/lib/services/service-reminder-service.ts
**File**: src/lib/services/service-reminder-service.ts
**Changes**: MODIFY — Add import, replace `(as any)` cast inline pattern with `withBranchFilter`

```ts
// Add import (after line 4):
import { withBranchFilter } from "@/lib/supabase/with-branch";

// Replace (lines ~67-69):
// Old: if (branchId) { query = (query as any).eq("branch_id", branchId); }
// New:
if (branchId) query = withBranchFilter(query, branchId);
```

### Success Criteria:

#### Automated Verification:
- [x] Type checking passes: `npm run validate:types`
- [x] All 8 services have import: `grep -c "@/lib/supabase/with-branch" src/lib/services/appointment-service.ts` ≥ 1; same for work-order-service, estimate-service, customer-service, vehicle-service, expense-service, inventory-service, inventory-reports-service, service-reminder-service
- [x] No remaining `(query as any).eq("branch_id"` patterns: `grep -n "(query as any).eq.*branch_id" src/lib/services/service-reminder-service.ts` returns empty
- [x] No remaining inline `if (branchId)` patterns that call direct `.eq()`: `grep -n "if.*branchId.*eq.*branch_id" src/lib/services/` returns empty (exceptions: Phase 4 services that still have params with `branch_id` naming)

#### Manual Verification:
- [ ] Each file's branch filter logic is preserved — `withBranchFilter` with the same `branchId` value produces identical SQL
- [ ] service-reminder-service.ts `(as any)` cast is eliminated — the shared utility's single `.as T` cast replaces it

## Phase 4: Param Standardization + Create\*Params Enforcement

### Overview
Rename all snake_case `branch_id` params to camelCase `branchId` across all affected service function signatures and their type definitions. Add `branchId` to 7 missing Create\*Params types. Add `resolveBranchId` calls to all service create functions.

### Changes Required:

#### 1. src/lib/types/service-params.ts
**File**: src/lib/types/service-params.ts
**Changes**: MODIFY — Rename `branch_id` → `branchId` in 4 param types; add `branchId` to 2 missing types

```ts
// CreateAppointmentParams (line ~87):
// Old: branch_id?: string | null;
// New:
branchId?: string | null;

// CreateEstimateParams (line ~110):
// Old: branch_id?: string | null;
// New:
branchId?: string | null;

// CreateWorkOrderParams (line ~159):
// Old: branch_id?: string;
// New:
branchId?: string;

// WorkOrderFilters (line ~169):
// Old: branch_id?: string;
// New:
branchId?: string;

// CreateCustomerParams — add (after ~last field before closing brace):
  branchId?: string | null;

// CreateVehicleParams — add (after ~last field before closing brace):
  branchId?: string | null;
```

#### 2. src/lib/types/inventory.ts
**File**: src/lib/types/inventory.ts
**Changes**: MODIFY — Add `branchId?: string | null` to 4 inventory Create*Params (NOT CreatePartParams — `parts_catalog` has no `branch_id` column)

```ts
// CreateMovementParams — add field:
  branchId?: string | null;

// CreateSupplierParams — add field:
  branchId?: string | null;

// CreatePurchaseOrderParams — add field:
  branchId?: string | null;

// CreateStockThresholdParams — add field:
  branchId?: string | null;
```

#### 3. src/lib/services/customer-service.ts
**File**: src/lib/services/customer-service.ts
**Changes**: MODIFY — Rename `options?.branch_id` → `options?.branchId`; add `resolveBranchId` to `createCustomer`; update `searchCustomers` options type

```ts
// Add import:
import { withBranchFilter, resolveBranchId } from "@/lib/supabase/with-branch";

// getCustomers function signature (line ~44):
// Old: branch_id?: string;
// New:
    branchId?: string;

// getCustomers filter (rename branch_id → branchId after Phase 3):
if (options?.branchId) query = withBranchFilter(query, options.branchId);

// searchCustomers options type (line ~563):
// Old: options?: { search?: string; page?: number; pageSize?: number; branch_id?: string }
// New:
//   options?: { search?: string; page?: number; pageSize?: number; branchId?: string }

// createCustomer — add resolve before insert block (~line 349):
  const resolvedBranchId = await resolveBranchId(supabase, orgId, params.branchId, { strict: false });
  // Then in insert, replace with resolvedBranchId
  branch_id: resolvedBranchId,
```

#### 4. src/lib/services/vehicle-service.ts
**File**: src/lib/services/vehicle-service.ts
**Changes**: MODIFY — Add `resolveBranchId` to `createVehicle`

```ts
// Update import (Phase 3 §5 already added withBranchFilter):
import { withBranchFilter, resolveBranchId } from "@/lib/supabase/with-branch";

// createVehicle — before the insert (around line ~164):
  const resolvedBranchId = await resolveBranchId(supabase, orgId, params.branchId, { strict: false });
  // Then in insert:
  branch_id: resolvedBranchId,
```

#### 5. src/lib/services/appointment-service.ts
**File**: src/lib/services/appointment-service.ts
**Changes**: MODIFY — Rename `params?.branch_id` → `params?.branchId`; add `resolveBranchId` to `createAppointment`

```ts
// Update import (Phase 3 already added withBranchFilter):
import { withBranchFilter, resolveBranchId } from "@/lib/supabase/with-branch";

// getAppointments function signature (line ~57):
// Old: branch_id?: string;
// New:
  branchId?: string;

// Filter usage (rename branch_id → branchId after Phase 3):
if (params?.branchId) query = withBranchFilter(query, params.branchId);

// createAppointment — add resolveBranchId (around line ~181):
  const resolvedBranchId = await resolveBranchId(supabase, orgId, params.branchId, { strict: false });
  // Replace: branch_id: params.branch_id ?? null,
  branch_id: resolvedBranchId,
```

#### 6. src/lib/services/estimate-service.ts
**File**: src/lib/services/estimate-service.ts
**Changes**: MODIFY — Rename `params?.branch_id` → `params?.branchId`; replace inline main branch resolution with `resolveBranchId`; add `resolveBranchId` to `createEstimate`

```ts
// Update import (Phase 3 already added withBranchFilter):
import { withBranchFilter, resolveBranchId } from "@/lib/supabase/with-branch";

// getEstimates function signature (line ~124):
// Old: branch_id?: string;
// New:
  branchId?: string;

// Filter usage (rename branch_id → branchId after Phase 3):
if (params?.branchId) query = withBranchFilter(query, params.branchId);

// createEstimate — add resolveBranchId (around line ~206):
  const resolvedBranchId = await resolveBranchId(supabase, orgId, params.branchId, { strict: false });
  // Replace: branch_id: params.branch_id ?? null,
  branch_id: resolvedBranchId,

// convertEstimateToWorkOrder — replace inline branch query (lines ~428-432):
  const resolvedBranchId = await resolveBranchId(supabase, orgId, undefined, { strict: false });
  // Replace: branch_id: branch?.id ?? null,
  branch_id: resolvedBranchId,
```

#### 7. src/lib/services/work-order-service.ts
**File**: src/lib/services/work-order-service.ts
**Changes**: MODIFY — Rename `filters?.branch_id` → `filters?.branchId`; replace `params.branch_id ?? null` with resolved branch; add `resolveBranchId` import

```ts
// Update import (Phase 3 already added withBranchFilter):
import { withBranchFilter, resolveBranchId } from "@/lib/supabase/with-branch";

// Filter usage (rename branch_id → branchId after Phase 3):
if (filters?.branchId) query = withBranchFilter(query, filters.branchId);

// createWorkOrder (around line ~208):
  const resolvedBranchId = await resolveBranchId(db, orgId, params.branchId, { strict: false });
  // Replace: branch_id: params.branch_id ?? null,
  branch_id: resolvedBranchId,
```

#### 8. src/lib/services/inventory-service.ts
**File**: src/lib/services/inventory-service.ts
**Changes**: MODIFY — Add `resolveBranchId` to inventory create functions

```ts
// Add import:
import { resolveBranchId } from "@/lib/supabase/with-branch";

// Each create function pattern:
  const resolvedBranchId = await resolveBranchId(db, orgId, params.branchId, { strict: false });
  branch_id: resolvedBranchId,
```

#### 9. src/lib/services/expense-service.ts
**File**: src/lib/services/expense-service.ts
**Changes**: MODIFY — Replace `params.branchId ?? null` with `resolveBranchId`

```ts
// Add import:
import { resolveBranchId } from "@/lib/supabase/with-branch";

// createExpense (around line ~347-350):
  const resolvedBranchId = await resolveBranchId(db, orgId, params.branchId, { strict: false });
  // Replace: branch_id: params.branchId ?? null,
  branch_id: resolvedBranchId,
```

#### 10. API route callers — update `branch_id` → `branchId` in objects passed to renamed service functions
**Files**: `customers/route.ts`, `appointments/route.ts`, `estimates/route.ts`, `work-orders/route.ts` (4 MODIFY)

```ts
// Pattern for customers/route.ts (line ~24):
// Old: const commonOptions = { page, pageSize, ...(branchId ? { branch_id: branchId } : {}) };
// New:
const commonOptions = { page, pageSize, ...(branchId ? { branchId } : {}) };

// Pattern for appointments/route.ts (line ~21):
// Old: branch_id: searchParams.get("branch_id") ?? undefined,
// New:
branchId: searchParams.get("branch_id") ?? undefined,

// Pattern for estimates/route.ts (line ~16):
// Old: branch_id: searchParams.get("branch_id") ?? undefined,
// New:
branchId: searchParams.get("branch_id") ?? undefined,

// Pattern for work-orders/route.ts (line ~23):
// Old: branch_id: searchParams.get("branch_id") ?? undefined,
// New:
branchId: searchParams.get("branch_id") ?? undefined,
```

**Note**: URL query param name `branch_id` is unchanged — only the object property name passed to service functions changes. The URL convention remains `branch_id=`.

### Success Criteria:

#### Automated Verification:
- [x] Type checking passes: `npm run validate:types`
- [x] All renamed params compile: no remaining `branch_id?:` in `CreateAppointmentParams`, `CreateEstimateParams`, `CreateWorkOrderParams`, `WorkOrderFilters` — `grep -E "branch_id.*string" src/lib/types/service-params.ts` returns only expected DB column references
- [x] CreateCustomerParams has `branchId`: `grep -A3 "interface CreateCustomerParams" src/lib/types/service-params.ts | grep branchId` matches
- [x] CreateVehicleParams has `branchId`: same grep pattern
- [x] `resolveBranchId` imported in all create-touch services: grep for resolveBranchId in customer-service, vehicle-service, expense-service, work-order-service, estimate-service, inventory-service, appointment-service returns ≥ 1 each
- [x] No remaining inline `is_main` queries in estimate-service: `grep -n "is_main" src/lib/services/estimate-service.ts` returns only the new utility import
- [x] No `branch_id` property in API route callers to renamed services: `grep -n "branch_id:" src/app/api/organizations/*/route.ts` returns only URL search param reads (`.get("branch_id")`), not property assignments
- [x] No remaining `branch_id` in searchCustomers options: `grep -B2 -A2 "searchCustomers" src/lib/services/customer-service.ts` shows branchId not branch_id

#### Manual Verification:
- [ ] Customer create inserts include `branch_id` (no longer invisible in branch-filtered views)
- [ ] Vehicle create inserts include `branch_id`
- [ ] Inventory creates include `branch_id`
- [ ] `convertEstimateToWorkOrder` uses `resolveBranchId` instead of inline main branch query
- [ ] `createWorkOrder` uses `resolveBranchId` instead of `params.branch_id ?? null`
- [ ] `createExpense` uses `resolveBranchId` instead of `params.branchId ?? null`
- [ ] `createAppointment` uses `resolveBranchId` instead of `params.branch_id ?? null`
- [ ] `createEstimate` uses `resolveBranchId` instead of `params.branch_id ?? null`
- [ ] All type-level `branch_id` params renamed to `branchId` — no type errors
- [ ] API routes still fetch `branch_id` from URL query params — URL convention unchanged

## Ordering Constraints

Phase 1 (Foundation) must complete before any other phase — all phases import from it. Phases 2-3 could theoretically be parallelized but are sequential per the slice model. Phase 4 must follow Phases 2-3 because it renames parameters that Phase 2-3's filter-sites reference.

## Verification Notes

- **Build check**: `npm run build` must succeed after each phase — the param rename in Phase 4 touches many files and will cascade type errors
- **Previous typed-generic regression**: `bacf79b8` — do NOT attempt `T extends PostgrestFilterBuilder<...>` constraint. Keep `<T>` with `as T` return
- **withCache ordering**: `54f26bf0` — when wrapping withBranchFilter queries in `withCache`, the supabase client must be created BEFORE entering the cached scope. This pattern must be preserved in all refactored services
- **CreateCustomerParams branch_id**: `customer-service.ts:349` — the insert must now include `branch_id` resolved from `resolveBranchId`. Without this, new customers remain invisible in branch-filtered views
- **No new `(as any)` casts**: The whole point is eliminating casts — the shared utility's `as T` return is the only acceptable cast
- **Page-level normalization retained**: All 10 pages continue to normalize `"all" → null`. This is intentional — redundant but safe.

## Performance Considerations

No performance regression. `withBranchFilter` is a no-op when `branchId` is falsy or `"all"`. When active, it adds `.eq("branch_id", branchId)` — the same SQL condition the previous inline patterns produced. The `resolveBranchId` helper adds one query per create, matching the existing pattern in `bay-view-actions.ts:605-615`.

## Migration Notes

No schema changes — database `branch_id` columns are already nullable. No data migration needed. The Create\*Params `branchId` field is optional; existing callers that don't provide it will get the main-branch fallback. Callers that explicitly pass `null` get the same fallback. The only behavioral change is that new records will always have a `branch_id` (either from the caller or resolved from main branch), eliminating the invisible-record bug.

## Pattern References

- `report-service.ts:33-35` — `withBranchFilter<T>` generic helper — template for shared utility
- `bay-view-actions.ts:605-615` — `resolveBranchId` pattern (throws on missing) — template for strict mode
- `estimate-service.ts:428-432` — `resolveBranchId` pattern (returns null) — template for non-strict mode
- `report-service.ts` all functions — pattern for `withCache` + `withBranchFilter` ordering (client outside cached scope)

## Developer Context

**Directional confirmation (2026-06-03):** All 4 directions confirmed — (1) camelCase branchId param naming, (2) withBranchFilter(T, branchId?) with internal sentinel, (3) resolveBranchId as shared helper, (4) page-level normalization kept as defensive guard.

**Ambiguity resolution (2026-06-03):** `resolveBranchId` behavior when no main branch — configurable `{ strict?: boolean }` option chosen (default: strict=true, throws ValidationError).

## Plan History

- Phase 1: Foundation — approved as generated
- Phase 2: Report + Bay View — approved as generated
- Phase 3: Remaining 9 services — approved as generated
- Phase 4: Param standardization + Create\*Params enforcement — approved as generated

## Plan Review (Step 8)

_Independent post-finalization review by artifact-code-reviewer and artifact-coverage-reviewer subagents. Findings triaged at Step 9._

| source   | plan-loc          | codebase-loc                | severity   | dimension             | finding   | recommendation   | resolution         |
| -------- | ----------------- | --------------------------- | ---------- | --------------------- | --------- | ---------------- | ------------------ |
| coverage | ## Verification Notes §3 | <n/a> | blocker | verification-coverage | Note "withCache ordering: supabase client must be created BEFORE entering the cached scope. This pattern must be preserved in all refactored services" — no Success Criteria bullet exercises withCache ordering in any phase; no code-level guard or test enforces the invariant | Add an automated criteria bullet under Phase 2's Automated Verification that greps for the ordering pattern, or add a withCache test case to Phase 3 manual verification | applied: added grep check to Phase 2 Automated Verification |
| code     | Phase 3 §1 | src/lib/services/appointment-service.ts:9 | concern | actionability | Plan says add import "after line 9" but line 9 starts a multi-line type import block (lines 9-15). Inserting here would split the block and cause a syntax error | Change instruction to "after line 15 (after the type import block)" or "after the last import" | applied: updated to "after last value import, before type imports" |
| code     | Phase 3 §5 | src/lib/services/vehicle-service.ts:5 | concern | actionability | Plan says add import "after line 5, before type imports" but line 5 opens a multi-line value import (lines 5-8). Following the literal line reference would produce a syntax error | Change "after line 5" to "after line 8 (after the form-validation import)" | applied: updated to "after line 8, after form-validation import" |
| code     | Phase 4 §4 | src/lib/services/vehicle-service.ts:9 | suggestion | code-quality | Phase 4 adds a separate `import { resolveBranchId }` line, but Phase 3 §5 already added `import { withBranchFilter }` from the same module — duplicate imports | Update the Phase 3 import line to include both: `import { withBranchFilter, resolveBranchId }` | applied: updated to combined import |
| coverage | ## Verification Notes §6 | <n/a> | suggestion | verification-coverage | Note "Page-level normalization retained: All 10 pages continue to normalize `"all"→null`" — no Success Criteria bullet confirms the guard is untouched | Add a Phase 4 automated criteria bullet that greps for the guard pattern remaining in pages | deferred: page-level guard is intentionally redundant; grep would be noisy |
| coverage | ## Pattern References §10 | <n/a> | suggestion | verification-coverage | Reference "report-service.ts all functions — pattern for withCache + withBranchFilter ordering" — no Success Criteria bullet or code mirror asserts the cached-scope ordering; overlaps the same gap as Verification Notes §3 | Same as §3 — add ordering verification or manual inspection step | dismissed: covered by the same withCache check added for §3 |

## References

- `.rpiv/artifacts/research/2026-06-03_16-40-23_multi-branch-architecture.md` — Full research artifact
- `.rpiv/artifacts/discover/2026-06-03_16-08-12_multi-branch-architecture.md` — FRD
- `.rpiv/artifacts/architecture-reviews/tolom_shared-helpers-dry-review.md` — DRY analysis
