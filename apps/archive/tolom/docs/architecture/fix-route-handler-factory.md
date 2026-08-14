# Route Handler Factory — Implementation

## Created
- `src/lib/api-handler.ts` — `createRouteHandler` + `createSimpleRouteHandler` factory functions

## Refactored (27 route files)

Removed 4-line auth boilerplate (`createClient` → `getUser` → `UnauthorizedError` → try/catch) from every handler. Each route now imports only what it actually needs.

### Pattern A: `createRouteHandler` (25 files with org context)

| Route | Handlers | Before LOC | After LOC |
|-------|----------|-----------|----------|
| `organizations/[id]/work-orders/route.ts` | GET, POST | 57 | 26 |
| `organizations/[id]/services/route.ts` | GET, POST | 49 | 19 |
| `organizations/[id]/services/[serviceId]/route.ts` | GET, PATCH, DELETE | 68 | 28 |
| `organizations/[id]/customers/route.ts` | GET, POST | 63 | 25 |
| `organizations/[id]/customers/[customerId]/route.ts` | GET, PATCH, DELETE | 88 | 35 |
| `organizations/[id]/vehicles/route.ts` | GET, POST | 70 | 28 |
| `organizations/[id]/vehicles/[vehicleId]/route.ts` | GET, PATCH, DELETE | 92 | 34 |
| `organizations/[id]/branches/route.ts` | GET, POST | 55 | 18 |
| `organizations/[id]/suppliers/route.ts` | GET, POST | 49 | 19 |
| `organizations/[id]/suppliers/[supplierId]/route.ts` | GET, PATCH, DELETE | 72 | 28 |
| `organizations/[id]/purchase-orders/route.ts` | GET, POST | 49 | 19 |
| `organizations/[id]/purchase-orders/[purchaseOrderId]/route.ts` | GET, PATCH, POST | 131 | 82 |
| `organizations/[id]/vehicle-models/route.ts` | GET, POST | 48 | 17 |
| `organizations/[id]/vehicle-models/[modelId]/route.ts` | PATCH, DELETE | 48 | 20 |
| `organizations/[id]/users/route.ts` | GET, POST | 61 | 19 |
| `organizations/[id]/invoices/route.ts` | GET, POST | 72 | 32 |
| `organizations/[id]/invoices/[invoiceId]/route.ts` | GET, PATCH, DELETE | 95 | 48 |
| `organizations/[id]/invoices/[invoiceId]/payments/route.ts` | POST | 38 | 23 |
| `organizations/[id]/inventory/route.ts` | GET, POST, PATCH, DELETE | 185 | 166 |
| `organizations/[id]/inventory/parts/[partId]/route.ts` | GET, PATCH, DELETE | 70 | 25 |
| `organizations/[id]/reports/route.ts` | GET | 76 | 54 |
| `organizations/[id]/route.ts` | GET, PATCH | 60 | 18 |
| `organizations/[id]/work-orders/[workOrderId]/route.ts` | GET, PATCH, DELETE | 91 | 40 |
| `organizations/[id]/work-orders/[workOrderId]/parts/route.ts` | POST, DELETE | 60 | 31 |
| `organizations/[id]/work-orders/[workOrderId]/services/route.ts` | POST, DELETE | 60 | 33 |

### Pattern B: `createSimpleRouteHandler` (2 files without org params)

| Route | Handlers | Before LOC | After LOC |
|-------|----------|-----------|----------|
| `organizations/route.ts` | GET, POST | 56 | 19 |
| `profile/route.ts` | GET | 4 | 7 |

### Unchanged (public, no auth)

- `invoice/public/[token]/route.ts` — public endpoint, no auth

## What the factory eliminates

Each handler previously required:
```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new UnauthorizedError();
// ... plus try/catch wrapper
```

This was repeated **~65 times** across 27 files. Now lives in exactly one place.

## Post-refactor checks

- `npx tsc --noEmit`: 0 errors (excluding pre-existing recharts module resolution)
- All business logic preserved exactly
- Route handler signatures unchanged for Next.js framework
