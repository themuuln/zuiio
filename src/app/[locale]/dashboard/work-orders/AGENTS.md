# Work Orders

**Purpose:** List, create, and manage mechanic work orders — the core operational module of TOLOM.

## File Structure

```
work-orders/
├── page.tsx              # List page — status-filtered table with realtime updates
├── _columns.tsx          # Table column definitions (13 columns)
├── error.tsx             # Route error boundary
├── loading.tsx           # Skeleton loading state
├── [id]/
│   ├── page.tsx          # Detail page — status, services, parts, invoices, photos (~1700 lines)
│   ├── error.tsx
│   └── loading.tsx
└── new/
    ├── page.tsx          # Create page — wizard-based (7 section components)
    ├── error.tsx
    └── loading.tsx
```

## Key Components

### List Page (`page.tsx`)
- `ListPageShell` / `ListToolbar` — standard list layout with search, filter chips, export
- `DataTable` with column visibility toggle, mobile card rendering, 20-item pages
- Status badge summary bar (clickable to filter)
- `AlertDialog` for cancel confirmation
- `ExportButton` for XLSX export

### Detail Page (`[id]/page.tsx`)
- Status change buttons with confirmation dialog (required for Completed/Cancelled)
- `MechanicSelect` — assign mechanic with job count
- Services list with inline search from `useServiceCatalog` and price history
- Parts list with catalog search from `usePartsCatalog` and price history
- "Repeat from last visit" dialog — copies services/parts from previous WO
- Photo upload gallery (`WorkOrderPhotoUpload`)
- Invoice generation card (shown when status = Completed or Ready for Pickup)
- Payment recording dialog with method, reference, notes
- Totals card (services, parts, discounts, grand total)
- Profit/cost summary card (revenue, cost, gross profit, margin %, loss reason)
- Right sidebar tabs: vehicle info, customer info, status timeline

### New Work Order (`new/page.tsx`)
- Wraps all sections in `WizardProvider` (from `@/components/work-orders/wizard`)
- Sequential sections: Customer → Vehicle → Complaint → Services → Parts → Mechanic → Summary
- Draft persistence via localStorage (currently hidden/disabled)
- `beforeunload` warning on unsaved data

## Work Order Statuses

`New` → `Diagnosing` → `In Progress` → `Ready for Pickup` → `Completed`
(also: `Cancelled` from any status)

Status transitions for Completed/Cancelled require confirmation notes. If gross profit is negative, a loss reason is required.

## Table Columns (`_columns.tsx`)

`id` (truncated), `customer` (name + plate), `vehicle`, `mechanic`, `status` (dropdown), `age` (days), `grand_total`, `services_cost`, `parts_cost`, `gross_profit` (color-coded), `margin_percent`, `loss_reason` (truncated), `actions` (menu)

All monetary columns use MNT (₮) formatting via `formatMNT`.

## Data Flow

### API Endpoints
| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/organizations/[id]/work-orders` | GET, POST | List/create work orders |
| `/api/organizations/[id]/work-orders/[woId]` | GET, PATCH, DELETE | Detail/update/cancel |
| `/api/organizations/[id]/work-orders/[woId]/services` | POST, DELETE | Add/remove service line |
| `/api/organizations/[id]/work-orders/[woId]/parts` | POST, DELETE | Add/remove part line |
| `/api/organizations/[id]/work-orders/[woId]/attachments` | POST, DELETE | Photo/document upload |
| `/api/organizations/[id]/work-orders/[woId]/pdf` | GET | PDF generation |

### React Query Hooks
- `useWorkOrders(orgId, status, search, branchFilter)` — list
- `useWorkOrderDetail(orgId, woId)` — detail with services, parts, status_history
- `useUpdateWorkOrderStatus(orgId)` — status mutation
- `useAssignMechanic(orgId)` — mechanic assignment
- `useAddService(orgId)` / `useRemoveService(orgId)` — service line CRUD
- `useAddPart(orgId)` / `useRemovePart(orgId)` — part line CRUD
- `useCreateInvoice(orgId)` — generate invoice from WO
- `useRecordPayment(orgId)` — record payment against invoice
- `useAttachments(orgId, woId)` / `useDeleteAttachment(orgId, woId)` — photo management
- `useServiceCatalog(orgId)` — service catalog for search
- `usePartsCatalog(orgId)` — parts catalog for search
- `useMechanicsList(orgId)` — mechanics dropdown
- `useLastVisitData(orgId, vehicleId)` — previous visit data for repeat
- `usePriceHistory(orgId)` — global price memory
- `fetchServicePriceHistory(...)` / `fetchPartPriceHistory(...)` — async price lookups

### Realtime
`useRealtimeMulti` listens to: `work_orders`, `work_order_services`, `work_order_parts`, `mechanic_assignments` — invalidates `workOrderKeys.all()` on changes.

## State Management

- **URL filters:** `useTableFilters("work-orders")` for search and status filter
- **Branch filter:** `useSelectedBranchId()` from UI store
- **Page header:** `usePageHeader()` for `setNewWorkOrderSheetOpen`
- **Right sidebar:** `useRightSidebar()` for tab registration (vehicle, customer, timeline)
- **Optimistic updates:** Detail page uses `queryClient.setQueryData` for service/part add/remove with rollback on error
- **Wizard state:** Entirely managed in `WizardProvider` context — customer, vehicle, services, parts, complaint, mechanic, totals

## Conventions

- All monetary values display in MNT (₮) with `formatMNT()` or `formatCurrency()`
- Currency is always formatted with `toLocaleString()` and `tabular-nums`
- Status changes on the detail page show an inline confirmation card (not a dialog)
- Negative gross profit triggers a required loss reason textarea
- Mobile card view in the list page shows a dot-based progress indicator for status
- Columns factory pattern: `createColumns(callbacks)` accepts `onStatusChange`, `onCancel`, `updatePending`
- Export uses `ExportButton` with `ExportColumn<T>[]` definitions
- The list page uses `hasLoadedOnce` state to preserve layout on refetch (layout-preserving loading pattern)

## Dependencies

- **Shared components:** `ListPageShell`, `ListToolbar`, `FilterChips`, `DataTable`, `ExportButton`, `StatusBadge`, `MechanicSelect`, `ContactCard`, `RecentList`, `WorkOrderPhotoUpload`
- **Wizard components:** `@/components/work-orders/wizard/*` (7 section components + context)
- **Cross-module:** Invoices navigate to `/invoice/[publicToken]`, estimates can convert to work orders
- **Stores:** `useSelectedBranchId` from UI store, `usePageHeader` for header button state
