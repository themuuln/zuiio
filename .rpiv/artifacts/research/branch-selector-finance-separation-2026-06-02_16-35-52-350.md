---
date: 2026-06-02T16:35:52.000Z
author: Pi (rpiv-pi)
commit: 185264e
branch: main
repository: https://github.com/themuuln/tolom.git
topic: branch-selector-finance-separation
tags: [branch, multi-tenant, finance, sidebar, zustand]
status: ready
parent: null
last_updated: 2026-06-02T16:35:52.000Z
last_updated_by: Pi (rpiv-pi)
---

# Research: Global Branch Selector with Finance Separation

## Summary

A TOLOM client with two branches needs finance data isolated per-branch while keeping other operational stats (dashboard, reports) aggregated. This requires a global branch selector in the sidebar header, a per-org toggle for "finance separate per branch," and finance pages that respect the selected branch when the toggle is on. The research covers API integration points, existing branch filtering, sidebar architecture, Zustand patterns, and branch CRUD infrastructure.

## Source

This research was conducted via discover session (developer interview + codebase probes) on 2026-06-02. The developer interviewed is the product owner/tool builder for TOLOM, acting on behalf of a client.

## Code References

### Primary Integration Points

| File | Role |
|------|------|
| `src/lib/services/report-service.ts` | Contains `withBranchFilter<T>()` — the **only** branch-filter utility; conditionally applies `.eq("branch_id", branchId)` to Supabase queries. Used ~25 times for work_orders, customers, vehicles, expenses. |
| `src/app/[locale]/dashboard/reports/route.ts` | Reports API — parses `?branch=` param, passes to report-service. |
| `src/app/[locale]/dashboard/route.ts` | Dashboard API — same `?branch=` pattern. |
| `src/app/[locale]/dashboard/reports/page.tsx` | Reports UI — has local `selectedBranchId` state, `<BranchSelect>` component. |
| `src/app/[locale]/dashboard/page.tsx` | Dashboard UI — has local `selectedBranchId` state, `<BranchSelect>` component. |
| `src/components/branch-select.tsx` | Reusable `<BranchSelect>` component (Select with "all" + branch list). |
| `src/lib/services/finance-service.ts` | Finance service — **no branch filtering at all**. |
| `src/app/[locale]/dashboard/finance/route.ts` | Finance API — no `?branch=` param. |
| `src/app/[locale]/dashboard/finance/page.tsx` | Finance page — no branch filter UI. |
| `src/app/[locale]/dashboard/layout.tsx` | Dashboard layout — renders `<AppSidebar>`, `<DashboardHeader>`, children. |
| `src/components/app-sidebar.tsx` | Sidebar component — navigation links, no branch selector currently. |

### Secondary Integration Points

| File | Role |
|------|------|
| `src/lib/stores/ui-store.ts` | Existing Zustand store (sidebar collapse, filters) — template for global branch store. |
| `src/lib/stores/work-order-store.ts` | Zustand store with immer + devtools + persist — pattern template. |
| `src/lib/queries/use-dashboard.ts` | React Query hook — accepts `orgId` and `branchId` params. |
| `src/lib/queries/use-reports.ts` | React Query hooks — same pattern. |
| `src/lib/types/index.ts` | Type definitions — `Branch` type exists. |
| `src/app/api/organizations/[id]/branches/route.ts` | Branch CRUD API — GET, POST with `branch_id` check. |
| `src/app/api/organizations/[id]/branches/[branchId]/route.ts` | Branch detail API — GET, PATCH, DELETE. |
| `src/components/page-header.tsx` | DashboardHeader component — renders org name, branch selector area candidate. |
| `src/lib/services/branch-service.ts` | Branch service — CRUD operations for branches. |
| `src/lib/queries/factory.ts` | Query key factory for React Query. |
| `src/lib/queries/keys.ts` | Query key constants. |

## Current State Analysis

### What exists now

1. **Branch filtering is partial**: Only the reports API (`dashboard/route.ts` and `reports/route.ts`) parse a `?branch=` query parameter. The `report-service.ts` has `withBranchFilter<T>()` that applies `.eq("branch_id", branchId)` to Supabase queries. Used ~25 times for work_orders, customers, vehicles, expenses.

2. **Finance has NO branch filter**: `finance-service.ts` and finance API route have no branch awareness. All finance data aggregates across the whole org.

