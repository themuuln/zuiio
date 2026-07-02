---
date: 2026-06-05T15:30:00+0800
author: Temuulen Undrakhbayar
commit: 3a9740a3
branch: main
repository: tolom
topic: "Bay View Production-Ready Refactor"
tags: [plan, bay-view, react-query, zustand, offline, error-boundary]
status: ready
parent: ".rpiv/artifacts/research/2026-06-05_15-30-00_bay-view-improvement.md"
last_updated: 2026-06-05T15:30:00+0800
last_updated_by: Temuulen Undrakhbayar
---

# Design: Bay View Production-Ready Refactor

## Summary

Bay view is TOLOM's real-time workshop dashboard — 59 files, ~6000 lines. The main component (`bay-view-v2-client.tsx`) is a 1141-line monolith with 26 useState hooks, inline async callbacks, no error boundaries on key sections, and zero offline resilience. This refactor migrates to React Query + Zustand + offline queue using the Wizard decomposition pattern, splitting the monolith into provider + section components across 4-5 incremental commits.

## Requirements

- Error boundary on every independently-failing section (grid, kanban, list, toolbar, queue)
- Polling mutex: pause polling during drag mutations to prevent race conditions
- All handlers wrapped in useCallback to prevent unnecessary re-renders
- 26 useState → Zustand store with selector hooks
- React Query for data fetching + mutation (useOrgMutation factory)
- Offline queue via withOfflineQueue on all mutations
- TypeScript casts (`as any`, `as unknown as`) eliminated
- Inline async callbacks extracted and memoized
- 4-5 incremental commits (no mega-commits)

## Current State Analysis

### Key Discoveries

- `bay-view-v2-client.tsx:1141` — 26 useState, 5 useRef, 9 useCallback, 7 useEffect. Does everything.
- `_use-drawer-mutations.ts:~730` — 21 useState, 14 async handlers, 40+ return properties. Coupled to useState setters.
- `_bay-action-handlers.ts:211` — Accepts `React.Dispatch<SetStateAction<...>>` params. Will break when migrating to Zustand.
- `_bay-drag-handlers.ts:~510` — Most complex optimistic updates. Saves `prevData = data` for rollback.
- `bay-view-service.ts:~710` — Server-side service. All mutations go through here.
- Polling at 30s interval (`usePolling`) — NOT paused during drag operations → race condition.
- Error boundary only on WorkOrderDetailDrawer (`bay-view-v2-client.tsx:1066`).
- 10 `as any` + 10 `as unknown as` casts across drawer mutations.
- `onRemoveHelper` inline callback appears 6 times identically (`bay-view-v2-client.tsx:803-928`).
- Toolbar receives 23 props including RefObjects (`_toolbar.tsx:27-50`).

### Patterns to Follow

- **Wizard decomposition**: `src/components/work-orders/wizard/` — context provider + section components + barrel exports
- **Zustand store**: `src/lib/stores/ui-store.ts` — `devtools(persist(immer(...)))` + selector hooks
- **Mutation factory**: `src/lib/queries/mutation-factory.ts` — `useOrgMutation` with optimistic update, rollback, offline queue
- **Error boundary**: `src/components/error-boundary.tsx` — class-based, with fallback UI

### Precedents

- Commit `825f2a4c` (bay-view v1 split): 51 files → 3 follow-up fixes
- Commit `36d4849b` (bay-view-v2): 196 files, 43K lines → 7 follow-up fixes in 24h
- Commit `579b4a85`: Unstable callbacks caused infinite re-render loops
- Vaul + Base UI Dialog stacking: 3 fix commits needed (z-index → pointer-events → inline re-render)

## Scope

### Building

- Error boundary on grid/kanban/list sections, toolbar, queue panel
- Polling mutex (pause during drag in-flight)
- useCallback on all handlers passed as props
- Zustand store for bay view state (viewMode, myJobsOnly, dialog states, etc.)
- Wizard decomposition: BayViewProvider + section components
- React Query data fetching + useOrgMutation for all mutations
- Offline queue via withOfflineQueue
- TypeScript type fixes (WorkOrder.helpers, WorkOrderService catalog fields)
- Code deduplication (onRemoveHelper, KanbanDropColumn, helper functions)

