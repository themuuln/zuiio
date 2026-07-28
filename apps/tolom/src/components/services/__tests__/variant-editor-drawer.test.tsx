import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VariantEditorDrawer } from "@/components/services/variant-editor-drawer";
import type {
  CatalogItemVariant,
  CatalogVariantGroup,
  CatalogVariantOption,
} from "@/lib/types";
import { render } from "@/test/test-utils";

// ── Mocks ──────────────────────────────────────────────────────────────

let mockVariants: CatalogItemVariant[] = [];
let mockVariantsLoading = false;
let mockGroups: CatalogVariantGroup[] = [];
let mockGroupOptions: CatalogVariantOption[] = [];

vi.mock("@/lib/queries/use-catalog-variants", () => ({
  useItemVariants: () => ({
    data: mockVariants,
    isLoading: mockVariantsLoading,
    isError: false,
    error: null,
  }),
  useVariantGroups: () => ({
    data: mockGroups,
    isLoading: false,
    isError: false,
    error: null,
  }),
  useVariantOptions: () => ({
    data: mockGroupOptions,
    isLoading: false,
    isError: false,
    error: null,
  }),
  useCreateVariantGroup: () => ({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
  }),
  useCreateVariantOption: () => ({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
  }),
  useUpdateItemVariant: () => ({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
  }),
  useDeleteItemVariant: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
  }),
  useBulkGenerateVariants: () => ({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: null,
  }),
}));

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({
    data: { orgId: "org-1", orgName: "Test Org", branchId: null },
    isLoading: false,
    isError: false,
    error: null,
    isSuccess: true,
  }),
}));

// ── Test Data ───────────────────────────────────────────────────────────

const messages = {
  services: {
    manageVariants: "Manage Variants",
    variantCount: "variants",
    variantsFor: "Variants for",
    basePriceLabel: "Base price:",
    addVariantDimension: "Add Variant Dimension",
    selectDimension: "Select dimension...",
    generateVariants: "Generate Variants",
    newDimension: "New Dimension",
    noVariants: "No variants yet",
    addDimensionToStart: "Add a dimension to start",
    close: "Close",
    variantGroupNamePrompt: "Enter a name for the dimension...",
    variantOptionLabelPrompt: "Enter a label for the new option...",
  },
};

const mockV1: CatalogItemVariant = {
  id: "v1",
  org_id: "org-1",
  entity_type: "service",
  entity_id: "svc-1",
  variant_label: "Large",
  variant_data: { Size: "Large" },
  price: 55000,
  cost: null,
  sku: null,
  sort_order: null,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
} as unknown as CatalogItemVariant;

const mockV2: CatalogItemVariant = {
  id: "v2",
  org_id: "org-1",
  entity_type: "service",
  entity_id: "svc-1",
  variant_label: "Medium",
  variant_data: { Size: "Medium" },
  price: 45000,
  cost: null,
  sku: null,
  sort_order: null,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
} as unknown as CatalogItemVariant;

const mockSizeGroup: CatalogVariantGroup = {
  id: "grp-1",
  org_id: "org-1",
  name: "Size",
  name_mn: null,
  applies_to: "service",
  sort_order: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
} as unknown as CatalogVariantGroup;

const mockLargeOption: CatalogVariantOption = {
  id: "opt-1",
  org_id: "org-1",
  group_id: "grp-1",
  label: "Large",
  label_mn: null,
  sort_order: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
} as unknown as CatalogVariantOption;

const mockMediumOption: CatalogVariantOption = {
  id: "opt-2",
  org_id: "org-1",
  group_id: "grp-1",
  label: "Medium",
  label_mn: null,
  sort_order: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
} as unknown as CatalogVariantOption;

// ── Tests ───────────────────────────────────────────────────────────────

