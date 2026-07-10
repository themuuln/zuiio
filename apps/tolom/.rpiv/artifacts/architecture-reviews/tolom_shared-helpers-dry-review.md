---
template_version: 1
date: 2026-05-28T21:55:44+0800
author: Temuulen Undrakhbayar
commit: 8aff3df
branch: main
repository: tolom
target: src/lib
target_kind: module
layer_count: 7
unresolved_finding_count: 16
status: ready
tags: [architecture-review, src-lib, shared-helpers, forms, supabase, dry]
last_updated: 2026-05-28T21:55:44+0800
last_updated_by: Temuulen Undrakhbayar
last_updated_note: "Plan approved — 5 phases, 15 findings, ready for blueprint"
---

# Architecture review — src/lib shared helpers

Reviewing the shared infrastructure layer (`src/lib/`) in the TOLOM codebase — form helpers, Supabase client setup, validation schemas, caching, API infrastructure, and the service/query patterns that consume them. Triggered by the need to make common helpers DRY, cleaner, and more reliable across 86 files (~23K LOC).

---

## Conventions

### Finding shape

Each finding is a level-3 heading `### L<layer>-<seq> — <title>` followed by the fields below.

| Field | Meaning |
|---|---|
| **Evidence** | `file.ext:lineA-lineB` (+ short quote when useful) |
| **Current state** | what the code does today |
| **Desired state** | what we want it to look like |
| **Proposed improvement** | concrete action (rename, extract, merge, split, delete) |
| **Severity** | Low / Med / High — how wrong this is today |
| **Effort** | S / M / L — bounded changes ship cheaply |
| **Blast radius** | `internal` / `public-API` / `on-disk` / `cross-module` |
| **Class** | `polish` (rename / refactor / DRY) vs `redesign` (structural shift) |
| **Status** | `open` / `accepted` / `rejected` / `deferred` / `withdrawn` |
| **Depends on** | other finding IDs that must land first |
| **Cross-cut tag** | optional — see "Cross-cutting themes" |

### Status legend

- `open` — flagged, not yet triaged
- `accepted` — will land; includes the chosen option summary
- `rejected` — declined with reason inline
- `deferred` — accepted in principle but punted post-release
- `withdrawn` — initial diagnosis turned out incorrect; kept for audit

### Layers (top → down)

| # | Layer | Files |
|---|---|---|
| 0 | Public Surface | `types/index.ts`, `utils.ts`, `errors.ts` |
| 1 | Form & Validation | `form-ux.ts`, `form-validation.ts`, `validations.ts`, `validation/auth-schemas.ts` |
| 2 | Supabase Clients | `supabase/client.ts`, `supabase/server.ts`, `supabase/middleware.ts`, `supabase/service-role.ts` |
| 3 | Caching & Keys | `cache/keys.ts`, `cache/server.ts`, `cache/with-cache.ts`, `queries/keys.ts` |
| 4 | API Infrastructure | `api-handler.ts`, `rate-limit.ts`, `audit.ts`, `auth-redirect.ts`, `portal-auth.ts`, `toast-utils.ts` |
| 5 | Service Patterns | 40 files in `services/` |
| 6 | Client Queries | 21 files in `queries/` |

---

## Methodology principles

_Principles emerge during Step 5 triage and are captured at Step 6. Patterns that govern multiple decisions get named here; one block per principle._

---

## Layer 0 — Public Surface

Files: `types/index.ts` (927 LOC), `utils.ts` (94 LOC), `errors.ts` (106 LOC)

This layer is the vocabulary foundation — every other layer imports from it. `types/index.ts` defines 100+ type exports across 6+ domains. `utils.ts` provides class merging, plate formatting, currency formatting, and cookie helpers. `errors.ts` defines the AppError hierarchy and API error handler.

### L0-01 — types/index.ts is a 927 LOC god-file

**Evidence**

`types/index.ts:1-927` (entire file)

**Current state**

One monolithic file mixing DB type aliases, API response wrappers, 20+ service parameter types, dashboard types, inventory types, and composite types.

**Desired state**

Domain-grouped files: `types/core.ts` (DB aliases + API wrappers), `types/service-params.ts` (Create*/Update* params), `types/dashboard.ts`, `types/inventory.ts`, `types/composite.ts` (WorkOrderDetail, VehicleDetail, etc.).

**Proposed improvement**

