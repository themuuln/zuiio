# Full Offline-First Architecture

> **Feature:** Make TOLOM work fully offline — heavy preload, service worker, IndexedDB primary store
> **Created:** 2026-06-04 · **Status:** Draft
> **Scope:** ~2000 lines across ~25 files, 5 phases
> **Goal:** Mechanic opens TOLOM → all data preloaded → can work all day offline → syncs on reconnect

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Service Worker (Workbox)                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Precache: app shell, static assets, JS chunks        │  │
│  │  Runtime cache: API responses (NetworkFirst strategy)  │  │
│  │  Offline fallback: cached API or offline.html          │  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Preload Engine (runs after login)                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Parallel fetch all critical data → IndexedDB         │  │
│  │  Progress bar: "Loading your workspace..."            │  │
│  │  ~36 API endpoints, ~2-5MB estimated                  │  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  IndexedDB (Primary Read Store)                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Object stores: customers, vehicles, work_orders,     │  │
│  │  services, inventory, mechanics, settings, etc.       │  │
│  │  Timestamps on every record for staleness detection   │  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  React Query (Sync Layer)                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  queryFn reads from IndexedDB first (offline)         │  │
│  │  On network: fetch from API → update IndexedDB        │  │
│  │  staleTime: Infinity for cached data (manual refresh) │  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Mutation Queue (Write Store)                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  All mutations → IndexedDB queue → replay on reconnect│  │
│  │  71 mutations across 20 hook files                    │  │
│  │  Retry: 3x with exponential backoff                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: IndexedDB Data Store (~400 lines, 5 files)

**Goal:** IndexedDB becomes the primary read store. Every API response writes to IndexedDB. Every query reads from IndexedDB first.

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/offline/idb-store.ts` | Core IndexedDB store — typed object stores per domain, CRUD operations |
| `src/lib/offline/idb-sync.ts` | Bidirectional sync: API → IndexedDB on fetch, IndexedDB → API on mutation |
| `src/lib/offline/use-offline-query.ts` | Drop-in query hook: reads IndexedDB first, falls back to network |

### Implementation

**idb-store.ts — Domain-specific object stores:**
```ts
// One object store per data domain
const STORES = [
  "customers", "vehicles", "work-orders", "work-order-services",
  "work-order-parts", "services", "service-catalog", "inventory-parts",
  "inventory-movements", "mechanics", "branches", "organizations",
  "expenses", "payroll", "service-reminders", "communications",
  "notes", "vehicle-models", "diagnosis-labels", "attachments",
  "day-close", "dashboard", "reports", "settings",
] as const;

// Each record gets:
interface CachedRecord {
  id: string;
  data: unknown;
  cachedAt: number;      // timestamp
  organization_id: string;
}

// Operations:
async function putRecords(store: string, records: CachedRecord[]): Promise<void>;
async function getRecords(store: string, orgId: string): Promise<CachedRecord[]>;
async function getRecord(store: string, id: string): Promise<CachedRecord | null>;
async function deleteRecord(store: string, id: string): Promise<void>;
async function clearOrg(orgId: string): Promise<void>;  // wipe org data on logout
```

**idb-sync.ts — Smart sync engine:**
```ts
// Called after every successful API fetch
async function syncToStore(store: string, orgId: string, data: unknown[]): Promise<void>;

// Called after every successful mutation
async function syncMutation(store: string, record: CachedRecord): Promise<void>;

// Called on deletion
async function syncDeletion(store: string, id: string): Promise<void>;

// Preload all data for an org
async function preloadAll(orgId: string, progress?: (done: number, total: number) => void): Promise<void>;
```

**use-offline-query.ts — Drop-in query replacement:**
```ts
// Reads from IndexedDB first, then network
function useOfflineQuery<T>(options: {
  store: string;          // IndexedDB store name
  orgId: string;
  queryKey: unknown[];
  apiPath: string;        // e.g. "/customers"
  staleTime?: number;
}): UseQueryResult<T>;
```

### Success Criteria
- [ ] After login, IndexedDB has records in all domain stores
- [ ] Kill WiFi → navigate to customers page → data loads from IndexedDB
- [ ] Reconnect → data refreshes from API → IndexedDB updates

---

## Phase 2: Heavy Preload on Login (~300 lines, 4 files)

**Goal:** After auth, preload ALL critical data into IndexedDB. Show a progress bar.

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/offline/preload-engine.ts` | Parallel fetch all endpoints, write to IndexedDB |
| `src/components/preload-screen.tsx` | Full-screen progress bar during preload |
| `src/lib/offline/preload-config.ts` | List of endpoints to preload with priorities |
| `src/lib/hooks/use-preload-status.ts` | Hook to check if preload is complete |

