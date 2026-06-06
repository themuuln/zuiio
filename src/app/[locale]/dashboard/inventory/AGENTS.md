# Inventory

**Purpose:** Full inventory management system — parts catalog, stock balances, movements, suppliers, purchase orders, parts-car disassembly, alerts, and valuation.

## File Structure

```
inventory/
├── page.tsx                          # Dashboard hub with KPI cards + tab navigation
├── _components/
│   ├── constants.ts                  # Tab types, movement labels/colors, PO status colors, filter helpers
│   ├── modal.tsx                     # Reusable Dialog wrapper
│   ├── sort-key-header.tsx           # Sortable column header with direction indicator
│   ├── table-skeleton.tsx            # Generic loading skeleton
│   ├── parts-tab.tsx                 # Parts list (inventory + global catalog sub-tabs)
│   ├── movements-tab.tsx             # Movements list + record form
│   ├── suppliers-tab.tsx             # Suppliers CRUD (inline modal)
│   ├── purchase-orders-tab.tsx       # PO list + create modal + expandable line items
│   └── _suppliers-columns.tsx        # Supplier table columns (used by tab)
├── parts/
│   └── [partId]/
│       ├── page.tsx                  # Part detail page (header + history + threshold + form)
│       ├── _header.tsx               # Part info header with status badge + KPI cards
│       ├── _stock-history.tsx        # Movement history timeline for a single part
│       ├── _threshold-card.tsx       # Minimum stock threshold editor with progress bar
│       ├── _details-form.tsx         # Inline edit form (wraps PartForm)
│       ├── loading.tsx
│       └── error.tsx
├── parts-cars/
│   ├── page.tsx                      # Parts-car grid list (disassembly candidates)
│   ├── new/
│   │   └── page.tsx                  # Register new disassembly car form
│   ├── loading.tsx
│   └── error.tsx
├── purchase-orders/
│   ├── page.tsx                      # PO list with status filter chips
│   ├── new/
│   │   └── page.tsx                  # Full-page PO creation with line items
│   ├── loading.tsx
│   └── error.tsx
├── suppliers/
│   ├── page.tsx                      # Supplier DataTable list
│   ├── _columns.tsx                  # Supplier column definitions
│   ├── new/
│   │   └── page.tsx                  # New supplier form
│   ├── loading.tsx
│   └── error.tsx
├── movements/
│   ├── page.tsx                      # Movements list with type filter chips + record dialog
│   ├── loading.tsx
│   └── error.tsx
├── alerts/
│   ├── page.tsx                      # Stock shortage alerts (below threshold)
│   ├── loading.tsx
│   └── error.tsx
├── valuation/
│   ├── page.tsx                      # Inventory valuation table with total value KPI
│   ├── _columns.tsx                  # Valuation column definitions
│   ├── loading.tsx
│   └── error.tsx
├── loading.tsx
└── error.tsx
```

## Main Dashboard (`page.tsx`)

Hub page with **4 KPI cards** (Total SKUs, Total Stock Value, Turnover Rate, Slow Movers) and **4 tabs**: Parts, Movements, Suppliers, Purchase Orders. Each tab renders its component inline. Branch-aware via `useSelectedBranchId()`. Sidebar shows stock summary (Total SKUs, Low Stock, Out of Stock).

## Sub-pages

| Route | Purpose | Key Features |
|-------|---------|--------------|
| `/inventory` | Dashboard hub | KPI cards, 4 tabs, branch filter, alerts link |
| `/inventory/parts/[partId]` | Part detail | Header with status badge, stock history timeline, threshold card, edit form |
| `/inventory/parts-cars` | Disassembly cars | Card grid showing cars with status, cost, parts count, profit |
| `/inventory/parts-cars/new` | Register car | Form: make, model, year, VIN, license plate, purchase cost, arrival date |
| `/inventory/purchase-orders` | PO list | Status filter chips (draft, ordered, partial, received, cancelled) |
| `/inventory/purchase-orders/new` | Create PO | Full-page form with dynamic line items (part, qty, unit cost) |
| `/inventory/suppliers` | Supplier list | DataTable with search, edit navigates to detail |
| `/inventory/suppliers/new` | New supplier | Form: name, contact, phone, email, address, tax ID, payment terms |
| `/inventory/movements` | Movement log | Type filter chips, record movement dialog with part search |
| `/inventory/alerts` | Stock alerts | Parts below threshold, sorted by shortage severity, quick "Create PO" links |
| `/inventory/valuation` | Valuation report | Avg unit cost, total value per part, category filter, total inventory value KPI |

## Tabs Components (inside `_components/`)

### PartsTab
Dual sub-tabs: **My Inventory** (org parts with stock levels, thresholds, popularity) and **Global Catalog** (reference parts that can be "forked" into local inventory). Sortable by name, category, price, stock, popularity. Threshold editing inline. Bulk default threshold setter. Export to XLSX.

