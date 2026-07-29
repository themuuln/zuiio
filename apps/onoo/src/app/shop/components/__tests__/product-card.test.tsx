import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ShopProductRow } from "@/app/lib/data-shop";
import { ProductCard } from "@/app/shop/components/product-card";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

function makeProduct(overrides: Partial<ShopProductRow> = {}): ShopProductRow {
  return {
    id: "prod-1",
    name: "Майк",
    slug: "mayk",
    price_mnt: 50000,
    images: ["/img/mayk.jpg"],
    variants: [{ size: "L", stock: 10 }],
    is_available: true,
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
    ...overrides,
  };
}

describe("ProductCard", () => {
  it("renders product name", () => {
    render(<ProductCard product={makeProduct()} />);
    expect(screen.getByText("Майк")).toBeInTheDocument();
  });

  it("renders price as formatted MNT", () => {
    render(<ProductCard product={makeProduct()} />);
    expect(screen.getByText(/50,000/)).toBeInTheDocument();
  });

  it("renders link to product slug", () => {
    render(<ProductCard product={makeProduct()} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/shop/mayk");
  });

  it("shows available badge in stock", () => {
    render(<ProductCard product={makeProduct()} />);
    expect(screen.getByText("Бэлэн")).toBeInTheDocument();
  });

  it("shows out of stock badge", () => {
    render(<ProductCard product={makeProduct({ is_available: false })} />);
    expect(screen.getByText("Дууссан")).toBeInTheDocument();
  });

  it("shows image with alt text", () => {
    render(<ProductCard product={makeProduct()} />);
    const img = screen.getByRole("img");
    // next/image transforms the src to an optimization URL
    expect(img).toHaveAttribute("alt", "Майк");
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("shows placeholder when no images", () => {
    render(<ProductCard product={makeProduct({ images: [] })} />);
    expect(screen.getByText("Зураг байхгүй")).toBeInTheDocument();
  });
});