Split into 5 domain-grouped files with a barrel `types/index.ts` re-exporting everything for backward compatibility.

- **Severity:** Med
- **Effort:** M
- **Blast radius:** `internal` (barrel re-exports preserve import paths)
- **Class:** polish
- **Status:** **accepted** — split by domain with barrel re-export
- **Depends on:** none
- **Cross-cut tag:** `T1-file-organization`

### L0-02 — normalizePlate duplicates normalizeMongolianPlate

**Evidence**

`utils.ts:19` — `return plate.replace(/[\s\-–—._/\\]/g, "").toUpperCase()`
`form-validation.ts:74` — `return transliterateMongolianPlate(plate.replace(/[\s\-–—._/\\]/g, ""))`

**Current state**

Two functions with overlapping logic. `normalizePlate` strips separators + uppercases. `normalizeMongolianPlate` does the same + transliterates Latin→Cyrillic. Smartcar route has a 3rd local copy.

**Desired state**

Single source of truth in `form-validation.ts`. All plate normalization goes through `normalizeMongolianPlate`.

**Proposed improvement**

Remove `normalizePlate` from `utils.ts`. Update `vehicle-service.ts` and smartcar route to use `normalizeMongolianPlate` from `form-validation.ts`. Keep `formatPlateNumber` as a display wrapper.

- **Severity:** Med
- **Effort:** S
- **Blast radius:** `internal`
- **Class:** polish
- **Status:** **accepted** — consolidate into form-validation.ts
- **Depends on:** none
- **Cross-cut tag:** `T2-dry-helpers`

### L0-03 — Insert/Update type aliases use Tables<> instead of TablesInsert<>

**Evidence**

`types/index.ts:107` — `type ServiceCatalogInsert = Tables<"service_catalog">`
`types/index.ts:108` — `type ServiceCatalogUpdate = Tables<"service_catalog">`
Also: SupplierInsert/Update, PurchaseOrderInsert/Update, PurchaseOrderItemInsert/Update, StockThresholdInsert/Update, PartsCarsInsert/Update, PartsCarPartsInsert/Update.

**Current state**

8 type aliases for Insert/Variant types are identical to Row types — they provide no type safety for insert vs read operations.

**Desired state**

Insert types use `TablesInsert<>`, Update types use `Partial<Tables<>>` or a dedicated update type.

**Proposed improvement**

Fix each alias: `type ServiceCatalogInsert = TablesInsert<"service_catalog">`. For Update types, use `Partial<Tables<"service_catalog">>` or remove if unused.

- **Severity:** Low
- **Effort:** S
- **Blast radius:** `internal` (type-level only)
- **Class:** polish
- **Status:** **accepted** — fix to TablesInsert/Partial
- **Depends on:** none
- **Cross-cut tag:** `T3-type-safety`

### L0-04 — handleApiError couples errors.ts to Next.js

**Evidence**

`errors.ts:72` — `export function handleApiError(error: unknown): NextResponse`

**Current state**

`errors.ts` imports `NextResponse` from `next/server` and returns it directly. This couples the error module to Next.js.

**Desired state**

Errors module is framework-agnostic. `handleApiError` returns a plain error object; `api-handler.ts` constructs the `NextResponse`.

**Proposed improvement**

Extract a `toApiErrorResponse(error: unknown)` function in `errors.ts` that returns `{ status, body }`. Move `NextResponse` construction to `api-handler.ts`.

- **Severity:** Low
- **Effort:** S
- **Blast radius:** `internal`
- **Class:** polish
- **Status:** **accepted** — decouple from NextResponse
- **Depends on:** none
- **Cross-cut tag:** `T4-framework-coupling`

### Layer 0 — tally

| Status | Count |
|---|---|
| accepted | 4 |
| rejected | 0 |
| deferred | 0 |
| withdrawn | 0 |

Cross-cutting tags introduced: `T1-file-organization`, `T2-dry-helpers`, `T3-type-safety`, `T4-framework-coupling`.
Cross-cutting tags reused: none.

Dependency edges within Layer 0: none.

---

## Layer 1 — Form & Validation

Files: `form-ux.ts` (86 LOC), `form-validation.ts` (110 LOC), `validations.ts` (308 LOC), `validation/auth-schemas.ts` (135 LOC)

This layer handles form UX helpers, standalone validators, Zod schemas, and auth form infrastructure.

