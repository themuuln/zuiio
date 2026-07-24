import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ShopProductRow } from "@/app/lib/data-shop";

// Mock the data layer
vi.mock("@/app/lib/data-shop", () => ({
  getShopProducts: vi.fn(),
  getShopProductBySlug: vi.fn(),
}));

// Mock PublicEmptyState so we can test directly
vi.mock("@/app/components/public-empty-state", () => ({
  PublicEmptyState: ({
    title,
    description,
  }: {
    icon: React.ComponentType;
    title: string;
    description: string;
  }) => (
    <div data-testid="empty-state">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  ),
}));

import { getShopProducts } from "@/app/lib/data-shop";

const mockGetShopProducts = vi.mocked(getShopProducts);

describe("Shop pages", () => {
  describe("ShopCatalogueClient", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("renders product grid when products exist", async () => {
      const { ShopCatalogueClient } = await import(
        "@/app/shop/components/shop-catalogue-client"
      );

      const products: ShopProductRow[] = [
        {
          id: "p1",
          name: "Майк",
          slug: "mayk",
          price_mnt: 50000,
          images: [],
          variants: [{ size: "L", stock: 10 }],
          is_available: true,
          created_at: "2026-07-01T00:00:00Z",
          updated_at: "2026-07-01T00:00:00Z",
        },
      ];

      const { container } = render(<ShopCatalogueClient products={products} />);

      // Should render a grid layout
      expect(container.querySelector('[class*="grid"]')).toBeTruthy();
    });

    it("shows empty state when no products", async () => {
      const { ShopCatalogueClient } = await import(
        "@/app/shop/components/shop-catalogue-client"
      );

      render(<ShopCatalogueClient products={[]} />);

      // Should show empty state
      expect(screen.getByText(/Бараа байхгүй/i)).toBeInTheDocument();
    });
  });

  describe("ShopPage (server component)", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("renders shop page header with product data", async () => {
      mockGetShopProducts.mockResolvedValue([
        {
          id: "p1",
          name: "Майк",
          slug: "mayk",
          price_mnt: 50000,
          images: [],
          variants: [{ size: "L", stock: 10 }],
          is_available: true,
          created_at: "2026-07-01T00:00:00Z",
          updated_at: "2026-07-01T00:00:00Z",
        },
      ]);

      const { default: ShopPage } = await import("@/app/shop/page");
      const element = await ShopPage();
      render(element);

      expect(screen.getByText(/Onoo дэлгүүр/i)).toBeInTheDocument();
    });

    it("shows empty state when no products", async () => {
      mockGetShopProducts.mockResolvedValue([]);

      const { default: ShopPage } = await import("@/app/shop/page");
      const element = await ShopPage();
      render(element);

      expect(screen.getByText(/Бараа байхгүй/i)).toBeInTheDocument();
    });

    it("handles data fetch error", async () => {
      mockGetShopProducts.mockRejectedValue(new Error("DB error"));

      await expect(async () => {
        const { default: ShopPage } = await import("@/app/shop/page");
        await ShopPage();
      }).rejects.toThrow("DB error");
    });
  });
});
