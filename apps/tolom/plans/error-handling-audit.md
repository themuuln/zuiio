# Error Handling & Data Loss Prevention Audit

## Context

Tolom is a multi-tenant automotive shop management app (Next.js + Supabase). This audit identified **80+ findings** across 4 parallel audits covering: service layer error handling, API routes, client-side code, and database RLS/data integrity. The goal is to catch every bug, prevent silent data loss, and ensure production errors are always visible in Sentry.

**Audit scope:** 42 service files, ~130 API routes, 45+ query hooks, 60+ mutation hooks, 77 database tables, 68 SECURITY DEFINER functions.

---

## Summary by Severity

| Severity | Count | Data Loss Risk | Examples |
|----------|-------|----------------|----------|
| **P0 Critical** | 6 | Yes — active cross-tenant leaks, financial data corruption | Materialized view exposes all inventory to every user; unchecked payment operations; permissive RLS INSERT |
| **P1 High** | 15 | Yes — silent data inconsistency, missing rollbacks | Invoice totals silently wrong; estimate conversion allows duplicates; work order undo fails silently |
| **P2 Medium** | ~48 | Latent — defense-in-depth gaps, schema drift | 48 UPDATE policies missing WITH CHECK; 11 tables missing updated_at triggers; broken trigger |
| **P3 Low** | ~20 | None — convention/perf gaps | Missing indexes; console.warn in prod; inconsistent response shapes |

---

## P0 CRITICAL — Fix Immediately (6 findings)

### 1. inventory_balances materialized view — cross-tenant data leak
- **File:** `supabase/migrations/20260514100000_materialize_inventory_balances.sql`
- **Issue:** Materialized views CANNOT have RLS. Any authenticated user can SELECT all orgs' inventory data (quantities, prices, part names).
- **Fix:** Revoke direct SELECT on the materialized view from `authenticated`. Expose only via the existing `get_inventory_with_stock` SECURITY DEFINER RPC. OR replace with a regular table with RLS.

### 2. work_order_commissions INSERT — no org isolation
- **File:** `supabase/migrations/20260518000004_work_order_commissions.sql:24`
- **Issue:** INSERT policy has `WITH CHECK (true)` — any user can inject fake commission records for any org.
- **Fix:** Change to `WITH CHECK (work_order_id IN (SELECT id FROM work_orders WHERE organization_id = get_user_organization_id()))`.

### 3. car_brands/car_models INSERT — global data pollution
- **File:** `supabase/migrations/20260528150211_allow_authenticated_car_brands_models_inserts.sql`
- **Issue:** Both policies use `WITH CHECK (true)` — any user can insert fake brands into global reference tables.
- **Fix:** Remove authenticated INSERT policies. Use existing service_role policy.

### 4. invoice-service `recordPayment` — 3 unchecked operations
- **File:** `src/lib/services/invoice-service.ts:882-932`
- **Issues:**
  - Cash register entry insert (line 884) — no error check → EOD reconciliation mismatch
  - Invoice totals update (line 923) — no error check → wrong balance/status
- **Fix:** Check each error, throw on failure. Financial operations must be atomic or checked.

### 5. transfer-service `receiveTransfer` — unchecked inventory movements
- **File:** `src/lib/services/transfer-service.ts:346-375`
- **Issue:** Inventory movements inserted in for-loops with no error checking. Partial failures leave stock counts wrong.
- **Fix:** Check each insert error, throw on failure. Ideally use DB transaction.

### 6. dashboard/error.tsx — console.error instead of reportError
- **File:** `src/app/[locale]/dashboard/error.tsx:18`
- **Issue:** Uses `console.error()` instead of `reportError(error, "dashboard")`. Every other error.tsx uses reportError(). Production errors on the primary surface are invisible in Sentry.
- **Fix:** Replace with `reportError(error, "dashboard")`.

---

## P1 HIGH — Fix This Week (15 findings)

### Service Layer (9 findings)

| ID | File | Issue | Fix |
|----|------|-------|-----|
| P1-01 | `invoice-service.ts:656` | `updateInvoiceStatus` — oldInvoice query error not checked | Check error, throw NotFoundError |
| P1-02 | `invoice-service.ts:1187` | `recalculateInvoiceTotals` — reports but doesn't throw | Throw after reporting |
| P1-03 | `invoice-service.ts:629` | `createStandaloneInvoice` — no rollback if items insert fails | Delete invoice on items failure |
| P1-04 | `invoice-service.ts:174` | `getInvoice` — sub-queries (items, payments, refunds) silently swallowed | Check errors from each sub-query |
| P1-05 | `estimate-service.ts:398` | `updateEstimate` — deleteItemsError only captured, old items persist alongside new | Throw on delete failure |
| P1-06 | `estimate-service.ts:613` | `convertEstimateToWorkOrder` — convertError only captured, allows duplicate conversions | Throw on failure |
| P1-07 | `work-order-service.ts:416` | `recalculateWorkOrderTotals` — 3 query errors only captured, stale totals written | Throw if critical queries fail |
| P1-08 | `transfer-service.ts:177` | `createTransfer` — no rollback if items insert fails after transfer record created | Delete transfer record on items failure |
| P1-09 | `bay-view-service.ts:360` | `assignVehicleToBay` — deletes run parallel with assignment, data lost if assignment fails | Move deletes after successful assignment |

