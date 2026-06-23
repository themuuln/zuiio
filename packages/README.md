# @zer packages

Reusable packages extracted from the Zer ERP. Each package is database-agnostic and can be consumed by any Supabase-backed app.

## Packages

### `@zer/core`
Pure business primitives — zero DB/React dependencies.

| Module | Exports |
|--------|---------|
| `types` | `ActionResult<T>`, `ok()`, `err()`, `LineItem`, `ProductOption`, `CustomerOption`, `SupplierOption`, `CartItemData`, `SaleItemData`, `FormState` |
| `validation` | `requireEmail`, `requirePassword`, `getString`, `normalizePhone`, `sanitizeRedirectPath`, `escapeHtml` |
| `format` | `formatCurrency`, `formatDate`, `formatRouteDate`, `slugify` |
| `utils` | `cn` (clsx + tailwind-merge) |
| `discount` | `calculateDiscount`, `DiscountParams`, `DiscountResult`, `DiscountCondition` |

```ts
import { cn, formatCurrency, ActionResult, ok, err, calculateDiscount } from "@zer/core";
```

### `@zer/query`
TanStack Query v5 patterns — peer deps: `@tanstack/react-query`, `react`, `sonner`.

| Export | Description |
|--------|-------------|
| `useOptimisticCreate` | Prepend-optimistic create with auto rollback |
| `useOptimisticUpdate` | Merge-optimistic update with auto rollback |
| `useOptimisticDelete` | Filter-optimistic delete with auto rollback |
| `QueryProvider` | Pre-configured `QueryClientProvider` (staleTime 30s, gcTime 5m) |

```ts
import { useOptimisticCreate, useOptimisticUpdate, useOptimisticDelete, QueryProvider } from "@zer/query";
```

### `@zer/config`
Shared TypeScript configuration.

```json
// tsconfig.json in any package
{ "extends": "@zer/config/tsconfig.base.json" }
```

## Using in a new app

In `pnpm-workspace.yaml` of your monorepo root:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

In your new app's `package.json`:
```json
{
  "dependencies": {
    "@zer/core": "workspace:*",
    "@zer/query": "workspace:*"
  }
}
```

In your new app's `tsconfig.json`:
```json
{
  "paths": {
    "@zer/core": ["../../packages/core/src/index.ts"],
    "@zer/query": ["../../packages/query/src/index.ts"]
  }
}
```

## What stays per-app (NOT shared)

- Supabase schema types (`supabase/types.ts`) — table shapes differ per project
- Server clients (`supabase/client.ts`, `supabase/server.ts`) — each app has its own URL/anon key
- Server actions — tied to specific table schemas
- Feature components — product/invoice/sales UIs
- Query keys (`query/keys.ts`) — entity names differ per project
- Query hooks (`query/hooks/`) — entity-specific data fetching
- `erp.ts`, `branches.ts` — app-specific org context
- `accounting.ts`, `email.ts`, `reports.ts` — infrastructure tied to Zer's schema

## Roadmap

- `packages/ui` — Extract the 74 shadcn/ui components once the app moves to `apps/zer/`
- `packages/supabase-helpers` — Generic `createSimpleQuery` factory decoupled from the Supabase client import
- Move root app to `apps/zer/` for a true multi-app monorepo structure
