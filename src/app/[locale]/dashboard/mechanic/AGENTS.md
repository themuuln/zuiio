# Mechanic Dashboard

**Purpose:** Individual mechanic's daily workspace — work orders, clock in/out, KPIs, and admin mechanic-switching.

## File Structure
```
mechanic/
├── page.tsx        # Full page: role gating, mechanic selector (admin), dashboard shell
├── error.tsx       # Sentry error boundary
└── loading.tsx     # Spinner skeleton
```

## Key Components

- **`MechanicPage`** — Entry point. Detects role via `useCurrentUserRole()`. Admins see a `MechanicSelect` dropdown to switch between mechanics; mechanics see their own dashboard directly.
- **`MechanicDashboard`** — Core layout. Renders KPI grid, trend chart, work order list, and clock button. Accepts `userId`, `orgId`, `mechanicName`, `isAdminView`.
- **`KpiCard`** — Accent-colored stat card (blue/green/amber) with icon, label, value, subtext. Used for completed count, revenue, active jobs, hours, avg job value, jobs/day.
- **`WorkOrderRow`** — Single work order row with status bar, customer/plate info, amount, and status dropdown. Clicking navigates to `/dashboard/work-orders/[id]`.
- **`ClockInOutButton`** — Toggle clock-in/out with live elapsed timer (`useClientNow()`).
- **`PickupCompleteDialog`** — Imported from `bay-view-v2`. Shown when status changes to "Completed" — captures satisfaction rating, feedback, and next appointment before finalizing.
- **`MechanicTrendChart`** — Dynamic import from `../_charts`. Weekly revenue/job trend sparkline.

## Data Flow

| Hook | Source | Purpose |
|------|--------|---------|
| `useMechanicEod(orgId, userId)` | `use-mechanic-dashboard` | End-of-day stats (completed, revenue, counts) |
| `useMechanicWorkOrders(orgId, userId)` | `use-mechanic-dashboard` | Assigned work orders list |
| `useMechanicTrend(orgId, userId)` | `use-mechanic-dashboard` | 7-day trend + avg job value, jobs/day |
| `useClockStatus(orgId)` | `use-mechanic-dashboard` | Current clock-in state, today's hours |
| `useClockToggle(orgId)` | `use-mechanic-dashboard` | Mutate: clock-in / clock-out |
| `useMechanicsList(orgId)` | `use-mechanic-dashboard` | Admin: list of all mechanics in org |
| `useUpdateWorkOrderStatus(orgId)` | `use-work-order-detail` | Status transitions |
| `saveCompletionData(...)` | `post-service-service` | Captures pickup completion data |

**Status transitions:** New -> Diagnosing -> In Progress -> Ready for Pickup -> Completed (any status can also go to Cancelled).

**Sidebar tabs:** Registers "stats" (StatusSummary) and "jobs" (RecentList) into the right sidebar via `useRightSidebar()`.

## Conventions

- All inline — no extracted `_`-prefixed files in this directory. Components are defined locally in `page.tsx`.
- Optimistic updates on status change; refetch on error.
- Admin view shows quick-action bar (invite, members, payroll, roles, organization links).
- Date displayed in `mn-MN` locale. Currency via `formatMNT()`.

## Dependencies

- `@/components/bay-view-v2/pickup-complete-dialog` — PickupCompleteDialog
- `@/components/mechanic-select` — Admin mechanic dropdown
- `@/components/new-mechanic-sheet` — Invite mechanic sheet
- `@/components/sidebar-tabs/*` — StatusSummary, RecentList
- `../_charts` — MechanicTrendChart (shared across dashboard modules)
