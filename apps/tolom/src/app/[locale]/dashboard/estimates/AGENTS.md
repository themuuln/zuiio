# Estimates

**Purpose:** Create, view, and manage estimates (quotes) that can be converted into work orders when approved.

## File Structure

```
estimates/
├── page.tsx          # List page — DataTable with status filter, search, realtime
├── _columns.tsx      # DataTable column definitions (factory pattern)
├── [id]/
│   └── page.tsx      # Detail page — status actions, items table, convert to WO
└── new/
    └── page.tsx      # Create page — customer/vehicle select, line item editor
```

## Key Components

### List Page (`page.tsx`)
- DataTable with sortable columns (estimate number, customer, vehicle, status, items, date, total, actions)
- URL-synced filters via `useTableFilters("estimates")` — search, status
- FilterChips for status selection with counts
- Realtime subscription via `useRealtimeMulti` on `estimates` + `estimate_items` tables
- Empty state with create button
- Branch-aware: filters by `useSelectedBranchId()`
- Delete confirmation dialog

### Column Definitions (`_columns.tsx`)
- Factory function `createColumns(callbacks)` returning `ColumnDef<EstimateListItem>[]`
- Callbacks: `onStatusChange`, `onCancel`, `updatePending`
- Status column renders dropdown with inline status switching (except for "converted")

### Detail Page (`[id]/page.tsx`)
- Uses shared hooks: `useEstimateDetail`, `useUpdateEstimateStatus`, `useConvertEstimate`
- Status action buttons depending on current status:
  - `draft` → "Mark Sent" + "Approve"
  - `sent` → "Approve" + "Decline"
  - `approved` → "Convert to Work Order" + "Decline"
- Convert-to-WO dialog shows customer, vehicle, item count, total before confirming
- Customer & Vehicle info cards (side by side)
- Line items grid: #, description, type badge, qty, unit price, discount, line total
- Totals card: subtotal, discount, tax, grand total
- Notes & Terms cards (if present)
- Linked work order card (when already converted)

### New Estimate (`new/page.tsx`)
- Customer + vehicle selection (side by side)
- Line items editor with 3 item types:
  - **Service** — searched from service catalog via `GET /api/organizations/[id]/services?q=`
  - **Part** — searched from inventory catalog via `GET /api/organizations/[id]/inventory?q=`
  - **Custom** — free-text description with manual pricing
- Each line: description, qty, unit price, discount %, discount amount, line total
- Service/part add via Sheet (slide-over panel) with SearchInput
- Auto-calculated line totals: `qty * unitPrice - flatDiscount - (qty * unitPrice * pctDiscount / 100)`
- Notes and Terms & Conditions textareas
- Save as Draft or Create buttons
- Validation: customer + vehicle + at least 1 line item required

## Estimate Statuses

`draft` → `sent` → `approved` → `converted` (to work order)
Also: `declined` (from sent/approved), `expired`

## Data Flow

### API Endpoints
| Endpoint | Methods | Permission | Purpose |
|----------|---------|------------|---------|
| `/api/organizations/[id]/estimates` | GET, POST | `work_orders:read`, `work_orders:create` | List/create estimates |
| `/api/organizations/[id]/estimates/[estimateId]` | GET, PATCH, DELETE | `work_orders:read/update/delete` | Detail/update/delete |
| `/api/organizations/[id]/estimates/[estimateId]/convert` | POST | `work_orders:create` | Convert to work order |

### React Query Hooks (`src/lib/queries/use-estimates.ts`)
- `useEstimates(orgId, status?, search?, branchId?)` — list with filters
- `useEstimateDetail(orgId, estimateId)` — single with all relations
- `useUpdateEstimateStatus(orgId)` — status mutation with optimistic update
- `useConvertEstimate(orgId)` — convert to WO mutation
- Cache keys: `estimateKeys.list(orgId, status, search, branchId)`, `estimateKeys.detail(orgId, id)`

### Types (`src/lib/types/`)
- `Estimate` — DB row alias
- `EstimateItem` — DB row alias
- `EstimateDetail` — composite: adds `customer`, `vehicle`, `items[]`, `converted_work_order`, `appointment`
- `EstimateListItem` (in `use-estimates.ts`) — lightweight for list views

### Service (`src/lib/services/estimate-service.ts`)
- All functions accept `db: SupabaseClient` as first parameter (follows newer service convention)
- `getEstimates(db, orgId, params?)` — list with filters, search, pagination
- `getEstimate(db, id, orgId)` — single with relations
- `createEstimate(db, orgId, params)` — create + items + recalculate totals
- `updateEstimate(db, id, orgId, params)` — update header + optionally replace items
- `updateEstimateStatus(db, id, orgId, status)` — status-only update
- `deleteEstimate(db, id, orgId)` — soft delete
- `convertEstimateToWorkOrder(db, estimateId, orgId)` — full conversion lifecycle

## State Management

- **List filters:** URL-synced via `useTableFilters("estimates")` (search, status, page, sort)
- **Branch filter:** `useSelectedBranchId()` from UI store
- **Realtime:** `useRealtimeMulti` on `estimates` + `estimate_items` tables
- **Mutations invalidate:** `estimateKeys.all(orgId)` and `estimateKeys.detail(orgId, id)`

## Conventions

- Estimate statuses use colored dot badges with semantic colors (gray=draft, blue=sent, green=approved, red=declined, yellow=expired, purple=converted)
- Line items displayed in a 12-column grid layout
- All monetary values use MNT (₮) with `formatMNT()`
- The "Convert to Work Order" action only appears when status is `approved`
- After conversion, navigation to `/dashboard/work-orders/[id]`
- Reuses `work_orders` permissions (not separate `estimates:*` permissions)
- Gated to Pro plan and above

## Dependencies

- **Shared components:** `Badge`, `Button`, `Card`, `DataTable`, `Dialog`, `Empty`, `FilterChips`, `ListPageShell`, `ListToolbar`, `Sheet`, `Typography`
- **Cross-module:** Converts to work orders (navigates to `/dashboard/work-orders/[id]`)
- **Customer/Vehicle selection:** `CustomerSelect` and `VehicleSelect` from `@/components/work-orders/`
- **Hooks:** `useTableFilters`, `useRealtimeMulti`, `useCurrentOrg`, `useSelectedBranchId`

## Tests

- Service tests: `src/lib/services/estimate-service.test.ts`
- Coverage: CRUD operations, validation, status transitions, totals calculation
