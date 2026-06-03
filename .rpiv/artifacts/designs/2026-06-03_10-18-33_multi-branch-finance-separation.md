---
date: 2026-06-03T10:18:33+0800
author: Temuulen Undrakhbayar
commit: 185264e
branch: main
repository: tolom
topic: "Multi-branch finance separation & sidebar branch selector"
tags: [design, branch-management, finance, sidebar, zustand]
status: ready
parent: .rpiv/artifacts/research/2026-06-02_23-28-58_multi-branch-finance-separation.md
last_updated: 2026-06-03T10:18:33+0800
last_updated_by: Temuulen Undrakhbayar
---

# Design: Multi-branch Finance Separation & Sidebar Branch Selector

## Summary

Add a global branch selector to the sidebar header, driven by Zustand state, so branch selection persists across pages and survives reloads. Refactor the dashboard and reports pages to read from the store instead of local state. Make the finance page filter by branch when a new `finance_separate_per_branch` organization settings toggle is enabled. Add an "Add Branch" dialog to the sidebar dropdown and a dedicated "Branches" section in Org Settings with branch management and the finance toggle. No schema changes — all state lives in Zustand and the existing `organization.settings` JSONB column.

## Requirements

1. Global branch selector in sidebar header — always visible, persists across page navigation
2. Branch selection persists across page reloads (like sidebar collapsed state)
3. Dashboard and reports pages read branch from Zustand store instead of local state
4. Finance page filters by selected branch when `finance_separate_per_branch` toggle is ON
5. Finance page shows all branches when toggle is OFF or absent (no branch filter)
6. "Add Branch" option in sidebar dropdown opens quick-create dialog
7. "Branches" section in Org Settings with branch list table, create dialog, and finance separation toggle
8. Never auto-select a branch — default is always `"all"`
9. Sidebar branch selector hides when sidebar is collapsed (consistent with nav labels)

## Current State Analysis

### Existing Architecture

- **Branch filtering on server side**: `report-service.ts:33-35` has `withBranchFilter<T>` helper applied to ~25 report queries. Reports API reads `?branch=` param.
- **Dashboard**: Uses `useDashboard` hook which passes `branchId` in query key. Local state `useState<string>("all")`.
- **Reports**: Uses 8 React Query hooks all passing `branchFilter` param. Local state `useState<string>("all")`.
- **Finance**: Uses raw `fetch` + `useReducer`. No branch param sent. No React Query.
- **Sidebar**: `SidebarHeader` → `OrgBranding` → `SidebarContent`. No branch selector.
- **Settings**: Sections registered in `_settings-sections.ts:13-70`, rendered via `renderSectionContent` dispatch in `settings/page.tsx:150-237`. Standalone sections like `CommissionRulesSection` get `orgId` prop only.
- **Branch CRUD**: Full service layer exists (`branch-service.ts:16-149`) with `createBranch`, `getBranches`, `updateBranch`, `deleteBranch`. API route at `branches/route.ts:13-25`.

### Key Discoveries

- `src/lib/stores/ui-store.ts:3-40` — Zustand store with `devtools(persist(immer(...)))` pattern. `partialize` selects which fields persist.
- `src/lib/stores/index.ts:1-7` — Barrel export for store hooks.
- `src/components/branch-select.tsx:10-27` — Controlled `Select` component, receives `value` + `onChange` props.
- `src/components/app-sidebar/index.tsx:101-103` — Insertion point: after `OrgBranding` on line 102, inside `SidebarHeader`.
- `src/components/app-sidebar/_org-branding.tsx:24-38` — Collapse-aware CSS using `group-data-[collapsible=icon]:hidden` pattern.
- `src/app/[locale]/dashboard/page.tsx:75-89` — Local branch state + guard `useEffect`.
- `src/app/[locale]/dashboard/reports/page.tsx:389-405` — Same local state pattern.
- `src/app/[locale]/dashboard/finance/page.tsx:720-789` — Raw `fetch` + `useReducer` state machine.
- `src/lib/queries/use-dashboard.ts:21-44` — `useDashboard` hook handles branch param, caching, staleTime.
- `src/lib/queries/keys.ts:218-223` — `dashboardKeys.summary(orgId, period, branchId)` — branch in query key.
- `src/lib/queries/keys.ts:141-203` — `reportKeys.all(orgId, branchId)` — branch in all query keys.
- `src/components/customers/quick-create-customer-sheet.tsx:1-24` — Canonical quick-create dialog pattern.
- `src/components/ui/responsive-form-modal.tsx:42-85` — Responsive modal/sheet shell.
- `src/lib/types/service-params.ts:27-32` — `CreateBranchParams` type.
- `src/app/[locale]/dashboard/settings/_settings-sections.ts:13-70` — Section registry for settings.
- `src/app/[locale]/dashboard/settings/_commission-rules-section.tsx` — Canonical standalone section pattern.
- `src/app/[locale]/dashboard/settings/page.tsx:150-237` — `renderSectionContent` dispatch function.

