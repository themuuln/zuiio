import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockReplace = vi.hoisted(() => vi.fn());
const mockAddItem = vi.hoisted(() => vi.fn());
const mockToastSuccess = vi.hoisted(() => vi.fn());

const urlSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
  usePathname: () => "/slug/products/p1",
  useSearchParams: () => urlSearchParams,
}));

vi.mock("@/components/storefront/cart-context", () => ({
  useStorefrontCart: () => ({ addItem: mockAddItem }),
}));

vi.mock("sonner", () => ({
  toast: { success: mockToastSuccess },
}));

import type { CartItem } from "@/lib/shop-cart";
import { BuyPanel } from "./buy-panel";
import type { PublicVariant } from "./page";

const VARIANTS: PublicVariant[] = [
  {
    id: "v1",
    sku: "SHIRT-S-BLK",
    sale_price: 12000,
    current_stock: 10,
    option_labels: "S / Хар",
  },
  {
    id: "v2",
    sku: "SHIRT-M-WHT",
    sale_price: 12500,
    current_stock: 15,
    option_labels: "M / Цагаан",
  },
];

const itemArgs = (): Omit<CartItem, "quantity"> =>
  mockAddItem.mock.calls[0][0] as Omit<CartItem, "quantity">;

describe("BuyPanel", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockAddItem.mockClear();
    mockToastSuccess.mockClear();
    urlSearchParams.delete("variant");
  });

  it("renders the base price card without variants", () => {
    render(
      <BuyPanel
        productId="p1"
        productName="Цамц"
        basePrice={10000}
        unit="ширхэг"
        currency="MNT"
        variants={[]}
      />,
    );
    expect(screen.getByText("Үнэ")).toBeInTheDocument();
    expect(screen.getByText("₮ 10,000")).toBeInTheDocument();
    expect(screen.getByText("MNT")).toBeInTheDocument();
    expect(screen.queryByText("Вариант")).toBeNull();
  });

  it("renders variant buttons with labels and per-variant prices", () => {
    render(
      <BuyPanel
        productId="p1"
        productName="Цамц"
        basePrice={12000}
        unit="ширхэг"
        currency="MNT"
        variants={VARIANTS}
      />,
    );
    const first = screen.getByRole("button", { name: /S \/ Хар/ });
    const second = screen.getByRole("button", { name: /M \/ Цагаан/ });
    expect(first).toBeInTheDocument();
    expect(second).toBeInTheDocument();
    expect(first).toHaveTextContent("₮ 12,000");
    expect(second).toHaveTextContent("₮ 12,500");
  });

  it("defaults to the first variant", () => {
    render(
      <BuyPanel
        productId="p1"
        productName="Цамц"
        basePrice={12000}
        unit="ширхэг"
        currency="MNT"
        variants={VARIANTS}
      />,
    );
    expect(screen.getByRole("button", { name: /S \/ Хар/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /M \/ Цагаан/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("honors a ?variant= URL param for the selected variant", () => {
    urlSearchParams.set("variant", "v2");
    render(
      <BuyPanel
        productId="p1"
        productName="Цамц"
        basePrice={12000}
        unit="ширхэг"
        currency="MNT"
        variants={VARIANTS}
      />,
    );
    expect(screen.getByRole("button", { name: /M \/ Цагаан/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("selecting a variant updates the URL and the selected state", () => {
    const { unmount } = render(
      <BuyPanel
        productId="p1"
        productName="Цамц"
        basePrice={12000}
        unit="ширхэг"
        currency="MNT"
        variants={VARIANTS}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /M \/ Цагаан/ }));
    expect(mockReplace).toHaveBeenCalledWith("/slug/products/p1?variant=v2", {
      scroll: false,
    });

    // Simulate the navigation the replace() would perform: the URL now
    // carries ?variant=v2, so the panel re-renders with v2 selected.
    urlSearchParams.set("variant", "v2");
    unmount();
    render(
      <BuyPanel
        productId="p1"
        productName="Цамц"
        basePrice={12000}
        unit="ширхэг"
        currency="MNT"
        variants={VARIANTS}
      />,
    );
    expect(screen.getByRole("button", { name: /M \/ Цагаан/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("adds the selected variant's price and id to the cart item", () => {
    // Arrive with ?variant=v2 already in the URL
    urlSearchParams.set("variant", "v2");
    render(
      <BuyPanel
        productId="p1"
        productName="Цамц"
        basePrice={12000}
        unit="ширхэг"
        currency="MNT"
        variants={VARIANTS}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Сагсанд нэмэх/ }));
    expect(mockAddItem).toHaveBeenCalledTimes(1);
    expect(itemArgs()).toMatchObject({
      productId: "p1",
      variantId: "v2",
      variantLabels: "M / Цагаан",
      unitPrice: 12500,
      unit: "ширхэг",
    });
  });

  it("falls back to the base price when the selected variant has none", () => {
    const noPriceVariants: PublicVariant[] = [
      {
        id: "v1",
        sku: "X",
        sale_price: null,
        current_stock: 1,
        option_labels: null,
      },
    ];
    render(
      <BuyPanel
        productId="p1"
        productName="Цамц"
        basePrice={9000}
        unit="ширхэг"
        currency="MNT"
        variants={noPriceVariants}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Сагсанд нэмэх/ }));
    expect(itemArgs()).toMatchObject({
      variantId: "v1",
      unitPrice: 9000,
      variantLabels: "X", // sku fallback when option_labels is missing
    });
  });

  it("never blocks on stock — public items are unbounded (maxStock Infinity)", () => {
    render(
      <BuyPanel
        productId="p1"
        productName="Цамц"
        basePrice={10000}
        unit="ширхэг"
        currency="MNT"
        variants={[]}
      />,
    );
    const addButton = screen.getByRole("button", { name: /Сагсанд нэмэх/ });
    expect(addButton).toBeEnabled();
    fireEvent.click(addButton);
    expect(itemArgs().maxStock).toBe(Number.POSITIVE_INFINITY);
  });

  it("shows a disabled Дууссан state and blocks adding when sold out", () => {
    render(
      <BuyPanel
        productId="p1"
        productName="Цамц"
        basePrice={10000}
        unit="ширхэг"
        currency="MNT"
        variants={[]}
        soldOut
      />,
    );
    expect(screen.queryByRole("button", { name: /Сагсанд нэмэх/ })).toBeNull();
    const soldOutButton = screen.getByRole("button", { name: /Дууссан/ });
    expect(soldOutButton).toBeDisabled();
  });

  it("keeps variant selectors functional when sold out", () => {
    render(
      <BuyPanel
        productId="p1"
        productName="Цамц"
        basePrice={12000}
        unit="ширхэг"
        currency="MNT"
        variants={VARIANTS}
        soldOut
      />,
    );
    const first = screen.getByRole("button", { name: /S \/ Хар/ });
    const second = screen.getByRole("button", { name: /M \/ Цагаан/ });
    expect(first).toBeEnabled();
    expect(second).toBeEnabled();
    fireEvent.click(second);
    expect(mockReplace).toHaveBeenCalledWith("/slug/products/p1?variant=v2", {
      scroll: false,
    });
    expect(screen.queryByRole("button", { name: /Сагсанд нэмэх/ })).toBeNull();
  });

  it("keeps add-to-cart enabled when stock is unknown (soldOut defaults false)", () => {
    render(
      <BuyPanel
        productId="p1"
        productName="Цамц"
        basePrice={10000}
        unit="ширхэг"
        currency="MNT"
        variants={[]}
      />,
    );
    const addButton = screen.getByRole("button", { name: /Сагсанд нэмэх/ });
    expect(addButton).toBeEnabled();
  });
});
