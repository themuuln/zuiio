---
date: 2026-06-03T00:28:58+0800
author: Temuulen Undrakhbayar
commit: 185264e
branch: main
repository: tolom
topic: "Multi-branch finance separation & sidebar branch selector"
tags: [research, codebase, branch-management, finance, sidebar, zustand]
status: complete
last_updated: 2026-06-03T00:28:58+0800
last_updated_by: Temuulen Undrakhbayar
---

# Research: Multi-branch finance separation & sidebar branch selector

## Research Question
How to add a global branch selector to the sidebar header (Zustand store), make the finance page filter by branch via a settings toggle, add an "Add Branch" dialog, and refactor dashboard/reports to read from the Zustand store instead of local state.

## Summary

The branch filtering architecture is sound at the API and service layers — `report-service.ts` already has `withBranchFilter<T>` and the reports API route already reads `?branch=` params. The gap is entirely client-side: (1) no global branch state exists (each page has its own `useState<string>("all")`); (2) the finance page uses raw `fetch` + `useReducer` and sends no branch param; (3) the sidebar has no branch selector; (4) no UI exists for creating branches. All 8 research questions resolved into a consistent plan: extend the existing Zustand `ui-store` with `selectedBranchId`, refactor finance to `useDashboard` hook (which auto-wires branch), add a `useSelectedBranchGuard` hook for deletion safety, insert `BranchSelect` in the sidebar, add an explicit "Branches" section in Org Settings with a finance separation toggle, and follow the existing quick-create dialog pattern for "Add Branch".

## Detailed Findings

### Sidebar Structure & BranchSelect Integration

**File**: `src/components/app-sidebar/index.tsx:45-57`
**File**: `src/components/app-sidebar/_org-branding.tsx:1-49`

The sidebar renders: `SidebarHeader` → `OrgBranding` → `SidebarContent` (nav groups). `OrgBranding` shows org logo + name with collapse-aware CSS (`group-data-[collapsible=icon]`). A new branch selector slot goes between `OrgBranding` (line 47) and `SidebarContent` (line 48). The branch selector hides entirely when collapsed via `group-data-[collapsible=icon]:hidden` — same pattern as nav labels. The sidebar does not currently call `useBranches(orgId)` or `useCurrentOrg()` (only `OrgBranding` does, via its own query). The branch selector component needs `orgId` from a parent wrapper or context.

### Zustand Store Extension

**File**: `src/lib/stores/ui-store.ts:1-65`

The store uses `create<UiStore>()(devtools(persist(immer(...), { name: "tolom-ui" })))`. Adding `selectedBranchId` requires:
- Add `selectedBranchId: string` to `UiState`
- Add `setSelectedBranchId: (id: string) => void` to `UiActions`
- Create selector hooks: `useSelectedBranchId`, `useSetSelectedBranchId`, optionally `useBranchFilter` (derived selector returning `null` when `"all"`)
- Add to `partialize` (line 37-40) for persistence across reloads
- Export from `src/lib/stores/index.ts`

### Dashboard & Reports Migration (Local State → Store)

**File**: `src/app/[locale]/dashboard/page.tsx:75-89`
**File**: `src/app/[locale]/dashboard/reports/page.tsx:389-405`

Both pages have identical local state patterns:
- `const [selectedBranchId, setSelectedBranchId] = useState<string>("all")` (line 75 / 389)
- Guard `useEffect` resetting to `"all"` when branch deleted (lines 84-89 / 399-405)
- `branchFilter = selectedBranchId === "all" ? null : selectedBranchId` (line 79 / 394)

Migration replaces these with: `const selectedBranchId = useSelectedBranchId()`, calls `useSelectedBranchGuard(orgId)`, and derives `branchFilter` from the store. The `BranchSelect` component remains unchanged — it continues receiving `value` and `onChange` from the consumer, which now reads from the store.

### `useSelectedBranchGuard` Hook (New)

A shared custom hook that prevents duplication of the deletion-guard logic:
```ts
export function useSelectedBranchGuard(orgId: string | undefined) {
  const selectedBranchId = useSelectedBranchId();
  const setSelectedBranchId = useSetSelectedBranchId();
  const { data: branches = [] } = useBranches(orgId);
  useEffect(() => {
    if (selectedBranchId === "all") return;
    const stillExists = branches.some((b) => b.id === selectedBranchId);
    if (!stillExists) setSelectedBranchId("all");
  }, [branches, selectedBranchId, setSelectedBranchId]);
}
```

### Finance Page Refactoring

**File**: `src/app/[locale]/dashboard/finance/page.tsx:720-789`

