# Strategic Architecture Gap Analysis

> Generated: 2026-05-12
> **Verification Update: 2026-07-31** — Each gap verified against actual codebase. See status markers.
> Method: Cross-cutting codebase analysis against MASTER_PLAN.md vision

---

## Verification Status Summary (2026-08-03)

| Area | Count |
|------|-------|
| **✅ RESOLVED** | 24 |
| **🟡 PARTIALLY RESOLVED** | 5 |
| **❌ STILL OPEN** | 1 |
| **⚠️ Updated (claim corrected)** | 6 |

### ✅ Resolved Since Original Analysis
- **Next.js proxy/middleware** — `src/proxy.ts` wired with `updateSession()`, i18n, auth redirect
- **Backup/export** — Full export API with tests
- **Error logging** — Sentry + pino structured logger (222+ usages)
- **Mechanic-specific flow** — Dedicated mechanic dashboard
- **Last sold price** — Column + UI display + auto-suggest
- **EOD summary UI** — Full eod-close page, E2E tests
- **Plate-number search** — Mongolian plate transliteration SearchInput
- **Inventory deduction on WO completion** — Creates movements in `work-order-workflow.ts`
- **Mechanic performance tracking** — Full page + KPIs + charts
- **Low-stock alerts** — Dashboard card + eod-close + API filter
- **Vitest config** — Two-project split, 100+ test suites
- **Feature flags** — Now used via `use-available-features.ts`
- **RLS integration tests** — 10 files in `integration/`
- **total/subtotal stored vs computed** — `recalculateWorkOrderTotals()` now writes them

### 🟡 Partially Resolved
- **Org selection enforcement** — Role checks exist, but no "must select org" guard on dashboard
- **Purchase order UI** — Drawer-based (not dedicated page)
- **Supplier UI** — Drawer-based (not dedicated page)
- **API routes vs Server Actions** — Dual entrypoints remain but logic unified via `work-order-workflow.ts`
- **Feature flags in use but plan enforcement still missing** — No runtime API middleware

### ❌ Still Open
- **Tablet-first UI shell** — Responsive but desktop-first

### ⚠️ Claims Corrected (2026-08-03 audit)
- **Auto-fill from recent work** — ✅ RESOLVED. `fromLastVisit` / `fromLastVisitParts` sections exist in the work-order wizard (`parts-section.tsx`, `services-section.tsx`) with mn/en keys.
- **Right-side timeline panel** — ✅ RESOLVED. `_status-timeline.tsx` in bay-view-v2 renders `work_order_status_history`; status timeline also shown in work-order detail drawer.
- **Duplicate prevention UI feedback** — ✅ RESOLVED. `use-crud-list.ts` no longer masks 409 `ConflictError` messages with a generic "Failed to create/update"; all create/update surfaces surface `err.message` (expense categories, diagnosis labels, commission rules).
- **Manual DB types** — ⚠️ Claim corrected. `pnpm update-types` regenerates `src/lib/database.types.ts` via `supabase gen types`; manual patching is prohibited by AGENTS.md.
- **Middleware/proxy tests** — ✅ RESOLVED. Helper tests in `src/lib/supabase/__tests__/middleware.test.ts`; proxy wiring covered by E2E auth flows.

---

## 1. Documented Architecture Vision vs Actual Code

### What MASTER_PLAN promises vs. What exists

