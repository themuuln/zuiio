# Strategic Architecture Gap Analysis

> Generated: 2026-05-12
> Method: Cross-cutting codebase analysis against MASTER_PLAN.md vision

---

## 1. Documented Architecture Vision vs Actual Code

### What MASTER_PLAN promises vs. What exists

| Dimension | MASTER_PLAN Says | Actual Code | Gap |
|-----------|-----------------|-------------|-----|
| **Auth enforcement** | Server-side middleware checks auth | **No `middleware.ts`** exists at root or in `src/`. Auth checked via client-side `useRequireAuth()` hook that pings `/api/profile`. | **CRITICAL** — Missing middleware means no server-side auth redirect. Users see a flash of unauthenticated content before the client-side check fires. |
| **Multi-tenant isolation** | RLS on all tables, org-scoped queries | RLS enabled on all tables with org-scoping policies. Most service functions filter by `organization_id`. | Good — but `getWorkOrder(id)` only filters by `id` (relies entirely on RLS for org scoping). One RLS misconfiguration = data leak. |
| **Business logic placement** | API routes for mutations, browser = UI only | All CRUD goes through `src/app/api/.../route.ts` → service functions. But **bay-view-service.ts uses `"use server"` actions** (server actions), creating a dual pattern. | Server actions and API routes are two inconsistent paths for the same thing. |
| **Ledger-based inventory** | `inventory_movements` as single source of truth, `inventory_balances` as derived view | Done — `inventory_movements` table with movement_type, `inventory_balances` is a view. Purchase order receipt creates movements. | Solid — but `work_order_parts` consumption doesn't yet create inventory movements (gap between Phase 1 parts and Phase 2 inventory). |
| **Pricing memory** | Service and part price history tables, auto-suggest, admin override | Done — `service_price_history` and `part_price_history` are populated in `addServiceToWorkOrder` / `addPartToWorkOrder`. Vehicle make/model context saved. | Solid — but no frontend "last sold price" suggestion yet (TODO item). |
| **Reports from clean events** | Reports calculated from event tables, not frontend state | Reports query source tables directly (work_orders, work_order_services). No dedicated event store. | Reports work but query complexity grows with each new metric. No materialized views or event denormalization yet. |
| **Feature flags** | Feature flags table, settings over hard-coding | `feature_flags` table exists in migration 00001. **Zero references in application code.** | Feature flags are structurally ready but entirely unused. |
| **Subscription plans** | `subscription_plans` table with plan limits enforcement | Table exists. **No enforcement logic anywhere.** No rate limiting tied to plan limits. | Plan limits are a data model with no runtime enforcement. |
| **Multi-tenant foundation completes before Phase 1** | Phase 0 completion gate before any product features | Phase 0 foundation migration exists (00001). Phase 1 CRM migration (00002) references it. | Done structurally — but the missing middleware means the security completion gate isn't fully closed. |

### Documentation vs. Reality

| AGENTS.md Claims | Actual |
|-----------------|--------|
| `src/middleware.ts` exists | **File does not exist.** The `lib/supabase/middleware.ts` helper was built but never wired into Next.js middleware system. |
| "Tests: vitest, Playwright" | **Zero test files found.** No `__tests__/`, no `.spec.`, no `.test.` files. |
| "Framework: vitest" | No vitest config found. No test dependencies in `package.json`. |
| "RLS policies must be tested" | No test infrastructure exists to validate them. |

---

## 2. MASTER_PLAN Decisions Not Yet Implemented

### Phase 0 (Foundation) Gaps

- **No Next.js middleware** — auth redirection, locale detection, session refresh all run client-side. The `lib/supabase/middleware.ts` was written but never connected.
- **No server-side org selection enforcement** — users can access any URL pattern; the middleware should redirect users without an org selection.
- **No audit triggers** — `createAuditLog()` is called explicitly in `customer-service.ts` but is not a database trigger. Any write outside the service layer bypasses audit.
- **No backup/export structure** — mentioned in Phase 0 but not implemented.
- **No error logging infrastructure** — just `console.error()` in `handleApiError()`.

