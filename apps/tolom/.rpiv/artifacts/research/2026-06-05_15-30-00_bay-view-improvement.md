# Bay View Improvement Research

## Summary

Bay view is TOLOM's real-time workshop dashboard — 59 files, ~6000 lines. Critical issues: 1141-line monolith component (26 useState), zero offline resilience, polling can overwrite optimistic updates, incomplete error boundaries, 20+ type casts. The module is error-prone and not production-ready.

## Code References

### Core Files (High Priority)
- `src/components/bay-view-v2/bay-view-v2-client.tsx` (1141 lines) — Main component, 26 useState, 9 useCallback, 5 useRef. Orchestrates everything.
- `src/components/bay-view-v2/_bay-action-handlers.ts` (211 lines) — Status change, assign, remove, bay count. Uses direct service calls, manual optimistic updates via setData().
- `src/components/bay-view-v2/_use-drawer-mutations.ts` (~730 lines) — Work order detail drawer mutations. 21 useState, 14 async handlers, 40+ return properties.
- `src/components/bay-view-v2/_bay-drag-handlers.ts` (~510 lines) — Drag-and-drop logic. Most complex optimistic updates.
- `src/components/bay-view-v2/work-order-detail-drawer.tsx` (~440 lines) — Drawer shell, 6 useState hooks.
- `src/lib/services/bay-view-service.ts` (~710 lines) — Server-side service. All mutations go through here.

### Supporting Files
- `src/components/bay-view-v2/_grid-view.tsx` — Grid layout, 10 props
- `src/components/bay-view-v2/_kanban-view.tsx` — Kanban layout, 16 props
- `src/components/bay-view-v2/_list-view.tsx` — List layout
- `src/components/bay-view-v2/_toolbar.tsx` — Toolbar, 23 props (including RefObjects!)
- `src/components/bay-view-v2/bay-card.tsx` — Individual bay card, ~205 lines JSX
- `src/components/bay-view-v2/assign-dialog.tsx` — Bay assignment dialog
- `src/components/bay-view-v2/_types.tsx` — Type definitions
- `src/components/bay-view-v2/_helpers.ts` — Helper functions
- `src/components/bay-view-v2/_constants.tsx` — Constants

### Query/Store Files
- `src/lib/queries/use-drawer-queries.ts` (394 lines) — Drawer data fetching
- `src/lib/queries/keys.ts` — Query key definitions

## Integration Points

### Data Flow
1. **BayViewV2Client** → `getBayViewDataFresh()` → `bay-view-service.ts` → Supabase
2. **Polling** → `usePolling(pollingCb, 30000)` → `fetchData(false)` every 30s
3. **Drag operations** → `_bay-drag-handlers.ts` → service functions → `setData()` optimistic → `fetchData(false)` re-sync
4. **Drawer mutations** → `_use-drawer-mutations.ts` → direct `fetch()` to API routes → `setWo()` optimistic → `fetchWo(true)` re-sync

### Key Dependencies
- `@dnd-kit/core` — Drag and drop
- `sonner` — Toast notifications
- `next-intl` — Translations
- `@/lib/services/bay-view-service` — All bay view server logic
- `@/lib/services/post-service-service` — Post-service data
- `@/lib/queries/use-organization` — Current org info
- `@/hooks/use-polling` — Polling hook
- `@/hooks/use-right-sidebar` — Sidebar tab registration
- `@/lib/stores` — Zustand stores (branch selection)

## Architecture Insights

### Current Mutation Pattern (Non-React-Query)
Bay view does NOT use React Query's useMutation. It uses:
- **Direct service calls** for bay-level operations (updateWorkOrderStatus, assignToFirstAvailableBay)
- **Direct fetch()** for drawer mutations (PATCH /api/organizations/.../work-orders/...)
- **Manual optimistic updates** via setData()/setWo() (local React state)
- **Full data refetch** after each mutation (not targeted cache invalidation)

### Optimistic Update Pattern
```
1. Save prev = data (snapshot)
2. setData(optimistic) → UI updates immediately
3. await serverCall()
4. On success: fetchData(false) → re-sync with server
5. On error: setData(prev) → rollback
```

### Polling Architecture
- 30-second interval via usePolling hook
- Paused when any dialog/drawer is open (line 301-315)
- NOT paused during drag operations → race condition risk

### Error Handling
- Every async op has try/catch (good)
- Error boundaries: only on WorkOrderDetailDrawer (bad)
- No retry logic anywhere
- Profile fetch errors silently swallowed

## Precedents & Lessons

### From Architecture Review (2026-06-03)
- Bay view was identified as needing structural improvement
- State management complexity flagged as critical
- Prop drilling noted as extreme (23 props to Toolbar)

### From Previous Migrations
- `useOrgMutation` factory exists for React Query-based mutations (but bay view doesn't use React Query)
- `withOfflineQueue` HOF exists for offline queue (but bay view doesn't use it)
- Zustand stores already in use for branch selection

## Open Questions

1. Should bay view be migrated to React Query (major refactor) or keep the direct-service pattern with offline queue bolted on?
2. Is the 30-second polling interval appropriate for a workshop dashboard? Should it be configurable?
3. Should drag-and-drop use optimistic updates that survive page refresh, or is in-memory-only acceptable?

## Developer Context

- **Module location**: `src/components/bay-view-v2/`
- **Total files**: 59
- **Total lines**: ~6000
- **Main component**: `bay-view-v2-client.tsx` (1141 lines, 26 useState)
- **State management**: All local React state (useState/useRef), no Zustand for core data
- **Mutation approach**: Direct service calls + fetch(), not React Query useMutation
- **Offline support**: None
- **Error boundaries**: Only on WorkOrderDetailDrawer