### MovementsTab
Movement history with type filter chips (purchase, sale, adjustment, transfer_in, transfer_out, return, waste, disassembly). Record form with part search (live API search), quantity, unit cost, movement type, notes. Shows current balance when part selected.

### SuppliersTab
DataTable with name, contact, phone, email. Add/Edit via Modal. Form fields: name, contact_person, phone, email, address, tax_id, notes.

### PurchaseOrdersTab
Expandable card list. Each PO expands to show line items table (part, qty ordered, qty received, unit cost). Create PO modal with dynamic item rows. Receive stock button for pending POs.

## Data Flow

| Hook | API Endpoint | Purpose |
|------|-------------|---------|
| `usePartsCatalog(orgId, branch)` | `/api/organizations/{orgId}/inventory/parts` | Parts list |
| `useGlobalPartsCatalog()` | `/api/organizations/global/parts` | Reference catalog |
| `useInventoryBalances(orgId, branch)` | `/api/organizations/{orgId}/inventory/balances` | Stock levels |
| `useInventoryMovements(orgId, type, branch)` | `/api/organizations/{orgId}/inventory/movements` | Movement history |
| `useCreateMovement(orgId)` | `POST .../inventory/movements` | Record movement |
| `useStockThresholds(orgId, branch)` | `/api/organizations/{orgId}/inventory/thresholds` | Min stock levels |
| `useSuppliers(orgId)` | `/api/organizations/{orgId}/inventory/suppliers` | Supplier list |
| `useCreateSupplier(orgId)` | `POST .../inventory/suppliers` | Add supplier |
| `useUpdateSupplier(orgId)` | `PATCH .../inventory/suppliers/{id}` | Edit supplier |
| `useDeleteSupplier(orgId)` | `DELETE .../inventory/suppliers/{id}` | Remove supplier |
| `usePurchaseOrders(orgId, branch)` | `/api/organizations/{orgId}/inventory/purchase-orders` | PO list |
| `useCreatePurchaseOrder(orgId)` | `POST .../inventory/purchase-orders` | Create PO |
| `useReceivePurchaseOrder(orgId)` | `POST .../inventory/purchase-orders/{id}/receive` | Mark PO received |
| `usePartsCars(orgId)` | `/api/organizations/{orgId}/inventory/parts-cars` | Disassembly cars |
| `useCreatePartsCar(orgId)` | `POST .../inventory/parts-cars` | Register car |
| `useInventoryTurnover(orgId, branch)` | Computed | Turnover rate |
| `useSlowMovingStock(orgId, branch)` | Computed | Slow-moving parts |

## State Management

- **Tab navigation:** `tab` state on hub page; search resets on tab change
- **Branch filtering:** `useSelectedBranchId()` from UI store, applied across all queries
- **Threshold editing:** Inline `editingThreshold` state per row (parts tab) or card (detail page)
- **Movement type filter:** `movementFilter` state (hub movements tab) and `typeFilter` (standalone movements page)
- **PO status filter:** `statusFilter` on purchase orders page
- **Valuation category filter:** `categoryFilter` state
- All server state via React Query; no Zustand stores in this module

## Conventions

- All pages are `"use client"` (no RSC)
- Movement types are color-coded via `MOVEMENT_COLORS` in `constants.ts`
- PO statuses are color-coded via `PO_STATUS_COLORS` in `constants.ts`
- `formatDate()` helper outputs Mongolian locale dates (`mn-MN`)
- `Modal` component wraps `Dialog` for consistent modal behavior
- `SortKeyHeader` provides sortable table headers with direction indicators
- `TableSkeleton` used across all loading states
- Currency displayed in MNT (Mongolian Tugrik) via `formatMNT()`

## Dependencies

- `@/lib/queries/use-inventory` — All inventory hooks (balances, parts, movements, thresholds, suppliers, POs, parts-cars)
- `@/lib/queries/keys` — `inventoryKeys` query key factory
- `@/lib/queries/use-organization` — `useCurrentOrg()`
- `@/lib/stores` — `useSelectedBranchId()` for branch filtering
- `@/components/inventory/part-form` — Reusable part creation/editing form
- `@/components/list-page-shell` — Page layout wrapper
- `@/components/list-toolbar` — Search + filter + actions toolbar
- `@/components/filter-chips` — `FilterChips` + `FilterChip` for type/status filters
- `@/components/export-button` — XLSX export
- `@/components/sidebar-tabs/status-summary` — Sidebar summary cards
- `@/components/sidebar-tabs/recent-list` — Sidebar recent items
- `@/hooks/use-page-header` — Detail navigation (partId, PO ID, supplier ID, partsCar ID)
- `@/hooks/use-right-sidebar` — Sidebar tab registration
