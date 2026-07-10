# API Layer Analysis

> Generated: 2026-05-12
> Scope: All 24 route files under `src/app/api/` + supporting service and type infrastructure.

## Inventory of Routes

| # | Route File | Lines | HTTP Verbs | Entity |
|---|-----------|-------|------------|--------|
| 1 | `organizations/route.ts` | 56 | GET, POST | Organization (current user) |
| 2 | `organizations/[id]/route.ts` | 59 | GET, PATCH | Organization by ID |
| 3 | `organizations/[id]/branches/route.ts` | 57 | GET, POST | Branches list/create |
| 4 | `organizations/[id]/customers/route.ts` | 64 | GET, POST | Customers list/create (with search) |
| 5 | `organizations/[id]/customers/[customerId]/route.ts` | 89 | GET, PATCH, DELETE | Single customer (with vehicles) |
| 6 | `organizations/[id]/inventory/route.ts` | 184 | GET, POST, PATCH, DELETE | Inventory mega-route (6+ types) |
| 7 | `organizations/[id]/inventory/parts/[partId]/route.ts` | 71 | GET, PATCH, DELETE | Single part |
| 8 | `organizations/[id]/purchase-orders/route.ts` | 51 | GET, POST | PO list/create |
| 9 | `organizations/[id]/purchase-orders/[purchaseOrderId]/route.ts` | 130 | GET, PATCH, POST | Single PO (with inline queries) |
| 10 | `organizations/[id]/reports/route.ts` | 75 | GET | Reports (6 report types via switch) |
| 11 | `organizations/[id]/services/route.ts` | 46 | GET, POST | Service catalog list/create |
| 12 | `organizations/[id]/services/[serviceId]/route.ts` | 66 | GET, PATCH, DELETE | Single service (with price history) |
| 13 | `organizations/[id]/suppliers/route.ts` | 51 | GET, POST | Suppliers list/create |
| 14 | `organizations/[id]/suppliers/[supplierId]/route.ts` | 71 | GET, PATCH, DELETE | Single supplier |
| 15 | `organizations/[id]/users/route.ts` | 62 | GET, POST | Org users |
| 16 | `organizations/[id]/vehicle-models/route.ts` | 44 | GET, POST | Vehicle models list/create |
| 17 | `organizations/[id]/vehicle-models/[modelId]/route.ts` | 44 | PATCH, DELETE | Single vehicle model |
| 18 | `organizations/[id]/vehicles/route.ts` | 72 | GET, POST | Vehicles list/create (search, filter) |
| 19 | `organizations/[id]/vehicles/[vehicleId]/route.ts` | 91 | GET, PATCH, DELETE | Single vehicle (with service history) |
| 20 | `organizations/[id]/work-orders/route.ts` | 52 | GET, POST | Work orders list/create (with filters) |
| 21 | `organizations/[id]/work-orders/[workOrderId]/route.ts` | 86 | GET, PATCH, DELETE | Single work order (status/mechanic dispatch) |
| 22 | `organizations/[id]/work-orders/[workOrderId]/parts/route.ts` | 52 | POST, DELETE | Add/remove parts from WO |
| 23 | `organizations/[id]/work-orders/[workOrderId]/services/route.ts` | 51 | POST, DELETE | Add/remove services from WO |
| 24 | `profile/route.ts` | 7 | GET | Current user profile |
| **Total** | | **≈1457** | | |

---

## 1. Duplicate Patterns Across Routes

### 1.1 Authentication Check — 26× Identical Block

Every route file (except `profile/route.ts`) opens with this exact pattern:

```typescript
const supabase = await createClient();
const {
  data: { user },
} = await supabase.auth.getUser();
if (!user) throw new UnauthorizedError();
```

**Variations** (no semantic difference):
- `if (!user) { throw new UnauthorizedError(); }` — 14 routes use braces
- `if (!user) throw new UnauthorizedError();` — 9 routes omit braces
- 1 route (`purchase-orders/[purchaseOrderId]`) uses `if (!user) throw new UnauthorizedError();` with no braces

**Impact**: ~8 lines × 23 files = ~184 lines of pure boilerplate. Adding session refresh, MFA check, or org-scoped auth would require touching every single file.

### 1.2 Org ID Extraction — 22× Identical Block

```typescript
const { id: orgId } = await context.params;
// or
const { id: orgId } = await params;
```

