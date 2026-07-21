/**
 * Tests for `products/new/actions.ts` — createProduct.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";

import {
  createMockSupabase,
  mockActionCtx,
  formData,
  mockMod,
  registerDefaultMocks,
  resolved,
} from "./actions-helpers";

// ─── Global mocks ────────────────────────────────────────────────────
registerDefaultMocks();

let mockCtx: Record<string, unknown> = mockActionCtx();

const captureSpy = mock.fn(() => {});
mockMod("@zuiio/capture", {
  capture: captureSpy,
});

const revalidateEntitySpy = mock.fn(() => {});
const revalidateEntityTagSpy = mock.fn(() => {});
mockMod("@/lib/revalidate", {
  revalidateEntity: revalidateEntitySpy,
  revalidateEntityTag: revalidateEntityTagSpy,
  revalidateEntities: mock.fn(() => {}),
});

mockMod("@/lib/action-utils", {
  requireActionContext: mock.fn(async () => mockCtx),
});

let mockValidationError: string | null = null;
mockMod("@/lib/domain-rules", {
  validateProductInput: mock.fn(() => mockValidationError),
});

// ─── Lazy-loaded module ──────────────────────────────────────────────

let createProduct: (
  prev: { error?: string } | undefined,
  fd: FormData,
) => Promise<Record<string, unknown>>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/products/new/actions");
  createProduct = mod.createProduct as typeof createProduct;
});

// ─── Helpers ─────────────────────────────────────────────────────────

function resetMocks() {
  mockValidationError = null;
  revalidateEntitySpy.mock.resetCalls();
  revalidateEntityTagSpy.mock.resetCalls();
  captureSpy.mock.resetCalls();
}

/**
 * Build a mock supabase where a given table's `.select().eq().eq().maybeSingle()`
 * returns a specific result, and `.insert().select().single()` returns another.
 *
 * Needed because createMockSupabase tableOverrides only work for methods
 * called directly on the from() return — chained methods (after .select())
 * fall through to the inner chainDefaults object.
 */
function makeTableChain(overrides: {
  maybeSingleResult?: { data: unknown; error: unknown };
  singleResult?: { data: unknown; error: unknown };
}) {
  const chain: Record<string, unknown> = {};
  chain.select = mock.fn(() => chain);
  chain.insert = mock.fn(() => chain);
  chain.eq = mock.fn(() => chain);
  chain.neq = mock.fn(() => chain);
  chain.gt = mock.fn(() => chain);
  chain.gte = mock.fn(() => chain);
  chain.lt = mock.fn(() => chain);
  chain.in = mock.fn(() => chain);
  chain.not = mock.fn(() => chain);
  chain.is = mock.fn(() => chain);
  chain.order = mock.fn(() => chain);
  chain.limit = mock.fn(() => chain);
  chain.range = mock.fn(() => chain);
  chain.textSearch = mock.fn(() => chain);
  chain.returns = mock.fn(() => chain);
  chain.throwOnError = mock.fn(() => chain);
  if (overrides.maybeSingleResult) {
    chain.maybeSingle = mock.fn(() =>
      Promise.resolve(overrides.maybeSingleResult),
    );
  } else {
    chain.maybeSingle = mock.fn(() => resolved(null, null));
  }
  if (overrides.singleResult) {
    chain.single = mock.fn(() => Promise.resolve(overrides.singleResult));
  } else {
    chain.single = mock.fn(() => resolved({ id: "test-id" }));
  }
  return chain;
}

function makeSupabase(
  tableChains: Record<string, ReturnType<typeof makeTableChain>>,
) {
  const defaultChain = makeTableChain({});
  return {
    from: mock.fn((table: string) => tableChains[table] ?? defaultChain),
    rpc: mock.fn(() => resolved({}, null)),
  };
}

// ─── Tests ───────────────────────────────────────────────────────────

test("createProduct rejects validation error", async () => {
  resetMocks();
  mockValidationError = "Бүтээгдэхүүний нэр заавал байх ёстой";
  mockCtx = mockActionCtx();

  const fd = formData({ name: "" });
  const result = await createProduct(undefined, fd);

  assert.equal(result.error, "Бүтээгдэхүүний нэр заавал байх ёстой");
});

test("createProduct rejects when requireActionContext returns error", async () => {
  resetMocks();
  mockCtx = { error: "Зөвшөөрөлгүй" };

  const fd = formData({ name: "Test" });
  const result = await createProduct(undefined, fd);

  assert.equal(result.error, "Зөвшөөрөлгүй");
});

