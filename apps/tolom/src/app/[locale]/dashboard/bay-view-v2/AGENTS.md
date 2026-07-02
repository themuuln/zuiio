# Bay View V2

**Purpose:** Workshop bay view (alternate route) — same v2 client component as bay-view, with simpler absolute-positioned wrapper.

## File Structure
```
bay-view-v2/
└── page.tsx    # Thin wrapper — dynamically imports BayViewV2Client
```

## Key Components

- **`BayViewV2Page`** — Renders `BayViewV2Client` via `next/dynamic` with `ssr: false`. Uses `absolute inset-0` wrapper for full-viewport coverage.
- **`BayViewV2Client`** — The actual implementation in `@/components/bay-view-v2/bay-view-v2-client`. Contains all bay grid/kanban/list views, drawer, dialogs, timers, and work order management.
- **`BayViewPageSkeleton`** — Loading state from `@/components/bay-view-v2/_page-skeleton`.

## Component Directory: `src/components/bay-view-v2/`

The bay-view-v2 component directory is the canonical implementation for both `/dashboard/bay-view` and `/dashboard/bay-view-v2` routes. Key files:

| File | Purpose |
|------|---------|
| `bay-view-v2-client.tsx` | Main client component — orchestrates all bay views |
| `_grid-view.tsx` | Grid layout of bays |
| `_kanban-view.tsx` | Kanban-style bay layout |
| `_list-view.tsx` | List-style bay layout |
| `_kpi-cards.tsx` | Bay KPI summary cards |
| `_toolbar.tsx` | View toggle, filters, search |
| `_work-order-detail-drawer.tsx` | Slide-out work order detail |
| `_elapsed-timer.tsx` | Live elapsed time display |
| `_elapsed-text.tsx` | Static elapsed time text |
| `pickup-complete-dialog.tsx` | Post-service pickup completion |
| `post-service-dialog.tsx` | Post-service data entry |
| `vehicle-registration-dialog.tsx` | Register new vehicle |
| `device-registration-dialog.tsx` | Register mechanic device |
| `pin-settings-dialog.tsx` | PIN config |
| `shift-report-dialog.tsx` | Shift end report |
| `queue-panel.tsx` | Work order queue sidebar |
| `mechanic-panel.tsx` | Mechanic assignment panel |
| `_service-card.tsx` | Individual service line item card |
| `_status-stepper.tsx` | Status progress indicator |
| `_types.tsx` | Shared TypeScript types |
| `_schema.ts` | Zod validation schemas |
| `_constants.tsx` | View modes, status config |
| `_helpers.ts` | Utility functions |

## Data Flow

All data fetching, mutations, and state management are handled inside `src/components/bay-view-v2/`. The page is a pure route shell.

## Differences from bay-view

| Aspect | bay-view | bay-view-v2 |
|--------|----------|-------------|
| Wrapper div | `-mx-3 -mb-5 -mt-3` responsive margins | `absolute inset-0` |
| Has error.tsx | Yes | No |
| Has loading.tsx | No | No |

Both serve the identical client component. The only difference is the outer wrapper styling.

## Conventions

- SSR disabled (`ssr: false`) — entire component is client-side.
- This is the newer route. The `bay-view` route exists for backward compatibility / alternative layout.
- All 50+ component files in `src/components/bay-view-v2/` follow the underscore-prefix convention for internal modules.

## Dependencies

- `@/components/bay-view-v2/bay-view-v2-client` — Main client
- `@/components/bay-view-v2/_page-skeleton` — Loading skeleton
