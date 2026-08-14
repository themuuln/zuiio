Write Vitest component tests for Services components.

CWD: apps/tolom

Create these 4 test files:

### 1. src/components/services/__tests__/service-form.test.tsx
Component: ServiceForm from "@/components/services/service-form"
Props: { mode?: "full" | "quick"; initialData?: ServiceCatalog; onSuccess?: () => void; onCancel?: () => void }
Uses: useCreateService, useCurrentOrg, useForm, useTranslations
Mock useCreateService and useCurrentOrg.
- Test renders form fields (name, name_mn, default_price, default_cost, category, description)
- Test mode tabs (Service vs Product or similar if they exist)
- Test submit
- Test onCancel

### 2. src/components/services/__tests__/variant-picker.test.tsx
Component: VariantPicker from "@/components/services/variant-picker"
Props: { entityType: "service" | "part"; entityId: string; entityName: string; defaultPrice: number; value: VariantSelection | null; onChange: (sel) => void; compact?: boolean }
Uses: useItemVariants, useCurrentOrg
Mock useItemVariants to return variants data.
- Test renders entity name
- Test shows "no variants" when none exist
- Test renders variant chips/buttons
- Test selecting a variant calls onChange

### 3. src/components/services/__tests__/variant-editor-drawer.test.tsx
Component: VariantEditorDrawer from "@/components/services/variant-editor-drawer"
Props: { entityType: "service" | "part"; entityId: string; entityName: string; defaultPrice: number; open: boolean; onOpenChange: (open: boolean) => void }
Uses: Many variant hooks (useItemVariants, useVariantGroups, useVariantOptions, useCreateVariantGroup, useCreateVariantOption, useUpdateItemVariant, useDeleteItemVariant, useBulkGenerateVariants), useCurrentOrg
Mock all hooks.
- Test renders drawer when open
- Test shows variants list
- Test add variant group button

### 4. src/components/services/__tests__/variant-selection-dialog.test.tsx
Component: VariantSelectionDialog from "@/components/services/variant-selection-dialog"
Props: { open: boolean; onOpenChange: (open: boolean) => void; entityType: "service" | "part"; entityId: string; entityName: string; defaultPrice: number; onConfirm: (sel) => void; onSkip: () => void }
Uses: useItemVariants, useCurrentOrg
- Test renders DetailDrawer when open
- Test renders VariantPicker
- Test confirm button calls onConfirm
- Test skip button calls onSkip
- Test loading state shows spinner

Import render from @/test/test-utils.
Provide messages: { services: { title: "Services", ... } }