describe("VariantEditorDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVariants = [];
    mockVariantsLoading = false;
    mockGroups = [];
    mockGroupOptions = [];
  });

  const defaultProps = {
    entityType: "service" as const,
    entityId: "svc-1",
    entityName: "Test Service",
    defaultPrice: 40000,
    open: true,
    onOpenChange: vi.fn(),
  };

  it("renders drawer with title when open", () => {
    mockVariants = [mockV1, mockV2];

    render(<VariantEditorDrawer {...defaultProps} />, { messages });

    expect(screen.getByText("Manage Variants")).toBeInTheDocument();
    expect(screen.getByText("Test Service")).toBeInTheDocument();
  });

  it("shows variant count badge", () => {
    mockVariants = [mockV1, mockV2];

    render(<VariantEditorDrawer {...defaultProps} />, { messages });

    // Badge shows count: "2 variants"
    expect(screen.getByText(/2/)).toBeInTheDocument();
  });

  it("renders variants list with variant labels", () => {
    mockVariants = [mockV1, mockV2];

    render(<VariantEditorDrawer {...defaultProps} />, { messages });

    expect(screen.getByText("Large")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
  });

  it("shows loading spinner when variants are loading", () => {
    mockVariantsLoading = true;

    render(<VariantEditorDrawer {...defaultProps} />, { messages });

    // Loading spinner should be visible
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("shows empty state when no variants", () => {
    render(<VariantEditorDrawer {...defaultProps} />, { messages });

    expect(screen.getByText("No variants yet")).toBeInTheDocument();
    expect(screen.getByText("Add a dimension to start")).toBeInTheDocument();
  });

  it("renders add dimension UI", () => {
    mockGroups = [mockSizeGroup];

    render(<VariantEditorDrawer {...defaultProps} />, { messages });

    expect(screen.getByText("Add Variant Dimension")).toBeInTheDocument();
    // Select placeholder for dimension
    expect(screen.getByText("Select dimension...")).toBeInTheDocument();
  });

  it("renders Generate Variants button and New Dimension button", () => {
    mockGroups = [mockSizeGroup];
    mockGroupOptions = [mockLargeOption, mockMediumOption];

    render(<VariantEditorDrawer {...defaultProps} />, { messages });

    expect(screen.getByText("Generate Variants")).toBeInTheDocument();
    expect(screen.getByText("New Dimension")).toBeInTheDocument();
  });

  it("calls onOpenChange(false) when close button is clicked", () => {
    const onOpenChange = vi.fn();
    render(
      <VariantEditorDrawer {...defaultProps} onOpenChange={onOpenChange} />,
      { messages },
    );

    fireEvent.click(screen.getByText("Close"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows base price in drawer description", () => {
    mockVariants = [mockV1];
    const { baseElement } = render(
      <VariantEditorDrawer {...defaultProps} defaultPrice={40000} />,
      { messages },
    );
    // DrawerDescription renders inside the portal - query through baseElement
    expect(baseElement.textContent?.includes("Base price:")).toBe(true);
  });

  it("shows grouped variant view for multi-dimension variants", () => {
    // Create a second dimension variant
    const colorRed: CatalogItemVariant = {
      id: "v3",
      org_id: "org-1",
      entity_type: "service",
      entity_id: "svc-1",
      variant_label: "Red",
      variant_data: { Color: "Red" },
      price: 50000,
      cost: null,
      sku: null,
      sort_order: null,
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    } as unknown as CatalogItemVariant;

    mockVariants = [mockV1, colorRed];

    render(<VariantEditorDrawer {...defaultProps} />, { messages });

    // Both dimensions should appear
    expect(screen.getByText("Large")).toBeInTheDocument();
    expect(screen.getByText("Red")).toBeInTheDocument();
  });

  it("does not render content when closed", () => {
    mockVariants = [mockV1];

    render(<VariantEditorDrawer {...defaultProps} open={false} />, {
      messages,
    });

    expect(screen.queryByText("Manage Variants")).not.toBeInTheDocument();
  });
});