Current state: raw `fetch` + `useReducer` with `financeDataReducer` (4-action state machine: `LOAD_START`, `LOAD_SUCCESS`, `LOAD_ERROR`, `LOAD_DONE`). The `fetchData` callback builds `new URLSearchParams({ type: "dashboard" })` with no branch param. The `useEffect` depends on `[orgId, dateFrom, dateTo, fetchData]` — no branch ID.

Refactoring plan: Replace the `useReducer` + `fetchData` + trigger `useEffect` with `useDashboard(orgId, { dateFrom, dateTo, branchId: branchFilter })`. This:
- Auto-wires the `?branch=` param
- Provides `data`, `isPending`, `error` return values
- Gets 60s `staleTime` and cache dedup
- Branches changes automatically trigger refetch via query key

The `finance_separate_per_branch` toggle (read from `useOrgSettings`) gates whether to show a `BranchSelect` component. When OFF or absent, branch filter stays `"all"`.

### Settings Toggle for Finance Separation

**File**: `src/app/[locale]/dashboard/settings/page.tsx:299-350`
**File**: `src/lib/queries/use-org-settings.ts:6-15`
**File**: `src/app/[locale]/dashboard/settings/_settings-sections.ts:13-70`

Org `settings` is a JSONB column with `[key: string]: unknown` — `finance_separate_per_branch: boolean` can be added without schema changes. The settings page constructs `nextSettings` via spread (line 303) and sends via `PATCH /api/organizations/[id]`. The service (`updateOrganization`) writes the entire `settings` object to the column.

A new `_branches-section.tsx` component registers in `_settings-sections.ts` with a `Switch` toggling `finance_separate_per_branch`. The `getBooleanSetting` utility (`_settings-utils.ts:19-24`) already exists for reading boolean settings with fallback.

### "Add Branch" Dialog Pattern

**File**: `src/components/customers/quick-create-customer-sheet.tsx:1-24`
**File**: `src/components/ui/responsive-form-modal.tsx:42-85`
**File**: `src/lib/services/branch-service.ts:16-45`
**File**: `src/app/api/organizations/[id]/branches/route.ts:13-25`

The canonical dialog pattern is:
1. `QuickCreateXxxSheet` — Sheet wrapper, owns modal lifecycle
2. `XxxForm` — form component, calls `useMutation`, calls `onSuccess` on submit
3. Mutation hook — `useMutation` with `queryClient.invalidateQueries` in `onSuccess`

The branch API is already functional: `POST /api/organizations/[id]/branches` creates branches with rate-limiting + subscription check. The service inserts + calls `revalidateTag`. Missing pieces: (1) `useCreateBranch` mutation hook, (2) `BranchForm` component, (3) `QuickCreateBranchSheet` wrapper. `CreateBranchParams` already exists at `src/lib/types/service-params.ts:27-32`.

### Cache Coherence

**File**: `src/lib/queries/use-branches.ts:8-16` — `staleTime: 5 * 60_000`

The 5-minute `staleTime` means the branch list in React Query can be stale for up to 5 minutes after a branch is created/deleted in another tab. The mutation's `onSuccess` must call `queryClient.invalidateQueries({ queryKey: branchKeys.all(orgId) })` to force an immediate refetch. No realtime subscription exists on the `branches` table; adding one would close the multi-tab gap.

### Pre-existing Bugs & Guardrails

From precedent analysis:
- **Never auto-select a branch**: This was a critical bug in the previous QA session. Both dashboard and reports now default to `"all"`. Any new branch-aware page must follow suit.
- **Sidebar modifications cause cascading failures**: Three hotfixes in one day for sidebar issues. The branch selector must use Zustand selectors (not store subscriptions), handle role-loading state, and bail out early when values haven't changed to prevent infinite re-render loops.
- **Column-level replace on settings save**: The settings page does a full `settings` object write. Components using `useUpdateOrgSettings` must read-then-merge, not just pass `{ finance_separate_per_branch: true }` alone, or they'll wipe all other settings.

## Code References

