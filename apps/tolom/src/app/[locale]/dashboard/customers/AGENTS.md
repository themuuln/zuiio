# Customers

**Purpose:** Manage the customer directory — list, search, view details, create, edit, import from CSV, and view shared (cross-org) customers.

## File Structure

```
customers/
├── page.tsx                  # List page — My/Shared toggle, inactive filter, DataTable
├── _columns.tsx              # Table column definitions (two sets: my + shared)
├── error.tsx                 # Route error boundary
├── loading.tsx               # Skeleton loading state
├── [id]/
│   └── _customer-edit-form.tsx  # Reusable edit form (individual/company types)
├── new/
│   ├── page.tsx              # Redirect → opens dialog via ?new=1 query param
│   ├── error.tsx
│   └── loading.tsx
└── import/
    ├── page.tsx              # CSV import flow — upload, preview, import, results
    ├── error.tsx
    └── loading.tsx
```

**Note:** Customer detail is handled via a **dialog/sheet** triggered by `usePageHeader().setDetailCustomerId()`, not a dedicated `[id]/page.tsx` route.

## Key Components

### List Page (`page.tsx`)

- `ToggleGroup` switch: "My Customers" vs "Shared" (cross-org) view
- `ListPageShell` / `ListToolbar` with search, inactive filter chip, export
- `DataTable` (20 rows) with mobile card rendering
- Inactive filter: "Not visited in 3+ months" toggle with count badge
- `ExportButton` for XLSX (My view only)
- Right sidebar tabs: stats overview (total, new this month) + recent customers

### Columns (`_columns.tsx`)

- **My columns:** name (with icon), contact (phone/email), vehicles (badge), visits, last visit (relative), chevron
- **Shared columns:** same as my, plus `organization_name` badge with Globe icon
- `CustomerRow` extends `Customer` with `vehicle_count` and `organization_name`
- Smart name resolution: first+last name → company name → contact person → full name → phone → "No name"
- Relative date formatting: today, yesterday, X days ago, X weeks ago, then absolute date

### Customer Edit Form (`[id]/_customer-edit-form.tsx`)

- Toggle between `individual` and `company` type
- **Individual:** firstName, lastName, phone (Mongolian formatted), email, address, notes
- **Company:** companyName, contactPerson, phone, email, address, notes
- Uses `formatMongolianPhone()` for phone input formatting
- Reused by both create dialog and detail edit dialog

### New Customer (`new/page.tsx`)

- Simple redirect: `useEffect(() => replace("/dashboard/customers?new=1"))` — triggers the new customer dialog in the page header

### Import Page (`import/page.tsx`)

- CSV upload with drag-and-drop zone
- Template download button (pre-filled sample CSV)
- Preview step: shows first 5 rows in a table, total row count
- Import step: progress bar, POST to import endpoint
- Results: success count + error table with row numbers and messages
- States: idle → preview → importing → done/error
- CSV columns: firstName, lastName, phone, email, address, notes, type, source
- Custom CSV parser handling quoted fields

## Data Flow

### API Endpoints

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/organizations/[id]/customers` | GET, POST | List/create customers |
| `/api/organizations/[id]/customers/[customerId]` | GET, PATCH | Detail/update customer |
| `/api/organizations/[id]/customers/shared/[customerId]` | GET | Shared customer detail |
| `/api/organizations/[id]/customers/import` | POST | CSV bulk import |
| `/api/organizations/[id]/customers/by-plate` | GET | Lookup by plate number |
| `/api/organizations/[id]/customers/top` | GET | Top customers |
| `/api/organizations/[id]/customers/[customerId]/notes` | GET, POST | Customer notes |
| `/api/organizations/[id]/customers/[customerId]/communications` | GET, POST | Communication log |

### React Query Hooks

- `useCustomers(orgId, search, branchFilter)` — list with search and branch filtering
- `useSharedCustomers(orgId, search)` — cross-org customer list
- `useCreateCustomer(orgId)` — create mutation
- `useCustomerDuplicateCheck(orgId, phone?, email?)` — duplicate detection

### Types

- `CustomerWithVehicleCount` — extends `Customer` with `vehicle_count`, `total_visits`, `last_visit_at`, `organization_name`
- `CustomerRow` — defined in `_columns.tsx`, adds `vehicle_count` and `organization_name` to `Customer`

## State Management

- **URL filters:** `useTableFilters("customers")` for search and view (my/shared), view defaults to `"my"`
- **Branch filter:** `useSelectedBranchId()` from UI store
- **Inactive filter:** Local `useState(false)` — client-side filtering on `last_visit_at`
- **Page header:** `usePageHeader()` provides `setNewCustomerDialogOpen()` and `setDetailCustomerId()`
- **No Zustand store** — customer list state is managed by React Query

## Conventions

- Customer types: `individual` or `company` — displayed with User or Building2 icon
- The `[id]` directory contains only `_customer-edit-form.tsx` — there is no `page.tsx` (detail is a dialog)
- Import page uses a multi-state machine pattern: `idle → preview → importing → done | error`
- Shared customers show the source organization name as a badge
- Relative dates are computed client-side (no server-side formatting)
- `formatMongolianPhone()` normalizes phone input for Mongolia's phone format
- The list uses `ListPageShell` for consistent layout with other list pages
- Export columns defined inline in page component (not in `_columns.tsx`)

## Dependencies

- **Shared components:** `ListPageShell`, `ListToolbar`, `FilterChips`, `DataTable`, `ExportButton`, `ToggleGroup`, `Breadcrumb`
- **Customer form:** `CustomerEditForm` from `./_customer-edit-form` — shared between create/edit dialogs
- **Phone formatting:** `formatMongolianPhone` from `@/lib/form-ux`
- **Cross-module:** Customer data feeds into work orders (via customer selection) and estimates
- **Header integration:** New customer and detail dialogs are controlled via `usePageHeader()` — not local state
