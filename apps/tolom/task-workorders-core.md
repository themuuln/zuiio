Write Vitest component tests for Work Orders Core components (no wizard-dependency overlap with Group 3).

CWD: apps/tolom

Create these 7 test files:

### 1. src/components/work-orders/__tests__/change-status-drawer.test.tsx
Component: ChangeStatusDrawer from "@/components/work-orders/change-status-drawer"
Props: { open: boolean; onOpenChange: (open: boolean) => void; workOrderId: string; currentStatus: string }
Uses: useMutation, useQueryClient, useCurrentOrg, useTranslations
Mock useMutation and useQueryClient.
- Test renders status flow options
- Test current status is highlighted
- Test clicking status triggers mutation
- Test drawer shows title text
- Mock useCurrentOrg to return { data: { orgId: "test-org" } }

### 2. src/components/work-orders/__tests__/customer-select.test.tsx
Component: CustomerSelect from "@/components/work-orders/customer-select"
Props: { orgId: string; selectedCustomer: Customer | null; onSelect: (customer: Customer) => void; onClear: () => void }
Uses: useCustomers, useForm, useTranslations
Mock useCustomers to return { data: [], isFetching: false }
- Test renders with no selected customer (shows search)
- Test renders selected customer info
- Test search input renders
- Mock the form hooks

### 3. src/components/work-orders/__tests__/vehicle-select.test.tsx
Component: VehicleSelect from "@/components/work-orders/vehicle-select"
Props: { orgId: string; customerId: string; selectedVehicle: Vehicle | null; onSelect: (vehicle: Vehicle) => void; onClear: () => void }
Uses: useMakes, useModelsByMake, useForm, useTranslations
Mock useMakes and useModelsByMake.
- Test renders vehicle search
- Test renders selected vehicle
- Mock useCurrentOrg or use form hooks

### 4. src/components/work-orders/__tests__/service-lines.test.tsx
Component: ServiceLines from "@/components/work-orders/service-lines"
Props: { catalog: ServiceCatalog[]; priceHistory: Record<string, number>; lines: ServiceLine[]; onAdd, onUpdate, onRemove }
Props-driven, no external hooks.
- Test renders empty state (no lines)
- Test renders service lines
- Test add button renders and calls onAdd
- Test remove button calls onRemove
- Test search input

### 5. src/components/work-orders/__tests__/part-lines.test.tsx
Component: PartLines from "@/components/work-orders/part-lines"
Props: { lines: PartLine[]; onAdd, onUpdate, onRemove }
Props-driven.
- Test renders empty state
- Test renders part lines
- Test add button

### 6. src/components/work-orders/__tests__/totals-summary.test.tsx
Component: TotalsSummary from "@/components/work-orders/line-items/totals-summary"
Props: { servicesTotal, partsTotal, grandTotal, serviceCount?, partCount?, discountTotal?, taxRate?, nuatEnabled?, locale?, t: (key: string) => string }
- Test renders grand total
- Test expandable breakdown section
- Test with discount
- Test with tax (nuatEnabled)
- Test with serviceCount and partCount

### 7. src/components/work-orders/__tests__/line-item-row.test.tsx
Component: LineItemRow from "@/components/work-orders/line-items/line-item-row"
Props: { name, nameMn, quantity, unitPrice, discountAmount, discountPercentage, finalPrice, locale, lineItemId, onEditQtySave, onEditPriceSave, noTruncate, autoFocusPrice }
- Test renders name and final price
- Test renders quantity and unit price
- Test renders discount info
- Test renders Mongolian name when locale="mn"
- Test edit mode when onEditQtySave provided
- Mock @zuiio/ui InlineEditableField

Import render from @/test/test-utils.
Provide messages: { workOrderDetail: { ... keys used }, common: { search: "Search" } }