3. **Branch select is per-page**: Both `dashboard/page.tsx` and `reports/page.tsx` have local `selectedBranchId` state that starts as `"all"`. The `<BranchSelect>` component lives on each page individually.

4. **Branch CRUD API exists but no UI**: The API routes at `/api/organizations/[id]/branches/` support GET, POST, PATCH, DELETE. No UI for managing branches exists.

5. **Branch auto-select bug (fixed)**: Previously, when an org had exactly 1 branch, both pages auto-selected the branch UUID. Since work orders have `branch_id: null`, this filtered out all data. Fixed by initializing to `"all"`.

6. **Org settings**: `organization.settings` is a JSONB column — can store feature toggles like `finance_separate_per_branch`.

### What's missing

1. **Global branch state** — no shared state that all pages can read
2. **Sidebar branch selector** — no UI element in the sidebar/header
3. **"Add Branch" UI** — no in-app way to create branches
4. **Finance branch filter** — finance API/service/page don't filter by branch
5. **Org setting toggle** — no way to enable/disable finance separation
6. **Branch checking on org selection** — need branches query alongside org membership

### Key findings

- `withBranchFilter<T>` in `report-service.ts:33-34` is the only branch-filter utility — it handles the `"all"` case (skips filter) vs. specific branch (applies `.eq`)
- `organization.settings` is JSONB — can hold `finance_separate_per_branch: boolean`
- Finance API currently queries `expenses` and `revenue` tables without branch_id awareness
- Sidebar layout: `<AppSidebar>` renders navigation links. Adding branch selector requires modifying `<AppSidebar>` or adding to `<DashboardHeader>`
- Zustand store for branch state follows the existing pattern in `src/lib/stores/`
- All pages that should NOT filter by branch (Work Orders, Customers, Inventory, Members, etc.) must be explicitly documented as "no-op" — they don't read branch state at all

### Pages that should NOT filter by branch

Per developer decision, these pages remain unfiltered (aggregate across all branches):
- Work Orders (list + detail)
- Customers
- Vehicles
- Service Reminders
- Inventory
- Members
- Organization/Settings
- Vehicle Models
- Admin
- Expenses (only if finance separation enabled — expenses go through finance service)
- Payroll

Pages that DO filter by branch:
- Dashboard (already filters via `?branch=`)
- Reports (already filters via `?branch=`)
- Finance (needs implementation — new)
- End of Day (part of reports, already covered)

## Integration Points

### API Surface

- `GET /api/organizations/[id]/branches` — returns branch list (exists)
- `POST /api/organizations/[id]/branches` — create branch (exists)
- `PATCH /api/organizations/[id]/branches/[branchId]` — update branch (exists)
- `DELETE /api/organizations/[id]/branches/[branchId]` — delete branch (exists)
- `GET /dashboard?branch={id}` — dashboard data filtered (exists)
- `GET /dashboard/reports?branch={id}` — reports data filtered (exists)
- `GET /dashboard/finance?branch={id}` — needs implementation

### Zustand Store Pattern

Existing stores (`ui-store.ts`) use:
```ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
```

Pattern: separate State/Actions interfaces, selector hooks for granular re-renders.

### Sidebar Architecture

`src/app/[locale]/dashboard/layout.tsx` renders:
- `<AppSidebar />` — left rail, nav links
- `<DashboardHeader />` — top bar
- `<GlobalDialogs />` — modals
- `<RightSidebar />` — only on bay-view routes

Branch selector should go in `<AppSidebar>` header area (between the logo/org name and the nav links).

## Architecture Insights

### Layer Pattern

The existing branch filter pattern flows:
1. Page has `selectedBranchId` state
2. Passes to React Query hook (e.g., `useDashboard(orgId, branchId)`)
3. Hook calls API route with `?branch=${branchId}`
4. API route passes to service
5. Service uses `withBranchFilter<T>()` to conditionally filter

For global branch selector, step 1 changes:
- Zustand store replaces local state
- UseStore selector hook provides branch to all pages
- Pages that should filter read from store

### Org Settings Toggle

`organization.settings` is JSONB. Current structure:
```json
{
  "language": "mn",
  "timezone": "Asia/Ulaanbaatar",
  "date_format": "YYYY-MM-DD",
  "vehicle_niche": { ... }
}
```