test("creates product without category or brand", async () => {
  resetMocks();
  const supabase = createMockSupabase();
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({
    name: "Widget",
    cost_price: "1000",
    sale_price: "2000",
    current_stock: "50",
    min_stock: "10",
  });
  const result = await createProduct(undefined, fd);

  assert.equal(result.success, true);
  // No category or brand tables were queried
  const fromCalls = supabase.from.mock.calls.map((c) => c.arguments[0]);
  assert.ok(!fromCalls.includes("categories"));
  assert.ok(!fromCalls.includes("brands"));
  assert.ok(fromCalls.includes("products"));
});

test("creates product with existing category name", async () => {
  resetMocks();
  const categoriesChain = makeTableChain({
    maybeSingleResult: { data: { id: "existing-cat-id" }, error: null },
  });
  const productsChain = makeTableChain({
    singleResult: { data: { id: "prod-1" }, error: null },
  });
  const supabase = makeSupabase({
    categories: categoriesChain,
    products: productsChain,
  });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({
    name: "Widget",
    cost_price: "500",
    sale_price: "1000",
    category_name: "Electronics",
  });
  const result = await createProduct(undefined, fd);

  assert.equal(result.success, true);
  // Should NOT have called insert on categories (found existing)
  assert.equal(categoriesChain.insert.mock.callCount(), 0);
  // Products insert should have used the existing category ID
  assert.equal(productsChain.insert.mock.callCount(), 1);
});

test("creates product with new category name (find-or-create inserts)", async () => {
  resetMocks();
  const categoriesChain = makeTableChain({
    maybeSingleResult: { data: null, error: null },
    singleResult: { data: { id: "new-cat-id" }, error: null },
  });
  const productsChain = makeTableChain({
    singleResult: { data: { id: "prod-2" }, error: null },
  });
  const supabase = makeSupabase({
    categories: categoriesChain,
    products: productsChain,
  });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({
    name: "Widget",
    cost_price: "100",
    sale_price: "200",
    category_name: "  NewCat  ",
  });
  const result = await createProduct(undefined, fd);

  assert.equal(result.success, true);
  // Should have called insert on categories (not found → create)
  assert.equal(categoriesChain.insert.mock.callCount(), 1);
  assert.equal(categoriesChain.select.mock.callCount(), 2); // select for check + select for created
});

test("creates product with existing brand name", async () => {
  resetMocks();
  const brandsChain = makeTableChain({
    maybeSingleResult: { data: { id: "existing-brand-id" }, error: null },
  });
  const productsChain = makeTableChain({
    singleResult: { data: { id: "prod-3" }, error: null },
  });
  const supabase = makeSupabase({
    brands: brandsChain,
    products: productsChain,
  });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({
    name: "Widget",
    cost_price: "500",
    sale_price: "1000",
    brand_name: "Samsung",
  });
  const result = await createProduct(undefined, fd);

  assert.equal(result.success, true);
  // Should NOT have called insert on brands (found existing)
  assert.equal(brandsChain.insert.mock.callCount(), 0);
});

test("creates product with new brand name (find-or-create inserts)", async () => {
  resetMocks();
  const brandsChain = makeTableChain({
    maybeSingleResult: { data: null, error: null },
    singleResult: { data: { id: "new-brand-id" }, error: null },
  });
  const productsChain = makeTableChain({
    singleResult: { data: { id: "prod-4" }, error: null },
  });
  const supabase = makeSupabase({
    brands: brandsChain,
    products: productsChain,
  });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({
    name: "Widget",
    cost_price: "100",
    sale_price: "200",
    brand_name: "NewBrand",
  });
  const result = await createProduct(undefined, fd);

  assert.equal(result.success, true);
  // Should have called insert on brands (not found → create)
  assert.equal(brandsChain.insert.mock.callCount(), 1);
  assert.equal(brandsChain.select.mock.callCount(), 2); // check + created
});

test("handles product insert error", async () => {
  resetMocks();
  const productsChain = makeTableChain({
    singleResult: { data: null, error: { message: "Insert failed" } },
  });
  const supabase = makeSupabase({ products: productsChain });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({ name: "Widget" });
  const result = await createProduct(undefined, fd);

  assert.equal(result.error, "Insert failed");
  assert.equal(result.success, undefined);
});

test("calls revalidateEntity and revalidateEntityTag on success", async () => {
  resetMocks();
  mockCtx = mockActionCtx();

  const fd = formData({ name: "Widget" });
  await createProduct(undefined, fd);

  assert.equal(revalidateEntitySpy.mock.callCount(), 1);
  assert.deepEqual(revalidateEntitySpy.mock.calls[0].arguments, ["products"]);

  assert.equal(revalidateEntityTagSpy.mock.callCount(), 1);
  assert.deepEqual(revalidateEntityTagSpy.mock.calls[0].arguments, [
    "products",
    "test-org-id",
  ]);
});

