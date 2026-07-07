# @zuiio/offline — IndexedDB-Backed Offline Mutation Queue

FIFO mutation queue with automatic replay on reconnect. Drop-in offline support for TanStack Query mutations — users can keep working while disconnected, and changes sync silently when the connection returns.

## Architecture

The package is three layers:

```
┌─────────────────────────────────────────────────┐
│  Application                                     │
│  useOfflineMutation / withOfflineQueue            │
├─────────────────────────────────────────────────┤
│  Provider — MutationQueueProvider                 │
│  Watches useOnlineStatus, auto-replays on        │
│  reconnect, invalidates React Query caches,      │
│  shows toast feedback.                           │
├─────────────────────────────────────────────────┤
│  Engine — enqueueMutation / replayPendingMutations│
│  IndexedDB (via idb) with status tracking,       │
│  max-retry logic, idempotency keys, FIFO order.  │
└─────────────────────────────────────────────────┘
```

**Queue flow:** When a mutation fires offline, the engine stores it in IndexedDB (`zuiio-mutation-queue`) with status `pending`. When the browser comes back online, `MutationQueueProvider` detects the change via `useOnlineStatus`, waits 1 second for connection stability, then replays all pending mutations in FIFO order (up to 3 retries each). Successful replays invalidate the associated React Query caches automatically.

## Key exports

| Export | Module | Description |
|---|---|---|
| `enqueueMutation(mutation)` | Queue engine | Store a mutation in IndexedDB. Returns the mutation ID. |
| `replayPendingMutations(onInvalidate)` | Queue engine | Replay all pending mutations in FIFO order. Returns `{ completed, failed, errors }`. |
| `MutationQueueProvider` | Provider | React context — wrap your app to enable auto-replay on reconnect. |
| `useMutationQueue()` | Provider | Access queue state: `{ enqueue, mutations, pendingCount, isReplaying }`. |
| `useOfflineMutation(options)` | Hook | Drop-in replacement for `useMutation` that auto-queues when offline. |
| `withOfflineQueue(config)` | HOC | Wraps an existing `mutationFn` with offline-queue behavior. |
| `indexedDbPersister` | Persister | IndexedDB adapter for `persistQueryClient` — keeps query cache across page reloads. |

### Queue engine helpers

| Export | Description |
|---|---|
| `getAllMutations()` | All mutations sorted by creation time (oldest first). |
| `getMutationsByStatus(status)` | Filter by `pending` / `in-flight` / `completed` / `failed`. |
| `getPendingCount()` | Number of pending mutations. |
| `removeMutation(id)` | Delete a single mutation by ID. |
| `cleanupStaleMutations()` | Remove completed/failed mutations older than 7 days. |

### Types

| Type | Description |
|---|---|
| `QueuedMutation` | Full mutation record: `id`, `endpoint`, `method`, `body`, `status`, `retries`, `maxRetries`, `queryKeysToInvalidate`, `idempotencyKey?`. |
| `ReplayResult` | `{ completed: number, failed: number, errors: Array<{ id, error }> }` |
| `OfflineMutationOptions<TData, TVariables>` | Config for `useOfflineMutation`: `endpoint`, `method?`, `methodFn?`, `bodyFn`, `queryKeys?`, `onSuccess?`, `onError?`. |
| `OfflineQueueConfig<TData, TVariables>` | Config for `withOfflineQueue`: `endpoint`, `method?`, `bodyFn`, `queryKeys?`, `mutationFn`, `skipQueue?`. |

### Utility helpers

| Export | Description |
|---|---|
| `isQueuedResponse(data)` | Check if a mutation result was queued (offline). |
| `handleOfflineSuccess(data, callback?)` | Returns `true` if queued — skip your normal `onSuccess`. |

## Usage

### 1. Wire the provider

Wrap your app (or the relevant subtree) with `MutationQueueProvider`. It handles online/offline detection, replay, and cache invalidation automatically.

