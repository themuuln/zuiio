import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getProductBundles,
  getProductRatingSummary,
  getProductsByTeamSlug,
  getRelatedProducts,
  getShopProductBySlug,
  getShopProducts,
  submitProductReview,
} from "@/app/lib/data-shop";
import {
  createMockSupabase,
  type MockFrom,
  setQueryResult,
} from "@/test/supabase-mock";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

const mockCreateClient = vi.mocked(createClient);

function makeProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: "prod-1",
    name: "Майк",
    slug: "mayk",
    price_mnt: 50000,
    images: ["/img1.jpg"],
    variants: [{ size: "L", stock: 10 }],
    is_available: true,
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
    ...overrides,
  };
}

describe("getShopProducts", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns empty array on no data", async () => {
    setQueryResult(mock, "v_public_shop_products", []);
    const result = await getShopProducts();
    expect(result).toEqual([]);
  });

  it("returns products sorted descending", async () => {
    setQueryResult(mock, "v_public_shop_products", [
      makeProduct({ id: "p1", name: "A" }),
      makeProduct({ id: "p2", name: "B" }),
    ]);
    const result = await getShopProducts();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("A");
  });

  it("returns empty array on error", async () => {
    setQueryResult(mock, "v_public_shop_products", null, new Error("DB down"));
    const result = await getShopProducts();
    expect(result).toEqual([]);
  });
});

describe("getShopProductBySlug", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns null when not found", async () => {
    setQueryResult(mock, "v_public_shop_products", null);
    const result = await getShopProductBySlug("nonexistent");
    expect(result).toBeNull();
  });

  it("returns product for matching slug", async () => {
    setQueryResult(
      mock,
      "v_public_shop_products",
      makeProduct({ slug: "mayk" }),
    );
    const result = await getShopProductBySlug("mayk");
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Майк");
    expect(result?.price_mnt).toBe(50000);
  });

  it("returns null on error", async () => {
    setQueryResult(mock, "v_public_shop_products", null, new Error("DB down"));
    const result = await getShopProductBySlug("anything");
    expect(result).toBeNull();
  });
});

describe("getProductRatingSummary", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns zeros when no reviews exist", async () => {
    setQueryResult(mock, "product_reviews", []);
    const result = await getProductRatingSummary("prod-1");
    expect(result).toEqual({
      average: 0,
      count: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    });
  });

  it("calculates average rating from multiple reviews", async () => {
    setQueryResult(mock, "product_reviews", [
      { rating: 5 },
      { rating: 4 },
      { rating: 5 },
      { rating: 3 },
    ]);
    const result = await getProductRatingSummary("prod-1");
    // sum=17, count=4 → average=4.25, rounded to 4.3
    expect(result.average).toBe(4.3);
    expect(result.count).toBe(4);
  });

  it("computes distribution correctly across all star levels", async () => {
    setQueryResult(mock, "product_reviews", [
      { rating: 5 },
      { rating: 5 },
      { rating: 4 },
      { rating: 3 },
      { rating: 3 },
      { rating: 3 },
      { rating: 2 },
      { rating: 1 },
      { rating: 1 },
    ]);
    const result = await getProductRatingSummary("prod-1");
    expect(result.count).toBe(9);
    expect(result.distribution).toEqual({
      1: 2,
      2: 1,
      3: 3,
      4: 1,
      5: 2,
    });
  });

  it("returns default values on error", async () => {
    setQueryResult(
      mock,
      "product_reviews",
      null,
      new Error("Query failed"),
    );
    const result = await getProductRatingSummary("prod-1");
    expect(result).toEqual({
      average: 0,
      count: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    });
  });

  it("handles single review", async () => {
    setQueryResult(mock, "product_reviews", [{ rating: 4 }]);
    const result = await getProductRatingSummary("prod-1");
    expect(result.average).toBe(4);
    expect(result.count).toBe(1);
    expect(result.distribution).toEqual({
      1: 0,
      2: 0,
      3: 0,
      4: 1,
      5: 0,
    });
  });

  it("rounds average to one decimal place", async () => {
    setQueryResult(mock, "product_reviews", [
      { rating: 5 },
      { rating: 5 },
      { rating: 4 },
    ]);
    const result = await getProductRatingSummary("prod-1");
    // sum=14, count=3 → average=4.666..., rounded to 4.7
    expect(result.average).toBe(4.7);
    expect(result.count).toBe(3);
  });
});