test("creates product with all basic fields", async () => {
  resetMocks();
  let capturedPayload: Record<string, unknown> | null = null;
  const productsChain = makeTableChain({
    singleResult: { data: { id: "prod-full" }, error: null },
  });
  // Intercept insert to capture the payload
  const originalInsert = productsChain.insert;
  productsChain.insert = mock.fn((payload: unknown) => {
    capturedPayload = payload as Record<string, unknown>;
    return originalInsert(payload);
  }) as typeof originalInsert;

  const supabase = makeSupabase({ products: productsChain });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({
    name: "  Full Product  ",
    cost_price: "1500",
    sale_price: "3000",
    current_stock: "50",
    min_stock: "10",
    sku: "SKU-001",
    barcode: "123456789",
    unit: "шт",
    image_url: "https://example.com/img.png",
  });
  const result = await createProduct(undefined, fd);

  assert.equal(result.success, true);
  assert.ok(capturedPayload);
  assert.equal(capturedPayload!.name, "Full Product"); // trimmed
  assert.equal(capturedPayload!.sku, "SKU-001");
  assert.equal(capturedPayload!.barcode, "123456789");
  assert.equal(capturedPayload!.unit, "шт");
  assert.equal(capturedPayload!.image_url, "https://example.com/img.png");
  assert.equal(capturedPayload!.cost_price, 1500);
  assert.equal(capturedPayload!.sale_price, 3000);
  assert.equal(capturedPayload!.current_stock, 50);
  assert.equal(capturedPayload!.min_stock, 10);
  assert.equal(capturedPayload!.organization_id, "test-org-id");
  assert.equal(capturedPayload!.is_public, false);
  assert.equal(capturedPayload!.has_variants, false);
});

test("handles duplicate sku error (code 23505)", async () => {
  resetMocks();
  const productsChain = makeTableChain({
    singleResult: {
      data: null,
      error: {
        code: "23505",
        message: 'duplicate key value violates unique constraint "products_sku_org_key"',
      },
    },
  });
  const supabase = makeSupabase({ products: productsChain });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({ name: "Widget", sku: "DUP-SKU" });
  const result = await createProduct(undefined, fd);

  assert.equal(
    result.error,
    'duplicate key value violates unique constraint "products_sku_org_key"',
  );
  assert.equal(result.success, undefined);
});

test("category create error is captured but product still created", async () => {
  resetMocks();

  // Category: not found on check, then create fails
  const categoriesChain = makeTableChain({
    maybeSingleResult: { data: null, error: null },
    singleResult: {
      data: null,
      error: { message: "Category create failed" },
    },
  });
  const productsChain = makeTableChain({
    singleResult: { data: { id: "prod-5" }, error: null },
  });
  const supabase = makeSupabase({
    categories: categoriesChain,
    products: productsChain,
  });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({
    name: "Widget",
    cost_price: "100",
    sale_price: "200",
    category_name: "BadCategory",
  });
  const result = await createProduct(undefined, fd);

  // Product creation still succeeds (categoryId stays null)
  assert.equal(result.success, true);
  // capture was called for the category create error
  const catCreateCapture = captureSpy.mock.calls.find(
    (c) => {
      const args = c.arguments;
      return (
        typeof args[1] === "object" &&
        args[1] !== null &&
        "context" in args[1] &&
        (args[1] as Record<string, unknown>).context ===
          "createProduct: create category"
      );
    },
  );
  assert.ok(catCreateCapture, "capture should be called for category create error");
});

test("sets has_variants false when no variant data provided", async () => {
  resetMocks();
  let capturedPayload: Record<string, unknown> | null = null;
  const productsChain = makeTableChain({
    singleResult: { data: { id: "prod-6" }, error: null },
  });
  const originalInsert = productsChain.insert;
  productsChain.insert = mock.fn((payload: unknown) => {
    capturedPayload = payload as Record<string, unknown>;
    return originalInsert(payload);
  }) as typeof originalInsert;

  const supabase = makeSupabase({ products: productsChain });
  mockCtx = mockActionCtx({ supabase });

  // No variant_groups or variant_data in formData
  const fd = formData({ name: "Simple Product" });
  const result = await createProduct(undefined, fd);

  assert.equal(result.success, true);
  assert.equal(capturedPayload!.has_variants, false);
});
