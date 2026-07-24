/**
 * Tests for src/lib/stock-utils.ts
 */
import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { mockMod, resolved } from "./actions-helpers";
import type {
  SupabaseDb,
  fetchProductsForStock as FetchProductsForStockFn,
  fetchVariantsForStock as FetchVariantsForStockFn,
  decrementProductStock as DecrementProductStockFn,
  decrementVariantStock as DecrementVariantStockFn,
  incrementProductStock as IncrementProductStockFn,
  createStockMovements as CreateStockMovementsFn,
} from "@/lib/stock-utils";

// ─── Mocks ────────────────────────────────────────────────────────────

const captureSpy = mock.fn();

mockMod("@zuiio/capture", {
  capture: captureSpy,
  withDbCapture: mock.fn(async (_name: string, query: unknown) => {
    // withDbCapture wraps a query; if it's a thenable (chain / promise), pass through
    if (query && typeof query === "object" && "then" in (query as object)) {
      return query;
    }
    return { data: null, error: null };
  }),
});
mockMod("server-only", {});

// ─── Chain builder ────────────────────────────────────────────────────

/**
 * Build a chainable mock query object that resolves to `result`.
 * The chain itself is thenable (like a Supabase PostgrestBuilder),
 * so `await chain` after intermediate methods yields `{ data, error }`.
 * Terminal methods (.single / .maybeSingle) return resolved promises.
 */
function chainResult(result: { data: unknown; error: unknown }) {
  const self: Record<string, unknown> = {};
  for (const m of [
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "in",
    "not",
    "is",
    "order",
    "limit",
    "range",
    "textSearch",
    "returns",
    "throwOnError",
  ]) {
    self[m] = mock.fn(() => self);
  }
  self.single = mock.fn(() => resolved(result.data, result.error));
  self.maybeSingle = mock.fn(() => resolved(result.data, result.error));
  // Thenable: `await chain` resolves to { data, error }
  self.then = (
    onFulfilled: (v: typeof result) => void,
    onRejected?: (e: unknown) => void,
  ) => Promise.resolve(result).then(onFulfilled, onRejected);
  return self;
}

/**
 * Create a mock Supabase client where `from(table)` pops the next result
 * from `tableResults[table]` on each call.
 */
function makeSupabase(
  tableResults: Record<string, Array<{ data: unknown; error: unknown }>>,
) {
  const counts: Record<string, number> = {};
  return {
    from: mock.fn((table: string) => {
      const results = tableResults[table] || [];
      const idx = counts[table] || 0;
      counts[table] = idx + 1;
      return chainResult(results[idx] || { data: null, error: null });
    }),
  };
}

// ─── Lazy imports (dynamic — mockMod must register before import) ─────

let fetchProductsForStock: typeof FetchProductsForStockFn;
let fetchVariantsForStock: typeof FetchVariantsForStockFn;
let decrementProductStock: typeof DecrementProductStockFn;
let decrementVariantStock: typeof DecrementVariantStockFn;
let incrementProductStock: typeof IncrementProductStockFn;
let createStockMovements: typeof CreateStockMovementsFn;

test.before(async () => {
  const mod = await import("@/lib/stock-utils");
  fetchProductsForStock = mod.fetchProductsForStock;
  fetchVariantsForStock = mod.fetchVariantsForStock;
  decrementProductStock = mod.decrementProductStock;
  decrementVariantStock = mod.decrementVariantStock;
  incrementProductStock = mod.incrementProductStock;
  createStockMovements = mod.createStockMovements;
});

test.beforeEach(() => {
  captureSpy.mock.resetCalls();
});

// ─── fetchProductsForStock ───────────────────────────────────────────

