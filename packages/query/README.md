# @zuiio/query — Optimistic Mutation Primitives

TanStack Query v5 + React 19 mutation helpers with automatic optimistic caching, rollback, offline queue support, and toast feedback.

## Quick Install

```bash
bun add @zuiio/query @tanstack/react-query
# peer: react ^19, sonner ^2
# internal peers: @zuiio/hooks, @zuiio/offline
```

Wrap your app root with the provider:

```tsx
import { QueryProvider } from "@zuiio/query";

export default function RootLayout({ children }) {
  return <QueryProvider>{children}</QueryProvider>;
}
```

## Optimistic Hooks

Accept `FormData` via `mutationFn`. Snapshot the cache before mutation and restore on error. For typed variables (non-FormData), use `useOrgMutation` instead.

```tsx
"use client";
import {
  useOptimisticCreate,
  useOptimisticUpdate,
  useOptimisticDelete,
} from "@zuiio/query";

const serviceKeys = {
  all: (orgId: string) => ["services", orgId] as const,
  list: (orgId: string) => ["services", orgId, "list"] as const,
};

function ServiceList({ orgId }: { orgId: string }) {
  // Create — prepend to list instantly
  const create = useOptimisticCreate<Service>({
    mutationFn: async (fd) => createService(fd),
    queryKey: () => serviceKeys.list(orgId),
    buildOptimistic: (fd) => ({
      id: crypto.randomUUID(),
      name: fd.get("name") as string,
    }),
  });

  // Update — merge partial into matching item
  const update = useOptimisticUpdate<Service>({
    mutationFn: async (fd) => updateService(fd),
    queryKey: () => serviceKeys.list(orgId),
    getId: (fd) => fd.get("id") as string,
    buildOptimistic: (fd) => ({
      name: fd.get("name") as string,
    }),
  });

  // Delete — remove from list instantly
  const del = useOptimisticDelete({
    mutationFn: async (fd) => deleteService(fd),
    queryKey: () => serviceKeys.list(orgId),
    getId: (fd) => fd.get("id") as string,
  });

  return (
    <form onSubmit={(e) => {
      const fd = new FormData(e.currentTarget);
      create.mutate(fd, { onSuccess: () => e.currentTarget.reset() });
    }}>
      {/* ... */}
    </form>
  );
}
```

### useOptimisticUpsert

Insert or update: if the item (identified by `getId`) exists in cache, merge the partial from `buildOptimistic`; otherwise prepend the full item.

```tsx
const upsert = useOptimisticUpsert<Service>({
  mutationFn: async (fd) => upsertService(fd),
  queryKey: () => serviceKeys.list(orgId),
  getId: (item) => item.id,
  getIdFormData: (fd) => fd.get("id") as string,
  buildOptimistic: (fd, existingItem) => ({
    name: fd.get("name") as string,
    ...(existingItem ? {} : { id: crypto.randomUUID() }),
  }),
});
```

## Org Mutation Factory

`useOrgMutation` replaces ~40 lines of boilerplate per mutation. One call handles: `fetch` + offline queue + optimistic cache + rollback + toast + invalidation.

```tsx
import { useOrgMutation } from "@zuiio/query";

type Service = { id: string; name: string; price: number };

const createService = useOrgMutation<Service, { name: string; price: number }>({
  endpoint: `/api/orgs/${orgId}/services`,
  method: "POST",
  queryKey: serviceKeys.all(orgId),

  // Optimistic: append temp item with stable UUID
  optimisticUpdate: (cached, vars, ctx) => [
    ...cached,
    { id: ctx.optimisticId, ...vars, created_at: ctx.submittedAt },
  ],

  successMessage: "Service created",
});

// Usage
createService.mutate({ name: "Oil Change", price: 50000 });
```

When offline, mutations are queued and replay automatically when connectivity returns. Check result with `isQueuedResult(data)`.

```tsx
import { useOrgMutation, isQueuedResult } from "@zuiio/query";

const result = await createService.mutateAsync(vars);
if (isQueuedResult(result)) {
  toast.info("Saved offline — will sync when connected");
}
```

## API Reference

### QueryProvider

| Prop | Type | Description |
|---|---|---|
| `children` | `ReactNode` | App subtree |

Creates a `QueryClient` with `staleTime: 30s`, `gcTime: 5min`. Client lives in a `useRef` to survive re-renders.

### useOptimisticCreate

| Parameter | Type | Description |
|---|---|---|
| `mutationFn` | `(formData: FormData) => Promise<unknown>` | Server action or fetch call |
| `queryKey` | `() => readonly string[]` | Cache key factory (function) |
| `buildOptimistic` | `(formData) => TItem` | Returns temp item to prepend |

Returns `UseMutationResult`. Call via `mutate(data, { onSuccess })`.

### useOptimisticUpdate