### Not Building

- bay-view-service.ts server-side refactor (client-side only)
- Polling interval changes (30s stays)
- New dialogs/drawers
- React Query for bay-level direct service calls (assignToFirstAvailableBay, etc.) — these stay as service calls since they're real-time critical
- E2E tests (out of scope for this refactor)

## Decisions

### Decision 1: Wizard Decomposition Pattern

**Ambiguity**: How to split the 1141-line monolith?
**Explored**: (A) Wizard pattern — context provider + section components, modeled after `src/components/work-orders/wizard/`; (B) Zustand store + selector hooks — no context provider, components read store directly.
**Decision**: Wizard pattern with Zustand store inside the provider. Context provides store access + actions; section components use selector hooks from the store. This combines both patterns optimally.

### Decision 2: React Query for Data Fetching

**Ambiguity**: Keep direct service calls or migrate to React Query?
**Explored**: (A) Keep direct service calls + bolt on offline queue; (B) Full React Query migration.
**Decision**: React Query migration. `useOrgMutation` factory handles optimistic update, rollback, offline queue, toast, invalidation in one call. Eliminates ~40 lines of boilerplate per mutation.

### Decision 3: Offline Queue Integration

**Ambiguity**: Include offline queue in this refactor or defer?
**Decision**: Include. `withOfflineQueue` HOF wraps each mutation's `mutationFn`. Offline mutations queue to IndexedDB and replay on reconnect.

### Decision 4: Commit Strategy

**Ambiguity**: Mega-commit or incremental?
**Decision**: 4-5 incremental commits. Precedent shows mega-commits cause cascading fixes.

## Architecture

### src/lib/types/index.ts — MODIFY

```typescript
// Add helpers to WorkOrder type
interface WorkOrder {
  // ... existing fields
  helpers?: Array<{ id: string; full_name: string | null; avatar_url: string | null }>;
}

// Add missing fields to WorkOrderService
interface WorkOrderService {
  // ... existing fields
  service_catalog_id?: string | null;
  quantity?: number;
  final_price?: number;
}

// Add missing fields to WorkOrderPart
interface WorkOrderPart {
  // ... existing fields
  quantity?: number;
  final_price?: number;
}
```

### src/lib/stores/bay-view-store.ts — NEW