test("fetchProductsForStock returns map of products", async () => {
  const products = [
    { id: "p1", name: "Widget", current_stock: 10, unit: "pcs" },
    { id: "p2", name: "Gadget", current_stock: null, unit: null },
  ];
  const supabase = makeSupabase({ products: [{ data: products, error: null }] });

  const result = await fetchProductsForStock(
    supabase as unknown as SupabaseDb,
    "org-1",
    ["p1", "p2"],
  );

  assert.ok(result instanceof Map);
  assert.equal(result.size, 2);
  assert.equal(result.get("p1")?.name, "Widget");
  assert.equal(result.get("p1")?.current_stock, 10);
  assert.equal(result.get("p2")?.name, "Gadget");
  assert.equal(result.get("p2")?.current_stock, null);
});

test("fetchProductsForStock returns empty map for empty product IDs", async () => {
  const supabase = makeSupabase({ products: [{ data: [], error: null }] });

  const result = await fetchProductsForStock(
    supabase as unknown as SupabaseDb,
    "org-1",
    [],
  );

  assert.ok(result instanceof Map);
  assert.equal(result.size, 0);
});

test("fetchProductsForStock calls capture on DB error and returns empty map", async () => {
  const supabase = makeSupabase({
    products: [{ data: null, error: { message: "db error" } }],
  });

  const result = await fetchProductsForStock(
    supabase as unknown as SupabaseDb,
    "org-1",
    ["p1"],
  );

  assert.ok(result instanceof Map);
  assert.equal(result.size, 0);
  assert.ok(captureSpy.mock.callCount() > 0);
});

// ─── fetchVariantsForStock ───────────────────────────────────────────

test("fetchVariantsForStock returns map of variants", async () => {
  const variants = [
    { id: "v1", current_stock: 5, product_id: "p1" },
    { id: "v2", current_stock: null, product_id: null },
  ];
  const supabase = makeSupabase({
    product_variants: [{ data: variants, error: null }],
  });

  const result = await fetchVariantsForStock(
    supabase as unknown as SupabaseDb,
    ["v1", "v2"],
  );

  assert.ok(result instanceof Map);
  assert.equal(result.size, 2);
  assert.equal(result.get("v1")?.current_stock, 5);
  assert.equal(result.get("v1")?.product_id, "p1");
  // product_id null coerced to "" by source
  assert.equal(result.get("v2")?.product_id, "");
});

test("fetchVariantsForStock calls capture on DB error and returns empty map", async () => {
  const supabase = makeSupabase({
    product_variants: [{ data: null, error: { message: "db error" } }],
  });

  const result = await fetchVariantsForStock(
    supabase as unknown as SupabaseDb,
    ["v1"],
  );

  assert.ok(result instanceof Map);
  assert.equal(result.size, 0);
  assert.ok(captureSpy.mock.callCount() > 0);
});

// ─── decrementProductStock ───────────────────────────────────────────

test("decrementProductStock returns updated product on success", async () => {
  const product = { id: "p1", current_stock: 10, name: "Widget" };
  const updated = { id: "p1", current_stock: 7, name: "Widget" };
  const supabase = makeSupabase({
    products: [
      { data: product, error: null }, // fetch
      { data: updated, error: null }, // update + maybeSingle
    ],
  });

  const result = await decrementProductStock(
    supabase as unknown as SupabaseDb,
    "org-1",
    "p1",
    3,
  );

  assert.deepEqual(result, updated);
});

test("decrementProductStock returns null when insufficient stock (gte guard)", async () => {
  const product = { id: "p1", current_stock: 2, name: "Widget" };
  const supabase = makeSupabase({
    products: [
      { data: product, error: null }, // fetch — stock = 2
      { data: null, error: null }, // update — gte guard fails → maybeSingle returns null
    ],
  });

  const result = await decrementProductStock(
    supabase as unknown as SupabaseDb,
    "org-1",
    "p1",
    5,
  );

  assert.equal(result, null);
});

test("decrementProductStock returns null when product not found", async () => {
  const supabase = makeSupabase({
    products: [{ data: null, error: null }], // single returns null
  });

  const result = await decrementProductStock(
    supabase as unknown as SupabaseDb,
    "org-1",
    "missing",
    1,
  );

  assert.equal(result, null);
});

// ─── decrementVariantStock ───────────────────────────────────────────