### Implementation

**preload-config.ts — What to preload:**
```ts
interface PreloadEndpoint {
  store: string;
  path: string;           // API path relative to /api/organizations/:orgId
  priority: "critical" | "high" | "medium" | "low";
  params?: Record<string, string>;
}

const PRELOAD_ENDPOINTS: PreloadEndpoint[] = [
  // Critical — needed for sidebar, nav, basic functionality
  { store: "organizations", path: "/settings", priority: "critical" },
  { store: "branches", path: "/branches", priority: "critical" },
  { store: "mechanics", path: "/mechanics", priority: "critical" },
  { store: "services", path: "/services", priority: "critical" },

  // High — needed for main workflows
  { store: "customers", path: "/customers", priority: "high" },
  { store: "vehicles", path: "/vehicles", priority: "high" },
  { store: "work-orders", path: "/work-orders", priority: "high" },
  { store: "inventory-parts", path: "/inventory/parts", priority: "high" },

  // Medium — needed for reports, payroll
  { store: "expenses", path: "/expenses", priority: "medium" },
  { store: "payroll", path: "/payroll/records", priority: "medium" },
  { store: "service-reminders", path: "/service-reminders", priority: "medium" },

  // Low — nice to have
  { store: "vehicle-models", path: "/vehicle-models", priority: "low" },
  { store: "diagnosis-labels", path: "/diagnosis-labels", priority: "low" },
];
```

**preload-engine.ts — Parallel fetch with concurrency control:**
```ts
async function preloadAll(
  orgId: string,
  onProgress: (done: number, total: number, current: string) => void,
): Promise<void> {
  // Group by priority
  // Critical: parallel (5 at a time)
  // High: parallel (3 at a time)
  // Medium/Low: sequential

  for (const endpoint of endpoints) {
    onProgress(done, total, endpoint.store);
    const data = await fetch(`/api/organizations/${orgId}${endpoint.path}`);
    const json = await data.json();
    await syncToStore(endpoint.store, orgId, json.data);
    done++;
  }
}
```

**preload-screen.tsx:**
- Full-screen overlay with progress bar
- Shows current step: "Loading customers...", "Loading work orders..."
- Animates from 0% to 100%
- Auto-dismisses when complete
- Uses `<Progress>` from shadcn

### Integration

In the auth flow (after org selection):
```tsx
// In select-organization page or dashboard layout
const { isPreloading, progress } = usePreloadStatus();
if (isPreloading) return <PreloadScreen progress={progress} />;
```

### Success Criteria
- [ ] Login → preload screen shows → all data loads in <10s
- [ ] IndexedDB has all domain stores populated
- [ ] Kill WiFi after preload → every page works from cache

---

## Phase 3: Service Worker with Workbox (~200 lines, 3 files)

**Goal:** Cache app shell and API responses at the network level. Enable true offline page loads.

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/sw/workbox-config.ts` | Workbox configuration |
| `public/sw.js` | Replace no-op with Workbox-powered SW |
| `public/offline.html` | Offline fallback page |

### Implementation

Replace the no-op `public/sw.js` with a Workbox-powered service worker:

```js
// public/sw.js — generated by Workbox build or hand-written
import { precacheAndRoute } from 'workbox-precaching';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { registerRoute } from 'workbox-routing';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache app shell (injected at build time)
precacheAndRoute(self.__WB_MANIFEST);

// API routes: NetworkFirst (try network, fall back to cache)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'tolom-api',
    plugins: [
      new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    ],
  })
);