### Client-Side (3 findings)

| ID | File | Issue | Fix |
|----|------|-------|-----|
| P1-10 | `_use-invoice-mutations.ts:143` | Post-service form `.catch(() => {})` silently swallows errors | Add toast + reportServerError |
| P1-11 | `_use-status-mutations.ts:87` | Status undo `.catch(() => {})` — UI/server divergence | Add toast + reportServerError + re-fetch |
| P1-12 | Multiple bay-view mutation files | 13 catch blocks show toast but don't report to Sentry | Add reportServerError alongside every toast.error |

### Database (3 findings)

| ID | File | Issue | Fix |
|----|------|-------|-----|
| P1-13 | 13 child tables | organizations ON DELETE CASCADE — hard delete destroys all org data | Change to ON DELETE RESTRICT |
| P1-14 | 10 child tables | work_orders ON DELETE CASCADE — financial records destroyed | Change to ON DELETE RESTRICT |
| P1-15 | `20260608000005_customer_followups.sql:92` | Trigger references `set_updated_at()` which doesn't exist | Fix to use `update_updated_at_column()` |

---

## P2 MEDIUM — Fix This Sprint (~48 findings)

### Database Schema (20+ findings)
- **48 UPDATE policies** missing explicit `WITH CHECK` — add for defense-in-depth
- **11 tables** missing `updated_at` triggers (appointments, cash_register_sessions, estimates, etc.)
- **SECURITY DEFINER functions** — `lookup_user_by_email` exposes auth.users; audit all 68 functions
- **org_invites** SELECT policy uses `USING (true)` — anyone can read all invites
- **customer_followups** missing from `database.types.ts` — regenerate types
- **Missing unique constraints** on expense_categories, service_catalog names

### API Routes (~20 findings)
- **16 routes** pass raw body without input validation
- **~20 mutation routes** missing rate limiting
- **8 routes** return `{ success: true }` instead of `ok()` — breaks client expectations
- **5 routes** use raw `NextResponse.json()` instead of `apiError()` — inconsistent error shapes
- **4 routes** create redundant Supabase clients instead of using handler-provided one

### Service Layer (14 findings)
- **select('*')** usage in catalog-variant-service, followup-service, and others
- **Untyped errors** in admin-service (10+ functions), cash-register-service, day-close-service — use `AppError` instead of `throw new Error()`
- **Double cast** `as unknown as InvoiceItem[]` in invoice-service
- **catalog-variant-service** — bulk upsert silently skips failed variants

---

## P3 LOW — Backlog (~20 findings)

- Add missing indexes on mechanic_pay_rates, estimate_items, invoice_refunds, cash_register_entries
- Standardize RLS on `get_user_organization_id()` (3 functions currently in use)
- Fix `console.warn` in production components (detail-drawer.tsx, z-stack.ts)
- Fix SmartCar in-memory cache/rate limiter (resets on cold starts)
- Add `beforeunload` protection on booking form, expense/vehicle creation pages
- Fix double-toasting in catalog mutation catch blocks

---

## Implementation Order

1. **Phase 1 — Database Security (P0 + P1 DB)** — RLS fixes, CASCADE changes, trigger fix. These are the highest-risk items and should be done first with proper migration review.
2. **Phase 2 — Service Layer Error Handling (P0 + P1 Service)** — Fix unchecked operations in invoice, transfer, estimate, work-order services. Each fix is small and isolated.
3. **Phase 3 — Client-Side Error Reporting (P0 + P1 Client)** — Fix dashboard error boundary, post-service form, status undo, bay-view Sentry gaps.
4. **Phase 4 — Schema Cleanup (P2 DB)** — WITH CHECK policies, updated_at triggers, type regeneration.
5. **Phase 5 — API Consistency (P2 API)** — Response shape normalization, input validation, rate limiting.
6. **Phase 6 — Polish (P3)** — Indexes, console.warn cleanup, beforeunload, convention standardization.

Each phase should be a separate commit. Phases 1-3 are blocking (data loss risk). Phases 4-6 can be deferred.

---

## Verification

After each phase:
1. `bun run typecheck` — zero new errors
2. `bun run test` — all tests pass
3. For DB changes: review migration SQL, run `supabase db advisors` (or MCP `get_advisors`)
4. For service changes: verify error paths with targeted tests
5. Final: full lint + typecheck + test suite + health check

---

## Research Sources

- **Next.js** error boundaries: `error.tsx` must be client component, use `reportError` not `console.error`
- **Supabase** RLS: UPDATE needs explicit WITH CHECK; materialized views bypass RLS; SECURITY DEFINER functions are callable by all roles by default
- **TanStack Query** optimistic updates: `onMutate` must snapshot + return previous; `onError` must rollback; always refetch after error/success