## Scope

### Building

5 slices:

1. **Zustand store extension** — Add `selectedBranchId` + `setSelectedBranchId` to ui-store, new selector hooks, barrel export, `useSelectedBranchGuard` hook
2. **Sidebar BranchSelect** — Add optional `onAddBranch` prop to BranchSelect, create `SidebarBranchSelect` wrapper, insert in sidebar after OrgBranding
3. **Dashboard/Reports migration** — Replace local `useState` + guard `useEffect` with store selectors + `useSelectedBranchGuard` hook
4. **Finance refactor** — Replace `fetch` + `useReducer` with `useDashboard` hook, add `BranchSelect` when `finance_separate_per_branch` is ON
5. **Settings Branches section** — Register "Branches" section, create `_branches-section.tsx`, `QuickCreateBranchSheet`, `BranchForm`, `useCreateBranch` mutation, finance separation toggle switch

### Not Building

- Branch filter on Work Orders, Customers, Expenses, Inventory pages (not in scope)
- Branch deletion UI (can be added later)
- Per-branch settings (default currency, tax rate) — deferred to future
- `deleteBranchGuard` in store — not needed since no deletion UI exists
- Real-time cache coherence for branches (multi-tab) — 5min staleTime is acceptable

## Decisions

### Decision 1: Global branch state in Zustand (not React Query)

- **Ambiguity**: Branch selection is client UI state, not server data.
- **Explored**: React Query for `useBranches` (server data list) vs Zustand for selected ID (client preference). Consistent with existing pattern: `sidebarCollapsed` is Zustand, org data is React Query.
- **Decision**: `selectedBranchId` in Zustand `ui-store`, persisted via `partialize`. Branch list stays in React Query.

### Decision 2: Dashboard/Reports migrate to store selectors

- **Explored**: Both pages have identical `useState<string>("all")` + guard `useEffect`. Duplicated code that drifts independently.
- **Decision**: Replace both with `useSelectedBranchId()` selector + shared `useSelectedBranchGuard(orgId)` hook.

### Decision 3: Finance refactor to useDashboard

- **Explored**: Finance uses unique `fetch` + `useReducer` pattern. `useDashboard` already handles branch params, caching, error states, staleTime.
- **Decision**: Replace `fetchData` + `useEffect` with `useDashboard(orgId, { dateFrom, dateTo, branchId: branchFilter })`. Eliminates ~50 lines.

### Decision 4: BranchSelect gets optional `onAddBranch` prop

- **Explored**: Adding "Add Branch" to the sidebar dropdown. Options: modify BranchSelect (add prop), separate button, wrapper component.
- **Decision**: Modify `BranchSelect` to accept optional `onAddBranch?: () => void`. When provided, renders a `SelectItem` with value `"__add__"` at the bottom of the dropdown, separated by a visual divider.

### Decision 5: Settings "Branches" section follows CommissionRulesSection pattern

- **Explored**: Standalone section vs form-integrated section.
- **Decision**: Standalone section receiving only `orgId` prop. Uses own data fetching (useBranches), own mutation hooks (useCreateBranch), own dialog (QuickCreateBranchSheet). Matches existing pattern.

### Decision 6: `finance_separate_per_branch` in `organization.settings` JSONB

- **Explored**: No schema change needed. Settings is JSONB with `[key: string]: unknown`. `getBooleanSetting` utility already exists.
- **Decision**: Key `finance_separate_per_branch` in settings JSONB. Read-then-spread pattern to prevent column wipe.

## Architecture

### src/lib/stores/ui-store.ts — MODIFY

