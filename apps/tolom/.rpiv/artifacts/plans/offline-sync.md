# Offline Sync Implementation Plan

> **Feature:** Offline resilience for TOLOM auto service management
> **Created:** 2026-06-04 · **Status:** Approved
> **Problem:** Mechanics lose all data and can't work when internet drops. No offline support exists.
> **Solution:** 3-phase layered approach — network resilience → IndexedDB persistence → offline mutation queue

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  UI Layer                                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │  OfflineBanner  ←  useOnlineStatus()  ←  window  │  │
│  └───────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  React Query Layer                                      │
│  ┌──────────────┐  ┌────────────────────────────────┐  │
│  │ QueryClient  │  │  networkMode: 'offlineFirst'   │  │
│  │ + persist    │  │  refetchOnReconnect: true      │  │
│  │ (IndexedDB)  │  │  retry: 1 + retryDelay         │  │
│  └──────────────┘  └────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  Mutation Queue (IndexedDB)                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │  OfflineQueueStore: enqueue → persist → replay   │  │
│  │  Status: pending → in-flight → completed/failed  │  │
│  └──────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  Network Layer                                          │
│  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │ Next.js API Routes│  │  Supabase Realtime (WSS) │   │
│  │ (fetch)           │  │  (pause when offline)    │   │
│  └──────────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 1: Network Resilience + Online Status (~150 lines, 4 files)

**Goal:** Queries pause when offline, auto-resume on reconnect. User sees online/offline banner.

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/hooks/use-online-status.ts` | Hook exposing `isOnline`, `isSlow` (navigator.onLine + event listeners) |
| `src/components/offline-banner.tsx` | Thin yellow banner when offline, auto-dismisses on reconnect |

### Files to Modify

| File | Change |
|------|--------|
| `src/components/query-provider.tsx` | Add `networkMode: 'offlineFirst'`, `refetchOnReconnect: true`, `refetchOnWindowFocus: true`, increase `gcTime` to 30min |
| `src/app/[locale]/layout.tsx` | Add `<OfflineBanner />` below `<QueryProvider>` |

### Implementation Details

**use-online-status.ts:**
```ts
"use client";
import { useEffect, useState } from "react";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return isOnline;
}
```

**offline-banner.tsx:**
- Uses `<Alert variant="destructive">` with an `WifiOff` icon
- Animated slide-in from top, auto-dismisses 3s after reconnect
- Uses `useOnlineStatus()` — no props needed
- Positioned as a fixed banner below the header, z-index above content

**query-provider.tsx changes:**
```ts
defaultOptions: {
  queries: {
    staleTime: 30_000,
    gcTime: 30 * 60_000,        // ← was 5min, now 30min (more offline resilience)
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
    networkMode: "offlineFirst",  // ← NEW: don't fire when offline, use cache
    refetchOnReconnect: true,     // ← NEW: auto-refetch when back online
    refetchOnWindowFocus: true,   // ← was false, now true for offline recovery
  },
  mutations: {
    retry: 0,
    networkMode: "offlineFirst",  // ← NEW: allow mutations when offline (for queue)
  },
}
```

### Success Criteria
- [ ] Disconnect WiFi → banner appears within 1s
- [ ] Existing queries show cached data (no loading spinners for cached data)
- [ ] Reconnect WiFi → banner disappears, data auto-refreshes
- [ ] `npm run validate && npm run test` passes

---

## Phase 2: IndexedDB Query Cache Persistence (~200 lines, 4 files)

**Goal:** Cached data survives page reload while offline. Open TOLOM after losing internet → see last-known data.

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/offline/indexed-db-persister.ts` | IndexedDB adapter for React Query's `persistQueryClient` |
| `src/lib/offline/query-client.ts` | Centralized QueryClient factory with persist setup |

### Files to Modify

| File | Change |
|------|--------|
| `src/components/query-provider.tsx` | Import from `query-client.ts`, use persisted client |
| `package.json` | Add `idb` dependency (IndexedDB wrapper, 1.2kB gzipped) |

