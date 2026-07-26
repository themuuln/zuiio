import { beforeEach, describe, expect, it, vi } from "vitest";
import { getShopProductBySlug, getShopProducts } from "@/app/lib/data-shop";
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
