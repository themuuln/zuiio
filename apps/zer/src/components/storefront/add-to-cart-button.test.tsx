import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAddItem = vi.hoisted(() => vi.fn());
const mockToastSuccess = vi.hoisted(() => vi.fn());

vi.mock("@/components/storefront/cart-context", () => ({
  useStorefrontCart: () => ({ addItem: mockAddItem }),
}));

vi.mock("sonner", () => ({
  toast: { success: mockToastSuccess },
}));

import type { CartItem } from "@/lib/shop-cart";
import { AddToCartButton } from "./add-to-cart-button";

type ItemInput = Omit<CartItem, "quantity">;

function makeItem(
  overrides: Partial<ItemInput> & { productId: string },
): ItemInput {
  return {
    name: `Бүтээгдэхүүн ${overrides.productId}`,
    unitPrice: 1000,
    unit: "ш",
    maxStock: 10,
    ...overrides,
  };
}

describe("AddToCartButton", () => {
  beforeEach(() => {
    mockAddItem.mockClear();
    mockToastSuccess.mockClear();
  });

  it("renders the Mongolian add-to-cart label", () => {
    render(<AddToCartButton item={makeItem({ productId: "p1" })} />);
    expect(
      screen.getByRole("button", { name: /Сагсанд нэмэх/ }),
    ).toBeInTheDocument();
  });

  it("adds the item and shows a success toast on click", () => {
    const item = makeItem({ productId: "p1", unitPrice: 5000 });
    render(<AddToCartButton item={item} />);
    fireEvent.click(screen.getByRole("button", { name: /Сагсанд нэмэх/ }));
    expect(mockAddItem).toHaveBeenCalledTimes(1);
    expect(mockAddItem).toHaveBeenCalledWith(item);
    expect(mockToastSuccess).toHaveBeenCalledWith("Сагсанд нэмэгдлээ");
  });

  it("is disabled when the item is out of stock (maxStock <= 0)", () => {
    render(
      <AddToCartButton item={makeItem({ productId: "p1", maxStock: 0 })} />,
    );
    expect(
      screen.getByRole("button", { name: /Сагсанд нэмэх/ }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /Сагсанд нэмэх/ }));
    expect(mockAddItem).not.toHaveBeenCalled();
  });

  it("is enabled when the item has stock", () => {
    render(
      <AddToCartButton item={makeItem({ productId: "p1", maxStock: 1 })} />,
    );
    expect(screen.getByRole("button", { name: /Сагсанд нэмэх/ })).toBeEnabled();
  });

  it("passes variant identity through to addItem when the item carries it", () => {
    const item = makeItem({
      productId: "p1",
      variantId: "v1",
      variantLabels: "S / Хар",
      variantOptionIds: ["opt1"],
      unitPrice: 12500,
    });
    render(<AddToCartButton item={item} />);
    fireEvent.click(screen.getByRole("button", { name: /Сагсанд нэмэх/ }));
    expect(mockAddItem).toHaveBeenCalledWith(item);
  });
});