Every `[id]` route extracts the org ID and passes it to service functions. No route validates that the current user actually belongs to the org—that responsibility is pushed to either:
- RLS policies at the database level, or
- The service function (e.g., `getBranches(orgId)` which filters by `organization_id = orgId`)

### 1.3 Try/Catch + handleApiError — 24× Identical Wrapper

Every exported handler function is wrapped in:

```typescript
try {
  // ... handler logic
} catch (error) {
  return handleApiError(error);
}
```

**Impact**: ~5 lines × ~55 exported handlers = ~275 lines of structural boilerplate.

### 1.4 Response Envelope — Inconsistent

Most routes use `{ data: ... }` as the response envelope, but there are deviations:

| Pattern | Routes Using It |
|---------|----------------|
| `{ data: result }` | Majority of routes |
| `{ data: null }` | DELETE handlers, some return `null`, others return `{ success: true }` |
| `{ error: { code: "...", message: "..." } }` | `purchase-orders/[purchaseOrderId]/route.ts` (manual, inline) |
| `{ error: { code: "VALIDATION_ERROR", message: "..." } }` | `work-orders/[workOrderId]/parts/route.ts`, `work-orders/[workOrderId]/services/route.ts` (manual, inline) |

The `handleApiError()` function in `src/lib/errors.ts` produces `{ error: { code, message, details } }`, but some routes return error responses directly without using it.

### 1.5 No Pagination Anywhere

`PaginatedResponse<T>` is defined in `src/lib/types/index.ts` but **never imported or used** in any route file. All list endpoints return the full data set with no `limit`, `offset`, or pagination metadata. For growing organizations, this will become a performance problem.

---

## 2. Shallow vs Deep Modules

### 2.1 Shallow Modules (Interface ≈ Implementation)

These routes are ~44–66 lines and follow an identical script. Remove any one and its complexity lives entirely in the service layer.

| Route | Lines | What It Does |
|-------|-------|-------------|
| `vehicle-models/route.ts` | 44 | GET calls `getVehicleModels`, POST calls `createVehicleModel` |
| `vehicle-models/[modelId]/route.ts` | 44 | PATCH calls `updateVehicleModel`, DELETE calls `deleteVehicleModel` |
| `services/route.ts` | 46 | GET calls `getServices`, POST calls `createService` |
| `services/[serviceId]/route.ts` | 66 | GET calls `getService` + `getServicePriceHistory`, PATCH calls `updateService` |
| `suppliers/route.ts` | 51 | GET calls `getSuppliers`, POST calls `createSupplier` |
| `suppliers/[supplierId]/route.ts` | 71 | GET calls `getSupplier`, PATCH calls `updateSupplier`, DELETE calls `deleteSupplier` |
| `purchase-orders/route.ts` | 51 | GET calls `getPurchaseOrders`, POST calls `createPurchaseOrder` |
| `branches/route.ts` | 57 | GET calls `getBranches`, POST calls `createBranch` |
| `users/route.ts` | 62 | GET calls `getOrganizationUsers`, POST calls `addUserToOrganization` |

**Assessment**: These are pure HTTP-to-function adapters. The route adds zero domain logic. The interface (`fetch /api/organizations/[id]/branches`) is as complex as the implementation (a 57-line file where 45+ lines are boilerplate).

**Deletion test**: Removing any of these files concentrates complexity in the service layer (where it already lives). The HTTP bindings could be regenerated from service function signatures.

### 2.2 Medium Modules (Some Orchestration)

| Route | Lines | Extra Logic |
|-------|-------|-------------|
| `customers/[customerId]/route.ts` | 89 | GET assembles customer + vehicles from 2 service calls |
| `vehicles/[vehicleId]/route.ts` | 91 | GET assembles vehicle + service history from 2 service calls |
| `services/[serviceId]/route.ts` | 66 | GET assembles service + price history from 2 service calls |
| `work-orders/[workOrderId]/route.ts` | 86 | PATCH dispatches on `body.status` vs `body.mechanic_id` |
| `work-orders/[workOrderId]/parts/route.ts` | 52 | DELETE validates `partId` query param inline |
| `work-orders/[workOrderId]/services/route.ts` | 51 | DELETE validates `serviceId` query param inline |

**Assessment**: These contain thin orchestration (assembling related data) or thin dispatching (conditional branches). The orchestration could be pushed into composite service functions; the dispatching could be pushed into the service layer or standardised.

### 2.3 Deep Modules (Complex Interface, Non-Obvious Implementation)

