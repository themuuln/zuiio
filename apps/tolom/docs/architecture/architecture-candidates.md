# Architecture Deepening Candidates

> Following the [improve-codebase-architecture](https://github.com/mattpocock/skills) methodology.
> Generated: 2026-05-12 from parallel analysis of lib layer, page layer, middleware/auth, and database schema.

---

## Domain Context

TOLOM is a multi-tenant auto service SaaS (Phase 1). The key domain concepts are:

- **Organization** — the auto service shop (multi-tenant root)
- **Branch** — physical location (single branch for Phase 1)
- **Customer** — vehicle owner (individual or company)
- **Vehicle** — customer's car/truck (linked via vehicle_owners)
- **Work Order** — the core workflow unit (status: New → Diagnosing → In Progress → Ready → Completed → Cancelled)
- **Service** — catalog item (oil change, brake pad replacement) with price history
- **Part** — physical part (catalog item) with price history
- **Bay** — physical garage bay with drag-and-drop assignment
- **Inventory Ledger** — movement-based inventory (never update quantity directly)
- **Dashboard** — analytics/reporting surface with KPI cards, charts, trends

---

## Candidate 1: Real Seam Between HTTP and Business Logic

**Files:** `src/app/api/organizations/[id]/*/route.ts` (25+ files)

**Problem:** Every API route is a shallow wrapper — its interface (route handler signature) is nearly as complex as its implementation (auth check + param extraction + one service call). The pattern is copy-pasted across 25 files, meaning any change to auth or error handling must be made in 25 places. **This is a shallow module pattern at the route level.**

**Solution:** Create a `createRouteHandler` higher-order function that absorbs the auth check, org ID extraction, and error handling into a single seam. Each route becomes:

```typescript
export const GET = createRouteHandler(async ({ orgId, request }) => {
  const filters = parseFilters(request);
  return await getWorkOrders(orgId, filters);
});
```

**Benefits (locality + leverage):**
- Auth and error handling live in one place (one file to audit)
- Routes express *only* their unique logic (5 lines instead of 25)
- Adding new routes is trivial
- Changing auth means changing one module, not 25

**Seam reality:** Currently the `AppError` hierarchy + `handleApiError` is *one adapter* for error responses. Adding `createRouteHandler` as a second adapter (the "real" seam) means error handling can be swapped without touching routes.

**Deletion test:** If you delete `createRouteHandler`, each route's boilerplate reappears across 25 files. It's earning its keep.

---

## Candidate 2: Injectable Supabase Client Across Services

**Files:** All `src/lib/services/*.ts` (14 files, ~90 `createClient()` calls)

**Problem:** Every service function creates its own Supabase client. This means:
- No test seam — cannot inject a mock client
- No adapter pattern — there's exactly one implementation
- Potential overhead — each `createClient()` parses cookies and initializes a connection

**Solution:** Pass `supabase` as a function parameter. The API route creates the client once and threads it through:

```typescript
// Service function becomes:
export async function getWorkOrders(
  supabase: SupabaseClient,
  orgId: string,
  filters?: WorkOrderFilters,
): Promise<WorkOrderWithRefs[]> {
  // use supabase directly — no createClient()
}
```

**Benefits:**
- **Testability:** Unit test services with a mock Supabase client
- **Performance:** One client creation per request instead of N per request
- **Locality:** Service functions stop depending on the global auth/session context
- **Real seam:** The interface is "a Supabase client" — any client works (real, mock, read-replica)

**Deletion test:** If you delete all `createClient()` from services, complexity collapses into the API route boundary (one client creation per request). The 90+ scattered calls become ~30 centralized ones.

---

## Candidate 3: Transaction Safety for the Work Order Creation Path

**Files:** `src/lib/services/work-order-service.ts`

**Problem:** `createWorkOrder()` does 7+ sequential DB inserts without a transaction. If the price history insert fails after the status history insert succeeds, orphan data remains. For a financial product, this is a data integrity risk.

**Solution:** Wrap the entire creation flow in a Supabase RPC (PostgreSQL function) that uses a database transaction. The RPC accepts all parameters at once and either succeeds or rolls back entirely.

**Benefits:**
- **Atomicity:** All-or-nothing for the work order creation
- **Locality:** The creation path is one DB call instead of 7+
- **Performance:** One round-trip instead of N

**Why this is deepening:** Currently the work order creation *interface* is one function signature, but the *implementation* spans 7+ separate DB calls. A transaction wraps them behind a single DB seam — the interface stays the same, but the implementation becomes atomic.

---

## Candidate 4: Unify Data Fetching Patterns Under React Query

**Files:** `src/app/[locale]/dashboard/page.tsx`, `src/lib/queries/use-customers.ts`

**Problem:** Two data-fetching patterns coexist:
- **React Query hooks** — `useCustomers`, `useCurrentOrg` (cached, deduped, retried)
- **Imperative fetch + useState** — dashboard page, finance page (manual state, no cache, no retry)

The dashboard page doesn't benefit from React Query's 5 years of edge-case handling (stale-while-revalidate, background refetch, query deduplication).

**Solution:** Create a `useDashboardData(orgId, period)` hook and migrate dashboard + finance pages to use it.

**Benefits:**
- **Consistency:** One pattern across all pages
- **Leverage:** React Query provides caching, retry, and dedup "for free" — re-implementing it manually is shallow
- **Locality:** All query key factories live in `src/lib/queries/keys.ts` — adding a new query means adding a key factory and a hook

**Deletion test:** If you delete the imperative fetch pattern, complexity concentrates in the React Query hooks. If you delete the hooks, complexity scatters back across individual pages.

---

## Candidate 5: Centralize Camel-Snake Mapping

**Files:** All `src/lib/services/*.ts` (every create/update function)

**Problem:** Every service function manually maps `camelCase` params → `snake_case` DB columns:

```typescript
// 15 lines of mapping per function
first_name: params.firstName?.trim() || null,
last_name: params.lastName?.trim() || null,
company_name: params.companyName?.trim() || null,
```

This is **shallow** — the mapping interface (the list of fields) is nearly as complex as the mapping implementation (the assignment). It's repeated in ~12 functions across 6+ service files.

**Solution:** Create a single `toSnake<T>(obj)` utility that recursively converts camelCase keys to snake_case, or generate DB types with camelCase casing from the start (Supabase CLI supports `--camelCase`).

**Benefits:**
- Eliminates ~100 lines of repetitive mapping
- Prevents drift (new field added to type but forgotten in mapping)
- Single source of truth for the transformation

---

## Candidate 6: Extract Work Order Detail Query from Report Service

**Files:** `src/lib/services/report-service.ts` → `src/lib/services/work-order-service.ts`

**Problem:** `report-service.ts` lazily imports `getWorkOrder` via dynamic `await import()` to avoid a circular dependency. This creates:
- An unnecessary second Supabase client creation
- A runtime import that could throw if paths change
- A confusing local `getWorkOrder` that shadows the real one

**Solution:** Extract the shared query logic (fetch WO + services + parts + status history + customer/vehicle/mechanic) into a third module under `src/lib/services/_queries/` that both services import normally.

**Benefits:**
- Clean dependency graph — no cycles
- Single source of truth for the "work order detail" query pattern
- Eliminates the wasted client creation

---

## Candidate 7: Decompose the Work Order Wizard

**File:** `src/app/[locale]/dashboard/work-orders/new/page.tsx` (~900 lines)

**Problem:** A single client component with ~40 local state variables managing a 6-step wizard. The **interface** (component boundary with props) is nearly as complex as the **implementation** (900 lines of imperative state management).

**Solution:** Split into step-level components:
- `SelectCustomerStep` — customer search + quick-create
- `SelectVehicleStep` — vehicle search + quick-create
- `AddServicesStep` — service line items with catalog lookup
- `AddPartsStep` — part line items
- `AssignMechanicStep` — mechanic selection
- `ReviewStep` — summary + submit

Use React Context or Zustand for shared wizard state.

**Benefits:**
- Each step is independently testable
- Form validation is declarative instead of manual
- State management is predictable instead of scattered across 40 `useState` calls

---

## Candidate 8: Remove Duplicate Auth Page Trees

**Files:** `src/app/[locale]/auth/` and `src/app/auth/`

**Problem:** Two complete auth page trees exist — locale-prefixed and non-locale. This is likely migration residue. If both are live, auth bugs will appear in one but be fixed in the other.

**Solution:** Determine which tree the middleware actually redirects to. Remove the other tree. Update middleware redirects to be consistent.

**Benefit:** Eliminates a source of future drift and confusion.

---

## Candidate 9: Inventory Route Type Switch Anti-Pattern

**File:** `src/app/api/organizations/[id]/inventory/route.ts` (~200 lines with switch statements)

**Problem:** One route handles GET/POST/PATCH/DELETE for 6 different entity types (parts, balances, movements, suppliers, POs, PO items) using `?type=` query param switches. This is a **shallow router** — the switch dispatches to different services but provides no interface benefit.

**Solution:** Split into separate routes:
- `api/.../inventory/parts/route.ts`
- `api/.../inventory/movements/route.ts`
- `api/.../inventory/suppliers/route.ts`
- `api/.../inventory/purchase-orders/route.ts`

**Benefit:** Standard Next.js route conventions, easier to find, testable independently.

---

## Summary

| # | Candidate | Depth | Effort | Risk |
|---|-----------|-------|--------|------|
| 1 | Route handler factory | Deep | Medium | Low — mechanical refactor |
| 2 | Injectable Supabase client | Deep | Large | Low — mechanical, but touches every file |
| 3 | Transaction-safe WO creation | Deep | Medium | Medium — SQL changes |
| 4 | Unify data fetching (React Query) | Deep | Medium | Low — new hooks, migrate pages |
| 5 | Camel-snake mapping | Shallow* | Small | Low — utility function |
| 6 | Fix circular dependency | Deep | Small | Low — module extraction |
| 7 | Decompose WO wizard | Deep | Large | Low — component only |
| 8 | Remove duplicate auth trees | N/A | Medium | Medium — needs careful verification |
| 9 | Split inventory route | Deep | Small | Low — mechanical |

*\*Candidate 5 is a shallow solution but eliminates shallow code — the trade-off is worth it.*

### Recommended Order

1. **Candidates 5 + 6** (immediate, low-effort wins)
2. **Candidate 4** (dashboard pattern consistency)
3. **Candidate 1** (route boilerplate elimination)
4. **Candidate 3** (data integrity — before financial features expand)
5. **Candidate 8** (auth cleanup — before multi-branch)
6. **Candidate 2** (unlocks unit testing across the service layer)
7. **Candidates 7 + 9** (decomposition as features grow)
