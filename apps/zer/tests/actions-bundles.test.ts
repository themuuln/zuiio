/**
 * Tests for `products/bundles/actions.ts` — createBundle, updateBundle, deleteBundle.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";

import {
  formData,
  mockActionCtx,
  mockMod,
  registerDefaultMocks,
  resolved,
} from "./actions-helpers";

// ─── Global mocks ────────────────────────────────────────────────────

registerDefaultMocks();

let mockCtx: Record<string, unknown> = mockActionCtx();

const captureMock = mock.fn(() => {});
mockMod("@zuiio/capture", { capture: captureMock });

const revalidateEntitiesMock = mock.fn(() => {});
mockMod("@/lib/revalidate", { revalidateEntities: revalidateEntitiesMock });

mockMod("@/lib/action-utils", {
  requireActionContext: mock.fn(async () => mockCtx),
  requireWriteAction: mock.fn(async () => mockCtx),
});

// ─── Lazy-loaded module ──────────────────────────────────────────────

let createBundle: (
  prev: undefined,
  fd: FormData,
) => Promise<Record<string, unknown>>;
let updateBundle: (
  prev: undefined,
  fd: FormData,
) => Promise<Record<string, unknown>>;
let deleteBundle: (bundleId: string) => Promise<Record<string, unknown>>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/products/bundles/actions");
  createBundle = mod.createBundle;
  updateBundle = mod.updateBundle;
  deleteBundle = mod.deleteBundle;
});

// ─── Helpers ─────────────────────────────────────────────────────────

function resetMocks() {
  mockCtx = mockActionCtx();
  captureMock.mock.resetCalls();
  revalidateEntitiesMock.mock.resetCalls();
}

// ─── Tests: createBundle ─────────────────────────────────────────────

test("createBundle rejects missing name", async () => {
  resetMocks();
  const fd = formData({
    items: JSON.stringify([
      { product_id: "p1", variant_id: null, quantity: 2 },
    ]),
  });
  const result = await createBundle(undefined, fd);
  assert.equal(result.error, "Багцын нэр шаардлагатай.");
});

test("createBundle rejects missing items", async () => {
  resetMocks();
  const fd = formData({ name: "Bundle A" });
  const result = await createBundle(undefined, fd);
  assert.equal(result.error, "Багцын барааны мэдээлэл шаардлагатай.");
});

test("createBundle rejects empty items array", async () => {
  resetMocks();
  const fd = formData({ name: "Bundle A", items: "[]" });
  const result = await createBundle(undefined, fd);
  assert.equal(result.error, "Дор хаяж нэг бараа оруулна уу.");
});

test("createBundle creates bundle successfully with product items", async () => {
  resetMocks();
  const supabase = mockCtx.supabase;
  mockCtx = mockActionCtx({ supabase });

  const items = JSON.stringify([
    { product_id: "prod-1", variant_id: null, quantity: 3 },
    { product_id: "prod-2", variant_id: null, quantity: 1 },
  ]);

  const fd = formData({
    name: "Test Bundle",
    sku: "BUN-001",
    sale_price: "15000",
    description: "A test bundle",
    items,
  });

  const result = await createBundle(undefined, fd);
  assert.deepEqual(result, { success: true, error: undefined });
  assert.equal(
    revalidateEntitiesMock.mock.calls.length,
    1,
    "revalidateEntities should be called once",
  );
});

test("createBundle handles bundle insert error", async () => {
  resetMocks();
  const supabase = {
    from: mock.fn((table: string) => {
      if (table === "product_bundles") {
        return {
          insert: mock.fn(() => ({
            select: mock.fn(() => ({
              single: mock.fn(() =>
                resolved(null, { message: "duplicate key" }),
              ),
            })),
          })),
        };
      }
      // Default chain for products cost lookup
      return {
        select: mock.fn(() => ({
          in: mock.fn(() => resolved([], null)),
        })),
      };
    }),
  };
  mockCtx = mockActionCtx({ supabase });

  const items = JSON.stringify([
    { product_id: "prod-1", variant_id: null, quantity: 2 },
  ]);

  const fd = formData({ name: "Bundle X", items });
  const result = await createBundle(undefined, fd);
  assert.ok(result.error?.includes("Багц үүсгэхэд алдаа гарлаа"));
  assert.ok(result.error?.includes("duplicate key"));
});

// ─── Tests: updateBundle ─────────────────────────────────────────────

test("updateBundle rejects missing id", async () => {
  resetMocks();
  const fd = formData({ name: "Bundle A" });
  const result = await updateBundle(undefined, fd);
  assert.equal(result.error, "Багцын ID олдсонгүй.");
});

test("updateBundle updates bundle without items (no recalculation)", async () => {
  resetMocks();
  const supabase = mockCtx.supabase;
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({
    id: "bundle-1",
    name: "Updated Bundle",
    sku: "BUN-002",
    sale_price: "20000",
    is_active: "true",
  });

  const result = await updateBundle(undefined, fd);
  assert.deepEqual(result, { success: true, error: undefined });
  assert.equal(
    revalidateEntitiesMock.mock.calls.length,
    1,
    "revalidateEntities should be called once",
  );
});

test("updateBundle updates bundle with items (recalculates cost price)", async () => {
  resetMocks();

  const productVariantsSelect = mock.fn(() => ({
    in: mock.fn(() => resolved([], null)),
  }));
  const productsSelect = mock.fn(() => ({
    in: mock.fn(() => resolved([], null)),
  }));

  const bundleItemsDeleteEq = mock.fn(() => resolved(null, null));
  const bundleItemsDelete = mock.fn(() => ({ eq: bundleItemsDeleteEq }));
  const bundleItemsInsert = mock.fn(() => resolved(null, null));

  const supabase = {
    from: mock.fn((table: string) => {
      if (table === "product_variants") {
        return { select: productVariantsSelect };
      }
      if (table === "products") {
        return { select: productsSelect };
      }
      if (table === "product_bundles") {
        return {
          update: mock.fn(() => ({
            eq: mock.fn(() => ({
              eq: mock.fn(() => resolved(null, null)),
            })),
          })),
        };
      }
      if (table === "product_bundle_items") {
        return {
          delete: bundleItemsDelete,
          insert: bundleItemsInsert,
        };
      }
      return {
        select: mock.fn(() => ({ in: mock.fn(() => resolved([], null)) })),
      };
    }),
  };
  mockCtx = mockActionCtx({ supabase });

  const items = JSON.stringify([
    { product_id: "prod-1", variant_id: "var-1", quantity: 2 },
    { product_id: "prod-2", variant_id: null, quantity: 3 },
  ]);

  const fd = formData({
    id: "bundle-1",
    name: "Updated Bundle",
    items,
  });

  const result = await updateBundle(undefined, fd);
  assert.deepEqual(result, { success: true, error: undefined });

  // Verify variant price lookup was made for the variant item
  assert.equal(
    productVariantsSelect.mock.calls.length,
    1,
    "should query product_variants for variant cost prices",
  );
  // Verify product price lookup was made for the non-variant item
  assert.equal(
    productsSelect.mock.calls.length,
    1,
    "should query products for product cost prices",
  );
  // Verify existing items were deleted
  assert.equal(
    bundleItemsDelete.mock.calls.length,
    1,
    "should delete existing bundle items",
  );
  // Verify new items were inserted
  assert.equal(
    bundleItemsInsert.mock.calls.length,
    1,
    "should insert new bundle items",
  );
});

test("updateBundle handles items JSON parse error", async () => {
  resetMocks();
  const supabase = mockCtx.supabase;
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({
    id: "bundle-1",
    name: "Bundle",
    items: "not-valid-json",
  });

  const result = await updateBundle(undefined, fd);
  assert.equal(result.error, "Барааны мэдээллийн формат буруу байна.");
  assert.equal(
    captureMock.mock.calls.length,
    1,
    "should capture the parse error",
  );
});

test("updateBundle handles update DB error", async () => {
  resetMocks();
  const supabase = {
    from: mock.fn((table: string) => {
      if (table === "product_bundles") {
        return {
          update: mock.fn(() => ({
            eq: mock.fn(() => ({
              eq: mock.fn(() =>
                resolved(null, { message: "connection refused" }),
              ),
            })),
          })),
        };
      }
      return {
        select: mock.fn(() => ({
          in: mock.fn(() => resolved([], null)),
        })),
      };
    }),
  };
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({
    id: "bundle-1",
    name: "Bundle",
  });

  const result = await updateBundle(undefined, fd);
  assert.ok(result.error?.includes("Багц шинэчлэхэд алдаа гарлаа"));
  assert.ok(result.error?.includes("connection refused"));
});

// ─── Tests: deleteBundle ─────────────────────────────────────────────

test("deleteBundle deletes successfully", async () => {
  resetMocks();
  const supabase = mockCtx.supabase;
  mockCtx = mockActionCtx({ supabase });

  const result = await deleteBundle("bundle-1");
  assert.deepEqual(result, { success: true, error: undefined });
});

test("deleteBundle handles DB error", async () => {
  resetMocks();
  const supabase = {
    from: mock.fn(() => ({
      delete: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() =>
            resolved(null, { message: "foreign key violation" }),
          ),
        })),
      })),
    })),
  };
  mockCtx = mockActionCtx({ supabase });

  const result = await deleteBundle("bundle-1");
  assert.ok(result.error?.includes("Багц устгахад алдаа гарлаа"));
  assert.ok(result.error?.includes("foreign key violation"));
  assert.equal(
    captureMock.mock.calls.length,
    1,
    "should capture the delete error",
  );
});

test("deleteBundle calls revalidateEntities on success", async () => {
  resetMocks();
  const supabase = mockCtx.supabase;
  mockCtx = mockActionCtx({ supabase });

  await deleteBundle("bundle-1");
  assert.equal(
    revalidateEntitiesMock.mock.calls.length,
    1,
    "revalidateEntities should be called once",
  );
  assert.deepEqual(revalidateEntitiesMock.mock.calls[0].arguments[0], [
    "products",
  ]);
});