### L1-01 — validations.ts is 308 LOC of dead code

**Evidence**

`rg "from ['\"]@/lib/validations['\"]"` — 0 results across entire codebase.

**Current state**

308 LOC of Zod schemas (createCustomerSchema, createWorkOrderSchema, etc.) and exported types (CreateCustomerInput, etc.) never imported anywhere.

**Desired state**

Dead code removed.

**Proposed improvement**

Delete `validations.ts` entirely.

- **Severity:** High
- **Effort:** S
- **Blast radius:** `internal`
- **Class:** polish
- **Status:** **accepted** — delete dead code
- **Depends on:** none
- **Cross-cut tag:** `T2-dry-helpers`

### L1-02 — FieldErrors type duplicated, mergeFieldErrors unused

**Evidence**

`form-validation.ts:97` — `export type FieldErrors = Record<string, string>`
`form-validation.ts:102` — `mergeFieldErrors` has 0 consumers.

**Current state**

`FieldErrors` type defined in both `form-validation.ts` and `auth-schemas.ts`. `mergeFieldErrors` is dead code.

**Desired state**

Single `FieldErrors` type. Remove dead `mergeFieldErrors`.

**Proposed improvement**

Remove `FieldErrors` and `mergeFieldErrors` from `form-validation.ts`.

- **Severity:** Low
- **Effort:** S
- **Blast radius:** `internal`
- **Class:** polish
- **Status:** **accepted** — remove from form-validation.ts
- **Depends on:** L1-01
- **Cross-cut tag:** `T2-dry-helpers`

### L1-03 — flattenFieldErrors + ActionState misplaced in auth-schemas.ts

**Evidence**

`auth-schemas.ts:121-135` — `flattenFieldErrors` + `ActionState` defined here.
Used by 8+ non-auth forms: `new-vehicle-sheet.tsx`, `new-expense-sheet.tsx`, `new-customer-dialog.tsx`, etc.

**Current state**

Form error infrastructure lives in `validation/auth-schemas.ts` but is used broadly across auth and non-auth forms.

**Desired state**

Form error helpers live in the form layer.

**Proposed improvement**

Move `flattenFieldErrors` and `ActionState` from `auth-schemas.ts` into `form-validation.ts`. Update imports.

- **Severity:** Med
- **Effort:** S
- **Blast radius:** `internal`
- **Class:** polish
- **Status:** **accepted** — consolidate into form layer
- **Depends on:** L1-02
- **Cross-cut tag:** `T1-file-organization`

### Layer 1 — tally

| Status | Count |
|---|---|
| accepted | 3 |
| rejected | 0 |
| deferred | 0 |
| withdrawn | 0 |

Cross-cutting tags reused: `T1-file-organization`, `T2-dry-helpers`.

Dependency edges within Layer 1:
- L1-02 depends on L1-01
- L1-03 depends on L1-02

---

## Layer 2 — Supabase Clients

Files: `supabase/client.ts` (13 LOC), `supabase/server.ts` (39 LOC), `supabase/middleware.ts` (85 LOC), `supabase/service-role.ts` (30 LOC)

This layer provides Supabase client creation for browser, server, middleware, and service-role contexts. `server.ts` is the most imported (54 consumers). `middleware.ts` also handles auth routing logic.

### L2-01 — env() helper duplicated across Supabase files

**Evidence**

`server.ts:31` — `function env(key: string): string { ... }`
`middleware.ts:79` — `function env(key: string): string { ... }` (identical)
`client.ts:7-10` — inline env checks instead of using env()

**Current state**

3 different env access patterns: duplicated env() in server.ts and middleware.ts, inline checks in client.ts.

**Desired state**

Single `env()` helper in `supabase/env.ts`, imported by all 4 files.

**Proposed improvement**

Extract env() into `supabase/env.ts`. Update imports in client.ts, server.ts, middleware.ts, service-role.ts.

- **Severity:** Low
- **Effort:** S
- **Blast radius:** `internal`
- **Class:** polish
- **Status:** **accepted** — extract to shared env.ts
- **Depends on:** none
- **Cross-cut tag:** `T2-dry-helpers`

### L2-02 — middleware.ts mixes session refresh with auth routing

**Evidence**

`middleware.ts:40-70` — route matching logic (isPublicRoute, isAuthRoute, isInvoiceRoute, etc.)
`middleware.ts:1-39` — Supabase client creation + session refresh