```tsx
import { MutationQueueProvider } from "@zuiio/offline";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MutationQueueProvider>{children}</MutationQueueProvider>
    </QueryClientProvider>
  );
}
```

### 2. Mutations — two approaches

**Option A: `useOfflineMutation` (recommended)**

A drop-in replacement for `useMutation`. When offline, it stores the request in IndexedDB and returns a synthetic `{ queued: true }` result. When online, it fetches normally.

```tsx
import { useOfflineMutation, isQueuedResponse } from "@zuiio/offline";

function AddCustomerButton({ orgId }: { orgId: string }) {
  const addCustomer = useOfflineMutation<Customer, CreateCustomerInput>({
    endpoint: `/api/organizations/${orgId}/customers`,
    method: "POST",
    bodyFn: (input) => input,
    queryKeys: [customerKeys.all(orgId)],
    onSuccess: (customer) => {
      toast.success(`Added ${customer.name}`);
    },
  });

  return (
    <Button
      onClick={() => addCustomer.mutate({ name: "New Customer" })}
      disabled={addCustomer.isPending}
    >
      Add Customer
    </Button>
  );
}
```

**Option B: `withOfflineQueue` (for existing mutations)**

Wraps an existing `mutationFn` — useful when you already have a mutation set up and want to add offline support without restructuring.

```tsx
import { useMutation } from "@tanstack/react-query";
import { withOfflineQueue } from "@zuiio/offline";

const addCustomer = useMutation({
  mutationFn: withOfflineQueue({
    endpoint: `/api/organizations/${orgId}/customers`,
    method: "POST",
    bodyFn: (input) => input,
    queryKeys: [customerKeys.all(orgId)],
    mutationFn: async (body) => {
      const res = await fetch("/api/organizations/org1/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  }),
});
```

### 3. Persist the query cache

Use `indexedDbPersister` with React Query's `persistQueryClient` to survive page reloads — offline users don't lose their cached data.

```tsx
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { indexedDbPersister } from "@zuiio/offline";

<PersistQueryClientProvider
  client={queryClient}
  persistClientOptions={{
    persister: indexedDbPersister,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  }}
>
  {children}
</PersistQueryClientProvider>
```

## How replay works

1. User performs mutations while offline — each is stored in IndexedDB with status `pending`.
2. Connection returns → `MutationQueueProvider` detects `isOnline === true`.
3. After a 1-second stabilization delay, `replayPendingMutations` runs in FIFO order.
4. Each mutation is sent to its endpoint with the original method/body. If `idempotencyKey` is set, it's sent as the `Idempotency-Key` header.
5. On success: status → `completed`, associated query keys are invalidated via `queryClient.invalidateQueries`.
6. On failure: retried up to `maxRetries` (default 3), then marked `failed`.
7. Toast notifications summarize results: "3 changes synced" or "1 change failed to sync".

## Module map

| File | Description |
|---|---|
| `src/mutation-queue.ts` | Queue engine — IndexedDB CRUD, FIFO replay, retry logic |
| `src/mutation-queue-provider.tsx` | React context provider — online detection, auto-replay, cache invalidation |
| `src/use-offline-mutation.ts` | Drop-in `useOfflineMutation` hook + `isQueuedResponse` / `handleOfflineSuccess` helpers |
| `src/with-offline-queue.ts` | HOC wrapper for adding offline queue to existing mutation functions |
| `src/indexed-db-persister.ts` | IndexedDB adapter for TanStack Query's `persistQueryClient` (debounced writes, 2s batch) |

## Dependencies

- **`idb`** — IndexedDB wrapper (used by both the queue engine and the query-cache persister)
- **`@zuiio/hooks`** — `useOnlineStatus` for online/offline detection
- **`@tanstack/react-query`** — mutation and cache invalidation primitives
- **`sonner`** — toast notifications on replay success/failure