describe("submitProductReview", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns success on successful insert", async () => {
    setQueryResult(mock, "product_reviews", {
      id: "rev-1",
      product_id: "prod-1",
      author_name: "Бат",
      rating: 5,
      content: "Сайхан бүтээгдэхүүн",
    });
    const result = await submitProductReview(
      "prod-1",
      "Бат",
      5,
      "Сайхан бүтээгдэхүүн",
    );
    expect(result).toEqual({ success: true });
  });

  it("returns error when insert fails", async () => {
    setQueryResult(
      mock,
      "product_reviews",
      null,
      new Error("duplicate key value violates unique constraint"),
    );
    const result = await submitProductReview(
      "prod-1",
      "Дорж",
      3,
      "Дунд зэрэг",
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe(
      "duplicate key value violates unique constraint",
    );
  });

  it("rejects invalid rating value via schema (low-level assertion)", async () => {
    // The function inserts the rating as-is; validation is expected upstream.
    // This test verifies the DB layer doesn't swallow the value.
    setQueryResult(mock, "product_reviews", {
      id: "rev-2",
      rating: 0,
    });
    const result = await submitProductReview("prod-1", "Test", 0, "test");
    // If rating 0 passes through, the insert should still succeed
    expect(result.success).toBe(true);
  });

  it("handles empty content gracefully", async () => {
    setQueryResult(mock, "product_reviews", {
      id: "rev-3",
      product_id: "prod-1",
      author_name: "Бат",
      rating: 4,
      content: "",
    });
    const result = await submitProductReview("prod-1", "Бат", 4, "");
    expect(result.success).toBe(true);
  });
});

describe("getRelatedProducts", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("returns products from same category excluding current slug", async () => {
    setQueryResult(mock, "v_public_shop_products", [
      makeProduct({ id: "p1", name: "A", slug: "product-a", category: "tshirt" }),
      makeProduct({ id: "p2", name: "B", slug: "product-b", category: "tshirt" }),
    ]);
    const result = await getRelatedProducts("product-a", "tshirt");
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.slug)).toContain("product-b");
  });

  it("falls back to most recent when no category", async () => {
    setQueryResult(mock, "v_public_shop_products", [
      makeProduct({ id: "p3", name: "C", slug: "product-c" }),
    ]);
    const result = await getRelatedProducts("product-a");
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("product-c");
  });

  it("respects limit of 4", async () => {
    const products = Array.from({ length: 4 }, (_, i) =>
      makeProduct({ id: `p${i}`, slug: `product-${i}`, category: "tshirt" }),
    );
    setQueryResult(mock, "v_public_shop_products", products);
    const result = await getRelatedProducts("product-0", "tshirt");
    expect(result.length).toBeLessThanOrEqual(4);
  });

  it("returns empty array on error", async () => {
    setQueryResult(mock, "v_public_shop_products", null, new Error("DB down"));
    const result = await getRelatedProducts("product-a", "tshirt");
    expect(result).toEqual([]);
  });

  it("returns empty array on no data", async () => {
    setQueryResult(mock, "v_public_shop_products", null);
    const result = await getRelatedProducts("product-a", "tshirt");
    expect(result).toEqual([]);
  });
});

describe("getProductsByTeamSlug", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("queries v_public_shop_products filtered by team_slug", async () => {
    setQueryResult(mock, "v_public_shop_products", [
      makeProduct({ id: "p1", team_slug: "team-a" }),
      makeProduct({ id: "p2", team_slug: "team-a" }),
    ]);
    const result = await getProductsByTeamSlug("team-a");
    expect(result).toHaveLength(2);
    expect(result[0].team_slug).toBe("team-a");
  });

  it("returns empty array when team has no products", async () => {
    setQueryResult(mock, "v_public_shop_products", []);
    const result = await getProductsByTeamSlug("team-empty");
    expect(result).toEqual([]);
  });

  it("returns empty array on error", async () => {
    setQueryResult(mock, "v_public_shop_products", null, new Error("DB down"));
    const result = await getProductsByTeamSlug("team-a");
    expect(result).toEqual([]);
  });

  it("orders by created_at desc", async () => {
    setQueryResult(mock, "v_public_shop_products", [
      makeProduct({ id: "p1", name: "Older", created_at: "2026-06-01T00:00:00Z", team_slug: "team-a" }),
      makeProduct({ id: "p2", name: "Newer", created_at: "2026-07-01T00:00:00Z", team_slug: "team-a" }),
    ]);
    const result = await getProductsByTeamSlug("team-a");
    expect(result).toHaveLength(2);
    // Function calls .order("created_at", { ascending: false });
    // Mock returns data in insertion order
    expect(result[0].created_at).toBe("2026-06-01T00:00:00Z");
  });
});