| Route | Lines | Complexity |
|-------|-------|------------|
| `inventory/route.ts` | 184 | Multiplexes 6+ entity types via `?type=` query param across all 4 HTTP verbs. Giant switch statements. Overlaps with dedicated routes (`inventory/parts/[partId]`, `suppliers/[supplierId]`, `purchase-orders/[purchaseOrderId]`). |
| `purchase-orders/[purchaseOrderId]/route.ts` | 130 | Contains inline Supabase queries (bypassing service layer) in GET and PATCH. Manual field whitelisting. POST handler for "receive" action. |
| `reports/route.ts` | 75 | Dispatches to 6+ report types via `?type=` switch. Only GET. |

**Assessment**: The inventory route is especially problematic—it's the most complex route file yet covers the most entities, and it duplicates functionality that exists in dedicated route files. The `purchase-orders/[purchaseOrderId]` route bypasses the service layer, creating an inconsistent pattern where some PO operations go through the service (`createPurchaseOrder`, `receivePurchaseOrder`) but others are inline (`get` with joins, `patch` with field whitelisting).

---

## 3. Deletion Test Analysis

"If I remove each route file, does the complexity concentrate or just move?"

### Complexity Concentrates (Good Removal Candidates with Refactoring)

Remove these routes and the complexity moves cleanly to the service layer where it should be:

- **`branches/route.ts`**, **`suppliers/route.ts`**, **`purchase-orders/route.ts`**, **`services/route.ts`**, **`vehicle-models/route.ts`**, **`vehicle-models/[modelId]/route.ts`**, **`users/route.ts`** — All pure passthrough. Complexity already lives in service functions.
- **`organizations/route.ts`**, **`organizations/[id]/route.ts`** — Same pattern. `getOrganization` doesn't even verify user membership (see §5).

### Complexity Leaks Elsewhere (Bad Removal without Refactoring)

- **`purchase-orders/[purchaseOrderId]/route.ts`** — If removed, the inline Supabase queries in GET and PATCH would need extraction to `inventory-service.ts`. The POST "receive" action would need to be added to the service.
- **`inventory/route.ts`** — If removed, each entity type (parts, balances, movements, suppliers, POs, thresholds) would need its own route file with appropriate service calls. Currently the switch dispatch lives only here.
- **`work-orders/[workOrderId]/route.ts`** — If removed, the PATCH action-dispatch logic (status change vs mechanic assignment) would need extraction.

### Genuine Orchestration (Worth Keeping Assembled)

- **`customers/[customerId]/route.ts`** — Composes customer data + vehicles from 2 service calls. This is valid API-layer orchestration, though it could be pushed into a composite service function.
- **`vehicles/[vehicleId]/route.ts`** — Same pattern.
- **`services/[serviceId]/route.ts`** — Same pattern.

---

## 4. Missing Shared Abstractions

### 4.1 `withAuth` Wrapper (Highest Priority)

Every exported handler repeats the auth check. A higher-order function would eliminate ~184 lines of boilerplate:

```typescript
// Proposed signature
export function withAuth<T>(
  handler: (context: { user: User; supabase: SupabaseClient }) => Promise<NextResponse>
): (request: NextRequest, context: RouteContext) => Promise<NextResponse>;
```

Could optionally accept a Supabase client factory to avoid creating the client twice.

### 4.2 `withOrgAccess` Middleware

Most routes need the authenticated user + verified org membership. Currently no route verifies the user belongs to the org before passing the org ID to services. A combined `withOrgAccess` wrapper would:

- Authenticate the user
- Verify the user has a membership record for the org
- Return the validated `{ user, orgId, supabase }` context

### 4.3 Request Schema Validation

There is **zero** request body validation at the route boundary. Routes rely on:
- TypeScript types for documentation (not enforced at runtime)
- Services to validate and throw `ValidationError` individually

Adding a validation layer (Zod, Valibot, or a lightweight schema) would provide:
- Early rejection with consistent error format
- Auto-generated OpenAPI specs
- Clear error messages for API consumers

### 4.4 Standard Response Builder

The envelope format is mostly `{ data: ... }` but with manual variations. A response builder would enforce consistency:

```typescript
// Proposed helpers
function ok<T>(data: T, status = 200): NextResponse;
function created<T>(data: T): NextResponse;
function noContent(): NextResponse;
```

### 4.5 Pagination Enforcer

