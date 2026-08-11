import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrgMeta, PublicCategory, PublicProduct } from "./page";
import { ProductsPageClient } from "./products-page-client";

const mockReplace = vi.fn();
const urlSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
  usePathname: () => "/storefront-e2e-test/products",
  useSearchParams: () => urlSearchParams,
}));

vi.mock("@/components/storefront/cart-context", () => ({
  useStorefrontCart: () => ({ count: 3 }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn() },
}));

// The drawer is a presentation wrapper around the card — render children.
vi.mock("./product-detail-drawer", () => ({
  ProductDetailDrawer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const ORG: OrgMeta = {
  name: "Storefront E2E Shop",
  slug: "storefront-e2e-test",
  currency: "MNT",
  companyType: "retail",
};

const CATEGORIES: PublicCategory[] = [
  { id: "cat-food", name: "Хүнс", product_count: 15 },
  { id: "cat-home", name: "Гэр ахуй", product_count: 16 },
];

function makeProducts(count: number): PublicProduct[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Бүтээгдэхүүн ${i + 1}`,
    unit: "ширхэг",
    sale_price: (i + 1) * 1000,
    category_name: i % 2 === 0 ? "Хүнс" : "Гэр ахуй",
    category_id: i % 2 === 0 ? "cat-food" : "cat-home",
    image_url: null,
    description: null,
    attribute_count: 0,
    images: null,
    current_stock: null,
  }));
}

function renderProducts(
  props: Partial<Parameters<typeof ProductsPageClient>[0]> = {},
) {
  const defaults = {
    organization: ORG,
    products: makeProducts(3),
    categories: CATEGORIES,
    total: 3,
    page: 1,
    pageSize: 24,
    search: "",
    categoryId: "",
  };
  return render(<ProductsPageClient {...defaults} {...props} />);
}

describe("ProductsPageClient", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    urlSearchParams.delete("q");
    urlSearchParams.delete("category");
    urlSearchParams.delete("page");
  });

  it("renders the org name, product count and product cards", () => {
    renderProducts();
    expect(
      screen.getByRole("heading", { name: "Storefront E2E Shop" }),
    ).toBeInTheDocument();
    // Total appears in the header and the "Бүгд" chip
    expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("бүтээгдэхүүн")).toBeInTheDocument();
    expect(screen.getByText("Бүтээгдэхүүн 1")).toBeInTheDocument();
    expect(screen.getByText("Бүтээгдэхүүн 2")).toBeInTheDocument();
    // Cart link exposes the live item count
    expect(screen.getByRole("link", { name: "Сагс (3)" })).toHaveAttribute(
      "href",
      "/storefront-e2e-test/cart",
    );
  });

  it("debounces search input into a q param and resets the page", async () => {
    urlSearchParams.set("page", "2");
    renderProducts({
      page: 2,
      total: 30,
      search: "",
      products: makeProducts(3),
    });

    fireEvent.change(screen.getByPlaceholderText("Нэр, тайлбар..."), {
      target: { value: "Цамц" },
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled();
    });
    const [url] = mockReplace.mock.calls.at(-1) as [
      string,
      { scroll: boolean },
    ];
    expect(url).toContain("?q=");
    expect(url).not.toContain("page=");
    expect(url).toContain("/storefront-e2e-test/products");
  });

  it("seeds the search input from the q param", () => {
    renderProducts({ search: "Цамц" });
    expect(
      (screen.getByPlaceholderText("Нэр, тайлбар...") as HTMLInputElement)
        .value,
    ).toBe("Цамц");
  });

  it("shows the filter-active result count line", () => {
    renderProducts({ search: "Цамц", total: 2, products: makeProducts(2) });
    expect(screen.getByText("2 бүтээгдэхүүн олдлоо")).toBeInTheDocument();
  });

  it("filters by category chip and toggles it off", () => {
    const { unmount } = renderProducts();
    fireEvent.click(screen.getByRole("button", { name: /Хүнс/ }));
    expect(mockReplace).toHaveBeenCalledWith(
      "/storefront-e2e-test/products?category=cat-food",
      { scroll: false },
    );

    // Simulate navigation: the categoryId prop now reflects the filter.
    unmount();
    urlSearchParams.set("category", "cat-food");
    renderProducts({ categoryId: "cat-food" });
    fireEvent.click(screen.getByRole("button", { name: /Хүнс/ }));
    expect(mockReplace).toHaveBeenLastCalledWith(
      "/storefront-e2e-test/products",
      { scroll: false },
    );
  });

  it("resets the category via the Бүгд chip", () => {
    renderProducts({ categoryId: "cat-home" });
    fireEvent.click(screen.getByRole("button", { name: /Бүгд/ }));
    expect(mockReplace).toHaveBeenCalledWith("/storefront-e2e-test/products", {
      scroll: false,
    });
  });

  it("paginates forward and backward with the page param", () => {
    renderProducts({ page: 1, total: 30, products: makeProducts(24) });

    fireEvent.click(screen.getByRole("button", { name: /Дараах/ }));
    expect(mockReplace).toHaveBeenCalledWith(
      "/storefront-e2e-test/products?page=2",
      { scroll: false },
    );
  });

  it("disables prev on page 1 and next on the last page", () => {
    const { unmount } = renderProducts({
      page: 1,
      total: 30,
      products: makeProducts(24),
    });
    expect(screen.getByRole("button", { name: /Өмнөх/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Дараах/ })).toBeEnabled();
    unmount();

    renderProducts({ page: 2, total: 30, products: makeProducts(6) });
    expect(screen.getByRole("button", { name: /Дараах/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Өмнөх/ })).toBeEnabled();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });

  it("going back to page 1 drops the page param from the URL", () => {
    renderProducts({ page: 2, total: 30, products: makeProducts(6) });
    fireEvent.click(screen.getByRole("button", { name: /Өмнөх/ }));
    expect(mockReplace).toHaveBeenCalledWith("/storefront-e2e-test/products", {
      scroll: false,
    });
  });

  it("shows the empty state with a clear-filters action when filtered", () => {
    renderProducts({
      products: [],
      total: 0,
      search: "байхгүй",
      categoryId: "cat-home",
    });
    expect(screen.getByText("Бүтээгдэхүүн олдсонгүй.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Фильтр арилгах" }));
    expect(mockReplace).toHaveBeenCalledWith("/storefront-e2e-test/products", {
      scroll: false,
    });
    // The search box is cleared alongside the filters
    expect(
      (screen.getByPlaceholderText("Нэр, тайлбар...") as HTMLInputElement)
        .value,
    ).toBe("");
  });

  it("renders the empty state without a clear action when unfiltered", () => {
    renderProducts({ products: [], total: 0 });
    expect(screen.getByText("Бүтээгдэхүүн олдсонгүй.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Фильтр арилгах" })).toBeNull();
  });

  it("shows a sold-out overlay on cards with zero stock", () => {
    const products = makeProducts(1).map((p) => ({
      ...p,
      current_stock: 0,
    }));
    renderProducts({ products, total: 1 });
    expect(screen.getByText("Дууссан")).toBeInTheDocument();
  });

  it("hides the stock overlay when stock is unknown (null)", () => {
    renderProducts();
    expect(screen.queryByText("Дууссан")).toBeNull();
    expect(screen.queryByText(/Нөөцөд байна/)).toBeNull();
  });
});