```typescript
"use client";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// State
interface BayViewState {
  viewMode: "grid" | "kanban" | "list";
  myJobsOnly: boolean;
  baySearchQuery: string;
  assignBay: number | null;
  detailDrawerOpen: boolean;
  detailWoId: string | null;
  drawerInitialAction: "add-service" | "add-part" | null;
  showShiftReport: boolean;
  showPinSettings: boolean;
  showVehicleReg: boolean;
  showMechanicReg: boolean;
  pendingStatusChange: { woId: string; status: string } | null;
  pendingPostService: { woId: string; vehicleId: string; vehiclePlate: string; currentOdometer: number | null; newStatus: string; totalCost: number } | null;
  pendingPickupComplete: { woId: string; vehicleId: string; vehiclePlate: string; newStatus: string; totalCost: number } | null;
  toast: { msg: string; variant: "info" | "error" } | null;
  pendingWoIds: Record<string, boolean>;
  isPollingPaused: boolean;
  batchCompleteDialogOpen: boolean;
  batchCompletePending: boolean;
}

// Actions
interface BayViewActions {
  setViewMode: (mode: BayViewState["viewMode"]) => void;
  toggleMyJobsOnly: () => void;
  setBaySearchQuery: (q: string) => void;
  setAssignBay: (n: number | null) => void;
  openDetail: (woId: string, action?: "add-service" | "add-part") => void;
  closeDetail: () => void;
  setShowShiftReport: (open: boolean) => void;
  setShowPinSettings: (open: boolean) => void;
  setShowVehicleReg: (open: boolean) => void;
  setShowMechanicReg: (open: boolean) => void;
  setPendingStatusChange: (v: { woId: string; status: string } | null) => void;
  setPendingPostService: (v: BayViewState["pendingPostService"]) => void;
  setPendingPickupComplete: (v: BayViewState["pendingPickupComplete"]) => void;
  setToast: (t: BayViewState["toast"]) => void;
  markPending: (...ids: string[]) => void;
  clearPending: (...ids: string[]) => void;
  setPollingPaused: (paused: boolean) => void;
  setBatchCompleteDialogOpen: (open: boolean) => void;
  setBatchCompletePending: (pending: boolean) => void;
}

type BayViewStore = BayViewState & BayViewActions;

export const useBayViewStore = create<BayViewStore>()(
  devtools(
    immer((set) => ({
      // State defaults
      viewMode: "grid",
      myJobsOnly: false,
      baySearchQuery: "",
      assignBay: null,
      detailDrawerOpen: false,
      detailWoId: null,
      drawerInitialAction: null,
      showShiftReport: false,
      showPinSettings: false,
      showVehicleReg: false,
      showMechanicReg: false,
      pendingStatusChange: null,
      pendingPostService: null,
      pendingPickupComplete: null,
      toast: null,
      pendingWoIds: {},
      isPollingPaused: false,
      batchCompleteDialogOpen: false,
      batchCompletePending: false,

      // Actions
      setViewMode: (mode) => set((s) => { s.viewMode = mode; }),
      toggleMyJobsOnly: () => set((s) => { s.myJobsOnly = !s.myJobsOnly; }),
      setBaySearchQuery: (q) => set((s) => { s.baySearchQuery = q; }),
      setAssignBay: (n) => set((s) => { s.assignBay = n; }),
      openDetail: (woId, action) => set((s) => {
        s.detailWoId = woId;
        s.detailDrawerOpen = true;
        s.drawerInitialAction = action ?? null;
      }),
      closeDetail: () => set((s) => {
        s.detailDrawerOpen = false;
        s.detailWoId = null;
        s.drawerInitialAction = null;
      }),
      setShowShiftReport: (open) => set((s) => { s.showShiftReport = open; }),
      setShowPinSettings: (open) => set((s) => { s.showPinSettings = open; }),
      setShowVehicleReg: (open) => set((s) => { s.showVehicleReg = open; }),
      setShowMechanicReg: (open) => set((s) => { s.showMechanicReg = open; }),
      setPendingStatusChange: (v) => set((s) => { s.pendingStatusChange = v; }),
      setPendingPostService: (v) => set((s) => { s.pendingPostService = v; }),
      setPendingPickupComplete: (v) => set((s) => { s.pendingPickupComplete = v; }),
      setToast: (t) => set((s) => { s.toast = t; }),
      markPending: (...ids) => set((s) => {
        for (const id of ids) if (id) s.pendingWoIds[id] = true;
      }),
      clearPending: (...ids) => set((s) => {
        for (const id of ids) delete s.pendingWoIds[id];
      }),
      setPollingPaused: (paused) => set((s) => { s.isPollingPaused = paused; }),
      setBatchCompleteDialogOpen: (open) => set((s) => { s.batchCompleteDialogOpen = open; }),
      setBatchCompletePending: (pending) => set((s) => { s.batchCompletePending = pending; }),
    })),
    { name: "BayViewStore" },
  ),
);

// ── Selector hooks ──
export const useBayViewMode = () => useBayViewStore((s) => s.viewMode);
export const useMyJobsOnly = () => useBayViewStore((s) => s.myJobsOnly);
export const useBaySearchQuery = () => useBayViewStore((s) => s.baySearchQuery);
export const useAssignBay = () => useBayViewStore((s) => s.assignBay);
export const useDetailDrawer = () => useBayViewStore((s) => ({
  open: s.detailDrawerOpen,
  woId: s.detailWoId,
  initialAction: s.drawerInitialAction,
}));
export const useBayPendingWoIds = () => useBayViewStore((s) => s.pendingWoIds);
export const useIsPollingPaused = () => useBayViewStore((s) => s.isPollingPaused);
export const useBayToast = () => useBayViewStore((s) => s.toast);
```

### src/components/bay-view-v2/_error-section.tsx — NEW

