# Architecture Analysis: `src/lib/` Layer

> Generated: 2026-05-12
> Analysis based on deep-dive exploration of `src/lib/`, `src/app/api/`, `src/components/`, and codebase-wide patterns.

---

## 1. Executive Summary

TOLOM's lib layer shows **deliberate structure** with clear separation between types, services, Supabase clients, and utilities. The codebase is not yet large (14 service files, ~30 API routes, ~10 components), so friction is *latent* — it will compound as the codebase grows.

**Major finding: The architecture has two good seams (API routes → Services → Supabase) but neither seam is real yet because every service depends on `@/lib/supabase/server`'s `createClient()` directly.** There is no adapter, no injectable client, and no test seam. The N+1 problem is already visible in the report service's earlier commits (now patched with batched helpers), and duplicate patterns across service files suggest the abstraction is not yet deep enough to prevent drift.

---

## 2. Layer Structure

```
src/lib/
├── supabase/          # Supabase client factories (client, server, middleware)
├── services/          # Business logic (14 files)
├── types/             # API-level + convenience types
├── queries/           # React Query hooks + key factories
├── cache/             # Tag-based cache keys + invalidation helpers
├── actions/           # Server Actions
├── i18n/              # Internationalization routing
├── database.types.ts  # Auto-generated DB row types (1383 lines)
├── errors.ts          # AppError hierarchy + handleApiError
├── audit.ts           # Centralized audit logging
├── utils.ts           # cn() helper + formatCurrency
├── rate-limit.ts      # In-memory rate limiter
└── auth-redirect.ts   # Client-side auth redirect helpers
```

---

## 3. Deepening Opportunities

### 3.1. Candidate A: Service Client Injection (High Impact)

**Files:** All `src/lib/services/*.ts`, `src/lib/supabase/server.ts`

**Problem:** Every service function calls `createClient()` internally — this happens **~90 times across 14 service files**. This means:

- **No testability**: Cannot inject a mock or test client. Every function is coupled to real DB.
- **No test seam**: The supabase adapter is hypothetical — there's only one implementation.
- **Latent perf issue**: Each call creates a new Supabase + cookie store client. In report-service, the public functions call `createClient()` *then* pass `supabase` to batched helpers, but the top-level entry points still create an unnecessary first client.
- **`_getOrgId` inconsistency**: `work-order-service.ts` queries `organization_users` directly; `bay-view-service.ts` uses `rpc("get_user_organization_id")`. Same intent, different implementations.

**Solution:** Accept `supabase` as a parameter in all service functions. Create the client once at the API route / server action boundary and pass it through.

**Benefits:**
- **Testability**: Services become testable with a mock Supabase client in unit tests.
- **Real seam**: Two adapters (real client + test mock) makes the seam real.
- **Locality**: Cache invalidation, audit logging, and auth resolution happen at one boundary.
- **Eliminates `_getOrgId` duplication**: Pass orgId from the API route.

**Deletion test:** If we deleted all `createClient()` calls from services, would complexity concentrate in a single adapter boundary? **Yes.** The 90+ calls would collapse into ~30 calls at the API route/action boundary. The services become pure data transformations.

---

### 3.2. Candidate B: API Route Boilerplate Extraction (Medium Impact)

**Files:** All `src/app/api/organizations/[id]/*/route.ts` (~25 files)

**Problem:** Every API route has the same 6-line boilerplate:

```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new UnauthorizedError();
const { id: orgId } = await context.params;
// ... one line of unique work
const result = await someService(orgId, body);
return NextResponse.json({ data: result });
```

This is **~50 lines of boilerplate per route × ~25 routes = ~1250 lines** doing the same thing. The interface (what the route does) is nearly as complex as the implementation (boilerplate + one unique call).

**Solution:** Create a higher-order route handler:

```typescript
// src/lib/api-handler.ts
export function createRouteHandler<T>(
  handler: (ctx: { orgId: string; user: User; request: NextRequest; params: Record<string, string> }) => Promise<T>,
) {
  return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new UnauthorizedError();
      const params = await context.params;
      const result = await handler({ orgId: params.id, user, request, params });
      return NextResponse.json({ data: result }, { status: result ? 200 : 204 });
    } catch (error) {
      return handleApiError(error);
    }
  };
}
```