// Static assets: CacheFirst (cache is king)
registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new CacheFirst({
    cacheName: 'tolom-static',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

// Images: StaleWhileRevalidate
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({ cacheName: 'tolom-images' })
);

// Offline fallback
setCatchHandler(async ({ event }) => {
  if (event.request.destination === 'document') {
    return caches.match('/offline.html');
  }
  return Response.error();
});
```

**Remove the SW cleanup components** — they were temporary and are now counterproductive:
- Delete `src/components/sw-cleanup.tsx`
- Delete `src/lib/cleanup-old-sw.ts`
- Remove `<SwCleanup />` from both layouts

### Build Integration

Since Next.js doesn't natively generate Workbox manifests, we'll use `next-pwa` or `@ducanh2912/next-pwa`:

```bash
pnpm add @ducanh2912/next-pwa
```

Or hand-manage the manifest by listing all routes/static files.

### Success Criteria
- [ ] `public/sw.js` has a real fetch handler
- [ ] App shell loads offline (cached JS/CSS/HTML)
- [ ] API responses cached after first visit
- [ ] `<SwCleanup />` removed from layouts
- [ ] No console errors on SW install

---

## Phase 4: Migrate All Mutations (~800 lines, 20 files)

**Goal:** Every mutation goes through the offline queue. 71 mutation calls across 20 files.

### Strategy: Mutation Wrapper, Not Rewrite

Instead of rewriting every mutation, create a **wrapper** that wraps `useMutation` with queue logic:

```ts
// src/lib/offline/with-offline-queue.ts
function withOfflineQueue<TData, TVariables>(
  options: UseMutationOptions<TData, Error, TVariables> & {
    endpoint: string;
    method?: string;
    queryKeys?: unknown[][];
    bodyFn: (variables: TVariables) => unknown;
  },
): UseMutationOptions<TData, Error, TVariables> {
  // Wraps mutationFn to queue when offline
  // Wraps onSettled to invalidate caches
  // Wraps onError to show toast
}
```

Then in each hook, wrap the mutation:

```ts
// Before:
export function useCreateCustomer(orgId: string) {
  return useMutation({
    mutationFn: async (body) => { /* fetch */ },
    onSuccess: () => { /* invalidate */ },
  });
}

// After:
export function useCreateCustomer(orgId: string) {
  return useMutation(withOfflineQueue({
    endpoint: `/api/organizations/${orgId}/customers`,
    method: "POST",
    queryKeys: [customerKeys.all(orgId)],
    bodyFn: (body) => body,
    mutationFn: async (body) => { /* fetch */ },
    onSuccess: () => { /* invalidate */ },
  }));
}
```

### Files to Modify (20 files)

| File | Mutations to wrap |
|------|------------------|
| `use-customers.ts` | createCustomer, updateCustomer, deleteCustomer |
| `use-vehicles.ts` | createVehicle, updateVehicle, deleteVehicle |
| `use-work-order-detail.ts` | updateWorkOrder, deleteWorkOrder, addService, addPart, etc. |
| `use-expenses.ts` | createExpense, updateExpense, deleteExpense |
| `use-inventory.ts` | createPart, updatePart, createMovement, createPO, etc. |
| `use-payroll.ts` | updatePayRate, calculatePayroll, approvePayroll, etc. |
| `use-commission-rules.ts` | createRule, updateRule, deleteRule |
| `use-communications.ts` | createCommunication, updateCommunication |
| `use-customer-notes.ts` | createNote, updateNote, deleteNote |
| `use-day-close.ts` | closeDay, reopenDay |
| `use-diagnosis-labels.ts` | createLabel, updateLabel, deleteLabel |
| `use-mechanic-dashboard.ts` | clockIn, clockOut, updateStatus |
| `use-org-settings.ts` | updateSettings |
| `use-org-theme.ts` | updateTheme |
| `use-service-reminders.ts` | createReminder, updateReminder, completeReminder |
| `use-service-vehicle-models.ts` | addModel, removeModel |
| `use-wizard-data.ts` | quickCreateCustomer, quickCreateVehicle |
| `use-work-order-attachments.ts` | uploadAttachment, deleteAttachment |
| `use-create-branch.ts` | createBranch |

### Skip Queue (Always Online)

Some mutations MUST NOT be queued:
- **File uploads** (attachments, photos) — binary data, can't replay
- **Auth operations** (login, logout, sign up) — not data mutations
- **Real-time operations** (clock in/out) — time-sensitive

These stay as regular `useMutation` — the queue wrapper skips them when offline and shows "requires internet" toast.

### Success Criteria
- [ ] Every data mutation (except uploads/auth) goes through the queue
- [ ] Go offline → create customer → "Saved offline" toast
- [ ] Go offline → upload photo → "Requires internet" toast
- [ ] Reconnect → all queued mutations replay → data syncs

---

## Phase 5: Polish & Edge Cases (~300 lines, 5 files)

**Goal:** Handle edge cases, add indicators, test offline flows.

### Files to Create/Modify

| File | Purpose |
|------|---------|
| `src/components/offline-status-bar.tsx` | Persistent bottom bar showing sync status |
| `src/lib/offline/conflict-resolver.ts` | Last-write-wins conflict resolution |
| `src/lib/offline/storage-monitor.ts` | Monitor IndexedDB quota usage |
| `public/offline.html` | Offline fallback page |
| `public/manifest.json` | Enhanced PWA manifest |

### Conflict Resolution

For TOLOM's use case (single mechanic per bay), last-write-wins is acceptable:
```ts
function resolveConflict(local: CachedRecord, remote: CachedRecord): CachedRecord {
  return local.cachedAt > remote.cachedAt ? local : remote;
}
```

### Storage Monitor

IndexedDB has quotas (~50% of free disk on most browsers):
```ts
async function checkStorageQuota(): Promise<{ used: number; total: number; percent: number }> {
  const estimate = await navigator.storage.estimate();
  return {
    used: estimate.usage ?? 0,
    total: estimate.quota ?? 0,
    percent: ((estimate.usage ?? 0) / (estimate.quota ?? 1)) * 100,
  };
}
```

### Enhanced Manifest

```json
{
  "name": "TOLOM — Auto Service Management",
  "short_name": "TOLOM",
  "display": "standalone",
  "orientation": "portrait",
  "start_url": "/dashboard",
  "theme_color": "#000000",
  "background_color": "#000000",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

---

## Implementation Order

```
Phase 1 ──────────────────────────────────────────────►
  IndexedDB data store (foundation for everything)
         │
         ▼
Phase 2 ──────────────────────────────────────────────►
  Heavy preload on login (populates the store)
         │
         ▼
Phase 3 ──────────────────────────────────────────────►
  Service worker with Workbox (network-level caching)
         │
         ▼
Phase 4 ──────────────────────────────────────────────►
  Migrate all 71 mutations to offline queue
         │
         ▼
Phase 5 ──────────────────────────────────────────────►
  Polish, edge cases, conflict resolution, storage monitor
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| **Preload takes too long** | Priority-based loading: critical first, low last. Show progress bar. Target <10s. |
| **IndexedDB quota exceeded** | Monitor usage, auto-evict old records, warn at 80% |
| **Service worker causes hangs again** | Use `@ducanh2912/next-pwa` (mature, well-tested). No custom SW logic. |
| **71 mutations to migrate** | Use wrapper pattern — minimal change per file, not a rewrite |
| **Stale data after long offline** | Timestamps on every record. Show "Last synced X minutes ago" indicator |
| **File uploads fail offline** | Skip queue, show "Requires internet" toast. Don't silently lose files |
| **Conflicting concurrent edits** | Last-write-wins (acceptable for single-mechanic-per-bay) |
| **App shell not cached** | Workbox precache handles this — all JS/CSS/HTML cached on first load |

---

## Dependencies to Add

| Package | Size | Purpose |
|---------|------|---------|
| `@ducanh2912/next-pwa` | ~5kB | Service worker generation for Next.js |
| `workbox-*` | ~30kB total | Runtime caching strategies |

---

## Verification Plan

### Phase 1
1. Login → check IndexedDB has records in all stores
2. Kill WiFi → navigate to every page → data loads from cache
3. Reconnect → data refreshes

### Phase 2
1. Login → preload screen appears → completes in <10s
2. Kill WiFi → hard reload → every page works
3. Check IndexedDB size (~2-5MB expected)

### Phase 3
1. `public/sw.js` has real fetch handler
2. Kill WiFi → hard reload → app shell loads
3. API responses cached after first visit

### Phase 4
1. Go offline → create customer → "Saved offline"
2. Go offline → upload photo → "Requires internet"
3. Reconnect → queue replays → data syncs

### Phase 5
1. Storage monitor shows quota usage
2. Offline fallback page renders
3. PWA installable on mobile