| Dimension | MASTER_PLAN Says | Actual Code | Gap |
|-----------|-----------------|-------------|-----|
| **Auth enforcement** | Server-side middleware checks auth | **`src/proxy.ts`** exists with `updateSession()`, i18n routing, auth redirect (307/302). | ✅ **RESOLVED** — Middleware wired and active. |
| **Multi-tenant isolation** | RLS on all tables, org-scoped queries | RLS enabled on all tables with org-scoping policies. Most service functions filter by `organization_id`. | Good — but `getWorkOrder(id)` only filters by `id` (relies entirely on RLS for org scoping). One RLS misconfiguration = data leak. |
| **Business logic placement** | API routes for mutations, browser = UI only | API routes + `"use server"` actions both exist, but bay-view now delegates to canonical `work-order-workflow.ts`. | 🟡 **PARTIALLY RESOLVED** — Dual entrypoints remain but business logic unified. |
| **Ledger-based inventory** | `inventory_movements` as single source of truth, `inventory_balances` as derived view | ✅ Done — `work_order_parts` consumption now creates movements via `updateWorkOrderStatus()` on completion. | ✅ **RESOLVED** — Inventory deduction on WO completion implemented. |
| **Pricing memory** | Service and part price history tables, auto-suggest, admin override | ✅ Done — `PriceDisplay` component shows last vs current price. Auto-fills from `last_price` in catalog mutations. | ✅ **RESOLVED** — Last sold price displayed and auto-suggested. |
| **Reports from clean events** | Reports calculated from event tables, not frontend state | Reports query source tables directly (work_orders, work_order_services). No dedicated event store. | Reports work but query complexity grows with each new metric. No materialized views or event denormalization yet. |
| **Feature flags** | Feature flags table, settings over hard-coding | `use-available-features.ts` now fetches and checks feature flags from API. `plan-features.ts` defines keys. | ✅ **RESOLVED** — Feature flags integrated via query hook + API. |
| **Subscription plans** | `subscription_plans` table with plan limits enforcement | `use-available-features.ts:60-62` checks plan features. But no runtime API middleware enforcement. | 🟡 **PARTIALLY RESOLVED** — Feature checks exist, but no API-level gate. |
| **Multi-tenant foundation completes before Phase 1** | Phase 0 completion gate before any product features | Phase 0 foundation migration exists + proxy.ts wired. | ✅ **RESOLVED** — Middleware gap closed. |

### Documentation vs. Reality (Updated 2026-07-31)

| AGENTS.md Claims | Actual (May 2026) | Actual (July 2026) |
|-----------------|-------------------|--------------------|
| `src/middleware.ts` exists | ❌ File did not exist | ✅ **RESOLVED** — `src/proxy.ts` exists and is wired |
| "Tests: vitest, Playwright" | ❌ Zero test files | ✅ **RESOLVED** — 100+ test suites, 40+ E2E specs |
| "Framework: vitest" | ❌ No vitest config | ✅ **RESOLVED** — Two-project vitest config |
| "RLS policies must be tested" | ❌ No test infrastructure | ✅ **RESOLVED** — 10 integration RLS test files |

---

## 2. MASTER_PLAN Decisions Not Yet Implemented

### Phase 0 (Foundation) Gaps — Updated 2026-07-31

- ✅ **Proxy/Middleware** — **RESOLVED.** `src/proxy.ts` exists with `updateSession()`, i18n routing, auth redirect. Tests exist for middleware helper.
- 🟡 **Server-side org selection enforcement** — **PARTIALLY RESOLVED.** Role checks via `organization_users` exist, but no explicit "must select org" guard on dashboard routes.
- ✅ **Audit logging** — **3/4 RESOLVED.** `createAuditLog()` used in 20+ services. Audit module tested. `audit_logs` table exists. No blanket DB trigger, but migrations have some trigger-based audit logging.
- ✅ **Backup/export** — **RESOLVED.** Full export API at `api/.../export/route.ts` with tests.
- ✅ **Error logging** — **RESOLVED.** Sentry (`@zuiio/capture`) + pino structured logger. `reportServerError` used 222+ times.

### Phase 1 (Tablet CRM) Gaps — Updated 2026-07-31