**Benefits:**
- **Leverage**: Each route becomes 1-3 lines of actual logic.
- **Locality**: Auth, org, and error handling live in one place. Change the pattern once, not 25 times.
- **Deletion test**: If you delete the handler factory, all 25 routes become inconsistent. If you keep it, you can change auth/error handling in one place.

---

### 3.3. Candidate C: Transaction Safety in Work Order Creation (High Impact)

**File:** `src/lib/services/work-order-service.ts`

**Problem:** `createWorkOrder()` does 7 sequential DB operations without a transaction:

1. Insert work order
2. Insert status history
3. Optionally assign mechanic
4. For each service: add service + fetch vehicle + insert price history
5. For each part: add part + fetch vehicle + insert price history

If step 4 fails after step 2, you have a dangling status history record. If the price history insert fails, you lose the price data but the service/part is recorded. **This is a data integrity risk for a financial product.**

**Solution:** Use Supabase RPC (PostgreSQL function) for the entire creation flow inside a single DB transaction, OR use Supabase's `rpc()` with a transaction-safe function.

**Benefits:**
- **Locality**: The entire work order creation path is atomic.
- **Data integrity**: No orphaned records.
- **Simplicity**: One DB call instead of 7+.

---

### 3.4. Candidate D: Unify Data Fetching Patterns (Medium Impact)

**Files:** `src/app/[locale]/dashboard/page.tsx` → `src/lib/queries/`

**Problem:** Two data-fetching patterns coexist:
1. **React Query hooks** — `useCustomers`, `useCurrentOrg`, `useOrganization` in `src/lib/queries/`
2. **Imperative fetch** — The dashboard page uses `useEffect` + `fetch()` directly instead of a `useDashboardData` hook

This means:
- The dashboard doesn't benefit from React Query's caching, background refetch, or error retry
- Every other list page (customers, vehicles) needs to reimplement the same fetch logic
- Cache invalidation in `cache/server.ts` uses Next.js `revalidateTag` but the client never uses those tags

**Solution:** Create a `useDashboard(orgId, period)` hook in `src/lib/queries/` that wraps the `/reports?type=dashboard` endpoint, then use it in the dashboard page.

**Benefits:**
- Consistency in fetching patterns
- Automatic cache deduplication (React Query)
- Testable queries with MSW or mock adapters
- Reduces imperative useEffect complexity in the dashboard page

---

### 3.5. Candidate E: Camel ↔ Snake Case Mapping (Medium Impact)

**Files:** `src/lib/types/index.ts` → All service files

**Problem:** Service parameter types use `camelCase` (e.g., `firstName`, `lastName`) but the DB uses `snake_case`. Every service file manually maps between them:

```typescript
// In customer-service.ts:
first_name: params.firstName?.trim() || null,
last_name: params.lastName?.trim() || null,
```

This mapping is repeated in every service (customer, vehicle, work-order, inventory, etc.). It's **shallow** — the mapping interface is nearly as complex as the mapping implementation.

**Solution:** Either:
- (A) Generate DB types with camelCase directly (Supabase gen types option)
- (B) Create a single `toSnakeCase(obj)` utility that recursively converts
- (C) Use Supabase's native Postgres JSON handling

**Benefits:**
- Eliminates ~15 lines of mapping per service function
- Single responsibility — mapping is centralized
- Prevents drift (a new field added to types but missed in mapping)

---

### 3.6. Candidate F: Report Service Circular Dependency Resolution (Medium Impact)

**File:** `src/lib/services/report-service.ts`

**Problem:** `report-service.ts` lazily imports `getWorkOrder` from `work-order-service.ts` via dynamic `await import()`:

```typescript
async function getWorkOrder(id: string): Promise<WorkOrderDetail> {
  const _supabase = await createClient();
  const { getWorkOrder } = await import("./work-order-service");
  return getWorkOrder(id);
}
```

This is a **code smell**:
- The lazy import is only needed because both services import `createClient` and report-service calls work-order-service internally
- It creates an unnecessary second Supabase client (`_supabase` is created but never used)
- The function signature claims to be `getWorkOrder()` but creates a *new* client instead of using an existing one

**Solution:** Extract the common `getWorkOrderDetail` query logic into a shared module (e.g., `src/lib/services/_queries/work-order-queries.ts`) that both services import normally. OR, if client injection is implemented (Candidate A), pass the same client instance.

