/**
 * Tests for src/lib/query/hooks/use-product-variants.ts
 *
 * Covers the fetchVariantGroups() and fetchVariants() async data-fetching
 * functions. The React Query hook wrappers are intentionally left for
 * integration-style tests — these focus on the Supabase query contract and
 * result mapping.
 */

import { capture } from "@zuiio/capture";
import { afterEach, describe, expect, it, vi } from "vitest";

// Dynamic import for the module under test is required because `vi.mock`
// factory closures capture module-level variables (`mockSupabase`, etc.),
// which must be fully initialized before the mocked module is first loaded.
// Static import would trigger TDZ — see ts-no-dynamic-import exception.

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("@zuiio/capture", () => ({ capture: vi.fn() }));

/*
 * Build a mock query builder that is thenable, like the real
 * PostgrestFilterBuilder.  The chain:
 *   .from() → .select() → .eq() → .order() → .order()
 * returns the builder itself, so `await` on the final expression calls
 * `.then()`.  We install a mock `.then()` that delegates to the onfulfilled
 * callback with the test-provided { data, error } shape.
 */
const mockThen = vi.fn();
const mockOrder = vi.fn(() => mockQuery);
const mockEq = vi.fn(() => mockQuery);
const mockSelect = vi.fn(() => mockQuery);

const mockQuery = {
  order: mockOrder,
  eq: mockEq,
  select: mockSelect,
  // biome-ignore lint/suspicious/noThenProperty: mock needs to be awaitable
  then: mockThen,
};

const mockFrom = vi.fn(() => mockQuery);
const mockSupabase = { from: mockFrom };

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabase,
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Configure the mock thenable to resolve with the given data / error. */
function resolveWith(data: unknown, error: unknown = null) {
  mockThen.mockImplementation((onfulfilled: (v: unknown) => unknown) =>
    Promise.resolve({ data, error }).then(onfulfilled),
  );
}

// ── Suite: fetchVariantGroups ───────────────────────────────────────────────

describe("fetchVariantGroups", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("queries product_variant_groups with the correct productId", async () => {
    resolveWith(null);
    const { fetchVariantGroups } = await import("../use-product-variants");

    await fetchVariantGroups("prod-1");

    expect(mockFrom).toHaveBeenCalledWith("product_variant_groups");
    expect(mockSelect).toHaveBeenCalledWith(
      expect.stringContaining("product_variant_options"),
    );
    expect(mockEq).toHaveBeenCalledWith("product_id", "prod-1");
    expect(mockOrder).toHaveBeenCalledTimes(2);
    expect(mockOrder).toHaveBeenNthCalledWith(1, "sort_order", {
      ascending: true,
    });
    expect(mockOrder).toHaveBeenNthCalledWith(2, "created_at", {
      ascending: true,
    });
  });

  it("returns mapped groups with sorted options", async () => {
    const rawGroups = [
      {
        id: "g2",
        product_id: "prod-1",
        name: "Color",
        sort_order: 1,
        product_variant_options: [
          { id: "o4", group_id: "g2", value: "Red", sort_order: 1 },
        ],
      },
      {
        id: "g1",
        product_id: "prod-1",
        name: "Size",
        sort_order: 2,
        product_variant_options: [
          { id: "o3", group_id: "g1", value: "L", sort_order: 3 },
          { id: "o1", group_id: "g1", value: "S", sort_order: 1 },
          { id: "o2", group_id: "g1", value: "M", sort_order: 2 },
        ],
      },
    ];
    resolveWith(rawGroups);

    const { fetchVariantGroups } = await import("../use-product-variants");
    const result = await fetchVariantGroups("prod-1");

    // Groups retain their source sort_order
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Color"); // sort_order 1
    expect(result[0].sort_order).toBe(1);
    expect(result[1].name).toBe("Size"); // sort_order 2
    expect(result[1].sort_order).toBe(2);

    // Options are sorted within each group
    expect(result[1].options.map((o) => o.value)).toEqual(["S", "M", "L"]);

    // Shape of each option
    expect(result[1].options[0]).toEqual(
      expect.objectContaining({ id: "o1", value: "S", sort_order: 1 }),
    );
  });

  it("returns empty array when data is null", async () => {
    resolveWith(null);

    const { fetchVariantGroups } = await import("../use-product-variants");
    const result = await fetchVariantGroups("prod-1");

    expect(result).toEqual([]);
  });

  it("handles groups with null product_variant_options", async () => {
    const rawGroups = [
      {
        id: "g1",
        product_id: "prod-1",
        name: "Size",
        sort_order: 1,
        product_variant_options: null,
      },
    ];
    resolveWith(rawGroups);

    const { fetchVariantGroups } = await import("../use-product-variants");
    const result = await fetchVariantGroups("prod-1");

    expect(result).toHaveLength(1);
    expect(result[0].options).toEqual([]);
  });

  it("throws when the query errors and calls capture", async () => {
    const dbError = new Error("Database connection failed");
    resolveWith(null, dbError);

    const { fetchVariantGroups } = await import("../use-product-variants");

    await expect(fetchVariantGroups("prod-1")).rejects.toThrow(
      "Database connection failed",
    );
    expect(capture).toHaveBeenCalledWith(dbError, {
      context: "fetchVariantGroups",
    });
  });
});