```typescript
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface UiState {
  sidebarCollapsed: boolean;
  selectedBranchId: string;
  activeFilters: Record<string, string>;
}

interface UiActions {
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSelectedBranchId: (id: string) => void;
  setFilter: (key: string, value: string) => void;
  clearFilters: () => void;
}

type UiStore = UiState & UiActions;

export const useUiStore = create<UiStore>()(
  devtools(
    persist(
      immer((set) => ({
        // State
        sidebarCollapsed: false,
        selectedBranchId: "all",
        activeFilters: {},

        // Actions
        toggleSidebar: () =>
          set((s) => {
            s.sidebarCollapsed = !s.sidebarCollapsed;
          }),
        setSidebarCollapsed: (collapsed) =>
          set((s) => {
            s.sidebarCollapsed = collapsed;
          }),
        setSelectedBranchId: (id) =>
          set((s) => {
            s.selectedBranchId = id;
          }),
        setFilter: (key, value) =>
          set((s) => {
            s.activeFilters[key] = value;
          }),
        clearFilters: () =>
          set((s) => {
            s.activeFilters = {};
          }),
      })),
      {
        name: "tolom-ui",
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          selectedBranchId: state.selectedBranchId,
        }),
      },
    ),
    { name: "UiStore" },
  ),
);

// ── Selector hooks (avoids unnecessary re-renders) ──────────────────
export const useSidebarCollapsed = () => useUiStore((s) => s.sidebarCollapsed);
export const useSelectedBranchId = () => useUiStore((s) => s.selectedBranchId);
export const useSetSelectedBranchId = () => useUiStore((s) => s.setSelectedBranchId);
export const useActiveFilters = () => useUiStore((s) => s.activeFilters);
export const useFilter = (key: string) =>
  useUiStore((s) => s.activeFilters[key]);
```

### src/lib/stores/index.ts — MODIFY

```typescript
export {
  useActiveFilters,
  useFilter,
  useSelectedBranchId,
  useSetSelectedBranchId,
  useSidebarCollapsed,
  useUiStore,
} from "./ui-store";
export type { WorkOrderItem, WorkOrderStep } from "./work-order-store";
export {
  useWorkOrderItems,
  useWorkOrderStep,
  useWorkOrderStore,
  useWorkOrderTotals,
  useWorkOrderVehicle,
} from "./work-order-store";
```

### src/hooks/use-selected-branch-guard.ts — NEW

```typescript
"use client";

import { useEffect } from "react";
import {
  useSelectedBranchId,
  useSetSelectedBranchId,
} from "@/lib/stores";
import { useBranches } from "@/lib/queries/use-branches";

/**
 * Resets selected branch to "all" when the currently selected branch
 * no longer exists (e.g. deleted by another admin).
 *
 * Must be called at the page level (dashboard, reports) when the org ID is available.
 * Keeps the guard logic in one place instead of duplicating useEffect in every page.
 */
export function useSelectedBranchGuard(orgId: string | undefined) {
  const selectedBranchId = useSelectedBranchId();
  const setSelectedBranchId = useSetSelectedBranchId();
  const { data: branches = [] } = useBranches(orgId);

  useEffect(() => {
    if (selectedBranchId === "all") return;

    const stillExists = branches.some((branch) => branch.id === selectedBranchId);
    if (!stillExists) {
      setSelectedBranchId("all");
    }
  }, [branches, selectedBranchId, setSelectedBranchId]);
}
```

### src/components/branch-select.tsx:10-65 — MODIFY

```typescript
export function BranchSelect({ value, onChange, branches, placeholder, allLabel, className, onAddBranch, }: BranchSelectProps) {
  return (
    <Select value={value || "all"} onValueChange={(v) => onChange(v ?? "all")}>
      <SelectTrigger className={className ?? "min-w-44"}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align="start">
        <SelectItem value="all">{allLabel}</SelectItem>
        {branches.map((branch) => (
          <SelectItem key={branch.id} value={branch.id}>
            {branch.name}
          </SelectItem>
        ))}
        {onAddBranch && (
          <>
            <div className="h-px bg-border my-1" />
            <button type="button" className="..." onClick={(e) => { e.preventDefault(); onAddBranch(); }}>
              + Add Branch
            </button>
          </>
        )}
      </SelectContent>
    </Select>
  );
}
```

