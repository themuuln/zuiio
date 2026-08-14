/**
 * Tests for VariantPicker.
 *
 * Covers the two contracts that were broken for products without variant
 * groups (e.g. a plain product with has_variants = false):
 *   1. A product with zero variant groups renders NOTHING — not a broken
 *      "0/0, 0 үлдсэн, таарах вариант олдсонгүй" panel.
 *   2. onSelect is fired at most once per match change — an unstable parent
 *      callback (new identity each render) must not re-trigger it and cause
 *      an infinite render loop ("Maximum update depth exceeded").
 * Plus a sanity case: a real variant product still renders the picker.
 */

// IntersectionObserver fires immediately with isIntersecting: true so the
// picker's lazy-load gate opens synchronously in jsdom.
class MockIntersectionObserver {
  private cb: IntersectionObserverCallback;

  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb;
  }

  observe = vi.fn(() => {
    this.cb(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  });

  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  value: MockIntersectionObserver,
});

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type ProductVariant,
  useProductVariants,
  useVariantGroups,
  type VariantGroupWithOptions,
} from "@/lib/query/hooks/use-product-variants";
import { VariantPicker } from "../variant-picker";

vi.mock("@/lib/query/hooks/use-product-variants", () => ({
  useVariantGroups: vi.fn(),
  useProductVariants: vi.fn(),
}));

const mockUseVariantGroups = vi.mocked(useVariantGroups);
const mockUseProductVariants = vi.mocked(useProductVariants);

const group: VariantGroupWithOptions = {
  id: "g1",
  product_id: "p1",
  name: "Хэмжээ",
  sort_order: 0,
  options: [
    { id: "o1", group_id: "g1", value: "S", sort_order: 0 },
    { id: "o2", group_id: "g1", value: "M", sort_order: 1 },
  ],
};

const variant: ProductVariant = {
  id: "v1",
  product_id: "p1",
  sku: null,
  barcode: null,
  cost_price: null,
  sale_price: 25000,
  current_stock: 10,
  min_stock: null,
  image_urls: null,
  is_active: true,
  created_at: null,
  option_labels: "Хэмжээ: S",
  option_ids: ["o1"],
};

describe("VariantPicker", () => {
  beforeEach(() => {
    mockUseVariantGroups.mockReset();
    mockUseProductVariants.mockReset();
    mockUseProductVariants.mockReturnValue({
      data: [],
      isPending: false,
    } as never);
  });

  it("renders nothing for a product with no variant groups", () => {
    mockUseVariantGroups.mockReturnValue({ data: [] } as never);

    const onSelect = vi.fn();
    const { container } = render(
      <VariantPicker productId="p1" onSelect={onSelect} />,
    );

    expect(screen.queryByText("Вариант сонгох")).toBeNull();
    expect(screen.queryByText(/үлдсэн/)).toBeNull();
    expect(screen.queryByText(/таарах вариант/)).toBeNull();
    // The picker collapses to a zero-height placeholder.
    expect(container.firstElementChild?.className).toContain("h-0");
    expect(onSelect).not.toHaveBeenCalledWith(
      expect.objectContaining({ variant_id: expect.any(String) }),
    );
  });

  it("does not re-fire onSelect when the parent passes a new callback identity", () => {
    mockUseVariantGroups.mockReturnValue({ data: [] } as never);

    const onSelect = vi.fn();
    const { rerender } = render(
      <VariantPicker productId="p1" onSelect={onSelect} />,
    );

    // Parent re-renders with a brand-new onSelect (the sale form passes an
    // inline arrow). Before the ref-based effect, this re-triggered
    // onSelect(null) on every render -> infinite loop.
    rerender(<VariantPicker productId="p1" onSelect={() => undefined} />);
    rerender(<VariantPicker productId="p1" onSelect={() => undefined} />);

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("renders the picker for a product that does have variant groups", () => {
    mockUseVariantGroups.mockReturnValue({ data: [group] } as never);
    mockUseProductVariants.mockReturnValue({
      data: [variant],
      isPending: false,
    } as never);

    render(<VariantPicker productId="p1" onSelect={() => undefined} />);

    expect(screen.getByText("Вариант сонгох")).toBeVisible();
    expect(screen.getAllByText("Хэмжээ").length).toBeGreaterThan(0);
    expect(screen.getByText("0/1")).toBeVisible();
  });
});