// ── Suite: fetchVariants ────────────────────────────────────────────────────

describe("fetchVariants", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("queries product_variants with the correct productId", async () => {
    resolveWith(null);
    const { fetchVariants } = await import("../use-product-variants");

    await fetchVariants("prod-1");

    expect(mockFrom).toHaveBeenCalledWith("product_variants");
    expect(mockSelect).toHaveBeenCalledWith(
      expect.stringContaining("product_variant_assignments"),
    );
    expect(mockEq).toHaveBeenCalledWith("product_id", "prod-1");
    expect(mockOrder).toHaveBeenCalledWith("created_at", {
      ascending: true,
    });
  });

  it("returns mapped variants with option labels and ids", async () => {
    const rawVariants = [
      {
        id: "v1",
        product_id: "prod-1",
        sku: "SKU-001",
        barcode: "123456",
        cost_price: 1000,
        sale_price: 1500,
        current_stock: 10,
        min_stock: 2,
        image_urls: ["https://example.com/img.jpg"],
        is_active: true,
        created_at: "2026-07-01T00:00:00Z",
        product_variant_assignments: [
          {
            id: "a1",
            option_id: "o1",
            product_variant_options: { value: "S", group_id: "g1" },
          },
          {
            id: "a2",
            option_id: "o2",
            product_variant_options: { value: "Red", group_id: "g2" },
          },
        ],
      },
    ];
    resolveWith(rawVariants);

    const { fetchVariants } = await import("../use-product-variants");
    const result = await fetchVariants("prod-1");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("v1");
    expect(result[0].sku).toBe("SKU-001");
    expect(result[0].barcode).toBe("123456");
    expect(result[0].cost_price).toBe(1000);
    expect(result[0].sale_price).toBe(1500);
    expect(result[0].current_stock).toBe(10);
    expect(result[0].min_stock).toBe(2);
    expect(result[0].image_urls).toEqual(["https://example.com/img.jpg"]);
    expect(result[0].is_active).toBe(true);
    expect(result[0].option_ids).toEqual(["o1", "o2"]);
    expect(result[0].option_labels).toBe("S / Red");
  });

  it("handles variants with no assignments", async () => {
    const rawVariants = [
      {
        id: "v1",
        product_id: "prod-1",
        sku: null,
        barcode: null,
        cost_price: null,
        sale_price: null,
        current_stock: null,
        min_stock: null,
        image_urls: null,
        is_active: null,
        created_at: null,
        product_variant_assignments: null,
      },
    ];
    resolveWith(rawVariants);

    const { fetchVariants } = await import("../use-product-variants");
    const result = await fetchVariants("prod-1");

    expect(result).toHaveLength(1);
    expect(result[0].option_ids).toEqual([]);
    expect(result[0].option_labels).toBe("");
  });

  it("handles assignments with null product_variant_options", async () => {
    const rawVariants = [
      {
        id: "v1",
        product_id: "prod-1",
        sku: null,
        barcode: null,
        cost_price: null,
        sale_price: null,
        current_stock: null,
        min_stock: null,
        image_urls: null,
        is_active: null,
        created_at: null,
        product_variant_assignments: [
          { id: "a1", option_id: "o1", product_variant_options: null },
        ],
      },
    ];
    resolveWith(rawVariants);

    const { fetchVariants } = await import("../use-product-variants");
    const result = await fetchVariants("prod-1");

    expect(result[0].option_labels).toBe("");
    expect(result[0].option_ids).toEqual(["o1"]);
  });

  it("returns empty array when data is null", async () => {
    resolveWith(null);

    const { fetchVariants } = await import("../use-product-variants");
    const result = await fetchVariants("prod-1");

    expect(result).toEqual([]);
  });

  it("throws when the query errors and calls capture", async () => {
    const dbError = new Error("Variant fetch failed");
    resolveWith(null, dbError);

    const { fetchVariants } = await import("../use-product-variants");

    await expect(fetchVariants("prod-1")).rejects.toThrow(
      "Variant fetch failed",
    );
    expect(capture).toHaveBeenCalledWith(dbError, {
      context: "fetchVariants",
    });
  });
});