### Phase 1 (Tablet CRM) Gaps

- **No tablet-first UI shell** — the dashboard uses desktop patterns (sidebar, table layouts). No tablet-specific viewport optimization.
- **No mechanic-specific flow** — dashboard and work orders use the same layout for both admin and mechanic roles.
- **No "last sold price" column** in work order forms (TODO item).
- **No auto-fill from recent work** (TODO item).
- **No mechanic daily/weekly/monthly report UI** — the report-service functions exist but the reports page structure isn't visible.
- **No end-of-day summary UI** — `getEndOfDaySummary()` exists server-side but no page consumes it.
- **No right-side timeline panel** for service progress (TODO item).
- **No plate-number search UI** on the work-order creation page.
- **No duplicate prevention UI feedback** — `ConflictError` is thrown for duplicate phone but caught generically.

### Phase 2+ (Not Yet Started)

- **No inventory deduction on work order completion** — adding parts to work orders doesn't create inventory movements.
- **No mechanic performance tracking**.
- **No purchase order flow UI** — API routes exist for POs but no frontend pages.
- **No supplier management UI**.
- **No low-stock alerts** — `stock_thresholds` table exists but no alerting.

---

## 3. Missing Patterns That Should Exist

### Architectural Patterns

| Missing Pattern | Why It Matters | Impact |
|----------------|---------------|--------|
| **Next.js middleware** | Server-side auth check, locale routing, session refresh, org verification | Security + UX — unauthenticated requests aren't redirected server-side |
| **Repository/service injection** | All services create their own Supabase client. No way to inject mocks. | **Zero testability** — services cannot be unit tested without a real Supabase instance |
| **Generated DB types** | `database.types.ts` is hand-maintained (1150+ lines). Every migration requires manual type updates. | Maintenance burden — types drift from actual schema over time |
| **Dedicated DTO/validation layer** | Types shared between API contracts and DB rows. No separation. | API changes require DB type changes and vice versa |
| **Org-id validation in API routes** | No route validates that the URL orgId matches the user's actual organization. | RLS is the only barrier — any RLS bug leaks cross-org data |
| **Event/ledger for work order status** | `work_order_status_history` exists but write patterns are inconsistent | Status changes may go unlogged |
| **Plan enforcement middleware** | No runtime check that an org's plan allows the current operation | Plan limits are decorative |
| **Cache invalidation strategy** | `revalidateTag()` called ad-hoc in service functions | Cache coherence depends on developer memory |

### Code Patterns

| Missing | Current State | Impact |
|---------|--------------|--------|
| Unit tests | None exist | No regression safety net |
| Integration tests | None exist | RLS policies are untested |
| E2E tests | None exist | Critical flows untested |
| Logger abstraction | `console.error()` in API error handler | No structured logging |

---

## 4. Existing Architecture Decisions & Contradictions

### Documented Decisions

1. **API routes + Server components** for server-side logic (from MASTER_PLAN §6)
2. **RLS for row-level access** (from MASTER_PLAN §2, §10)
3. **Soft deletes for financial records** (from MASTER_PLAN §10)
4. **Multi-tenant with org_id + branch_id** (from MASTER_PLAN §5)
5. **Ledger-based inventory** (from MASTER_PLAN §6)
6. **Biome for linting/formatting** (from `package.json`)
7. **next-intl for i18n** (from `next.config.ts`)
8. **Pricing memory tables** (from MASTER_PLAN §6)

### Contradictions

| Contradiction | Details |
|--------------|---------|
| **API routes vs Server Actions** | `work-order-service.ts` uses API routes. `bay-view-service.ts` uses `"use server"` actions. Two patterns for identical mutations. |
| **Manual types vs Generated types** | AGENTS.md says TypeScript throughout. `database.types.ts` is hand-crafted, not generated from `supabase gen types`. |
| **Middleware claimed vs Missing** | AGENTS.md lists `middleware.ts` in project structure. The file doesn't exist. The helper library was built but never wired. |
| **Tests claimed vs Zero tests** | AGENTS.md specifies vitest, naming conventions, RLS testing. No test infrastructure exists. |
| **total/subtotal stored vs computed** | `work_orders` has `subtotal`, `discount_total`, `total` columns. They default to 0 and are never updated. Real totals are computed by summing line items. |
| **Soft-delete rule vs hard-delete in services** | `removeServiceFromWorkOrder()` and `removePartFromWorkOrder()` call `.delete()` instead of soft-delete. |

