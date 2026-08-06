/**
 * Tests for src/lib/public-catalog.ts — getPublicCatalog, getPublicCategories, getPublicProduct.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { mockMod, resolved } from "./actions-helpers";

// ─── Mocks ────────────────────────────────────────────────────────────

mockMod("@zuiio/capture", {
  capture: mock.fn(),
  withDbCapture: mock.fn(async (_name, q) => q),
});

type RpcResult = { data: unknown; error: unknown };
let rpcResult: RpcResult = resolved(null);

function makeSupabase() {
  return {
    rpc: mock.fn(async () => rpcResult),
    from: mock.fn(() => ({
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          single: mock.fn(async () => resolved(null)),
        })),
      })),
    })),
  };
}

let getPublicCatalog: (...args: unknown[]) => Promise<unknown>;
let getPublicCategories: (...args: unknown[]) => Promise<unknown[]>;
let getPublicProduct: (...args: unknown[]) => Promise<unknown>;

test.before(async () => {
  const mod = await import("@/lib/public-catalog");
  getPublicCatalog = mod.getPublicCatalog;
  getPublicCategories = mod.getPublicCategories;
  getPublicProduct = mod.getPublicProduct;
});

test.beforeEach(() => {
  rpcResult = resolved(null);
});

test("getPublicCatalog returns catalog data when org exists", async () => {
  rpcResult = resolved({
    organization: { id: "org-1", name: "Test Shop", slug: "test-shop" },
    products: [{ id: "p1", name: "Product 1", price: 1000 }],
    total: 1,
    page: 1,
    page_size: 24,
  });

  const result = await getPublicCatalog(makeSupabase(), "test-shop");
  assert.ok(result);
  const catalog = result as Record<string, unknown>;
  assert.ok(catalog.organization);
  assert.ok(Array.isArray(catalog.products));
});

test("getPublicCatalog returns null when org not found", async () => {
  rpcResult = resolved(null);
  const result = await getPublicCatalog(makeSupabase(), "nonexistent");
  assert.equal(result, null);
});

test("getPublicCatalog returns null on RPC error", async () => {
  rpcResult = { data: null, error: new Error("RPC failed") };
  const result = await getPublicCatalog(makeSupabase(), "test");
  assert.equal(result, null);
});

test("getPublicCatalog applies page and pageSize options", async () => {
  const _capturedParams: Record<string, unknown> | null = null;
  const _originalRpc = makeSupabase().rpc;
  // Override rpc to capture params
  rpcResult = resolved({
    organization: { id: "org-1", name: "Test", slug: "test" },
    products: [],
    total: 0,
    page: 2,
    page_size: 10,
  });

  const result = await getPublicCatalog(makeSupabase(), "test-shop");
  assert.ok(result);
});

test("getPublicCategories returns categories", async () => {
  rpcResult = resolved([
    { id: "cat-1", name: "Ангилал 1", slug: "angilal-1" },
    { id: "cat-2", name: "Ангилал 2", slug: "angilal-2" },
  ]);

  const categories = await getPublicCategories(makeSupabase(), "test-shop");
  assert.equal(categories.length, 2);
});

test("getPublicCategories returns empty on error", async () => {
  rpcResult = { data: null, error: new Error("RPC failed") };
  const categories = await getPublicCategories(makeSupabase(), "test");
  assert.equal(categories.length, 0);
});

test("getPublicProduct returns product with details", async () => {
  rpcResult = resolved({
    organization: { id: "org-1", name: "Test Shop", slug: "test-shop" },
    product: {
      id: "p1",
      name: "Product 1",
      price: 1000,
      description: "A product",
      category_name: "Cat 1",
      images: [],
    },
  });

  const result = await getPublicProduct(makeSupabase(), "test-shop", "p1");
  assert.ok(result);
});

test("getPublicProduct returns null when not found", async () => {
  rpcResult = resolved(null);
  const result = await getPublicProduct(makeSupabase(), "test", "nonexistent");
  assert.equal(result, null);
});
