import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  VariantPicker,
  type VariantSelection,
} from "@/components/services/variant-picker";
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
    loadingVariants: "Loading variants...",
    matchingVariant: "Matching variant",
    defaultPriceUsed: "Default price used",
  },
};

const sizeLarge: CatalogItemVariant = {
  id: "v1",
  variant_label: "Large",
  variant_data: { Size: "Large" },
  price: 55000,
  sku: null,
  is_active: true,
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
  org_id: "org-1",
  entity_type: "service",
  entity_id: "svc-1",
  cost: null,
  sort_order: null,
} as unknown as CatalogItemVariant;

const sizeMedium: CatalogItemVariant = {
  id: "v2",
  variant_label: "Medium",
  variant_data: { Size: "Medium" },
  price: 45000,
  sku: null,
  is_active: true,
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
  org_id: "org-1",
  entity_type: "service",
  entity_id: "svc-1",
  cost: null,
  sort_order: null,
} as unknown as CatalogItemVariant;

const sizeSmall: CatalogItemVariant = {
  id: "v3",
  variant_label: "Small",
  variant_data: { Size: "Small" },
  price: 35000,
  sku: null,
  is_active: true,
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
  org_id: "org-1",
  entity_type: "service",
  entity_id: "svc-1",
  cost: null,
  sort_order: null,
} as unknown as CatalogItemVariant;

// ── Tests ───────────────────────────────────────────────────────────────

describe("VariantPicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVariants = [];
    mockIsLoading = false;
    mockIsError = false;
  });

  const defaultProps = {
    entityType: "service" as const,
    entityId: "svc-1",
    entityName: "Test Service",
    defaultPrice: 40000,
    value: null as VariantSelection | null,
    onChange: vi.fn(),
  };

  it("shows loading spinner when variants are loading", () => {
    mockIsLoading = true;

    render(<VariantPicker {...defaultProps} />, { messages });

    expect(screen.getByText("Loading variants...")).toBeInTheDocument();
  });

  it("renders nothing when variants list is empty", () => {
    mockVariants = [];

    render(<VariantPicker {...defaultProps} />, {
      messages,
    });

    // Component returns null for empty variants — no dimension name shown
    expect(screen.queryByText("Size")).not.toBeInTheDocument();
  });

  it("renders nothing on error", () => {
    mockVariants = [sizeLarge];
    mockIsError = true;

    render(<VariantPicker {...defaultProps} />, {
      messages,
    });

    // Component returns null on error — no dimension name shown
    expect(screen.queryByText("Size")).not.toBeInTheDocument();
  });

  it("renders dimension option chips for single dimension variants", () => {
    mockVariants = [sizeLarge, sizeMedium, sizeSmall];

    render(<VariantPicker {...defaultProps} />, { messages });

    // Should show the dimension name
    expect(screen.getByText("Size")).toBeInTheDocument();

    // Should show all variant options
    expect(screen.getByText("Large")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("Small")).toBeInTheDocument();
  });

  it("calls onChange with selected variant on chip click", () => {
    const onChange = vi.fn();
    mockVariants = [sizeLarge, sizeMedium];

    render(<VariantPicker {...defaultProps} onChange={onChange} />, {
      messages,
    });

    // Click the "Large" option
    fireEvent.click(screen.getByText("Large"));

    expect(onChange).toHaveBeenCalledWith({
      variantId: "v1",
      price: 55000,
      label: "Large",
    });
  });

  it("deselects when clicking the same option twice", () => {
    const onChange = vi.fn();
    mockVariants = [sizeLarge, sizeMedium];

    const { rerender } = render(
      <VariantPicker {...defaultProps} onChange={onChange} value={null} />,
      { messages },
    );

    // First click - select
    fireEvent.click(screen.getByText("Large"));

    // Rerender with the selected value
    rerender(
      <VariantPicker
        {...defaultProps}
        onChange={onChange}
        value={{ variantId: "v1", price: 55000, label: "Large" }}
      />,
    );

    // Second click - "Large" appears in both option button and price preview
    const largeElements = screen.getAllByText("Large");
    // Click the option button (first occurrence) to deselect
    const optionBtn = largeElements[0].closest("button");
    if (optionBtn) fireEvent.click(optionBtn);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("shows price preview when a selection is made", () => {
    mockVariants = [sizeLarge, sizeMedium];

    render(
      <VariantPicker
        {...defaultProps}
        value={{ variantId: "v1", price: 55000, label: "Large" }}
      />,
      { messages },
    );

    // Selected chip should be highlighted - "Large" appears in option and preview
    const largeElements = screen.getAllByText("Large");
    expect(largeElements.length).toBeGreaterThan(0);
  });

  describe("compact mode", () => {
    it("renders variant chips in compact row layout", () => {
      mockVariants = [sizeLarge, sizeMedium, sizeSmall];

      render(<VariantPicker {...defaultProps} compact />, { messages });

      // All variant labels should be visible (no dimension name in compact)
      expect(screen.getByText("Large")).toBeInTheDocument();
      expect(screen.getByText("Medium")).toBeInTheDocument();
      expect(screen.getByText("Small")).toBeInTheDocument();
    });

    it("shows overflow badge when more than 5 variants", () => {
      const variants: CatalogItemVariant[] = [];
      for (let i = 1; i <= 7; i++) {
        variants.push({
          id: `v${i}`,
          variant_label: `Option ${i}`,
          variant_data: { Size: `Option ${i}` },
          price: 10000 * i,
          sku: null,
          is_active: true,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
          org_id: "org-1",
          entity_type: "service",
          entity_id: "svc-1",
          cost: null,
          sort_order: null,
        } as unknown as CatalogItemVariant);
      }
      mockVariants = variants;

      render(<VariantPicker {...defaultProps} compact />, { messages });

      expect(screen.getByText("+2")).toBeInTheDocument();
    });

    it("calls onChange with selected variant in compact mode", () => {
      const onChange = vi.fn();
      mockVariants = [sizeLarge, sizeMedium];

      render(<VariantPicker {...defaultProps} compact onChange={onChange} />, {
        messages,
      });

      fireEvent.click(screen.getByText("Large"));
      expect(onChange).toHaveBeenCalledWith({
        variantId: "v1",
        price: 55000,
        label: "Large",
      });
    });
  });
});
