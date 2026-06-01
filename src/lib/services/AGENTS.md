# Services Layer — Business Logic

**Role:** All server-side business logic lives here. API routes call services; pages never call services directly.

## Structure

```
src/lib/services/
├── <domain>-service.ts       # Business logic per domain
├── <domain>-service.test.ts  # Co-located tests
└── _queries/                 # Shared SQL query fragments
```

47 services organized by domain: work-orders, customers, inventory, estimates, invoices, expenses, bay-view, reports, etc.

## Conventions

- **One service per domain.** If a file exceeds 800 lines, split into sub-services or helpers.
- **Services return plain data.** No Response objects, no Next.js types — return POJOs that API routes wrap.
- **Services receive a Supabase client** as parameter (`db: SupabaseClient`). Never import `createClient()` internally.
- **Error handling:** Throw typed errors (`AppError` from `@/lib/errors`) — never return `{error}` objects. API handlers catch and format.
- **Tests are co-located** with the service file. Test files use `*.test.ts` naming.
- **Cross-service calls are allowed** (e.g., `work-order-service` calling `inventory-service`). No circular dependencies.

## Testing

- Vitest, co-located `*.test.ts` files.
- Mock Supabase `db` client for unit tests. Use `vi.mock('@/lib/supabase/server')`.
- Test edge cases: empty results, null inputs, RLS isolation (org A cannot access org B data).
- Large services (report-service: 3564 lines) should have correspondingly thorough test coverage.

## Гарын авлага Sync

When adding/modifying a service, check if any user-facing feature changed in `docs/*.md`. If so, update the corresponding doc and run `npm run docs:build`. See the Гарын авлага Sync Rule in root `AGENTS.md`.

## Large Files (Known Hotspots)

| File | Lines | Note |
|------|-------|------|
| `report-service.ts` | 3564 | Needs decomposition — read before modifying |
| `work-order-service.ts` | 904 | Core workflow logic |
| `invoice-service.ts` | 960 | Financial, needs audit trail |
| `bay-view-service.ts` | 901 | Real-time bay operations |

See `src/lib/queries/AGENTS.md` for the corresponding React Query hooks.
