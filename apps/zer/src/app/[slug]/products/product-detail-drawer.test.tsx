import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrgMeta, PublicProduct } from "./page";
import { ProductDetailDrawer } from "./product-detail-drawer";

vi.mock("@/components/storefront/cart-context", () => ({
  useStorefrontCart: () => ({ addItem: vi.fn() }),
}));

// BottomSheet wraps Base UI drawer primitives that need browser APIs jsdom
// lacks — stub it as a pass-through that exposes title/footer, so the test
// covers the drawer's own render contract (what it puts in the sheet).
vi.mock("@/components/ui/bottom-sheet", () => ({
  BottomSheet: ({
    open,
    title,
    description,
    children,
    footer,
  }: {
    open: boolean;
    title?: React.ReactNode;
    description?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
  }) =>
    open ? (
      <div data-testid="bottom-sheet">
        <div data-testid="sheet-title">{title}</div>
        <div data-testid="sheet-description">{description}</div>
        <div data-testid="sheet-content">{children}</div>
        {footer && <div data-testid="sheet-footer">{footer}</div>}
      </div>
    ) : null,
}));

const ORG: OrgMeta = {
  name: "Test Shop",
  slug: "test-shop",
  currency: "MNT",
  company_type: "retail",
};

function makeProduct(overrides: Partial<PublicProduct> = {}): PublicProduct {
  return {
    id: "p1",
    name: "Цамц",
    unit: "ширхэг",
    sale_price: 25000,
    category_name: "Хувцас",
    category_id: "cat-1",
    image_url: null,
    description: "Чамин хөвөн цамц",
    attribute_count: 0,
    images: null,
    current_stock: null,
    review_count: null,
    review_average: null,
    promo: null,
    ...overrides,
  };
}

function renderDrawer(product: PublicProduct = makeProduct()) {
  return render(
    <ProductDetailDrawer product={product} organization={ORG}>
      <div>card</div>
    </ProductDetailDrawer>,
  );
}

describe("ProductDetailDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens the sheet from the card trigger", () => {
    renderDrawer();
    expect(screen.queryByTestId("bottom-sheet")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Цамц дэлгэрэнгүй үзэх" }),
    );

    expect(screen.getByTestId("sheet-title")).toHaveTextContent("Цамц");
    expect(screen.getByTestId("sheet-description")).toHaveTextContent(
      "Test Shop",
    );
    expect(screen.getByTestId("sheet-content")).toHaveTextContent(
      "Чамин хөвөн цамц",
    );
  });

  it("shows the price with currency", () => {
    renderDrawer();
    fireEvent.click(
      screen.getByRole("button", { name: "Цамц дэлгэрэнгүй үзэх" }),
    );

    expect(screen.getByTestId("sheet-content")).toHaveTextContent("₮ 25,000");
    expect(screen.getByTestId("sheet-content")).toHaveTextContent("MNT");
  });

  it("surfaces the promo reward label when the product has a promo", () => {
    renderDrawer(
      makeProduct({
        promo: { id: "pr1", title: "Зуны хямдрал", reward_label: "20%" },
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Цамц дэлгэрэнгүй үзэх" }),
    );

    expect(screen.getByText("20%")).toBeInTheDocument();
    expect(screen.getByText("Зуны хямдрал")).toBeInTheDocument();
  });

  it("footer links to the full product page and offers add-to-cart", () => {
    renderDrawer();
    fireEvent.click(
      screen.getByRole("button", { name: "Цамц дэлгэрэнгүй үзэх" }),
    );

    expect(
      screen.getByRole("link", { name: /Бүтээгдэхүүний хуудас/ }),
    ).toHaveAttribute("href", "/test-shop/products/p1");
    expect(screen.getByText("Сагсанд нэмэх")).toBeInTheDocument();
    // Redundant close button was removed — swipe / X / backdrop close it.
    expect(screen.queryByText("Хаах")).not.toBeInTheDocument();
  });
});