**Current state**

`updateSession` does both: creates Supabase client for session refresh AND handles auth routing with 10+ route checks.

**Desired state**

Session refresh and auth routing are separate concerns. Route matching extracted to a dedicated module.

**Proposed improvement**

Extract route-matching into `supabase/auth-routes.ts` (isPublicRoute, isAuthRoute, etc.). Keep `updateSession` focused on session refresh only.

- **Severity:** Med
- **Effort:** S
- **Blast radius:** `internal`
- **Class:** polish
- **Status:** **accepted** — separate concerns
- **Depends on:** L2-01
- **Cross-cut tag:** `T1-file-organization`

### Layer 2 — tally

| Status | Count |
|---|---|
| accepted | 2 |
| rejected | 0 |
| deferred | 0 |
| withdrawn | 0 |

Cross-cutting tags reused: `T1-file-organization`, `T2-dry-helpers`.

Dependency edges within Layer 2:
- L2-02 depends on L2-01

---

## Layer 3 — Caching & Keys

Files: `cache/keys.ts` (120 LOC), `cache/server.ts` (101 LOC), `cache/with-cache.ts` (50 LOC), `queries/keys.ts` (188 LOC)

Two parallel key systems serve different runtime contexts: `cache/keys.ts` provides string-based server cache tags (23 consumers), `queries/keys.ts` provides tuple-based React Query keys (22 consumers). `cache/server.ts` has invalidation helpers. `cache/with-cache.ts` wraps `unstable_cache`.

### L3-01 — cache/server.ts invalidation helpers are unused

**Evidence**

`rg "from ['\"]@/lib/cache/server['\"]" — 0 results`

**Current state**

101 LOC of invalidation helpers (invalidateWorkOrderCache, invalidateOrgCache, etc.) that nobody imports. Services call `revalidateTag(cacheTags.xxx(orgId), "max")` directly.

**Desired state**

Services use the centralized invalidation helpers instead of repeating revalidateTag calls.

**Proposed improvement**

Wire up cache/server.ts helpers in all services. Replace inline `revalidateTag` calls with the appropriate helper.

- **Severity:** Med
- **Effort:** M
- **Blast radius:** `internal`
- **Class:** polish
- **Status:** **accepted** — wire up and use
- **Depends on:** none
- **Cross-cut tag:** `T2-dry-helpers`

### L3-02 — Two parallel key systems (accepted duplication)

**Evidence**

`cache/keys.ts` — string-based server tags: `customers: (orgId) => \"customers:${orgId}\"`
`queries/keys.ts` — tuple-based React Query keys: `customerKeys.all = (orgId) => [\"organizations\", orgId, \"customers\"]`

**Current state**

Two separate key systems with overlapping entity coverage but different formats for different runtime contexts.

**Desired state**

Accept the duplication — server cache tags and React Query keys serve different purposes and formats.

**Proposed improvement**

No change. The duplication is intentional and appropriate.

- **Severity:** Low
- **Effort:** S
- **Blast radius:** `internal`
- **Class:** polish
- **Status:** **rejected** — keep separate, duplication is justified
- **Depends on:** none
- **Cross-cut tag:** `T2-dry-helpers`

### Layer 3 — tally

| Status | Count |
|---|---|
| accepted | 1 |
| rejected | 1 |
| deferred | 0 |
| withdrawn | 0 |

Cross-cutting tags reused: `T2-dry-helpers`.

Dependency edges within Layer 3: none.

---

## Layer 4 — API Infrastructure

Files: `api-handler.ts` (120 LOC), `rate-limit.ts` (87 LOC), `audit.ts` (140 LOC), `auth-redirect.ts` (25 LOC), `portal-auth.ts` (112 LOC), `toast-utils.ts` (25 LOC)

`api-handler.ts` is the most imported (87 consumers) — provides `createRouteHandler` and `createSimpleRouteHandler` factories. `rate-limit.ts` provides in-memory rate limiting. `audit.ts` provides audit logging. `portal-auth.ts` handles portal authentication for 7 portal API routes.

### L4-01 — rate-limit.ts uses in-memory Map (broken in serverless)

**Evidence**

`rate-limit.ts:11` — `const store = new Map<string, RateLimitEntry>()`

**Current state**

In-memory rate limiter that resets on every serverless cold start. Rate limiting is effectively broken in production.

**Desired state**

