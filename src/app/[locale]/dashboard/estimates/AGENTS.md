# Estimates

**Purpose:** Create, view, and manage estimates (quotes) that can be converted into work orders when approved.

## File Structure

```
estimates/
├── page.tsx          # List page — simple card list with status filter
├── [id]/
│   └── page.tsx      # Detail page — status actions, items table, convert to WO
└── new/
    └── page.tsx      # Create page — customer/vehicle select, line item editor
```

## Key Components

### List Page (`page.tsx`)
- Status filter dropdown (all, active, draft, sent, approved, converted, declined, expired)
- Simple card list — each row shows estimate number, status badge, date, customer ID, grand total
- Click navigates to detail page
- Empty state with create button
- Branch-aware: filters by `useSelectedBranchId()`

### Detail Page (`[id]/page.tsx`)
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
| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/organizations/[id]/estimates` | GET, POST | List/create estimates |
| `/api/organizations/[id]/estimates/[estimateId]` | GET, PATCH | Detail/update status |
| `/api/organizations/[id]/estimates/[estimateId]/convert` | POST | Convert to work order |
| `/api/organizations/[id]/services?q=` | GET | Service catalog search |
| `/api/organizations/[id]/inventory?q=` | GET | Parts catalog search |

### React Query / Fetch
- List: inline `useQuery` with key `["estimates", orgId, branchFilter]`
- Detail: inline `useQuery` with key `["estimate", estimateId]`
- Status change: inline `useMutation` — PATCH with `{ status }`
- Convert: inline `useMutation` — POST, then navigate to `/dashboard/work-orders/[id]`
- No shared query hooks — estimates use direct fetch + inline queries (unlike work-orders)

### Types
- `Estimate` — list item: `id`, `estimate_number`, `status`, `customer_id`, `grand_total`, `created_at`
- `EstimateDetail` — full: adds `customer`, `vehicle`, `items[]`, `subtotal`, `discount_total`, `tax_total`, `notes`, `terms`, `converted_work_order`

## State Management

- **List filter:** Local `useState("all")` for status filter (not URL-synced)
- **Branch filter:** `useSelectedBranchId()` from UI store
- **No Zustand store** — all state is local or in React Query cache
- **Mutations invalidate:** Both `["estimate", id]` and `["estimates"]` query keys

## Conventions

- Estimate statuses use colored dot badges with semantic colors (gray=draft, blue=sent, green=approved, red=declined, yellow=expired, purple=converted)
- Line items displayed in a 12-column grid layout
- All monetary values use MNT (₮) with `toLocaleString()`
- The "Convert to Work Order" action only appears when status is `approved`
- After conversion, a linked WO card appears at the bottom with navigation
- No column definitions file — the list is a simple card layout, not a DataTable

## Dependencies

- **Shared components:** `Badge`, `Button`, `Card`, `Dialog`, `Empty`, `Select`, `Sheet`, `Textarea`, `Typography`
- **Cross-module:** Converts to work orders (navigates to `/dashboard/work-orders/[id]`)
- **Customer/Vehicle selection:** `CustomerSelect` and `VehicleSelect` from `@/components/work-orders/`
- **No shared query hooks** — unlike work-orders, estimates have their own inline data fetching