Key addition: `onAddBranch?: () => void` prop. When provided, renders a divider + clickable "+ Add Branch" button at the bottom of the dropdown.

### src/components/sidebar-branch-select.tsx — NEW

_Actual file location: `src/components/app-sidebar/_sidebar-branch-select.tsx`_

```typescript
"use client";

export function SidebarBranchSelect() {
  const t = useTranslations();
  const { data: orgInfo } = useCurrentOrg();
  const orgId = orgInfo?.orgId;
  const { isAdmin, isManager } = useCurrentUserRole();
  const selectedBranchId = useSelectedBranchId();
  const setSelectedBranchId = useSetSelectedBranchId();
  const { data: branches = [] } = useBranches(orgId);
  const [addBranchOpen, setAddBranchOpen] = useState(false);

  if (!isAdmin && !isManager) return null;

  return (
    <>
      <div className="px-2 group-data-[collapsible=icon]:hidden group-data-[collapsible=icon]:group-hover:block">
        <BranchSelect
          value={selectedBranchId}
          onChange={setSelectedBranchId}
          branches={branches}
          placeholder={t("dashboard.branch")}
          allLabel={t("dashboard.allBranches")}
          className="w-full"
          onAddBranch={() => setAddBranchOpen(true)}
        />
      </div>
      {addBranchOpen && <AddBranchDialog open={addBranchOpen} onOpenChange={setAddBranchOpen} orgId={orgId} />}
    </>
  );
}
```

Collapse-aware CSS: `group-data-[collapsible=icon]:hidden` hides when collapsed, `group-hover:block` shows on hover (matching nav label behavior).

### src/components/app-sidebar/index.tsx:99-102 — MODIFY

```typescript
import { SidebarBranchSelect } from "./_sidebar-branch-select";

// Inside AppSidebar, SidebarHeader:
<SidebarHeader>
  <OrgBranding />
  <SidebarBranchSelect />
</SidebarHeader>
```

### src/app/[locale]/dashboard/page.tsx:75-85 — MODIFY

```typescript
// Replace local state with store selectors:
import { useSelectedBranchGuard } from "@/hooks/use-selected-branch-guard";
import { useSelectedBranchId, useSetSelectedBranchId } from "@/lib/stores";

// Remove: const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
// Add:
const selectedBranchId = useSelectedBranchId();
const setSelectedBranchId = useSetSelectedBranchId();

// Replace the guard useEffect with:
useSelectedBranchGuard(orgId);
```

### src/app/[locale]/dashboard/reports/page.tsx:389-410 — MODIFY

```typescript
// Replace local state with store selectors (same pattern as dashboard):
import { useSelectedBranchGuard } from "@/hooks/use-selected-branch-guard";
import { useSelectedBranchId, useSetSelectedBranchId } from "@/lib/stores";

// Remove: const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
// Remove: useEffect(() => { guard logic }, [branchesQ.data, selectedBranchId]);
// Add:
const selectedBranchId = useSelectedBranchId();
const setSelectedBranchId = useSetSelectedBranchId();
useSelectedBranchGuard(orgId);
```

### src/app/[locale]/dashboard/finance/page.tsx:708-800 — MODIFY

```typescript
// Replaced local useReducer + fetchData pattern with useDashboard hook:
import { useDashboard } from "@/lib/queries/use-dashboard";
import { useOrgSettings } from "@/lib/queries/use-org-settings";
import { useSelectedBranchId, useSetSelectedBranchId } from "@/lib/stores";
import { BranchSelect } from "@/components/branch-select";
import { useBranches } from "@/lib/queries/use-branches";

// Branch filter gated by finance_separate_per_branch toggle:
const selectedBranchId = useSelectedBranchId();
const { settings: orgSettings } = useOrgSettings(orgId ?? undefined);
const financeSeparate =
  (orgSettings as Record<string, unknown>)?.["finance_separate_per_branch"] === true;
const branchFilter = financeSeparate && selectedBranchId !== "all" ? selectedBranchId : null;

// Removed: FinanceDataState, FinanceDataAction, financeDataReducer, fetchData, trigger useEffect
// Replaced with:
const { data, isPending: dataLoading, error: dataError } = useDashboard(orgId ?? undefined, {
  dateFrom, dateTo, branchId: branchFilter,
});

// BranchSelect rendered in header when toggle is ON:
{financeSeparate && (
  <BranchSelect value={selectedBranchId} onChange={useSetSelectedBranchId()} branches={branches} />
)}
```

