import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StorefrontBaseProvider } from "@/components/storefront/storefront-base-provider";
import { StorefrontHeader } from "./storefront-header";

const mockPathname = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

vi.mock("@/components/storefront/wishlist-context", () => ({
  useWishlist: () => ({ count: 2 }),
}));

vi.mock("@/components/storefront/cart-context", () => ({
  useStorefrontCart: () => ({ count: 3 }),
}));

/**
 * Header links are storefront-relative — tests render on the primary host
 * (base "/test-shop"), so hrefs keep the slug prefix.
 */
function renderHeader(ui: React.ReactElement) {
  return render(
    <StorefrontBaseProvider basePath="/test-shop">{ui}</StorefrontBaseProvider>,
  );
}

describe("StorefrontHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue("/test-shop/products");
  });

  it("renders the org identity (name + logo fallback initial)", () => {
    renderHeader(
      <StorefrontHeader
        slug="test-shop"
        name="Test Shop"
        logoUrl={null}
        categories={[]}
      />,
    );

    expect(screen.getByRole("link", { name: "Test Shop" })).toHaveAttribute(
      "href",
      "/test-shop",
    );
    expect(screen.getByText("T")).toBeInTheDocument();
  });

  it("renders a search form that GETs to the products page", () => {
    renderHeader(
      <StorefrontHeader
        slug="test-shop"
        name="Test Shop"
        logoUrl={null}
        categories={[]}
      />,
    );

    // jsdom/RTL do not map the <search> element to role="search", so query
    // the element directly; the landmark is the desktop search wrapper.
    const searchLandmark = document.querySelector("search");
    expect(searchLandmark).not.toBeNull();
    const form = searchLandmark.querySelector("form");
    expect(form).toHaveAttribute("method", "get");
    expect(form).toHaveAttribute("action", "/test-shop/products");
    // Two search inputs render (desktop + mobile variants) — both point at
    // the products page with the `q` param name.
    const inputs = screen.getAllByPlaceholderText("Бүтээгдэхүүн хайх…");
    expect(inputs.length).toBeGreaterThanOrEqual(1);
    expect(inputs[0]).toHaveAttribute("name", "q");
  });

  it("links to wishlist (with count), cart, and account", () => {
    renderHeader(
      <StorefrontHeader
        slug="test-shop"
        name="Test Shop"
        logoUrl={null}
        categories={[]}
      />,
    );

    expect(screen.getByRole("link", { name: "Хадгалсан (2)" })).toHaveAttribute(
      "href",
      "/test-shop/wishlist",
    );
    expect(screen.getByRole("link", { name: "Сагс (3)" })).toHaveAttribute(
      "href",
      "/test-shop/cart",
    );
    expect(
      screen.getByRole("link", { name: "Нэвтрэх / Бүртгэл" }),
    ).toHaveAttribute("href", "/test-shop/account");
  });

  it("renders nothing on buyer account routes (own AccountHeader there)", () => {
    mockPathname.mockReturnValue("/test-shop/account/orders");

    const { container } = renderHeader(
      <StorefrontHeader
        slug="test-shop"
        name="Test Shop"
        logoUrl={null}
        categories={[{ id: "cat-1", name: "Хүнс" }]}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders the category nav with a link to all products", () => {
    renderHeader(
      <StorefrontHeader
        slug="test-shop"
        name="Test Shop"
        logoUrl={null}
        categories={[
          { id: "cat-1", name: "Хүнс" },
          { id: "cat-2", name: "Гэр ахуй" },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Бүх бараа" })).toHaveAttribute(
      "href",
      "/test-shop/products",
    );
    expect(screen.getByRole("link", { name: "Хүнс" })).toHaveAttribute(
      "href",
      "/test-shop/products?category=cat-1",
    );
    expect(screen.getByRole("link", { name: "Гэр ахуй" })).toHaveAttribute(
      "href",
      "/test-shop/products?category=cat-2",
    );
  });
});
