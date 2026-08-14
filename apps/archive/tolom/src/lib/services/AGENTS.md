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

## PATCH / Update Null Safety

Every PATCH endpoint in this project uses `buildUpdates()` from `./build-updates.ts`
to map request params to DB columns with optional transforms.

**Critical rule:** Never use `(v) => (v as string).trim()` as an inline transform.
It crashes with `TypeError: null.trim()` when the form sends `null` (empty field).

**Always import and use the shared `trimField`** from `./trim-field.ts`:
```ts
import { trimField } from "./trim-field";

const fieldMap: FieldMap<typeof params> = {
  columns: { name: "name" },
  transforms: { name: trimField },  // ✅ null-safe
};
```

**`buildUpdates` behavior:**
- `undefined` → skipped (not provided in request)
- `null` → passed through without transform (clear the DB column)
- `string` → goes through the transform (e.g., trimmed)

If you're adding a new PATCH endpoint, also add a test case in
`src/lib/services/build-updates.test.ts` covering null/empty/undefined values.

## Zod Schema ↔ DB Nullability

**Three sources of truth must agree:** DB column nullability, Zod schema, and TypeScript interface. When they drift, requests fail with `VALIDATION_ERROR`.

**Rule:** When adding or updating a Zod schema in `src/lib/validation/`, cross-check every field against the DB column's nullability in `src/lib/database.types.ts`:

| DB column type | Zod schema should use |
|---|---|
| `string` (NOT NULL) | `z.string().min(1)` |
| `string \| null` | `z.string().nullable().optional()` |
| `number` (NOT NULL) | `z.number()` |
| `number \| null` | `z.number().nullable().optional()` |
| `string \| null` (UUID) | `z.string().uuid().nullable().optional()` |

**`.optional()` alone does NOT accept `null`** — it only accepts `undefined`. For DB-nullable columns, always use `.nullable().optional()` (or `.nullish()`).

**Regression guard:** Run `npm run test -- schema-compat` after modifying any validation schema. The test in `src/lib/validation/schema-compat.test.ts` verifies nullability compatibility.

**Also update:** The `AddServiceParams` / `AddPartParams` interfaces in `src/lib/types/service-params.ts` must match — use `string | null` for nullable fields.

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
