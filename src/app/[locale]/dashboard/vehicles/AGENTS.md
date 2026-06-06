# Vehicles

**Purpose:** CRUD management for customer vehicles — registration, search, and detail editing.

## File Structure

```
vehicles/
├── page.tsx              # Vehicle list page with DataTable
├── _columns.tsx          # Table column definitions (plate, VIN, owner, actions)
├── loading.tsx           # Loading skeleton
├── error.tsx             # Error boundary
└── new/
    ├── page.tsx          # Full-page vehicle registration form
    ├── loading.tsx       # Loading skeleton
    └── error.tsx         # Error boundary
```

## Key Components

- **VehiclesPage** — Main list view using `ListPageShell` + `DataTable`. Search by plate or VIN. Sidebar tabs show stats (total, makes) and recent vehicles.
- **createColumns** (`_columns.tsx`) — Factory function returning `ColumnDef<VehicleRow>[]`. Accepts `onEdit`/`onDelete` callbacks. Columns: plate (with icon + year/make/model subtitle), VIN (monospace), owner name, action buttons.
- **NewVehicleForm** — Two-section form: **Owner** (customer search/select with autocomplete) and **Vehicle Information** (18 fields). Supports preselecting a customer via `?customerId=` URL param.

## Form Fields (New Vehicle)

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| plateNumber | Yes | PlateInput | Mongolian plate format (4 digits + 3 letters), validated via `isValidMongolianPlate` |
| vin | No | Input | Monospace font |
| make | Yes | Input | e.g. Toyota |
| model | Yes | Input | e.g. Prius |
| year | No | number | |
| odometer | No | number | |
| trim | No | Input | |
| color | No | ColorSelect | Custom color picker component |
| engine | No | Input | |
| chassisNumber | No | Input | |
| fuelType | No | Select | Gasoline, Diesel, Electric, Hybrid, LPG |
| transmission | No | Select | Automatic, Manual, CVT, DCT |
| drivetrain | No | Select | AWD, 4WD, FWD, RWD |
| bodyType | No | Select | SUV, Sedan, Hatchback, Coupe, Convertible, Wagon, Van, Truck, Bus |
| licenseExpiryAt | No | date | |
| nextServiceAt | No | date | |
| notes | No | textarea | Full-width |

## Data Flow

- **List:** `useVehicles(orgId, search, branchFilter)` → `GET /api/organizations/{orgId}/vehicles`
- **Create:** `POST /api/organizations/{orgId}/vehicles` with JSON body (plate, vin, make, model, customerId, etc.)
- **Delete:** `useDeleteVehicle(orgId)` → optimistic removal from cache
- **Customer search:** `GET /api/organizations/{orgId}/customers?q=...`
- **Branch filtering:** Respects `useSelectedBranchId()` from UI store

## State Management

- Local form state via `useState` (no Zustand store)
- URL filter via `useTableFilters("vehicles")`
- React Query for server state with branch-aware query keys
- Edit opens detail sheet via `usePageHeader().setDetailVehicleId()`

## Conventions

- Client component (`"use client"`)
- i18n via `next-intl` (`useTranslations("vehicles")`)
- Layout-preserving loading pattern (`hasLoadedOnce` ref)
- Mobile card rendering via `renderMobileCard` prop on `DataTable`
- Export support via `ExportButton` with XLSX columns

## Dependencies

- `@/components/list-page-shell` — Page layout with header
- `@/components/list-toolbar` — Search + actions bar
- `@/components/vehicles/color-select` — Color picker
- `@/components/ui/plate-input` — Mongolian plate number input
- `@/lib/queries/use-vehicles` — Vehicle CRUD hooks
- `@/lib/queries/use-organization` — Current org context
- `@/lib/form-validation` — `isValidMongolianPlate`
- `@/hooks/use-page-header` — Detail sheet + new dialog openers
