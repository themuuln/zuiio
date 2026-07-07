# @zuiio/offline

Offline mutation queue + React Query persistence. Uses **IndexedDB** (`idb`) for storage.

## Exports

### Queue Engine (`mutation-queue.ts`)
IndexedDB-backed FIFO mutation queue.

| Export | Signature |
|---|---|
| `enqueueMutation` | `(mutation) → Promise<string>` — add to queue, returns ID |
| `replayPendingMutations` | `(onInvalidate) → Promise<ReplayResult>` — FIFO replay, invalidates query keys |
| `removeMutation` | `(id) → Promise<void>` — delete by ID |
| `getAllMutations` | `() → Promise<QueuedMutation[]>` — oldest first |
| `getMutationsByStatus` | `(status) → Promise<QueuedMutation[]>` — filter by `pending`/`completed`/`failed` |
| `getPendingCount` | `() → Promise<number>` |
| `cleanupStaleMutations` | `() → Promise<void>` — remove completed/failed older than 7d |
| `QueuedMutation` (type) | `id`, `endpoint`, `method`, `body`, `queryKeysToInvalidate`, `status`, `createdAt`, `retries`, `maxRetries`, `error?` |
| `ReplayResult` (type) | `{ succeeded: string[]; failed: { id: string; error: string }[] }` |

### Provider (`mutation-queue-provider.tsx`)
React context for queue state + auto-replay on reconnect.

| Export | Description |
|---|---|
| `MutationQueueProvider` | Wraps app. Auto-replays pending mutations when online. |
| `useMutationQueue()` | `{ enqueue, mutations, pendingCount, isReplaying }` |

### Hook (`use-offline-mutation.ts`)
Drop-in `useMutation` replacement that queues when offline.

| Export | Description |
|---|---|
| `useOfflineMutation<TData, TVariables>(opts)` | Online → calls API. Offline → enqueues + toasts. Options: `endpoint`, `bodyFn`, `queryKeys`, optional `method`/`methodFn`/`onSuccess`/`onError`. |
| `isQueuedResponse(data)` | Returns `true` if result was queued (`{ queued: true }`). |
| `handleOfflineSuccess(data, cb?)` | Returns `true` if queued — callers skip normal onSuccess. |

### Wrapper (`with-offline-queue.ts`)
HOC for wrapping existing mutation functions.

| Export | Description |
|---|---|
| `withOfflineQueue<TData, TVariables>(config)` | Online → original fn. Offline → enqueues. Options: `endpoint`, `bodyFn`, `queryKeys`, `mutationFn`. Returns `{ queued: true }`. |
| `OfflineQueueConfig` (type) | Config shape for the wrapper. |

### Persister (`indexed-db-persister.ts`)
React Query `PersistedClient` adapter with debounced IndexedDB writes.

| Export | Description |
|---|---|
| `indexedDbPersister` | `persistClient` / `restoreClient` / `removeClient`. Debounced writes (2s). Separate DB (`zuiio-query-cache`) from the queue (`zuiio-mutation-queue`). |

## Pattern

```tsx
// 1. Provider
<MutationQueueProvider><App /></MutationQueueProvider>

// 2a. Hook (new mutations)
const { mutate, data } = useOfflineMutation({
  endpoint: `/api/orgs/${orgId}/customers`,
  bodyFn: (vars) => vars, queryKeys: [customerKeys.all(orgId)],
});
if (isQueuedResponse(data)) toast.info("Saved offline");

// 2b. Wrapper (existing mutations)
mutationFn: withOfflineQueue({
  endpoint: `/api/orgs/${orgId}/customers`,
  bodyFn: (vars) => vars, queryKeys: [customerKeys.all(orgId)],
  mutationFn: async (body) => { /* original fetch */ },
})
```

## Notes

- Two IndexedDB databases: `zuiio-mutation-queue` (mutations) + `zuiio-query-cache` (React Query).
- FIFO replay, up to `maxRetries` (default 3), exponential backoff.
- Online detection via `@zuiio/hooks` `useOnlineStatus` (`navigator.onLine`).
- Toasts via `sonner`. Peer deps: `@tanstack/react-query`, `@tanstack/react-query-persist-client`, `react`, `sonner`.