```typescript
"use client";
import { ErrorBoundary } from "@/components/error-boundary";
import type { ReactNode } from "react";

interface ErrorSectionProps {
  children: ReactNode;
  label?: string;
}

export function ErrorSection({ children, label }: ErrorSectionProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center py-8 gap-2 rounded-lg border border-destructive/20 bg-destructive/5">
          <span className="text-sm text-muted-foreground">
            {label ? `${label} — ` : ""}Something went wrong
          </span>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
```

### src/components/bay-view-v2/bay-view-provider.tsx — NEW

```typescript
"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { BayViewData, ShiftReport } from "@/lib/services/bay-view-service";
import type { Vehicle, WorkOrder } from "@/lib/types";

interface BayViewContextValue {
  data: BayViewData | null;
  setData: React.Dispatch<React.SetStateAction<BayViewData | null>>;
  shiftReport: ShiftReport | null;
  setShiftReport: React.Dispatch<React.SetStateAction<ShiftReport | null>>;
  loading: boolean;
  setLoading: (v: boolean) => void;
  error: string | null;
  setError: (v: string | null) => void;
  fetchData: (showLoader?: boolean) => Promise<void>;
  currentProfile: { id: string; full_name: string | null } | null;
  setCurrentProfile: (p: { id: string; full_name: string | null } | null) => void;
  activeDrag: { type: "vehicle" | "mechanic"; label: string; previewBay?: any } | null;
  setActiveDrag: (d: any) => void;
}

const BayViewContext = createContext<BayViewContextValue | null>(null);

export function useBayViewContext() {
  const ctx = useContext(BayViewContext);
  if (!ctx) throw new Error("useBayViewContext must be used within BayViewProvider");
  return ctx;
}

export function BayViewProvider({ children, value }: { children: ReactNode; value: BayViewContextValue }) {
  return <BayViewContext.Provider value={value}>{children}</BayViewContext.Provider>;
}
```

### src/components/bay-view-v2/_dialog-manager.tsx — NEW

Extracts all dialog state management from bay-view-v2-client.tsx. Contains:
- `useEffect` for polling pause/resume based on store state
- URL management (searchParams, router)
- Status change confirmation flow
- Post-service confirm flow
- Pickup complete confirm flow
- Batch complete handler

(Full code to be generated in Slice 3)

### src/lib/queries/use-bay-view.ts — NEW

React Query hooks for bay view data:
- `useBayViewData(orgId, branchId)` — replaces `getBayViewDataFresh` + manual state
- `useShiftReport(orgId, branchId)` — replaces `getShiftReport` + manual state
- `useUpdateBayViewStatus()` — useOrgMutation for status changes
- `useAssignVehicleToBay()` — useOrgMutation for bay assignment
- `useRemoveVehicleFromBay()` — useOrgMutation for bay removal
- `useUpdateBayCount()` — useOrgMutation for bay count

(Full code to be generated in Slice 4)

## Slices

### Slice 1: Types + Error Boundary

**Files**: `src/lib/types/index.ts` (MODIFY), `src/components/bay-view-v2/_error-section.tsx` (NEW)

#### Automated Verification:
- [ ] Type checking passes: `npm run validate:types`
- [ ] No `as any` in modified type files: `grep -r "as any" src/lib/types/index.ts | wc -l` returns 0

#### Manual Verification:
- [ ] WorkOrder type includes `helpers` field
- [ ] WorkOrderService includes `service_catalog_id`, `quantity`, `final_price`
- [ ] ErrorSection component renders with fallback UI on error

---

### Slice 2: Zustand Store + Selector Hooks

**Files**: `src/lib/stores/bay-view-store.ts` (NEW), `src/lib/stores/index.ts` (MODIFY)

#### Automated Verification:
- [ ] Type checking passes: `npm run validate:types`
- [ ] Store exports all selector hooks

#### Manual Verification:
- [ ] Store devtools label shows "BayViewStore"
- [ ] Selector hooks return correct slices

---

### Slice 3: Wizard Decomposition + Polling Mutex + useCallback

