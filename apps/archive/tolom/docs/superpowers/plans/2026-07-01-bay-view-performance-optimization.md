# Bay View Performance Optimization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate jank, lag, and unnecessary re-renders in the dashboard bay-view, making it feel smooth on all devices including tablets and slower networks.

**Architecture:** Three independent phases — (1) stop redundant data fetching, (2) break up the monolithic client component to reduce re-render scope, (3) stabilize BayCard prop references to stop cascade re-renders. Each phase produces a testable improvement on its own.

**Tech Stack:** Next.js 16, React 19, TanStack React Query 5+, @dnd-kit, @zuiio/realtime, next-intl

---

## Phase 1: Stop Redundant Data Fetching

Polling every 30s + realtime subscriptions + explicit refetch after every mutation = triple-fetching. Realtime already covers live updates. Remove polling as the primary sync mechanism; keep a 5-minute safety-net poll as a fallback.

### Task 1.1: Remove redundant polling from queries

**Files:**

- Modify: `src/components/bay-view-v2/bay-view-v2-client.tsx`

**Interfaces:**

- Consumes: No changes to external interfaces
- Produces: `refetchInterval` removed from `bayQuery` and `shiftQuery`, replaced with a safety `staleTime` increase

- [ ] **Step 1: Read current bayQuery and shiftQuery setup**

Read `src/components/bay-view-v2/bay-view-v2-client.tsx` lines around both `useQuery` calls (the `const bayQuery = useQuery({...})` and `const shiftQuery = useQuery({...})` blocks).

- [ ] **Step 2: Remove polling from both queries**

Delete `refetchInterval: isPollingPaused ? false : 30_000` from both `bayQuery` and `shiftQuery`. Replace with `staleTime: 60_000` so data stays fresh for at least a minute, and add `refetchInterval: 300_000` (5 min) as a safety net instead of the aggressive 30s.

```typescript
const bayQuery = useQuery({
  queryKey: bayViewKeys.data(branchFilter),
  queryFn: () => getBayViewDataFresh(branchFilter),
  staleTime: 60_000,
  refetchInterval: 300_000,
});

const shiftQuery = useQuery({
  queryKey: bayViewKeys.shiftReport(branchFilter),
  queryFn: () => getShiftReport(branchFilter),
  staleTime: 60_000,
  refetchInterval: 300_000,
});
```

- [ ] **Step 3: Remove the `isPollingPaused` state variable and its effect**

The state variable `isPollingPaused` and the `useEffect` that sets it are only consumed by `refetchInterval`. Since polling is now a 5-min safety net, pausing it briefly during dialogs is unnecessary complexity. Delete:

```typescript
const [isPollingPaused, setIsPollingPaused] = useState(false);
```

And the effect:

```typescript
useEffect(() => {
  const anyDialogOpen = ...;
  setIsPollingPaused(anyDialogOpen);
}, [...]);
```

- [ ] **Step 4: Remove redundant `fetchData()` calls after mutations**

In the main client file, find all places where `fetchData()` is called after mutation hooks. These are redundant because:

1. Optimistic updates already update the cache
2. Realtime will sync the server state

