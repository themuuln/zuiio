# TOLOM Architecture Synthesis

> Generated: 2026-05-12 from 6 parallel subagent explorations
> Sources: api-layer, component-layer, lib-layer, database-layer, page-layer, strategic-gap

---

## State of the Codebase

**Lines of code**: ~15K across 25 API routes, 14 service files, ~30 components, 11 SQL migrations
**Phase**: Early Phase 1 (Foundation + CRM startup)
**Pattern**: Clean 3-layer (API → Service → DB) but brittle because seams aren't real yet

### What's strong

- ✅ Consistent multi-tenant schema (org_id, branch_id, audit cols, soft-delete)
- ✅ RLS on all 25+ tables (defense-in-depth)
- ✅ Ledger-based inventory (inventory_movements + inventory_balances view)
- ✅ Pricing memory tables (service_price_history, part_price_history)
- ✅ Error hierarchy (5 typed AppError subclasses + handleApiError)
- ✅ Cache tag key factory (well-designed, just unused)
- ✅ Audit logging (centralized, graceful fallback)
- ✅ Report service batching pattern (getTechnicianPerformanceBatched, etc.)
- ✅ Clean layout hierarchy (Root → Locale → Dashboard)

### What's fragile

- ❌ **No middleware** — supabase/middleware.ts written but never wired into Next.js
- ❌ **Zero tests** — vitest listed in AGENTS.md but no test files, no config, no deps
- ❌ **Schema/types drift** — 6+ tables have column names that differ between SQL and TypeScript
- ❌ **~90 createClient() calls** — every service function creates its own Supabase client
- ❌ **3 competing fetch patterns** — raw useEffect, React Query (2 pages), Server Actions
- ❌ **2 auth page trees** — locale and non-locale, both live
- ❌ **`?type=` god routes** — inventory route handles 6 entities, reports route handles 6+ report types
- ❌ **No transaction safety** — 7-step work order creation has no atomicity
- ❌ **Circular dependency** — report-service.ts lazily imports work-order-service.ts
- ❌ **Duplicate toast systems** — hand-rolled ToastMessage + sonner Toaster
- ❌ **Duplicate status badges** — StatusBadge + StatusPill overlap
- ❌ **Feature flags and plan limits are dead tables** — schema exists, no runtime enforcement
- ❌ **payments table doesn't exist** — but a server action queries it
- ❌ **mechanic_daily_reports table is orphaned** — created in migration, never written to

---

## Critical Issues (Fix First)

### Critical-1: `work_order_services` and `service_price_history` insert with wrong column names

TypeScript types use `unit_price`, `discount_amount`, `discount_percentage`
SQL schema has `base_price`, `discount_amount_mnt`, `discount_percent`

**Impact**: All service prices save as 0/null. Financial data is silently wrong.

### Critical-2: payments table doesn't exist

`src/app/[locale]/dashboard/actions.ts` queries `from("payments")` — no migration creates it.

**Impact**: `getDashboardStats()` throws 500 at runtime.

### Critical-3: No server-side auth middleware

`src/lib/supabase/middleware.ts` exists but no `src/middleware.ts` wires it in.

**Impact**: Users see a flash of unauthenticated content before client-side redirect.