- `src/components/app-sidebar/index.tsx:45-57` — Sidebar render tree, insertion point for branch selector
- `src/components/app-sidebar/_org-branding.tsx:22-29` — Collapse-aware CSS pattern (group-data-[collapsible=icon])
- `src/components/branch-select.tsx:10-27` — BranchSelect component (controlled, presentational)
- `src/lib/stores/ui-store.ts:3-40` — Zustand store pattern (devtools, persist, immer, partialize)
- `src/lib/stores/index.ts:1-7` — Barrel re-export for store hooks
- `src/app/[locale]/dashboard/page.tsx:75-89` — Dashboard local branch state (target of migration)
- `src/app/[locale]/dashboard/reports/page.tsx:389-405` — Reports local branch state (target of migration)
- `src/app/[locale]/dashboard/finance/page.tsx:720-789` — Finance raw fetch + useReducer (target of refactor)
- `src/lib/queries/use-dashboard.ts:21-44` — useDashboard hook (replacement for finance fetch)
- `src/lib/queries/use-reports.ts:67-86` — useMechanics hook (branch-dependent mechanic list)
- `src/lib/queries/keys.ts:141-203` — reportKeys (branch ID in every query key)
- `src/lib/queries/keys.ts:218-223` — dashboardKeys (branch ID in every query key)
- `src/lib/queries/use-org-settings.ts:6-15` — OrgSettings interface (open-ended index signature)
- `src/app/[locale]/dashboard/settings/_settings-sections.ts:13-70` — Settings sections registry
- `src/app/[locale]/dashboard/settings/_settings-utils.ts:19-24` — getBooleanSetting utility
- `src/app/[locale]/dashboard/settings/_business-defaults-form.tsx:9-27` — SettingsForm interface + DEFAULT_FORM
- `src/components/customers/quick-create-customer-sheet.tsx:1-24` — Canonical quick-create dialog pattern
- `src/components/ui/responsive-form-modal.tsx:42-85` — Responsive modal/sheet/drawer shell
- `src/lib/types/service-params.ts:27-32` — CreateBranchParams type
- `src/lib/services/branch-service.ts:16-45` — createBranch service (insert + revalidateTag)
- `src/app/api/organizations/[id]/branches/route.ts:13-25` — POST branch API route
- `src/app/api/organizations/[id]/reports/route.ts:123-137` — Reports API branch param parsing
- `src/lib/services/report-service.ts:33-35` — withBranchFilter<T> helper
- `src/lib/services/report-service.ts:1488-1510` — getDashboardData (branch-aware with cache key)
- `src/hooks/use-selected-branch-guard.ts` — New file to create

## Integration Points

### Inbound References
- `src/app/[locale]/dashboard/page.tsx:352` — BranchSelect rendered (dashboard)
- `src/app/[locale]/dashboard/reports/page.tsx:676` — BranchSelect rendered (reports)
- `src/app/[locale]/dashboard/reports/page.tsx:439-515` — 8 React Query hooks consuming branchFilter
- `src/app/[locale]/dashboard/page.tsx:123-133` — useDashboard consuming branchFilter
- `src/app/[locale]/dashboard/page.tsx:95-121` — useRealtimeMulti consuming branchFilter
- `src/lib/services/report-service.ts:33-488` — ~25 uses of withBranchFilter across report functions

### Outbound Dependencies
- `src/lib/services/branch-service.ts` — createBranch, updateBranch, deleteBranch (all exist)
- `src/app/api/organizations/[id]/branches/route.ts` — GET + POST endpoints
- `src/lib/queries/use-branches.ts:8-16` — useBranches hook (staleTime: 300s)
- `src/lib/queries/keys.ts:12-15` — branchKeys factory
- `src/lib/cache/keys.ts:7` — cacheTags.branches server-side cache tag
- `src/components/ui/switch.tsx:1-32` — Switch component for settings toggle
- `src/components/ui/select.tsx` — Select primitives used by BranchSelect
- `src/lib/hooks/use-realtime-multi.ts` — Realtime subscriptions (for cache coherence)

### Infrastructure Wiring
- `src/lib/stores/index.ts` — Barrel export for new store hooks
- `src/app/[locale]/dashboard/settings/_settings-sections.ts` — Section registration
- `src/app/[locale]/dashboard/settings/page.tsx:148` — renderSectionContent dispatch

## Architecture Insights

1. **Branch state belongs in Zustand, not React Query.** The branches list (server data) stays in React Query via `useBranches`. The selected branch ID (client UI state) goes in Zustand. This is consistent with the existing pattern: `sidebarCollapsed` is in Zustand, org data is in React Query.

2. **Finance should adopt `useDashboard`.** The hook already handles branch params, caching, error states, and staleTime. The raw `fetch` + `useReducer` pattern is unique to the finance page and eliminates ~70 lines of code by migrating.

3. **Query key design already supports per-branch caching.** `dashboardKeys.all(orgId, branchId)` and `reportKeys.all(orgId, branchId)` include branch ID as the 4th key element. Branch switches produce different keys → automatic refetch + cache isolation. No key redesign needed.

4. **The `withBranchFilter` helper is the single source of truth** for branch-aware queries. Applied at the Supabase query level in `report-service.ts`. Finance piggybacks on this by routing through the same reports API.

5. **Settings JSONB is the right place for `finance_separate_per_branch`.** The `[key: string]: unknown` index signature means no type changes. The `getBooleanSetting` utility already exists. The column-level replace risk is managed by the read-then-spread pattern.