**Files**: `src/components/bay-view-v2/bay-view-provider.tsx` (NEW), `src/components/bay-view-v2/_bay-view-content.tsx` (NEW), `src/components/bay-view-v2/_dialog-manager.tsx` (NEW), `src/components/bay-view-v2/bay-view-v2-client.tsx` (MODIFY), `src/components/bay-view-v2/_bay-action-handlers.ts` (MODIFY), `src/components/bay-view-v2/_bay-drag-handlers.ts` (MODIFY), `src/components/bay-view-v2/_toolbar.tsx` (MODIFY)

#### Automated Verification:
- [ ] Type checking passes: `npm run validate:types`
- [ ] Lint passes: `npm run validate:lint`
- [ ] `bay-view-v2-client.tsx` under 400 lines
- [ ] No inline async callbacks in JSX: `grep -n "async (" src/components/bay-view-v2/bay-view-v2-client.tsx | wc -l` returns 0

#### Manual Verification:
- [ ] Bay view renders correctly in grid/kanban/list modes
- [ ] Drag-and-drop works without polling interference
- [ ] All dialogs open/close correctly
- [ ] Error boundary catches render errors in each section

---

### Slice 4: React Query Migration + useOrgMutation

**Files**: `src/lib/queries/use-bay-view.ts` (NEW), `src/lib/queries/keys.ts` (MODIFY), `src/components/bay-view-v2/_use-drawer-mutations.ts` (MODIFY), `src/components/bay-view-v2/_bay-action-handlers.ts` (MODIFY), `src/components/bay-view-v2/work-order-detail-drawer.tsx` (MODIFY)

#### Automated Verification:
- [ ] Type checking passes: `npm run validate:types`
- [ ] No `as any` in modified files: `grep -rn "as any" src/components/bay-view-v2/_use-drawer-mutations.ts src/components/bay-view-v2/work-order-detail-drawer.tsx | wc -l` returns 0

#### Manual Verification:
- [ ] Bay view data loads via React Query
- [ ] Mutations (status change, assign, remove) work with optimistic update
- [ ] Drawer mutations (add/remove service/part) work with optimistic update
- [ ] Rollback works on mutation failure

---

### Slice 5: Offline Queue Integration

**Files**: `src/components/bay-view-v2/_use-drawer-mutations.ts` (MODIFY), `src/components/bay-view-v2/_bay-action-handlers.ts` (MODIFY), `src/components/bay-view-v2/bay-view-v2-client.tsx` (MODIFY)

#### Automated Verification:
- [ ] Type checking passes: `npm run validate:types`
- [ ] No direct `fetch()` calls in mutation files: `grep -n "await fetch(" src/components/bay-view-v2/_use-drawer-mutations.ts | wc -l` returns 0

#### Manual Verification:
- [ ] Mutations work offline (queue to IndexedDB)
- [ ] "Saved offline" toast appears when offline
- [ ] Mutations replay on reconnect
- [ ] Online indicator shows connection status

---

## Desired End State

```typescript
// Before: 1141-line monolith with 26 useState
export function BayViewV2Client() {
  const [data, setData] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [myJobsOnly, setMyJobsOnly] = useState(false);
  // ... 23 more useState hooks
  const [toast, setToast] = useState(null);
  // ... 9 useCallback, 5 useRef, 7 useEffect
  return <DndContext>/* 200+ lines of JSX */</DndContext>;
}

// After: ~300-line orchestrator
export function BayViewV2Client() {
  return (
    <BayViewProvider>
      <BayViewContent />
    </BayViewProvider>
  );
}

// BayViewContent: ~300 lines, uses context + store
function BayViewContent() {
  const { data, loading, error } = useBayViewContext();
  const viewMode = useBayViewMode();
  // ... minimal local state

  return (
    <DndContext>
      <ErrorSection label="Toolbar"><Toolbar /></ErrorSection>
      <ErrorSection label="Queue"><QueuePanel /></ErrorSection>
      <ErrorSection>
        {viewMode === "grid" && <GridView />}
        {viewMode === "kanban" && <KanbanView />}
        {viewMode === "list" && <ListView />}
      </ErrorSection>
      <DialogManager />
      <WorkOrderDetailDrawer />
    </DndContext>
  );
}
```

