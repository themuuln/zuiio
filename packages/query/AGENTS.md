# @zuiio/query

Optimistic mutation primitives for TanStack Query v5 + React 19. Peers: `@zuiio/hooks`, `@zuiio/offline`.

## Exports

### Provider

| Export | Description |
|---|---|
| `QueryProvider` | Wraps `QueryClientProvider` with sensible defaults (`staleTime: 30s`, `gcTime: 5min`). Client lives in a `useRef` to survive re-renders. |

### Optimistic Hooks (FormData)

Accept `FormData` via `mutationFn`. Use for `Server Action`-style mutations with `createClientAction`.

| Hook | Description |
|---|---|
| `useOptimisticCreate<T>` | Prepend new item to list cache on mutate, rollback on error. |
| `useOptimisticUpdate<T>` | Merge partial into cached item by `getId`, rollback on error. |
| `useOptimisticDelete` | Remove item from list cache by `getId`, rollback on error. |

### Optimistic Hooks (JSON)

Same API as above but accepts `TVariables` directly (not `FormData`). Use for JSON `fetch` mutations.

| Hook | Description |
|---|---|
| `useOptimisticCreateJson<T>` | Prepend with JSON variables. |
| `useOptimisticUpdateJson<T>` | Merge with JSON variables. |
| `useOptimisticDeleteJson` | Remove with JSON variables. |

### Org Mutation Factory

| Export | Description |
|---|---|
| `useOrgMutation<R, V, C>(config)` | Unified mutation: HTTP call + optimistic cache + org-scoped invalidation + offline queue + toast. Replaces ~40 lines of boilerplate per mutation. |
| `useOfflineJsonMutation` | Alias for `useOrgMutation` — use when the context is shared offline-first JSON mutations. |
| `isQueuedResult(data)` | Type guard — returns `true` if a mutation was queued for offline replay. |

## Pattern

```tsx
// 1. Wrap app root
<QueryProvider><App /></QueryProvider>

// 2. Simple optimistic hook
const create = useOptimisticCreate<Service>({
  mutationFn: async (fd) => createAction(fd),
  queryKey: serviceKeys.list(orgId),
  buildOptimistic: (fd) => ({
    id: crypto.randomUUID(),
    name: fd.get("name") as string,
  }),
});
// call: create.mutate(formData, { onSuccess: close })

// 3. Org mutation factory (single-call for HTTP + cache + offline)
const { mutate } = useOrgMutation<Service, CreateVars>({
  endpoint: `/api/orgs/${orgId}/services`,
  method: "POST",
  queryKey: serviceKeys.all(orgId),
  optimisticUpdate: (cached, vars, ctx) => [
    ...cached,
    { id: ctx.optimisticId, ...vars, created_at: ctx.submittedAt },
  ],
  successMessage: "Service created",
});
```

## Conventions

- All hooks are `"use client"`. They depend on the React Query client from `QueryProvider`.
- Rollback is automatic — every optimistic hook snapshots the cache before mutation and restores on error.
- `useOrgMutation` invalidates `queryKey` prefix on settle. Use `optimisticQueryKey` when the exact cache key differs from the invalidation prefix.
- Toasts via `sonner`. Configurable via `successMessage`, `errorMessage`, `onErrorToast`.
- Offline queue requires `MutationQueueProvider` from `@zuiio/offline`.
- Type exports: `OrgMutationConfig`, `OptimisticContext`, `QueuedResult`.