6. **The "Add Branch" dialog is copy-paste from existing patterns.** The quick-create-customer-sheet pattern is well-established: Sheet → Form → Mutation hook → API → Service. Every infrastructure piece for branches exists except the UI.

## Precedents & Lessons

6 similar past changes analyzed.

### Precedent: Branch auto-select bug (dashboard/reports)
**Context**: When org had exactly 1 branch, both pages auto-selected the branch UUID. Since work_orders have `branch_id: null`, this filtered out all data.
**Fix**: Initialized to `"all"` instead of auto-selecting. `useEffect` resets to `"all"` if branch ID no longer exists.
**Takeaway**: Any new branch-filter page MUST default to `"all"`, never auto-select.

### Precedent: Sidebar flash + null crash on role-loading
**Commit(s)**: `637f6a0`, `a8f01c6` (2026-06-01)
**Blast radius**: 2 files (sidebar, navigation hook)
**Follow-up fixes**: `53bd3b0`, `b9ca7e5` — same day
**Takeaway**: Sidebar must not re-render on every branch change. Use Zustand selectors for granular subscriptions. Handle role-loading state before showing branch selector. Bail out early when values haven't changed to prevent infinite loops (`b51137f`).

### Precedent: Settings page pattern + org JSONB settings
**Commit(s)**: `27ad8e9` (2026-05-22), `185264e` (2026-06-03)
**Takeaway**: Settings sections registered in `_settings-sections.ts`. Adding a "Branches" section with a `Switch` and `getBooleanSetting` follows the existing pattern. No schema migration needed.

### Precedent: Finance page data fetching (useReducer + fetch)
**Commit(s)**: `27ad8e9`, `185264e`
**Takeaway**: Finance page is the only consumer of raw fetch + useReducer for dashboard data. The `useDashboard` hook already handles everything finance needs. The raw fetch has no branch awareness.

### Precedent: withBranchFilter pattern in report-service
**Commit(s)**: `75bca02`, `bacf79b`, `54f26bf` (2026-06-01)
**Takeaway**: Three follow-up fixes to report-service. The `withBranchFilter` pattern is battle-tested. Finance gets it for free by routing through the same reports API.

### Precedent: Zustand store pattern (ui-store + work-order-store)
**Commit(s)**: `76d65e2` (2026-05-29), `d61de7d` (2026-05-31)
**Takeaway**: New store additions must follow the exact same pattern: separate State/Actions interfaces, immer for immutable updates, devtools for debugging, granular selector hooks for re-render prevention.

### Composite Lessons
- Never auto-select a branch — always default to `"all"`
- Sidebar modifications require handling: role-loading, collapse state, infinite loop prevention
- Don't mix server state (branches list in React Query) with client state (selected branch in Zustand)
- Use existing `withBranchFilter` pattern — don't reinvent it
- Settings save is column-level replace — read-then-spread or lose data
- The quick-create dialog pattern is well-established — follow it exactly for "Add Branch"

## Developer Context

**Q (discover: Branch selector location): Sidebar header**
A: Sidebar header — always visible, persists across navigation

**Q (discover: Finance behavior with branch): Finance respects selected branch**
A: When `finance_separate_per_branch` is ON, finance filters by selected branch. Dashboard and Reports aggregate by default (branch selection is optional filter).

**Q (discover: Branch management UI): In-dropdown "Add Branch"**
A: Branch selector includes "Add Branch" as the last option, opening a dialog following the quick-create-customer-sheet pattern.

**Q (discover: Pages affected by branch selector): Dashboard + Reports + Finance only**
A: Work Orders, Customers, Expenses, Inventory keep showing all branches (no branch-filtering in their services).

**Q (discover: Global state mechanism): Zustand store**
A: Extend existing ui-store with `selectedBranchId`. New selector hooks. Persist across reloads.

**Q (discover: Settings location): Explicit toggle in Org Settings**
A: "Branches" section in Org Settings with `Switch` controlling `finance_separate_per_branch`.

**Q (research: Finance refactor pattern): Use useDashboard hook**
A: Refactor finance to use `useDashboard` hook instead of raw `fetch` + `useReducer`.

**Q (research: Branch persistence): Persist across reloads**
A: Like `sidebarCollapsed`. Include `selectedBranchId` in `partialize`.

**Q (research: Collapsed sidebar behavior): Hide entirely when collapsed**
A: Use `group-data-[collapsible=icon]:hidden` CSS class on the branch selector wrapper.

## Related Research

- FRD: `.rpiv/artifacts/discover/2026-06-02_23-28-58_multi-branch-finance-separation.md`
- QA session: Previous session documenting branch auto-select bug fix (dashboard/page.tsx, reports/page.tsx)

## Open Questions

None — all 8 research questions resolved during checkpoint.