Persistent rate limiting using Upstash Redis or Vercel KV.

**Proposed improvement**

Replace in-memory store with Upstash Redis. Keep in-memory as dev-only fallback when REDIS_URL is not set.

- **Severity:** High
- **Effort:** M
- **Blast radius:** `internal`
- **Class:** redesign
- **Status:** **accepted** — replace with Redis-based
- **Depends on:** none
- **Cross-cut tag:** `T4-framework-coupling`

### L4-02 — Deprecated checkRateLimit still exported

**Evidence**

`rate-limit.ts:83` — `export function checkRateLimit(ip: string)` marked `@deprecated`
0 external consumers.

**Current state**

Dead deprecated export adding noise to the API surface.

**Desired state**

Clean API surface with no deprecated exports.

**Proposed improvement**

Remove `checkRateLimit` function.

- **Severity:** Low
- **Effort:** S
- **Blast radius:** `internal`
- **Class:** polish
- **Status:** **accepted** — remove deprecated export
- **Depends on:** none
- **Cross-cut tag:** `T2-dry-helpers`

### Layer 4 — tally

| Status | Count |
|---|---|
| accepted | 2 |
| rejected | 0 |
| deferred | 0 |
| withdrawn | 0 |

Cross-cutting tags reused: `T2-dry-helpers`, `T4-framework-coupling`.

Dependency edges within Layer 4: none.

---

## Layer 5 — Service Patterns

40 files in `services/` (~17K LOC). Every CRUD service follows the same template: `createClient()` → exists check → field mapping → insert/update → audit log → `revalidateTag`. The soft-delete pattern is identical across customer, vehicle, expense, and inventory services.

### L5-01 — Field-by-field update mapping repeated 67+ times

**Evidence**

`inventory-service.ts` — 21 instances of `if (params.x !== undefined) updates.x = ...`
`expense-service.ts` — 12 instances
`vehicle-service.ts` — 8 instances
`customer-service.ts` — 5 instances

**Current state**

Every update function manually maps each parameter to a database column with an `if (params.x !== undefined)` guard. 67+ total across 10 services.

**Desired state**

A `buildUpdates<T>(params, fieldMap)` helper that takes a params object and a field mapping, returns the updates Record.

**Proposed improvement**

Extract `buildUpdates()` into a shared service utility. Each service provides a field map; the helper handles the undefined checks and trimming.

- **Severity:** High
- **Effort:** M
- **Blast radius:** `internal`
- **Class:** polish
- **Status:** **accepted** — extract buildUpdates helper
- **Depends on:** none
- **Cross-cut tag:** `T2-dry-helpers`

### L5-02 — CRUD scaffolding duplicated across 40 services

**Evidence**

`customer-service.ts:190-240`, `vehicle-service.ts:200-230`, `expense-service.ts:250-280` — identical patterns for soft-delete.
Every service: `createClient()` → exists check → field mapping → insert/update → audit log → `revalidateTag`.

**Current state**

40 services with duplicated CRUD scaffolding. Each repeats 5-10 lines of identical boilerplate.

**Desired state**

A base service pattern: `createOrgScopedService(table, tags)` returns `{ get, getById, create, update, softDelete }` with built-in audit, cache, validation.

**Proposed improvement**

Extract a base service factory in `services/base.ts`. Each domain service extends it with custom logic.

- **Severity:** High
- **Effort:** L
- **Blast radius:** `internal`
- **Class:** redesign
- **Status:** **accepted** — extract base service pattern
- **Depends on:** L5-01
- **Cross-cut tag:** `T2-dry-helpers`

### Layer 5 — tally

| Status | Count |
|---|---|
| accepted | 2 |
| rejected | 0 |
| deferred | 0 |
| withdrawn | 0 |

Cross-cutting tags reused: `T2-dry-helpers`.

Dependency edges within Layer 5:
- L5-02 depends on L5-01

---

## Layer 6 — Client Queries

21 files in `queries/` (~3K LOC). Every React Query hook repeats: `fetch(\`/api/organizations/${orgId}/...\`)`, check `res.ok`, unwrap `json.data.data`, return. 61 fetch+unwrap instances across hooks.

### L6-01 — Query hook boilerplate repeated 61 times

**Evidence**

`use-expenses.ts` — 10 fetch+unwrap instances
`use-inventory.ts` — 25 fetch+unwrap instances
`use-service-reminders.ts` — 6 instances

