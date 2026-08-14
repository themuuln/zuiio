Write Vitest component tests for Work Order Wizard components + NewWorkOrderDrawer.

CWD: apps/tolom

Create these 5 test files. All wizard components use useWizardContext() and useTranslations("workOrderWizard").

**Important: Mock useWizardContext at module level for each test file.**
```ts
const mockWizardCtx = {
  selectedCustomer: null,
  selectedVehicle: null,
  selectedMechanic: null,
  mechanics: [],
  complaint: "",
  diagnosisLabelId: "",
  description: "",
  isRestoringFromDraft: false,
  setComplaint: vi.fn(),
  setDiagnosisLabelId: vi.fn(),
  setSelectedMechanic: vi.fn(),
  setDescription: vi.fn(),
  servicesTotal: 0,
  partsTotal: 0,
  grandTotal: 0,
  serviceCount: 0,
  partCount: 0,
  createWorkOrder: vi.fn(),
} as any;

vi.mock("@/components/work-orders/wizard/wizard-context", () => ({
  useWizardContext: () => mockWizardCtx,
}));
```

### 1. src/components/work-orders/wizard/__tests__/complaint-section.test.tsx
Component: ComplaintSection
Uses useDiagnosisLabels and useCurrentOrg
- Mock useDiagnosisLabels to return labels array
- Mock useCurrentOrg to return { data: { orgId: "org1" } }
- Test renders complaint textarea with placeholder
- Test renders diagnosis labels combobox
- Test typing in textarea calls setComplaint

### 2. src/components/work-orders/wizard/__tests__/customer-section.test.tsx
Component: CustomerSection
- Test renders "restoring from draft" state when isRestoringFromDraft=true
- Test renders customer selection UI when no customer selected
- Test renders selected customer when ctx.selectedCustomer is set

### 3. src/components/work-orders/wizard/__tests__/mechanic-section.test.tsx
Component: MechanicSection
- Test renders mechanic section title
- Test renders notes input
- Test typing notes calls setDescription

### 4. src/components/work-orders/wizard/__tests__/vehicle-section.test.tsx
Component: VehicleSection
- Test renders restoring from draft state
- Test renders vehicle selection UI when no vehicle selected
- Test renders selected vehicle

### 5. src/components/work-orders/__tests__/new-work-order-drawer.test.tsx
Component: NewWorkOrderDrawer
Props: { open: boolean; onOpenChange: (open: boolean) => void }
- This component uses WizardProvider which wraps the wizard context
- Mock the wizard section components (ComplaintSection, CustomerSection, etc.) imported from @/components/work-orders/wizard
- Test drawer renders when open=true
- Test drawer calls onOpenChange when closed

Import render from @/test/test-utils.
Provide messages: { workOrderWizard: { complaint: "Complaint", complaintPlaceholder: "Describe complaint...", diagnosisLabelPlaceholder: "Select label...", mechanic: "Mechanic", notes: "Notes", descriptionOrNotes: "Description", customer: "Customer", vehicle: "Vehicle", searchCustomer: "Search customer", searchVehicle: "Search vehicle", draftRestoring: "Restoring draft", summary: "Summary", serviceTotal: "Services", partsTotal: "Parts", grandTotal: "Total", create: "Create", cancel: "Cancel", noItems: "No items" } }