### Implementation Details

**indexed-db-persister.ts:**
- Uses `idb` library for clean IndexedDB API
- Creates object store `tanstack-query-cache`
- Implements `PersistedClient` interface: `persistClient(client)` → `restoreClient()` → `removeClient()`
- Debounces writes to avoid excessive I/O (write at most once per 2 seconds)

**query-client.ts:**
```ts
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
// OR use our IndexedDB persister for better quota
```

**Key decisions:**
- Only cache queries with `gcTime > 0` (avoid caching one-off queries)
- Max age: 24 hours (expire stale caches)
- Serialization: JSON (React Query's default)
- Store: IndexedDB (not localStorage — 5MB limit is too small for TOLOM's data volume)

**query-provider.tsx changes:**
```tsx
// Wrap QueryClientProvider with PersistQueryClientProvider
<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{
    persister: indexedDbPersister,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    dehydrateOptions: {
      shouldDehydrateQuery: (query) =>
        query.state.status === "success" && query.gcTime > 0,
    },
  }}
>
  {children}
</PersistQueryClientProvider>
```

### Success Criteria
- [ ] Load dashboard → lose internet → hard reload page → data shows immediately from IndexedDB
- [ ] Reconnect → data refreshes in background
- [ ] Cache auto-cleans after 24 hours
- [ ] `npm run validate && npm run test` passes

---

## Phase 3: Offline Mutation Queue (~350 lines, 6 files)

**Goal:** Mutations made offline queue up and replay when reconnected. Mechanic creates a work order while offline → it syncs automatically when back online.

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/offline/mutation-queue.ts` | Core queue: enqueue, dequeue, replay, status tracking |
| `src/lib/offline/mutation-queue-provider.ts` | React context + provider for queue status |
| `src/lib/offline/use-offline-mutation.ts` | Hook that wraps mutations with queue logic |
| `src/components/offline-queue-indicator.tsx` | Shows pending mutation count when offline |

### Files to Modify

| File | Change |
|------|--------|
| `src/lib/queries/mutation-factory.ts` | Add `offlineQueue` option to `createOptimisticMutation` |
| `src/app/[locale]/layout.tsx` | Add `<MutationQueueProvider>` + `<OfflineQueueIndicator>` |

### Implementation Details

**mutation-queue.ts:**
```ts
interface QueuedMutation {
  id: string;                    // crypto.randomUUID()
  endpoint: string;              // API path
  method: "POST" | "PATCH" | "DELETE";
  body: unknown;                 // Serialized request body
  queryKeysToInvalidate: unknown[][];  // React Query keys to invalidate after replay
  createdAt: number;             // Timestamp
  status: "pending" | "in-flight" | "completed" | "failed";
  retries: number;               // Max 3
  error?: string;                // Last error message
}
```

- IndexedDB object store: `offline-mutation-queue`
- On enqueue: save to IndexedDB, return mutation ID
- On reconnect: drain queue FIFO, replay each mutation
- Conflict detection: if server returns 409/422, mark as failed with error
- Max retries: 3 per mutation
- Stale queue cleanup: remove completed/failed entries after 7 days

**use-offline-mutation.ts:**
```ts
// Drop-in replacement for useMutation that auto-queues when offline
export function useOfflineMutation<TVariables>({
  endpoint,
  method = "POST",
  queryKeys,
  onSuccess,
  onError,
}: OfflineMutationOptions) {
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      if (!isOnline) {
        // Queue for later
        const id = await queue.enqueue({
          endpoint,
          method,
          body: variables,
          queryKeysToInvalidate: queryKeys,
        });
        // Optimistic: return a synthetic success
        return { queued: true, id };
      }
      // Online: normal fetch
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(variables),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    onSuccess: (data, variables) => {
      if (data?.queued) {
        toast.info("Change saved — will sync when online");
      } else {
        onSuccess?.(data, variables);
      }
    },
    onError: (error, variables, context) => {
      onError?.(error, variables, context);
    },
  });
}
```

**mutation-factory.ts changes:**
- Add optional `offlineQueue` parameter to `createOptimisticMutation()`
- When `offlineQueue: true` and `navigator.onLine === false`:
  - Skip the `onMutate` optimistic update (no server to reconcile with)
  - Instead, enqueue the mutation
  - Show toast: "Saved offline — will sync when connected"

**Replay logic:**
```ts
async function replayQueue(queue: QueuedMutation[]) {
  for (const mutation of queue) {
    if (mutation.retries >= 3) {
      await markFailed(mutation.id, "Max retries exceeded");
      continue;
    }
    try {
      await markInFlight(mutation.id);
      const res = await fetch(mutation.endpoint, {
        method: mutation.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mutation.body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await markCompleted(mutation.id);
      // Invalidate React Query caches
      for (const key of mutation.queryKeysToInvalidate) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    } catch (err) {
      await incrementRetry(mutation.id, String(err));
    }
  }
}
```

**offline-queue-indicator.tsx:**
- Shows in the bottom-right corner when there are pending mutations
- "3 changes pending sync" with a spinning icon
- Tapping opens a sheet showing each pending mutation with status
- Only visible when `pendingCount > 0`

### Success Criteria
- [ ] Go offline → create a work order → see "Saved offline" toast
- [ ] Go offline → create 3 customers → see "3 changes pending sync"
- [ ] Reconnect → queue replays → customers appear → indicator clears
- [ ] Failed mutation (e.g. validation error) → shows error in queue sheet
- [ ] `npm run validate && npm run test` passes

---

## Implementation Order

```
Phase 1 ──────────────────────────────────────────────►
  ├─ use-online-status.ts
  ├─ offline-banner.tsx
  ├─ query-provider.tsx (networkMode + gcTime)
  └─ layout.tsx (add banner)
         │
         ▼
Phase 2 ──────────────────────────────────────────────►
  ├─ npm install idb
  ├─ indexed-db-persister.ts
  ├─ query-client.ts (centralized factory)
  └─ query-provider.tsx (add persist layer)
         │
         ▼
Phase 3 ──────────────────────────────────────────────►
  ├─ mutation-queue.ts (IndexedDB queue)
  ├─ mutation-queue-provider.ts (React context)
  ├─ use-offline-mutation.ts (hook)
  ├─ offline-queue-indicator.tsx (UI)
  ├─ mutation-factory.ts (add offlineQueue option)
  └─ layout.tsx (add providers)
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| IndexedDB quota exceeded | Cap cache at 50MB, auto-evict oldest entries |
| Mutation replay creates duplicates | Server-side idempotency keys (add `X-Idempotency-Key` header) |
| Conflicting edits (two mechanics offline) | Accept last-write-wins for v1; TOLOM's single-mechanic-per-bay makes this safe |
| Service worker conflicts | Keep the no-op SW; don't re-introduce caching SW |
| Large cache slows page load | Dehydrate only success queries with gcTime > 0; max age 24h |

---

## Dependencies to Add

| Package | Size | Purpose |
|---------|------|---------|
| `idb` | 1.2kB gzipped | Clean IndexedDB wrapper |
| `@tanstack/react-query-persist-client` | 2.8kB gzipped | React Query persistence layer |
| `@tanstack/query-sync-storage-persister` | 1.1kB gzipped | Storage adapter (we'll wrap with IndexedDB) |

All three are official TanStack packages — same team as React Query.

---

## Verification Plan

### Phase 1
1. `npm run validate && npm run test` passes
2. Open dashboard → DevTools Network → Offline → banner appears
3. Existing data stays visible (no loading spinners)
4. Reconnect → banner disappears, data refreshes

### Phase 2
1. Load dashboard (data caches in IndexedDB)
2. Hard reload with WiFi off → data loads from IndexedDB
3. Reconnect → background refresh

### Phase 3
1. Go offline → create work order → "Saved offline" toast
2. Go offline → create 3 customers → indicator shows "3 pending"
3. Reconnect → queue replays → all 3 customers appear
4. Force a 400 error → mutation shows as failed in queue sheet