**Current state**

Every query hook manually constructs fetch URLs, checks response status, unwraps nested JSON, and handles errors. 61 total instances.

**Desired state**

A `createOrgQuery<T>(orgId, path, keyFn)` helper that handles fetch, unwrap, error handling. Each hook becomes 3-5 lines.

**Proposed improvement**

Extract a query factory utility in `queries/factory.ts`. Each hook calls the factory with its endpoint and key function.

- **Severity:** Med
- **Effort:** M
- **Blast radius:** `internal`
- **Class:** polish
- **Status:** **accepted** — extract query factory
- **Depends on:** none
- **Cross-cut tag:** `T2-dry-helpers`

### Layer 6 — tally

| Status | Count |
|---|---|
| accepted | 1 |
| rejected | 0 |
| deferred | 0 |
| withdrawn | 0 |

Cross-cutting tags reused: `T2-dry-helpers`.

Dependency edges within Layer 6: none.

---

## Cross-cutting themes

Cross-cut threads surfaced during layer-by-layer review. Each thread ties multiple findings together.

### T1 — File Organization (active)

**Findings:** L0-01, L1-03, L2-02

Several files mix unrelated concerns: `types/index.ts` bundles 6+ domains, `auth-schemas.ts` houses form infrastructure used outside auth, `middleware.ts` mixes session refresh with route matching. Splitting by concern improves navigability and reduces merge conflicts.

### T2 — DRY Helpers (active)

**Findings:** L0-02, L0-03, L1-01, L1-02, L3-01, L4-02, L5-01, L5-02, L6-01

The dominant theme. Dead code (validations.ts 308 LOC, cache/server.ts 101 LOC), duplicated logic (normalizePlate, env(), FieldErrors), and repeated boilerplate (67+ field mappings, 61 fetch+unwrap patterns, 40 identical CRUD scaffolds). Extracting shared helpers (buildUpdates, base service, query factory) eliminates the most repetition.

### T3 — Type Safety (active)

**Findings:** L0-03

8 Insert/Update type aliases incorrectly use `Tables<>` instead of `TablesInsert<>`, providing no type safety for insert vs read operations. Low effort, high value for preventing column mismatches.

### T4 — Framework Coupling (active)

**Findings:** L0-04, L4-01

Two coupling points: `errors.ts` returns `NextResponse` directly (should be framework-agnostic), and `rate-limit.ts` uses in-memory Map (broken in serverless). Both need decoupling for reliability and testability.

---

## Consolidated polish plan

5 phases, ordered by dependency and leverage. Each phase is blueprint-consumable.

### Phase 1 — Dead Code & Quick Fixes

**Goal:** Remove dead code and fix type aliases — zero-risk cleanup that shrinks the codebase.

**Findings (4):** L0-03, L1-01, L1-02, L4-02

**Files touched (4):** `types/index.ts`, `validations.ts` (delete), `form-validation.ts`, `rate-limit.ts`

**Blast-radius mix:** internal: 4; public-API: 0; on-disk: 0; cross-module: 0.

**Class mix:** polish: 4; redesign: 0.

**Coordination:** none.

**Risk callouts:** None — pure deletions and type-level fixes.

### Phase 2 — Form & Validation Consolidation

**Goal:** Consolidate form helpers into a single layer. Move flattenFieldErrors + ActionState from auth-schemas.ts into form-validation.ts.

**Findings (2):** L1-03, L0-02

**Files touched (15+):** `form-validation.ts`, `auth-schemas.ts`, `utils.ts`, + 12 consumer files needing import updates.

**Blast-radius mix:** internal: 15; public-API: 0; on-disk: 0; cross-module: 0.

**Class mix:** polish: 2; redesign: 0.

**Coordination:** none.

**Risk callouts:** Import path changes across 12+ files — batch with a single search-replace.

### Phase 3 — Structural Reorganization

**Goal:** Split god-files and reorganize Supabase clients by concern.

**Findings (3):** L0-01, L2-01, L2-02

**Files touched (8):** `types/index.ts` (split into 5), `types/core.ts` (new), `types/service-params.ts` (new), `types/dashboard.ts` (new), `types/inventory.ts` (new), `types/composite.ts` (new), `supabase/env.ts` (new), `supabase/auth-routes.ts` (new), `supabase/middleware.ts`, `supabase/server.ts`, `supabase/client.ts`, `supabase/service-role.ts`.