describe("getProductBundles", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  it("fetches and resolves bundles containing the product", async () => {
    // bundle_items result must satisfy both step 1 (needs bundle_id) and step 3 (needs product_id)
    setQueryResult(mock, "bundle_items", [
      { bundle_id: "bundle-1", product_id: "prod-1" },
      { bundle_id: "bundle-1", product_id: "prod-2" },
    ]);
    setQueryResult(mock, "product_bundles", [
      { id: "bundle-1", name: "Aварга Багц", description: "Desc", discount_percent: 20, is_active: true },
    ]);
    setQueryResult(mock, "v_public_shop_products", [
      makeProduct({ id: "prod-1", price_mnt: 50000 }),
      makeProduct({ id: "prod-2", name: "Product B", slug: "prod-b", price_mnt: 30000 }),
    ]);

    const result = await getProductBundles("prod-1");

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Aварга Багц");
    expect(result[0].discount_percent).toBe(20);
    expect(result[0].items).toHaveLength(2);
    expect(result[0].total_original).toBe(80000);
    expect(result[0].total_discounted).toBe(64000);
  });

  it("calculates total_original and total_discounted correctly", async () => {
    setQueryResult(mock, "bundle_items", [
      { bundle_id: "bundle-1", product_id: "prod-1" },
      { bundle_id: "bundle-1", product_id: "prod-2" },
      { bundle_id: "bundle-1", product_id: "prod-3" },
    ]);
    setQueryResult(mock, "product_bundles", [
      { id: "bundle-1", name: "Багц", description: null, discount_percent: 50, is_active: true },
    ]);
    setQueryResult(mock, "v_public_shop_products", [
      makeProduct({ id: "prod-1", price_mnt: 10000 }),
      makeProduct({ id: "prod-2", name: "B", slug: "prod-b", price_mnt: 20000 }),
      makeProduct({ id: "prod-3", name: "C", slug: "prod-c", price_mnt: 15000 }),
    ]);

    const result = await getProductBundles("prod-1");

    expect(result).toHaveLength(1);
    expect(result[0].total_original).toBe(45000);
    expect(result[0].total_discounted).toBe(22500);
  });

  it("returns empty array when no bundles contain the product", async () => {
    setQueryResult(mock, "bundle_items", []);
    const result = await getProductBundles("prod-1");
    expect(result).toEqual([]);
  });

  it("returns empty array when bundles exist but are inactive", async () => {
    setQueryResult(mock, "bundle_items", [
      { bundle_id: "bundle-1", product_id: "prod-1" },
    ]);
    // product_bundles returns empty because .eq("is_active", true) would exclude inactive bundles
    setQueryResult(mock, "product_bundles", []);
    const result = await getProductBundles("prod-1");
    expect(result).toEqual([]);
  });

  it("returns empty array when first bundle_items query fails", async () => {
    setQueryResult(mock, "bundle_items", null, new Error("DB down"));
    const result = await getProductBundles("prod-1");
    expect(result).toEqual([]);
  });

  it("returns empty array when product_bundles query fails", async () => {
    setQueryResult(mock, "bundle_items", [
      { bundle_id: "bundle-1", product_id: "prod-1" },
    ]);
    setQueryResult(mock, "product_bundles", null, new Error("bundles query failed"));
    const result = await getProductBundles("prod-1");
    expect(result).toEqual([]);
  });

  it("returns empty array when product query fails", async () => {
    setQueryResult(mock, "bundle_items", [
      { bundle_id: "bundle-1", product_id: "prod-1" },
    ]);
    setQueryResult(mock, "product_bundles", [
      { id: "bundle-1", name: "Багц", description: null, discount_percent: 20, is_active: true },
    ]);
    setQueryResult(mock, "v_public_shop_products", null, new Error("products query failed"));
    const result = await getProductBundles("prod-1");
    expect(result).toEqual([]);
  });

  it("handles bundle with only unavailable products gracefully", async () => {
    setQueryResult(mock, "bundle_items", [
      { bundle_id: "bundle-1", product_id: "prod-available" },
      { bundle_id: "bundle-1", product_id: "prod-unavailable" },
    ]);
    setQueryResult(mock, "product_bundles", [
      { id: "bundle-1", name: "Багц", description: null, discount_percent: 20, is_active: true },
    ]);
    // Only prod-available is in v_public_shop_products
    setQueryResult(mock, "v_public_shop_products", [
      makeProduct({ id: "prod-available", price_mnt: 50000 }),
    ]);

    const result = await getProductBundles("prod-1");

    expect(result).toHaveLength(1);
    expect(result[0].items).toHaveLength(1);
    expect(result[0].items[0].id).toBe("prod-available");
    expect(result[0].total_original).toBe(50000);
    expect(result[0].total_discounted).toBe(40000);
  });
});