Add: `"finance_separate_per_branch": boolean`

### Branch Query

The sidebar header `<BranchSelect>` needs to query branches. This should use the same React Query hook pattern as the page-level selects. Consider prefetching at layout level to avoid loading states.

## Precedents & Lessons

1. **Branch auto-select bug** (this session): Auto-selecting a single branch UUID filters out all data when branch_id is null. Always default to `"all"`. When adding new branch-filter pages, never auto-select.

2. **Zustand + React Query separation**: Server state (branches list) stays in React Query. Client state (selected branch) goes in Zustand. Don't mix them.

3. **WithBranchFilter pattern**: The utility already handles `"all"` by skipping the filter. Finance service should use the same pattern.

4. **All pages that don't filter by branch**: Must still export/wire the hook that reads the Zustand store. The hook exists for consumer awareness but returns `"all"` or `null` as no-op. This ensures when we add branch filtering to a page later, the plumbing is already there.

5. **Finance API route structure**: Currently at `src/app/[locale]/dashboard/finance/route.ts`. Finance has sub-routes for expenses, revenue, invoices. All need `?branch=` support, OR a single `finance?branch=` endpoint that aggregates filtered data internally.

## Developer Context

### Decisions from discover session (2026-06-02)

1. **Core problem**: Client has two branches, wants finance separate per-branch but aggregated stats elsewhere
2. **Pain point target**: Org owner (client) — needs to see all-branch stats but keep finances isolated
3. **Finance isolation**: Finance respects selected branch when toggle is on. "Finance separate per branch" means the finance page shows data only for the selected branch. Dashboard/reports remain aggregated across all branches.
4. **Scope**: Focus on the branch selector + finance separation. No other multi-tenancy changes.

### Questions Asked & Answers

**Q1: Where should global branch selector live?**
Options: Sidebar header (always visible), Dashboard header (top bar), Per-page (current)
Decision: **Sidebar header** — always visible, navigation-independent, consistent with sidebar-first design

**Q2: When finance separate per branch is enabled, how should finance behave?**
Options: Finance respects selected branch, Finance always shows all, Finance has separate branch picker
Decision: **Finance respects selected branch** — consistent with other pages, no confusion

**Q3: Should branch selector include "Add Branch" option?**
Options: In-dropdown, via org settings page only
Decision: **In-dropdown "Add Branch"** — quick access, matches user expectation

**Q4: Which pages react to branch selector?**
Options: All pages, Dashboard+Reports only, Dashboard+Reports+Finance
Decision: **Dashboard + Reports + Finance** — other pages (Work Orders, Customers, Vehicles, etc.) remain unfiltered

**Q5: How to manage global branch state?**
Options: Zustand store, React Context, URL query param, nuqs
Decision: **Zustand store** — follows existing pattern in `src/lib/stores/`

## Open Questions

All architectural questions resolved during discover session. Implementation details to be addressed in design:
- How to wire finance API to accept `?branch=` param
- Exact sidebar header layout for branch selector
- Branch creation form/sheet pattern (create inline or open sheet)
- Org settings UI for the finance toggle

## Verification Notes

- [ ] Branch auto-select bug must not recur: all new branch-filter pages must default to `"all"`
- [ ] Finance API with branch filter must not break when branch_id is null (same `withBranchFilter` pattern)
- [ ] Zustand store must follow the existing selector-hook pattern for granular re-renders
- [ ] Sidebar must not re-render on every branch change — use Zustand selectors
- [ ] Add branch should create a new UUID branch and appear in the selector immediately
- [ ] Org settings toggle should be visible only to org owners/admins
- [ ] All existing dashboard/reports behavior must be unchanged when finance toggle is off
- [ ] Branch CRUD API already uses proper RLS — verify new UI doesn't bypass it
- [ ] The finance page API should use the same `report-service.ts` `withBranchFilter` pattern, not duplicate it

## References

- [Discover Session] This session's developer interviews and codebase probes
- `src/lib/stores/ui-store.ts` — Zustand store pattern template
- `src/lib/services/report-service.ts` — `withBranchFilter` utility
- `src/components/branch-select.tsx` — BranchSelect component
- `src/lib/services/finance-service.ts` — Finance service (no branch filter currently)
- `src/app/[locale]/dashboard/layout.tsx` — Dashboard layout (sidebar mount point)