| Parameter | Type | Description |
|---|---|---|
| `mutationFn` | `(formData: FormData) => Promise<unknown>` | Server action or fetch call |
| `queryKey` | `() => readonly string[]` | Cache key factory (function) |
| `getId` | `(formData) => string` | Extract item ID to match |
| `buildOptimistic` | `(formData) => Partial<TItem>` | Partial to merge into cached item |

Returns `UseMutationResult`.

### useOptimisticDelete

| Parameter | Type | Description |
|---|---|---|
| `mutationFn` | `(formData: FormData) => Promise<unknown>` | Server action or fetch call |
| `queryKey` | `() => readonly string[]` | Cache key factory (function) |
| `getId` | `(formData) => string` | Extract item ID to remove |

Returns `UseMutationResult`. Matches both `id` and `productId` fields.

### useOptimisticUpsert

| Parameter | Type | Description |
|---|---|---|
| `mutationFn` | `(formData: FormData) => Promise<unknown>` | Server action or fetch call |
| `queryKey` | `() => readonly string[]` | Cache key factory (function) |
| `getId` | `(item: TItem) => string \| number` | Extract item ID from cache item |
| `getIdFormData` | `(formData: FormData) => string \| number` | Extract item ID from form data |
| `buildOptimistic` | `(formData, existingItem?) => Partial<TItem>` | Returns partial to merge (update) or full item to prepend (create) |

Returns `UseMutationResult`. Merges into cached item if found, prepends if not.

### useOrgMutation / useOfflineJsonMutation

`useOfflineJsonMutation` is an alias — use it when the context is shared offline-first JSON mutations.

| Config field | Type | Default | Description |
|---|---|---|---|
| `endpoint` | `string \| (vars) => string` | — | API URL, static or dynamic |
| `method` | `"POST" \| "PATCH" \| "DELETE"` | `"POST"` | HTTP method |
| `queryKey` | `readonly unknown[]` | — | Invalidation prefix |
| `optimisticQueryKey` | `readonly unknown[]` | `queryKey` | Exact cache key for read/write |
| `mutationKey` | `readonly unknown[]` | `["org-mutation", ...queryKey]` | Dedup key for sibling mutations |
| `optimisticUpdate` | `(cached, vars, ctx) => TCache[]` | — | Transform cache before server responds |
| `optimisticMode` | `"exact" \| "prefix"` | `"exact"` | Single cache entry vs. all matching prefix |
| `successMessage` | `string \| (vars) => string` | — | Toast on success |
| `errorMessage` | `string` | `error.message` | Toast on failure |
| `onErrorToast` | `(error, vars, { retry }) => void` | — | Custom error toast with retry |
| `invalidateKeys` | `readonly (readonly unknown[])[]` | `[]` | Extra keys to invalidate on settle |
| `bodyFn` | `(vars) => unknown` | POST/PATCH → vars | Custom request body |
| `idempotencyKey` | `(vars) => string` | — | `Idempotency-Key` header factory |
| `onSuccess` | `(data, vars) => void` | — | Side effect after online success |
| `onError` | `(error, vars) => void` | — | Side effect after rollback |

Returns `UseMutationResult<TResponse, Error, TVariables>`.

### Helpers

| Export | Description |
|---|---|
| `isQueuedResult(data)` | Type guard — `true` if mutation was queued for offline replay |
| `QUEUED_SENTINEL` | Symbol key used internally by `QueuedResult` |

### Type Exports

| Type | Description |
|---|---|
| `OrgMutationConfig<TResponse, TVariables, TCache>` | Full config shape for `useOrgMutation` |
| `OptimisticContext` | `{ optimisticId: string; submittedAt: string }` — passed to `optimisticUpdate` |
| `OptimisticCreateConfig` | Config shape for `useOptimisticCreate` |
| `OptimisticUpdateConfig` | Config shape for `useOptimisticUpdate` |
| `OptimisticDeleteConfig` | Config shape for `useOptimisticDelete` |

## Conventions

- All hooks are `"use client"`. They depend on the React Query client from `QueryProvider`.
- **Rollback is automatic** — every optimistic hook snapshots the cache before mutation and restores on error.
- For typed variables (non-FormData), use `useOrgMutation` instead of the optimistic hooks.
- `useOrgMutation` invalidates `queryKey` prefix on settle. Use `optimisticQueryKey` when the exact cache key differs from the invalidation prefix.
- When multiple mutations share a `queryKey`, use `mutationKey` to prevent one mutation's refetch from clearing another's optimistic state.
- Toasts via `sonner`. Configurable via `successMessage`, `errorMessage`, `onErrorToast`.
- Offline queue requires `MutationQueueProvider` from `@zuiio/offline`. Queued results carry a `QUEUED_SENTINEL` symbol — check with `isQueuedResult()`.
- `optimisticUpdate` receives an `OptimisticContext` with a stable `optimisticId` (UUID) and `submittedAt` (ISO timestamp) — use these instead of `Date.now()` for temp IDs.