`PaginatedResponse<T>` is defined but unused. A `withPagination` abstraction would:
- Extract `page` and `pageSize` from query params (with defaults)
- Apply `range()` to Supabase queries
- Return items + total count + pagination metadata
- Prevent unbounded result sets

### 4.6 Cache Tag Integration

Cache tags exist in `src/lib/cache/keys.ts` and are used in the service layer (only `work-order-service.ts`), but no route sets response cache headers. A `withCache` wrapper or utility would:
- Set `Cache-Control` and `Surrogate-Key` headers
- Enable SWR/stale-while-revalidate patterns
- Make the existing tag-based invalidation actually useful for CDN/caching proxies

---

## 5. Security & Consistency Issues

### 5.1 `getOrganization()` Bypasses Membership Check

The `organizations/[id]/route.ts` GET handler calls `getOrganization(id)` which fetches any org by ID without verifying the current user belongs to it:

```typescript
// src/lib/services/organization-service.ts:147
export async function getOrganization(orgId: string): Promise<Organization> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)  // no membership check
    .is("deleted_at", null)
    .single();
  // ...
}
```

This relies entirely on RLS policies (which should block cross-org reads). If RLS is correctly enforced this is safe, but it means the application layer has a false sense of access control: the route *looks* like it authenticates the user, but never checks org membership explicitly.

Compare with `getUserOrganization()` which does check the membership table—there are two different code paths for essentially the same operation.

### 5.2 Inventory Route API Surface Is Inconsistent

The `inventory/route.ts` mega-route handles parts, balances, movements, suppliers, purchase-orders, and thresholds via `?type=` query parameter, while `inventory/parts/[partId]`, `suppliers/[supplierId]`, and `purchase-orders/[purchaseOrderId]` are separate route files.

This means some operations are accessible only through the inventory mega-route (balances, movements, thresholds) while overlapping operations (parts CRUD, supplier CRUD, PO CRUD) have **two access paths**. This is confusing for API consumers and doubles the maintenance surface.

### 5.3 Inline Supabase Queries Bypass Service Layer

`purchase-orders/[purchaseOrderId]/route.ts` GET and PATCH contain raw supabase queries with joins and field whitelisting logic that should live in `inventory-service.ts`. The POST handler correctly calls `receivePurchaseOrder()` from the service, but GET/PATCH re-implement access patterns ad-hoc.

---

## 6. Recommendations (Priority Order)

### P0 — Security
1. **Add org-membership verification** to `getOrganization()` or the route handler, matching the pattern in `getUserOrganization()`.

### P1 — Boilerplate Reduction
2. **Create `withAuth` HOF** — eliminate the 26× repeated auth check block. Saves ~184 lines, adds a single enforcement point for auth changes.
3. **Create standard response helpers** (`ok`, `created`, `noContent`, `error`) — eliminate the ad-hoc `NextResponse.json(...)` calls and envelope inconsistencies.

### P2 — Consistency & Maintainability
4. **Normalize the inventory API surface** — Either split the mega-route into dedicated entity routes (consistent with the rest of the API) OR accept it as a design pattern and remove the overlapping dedicated routes. The current half-and-half approach is the worst of both worlds.
5. **Extract inline queries** from `purchase-orders/[purchaseOrderId]/route.ts` into `inventory-service.ts` for consistency.
6. **Adopt request validation** at the route boundary.

### P3 — Performance
7. **Implement pagination** on all list endpoints before data volumes grow.
8. **Add cache headers** to response helpers, leveraging the existing cache tag infrastructure.

---

## 7. File Map for Changes

| File | Issue | Change Type |
|------|-------|-------------|
| `src/lib/errors.ts` | No HOF for auth, no response helpers | Add `withAuth`, response builder functions |
| `src/app/api/organizations/[id]/route.ts` | GET lacks org membership check | Add membership verification |
| `src/lib/services/organization-service.ts:147` | `getOrganization` skips membership check | Add membership verification |
| `src/app/api/organizations/[id]/inventory/route.ts` | Mega-route with 6+ types; overlaps with dedicated routes | Normalize surface (split or consolidate) |
| `src/app/api/organizations/[id]/purchase-orders/[purchaseOrderId]/route.ts` | Inline Supabase queries in GET/PATCH | Extract to service layer |
| All `organizations/[id]/*/route.ts` | ~22× auth boilerplate | Refactor to use `withAuth` |
| `src/lib/types/index.ts` | `PaginatedResponse` defined but unused | Either use it or remove it |