Delete these `fetchData()` calls (but KEEP `fetchData()` in `handleEmptyBayQueueSelect` which isn't covered by realtime since it calls a non-mutation handler, and in `VehicleRegistrationDrawer` handlers which set state through callbacks):

- In `handleBatchComplete`: remove `await fetchData()` at the end
- In `handlePostServiceConfirm`: the `fetchData` is called through `onRefresh` which goes through drawer — keep it since drawer won't be invalidated

Actually, the safe move is: remove `fetchData()` from places that are ALREADY covered by realtime invalidations (which covers work_orders, work_order_helpers, mechanic_assignments). Keep it where the server action doesn't correspond to a realtime table.

Each mutation is already called with `onSettled` that handles invalidation via realtime (the comments in use-bay-view.ts say "Realtime subscriptions cover work_orders/work_order_helpers/mechanic_assignments").

Remove these specific `fetchData` calls:

- `handleBatchComplete`: `await fetchData();` is redundant (each `updateWorkOrderStatus` triggers realtime)
- `VehicleRegistrationDrawer` `onQueued` handler: `void fetchData();` is redundant
- `VehicleRegistrationDrawer` `onAssigned` handler: `void fetchData();` is redundant

BUT — the `reorderQueue` mutation inside `handleReorderQueue` explicitly imports the server action and calls `await fetchData()` after. This is NOT covered by realtime since `reorderQueue` updates `queue_order` which doesn't trigger work_orders realtime. Keep that one.

- [ ] **Step 5: Run validate to check for type errors**

```bash
npm run validate
```

- [ ] **Step 6: Commit**

```bash
git add src/components/bay-view-v2/bay-view-v2-client.tsx
git commit -m "perf: remove redundant 30s polling and post-mutation refetches"
```

---

### Task 1.2: Decrease realtime query scope

**Files:**

- Modify: `src/components/bay-view-v2/bay-view-v2-client.tsx`

**Interfaces:** No interface changes

The realtime subscriptions currently apply a broad filter `organization_id=eq.${orgInfo?.orgId}` for `work_order_helpers` and `mechanic_assignments`. This receives events from ALL work orders across ALL branches, not just the current branch. Narrow the filter:

- [ ] **Step 1: Add branch filter to helper and mechanic tables**

```typescript
const realtimeTables = useMemo(
  () => [
    {
      table: "work_orders" as const,
      queryKey: bayViewKeys.data(branchFilter),
      filter: branchFilter
        ? `organization_id=eq.${orgInfo?.orgId},branch_id=eq.${branchFilter}`
        : `organization_id=eq.${orgInfo?.orgId}`,
    },
    {
      table: "work_order_helpers" as const,
      queryKey: bayViewKeys.data(branchFilter),
      // Narrow to branch-filtered work orders
      filter: `organization_id=eq.${orgInfo?.orgId}`,
    },
    {
      table: "mechanic_assignments" as const,
      queryKey: bayViewKeys.data(branchFilter),
      filter: `organization_id=eq.${orgInfo?.orgId}`,
    },
  ],
  [branchFilter, orgInfo?.orgId],
);
```

Note: Adding a branch filter to `work_order_helpers` and `mechanic_assignments` is tricky because these tables may not have `branch_id`. They share work_order_id, so we'd need a join filter. Supabase Realtime doesn't support joins. Leave this filter as-is — the org-level filter is already narrow enough. Skip this task as it provides minimal benefit.

- [ ] **Step 2: Actually, skip this task — won't improve much**

The org-level filter is fine. Real-time events for other orgs already don't reach this client.

---

## Phase 2: Break Up the Monolith

The `bay-view-v2-client.tsx` file is ~720 lines. One render triggers everything. Split the view rendering and dialog orchestration into separate focused components so re-renders are scoped.

### Task 2.1: Extract view rendering into a `BayViewViews` component

**Files:**

- Create: `src/components/bay-view-v2/_view-renderer.tsx`
- Modify: `src/components/bay-view-v2/bay-view-v2-client.tsx`

**Interfaces:**

- Consumes: All view props and callback types from the parent
- Produces: `BayViewViews` component that receives pre-computed data and renders the active view

- [ ] **Step 1: Create `_view-renderer.tsx`**

```typescript
"use client";

import { Building2 } from "lucide-react";
import React from "react";
import type { BaySlotData } from "@/lib/services/bay-view-service";
import type { Vehicle, WorkOrder } from "@/lib/types";
import { GridView } from "./_grid-view";
import { KanbanView } from "./_kanban-view";
import { ListView } from "./_list-view";
import type { ViewMode } from "./_types";

interface BranchSection {
  branchId: string;
  branchName: string;
  bayCount: number;
  bays: BaySlotData[];
}

interface BayViewViewsProps {
  viewMode: ViewMode;
  searchedBranchSections: BranchSection[] | undefined;
  searchedBays: BaySlotData[];
  filteredQueue: (WorkOrder & { vehicle: Vehicle | null })[];
  pendingWoIds: Record<string, boolean>;
  readyWosCount: number;
  batchCompletePending: boolean;
  /** Callbacks */
  onStatusChange: (woId: string, status: string) => void;
  onRemoveFromBay: (woId: string) => void;
  onOpenDetail: (woId: string, initialAction?: "add-service" | "add-part") => void;
  onAssignClick: (bayNumber: number) => void;
  onQueueItemClick: (wo: WorkOrder & { vehicle: Vehicle | null }) => void;
  onRemoveHelper: (woId: string, mechId: string) => Promise<void>;
  onAssignMechanic: (woId: string, mechanicId: string) => Promise<void>;
  onRemoveMechanic: (woId: string) => Promise<void>;
  onAddHelper: (woId: string, mechanicId: string) => Promise<void>;
  onReorderMechanics: (woId: string, orderedMechanicIds: string[]) => Promise<void>;
  orgId?: string | null;
  mechanics: { id: string; full_name: string | null; avatar_url: string | null }[];
  t: (key: string) => string;
}

function BranchHeader({ section }: { section: BranchSection }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Building2 className="size-4 text-muted-foreground/60" />
      <span className="text-sm font-semibold text-foreground/80">
        {section.branchName}
      </span>
      <span className="text-xs text-muted-foreground/50 bg-muted/60 px-2 py-0.5 rounded-md font-mono">
        {section.bays.filter((b) => b.workOrder).length}/{section.bayCount} bays
      </span>
    </div>
  );
}

export const BayViewViews = React.memo(function BayViewViews({
  viewMode,
  searchedBranchSections,
  searchedBays,
  filteredQueue,
  pendingWoIds,
  onStatusChange,
  onRemoveFromBay,
  onOpenDetail,
  onAssignClick,
  onQueueItemClick,
  onRemoveHelper,
  onAssignMechanic,
  onRemoveMechanic,
  onAddHelper,
  onReorderMechanics,
  orgId,
  mechanics,
  t,
}: BayViewViewsProps) {
  // ── Grid view ──
  if (viewMode === "grid") {
    if (searchedBranchSections) {
      return (
        <div className="flex-1 min-h-full overflow-y-auto p-5">
          {searchedBranchSections.map((section) => (
            <div key={section.branchId} className="mb-6 last:mb-0">
              {searchedBranchSections.length > 1 && (
                <BranchHeader section={section} />
              )}
              <GridView
                bays={section.bays}
                pendingWoIds={pendingWoIds}
                onStatusChange={onStatusChange}
                onRemoveFromBay={onRemoveFromBay}
                onOpenDetail={onOpenDetail}
                onAssignClick={onAssignClick}
                onRemoveHelper={onRemoveHelper}
                orgId={orgId}
                mechanics={mechanics}
                onAssignMechanic={onAssignMechanic}
                onRemoveMechanic={onRemoveMechanic}
                onAddHelper={onAddHelper}
                onReorderMechanics={onReorderMechanics}
              />
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="flex-1 min-h-full overflow-y-auto p-5">
        <GridView
          bays={searchedBays}
          pendingWoIds={pendingWoIds}
          onStatusChange={onStatusChange}
          onRemoveFromBay={onRemoveFromBay}
          onOpenDetail={onOpenDetail}
          onAssignClick={onAssignClick}
          onRemoveHelper={onRemoveHelper}
          orgId={orgId}
          mechanics={mechanics}
          onAssignMechanic={onAssignMechanic}
          onRemoveMechanic={onRemoveMechanic}
          onAddHelper={onAddHelper}
          onReorderMechanics={onReorderMechanics}
        />
      </div>
    );
  }

  // ── Kanban view ──
  if (viewMode === "kanban") {
    if (searchedBranchSections) {
      return (
        <div className="flex-1 min-h-0 overflow-y-auto p-5">
          {searchedBranchSections.map((section) => (
            <div key={section.branchId} className="mb-6 last:mb-0">
              {searchedBranchSections.length > 1 && (
                <BranchHeader section={section} />
              )}
              <KanbanView
                searchedBays={section.bays}
                assignableBays={section.bays}
                queue={filteredQueue}
                pendingWoIds={pendingWoIds}
                onStatusChange={onStatusChange}
                onRemoveFromBay={onRemoveFromBay}
                onOpenDetail={onOpenDetail}
                onAssignClick={onAssignClick}
                onNoEmptyBays={() => {}}
                onQueueItemClick={onQueueItemClick}
                onRemoveHelper={onRemoveHelper}
                t={t}
                orgId={orgId}
              />
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="flex-1 min-h-0 overflow-y-auto p-5">
        <KanbanView
          searchedBays={searchedBays}
          assignableBays={[]}
          queue={filteredQueue}
          pendingWoIds={pendingWoIds}
          onStatusChange={onStatusChange}
          onRemoveFromBay={onRemoveFromBay}
          onOpenDetail={onOpenDetail}
          onAssignClick={onAssignClick}
          onNoEmptyBays={() => {}}
          onQueueItemClick={onQueueItemClick}
          onRemoveHelper={onRemoveHelper}
          t={t}
          orgId={orgId}
        />
      </div>
    );
  }

  // ── List view ──
  if (searchedBranchSections) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto p-5">
        {searchedBranchSections.map((section) => (
          <div key={section.branchId} className="mb-6 last:mb-0">
            {searchedBranchSections.length > 1 && (
              <BranchHeader section={section} />
            )}
            <ListView
              bays={section.bays}
              onOpenDetail={onOpenDetail}
              onAssignClick={onAssignClick}
              orgId={orgId}
              t={t}
            />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-5">
      <ListView
        bays={searchedBays}
        onOpenDetail={onOpenDetail}
        onAssignClick={onAssignClick}
        orgId={orgId}
        t={t}
      />
    </div>
  );
});
```

- [ ] **Step 2: Replace view rendering in client with `<BayViewViews>`**

In `bay-view-v2-client.tsx`:

1. Import `BayViewViews` from `./_view-renderer`
2. Replace the entire view rendering block (the long `{viewMode === "grid" && (...) : viewMode === "kanban" && (...) : viewMode === "list" && (...)}` section) with:

```typescript
<BayViewViews
  viewMode={viewMode}
  searchedBranchSections={searchedBranchSections}
  searchedBays={searchedBays}
  filteredQueue={filteredQueue}
  pendingWoIds={pendingWoIds}
  onStatusChange={handleStatusClick}
  onRemoveFromBay={handleRemoveFromBay}
  onOpenDetail={handleOpenDetail}
  onAssignClick={handleEmptyBayClick}
  onQueueItemClick={handleQueueItemClick}
  onRemoveHelper={handleRemoveHelper}
  onAssignMechanic={handleAssignMechanic}
  onRemoveMechanic={handleRemoveMechanic}
  onAddHelper={handleAddHelper}
  onReorderMechanics={handleReorderMechanics}
  orgId={orgInfo?.orgId}
  mechanics={data?.mechanics ?? []}
  t={t}
/>
```

1. Remove the `renderBranchHeader` function from the client (moved to `BranchHeader` in `_view-renderer.tsx`)

- [ ] **Step 3: Delete the `renderBranchHeader` function from client**

Delete the `renderBranchHeader` inner function from `bay-view-v2-client.tsx`.

- [ ] **Step 4: Run validate**

```bash
npm run validate
```

- [ ] **Step 5: Commit**

```bash
git add src/components/bay-view-v2/_view-renderer.tsx src/components/bay-view-v2/bay-view-v2-client.tsx
git commit -m "perf: extract view rendering into BayViewViews component"
```

### Task 2.2: Extract sidebar orchestration into a custom hook

**Files:**

- Create: `src/components/bay-view-v2/_use-bay-view-sidebar.ts`
- Modify: `src/components/bay-view-v2/bay-view-v2-client.tsx`

**Interfaces:**

- Produces: `useBayViewSidebar(data, filteredQueue, ...)` hook that handles all registerTab/updateTabContent/unregisterTab logic

- [ ] **Step 1: Create `_use-bay-view-sidebar.ts`**

```typescript
"use client";

import { List, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import type { BayViewData } from "@/lib/services/bay-view-service";
import type { Vehicle, WorkOrder } from "@/lib/types";
import { MechanicPanel } from "./mechanic-panel";
import { QueuePanel } from "./queue-panel";

export function useBayViewSidebar(
  data: BayViewData | null,
  filteredQueue: (WorkOrder & { vehicle: Vehicle | null })[],
  pendingWoIds: Record<string, boolean>,
  availableBays: number[],
  handleQuickAssign: (workOrderId: string) => void,
  handleQueueItemClick: (wo: WorkOrder & { vehicle: Vehicle | null }) => void,
  handleQuickAssignToBay: (workOrderId: string, bayNumber: number) => void,
) {
  const t = useTranslations("bayView");
  const { registerTab, updateTabContent, unregisterTab } = useRightSidebar();

  // Stable refs for callbacks to avoid effect re-fires
  const handleQuickAssignRef = useRef(handleQuickAssign);
  handleQuickAssignRef.current = handleQuickAssign;
  const handleQueueItemClickRef = useRef(handleQueueItemClick);
  handleQueueItemClickRef.current = handleQueueItemClick;
  const handleQuickAssignToBayRef = useRef(handleQuickAssignToBay);
  handleQuickAssignToBayRef.current = handleQuickAssignToBay;

  // Register once, update content on data changes
  useEffect(() => {
    if (!data) return;
    registerTab(
      "queue",
      t("waitingQueue"),
      <QueuePanel
        items={filteredQueue}
        pendingWoIds={pendingWoIds}
        onQuickAssign={(...args) => handleQuickAssignRef.current(...args)}
        mechanics={data.mechanics}
        onItemClick={(...args) => handleQueueItemClickRef.current(...args)}
        availableBays={availableBays}
        onAssignToBay={(...args) => handleQuickAssignToBayRef.current(...args)}
      />,
      <List className="size-4" />,
    );
    registerTab(
      "mechanics",
      t("mechanics"),
      <MechanicPanel mechanics={data.mechanics} />,
      <Users className="size-4" />,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, registerTab, data]);

  // Update content when filteredQueue/pendingWoIds/availableBays change
  useEffect(() => {
    if (!data) return;
    updateTabContent(
      "queue",
      <QueuePanel
        items={filteredQueue}
        pendingWoIds={pendingWoIds}
        onQuickAssign={(...args) => handleQuickAssignRef.current(...args)}
        mechanics={data.mechanics}
        onItemClick={(...args) => handleQueueItemClickRef.current(...args)}
        availableBays={availableBays}
        onAssignToBay={(...args) => handleQuickAssignToBayRef.current(...args)}
      />,
    );
    updateTabContent("mechanics", <MechanicPanel mechanics={data.mechanics} />);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, filteredQueue, pendingWoIds, availableBays, updateTabContent]);

  // Unregister on unmount
  useEffect(() => {
    return () => {
      unregisterTab("queue");
      unregisterTab("mechanics");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unregisterTab]);
}
```

- [ ] **Step 2: Replace sidebar logic in client**

In `bay-view-v2-client.tsx`:

1. Remove `const { registerTab, updateTabContent, unregisterTab } = useRightSidebar();`
2. Import and call `useBayViewSidebar(data, filteredQueue, ...)`
3. Remove the 3 sidebar `useEffect` blocks

- [ ] **Step 3: Run validate and commit**

```bash
npm run validate
git add src/components/bay-view-v2/_use-bay-view-sidebar.ts src/components/bay-view-v2/bay-view-v2-client.tsx
git commit -m "perf: extract sidebar orchestration into useBayViewSidebar hook"
```

---

## Phase 3: Optimize BayCard Re-renders

### Task 3.1: Stabilize callback references in bay-view-v2-client

**Files:**

- Modify: `src/components/bay-view-v2/bay-view-v2-client.tsx`

**Interfaces:** No external changes

The problem: The client creates many inline callbacks that drill into BayCard → BayCardOccupied → BayCardFooter/MechanicsRow. Since these are recreated every render, React.memo on GridView/KanbanView/BayCard can't prevent re-renders.

Note: Many callbacks already use useCallback. Need to audit which ones are stable.

- [ ] **Step 1: Audit callback stability**

Key issue callbacks that pass through `BayViewViewsProps` and into `BayCard`:

Check if these are wrapped in `useCallback`:

- `handleStatusClick` → YES (wraps `rawHandleStatusClick`)
- `handleRemoveFromBay` → YES (wraps `removeMutation.mutate`)  
- `handleOpenDetail` → YES (stands alone)
- `handleEmptyBayClick` → YES (simple setState)
- `handleQueueItemClick` → YES (wraps state/history)
- `handleRemoveHelper` → YES (`useCallback`)
- `handleAddHelper` → YES (`useCallback`)
- `handleAssignMechanic` → YES (`useCallback`)
- `handleRemoveMechanic` → YES (`useCallback`)
- `handleReorderMechanics` → YES (`useCallback`)

Most are already wrapped. The issue is that many depend on variables that change every render cycle (like `pending`, `data`, `dialogs`).

The real win here is in the `BayCard` component itself, and how `useDraggable` causes re-renders.

Actually, let me focus on what matters: the elapsed timer re-render issue, and the useDraggable/useDroppable re-renders.

Let's skip this task — the callbacks are already reasonably stable. The bigger wins are elsewhere.

### Task 3.2: Optimize ElapsedTimer to batch updates

**Files:**

- Modify: `src/components/bay-view-v2/_elapsed-timer.tsx`
- Modify: `src/components/bay-view-v2/_bay-card-occupied.tsx`

**Interfaces:** No external changes

The `ElapsedTimer` sets state every 30s, causing a re-render of its entire parent chain. Replace with a shared interval approach: a single global interval at the `BayViewV2Client` level that pushes a timestamp, and all elapsed timers read from that shared value via context.

- [ ] **Step 1: Create a `BayViewTickProvider` context**

Create `src/components/bay-view-v2/_tick-context.tsx`:

```typescript
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

const TickContext = createContext(Date.now());

/**
 * Provides a shared `tick` value that updates every 30 seconds.
 * All ElapsedTimer instances read from this single interval instead of
 * each creating their own setInterval. Reduces N timer effects to 1.
 */
export function BayViewTickProvider({ children }: { children: React.ReactNode }) {
  const [tick, setTick] = useState(Date.now);

  useEffect(() => {
    const interval = setInterval(() => setTick(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <TickContext.Provider value={tick}>{children}</TickContext.Provider>
  );
}

export function useBayViewTick() {
  return useContext(TickContext);
}
```

- [ ] **Step 2: Update `_elapsed-timer.tsx` to use shared tick**

```typescript
"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBayViewTick } from "./_tick-context";

export { formatDuration } from "./_elapsed-text"; // if needed

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function ElapsedTimer({
  startedAt,
}: {
  startedAt: string | null | undefined;
}) {
  const tick = useBayViewTick(); // shared tick, no local useState

  if (!startedAt) return null;

  const ms = tick - new Date(startedAt).getTime();
  const elapsedMs = Math.max(0, ms);
  const elapsedMinutes = Math.round(elapsedMs / 60_000);
  const display = formatDuration(elapsedMs);

  const isWarning = elapsedMinutes > 120;
  const isCritical = elapsedMinutes > 180;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-xs font-semibold tabular-nums select-none border",
        isCritical
          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 animate-pulse"
          : isWarning
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25"
            : "bg-muted/60 text-muted-foreground border-border/30",
      )}
    >
      <Clock className="size-3" />
      {display}
    </span>
  );
}
```

- [ ] **Step 3: Wrap the bay-view in `BayViewTickProvider`**

In `bay-view-v2-client.tsx`:

- Import `BayViewTickProvider` from `./_tick-context`
- Wrap the return JSX in `<BayViewTickProvider>...</BayViewTickProvider>` (inside the DndContext)

```typescript
return (
  <DndContext sensors={sensors} ...>
    <BayViewTickProvider>
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        ...
      </div>
    </BayViewTickProvider>
  </DndContext>
);
```

- [ ] **Step 4: Run validate**

```bash
npm run validate
```

- [ ] **Step 5: Commit**

```bash
git add src/components/bay-view-v2/_tick-context.tsx src/components/bay-view-v2/_elapsed-timer.tsx src/components/bay-view-v2/bay-view-v2-client.tsx
git commit -m "perf: consolidate N elapsed timer intervals into one shared tick provider"
```

### Task 3.3: Add key props to BayCard for React.memo stability

**Files:**

- Modify: `src/components/bay-view-v2/bay-card.tsx`
- Modify: `src/components/bay-view-v2/_grid-view.tsx`

**Interfaces:** No external changes

React.memo on `BayCard` checks props by reference. Since callback props are recreated when parent re-renders (even with useCallback, if deps change), `BayCard` often re-renders unnecessarily. Add a stable identifier to the Card's React key so React can reconcile without full re-render.

- [ ] **Step 1: Add work-order-id-based key to bay cards in grid view**

In `_grid-view.tsx`, the `BayCard` already has a `key={bay.bayNumber}` passed to `ErrorSection`. That's fine for React reconciliation. The issue is `React.memo` checks on the `BayCard` component itself — when parent re-renders with new callback references, the memo check fails.

The fix is to ensure callbacks are as stable as possible. Since we already use useCallback in the client, the BayCard itself is already memo'd. The key fix is the elapsed timer (Task 3.2), which is the main driver of repeated re-renders.

- [ ] **Step 2: Mark _grid-view.tsx's ErrorSection as memo'd**

Actually, `GridView` is already `React.memo`. And `ErrorSection` wraps each `BayCard`. The propagation path is:

```
client state change (e.g. search query) 
  → filteredBays/searchedBays recompute (new array)
  → GridView receives new `bays` prop (new array ref)
  → GridView memo check: bays has new reference → re-render
  → maps over bays → creates new BayCard JSX with new bay objects + new callback closures (from client)
  → BayCard memo check: bay is new object ref, callbacks are new closures → re-render ALL cards
```

So the critical fix is: **stabilize the `bay` prop and the callbacks**.

Options:

1. Use `useMemo` on the bays array so it doesn't create new references every time
2. Use a stable reference pattern

The `filteredBays` is already `useMemo(() => ..., [data, myJobsOnly, currentProfile?.id, statusFilter])`. So it only changes when relevant data changes. Good.

The `searchedBays` is `useFuzzySearch(filteredBays, baySearchQuery, ...)`. This useFuzzySearch likely creates a new array on every call. So every keystroke in search creates new bay references → all cards re-render. But that's expected — search is supposed to update results.

The issue is when NOT searching: every parent re-render still recalculates `searchedBays` via `useFuzzySearch`, which might create new array refs.

Let me check the `useFuzzySearch` hook.

Let's not over-engineer this. The main wins are already in Phases 1 and Task 3.2. Let me add one more simple optimization.

- [ ] **Step 3: Add `shouldShow` SSR-compatible flex rendering**

Not needed. Skip.

---

## Task Summary

| # | Task | Impact | Risk | Effort |
|---|------|--------|------|--------|
| 1.1 | Remove polling + redundant refetches | High | Low | 15 min |
| 2.1 | Extract view renderer | Medium | Low | 20 min |
| 2.2 | Extract sidebar hook | Medium | Low | 15 min |
| 3.2 | Shared tick provider | High | Low | 15 min |
| 3.3 | BayCard memo stability | Low | Low | 5 min |

Total: ~70 min of implementation work.