### src/app/[locale]/dashboard/settings/_settings-sections.ts:30-37 — MODIFY (add section)

```typescript
{
  value: "branches",
  title: t("sectionBranches"),
  description: t("sectionBranchesDesc"),
  icon: GitBranch,
},
```

Import `GitBranch` from `lucide-react`.

### src/app/[locale]/dashboard/settings/_branches-section.tsx — NEW

Self-contained section component following `CommissionRulesSection` pattern:
- Receives only `orgId` prop
- Fetches its own data (`useBranches`, `useOrgSettings`)
- Branch list table with name/address/phone/status columns
- Finance separation toggle switch (read-then-spread via `useUpdateOrgSettings`)
- "Add Branch" button opens `QuickCreateBranchSheet`
- Empty/loading/error states

### src/app/[locale]/dashboard/settings/page.tsx — MODIFY

```typescript
import { BranchesSection } from "./_branches-section";

// In renderSectionContent:
if (section.value === "branches") {
  return <BranchesSection orgId={options.orgId} />;
}
```

### src/lib/queries/use-create-branch.ts — NEW

Mutation hook following `useCreateCustomer` pattern (`use-wizard-data.ts:493-537`):
- POST to `/api/organizations/${orgId}/branches` with `CreateBranchParams` body
- Returns `json.data as Branch`
- Invalidates `branchKeys.all(orgId)` on success
- Error handling with `json.error?.message`

### src/components/branches/quick-create-branch-sheet.tsx — NEW

Quick-create dialog following `QuickCreateCustomerSheet` pattern:
- Wraps `ResponsiveFormModal` (responsive: Sheet desktop, Drawer mobile)
- Renders `BranchForm` with `onSuccess` that closes modal + calls `onCreated`

### src/components/branches/branch-form.tsx — NEW

Branch creation form following `CustomerForm` pattern:
- Uses `react-hook-form` + `zod` with `useCreateBranch` mutation
- Fields: name (required), address, phone, email
- `onSuccess` callback returns created `Branch`

## Slices

### Slice 1: Zustand store extension

**Files**: `src/lib/stores/ui-store.ts`, `src/lib/stores/index.ts`, `src/hooks/use-selected-branch-guard.ts`

#### Automated Verification:
- [x] Type checking passes: `pnpm validate:types`
- [x] `useSelectedBranchId` returns a string from the store
- [x] `useSetSelectedBranchId` returns a function that updates the store
- [x] `useSelectedBranchGuard` compiles and accepts `(orgId: string | undefined)`

#### Manual Verification:
- [ ] Store persists `selectedBranchId` across page reload (check via DevTools)
- [ ] Store resets to `"all"` when persisted branch ID no longer exists

### Slice 2: Sidebar BranchSelect

**Files**: `src/components/branch-select.tsx`, `src/components/app-sidebar/_sidebar-branch-select.tsx`, `src/components/app-sidebar/index.tsx`

#### Automated Verification:
- [x] Type checking passes: `pnpm validate:types`
- [x] BranchSelect accepts `onAddBranch?: () => void` prop
- [x] SidebarBranchSelect compiles with store selectors

#### Manual Verification:
- [ ] Sidebar shows branch selector below org branding
- [ ] Branch selector hides when sidebar is collapsed
- [ ] Branch selector shows on hover when collapsed
- [ ] Selecting a branch updates the Zustand store
- [ ] "Add Branch" option visible in dropdown
- [ ] Clicking "Add Branch" triggers onAddBranch callback

### Slice 3: Dashboard/Reports migration

**Files**: `src/app/[locale]/dashboard/page.tsx`, `src/app/[locale]/dashboard/reports/page.tsx`

#### Automated Verification:
- [x] Type checking passes: `pnpm validate:types`
- [x] No remaining `useState<string>("all")` for branch state in dashboard or reports

#### Manual Verification:
- [ ] Dashboard shows correct data when branch changes in sidebar
- [ ] Reports page shows correct data when branch changes in sidebar
- [ ] Deleting selected branch (via settings) resets to "all"
- [ ] No double data-fetch on initial load