## File Map

```
src/lib/types/index.ts                          # MODIFY — add helpers, catalog fields
src/lib/stores/bay-view-store.ts                # NEW — Zustand store + selectors
src/lib/stores/index.ts                         # MODIFY — export bay view store
src/lib/queries/use-bay-view.ts                 # NEW — React Query hooks
src/lib/queries/keys.ts                         # MODIFY — add bay view keys
src/components/bay-view-v2/_error-section.tsx   # NEW — granular error boundary
src/components/bay-view-v2/bay-view-provider.tsx # NEW — context provider
src/components/bay-view-v2/_bay-view-content.tsx # NEW — main content layout
src/components/bay-view-v2/_dialog-manager.tsx  # NEW — dialog state management
src/components/bay-view-v2/bay-view-v2-client.tsx # MODIFY — slim orchestrator
src/components/bay-view-v2/_bay-action-handlers.ts # MODIFY — use store + React Query
src/components/bay-view-v2/_bay-drag-handlers.ts # MODIFY — use store + polling mutex
src/components/bay-view-v2/_use-drawer-mutations.ts # MODIFY — useOrgMutation + offline
src/components/bay-view-v2/_toolbar.tsx         # MODIFY — use store selectors
src/components/bay-view-v2/work-order-detail-drawer.tsx # MODIFY — use React Query
```

## Ordering Constraints

- Slice 1 (Types) must come first — all other slices depend on correct types
- Slice 2 (Zustand) must come before Slice 3 (Decomposition) — decomposition uses store
- Slice 3 (Decomposition) must come before Slice 4 (React Query) — React Query needs the decomposed structure
- Slice 4 (React Query) must come before Slice 5 (Offline) — offline wraps React Query mutations

## Verification Notes

- Bay view page at `/dashboard/bay-view` must render correctly after each slice
- Drag-and-drop must work without polling interference (manual test: drag while polling is active)
- All dialogs must open/close correctly (Vaul + Base UI stacking precedent: test each dialog stacked on drawer)
- Error boundaries must catch render errors (manual test: throw in a section component)
- Offline mode must queue mutations (manual test: disconnect network, perform mutation, reconnect)

## Performance Considerations

- Zustand selector hooks prevent unnecessary re-renders (only re-render when selected slice changes)
- useCallback on all handlers passed as props prevents child re-renders
- React Query's staleTime reduces unnecessary refetches
- Polling mutex prevents race conditions between polling and drag mutations

## Migration Notes

- This is a client-side refactor only — bay-view-service.ts server-side code is untouched
- Existing API routes remain unchanged
- No database schema changes
- Rollback: git revert to pre-refactor commit

## Pattern References

- `src/components/work-orders/wizard/` — Wizard decomposition pattern
- `src/lib/stores/ui-store.ts` — Zustand store pattern
- `src/lib/queries/mutation-factory.ts` — useOrgMutation factory
- `src/components/error-boundary.tsx` — Error boundary component

## Developer Context

### Decisions from Checkpoint
1. **Decomposition**: Wizard pattern (context provider + section components) — approved
2. **Data architecture**: Full React Query migration — approved
3. **Offline**: Include offline queue in this refactor — approved
4. **Commits**: 4-5 incremental commits — approved

## Design History

- Slice 1: Types + Error Boundary — approved as generated
- Slice 2: Zustand Store + Selector Hooks — approved as generated
- Slice 3: Wizard Decomposition + Polling Mutex + useCallback — approved as generated (structural skeleton; prop interfaces refined during implement)
- Slice 4: React Query Migration + useOrgMutation — approved as generated (uses useMutation directly; bay view data is single-object, not list)
- Slice 5: Offline Queue Integration — approved as generated (inline offline logic per hook; withOfflineQueue HOF has context-passing issue)

## References

- Research: `.rpiv/artifacts/research/2026-06-05_15-30-00_bay-view-improvement.md`
- Analysis: `docs/bay-view-improvement-plan.md`
- Architecture review: `.rpiv/artifacts/architecture-reviews/2026-06-03_00-14-51_bay-view-v2.md`