---

## 5. Prioritized Architecture Improvements

### Priority 1: Wire Next.js Middleware and Establish Auth Guard

**Problem**: No middleware exists. Auth is entirely client-side. Locale routing depends on client-side detection.

**What to do**:
- Create `src/middleware.ts` that calls `lib/supabase/middleware.ts:updateSession()`
- Add org-verification step: redirect users without org membership
- Add locale detection and redirect

**Blocks**: Phase 0 completion, security posture, i18n correctness.

---

### Priority 2: Establish Testing Infrastructure

**Problem**: Zero tests. The entire codebase has no safety net.

**What to do**:
- Add vitest config and dependencies
- Create Supabase test helpers (mock client, test user/org creation)
- Write integration tests for critical paths: work-order CRUD through the service layer
- Write RLS validation tests (Org A can't see Org B's data)

**Blocks**: All future architecture improvements.

---

### Priority 3: Fix the Dual Mutation Pattern

**Problem**: API routes and server actions do the same thing differently. The bay-view service bypasses the work-order-service for status updates.

**What to do**:
- Consolidate all mutation paths to use the service layer consistently
- Make the bay-view server action call `work-order-service` functions
- Eliminate the `"use server"` pattern unless it's the deliberate chosen path

**Blocks**: Cache coherence, audit completeness, maintainability.

---

### Priority 4: Wire Feature Flags and Plan Enforcement

**Problem**: `feature_flags` and `subscription_plans` tables are dead data. Every feature toggle requires a deploy.

**What to do**:
- Create a `getEnabledFeatures(orgId)` server-side helper
- Write RLS policies or API middleware that checks plan limits
- Replace `TODO.md` "Not In Phase 1" list with actual feature flag checks

**Blocks**: Multi-tenant SaaS monetization.

---

### Priority 5: Generate DB Types from Schema

**Problem**: `database.types.ts` is 1150+ lines of hand-maintained TypeScript. Every migration requires manual updates.

**What to do**:
- Run `supabase gen types typescript --linked > src/lib/database.types.ts`
- Add a `package.json` script to regenerate types
- Fix existing field inconsistencies (e.g., `WorkOrderService` has both `service_name` and `name` fields)

**Blocks**: Type safety, developer velocity, schema evolution.

---

## Summary

The codebase has a solid **data foundation** (RLS, ledger-based inventory, pricing memory, multi-tenant schema) that correctly implements the MASTER_PLAN's structural requirements. The critical gaps are in the **application layer**:

1. **Middleware** — the biggest security gap. Auth runs client-side only.
2. **Tests** — no safety net prevents risky refactoring.
3. **Architecture drift** — two mutation patterns, untracked dead tables, manual types.
4. **No plan enforcement** — pricing strategy exists but can't be executed without code changes.
5. **No feature flags** — every behavior toggle means a deploy.

These are all fixable without rewriting the data layer. The data model is the strongest part of the system.

---

## Appendix: Cross-references

- **MASTER_PLAN.md** — full product vision, roadmap, pricing strategy
- **AGENTS.md** — repository guidelines, coding conventions
- **TODO.md** — Phase 1 task list
- **`supabase/migrations/`** — ordered SQL migrations (00001-00011)
- **`src/lib/services/`** — server-side business logic
- **`src/lib/database.types.ts`** — manual DB type definitions
- **`src/lib/supabase/middleware.ts`** — built but unwired middleware helper
- **`src/lib/errors.ts`** — error hierarchy with HTTP status codes
- **`src/lib/audit.ts`** — audit log helper
- **`docs/analytics-master-plan.md`** — separate analytics product vision