### Slice 4: Finance refactor

**Files**: `src/app/[locale]/dashboard/finance/page.tsx`

#### Automated Verification:
- [x] Type checking passes: `pnpm validate:types`
- [x] No remaining `useReducer` or `fetchData` call for dashboard data — replaced with `useDashboard` hook

#### Manual Verification:
- [ ] Finance overview tab shows data (same as dashboard)
- [ ] Finance filters by branch when `finance_separate_per_branch` is ON
- [ ] Finance shows all branches when toggle is OFF
- [ ] Finance shows all branches when no toggle (default behavior)
- [ ] BranchSelect appears in finance header when toggle is ON

### Slice 5: Settings Branches section

**Files**: `src/app/[locale]/dashboard/settings/_settings-sections.ts`, `src/app/[locale]/dashboard/settings/_branches-section.tsx`, `src/app/[locale]/dashboard/settings/page.tsx`, `src/lib/queries/use-create-branch.ts`, `src/components/branches/quick-create-branch-sheet.tsx`, `src/components/branches/branch-form.tsx`

#### Automated Verification:
- [x] Type checking passes: `pnpm validate:types`
- [x] `useCreateBranch` mutation hook compiles and invalidates `branchKeys.all`
- [x] Settings section registered and rendering dispatcher wired

#### Manual Verification:
- [ ] "Branches" section appears in Org Settings sidebar navigation
- [ ] Branches section shows list of existing branches
- [ ] "Add Branch" button opens the dialog
- [ ] Submitting the form creates a branch and updates the list
- [ ] Finance separation toggle switch appears and saves correctly
- [ ] Toggling finance separation does NOT wipe other org settings (read-then-spread pattern)

## Desired End State

### Sidebar: Global Branch Selector

```tsx
// AppSidebar renders:
<SidebarHeader>
  <OrgBranding />
  <SidebarBranchSelect />
</SidebarHeader>
```

### Dashboard/Reports: Read from Store

```tsx
// Before (dashboard):
const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
// After:
const selectedBranchId = useSelectedBranchId();

// Before (guard effect, duplicated in both pages):
useEffect(() => { /* reset if branch deleted */ }, [branches, selectedBranchId]);
// After (shared hook):
useSelectedBranchGuard(orgId);
```

### Finance: Branch-Aware

```tsx
// Before:
const [financeData, dispatchFinance] = useReducer(financeDataReducer, { ... });
const fetchData = useCallback(async () => {
  const params = new URLSearchParams({ type: "dashboard" });
  // ...no branch param
}, []);

// After:
const selectedBranchId = useSelectedBranchId();
const orgSettings = useOrgSettings(orgId);
const branchFilter = orgSettings?.finance_separate_per_branch && selectedBranchId !== "all"
  ? selectedBranchId
  : null;
const { data, isPending } = useDashboard(orgId, { dateFrom, dateTo, branchId: branchFilter });
```

### Settings: Branches Section

```tsx
// _settings-sections.ts adds:
{
  value: "branches",
  title: t("sectionBranches"),
  description: t("sectionBranchesDesc"),
  icon: Building2,
}

// renderSectionContent dispatches:
if (section.value === "branches") {
  return <BranchesSection orgId={options.orgId} />;
}
```

## File Map

```
src/lib/stores/ui-store.ts                          # MODIFY — add selectedBranchId + setSelectedBranchId
src/lib/stores/index.ts                             # MODIFY — export new selector hooks
src/hooks/use-selected-branch-guard.ts               # NEW — shared branch-deletion guard effect
src/components/branch-select.tsx                     # MODIFY — add optional onAddBranch prop
src/components/sidebar-branch-select.tsx             # NEW — sidebar wrapper with Add Branch logic
src/components/app-sidebar/index.tsx                 # MODIFY — add SidebarBranchSelect after OrgBranding
src/app/[locale]/dashboard/page.tsx                 # MODIFY — replace local state with store selectors
src/app/[locale]/dashboard/reports/page.tsx          # MODIFY — replace local state with store selectors
src/app/[locale]/dashboard/finance/page.tsx          # MODIFY — refactor to useDashboard + branch awareness
src/app/[locale]/dashboard/settings/_settings-sections.ts  # MODIFY — add "branches" section
src/app/[locale]/dashboard/settings/_branches-section.tsx  # NEW — branch list, add dialog, finance toggle
src/app/[locale]/dashboard/settings/page.tsx         # MODIFY — add branches section rendering
src/lib/queries/use-create-branch.ts                 # NEW — useCreateBranch mutation hook
src/components/branches/quick-create-branch-sheet.tsx  # NEW — quick-create dialog shell
src/components/branches/branch-form.tsx              # NEW — branch creation form
```