**Benefits:**
- Clean dependency graph (no circular imports)
- Single source of truth for work order detail fetching
- No wasted client creation

---

### 3.7. Candidate G: Monolithic NewWorkOrderPage Decomposition (Medium Impact)

**File:** `src/app/[locale]/dashboard/work-orders/new/page.tsx` (~900 lines)

**Problem:** The new work order wizard is a single client component with ~40 `useState` calls, 6-step state machine in local state, and no form library. The component handles:

- Customer search/create
- Vehicle search/create
- Service line items (add/remove/edit)
- Part line items (add/remove/edit)
- Mechanic selection
- Review & submit

The **interface** (6 steps, the component boundary) is nearly as complex as the **implementation** (900 lines, 40 state variables).

**Solution:** Split into step-level components. Use React Context or Zustand for wizard state. Consider `react-hook-form` for form validation.

**Benefits:**
- Each step component is independently testable
- Form validation is declarative instead of manual
- State is predictable instead of scattered across 40 `useState` calls

---

### 3.8. Candidate H: Search Function Pass-Through (Quick Win)

**File:** `src/lib/services/customer-service.ts`

**Problem:** `searchCustomers` is a pure pass-through:

```typescript
export async function searchCustomers(orgId: string, query: string): Promise<CustomerWithVehicleCount[]> {
  return getCustomers(orgId, query);
}
```

**Deletion test:** If you delete `searchCustomers`, complexity does not concentrate anywhere — it just moves to the callers, who call `getCustomers` directly. **The module is shallow.**

**Solution:** Remove `searchCustomers` and have API routes call `getCustomers` with the optional search parameter directly. Or, if the distinction is meaningful (search vs. list have different query logic), make the interface different enough to justify the module.

---

### 3.9. Candidate I: Address Duplicate Auth Flows

**Files:** `src/app/[locale]/auth/` and `src/app/auth/`

**Problem:** Two parallel auth page trees exist — one with locale prefix and one without. Both have:
- login
- signup
- forgot-password
- reset-password
- callback
- select-organization
- confirm-email

This is likely migration residue from adding i18n. The non-locale tree may be dead code, or may be used by the middleware for redirects.

**Risk:** If both are live, they diverge. Auth bugs appear in one but not the other.

**Solution:** Determine which auth tree is canonical, remove the other, and update middleware to redirect to the correct one.

---

### 3.10. Candidate J: In-Memory Cache in Report Service (Context Note)

**File:** `src/lib/services/report-service.ts`

**Problem:** The dashboard report service implements its own in-memory cache:

```typescript
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 30_000;
```

This competes with Next.js `revalidateTag` (used elsewhere in the same service), won't share across Vercel instances, and is not invalidatable by tag.

**Not a candidate for immediate change** because:
- The 30s TTL is acceptable for a MVP
- The service already has the batching optimization
- It's documented with an inline comment

**But flag for Phase 2:** Replace with Redis/Upstash or Vercel KV for multi-instance caching.

---

## 4. Files to Monitor

| File | Issue | Recommendation |
|------|-------|---------------|
| `src/lib/services/bay-view-service.ts` | 430 lines, 10 functions, all create their own client | Inject client (Candidate A) |
| `src/lib/services/work-order-service.ts` | 420 lines, no transactions, mixed concerns | Add transactions (Candidate C) |
| `src/app/[locale]/dashboard/work-orders/new/page.tsx` | 900-line monolith | Decompose (Candidate G) |
| `src/app/[locale]/auth/` + `src/app/auth/` | Duplicate auth trees | Clean up dead code (Candidate I) |
| `src/lib/services/inventory-service.ts` | 500+ lines, 20+ functions, most fragile service | Needs transaction safety |
| `src/app/api/organizations/[id]/inventory/route.ts` | Mixed concerns (parts + movements?) | Check route granularity |

---

## 5. Relationship to MASTER_PLAN

### Phase 0 (Multi-Tenant Foundation) — Mostly Complete
- Auth, orgs, branches, roles, RLS — all present
- Missing: Integration tests for RLS policies

### Phase 1 (Startup CRM) — In Progress
- Customers, vehicles, work orders — implemented
- Services, mechanic assignments — implemented
- **Friction:** The work order creation flow lacks transaction safety (Candidate C)

