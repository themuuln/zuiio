Write Vitest component tests for Inventory components.

CWD: apps/tolom

Create these 6 test files:

### 1. src/components/inventory/__tests__/new-supplier-drawer.test.tsx
Component: NewSupplierDrawer from "@/components/inventory/new-supplier-drawer"
Props: { open: boolean; onOpenChange: (open: boolean) => void }
Simple wrapper around ResponsiveFormModal + SupplierForm.
- Test renders drawer when open
- Mock ResponsiveFormModal if needed, or test basic rendering

### 2. src/components/inventory/__tests__/supplier-form.test.tsx
Component: SupplierForm from "@/components/inventory/supplier-form"
Props: { mode?: "quick" | "full"; onSuccess?: (supplier) => void; onCancel?: () => void }
Uses: useCreateSupplier, useCurrentOrg, useForm/zodResolver, useTranslations
Mock useCreateSupplier and useCurrentOrg.
- Test renders form fields (name, contact, phone, email, address, taxId, notes)
- Test submit validates required name field
- Test onSuccess called after valid submit
- Mock useForm to control form state

### 3. src/components/inventory/__tests__/new-purchase-order-drawer.test.tsx
Component: NewPurchaseOrderDrawer from "@/components/inventory/new-purchase-order-drawer"
Props: { open: boolean; onOpenChange: (open: boolean) => void }
Wrapper around ResponsiveFormModal + PurchaseOrderForm.
- Test renders drawer when open=true
- Test doesn't render when open=false

### 4. src/components/inventory/__tests__/purchase-order-form.test.tsx
Component: PurchaseOrderForm from "@/components/inventory/purchase-order-form"
Props: { onSuccess?: () => void; onCancel?: () => void }
Uses: useCreatePurchaseOrder, usePartsCatalog, useSuppliers, useCurrentOrg, useForm
Complex form with line items (field array).
Mock all hooks.
- Test renders form with supplier select
- Test renders line items section
- Test onCancel calls cancel prop

### 5. src/components/inventory/__tests__/part-form.test.tsx
Component: PartForm from "@/components/inventory/part-form"
Props: { mode?: "full" | "quick" | "inline"; initialData?: PartsCatalogItem; partId?: string; readOnly?: boolean; hideActions?: boolean; formId?: string; onSuccess?: (part) => void; onCancel?: () => void }
Uses: useCreatePart, usePartCategories, useCreatePartCategory, useUpdatePart, useCurrentOrg
Mock all hooks.
- Test renders form fields (name, name_mn, part_number, price, etc.)
- Test category combobox
- Test renders photo upload section (mock PartPhotoUpload)
- Test submit calls onSuccess

### 6. src/components/inventory/__tests__/quick-stock-in-dialog.test.tsx
Component: QuickStockInDialog from "@/components/inventory/quick-stock-in-dialog"
Props: { open: boolean; onOpenChange: (open: boolean) => void; orgId: string; branchId: string | null; preselectedPartId?: string }
Uses: useOrgMutation from @zuiio/query, useTranslations
Mock useOrgMutation.
- Test renders dialog when open
- Test inputs for quantity, unit cost
- Test submit calls mutation
- Test preselectedPartId shows in input

Import render from @/test/test-utils.
Provide messages: { inventory: { newSupplier: "New Supplier", newSupplierDescription: "Create supplier", newPurchaseOrder: "New PO", ... }, common: { ... } }
