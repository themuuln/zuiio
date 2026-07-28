import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VariantSelectionDialog } from "@/components/services/variant-selection-dialog";
import type { CatalogItemVariant } from "@/lib/types";
import { render } from "@/test/test-utils";

// ── Mocks ──────────────────────────────────────────────────────────────

let mockVariants: CatalogItemVariant[] = [];
let mockIsLoading = false;
let mockIsError = false;

vi.mock("@/lib/queries/use-catalog-variants", () => ({
  useItemVariants: () => ({
    data: mockVariants,
    isLoading: mockIsLoading,
    isError: mockIsError,
    error: null,
    isSuccess: !mockIsLoading && !mockIsError,
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
    selectVariant: "Select Variant",
    selectVariantDescription: "Choose a variant option for this item.",
    noVariantsFound: "No variants found.",
    addWithoutVariant: "Add without variant",
    addVariant: "Add variant",
    selectAVariant: "Select a variant",
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

// ── Tests ───────────────────────────────────────────────────────────────

describe("VariantSelectionDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVariants = [];
    mockIsLoading = false;
    mockIsError = false;
  });

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    entityType: "service" as const,
    entityId: "svc-1",
    entityName: "Test Service",
    defaultPrice: 40000,
    onConfirm: vi.fn(),
    onSkip: vi.fn(),
  };

  it("renders DetailDrawer with title when open", () => {
    mockVariants = [mockV1, mockV2];
    render(<VariantSelectionDialog {...defaultProps} />, { messages });
    // Title renders as "Test Service — Select Variant" - use exact:false for partial match
    expect(
      screen.getByText("Select Variant", { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Test Service/)).toBeInTheDocument();
  });

  it("renders VariantPicker with variant options", () => {
    mockVariants = [mockV1, mockV2];

    render(<VariantSelectionDialog {...defaultProps} />, { messages });

    // Variant options should be visible
    expect(screen.getByText("Large")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
  });

  it("shows loading spinner when variants are loading", () => {
    mockIsLoading = true;

    render(<VariantSelectionDialog {...defaultProps} />, { messages });

    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("shows no variants message when variants list is empty", () => {
    render(<VariantSelectionDialog {...defaultProps} />, { messages });

    expect(screen.getByText("No variants found.")).toBeInTheDocument();
  });

  it("renders skip button that calls onSkip", () => {
    mockVariants = [mockV1];

    render(<VariantSelectionDialog {...defaultProps} />, { messages });

    const skipButton = screen.getByText("Add without variant");
    expect(skipButton).toBeInTheDocument();

    fireEvent.click(skipButton);
    expect(defaultProps.onSkip).toHaveBeenCalledTimes(1);
  });

  it("renders confirm button disabled when no variant selected", () => {
    mockVariants = [mockV1, mockV2];

    render(<VariantSelectionDialog {...defaultProps} />, { messages });

    const confirmButton = screen.getByText("Select a variant");
    expect(confirmButton).toBeInTheDocument();
    expect(confirmButton).toBeDisabled();
  });

  it("calls onConfirm with selected variant when confirm is clicked", () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();

    mockVariants = [mockV1];

    render(
      <VariantSelectionDialog
        {...defaultProps}
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
      />,
      { messages },
    );

    // Select a variant first - click the Large option
    fireEvent.click(screen.getByText("Large"));

    // Confirm button should now show the variant label
    expect(screen.getByText("Add variant: Large")).toBeInTheDocument();

    // Click confirm
    fireEvent.click(screen.getByText("Add variant: Large"));
    expect(onConfirm).toHaveBeenCalledWith({
      variantId: "v1",
      price: 55000,
      label: "Large",
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not render when closed", () => {
    render(<VariantSelectionDialog {...defaultProps} open={false} />, {
      messages,
    });

    expect(screen.queryByText("Select Variant")).not.toBeInTheDocument();
  });
});
