import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { StorefrontBaseProvider } from "@/components/storefront/storefront-base-provider";
import { WishlistProvider } from "@/components/storefront/wishlist-context";
import type { PublicProduct } from "../products/page";
import { WishlistApp } from "./page";

const STORAGE_KEY = "wishlist:test-shop";

const mockRpc = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ rpc: mockRpc }),
}));

vi.mock("@/components/storefront/cart-context", () => ({
  StorefrontCartProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useStorefrontCart: () => ({ count: 0 }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn() },
}));

// The drawer is a presentation wrapper around the card — render children.
vi.mock("../products/product-detail-drawer", () => ({
  ProductDetailDrawer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// jsdom in this setup has no localStorage — install the repo-standard mock.
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
})();

beforeAll(() => {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    configurable: true,
  });
});

function makeProduct(id: string, name: string): PublicProduct {
  return {
    id,
    name,
    unit: "ширхэг",
    sale_price: 1000,
    category_name: "Хүнс",
    category_id: "cat-food",
    image_url: null,
    description: null,
    attribute_count: 0,
    images: null,
    current_stock: null,
    review_count: 0,
    review_average: null,
    promo: null,
  };
}

function rpcResult(products: PublicProduct[]) {
  return {
    data: {
      organization: { name: "Test Shop", slug: "test-shop", currency: "MNT" },
      products,
      total: products.length,
      page: 1,
      page_size: 100,
    },
    error: null,
  };
}

function renderWishlist(slug = "test-shop") {
  return render(
    <StorefrontBaseProvider basePath={`/${slug}`}>
      <WishlistProvider slug={slug}>
        <WishlistApp slug={slug} />
      </WishlistProvider>
    </StorefrontBaseProvider>,
  );
}

describe("WishlistApp", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockRpc.mockReset();
  });

  it("shows the empty state with a products link when nothing is saved", () => {
    renderWishlist();
    expect(
      screen.getByText("Хадгалсан бүтээгдэхүүн байхгүй"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Бүтээгдэхүүн үзэх" }),
    ).toHaveAttribute("href", "/test-shop/products");
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("fetches and renders the saved products via get_public_products", async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(["p1", "p2"]));
    mockRpc.mockResolvedValue(
      rpcResult([
        makeProduct("p1", "Бүтээгдэхүүн 1"),
        makeProduct("p2", "Бүтээгдэхүүн 2"),
      ]),
    );

    renderWishlist();

    expect(await screen.findByText("Бүтээгдэхүүн 1")).toBeInTheDocument();
    expect(screen.getByText("Бүтээгдэхүүн 2")).toBeInTheDocument();
    // Header shows the saved count.
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(mockRpc).toHaveBeenCalledWith("get_public_products", {
      p_slug: "test-shop",
      p_product_ids: ["p1", "p2"],
      p_page: 1,
      p_page_size: 100,
    });
  });

  it("removes a product from the wishlist and refetches", async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(["p1", "p2"]));
    mockRpc.mockResolvedValue(
      rpcResult([
        makeProduct("p1", "Бүтээгдэхүүн 1"),
        makeProduct("p2", "Бүтээгдэхүүн 2"),
      ]),
    );

    renderWishlist();
    expect(await screen.findByText("Бүтээгдэхүүн 1")).toBeInTheDocument();

    mockRpc.mockResolvedValue(rpcResult([makeProduct("p2", "Бүтээгдэхүүн 2")]));
    // First card (p1) heart removes p1 from the list.
    fireEvent.click(screen.getAllByRole("button", { name: "Хадгалсан" })[0]);

    await waitFor(() => {
      expect(screen.queryByText("Бүтээгдэхүүн 1")).toBeNull();
    });
    expect(screen.getByText("Бүтээгдэхүүн 2")).toBeInTheDocument();
  });

  it("shows the error state and retries the fetch", async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(["p1"]));
    mockRpc
      .mockResolvedValueOnce({ data: null, error: { message: "boom" } })
      .mockResolvedValueOnce(rpcResult([makeProduct("p1", "Бүтээгдэхүүн 1")]));

    renderWishlist();

    expect(
      await screen.findByText("Бүтээгдэхүүн ачааллахад алдаа гарлаа."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Дахин оролдох" }));
    expect(await screen.findByText("Бүтээгдэхүүн 1")).toBeInTheDocument();
    expect(mockRpc).toHaveBeenCalledTimes(2);
  });
});
