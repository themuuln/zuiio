// Mock IntersectionObserver for jsdom
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  value: MockIntersectionObserver,
});

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the cart context so we can assert stepper mutations.
const mockUpdateQuantity = vi.fn();
const mockRemoveItem = vi.fn();
const mockAddItem = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    prefetchQuery: vi.fn(),
    getQueryData: vi.fn(),
    setQueryData: vi.fn(),
  }),
  useQuery: vi.fn(() => ({ data: undefined, isPending: false })),
  QueryClient: vi.fn(),
}));

vi.mock("@/app/(dashboard)/shop/cart-context", () => ({
  useCart: () => ({
    cartItems: [],
    addItem: mockAddItem,
    removeItem: mockRemoveItem,
    updateQuantity: mockUpdateQuantity,
    clearCart: vi.fn(),
  }),
}));
// trackStock off => never out of stock, no max restriction.
const mockTrackStock = { value: false };
vi.mock("@/lib/org-settings-context", () => ({
  useOrgSettings: () => ({ trackStock: mockTrackStock.value }),
}));

// Avoid Supabase/image network + IntersectionObserver in jsdom.
vi.mock("@/components/ui/optimized-image", () => ({
  OptimizedImage: ({ alt }: { alt?: string }) => (
    <span data-testid="opt-img">{alt}</span>
  ),
}));

vi.mock("@/lib/query/hooks/use-product-variants", () => ({
  useVariantGroups: () => ({ data: undefined }),
  fetchVariantGroups: vi.fn(),
  fetchVariants: vi.fn(),
}));

import { ProductCard, type ProductCardProduct } from "./product-card";

const baseProduct: ProductCardProduct = {
  id: "p1",
  name: "Тест бүтээгдэхүүн",
  sale_price: 5000,
  current_stock: 10,
  unit: "ш",
  sku: null,
  barcode: null,
  category_id: null,
  image_url: null,
  brand_name: null,
  brand_logo_url: null,
};

describe("ProductCard stepper", () => {
  beforeEach(() => {
    mockUpdateQuantity.mockClear();
    mockRemoveItem.mockClear();
    mockAddItem.mockClear();
    mockTrackStock.value = false;
  });

  it("shows add button when not in cart", () => {
    render(
      <ProductCard product={baseProduct} cartQuantity={0} variant="tile" />,
    );
    expect(screen.getByText("Нэмэх")).toBeTruthy();
    expect(screen.queryByLabelText("Нэмэх")).toBeNull();
  });

  it("renders stepper with quantity when in cart and no variants", () => {
    render(
      <ProductCard product={baseProduct} cartQuantity={2} variant="tile" />,
    );
    // Quantity shown in stepper (may appear in multiple elements)
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    // No standalone add button text
    expect(screen.queryByText("Нэмэх")).toBeNull();
    expect(screen.queryByText("Дахин нэмэх")).toBeNull();
  });

  it("increment calls updateQuantity with qty+1", () => {
    render(
      <ProductCard product={baseProduct} cartQuantity={2} variant="tile" />,
    );
    fireEvent.click(screen.getByLabelText("Нэмэх"));
    expect(mockUpdateQuantity).toHaveBeenCalledWith("p1", 3);
  });

  it("decrement to 1 removes the item", () => {
    render(
      <ProductCard product={baseProduct} cartQuantity={1} variant="tile" />,
    );
    fireEvent.click(screen.getByLabelText("Хасах"));
    expect(mockRemoveItem).toHaveBeenCalledWith("p1");
  });

  it("decrement from 3 calls updateQuantity with qty-1", () => {
    render(
      <ProductCard product={baseProduct} cartQuantity={3} variant="tile" />,
    );
    fireEvent.click(screen.getByLabelText("Хасах"));
    expect(mockUpdateQuantity).toHaveBeenCalledWith("p1", 2);
    expect(mockRemoveItem).not.toHaveBeenCalled();
  });

  it("clicking anywhere on the card adds to cart", () => {
    render(
      <ProductCard product={baseProduct} cartQuantity={0} variant="tile" />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Сагсанд нэмэх/ }));
    expect(mockAddItem).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: "p1",
        name: "Тест бүтээгдэхүүн",
        unitPrice: 5000,
      }),
    );
  });

  it("Enter on the card adds to cart", () => {
    render(
      <ProductCard product={baseProduct} cartQuantity={0} variant="tile" />,
    );
    fireEvent.keyDown(screen.getByRole("button", { name: /Сагсанд нэмэх/ }), {
      key: "Enter",
    });
    expect(mockAddItem).toHaveBeenCalled();
  });

  it("stepper clicks do not trigger the card-level add (no double add)", () => {
    render(
      <ProductCard product={baseProduct} cartQuantity={2} variant="tile" />,
    );
    fireEvent.click(screen.getByLabelText("Нэмэх"));
    expect(mockUpdateQuantity).toHaveBeenCalledWith("p1", 3);
    expect(mockAddItem).not.toHaveBeenCalled();
  });

  it("does not expose an add button role when out of stock", () => {
    mockTrackStock.value = true;
    render(
      <ProductCard
        product={{ ...baseProduct, current_stock: 0 }}
        cartQuantity={0}
        variant="tile"
      />,
    );
    expect(screen.queryByRole("button", { name: /Сагсанд нэмэх/ })).toBeNull();
    expect(screen.getAllByText("Дууссан").length).toBeGreaterThan(0);
  });
});
