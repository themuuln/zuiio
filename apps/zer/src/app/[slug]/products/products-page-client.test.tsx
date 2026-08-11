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

const mockWishlistToggle = vi.fn();
vi.mock("@/components/storefront/wishlist-context", () => ({
  WishlistProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useWishlist: () => ({
    items: [],
    count: 0,
    isWishlisted: () => false,
    toggle: mockWishlistToggle,
  }),
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
    review_count: 0,
    review_average: null,
    promo: null,
  }));
}

function renderProducts(
  props: Partial<Parameters<typeof ProductsPageClient>[0]> = {},
) {
  const defaults = {
    organization: ORG,
    products: makeProducts(3),
    categories: CATEGORIES,
    promotions: [],
    total: 3,
    page: 1,
    pageSize: 24,
    search: "",
    categoryId: "",
    minPrice: "",
    maxPrice: "",
    sort: "newest",
  };
  return render(<ProductsPageClient {...defaults} {...props} />);
}

describe("ProductsPageClient", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    urlSearchParams.delete("q");
    urlSearchParams.delete("category");
    urlSearchParams.delete("page");
    urlSearchParams.delete("min_price");
    urlSearchParams.delete("max_price");
    urlSearchParams.delete("sort");
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

  it("renders price inputs and the sort select in the sidebar", () => {
    renderProducts();
    expect(screen.getByPlaceholderText("Хамгийн бага үнэ")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Хамгийн их үнэ")).toBeInTheDocument();
    const sort = screen.getByRole("combobox", { name: "Эрэмбэлэх" });
    expect(sort).toHaveValue("newest");
    expect(screen.getByRole("option", { name: "Шинэ" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Үнэ өсөх" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Үнэ буурах" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Нэр" })).toBeInTheDocument();
  });

  it("seeds the price inputs from the min_price/max_price params", () => {
    renderProducts({ minPrice: "1000", maxPrice: "5000" });
    expect(
      (screen.getByPlaceholderText("Хамгийн бага үнэ") as HTMLInputElement)
        .value,
    ).toBe("1000");
    expect(
      (screen.getByPlaceholderText("Хамгийн их үнэ") as HTMLInputElement).value,
    ).toBe("5000");
  });

  it("debounces the min price input into a min_price param and resets the page", async () => {
    urlSearchParams.set("page", "2");
    renderProducts({ page: 2, total: 30, products: makeProducts(3) });

    fireEvent.change(screen.getByPlaceholderText("Хамгийн бага үнэ"), {
      target: { value: "1000" },
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled();
    });
    const [url] = mockReplace.mock.calls.at(-1) as [
      string,
      { scroll: boolean },
    ];
    expect(url).toContain("min_price=1000");
    expect(url).not.toContain("page=");
  });

  it("debounces the max price input into a max_price param", async () => {
    renderProducts();

    fireEvent.change(screen.getByPlaceholderText("Хамгийн их үнэ"), {
      target: { value: "9999" },
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled();
    });
    const [url] = mockReplace.mock.calls.at(-1) as [
      string,
      { scroll: boolean },
    ];
    expect(url).toContain("max_price=9999");
  });

  it("pushes the sort param on select change", () => {
    renderProducts();
    fireEvent.change(screen.getByRole("combobox", { name: "Эрэмбэлэх" }), {
      target: { value: "price_asc" },
    });
    expect(mockReplace).toHaveBeenCalledWith(
      "/storefront-e2e-test/products?sort=price_asc",
      { scroll: false },
    );
  });

  it("selecting the default sort (Шинэ) drops the sort param", () => {
    renderProducts({ sort: "price_desc" });
    fireEvent.change(screen.getByRole("combobox", { name: "Эрэмбэлэх" }), {
      target: { value: "newest" },
    });
    expect(mockReplace).toHaveBeenCalledWith("/storefront-e2e-test/products", {
      scroll: false,
    });
  });

  it("clear filters resets price inputs and the sort param", () => {
    renderProducts({
      search: "Цамц",
      minPrice: "1000",
      maxPrice: "5000",
      sort: "price_asc",
    });
    fireEvent.click(screen.getByRole("button", { name: "Цэвэрлэх" }));
    expect(mockReplace).toHaveBeenCalledWith("/storefront-e2e-test/products", {
      scroll: false,
    });
    expect(
      (screen.getByPlaceholderText("Хамгийн бага үнэ") as HTMLInputElement)
        .value,
    ).toBe("");
    expect(
      (screen.getByPlaceholderText("Хамгийн их үнэ") as HTMLInputElement).value,
    ).toBe("");
  });

  it("renders the promo banner strip when promotions exist", () => {
    renderProducts({
      promotions: [
        {
          id: "promo-1",
          title: "Зуны хямдрал",
          description: "Бүх бүтээгдэхүүнд 20% хямдрал",
          reward_label: "20%",
          valid_from: null,
          valid_until: null,
          type: "discount",
        },
      ],
    });
    expect(screen.getByText("Зуны хямдрал")).toBeInTheDocument();
    expect(screen.getByText("20%")).toBeInTheDocument();
    expect(
      screen.getByText("Бүх бүтээгдэхүүнд 20% хямдрал"),
    ).toBeInTheDocument();
  });

  it("hides the promo banner strip without promotions", () => {
    renderProducts();
    expect(screen.queryByText("Зуны хямдрал")).toBeNull();
  });

  it("shows a promo badge on cards with an active promo", () => {
    const products = makeProducts(1).map((p) => ({
      ...p,
      promo: {
        id: "promo-1",
        title: "Зуны хямдрал",
        reward_label: "1+1",
      },
    }));
    renderProducts({ products, total: 1 });
    expect(screen.getByText("1+1")).toBeInTheDocument();
  });

  it("shows review stats on cards when review_count > 0", () => {
    const products = makeProducts(1).map((p) => ({
      ...p,
      review_count: 7,
      review_average: 4.5,
    }));
    renderProducts({ products, total: 1 });
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("(7)")).toBeInTheDocument();
  });

  it("hides review stats on cards without reviews", () => {
    renderProducts();
    expect(screen.queryByText("(0)")).toBeNull();
  });

  it("renders a wishlist link in the header with the saved count", () => {
    renderProducts();
    expect(screen.getByRole("link", { name: "Хадгалсан (0)" })).toHaveAttribute(
      "href",
      "/storefront-e2e-test/wishlist",
    );
  });

  it("renders a wishlist heart on every card", () => {
    renderProducts();
    expect(screen.getAllByRole("button", { name: "Хадгалах" })).toHaveLength(3);
  });
});