### Phase 2 (Parts Catalog + Inventory) — Partial
- Parts catalog, inventory movements — implemented
- Purchase orders, suppliers — implemented
- **Friction:** Inventory service is the largest at 500+ lines and does `createPart`, `updatePart`, `getPartsCatalog`, `getPart`, `createMovement`, `getMovements`, `getBalance` plus all supplier and PO logic — possibly too many responsibilities

### Dashboard & Analytics — Early
- Dashboard API + report service exist with per-query optimization
- React Query hooks exist for customers, vehicles, org
- **Friction:** Dashboard page doesn't use React Query (Candidate D)
- **Friction:** In-memory cache won't scale (Candidate J context note)

---

## 6. Key Metrics

| Metric | Count | Notes |
|--------|-------|-------|
| Service files | 14 | Well-organized, consistent naming |
| API route files | ~25 | Highly repetitive boilerplate |
| `createClient()` calls in services | ~90 | Every function creates its own |
| Custom error types | 5 | NotFound, Unauthorized, Forbidden, Validation, Conflict |
| `revalidateTag()` calls per WO create | ~6 | Could be batched with transaction |
| `AppError` instances thrown | ~20 per service | Consistent pattern |
| Line count: `database.types.ts` | 1383 | Auto-generated, acceptable |
| Line count: `types/index.ts` | ~450 | API-level types, some could be derived |
| Component files | ~30 | Good separation by domain |
| Pages with imperative fetch | 1 (dashboard) | Only outlier vs React Query pattern |

---

## 7. Priority Recommendations

| Priority | Candidate | Effort | Impact |
|----------|-----------|--------|--------|
| **P0** | C — Transaction safety in WO creation | Medium | Prevention of data corruption in financial records |
| **P1** | A — Service client injection | Large | Unlocks unit testing across whole service layer |
| **P2** | B — API route boilerplate extraction | Medium | 80% reduction in route file sizes, DRY auth |
| **P2** | D — Unify data fetching patterns | Medium | Removes the only imperative data fetch |
| **P3** | E — Camel/snake case mapping | Small | Eliminates repetitive boilerplate |
| **P3** | F — Report service circular dep | Small | Clean dependency graph |
| **P3** | G — WO wizard decomposition | Medium | Testability & maintainability |
| **P4** | H — Remove pass-through searchCustomers | Trivial | One less file to maintain |
| **P4** | I — Duplicate auth cleanup | Medium | Eliminates drifting duplicate code |
| **Context** | J — In-memory cache | Flag for Phase 2 | Monitor as user base grows |

---

## 8. Service Dependency Graph (Current)

```
API Routes
  │
  ├─► Services (business logic)
  │     ├─► createClient() ──► Supabase DB
  │     ├─► audit.ts (centralized, but creates own client)
  │     ├─► errors.ts (shared)
  │     └─► cache/keys.ts + cache/server.ts
  │
  ├─► Server Actions
  │     ├─► createClient() ──► Supabase DB
  │     └─► [services] (calls same services as API routes)
  │
  └─► Middleware
        └─► updateSession() ──► Supabase
```

**What's missing:** A dedicated data access layer (DAL) between services and Supabase. Services currently contain both business logic AND query logic. A DAL would allow:

- Database-agnostic service code
- Easier migration to materialized views or read replicas
- Centralized query performance monitoring
- Separation of read vs. write paths for CQRS patterns later

---

## 9. Notable Strengths (Preserve)

1. **Cache tag system** (`cache/keys.ts`) — Well-designed factory pattern, all tags centralized
2. **Error hierarchy** (`errors.ts`) — Proper class hierarchy with HTTP status codes, `handleApiError` is clean
3. **Audit logging** (`audit.ts`) — Centralized, well-documented, handles fallbacks gracefully
4. **Report service batching** — The `getRevenueTrendBatched`, `getTechnicianPerformanceBatched` etc. show conscious N+1 optimization
5. **Component structure** — Domain-organized (`bay-view/`, `charts/`, `ui/`), consistent patterns
6. **DataTable component** — Well-designed with loading skeleton, empty state, mobile-responsive layout
7. **Type safety** — Database types + API types are thorough and well-maintained
8. **Multi-tenancy** — Every query scoped to `organization_id` consistently