- ❌ **Tablet-first UI shell** — **STILL OPEN.** Responsive breakpoints exist but desktop-first approach.
- ✅ **Mechanic-specific flow** — **RESOLVED.** Dedicated `/dashboard/mechanic/` with role-gated dashboard, KPI grid, trend chart.
- ✅ **Last sold price column** — **RESOLVED.** `PriceDisplay` component, `last_sold_price` in DB, auto-suggest in work order forms.
- ❌ **Auto-fill from recent work** — **STILL OPEN.** i18n key `fromLastVisitParts` exists but no implementation.
- ✅ **Auto-fill from recent work** — **RESOLVED (claim corrected).** `fromLastVisit` / `fromLastVisitParts` sections in the work-order wizard copy services/parts from the customer's last visit.
- ✅ **Mechanic daily/weekly/monthly report UI** — **RESOLVED.** Full mechanic-performance page with period filter, KPIs, charts.
- ✅ **End-of-day summary UI** — **RESOLVED.** Full eod-close page with KPI cards, payment breakdown, low stock alerts. E2E tested.
- ✅ **Right-side timeline panel** — **RESOLVED (claim corrected).** `_status-timeline.tsx` (bay-view-v2) renders `work_order_status_history`; timeline also in work-order detail drawer.
- ✅ **Plate-number search UI** — **RESOLVED.** `searchByPlate` SearchInput with Mongolian plate transliteration.
- ✅ **Duplicate prevention UI feedback** — **RESOLVED.** `use-crud-list.ts` surfaces server 409 `ConflictError` messages instead of masking them.

### Phase 2+ (Originally "Not Yet Started") — Updated 2026-07-31

- ✅ **Inventory deduction on work order completion** — **RESOLVED.** `updateWorkOrderStatus()` in `work-order-workflow.ts` creates inventory movements on "Completed" status. Tests verify.
- ✅ **Mechanic performance tracking** — **RESOLVED.** Full page with KPIs, bar chart, leaderboard, detail sheet.
- 🟡 **Purchase order flow UI** — **PARTIALLY RESOLVED.** Drawer-based PO management (`new-purchase-order-drawer.tsx`, `purchase-order-form.tsx`). No standalone page.
- 🟡 **Supplier management UI** — **PARTIALLY RESOLVED.** Drawer-based supplier management (`new-supplier-drawer.tsx`, `supplier-form.tsx`). No standalone page.
- ✅ **Low-stock alerts** — **RESOLVED.** Dashboard `LowStockCard`, eod-close section, API `lowStockOnly` filter.

---

## 3. Missing Patterns That Should Exist

### Architectural Patterns — Updated 2026-07-31

| Missing Pattern | Status | Evidence |
|----------------|--------|----------|
| **Next.js middleware** | ✅ **RESOLVED** | `src/proxy.ts` with auth + i18n + redirect |
| **Repository/service injection** | ❌ **STILL OPEN** | Services still create own Supabase client |
| **Generated DB types** | ✅ **RESOLVED** | `pnpm update-types` runs `supabase gen types typescript --project-id fhzuolncswccxkcqzclg > src/lib/database.types.ts`; manual patching prohibited |
| **Dedicated DTO/validation layer** | ❌ **STILL OPEN** | Types still shared between API and DB |
| **Org-id validation in API routes** | ❌ **STILL OPEN** | No route validates URL orgId matches user org |
| **Event/ledger for work order status** | 🟡 **PARTIALLY** | `work_order_status_history` exists, writes via `work-order-workflow.ts` |
| **Plan enforcement middleware** | ❌ **STILL OPEN** | Feature checks in hooks but no API-level gate |
| **Cache invalidation strategy** | ❌ **STILL OPEN** | `revalidateTag()` still ad-hoc |

### Code Patterns — Updated 2026-07-31

| Missing | Status | Evidence |
|---------|--------|----------|
| Unit tests | ✅ **RESOLVED** | 100+ test suites, 1976 tests passing |
| Integration tests | ✅ **RESOLVED** | 10 RLS integration test files |
| E2E tests | ✅ **RESOLVED** | 40+ Playwright spec files |
| Logger abstraction | ✅ **RESOLVED** | Sentry + pino structured logging, 222+ call sites |

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

