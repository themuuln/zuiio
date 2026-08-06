/**
 * Tests for settings/actions.ts IMPORT functions:
 *   importBrandPresets(formData)
 *   importProductPreset(formData)
 *   importProductPresetsByIds(presetIds)
 *
 * All use createServiceClient() from @/lib/supabase/server-service
 * (not ctx.supabase).
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { mockActionCtx, mockMod } from "./actions-helpers";

// ─── resolve helper ───────────────────────────────────────────────

function resolved<T>(data: T, error: unknown = null) {
  return Promise.resolve({ data, error });
}

// ─── Global mocks ─────────────────────────────────────────────────

const captureMock = mock.fn(() => {});
mockMod("@zuiio/capture", {
  capture: captureMock,
  withDbCapture: mock.fn(),
});

mockMod("next/cache", {
  revalidatePath: mock.fn(() => {}),
  revalidateTag: mock.fn(() => {}),
});
mockMod("next/server", { after: (fn: () => void) => fn() });
mockMod("server-only", {});
mockMod("next/navigation", { redirect: mock.fn(() => {}) });

const revalidateEntityMock = mock.fn((_entity: string) => {});
mockMod("@/lib/revalidate", { revalidateEntity: revalidateEntityMock });
const mockCtx = mockActionCtx();
mockMod("@/lib/action-utils", {
  requireActionContext: mock.fn(async () => mockCtx),
  requireAppContext: mock.fn(async () => mockCtx),
});

// ─── Mutable service client mock ──────────────────────────────────
// Each test reassigns mockFrom to control per-table chain behavior.

type MockCall = {
  mock: {
    callCount: () => number;
  };
};
type MockTable = Record<string, MockCall>;

let mockFrom: Record<string, MockTable> = {};
const mockServiceClient = {
  from: mock.fn((table: string): MockTable => mockFrom[table] ?? {}),
};
mockMod("@/lib/supabase/server-service", {
  createServiceClient: mock.fn(() => mockServiceClient),
});

type SettingsActionResult = {
  success?: boolean;
  count?: number;
  name?: string;
  error?: string;
};

let importBrandPresets: (formData: FormData) => Promise<SettingsActionResult>;
let importProductPreset: (formData: FormData) => Promise<SettingsActionResult>;
let importProductPresetsByIds: (
  presetIds: string[],
) => Promise<SettingsActionResult>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/settings/actions");
  importBrandPresets = mod.importBrandPresets;
  importProductPreset = mod.importProductPreset;
  importProductPresetsByIds = mod.importProductPresetsByIds;
});

function resetMocks() {
  captureMock.mock.resetCalls();
  revalidateEntityMock.mock.resetCalls();
  mockServiceClient.from.mock.resetCalls();
}

test.beforeEach(() => {
  resetMocks();
  mockFrom = {};
});

// ═══════════════════════════════════════════════════════════════════
// importBrandPresets
// ═══════════════════════════════════════════════════════════════════

test("importBrandPresets rejects missing brand_name", async () => {
  const result = await importBrandPresets(new FormData());
  assert.deepStrictEqual(result, { error: "Брэндийн нэр шаардлагатай." });
});

test("importBrandPresets imports presets for a brand successfully", async () => {
  const preset = {
    brand_name: "TestBrand",
    product_name: "Product1",
    product_sku: "SKU1",
    unit: "ш",
    cost_price: 1000,
    sale_price: 1500,
    min_stock: 5,
    category_name: "Cat1",
    brand_logo_url: null,
    sort_order: 0,
  };

  mockFrom = {
    product_presets: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          order: mock.fn(async () => resolved([preset], null)),
        })),
      })),
    },
    brands: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => ({
            maybeSingle: mock.fn(async () => resolved(null)),
          })),
        })),
      })),
      insert: mock.fn(() => ({
        select: mock.fn(() => ({
          single: mock.fn(async () => resolved({ id: "brand-1" })),
        })),
      })),
    },
    categories: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => ({
            maybeSingle: mock.fn(async () => resolved(null)),
          })),
        })),
      })),
      insert: mock.fn(() => ({
        select: mock.fn(() => ({
          single: mock.fn(async () => resolved({ id: "cat-1" })),
        })),
      })),
    },
    products: {
      insert: mock.fn(async () => resolved(null)),
    },
  };

  const fd = new FormData();
  fd.set("brand_name", "TestBrand");
  const result = await importBrandPresets(fd);

  assert.deepStrictEqual(result, { success: true, count: 1 });
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 2);
  assert.strictEqual(
    revalidateEntityMock.mock.calls[0].arguments[0],
    "products",
  );
  assert.strictEqual(
    revalidateEntityMock.mock.calls[1].arguments[0],
    "settings",
  );
});

test("importBrandPresets uses existing brand and category", async () => {
  const preset = {
    brand_name: "ExistingBrand",
    product_name: "P1",
    product_sku: "SKU-EX",
    unit: "ш",
    cost_price: 500,
    sale_price: 800,
    min_stock: 2,
    category_name: "CatX",
    brand_logo_url: null,
    sort_order: 0,
  };

  mockFrom = {
    product_presets: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          order: mock.fn(async () => resolved([preset], null)),
        })),
      })),
    },
    brands: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => ({
            maybeSingle: mock.fn(async () =>
              resolved({ id: "existing-brand" }),
            ),
          })),
        })),
      })),
      insert: mock.fn(() => ({
        select: mock.fn(() => ({
          single: mock.fn(async () => resolved({ id: "should-not-exist" })),
        })),
      })),
    },
    categories: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => ({
            maybeSingle: mock.fn(async () => resolved({ id: "existing-cat" })),
          })),
        })),
      })),
      insert: mock.fn(() => ({
        select: mock.fn(() => ({
          single: mock.fn(async () => resolved({ id: "should-not-exist" })),
        })),
      })),
    },
    products: {
      insert: mock.fn(async () => resolved(null)),
    },
  };

  const fd = new FormData();
  fd.set("brand_name", "ExistingBrand");
  const result = await importBrandPresets(fd);

  assert.deepStrictEqual(result, { success: true, count: 1 });
  // Brand and category should NOT be inserted — they already exist
  assert.strictEqual(mockFrom.brands.insert.mock.callCount(), 0);
  assert.strictEqual(mockFrom.categories.insert.mock.callCount(), 0);
});

test("importBrandPresets handles fetch error", async () => {
  mockFrom = {
    product_presets: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          order: mock.fn(async () =>
            resolved(null, { message: "DB connection failed" }),
          ),
        })),
      })),
    },
  };

  const fd = new FormData();
  fd.set("brand_name", "AnyBrand");
  const result = await importBrandPresets(fd);

  assert.deepStrictEqual(result, { error: "DB connection failed" });
  assert.strictEqual(captureMock.mock.callCount(), 1);
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 0);
});

// ═══════════════════════════════════════════════════════════════════
// importProductPreset
// ═══════════════════════════════════════════════════════════════════

test("importProductPreset rejects missing preset_id", async () => {
  const result = await importProductPreset(new FormData());
  assert.deepStrictEqual(result, { error: "Загварын ID шаардлагатай." });
});

test("importProductPreset imports single preset successfully", async () => {
  const preset = {
    id: "preset-1",
    brand_name: "BrandA",
    brand_logo_url: null,
    category_name: "CatA",
    product_sku: "SKU-A1",
    product_name: "Widget",
    unit: "ш",
    cost_price: 200,
    sale_price: 350,
    min_stock: 3,
  };

  mockFrom = {
    product_presets: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          single: mock.fn(async () => resolved(preset)),
        })),
      })),
    },
    products: {
      // SKU duplicate check — no existing product
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => ({
            is: mock.fn(() => ({
              maybeSingle: mock.fn(async () => resolved(null)),
            })),
          })),
        })),
      })),
      insert: mock.fn(async () => resolved(null)),
    },
    brands: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => ({
            maybeSingle: mock.fn(async () => resolved(null)),
          })),
        })),
      })),
      insert: mock.fn(() => ({
        select: mock.fn(() => ({
          single: mock.fn(async () => resolved({ id: "brand-a" })),
        })),
      })),
    },
    categories: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => ({
            maybeSingle: mock.fn(async () => resolved(null)),
          })),
        })),
      })),
      insert: mock.fn(() => ({
        select: mock.fn(() => ({
          single: mock.fn(async () => resolved({ id: "cat-a" })),
        })),
      })),
    },
  };

  const fd = new FormData();
  fd.set("preset_id", "preset-1");
  const result = await importProductPreset(fd);

  assert.deepStrictEqual(result, { success: true, name: "Widget" });
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 2);
});

test("importProductPreset handles SKU duplicate", async () => {
  const preset = {
    id: "preset-dup",
    brand_name: "BrandDup",
    brand_logo_url: null,
    category_name: null,
    product_sku: "DUP-SKU",
    product_name: "Dup Widget",
    unit: "ш",
    cost_price: 100,
    sale_price: 200,
    min_stock: 1,
  };

  mockFrom = {
    product_presets: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          single: mock.fn(async () => resolved(preset)),
        })),
      })),
    },
    products: {
      // SKU check — existing product found
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => ({
            is: mock.fn(() => ({
              maybeSingle: mock.fn(async () =>
                resolved({ id: "existing-prod" }),
              ),
            })),
          })),
        })),
      })),
    },
  };

  const fd = new FormData();
  fd.set("preset_id", "preset-dup");
  const result = await importProductPreset(fd);

  if (typeof result.error !== "string") {
    throw new Error("Expected duplicate SKU error");
  }
  assert.ok(result.error.includes("DUP-SKU"));
  // Early return — no revalidation
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 0);
});

test("importProductPreset creates brand and category", async () => {
  const preset = {
    id: "preset-new",
    brand_name: "NewBrand",
    brand_logo_url: "https://example.com/logo.png",
    category_name: "NewCat",
    product_sku: "NEW-SKU",
    product_name: "New Widget",
    unit: "кг",
    cost_price: 50,
    sale_price: 80,
    min_stock: 10,
  };

  mockFrom = {
    product_presets: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          single: mock.fn(async () => resolved(preset)),
        })),
      })),
    },
    products: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => ({
            is: mock.fn(() => ({
              maybeSingle: mock.fn(async () => resolved(null)),
            })),
          })),
        })),
      })),
      insert: mock.fn(async () => resolved(null)),
    },
    brands: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => ({
            maybeSingle: mock.fn(async () => resolved(null)),
          })),
        })),
      })),
      insert: mock.fn(() => ({
        select: mock.fn(() => ({
          single: mock.fn(async () => resolved({ id: "new-brand-id" })),
        })),
      })),
    },
    categories: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => ({
            maybeSingle: mock.fn(async () => resolved(null)),
          })),
        })),
      })),
      insert: mock.fn(() => ({
        select: mock.fn(() => ({
          single: mock.fn(async () => resolved({ id: "new-cat-id" })),
        })),
      })),
    },
  };

  const fd = new FormData();
  fd.set("preset_id", "preset-new");
  const result = await importProductPreset(fd);

  assert.deepStrictEqual(result, { success: true, name: "New Widget" });
  assert.strictEqual(mockFrom.brands.insert.mock.callCount(), 1);
  assert.strictEqual(mockFrom.categories.insert.mock.callCount(), 1);
});

// ═══════════════════════════════════════════════════════════════════
// importProductPresetsByIds
// ═══════════════════════════════════════════════════════════════════

test("importProductPresetsByIds rejects empty presetIds array", async () => {
  const result = await importProductPresetsByIds([]);
  assert.deepStrictEqual(result, { error: "Бүтээгдэхүүн сонгоогүй байна." });
});

test("importProductPresetsByIds imports multiple presets with dedup", async () => {
  const presets = [
    {
      brand_name: "BrandX",
      brand_logo_url: null,
      category_name: "SharedCat",
      product_sku: "X1",
      product_name: "Product X1",
      unit: "ш",
      cost_price: 100,
      sale_price: 150,
      min_stock: 1,
    },
    {
      brand_name: "BrandX",
      brand_logo_url: null,
      category_name: "SharedCat",
      product_sku: "X2",
      product_name: "Product X2",
      unit: "ш",
      cost_price: 200,
      sale_price: 300,
      min_stock: 2,
    },
  ];

  mockFrom = {
    product_presets: {
      select: mock.fn(() => ({
        in: mock.fn(async () => resolved(presets)),
      })),
    },
    brands: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => ({
            maybeSingle: mock.fn(async () => resolved({ id: "brand-x" })),
          })),
        })),
      })),
    },
    categories: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => ({
            maybeSingle: mock.fn(async () => resolved({ id: "shared-cat" })),
          })),
        })),
      })),
    },
    products: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => ({
            is: mock.fn(() => ({
              maybeSingle: mock.fn(async () => resolved(null)),
            })),
          })),
        })),
      })),
      insert: mock.fn(async () => resolved(null)),
    },
  };

  const result = await importProductPresetsByIds(["p1", "p2"]);

  assert.deepStrictEqual(result, { success: true, count: 2 });
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 2);
  assert.strictEqual(mockFrom.products.insert.mock.callCount(), 2);
});

test("importProductPresetsByIds handles SKU duplicates by skipping", async () => {
  const presets = [
    {
      brand_name: "BrandY",
      brand_logo_url: null,
      category_name: null,
      product_sku: "Y1",
      product_name: "Product Y1",
      unit: "ш",
      cost_price: 100,
      sale_price: 150,
      min_stock: 1,
    },
    {
      brand_name: "BrandY",
      brand_logo_url: null,
      category_name: null,
      product_sku: "Y2",
      product_name: "Product Y2",
      unit: "ш",
      cost_price: 200,
      sale_price: 300,
      min_stock: 2,
    },
  ];

  // Y1 already exists in org; Y2 is new
  let skuCheckCount = 0;

  mockFrom = {
    product_presets: {
      select: mock.fn(() => ({
        in: mock.fn(async () => resolved(presets)),
      })),
    },
    brands: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => ({
            maybeSingle: mock.fn(async () => resolved({ id: "brand-y" })),
          })),
        })),
      })),
    },
    products: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => ({
            is: mock.fn(() => ({
              maybeSingle: mock.fn(async () => {
                skuCheckCount++;
                // First check (Y1) → exists, second (Y2) → not found
                return resolved(
                  skuCheckCount === 1 ? { id: "existing-y1" } : null,
                );
              }),
            })),
          })),
        })),
      })),
      insert: mock.fn(async () => resolved(null)),
    },
  };

  const result = await importProductPresetsByIds(["p1", "p2"]);

  // Only Y2 inserted — Y1 skipped as SKU duplicate
  assert.deepStrictEqual(result, { success: true, count: 1 });
  assert.strictEqual(mockFrom.products.insert.mock.callCount(), 1);
});

test("importProductPresetsByIds caches brand and category across presets", async () => {
  const presets = [
    {
      brand_name: "CachedBrand",
      brand_logo_url: null,
      category_name: "CachedCat",
      product_sku: "C1",
      product_name: "Product C1",
      unit: "ш",
      cost_price: 100,
      sale_price: 150,
      min_stock: 1,
    },
    {
      brand_name: "CachedBrand",
      brand_logo_url: null,
      category_name: "CachedCat",
      product_sku: "C2",
      product_name: "Product C2",
      unit: "ш",
      cost_price: 200,
      sale_price: 300,
      min_stock: 2,
    },
  ];

  mockFrom = {
    product_presets: {
      select: mock.fn(() => ({
        in: mock.fn(async () => resolved(presets)),
      })),
    },
    brands: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => ({
            maybeSingle: mock.fn(async () => resolved({ id: "cached-brand" })),
          })),
        })),
      })),
      insert: mock.fn(() => ({
        select: mock.fn(() => ({
          single: mock.fn(async () => resolved({ id: "brand-new" })),
        })),
      })),
    },
    categories: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => ({
            maybeSingle: mock.fn(async () => resolved({ id: "cached-cat" })),
          })),
        })),
      })),
      insert: mock.fn(() => ({
        select: mock.fn(() => ({
          single: mock.fn(async () => resolved({ id: "cat-new" })),
        })),
      })),
    },
    products: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => ({
            is: mock.fn(() => ({
              maybeSingle: mock.fn(async () => resolved(null)),
            })),
          })),
        })),
      })),
      insert: mock.fn(async () => resolved(null)),
    },
  };

  const result = await importProductPresetsByIds(["c1", "c2"]);

  assert.deepStrictEqual(result, { success: true, count: 2 });
  // Brand select called ONCE — second preset hits cache
  assert.strictEqual(mockFrom.brands.select.mock.callCount(), 1);
  // Category select called ONCE — second preset hits cache
  assert.strictEqual(mockFrom.categories.select.mock.callCount(), 1);
  // No brand/category creation — both exist in DB
  assert.strictEqual(mockFrom.brands.insert.mock.callCount(), 0);
  assert.strictEqual(mockFrom.categories.insert.mock.callCount(), 0);
});