test("decrementVariantStock returns true on success", async () => {
  const variant = { id: "v1", current_stock: 10 };
  const updated = { id: "v1" };
  const supabase = makeSupabase({
    product_variants: [
      { data: variant, error: null }, // fetch
      { data: updated, error: null }, // update + maybeSingle
    ],
  });

  const result = await decrementVariantStock(
    supabase as unknown as SupabaseDb,
    "v1",
    3,
  );

  assert.equal(result, true);
});

test("decrementVariantStock returns false when variant not found", async () => {
  const supabase = makeSupabase({
    product_variants: [{ data: null, error: null }], // single returns null
  });

  const result = await decrementVariantStock(
    supabase as unknown as SupabaseDb,
    "missing",
    1,
  );

  assert.equal(result, false);
});

test("decrementVariantStock returns false when gte guard prevents negative stock", async () => {
  const variant = { id: "v1", current_stock: 2 };
  const supabase = makeSupabase({
    product_variants: [
      { data: variant, error: null }, // fetch — stock = 2
      { data: null, error: null }, // update — gte guard fails
    ],
  });

  const result = await decrementVariantStock(
    supabase as unknown as SupabaseDb,
    "v1",
    5,
  );

  assert.equal(result, false);
});

// ─── incrementProductStock ───────────────────────────────────────────

test("incrementProductStock returns true on success", async () => {
  const product = { current_stock: 10 };
  const supabase = makeSupabase({
    products: [
      { data: product, error: null }, // fetch
      { data: null, error: null }, // update — no error
    ],
  });

  const result = await incrementProductStock(
    supabase as unknown as SupabaseDb,
    "org-1",
    "p1",
    5,
  );

  assert.equal(result, true);
});

test("incrementProductStock returns false when product not found", async () => {
  const supabase = makeSupabase({
    products: [{ data: null, error: null }], // single returns null
  });

  const result = await incrementProductStock(
    supabase as unknown as SupabaseDb,
    "org-1",
    "missing",
    1,
  );

  assert.equal(result, false);
});

test("incrementProductStock returns false on update error", async () => {
  const product = { current_stock: 10 };
  const supabase = makeSupabase({
    products: [
      { data: product, error: null }, // fetch
      { data: null, error: { message: "update failed" } }, // update error
    ],
  });

  const result = await incrementProductStock(
    supabase as unknown as SupabaseDb,
    "org-1",
    "p1",
    5,
  );

  assert.equal(result, false);
});

// ─── createStockMovements ────────────────────────────────────────────

test("createStockMovements inserts items and returns empty object", async () => {
  const supabase = makeSupabase({
    stock_movements: [{ data: null, error: null }],
  });

  const result = await createStockMovements(
    supabase as unknown as SupabaseDb,
    {
      organizationId: "org-1",
      branchId: "br-1",
      type: "in",
      reference: "PO-001",
      createdBy: "user-1",
      items: [
        { productId: "p1", quantity: 10, unitCost: 5000 },
        { productId: "p2", quantity: 5, unitCost: 12000, variantId: "v1" },
      ],
    },
  );

  assert.deepEqual(result, {});
});

test("createStockMovements returns error message on insert failure", async () => {
  const supabase = makeSupabase({
    stock_movements: [{ data: null, error: { message: "insert failed" } }],
  });

  const result = await createStockMovements(
    supabase as unknown as SupabaseDb,
    {
      organizationId: "org-1",
      branchId: "br-1",
      type: "out",
      reference: "SO-001",
      createdBy: "user-1",
      items: [{ productId: "p1", quantity: 2, unitCost: 3000 }],
    },
  );

  assert.equal(result.error, "insert failed");
});

test("createStockMovements with empty items returns success", async () => {
  const supabase = makeSupabase({
    stock_movements: [{ data: null, error: null }],
  });

  const result = await createStockMovements(
    supabase as unknown as SupabaseDb,
    {
      organizationId: "org-1",
      branchId: "br-1",
      type: "in",
      reference: "PO-002",
      createdBy: "user-1",
      items: [],
    },
  );

  assert.deepEqual(result, {});
});
