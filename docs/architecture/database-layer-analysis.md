# TOLOM Architecture Analysis

> Generated: 2026-05-12
> Scope: Full codebase exploration — database schema, service layer, API routes, caching, frontend data flow
> Skill: improve-codebase-architecture

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Layer 1: Database Schema](#3-layer-1-database-schema)
4. [Layer 2: Data Access — Services (`src/lib/services/*`)](#4-layer-2-data-access)
5. [Layer 3: API Routes](#5-layer-3-api-routes)
6. [Frontend Data Flow](#6-frontend-data-flow)
7. [Caching Strategy](#7-caching-strategy)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Candidate Deepening Opportunities](#9-candidate-deepening-opportunities)
10. [Open Risks & Urgent Issues](#10-open-risks--urgent-issues)

---

## 1. Executive Summary

TOLOM has a **clean 3-layer architecture** (API → Service → Database) with a well-designed multi-tenant Postgres schema and comprehensive RLS. The codebase is young (Phase 0–2) and already shows good patterns: service modules per domain, typed database interface, cache tags, and audit logging.

However, the codebase exhibits **significant architectural friction** in three areas:

1. **No data access abstraction** — every service creates its own Supabase client and queries directly. This makes the service layer untestable, duplicates query logic, and has led to **N+1 queries in 6+ locations**.
2. **Two-tier caching inconsistency** — Next.js `revalidateTag` + in-memory Map + React Query coexist without clear boundaries, and the in-memory cache is invisible to other cache layers.
3. **Schema-type drift** — TypeScript types define columns that don't exist in migrations (and vice versa), silently masking bugs at runtime.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────┐
│  Browser (Next.js Client Components)        │
│  React Query + fetch() + Server Actions     │
├─────────────────────────────────────────────┤
│  Next.js App Router                         │
│  ├── API Routes (src/app/api/*)             │
│  ├── Server Actions (src/app/*/actions.ts)  │
│  └── Page Components (client/server)        │
├─────────────────────────────────────────────┤
│  Service Layer (src/lib/services/*)         │
│  Business logic, direct Supabase queries    │
├─────────────────────────────────────────────┤
│  Data Access (direct Supabase client)       │
│  No abstraction layer                       │
├─────────────────────────────────────────────┤
│  PostgreSQL / Supabase                      │
│  RLS, Views, Functions, Triggers            │
└─────────────────────────────────────────────┘
```

### Current Seams

| Seam | Interface | Implementation |
|------|-----------|----------------|
| HTTP → Route Handler | `GET/POST/PATCH/DELETE` on URL path | `src/app/api/organizations/[id]/*/route.ts` |
| Route Handler → Service | Named function with `(orgId, params)` | `src/lib/services/*.ts` |
| Service → Supabase | Direct `supabase.from().select()` | Inline per function |
| Frontend → API | `fetch('/api/...')` or `useQuery()` | `src/lib/queries/*.ts` |
| Frontend → Server | `"use server"` function | `src/app/*/actions.ts` |

---

## 3. Layer 1: Database Schema

### 3.1 Schema Quality

**Strengths:**
- Consistent `organization_id`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at` audit columns on all tables
- RLS enabled on all 25+ tables
- Good composite indexes with `WHERE deleted_at IS NULL` partial indexes
- Append-only ledger tables (`inventory_movements`, `service_price_history`, `part_price_history`, `work_order_status_history`)
- Unique partial index for active bay assignments
- Well-designed `inventory_balances` view computed from ledger

**Weaknesses:**

#### 3.1.1 Column Drift Between Migrations and TypeScript Types

The TypeScript types in `src/lib/database.types.ts` have **diverged from the actual SQL schema** in multiple tables. This means TypeScript compiles but queries fail or silently return null at runtime.

| Table | Migration Columns | TypeScript Columns | Problem |
|-------|-------------------|--------------------|---------|
| `service_price_history` (00002) | `base_price`, `discount_amount_mnt`, `discount_percent` | `unit_price`, `discount_amount`, `discount_percentage` | **Column names differ** — queries referencing `unit_price` return null at runtime |
| `work_order_services` (00002) | `base_price`, `discount_amount_mnt`, `discount_percent` | `unit_price`, `discount_amount`, `discount_percentage` | **Column names differ** — same drift |
| `work_orders` (00002) | No `subtotal`, `discount_total`, `total` columns | Has `subtotal`, `discount_total`, `total` | **Missing columns** in actual schema |
| `part_price_history` (00002) | `unit_price`, `final_price` only | → also `price`, `name`, `vehicle_id`, `work_order_part_id`, `make`, `model`, `base_price` | **Extra phantom columns** in types |
| `vehicle_owners` (00002) | No `owned_until`, `id`, `created_at`, `is_primary` order diff | Has `owned_until`, `id`, `created_by` | **Mismatch** |
| `customers` (00002) | No `full_name`, `company_name`, `contact_person`, `total_visits`, `last_visit_at`, `tags` | Has all of these | **Missing columns** in actual schema |
| `vehicles` (00002) | No `chassis_number`, `drivetrain`, `body_type`, `trim`, `chassis_number` | Has these | **Missing columns** |

**Impact**: Low urgency for tables that aren't yet queried, but `work_order_services` and `service_price_history` are actively used. The services insert using TypeScript column names (e.g., `unit_price`) but the DB expects `base_price`. This silently inserts null/0 values.

#### 3.1.2 RLS Pattern Duplication

Every table has the same 4-policy pattern:

```sql
create policy "Users can view {table} in their org"
  on {table} for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert {table} in their org"
  on {table} for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

create policy "Users can update {table} in their org"
  on {table} for update
  using (organization_id = get_user_organization_id());

create policy "Users can delete {table} in their org"
  on {table} for delete
  using (organization_id = get_user_organization_id());
```

This is repeated **25+ times** across 4 migration files. When the org-access pattern changes (e.g., migration 00011 uses `IN (select ...)` instead of `get_user_organization_id()`), policies become inconsistent.

RLP (Role-Based Policy) would reduce this to 1 declarative rule per operation type.

#### 3.1.3 Missing `updated_by` Trigger

The `update_updated_at_column()` trigger sets `updated_at` but not `updated_by`. Several service functions manually set `updated_by` in the object passed to `.update()`, but if a future code path forgets, `updated_by` stays stale.

#### 3.1.4 `mechanic_daily_reports` Table Created But Unused

The `mechanic_daily_reports` table was created in migration 00002 with full policies and indexing, but no service code writes to it. Reports are computed live from `work_orders` + `work_order_services`/`work_order_parts` instead. This is an **orphan table** that adds migration surface area with zero benefit.

#### 3.1.5 `payments` Table Referenced But Doesn't Exist

`src/app/[locale]/dashboard/actions.ts` queries `payments` table:
```typescript
supabase.from("payments").select("amount").eq("organization_id", orgId)...
```

No migration creates a `payments` table. This query will throw at runtime.

---

## 4. Layer 2: Data Access

### 4.1 Pattern: Every service creates its own Supabase client

Every function in every service module calls `await createClient()` at the top:

```typescript
export async function getWorkOrders(orgId: string, filters) {
  const supabase = await createClient();  // ← Every function
  let query = supabase.from("work_orders").select(...)
```

**Consequences:**
- **Untestable**: To unit-test a service function, you must mock `createClient()` at the module level — no seam for test doubles
- **No connection reuse in a single request**: Each service call in a chain creates a new Supabase client
- **No cross-service transactions**: Multiple writes in different service files can't be wrapped in a transaction

### 4.2 N+1 Query Hotspots

Despite the dashboard having "optimized" helpers, N+1 patterns persist in critical paths:

| Location | Pattern | Severity |
|----------|---------|----------|
| `customer-service.ts:getCustomers()` | Iterates customers, queries `vehicle_owners` COUNT per customer | **High** — every customer list page |
| `report-service.ts:getDailyReport()` | Fetches `getWorkOrder()` per completed WO | **High** — daily/weekly/monthly reports |
| `report-service.ts:getWeeklyReport()` | Calls `getDailyReport()` 7 times, each doing N+1 | **Very High** — 7× the cost |
| `report-service.ts:getMonthlyReport()` | Calls `getWorkOrder()` per completed WO in month | **Very High** |
| `report-service.ts:getEndOfDaySummary()` | Iterates work orders, calls `getWorkOrder()` per WO | **High** |
| `report-service.ts:getDailyReport()` | Already has WO IDs in first query, re-fetches via `getWorkOrder()` | **Medium** — duplicate work |
| `inventory-service.ts:getPurchaseOrderItems()` | Has the right N+1 solution in `getRecentWorkOrdersBatched()` but not applied to reports | **Medium** |

The dashboard has `getTechnicianPerformanceBatched()`, `getRecentWorkOrdersBatched()`, `getRevenueTrendBatched()`, `getServiceCategoryBreakdownBatched()` — these are the correct pattern. But the report service (`getDailyReport`, `getWeeklyReport`, etc.) uses the **unbatched** pattern.

### 4.3 Two Paths to Resolve Org ID

| Service | Method |
|---------|--------|
| `bay-view-service.ts` | `supabase.rpc("get_user_organization_id")` |
| `work-order-service.ts` | `_getOrgId()` queries `organization_users` directly |
| All others | Org ID passed as parameter from URL | 

`bay-view-service.ts` and `work-order-service.ts` have duplicate `_getOrgId()` / `getOrgId()` helper functions.

### 4.4 Cache Invalidation Scattered Across Services

Cache revalidation is inline in every mutating function:

```typescript
revalidateTag(cacheTags.workOrders(orgId), "max");
revalidateTag(cacheTags.workOrder(id), "max");
```

The `cache/server.ts` module exports `invalidateWorkOrderCache()` and `invalidateOrgCache()` helpers, but **services don't use them** — they call `revalidateTag` directly and miss the helper function.

Also: `revalidateTag` does not take a priority parameter. The `"max"` argument is silently ignored.

---

## 5. Layer 3: API Routes

### 5.1 The `?type=` God-Route Pattern

Three API routes multiplex multiple resources through a single URL:

#### `/api/organizations/[id]/inventory`
- `GET ?type=parts` → parts catalog
- `GET ?type=balances` → inventory balances
- `GET ?type=movements` → inventory movements
- `GET ?type=suppliers` → suppliers
- `GET ?type=purchase-orders` → purchase orders
- `GET ?type=purchase-order-items` → PO items
- `GET ?type=thresholds` → stock thresholds
- `POST ?type=part` → create part
- `POST ?type=movement` → create movement
- `POST ?type=supplier` → create supplier
- `POST ?type=purchase-order` → create PO
- `POST ?type=receive-po` → receive PO
- `POST ?type=threshold` → set threshold
- `PATCH ?type=part` → update part
- `PATCH ?type=supplier` → update supplier (note: this uses query param `?id=` for the resource ID)
- `DELETE ?type=supplier` → delete supplier

This single route file is **312 lines** with a massive switch statement. It violates:
- Single Responsibility Principle (one route, many entities)
- RESTful URL design (should be `/inventory/parts`, `/inventory/movements`, `/suppliers`, `/purchase-orders`, etc.)
- Maintainability (adding a new entity means editing the god route)

#### `/api/organizations/[id]/reports`
- `GET ?type=daily` → daily report per mechanic
- `GET ?type=weekly` → weekly report
- `GET ?type=monthly` → monthly report
- `GET ?type=eod` → end of day summary
- `GET ?type=dashboard` → full dashboard
- `GET ?type=mechanics` → mechanics list

This multiplexes across conceptually different reports in one file.

#### `/api/organizations/[id]`
- `GET` → get organization
- `PATCH` → update organization

This one is fine (single entity, multiple verbs).

### 5.2 Duplicated Auth Check in Every Route

Every single API route starts with:

```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new UnauthorizedError();
```

This could be extracted into a middleware or a `withAuth` wrapper, but is copy-pasted across all 24 route files.

### 5.3 Server Actions vs API Routes: No Decision Framework

| Entity | Uses API Routes | Uses Server Actions |
|--------|----------------|---------------------|
| Work Orders | ✅ | ❌ |
| Customers | ✅ | ❌ |
| Vehicles | ✅ | ❌ |
| Dashboard | ✅ (reports) | ✅ (getDashboardStats) |
| Bay View | ❌ | ✅ (all operations) |
| Branches | ✅ | ❌ |
| Organization | ✅ | ❌ |
| Organization Access | ❌ | Used via client form → RPC |

There is no documented rule for when to use a Server Action vs an API Route. The bay view exclusively uses server actions (making it harder to access from mobile/non-web clients), while everything else uses API routes.

---

## 6. Frontend Data Flow

### 6.1 Three Fetch Patterns

| Pattern | Files | Status |
|---------|-------|--------|
| **React Query hooks** | `useCustomers`, `useCurrentOrg` | ✅ Clean, cached, typed |
| **Raw `fetch()` in useEffect** | Dashboard page, Work Orders page | ❌ No caching, manual loading/error state |
| **Server Action calls** | Bay View (via form actions), Dashboard stats | Mixed — works for form post, but `getDashboardStats()` isn't used by the rendered page |

### 6.2 Dashboard Fetches Inconsistently

The Dashboard page (`src/app/[locale]/dashboard/page.tsx`) uses `fetch('/api/organizations/${oid}/reports?type=dashboard')` in a useEffect. But a Server Action (`getDashboardStats()`) also exists that provides dashboard statistics via a different query. Neither calls the other. The Server Action queries a `payments` table that doesn't exist yet.

### 6.3 React Query Keys Defined But Not Fully Used

`src/lib/queries/keys.ts` defines keys for customers, vehicles, work orders, and inventory — but only customers and org have actual query hooks. The other keys exist as dead code.

---

## 7. Caching Strategy

### 7.1 Three Cache Layers That Don't Talk to Each Other

| Layer | Mechanism | Scope | Visibility |
|-------|-----------|-------|------------|
| Next.js Response Cache | `revalidateTag()` with cache tags | Server response cache | Next.js runtime |
| In-Memory Map | `Map<string, {data, expiresAt}>` in report-service.ts | Dashboard data only | Single server process, lost on cold start |
| React Query | `@tanstack/react-query` | Client-side | Browser, scoped per session |

The in-memory cache has a 30s TTL and a 50-entry eviction policy. It's the most aggressive but also the most fragile — on Vercel/edge, this cache is per-instance and frequently cold.

### 7.2 Cache Invalidation Is Manual and Scattered

Each mutating service function manually calls `revalidateTag()` for cache tags. There's no invalidation bus or hook system. If a mutation happens outside the service layer (e.g., direct DB insert, edge function), the cache goes stale silently.

---

## 8. Authentication & Authorization

### 8.1 Auth Check Duplicated Everywhere

The pattern `supabase.auth.getUser()` → throw if null is repeated in:
- All 24 API route files (both GET and mutating endpoints)
- Multiple server actions
- Some service helpers (`bay-view-service.ts` has its own `getOrgId()`)

### 8.2 Middleware Performs Auth but Doesn't Extract Org Context

`src/lib/supabase/middleware.ts` checks authentication and redirects unauthenticated users to login, but it **doesn't extract or attach the organization ID** to the request. This means every downstream handler must re-derive the org context.

---

## 9. Candidate Deepening Opportunities

### Candidate 1: Data Access Layer (DAO/Repository)

**Files**: All `src/lib/services/*.ts`

**Problem**: Every service function creates its own Supabase client and duplicates query patterns. No seam for testing, no cross-service transactions.

**Solution**: Introduce a thin data access layer between services and Supabase:

```
Before: Service → createClient() → supabase.from().select()
After:  Service → Repository { supabase client } → SQL/query
```

A single `DatabaseClient` or `Repository` class instantiated once per request:

```typescript
class WorkOrderRepository {
  constructor(private db: SupabaseClient) {}
  
  async findById(id: string): Promise<WorkOrder> { ... }
  async findByOrg(orgId: string, filters: Filters): Promise<WorkOrder[]> { ... }
  async create(params: CreateParams): Promise<WorkOrder> { ... }
}
```

**Benefits**:
- **Testability**: Repository can be mocked in service tests
- **Connection reuse**: One client per request, not per function
- **Batching**: Repository can batch queries (the `getRecentWorkOrdersBatched` pattern applied everywhere)
- **Transactions**: Repositories can share a client for atomic operations
- **Seam**: This creates a real seam where caching, logging, or metrics can be injected without touching business logic

**Deletion test**: Delete the inline Supabase queries. The complexity re-appears across 14+ services. ✅ Concentrates complexity.

### Candidate 2: Kill the `?type=` God Routes

**Files**: `src/app/api/organizations/[id]/inventory/route.ts`, `src/app/api/organizations/[id]/reports/route.ts`

**Problem**: Two routes handle 6+ resource types each via `?type=` switches, violating REST principles and making the code hard to navigate.

**Solution**: Break into separate route files:
- `/inventory/parts/route.ts`
- `/inventory/movements/route.ts`  
- `/inventory/suppliers/route.ts`
- `/inventory/purchase-orders/route.ts`
- `/reports/daily/route.ts`
- `/reports/weekly/route.ts`
- `/reports/monthly/route.ts`
- `/reports/dashboard/route.ts`

**Benefits**:
- **Locality**: Each route file is ~30 lines instead of 300
- **Navigation**: Finding the parts handler means going to `parts/route.ts`, not scanning a switch
- **Seam**: Each route can independently evolve, add middleware, or change auth requirements

**Deletion test**: Delete the god route file. All 6 resource types need their own handler files. ✅ Concentrates complexity.

### Candidate 3: Unified Auth Middleware / `withAuth` Wrapper

**Files**: All `src/app/api/*/route.ts` files (24 files)

**Problem**: The same 4-line auth check is copy-pasted 48+ times (GET + mutating handler per route).

**Solution**: Extract into a `withAuth` higher-order function:

```typescript
// lib/api/with-auth.ts
async function withAuth<T>(
  handler: (user: User, orgId: string, req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return handleApiError(new UnauthorizedError());
  const orgId = await extractOrgId(req, supabase);
  return handler(user, orgId, req);
}
```

**Benefits**:
- **Locality**: One place to modify auth behavior, not 48
- **Reduced boilerplate**: Route files shrink by ~30%
- **Lean**: Easier to audit auth coverage

**Deletion test**: Delete the duplicated auth checks. The `withAuth` function handles them. ⚠️ Moves complexity to one place (good).

### Candidate 4: Replace In-Memory Cache with a Real Cache

**Files**: `src/lib/services/report-service.ts` (in-memory Map)

**Problem**: Dashboard data is cached in a process-local Map with 30s TTL. Lost on cold start, invisible to other cache layers, never invalidated on mutations.

**Solution**: Use Next.js `revalidateTag` consistently for all cached data, and consider a shared cache (Redis via Upstash, or Supabase's own query cache) for multi-instance environments.

**Benefits**:
- **Consistency**: One caching mechanism for all server-side data
- **Correctness**: Mutations can invalidate dashboard cache via the same tag system
- **Cold-start resilience**: Tags survive cold starts

### Candidate 5: Fix Schema/Type Drift with a Migration Audit

**Files**: `src/lib/database.types.ts`, `supabase/migrations/0000*.sql`

**Problem**: TypeScript types have diverged from the actual SQL schema, creating a class of bugs that TypeScript can't catch.

**Solution**: Either:
1. Generate TypeScript types from the actual database using `supabase gen types typescript --linked`
2. Or create a migration that adds the columns the types expect (for tables where those columns should exist)

**Priority**: High for `work_order_services` and `service_price_history` — these are actively used with wrong column names.

### Candidate 6: Create a Report/Materialized View for Aggregations

**Files**: `src/lib/services/report-service.ts` (all 5 report functions)

**Problem**: Daily, weekly, monthly, EOD, and dashboard reports all compute aggregations by iterating completed work orders and their line items. This is slow and generates N+1 queries.

**Solution**: Create database views or materialized views for common aggregations:

```sql
create view daily_revenue as
select
  wo.organization_id,
  wo.mechanic_id,
  wo.created_at::date as report_date,
  count(distinct wo.id) as work_orders_completed,
  sum(ws.final_price) as service_revenue,
  count(ws.id) as services_count,
  sum(wp.final_price) as parts_revenue,
  count(wp.id) as parts_count
from work_orders wo
left join work_order_services ws on ws.work_order_id = wo.id
left join work_order_parts wp on wp.work_order_id = wo.id
where wo.status = 'Completed' and wo.deleted_at is null
group by wo.organization_id, wo.mechanic_id, wo.created_at::date;
```

Then the report service queries this view instead of doing N+1 in application code.

**Benefits**:
- **Performance**: Postgres aggregates in one query instead of N+1
- **Locality**: The aggregation logic lives in the database, not scattered across service code
- **Maintainability**: Adding a new metric means altering the view, not updating 5 report functions

---

## 10. Open Risks & Urgent Issues

| # | Issue | Risk | Priority |
|---|-------|------|----------|
| 1 | `work_order_services` inserts use TypeScript column names (`unit_price`) but DB expects `base_price` | All service prices save as 0/null | **Critical** |
| 2 | `payments` table doesn't exist but dashboard Server Action queries it | `getDashboardStats()` throws 500 | **High** |
| 3 | `getDailyReport()` N+1 iterates each completed WO | Dashboard/report pages time out with >50 WOs | **High** |
| 4 | TypeScript types define columns missing from migrations (6+ tables) | Silent runtime nulls | **High** |
| 5 | `mechanic_daily_reports` table defined but never written to | Dead schema surface | **Low** |
| 6 | `inventory_balances` view references `parts_catalog.name` but column rename possible | View breaks silently | **Low** |
| 7 | `work_orders` RLS (migration 00011) uses `IN (select...)` instead of `get_user_organization_id()` | Policy inconsistency | **Medium** |
| 8 | No cross-service transactions | Partial failures result in inconsistent state | **Medium** |
| 9 | In-memory cache in report-service.ts has no invalidation hooks | Stale dashboard data shown after mutation | **Medium** |
| 10 | `revalidateTag` called with `"max"` parameter that doesn't exist | Cache never invalidates at max priority | **Low** |