### Contradictions — Updated 2026-07-31

| Contradiction | Status | Update |
|--------------|--------|--------|
| **API routes vs Server Actions** | 🟡 **PARTIALLY RESOLVED** | Dual entrypoints remain but logic unified via `work-order-workflow.ts` |
| **Manual types vs Generated types** | ❌ **STILL OPEN** | Still hand-crafted (7788 lines), no gen script |
| **Middleware claimed vs Missing** | ✅ **RESOLVED** | `src/proxy.ts` now exists and is wired |
| **Tests claimed vs Zero tests** | ✅ **RESOLVED** | 1976 unit tests + 40+ E2E specs + 10 RLS integration tests |
| **total/subtotal stored vs computed** | ✅ **RESOLVED** | `recalculateWorkOrderTotals()` now computes and writes them |
| **Soft-delete rule vs hard-delete in services** | ❌ **STILL OPEN** | Line-item tables use `.delete()` — standard practice, financial entities use soft-delete correctly |

---

## 5. Prioritized Architecture Improvements

### Priority 1: Wire Next.js Middleware and Establish Auth Guard

**Status: ✅ RESOLVED** — `src/proxy.ts` exists with `updateSession()`, i18n, auth redirect. Tests exist for middleware helper.

**Remaining**: Org-verification step (redirect users without org membership).

---

### Priority 2: Establish Testing Infrastructure

**Status: ✅ RESOLVED** — 1976 unit tests, 40+ E2E specs, 10 RLS integration tests. Vitest config with two-project split.

---

### Priority 3: Fix the Dual Mutation Pattern

**Status: 🟡 PARTIALLY RESOLVED** — `"use server"` and API routes both remain, but bay-view now delegates to canonical `work-order-workflow.ts`. Business logic is unified.

---

### Priority 4: Wire Feature Flags and Plan Enforcement

**Status: 🟡 PARTIALLY RESOLVED** — `use-available-features.ts` checks plan features via API. Feature flags integrated. But no runtime API-level enforcement middleware.

---

### Priority 5: Generate DB Types from Schema

**Status: ✅ RESOLVED** — `pnpm update-types` regenerates `src/lib/database.types.ts` from the live schema via `supabase gen types` (documented in AGENTS.md; manual patching prohibited).

---

## Summary (Updated 2026-07-31)

The codebase has a solid **data foundation** (RLS, ledger-based inventory, pricing memory, multi-tenant schema) that correctly implements the MASTER_PLAN's structural requirements.

### Major Improvements Since May 2026

| Area | May 2026 | July 2026 |
|------|----------|-----------|
| **Middleware** | ❌ Missing | ✅ `src/proxy.ts` wired |
| **Tests** | ❌ Zero | ✅ 1976 unit + 40+ E2E + 10 RLS integration |
| **Feature flags** | ❌ Unused | ✅ Integrated via API + hook |
| **Error logging** | ❌ `console.error` | ✅ Sentry + pino (222+ call sites) |
| **Backup/export** | ❌ Missing | ✅ Full export API + tests |
| **Inventory deduction** | ❌ Not implemented | ✅ On WO completion |
| **Mechanic dashboard** | ❌ Missing | ✅ Dedicated route + reports |
| **Low-stock alerts** | ❌ Missing | ✅ Dashboard card + API filter |
| **EOD summary** | ❌ No UI | ✅ Full page + E2E |
| **Last sold price** | ❌ TODO item | ✅ Displayed + auto-suggested |
| **Plate search** | ❌ Missing | ✅ Mongolian plate transliteration |

### Still Open

1. **Tablet-first UI shell** — Responsive but desktop-first
2. **Plan enforcement middleware** — Feature checks exist, no API-level gate
3. **Repo/service injection** — Services still create own Supabase client

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