## Ordering Constraints

- Slice 1 (Zustand) must come first — all other slices depend on the store
- Slice 2 (Sidebar) depends on Slice 1 — needs store selectors
- Slice 3 (Dashboard/Reports) depends on Slice 1 — needs store selectors + guard hook
- Slice 4 (Finance) depends on Slice 1 — needs store selectors
- Slice 5 (Settings) is independent — can run in parallel with Slices 2-4

## Verification Notes

- After each slice, run `pnpm validate:types` to catch type errors
- After Slice 2, visually verify: sidebar shows branch selector, collapses correctly
- After Slice 3, visually verify: dashboard/reports respond to sidebar branch changes
- After Slice 4, verify: finance filters correctly when toggle is ON, ignores when OFF
- After Slice 5, verify: branches section appears in settings, create dialog works, toggle persists
- See `test-workflow.md` for production testing workflow (build → start → verify)

## Performance Considerations

- Zustand selectors provide granular subscriptions — sidebar won't re-render on every branch change
- React Query `staleTime: 60000` prevents redundant fetches
- Branch changes produce different query keys → automatic cache isolation
- No new database queries introduced — existing `withBranchFilter` handles all filtering

## Migration Notes

No schema changes required. All state changes are additive:
- New Zustand field (`selectedBranchId`) — safe add, default `"all"`
- New organization settings key (`finance_separate_per_branch`) — optional, defaults to falsy/undefined
- New files (hooks, components) — additive, no migration needed

## Pattern References

- `src/lib/stores/ui-store.ts:3-40` — Zustand store pattern (devtools, persist, immer, partialize)
- `src/components/app-sidebar/_org-branding.tsx:24-38` — Collapse-aware sidebar CSS pattern
- `src/app/[locale]/dashboard/settings/_commission-rules-section.tsx` — Standalone settings section pattern
- `src/lib/queries/use-wizard-data.ts:493-537` — `useCreateCustomer` mutation hook pattern
- `src/components/customers/quick-create-customer-sheet.tsx:1-24` — Quick-create dialog pattern
- `src/app/[locale]/dashboard/settings/page.tsx:150-237` — `renderSectionContent` dispatch pattern
- `src/app/[locale]/dashboard/settings/_settings-sections.ts:13-28` — Section registration pattern

## Developer Context

**Q (Slice 1): How should useSelectedBranchGuard work?**
A: A shared hook that calls `useSelectedBranchId()`, `useSetSelectedBranchId()`, and `useBranches(orgId)`. When `selectedBranchId !== "all"` and the branch no longer exists in `branches`, reset to `"all"`. Uses a `useEffect` with `[branches, selectedBranchId, setSelectedBranchId]` deps.

**Q (Slice 2): Should BranchSelect be modified or wrapped?**
A: Modified with optional `onAddBranch` prop. When provided, renders an extra `SelectItem` with value `"__add__"` at the bottom of the dropdown, separated by a visual line. The sidebar wrapper handles the dialog logic.

**Q (Slice 4): How does the finance toggle gate the branch filter?**
A: `branchFilter = selectedBranchId === "all" ? null : selectedBranchId`. Wrapped: when `finance_separate_per_branch` is falsy/absent, branchFilter is always `null`. The BranchSelect is conditionally rendered in finance when the toggle is ON.

## Design History

- Slice 1: Zustand store extension — approved as generated
- Slice 2: Sidebar BranchSelect — approved as generated
- Slice 3: Dashboard/Reports migration — approved as generated
- Slice 4: Finance refactor — approved as generated
- Slice 5: Settings Branches section — approved as generated

## References

- `.rpiv/artifacts/research/2026-06-02_23-28-58_multi-branch-finance-separation.md` — Research artifact
- `.rpiv/artifacts/discover/2026-06-02_23-28-58_multi-branch-finance-separation.md` — FRD with requirements