**Blast-radius mix:** internal: 8; public-API: 0; on-disk: 0; cross-module: 0.

**Class mix:** polish: 2; redesign: 1.

**Coordination:** none.

**Risk callouts:** types/index.ts barrel re-exports must preserve all existing import paths. Verify with `npm run build` after split.

### Phase 4 — Service Layer DRY

**Goal:** Extract buildUpdates helper and base service pattern to eliminate 67+ field mappings and 40 identical CRUD scaffolds.

**Findings (2):** L5-01, L5-02

**Files touched (42):** `services/base.ts` (new), `services/build-updates.ts` (new), + 40 service files.

**Blast-radius mix:** internal: 42; public-API: 0; on-disk: 0; cross-module: 0.

**Class mix:** polish: 1; redesign: 1.

**Coordination:** none.

**Risk callouts:** Base service pattern must preserve existing API signatures. Each service migration should be incremental — migrate one service at a time, verify with tests.

### Phase 5 — Query Factory & Rate Limiter

**Goal:** Extract query factory to DRY 61 fetch+unwrap patterns. Replace in-memory rate limiter with Redis-based.

**Findings (3):** L6-01, L4-01, L0-04

**Files touched (25):** `queries/factory.ts` (new), `queries/use-*.ts` (21 files), `rate-limit.ts`, `errors.ts`, `api-handler.ts`.

**Blast-radius mix:** internal: 23; public-API: 0; on-disk: 0; cross-module: 2 (errors.ts → api-handler.ts contract change).

**Class mix:** polish: 2; redesign: 1.

**Coordination:** none.

**Risk callouts:** Redis rate limiter requires Upstash/Vercel KV setup. errors.ts → api-handler.ts decoupling changes the error handling contract — verify all API routes still return correct status codes.

### Dependency graph (phase-level)

```
Phase 1 (Dead Code & Quick Fixes)   Phase 2 (Form Consolidation)
         \                                /
          \                              /
           v                            v
            Phase 3 (Structural Reorg)
                        |
                        v
            Phase 4 (Service Layer DRY)
                        |
                        v
            Phase 5 (Query Factory & Rate Limiter)
```

Phases 1 and 2 are independent and can run in parallel. Phase 3 depends on Phase 1 (types split needs dead code removed first). Phase 4 depends on Phase 2 (base service needs consolidated form helpers). Phase 5 depends on Phase 4 (query factory benefits from service patterns).

### Phase scope summary

| Phase | Findings | Files | Blast-radius mix | Coordination |
|---|---|---|---|---|
| 1 — Dead Code & Quick Fixes | 4 | 4 | internal: 4 | none |
| 2 — Form Consolidation | 2 | 15 | internal: 15 | none |
| 3 — Structural Reorg | 3 | 12 | internal: 8 | none |
| 4 — Service Layer DRY | 2 | 42 | internal: 42 | none |
| 5 — Query Factory & Rate Limiter | 3 | 25 | internal: 23, cross-module: 2 | none |
| **Total** | **14** | **~50** | — | — |

### Risk callouts (cross-phase)

1. Phase 3 types split must preserve barrel re-exports — run `npm run build` after every sub-split.
2. Phase 4 service migration should be incremental — one service at a time, verify tests pass.
3. Phase 5 Redis rate limiter requires infrastructure setup (Upstash/Vercel KV) before code changes.

### Final tally

| Layer | Findings | Accepted | Rejected | Withdrawn |
|---|---|---|---|---|
| L0 — Public Surface | 4 | 4 | 0 | 0 |
| L1 — Form & Validation | 3 | 3 | 0 | 0 |
| L2 — Supabase Clients | 2 | 2 | 0 | 0 |
| L3 — Caching & Keys | 2 | 1 | 1 | 0 |
| L4 — API Infrastructure | 2 | 2 | 0 | 0 |
| L5 — Service Patterns | 2 | 2 | 0 | 0 |
| L6 — Client Queries | 1 | 1 | 0 | 0 |
| **Total** | **16** | **15** | **1** | **0** |

**Cross-cuts closed by completion of this plan:** T1 (file-organization), T2 (dry-helpers), T3 (type-safety), T4 (framework-coupling) — 4 of 4.

**Cross-cuts remaining active (by design, post-completion):** none.

Plan ready for the implementation phase.
