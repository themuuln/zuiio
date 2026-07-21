/**
 * Tests for `products/actions.ts` — updateProduct, deleteProduct,
 * toggleProductPublication.
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

/** Cast mock.module'd export to access .mock tracker (library boundary type mismatch). */
type MockedFn = { mock: { calls: { arguments: unknown[] }[]; callCount: () => number } };

// ─── Global mocks ────────────────────────────────────────────────────

registerDefaultMocks();

let mockCtx: Record<string, unknown> = mockActionCtx();

mockMod("@zuiio/capture", {
  capture: mock.fn(() => {}),
});


// Mock revalidate (actions import it)
const revalidateEntitySpy = mock.fn(() => {});
const revalidateEntityTagSpy = mock.fn(() => {});
mockMod("@/lib/revalidate", {
  revalidateEntity: revalidateEntitySpy,
  revalidateEntityTag: revalidateEntityTagSpy,
  revalidateEntities: mock.fn(() => {}),
});
mockMod("@/lib/action-utils", {
  requireActionContext: mock.fn(async () => mockCtx),
  requireWriteAction: mock.fn(async () => mockCtx),
});

// Mock domain-rules validation
let mockValidationError: string | null = null;
mockMod("@/lib/domain-rules", {
  validateProductInput: mock.fn(() => mockValidationError),
});

// Mock notification (not in default mocks)
mockMod("@/lib/notification", {
  checkLowStockAndNotify: mock.fn(() => {}),
});

// ─── Lazy-loaded module ──────────────────────────────────────────────

let updateProduct: (...args: unknown[]) => Promise<Record<string, unknown>>;
let deleteProduct: (...args: unknown[]) => Promise<Record<string, unknown>>;
let toggleProductPublication: (...args: unknown[]) => Promise<Record<string, unknown>>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/products/actions");
  updateProduct = mod.updateProduct as typeof updateProduct;
  deleteProduct = mod.deleteProduct as typeof deleteProduct;
  toggleProductPublication = mod.toggleProductPublication as typeof toggleProductPublication;
});

// ─── Helpers ─────────────────────────────────────────────────────────

function resetMocks() {
  mockValidationError = null;
}

// ─── Tests: updateProduct ────────────────────────────────────────────

test("updateProduct rejects missing id", async () => {
  resetMocks();
  mockCtx = mockActionCtx();

  const fd = formData({ name: "Test Product" });
  const result = await updateProduct(undefined, fd);
  assert.equal(result.error, "Бүтээгдэхүүний ID олдсонгүй.");
});

test("updateProduct rejects when validation fails", async () => {
  resetMocks();
  mockValidationError = "Нэр нь хоосон байж болохгүй.";
  mockCtx = mockActionCtx();

  const fd = formData({ id: "prod-1", name: "" });
  const result = await updateProduct(undefined, fd);
  assert.equal(result.error, "Нэр нь хоосон байж болохгүй.");
});

test("updateProduct resolves category_name to category_id via existing category", async () => {
  resetMocks();
  const supabase = createMockSupabase({
    categories: {
      maybeSingle: mock.fn(() => resolved({ id: "cat-existing" }, null)),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({ id: "prod-1", name: "Test Product", category_name: "Drinks" });
  const result = await updateProduct(undefined, fd);
  assert.deepEqual(result, { success: true });

  // Verify the categories query was made
  const fromCalls = (supabase.from as unknown as MockedFn).mock.calls;
  assert.ok(fromCalls.length > 0, "from() should have been called");
});

test("updateProduct creates category when category_name not found", async () => {
  resetMocks();
  const supabase = createMockSupabase({
    categories: {
      maybeSingle: mock.fn(() => resolved(null, null)),
      insert: mock.fn(() => ({
        select: mock.fn(() => ({
          single: mock.fn(() => resolved({ id: "cat-new" }, null)),
        })),
      })),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({ id: "prod-1", name: "Test Product", category_name: "New Category" });
  const result = await updateProduct(undefined, fd);
  assert.deepEqual(result, { success: true });
});

test("updateProduct calls supabase.update with correct fields", async () => {
  resetMocks();
  let capturedPayload: Record<string, unknown> | null = null;
  const supabase = createMockSupabase({
    products: {
      update: mock.fn((payload: unknown) => {
        capturedPayload = payload as Record<string, unknown>;
        return {
          eq: mock.fn(() => resolved(null, null)),
        };
      }),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({
    id: "prod-1",
    name: "  Test Product  ",
    cost_price: "5000",
    sale_price: "10000",
    current_stock: "100",
    min_stock: "10",
    sku: "SKU-001",
    barcode: "123456789",
    unit: "кг",
  });

  const result = await updateProduct(undefined, fd);
  assert.deepEqual(result, { success: true });

  // Verify key fields were passed (trimmed name, correct types)
  assert.ok(capturedPayload, "update payload should be set");
  const p = capturedPayload as Record<string, unknown>;
  assert.equal(p.name, "Test Product");
  assert.equal(p.cost_price, 5000);
  assert.equal(p.sale_price, 10000);
  assert.equal(p.current_stock, 100);
  assert.equal(p.sku, "SKU-001");
  assert.equal(p.barcode, "123456789");
  assert.equal(p.unit, "кг");
});

test("updateProduct handles supabase update error", async () => {
  resetMocks();
  const updateError = { message: "Database connection failed" };
  const supabase = createMockSupabase({
    products: {
      update: mock.fn(() => ({
        eq: mock.fn(() => resolved(null, updateError)),
      })),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({ id: "prod-1", name: "Test Product" });
  const result = await updateProduct(undefined, fd);
  assert.equal(result.error, "Database connection failed");
});

test("updateProduct returns success on valid update", async () => {
  resetMocks();
  mockCtx = mockActionCtx();

  const fd = formData({
    id: "prod-1",
    name: "Test Product",
    cost_price: "5000",
    sale_price: "10000",
  });
  const result = await updateProduct(undefined, fd);
  assert.deepEqual(result, { success: true });
});

test("updateProduct calls revalidateEntity and revalidateEntityTag on success", async () => {
  resetMocks();
  mockCtx = mockActionCtx();

  const fd = formData({ id: "prod-1", name: "Test Product" });
  await updateProduct(undefined, fd);

  assert.ok(
    revalidateEntitySpy.mock.calls.length > 0,
    "revalidateEntity should have been called",
  );
  assert.ok(
    revalidateEntityTagSpy.mock.calls.length > 0,
    "revalidateEntityTag should have been called",
  );
});
test("updateProduct processes variant groups and variant data", async () => {
  resetMocks();
  const supabase = createMockSupabase({
    product_variants: {
      select: mock.fn(() => ({
        eq: mock.fn(() => resolved([], null)),
      })),
    },
    product_variant_groups: {
      select: mock.fn(() => ({
        eq: mock.fn(() => resolved([], null)),
      })),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const variantGroups = JSON.stringify([
    {
      id: "vg-1",
      name: "Size",
      options: [{ id: "opt-1", value: "Large" }],
    },
  ]);
  const variantData = JSON.stringify([
    {
      sku: "VAR-001",
      cost_price: 3000,
      sale_price: 7000,
      current_stock: 5,
      option_ids: ["opt-1"],
      image_url: null,
    },
  ]);

  const fd = formData({
    id: "prod-1",
    name: "Test Product",
    variant_groups: variantGroups,
    variant_data: variantData,
  });
  const result = await updateProduct(undefined, fd);
  assert.deepEqual(result, { success: true });
});

test("updateProduct returns variant error on malformed JSON", async () => {
  resetMocks();
  mockCtx = mockActionCtx();

  const fd = formData({
    id: "prod-1",
    name: "Test Product",
    variant_groups: "not-json",
    variant_data: "also-not-json",
  });
  const result = await updateProduct(undefined, fd);
  assert.equal(
    result.error,
    "Бүтээгдэхүүн шинэчлэгдсэн боловч вариантуудыг хадгалахад алдаа гарлаа.",
  );
});

// ─── Tests: deleteProduct ────────────────────────────────────────────

test("deleteProduct rejects missing id", async () => {
  resetMocks();
  mockCtx = mockActionCtx();

  const fd = formData({});
  const result = await deleteProduct(undefined, fd);
  assert.equal(result.error, "Бүтээгдэхүүний ID олдсонгүй.");
});

test("deleteProduct calls supabase.update for soft delete", async () => {
  resetMocks();
  let capturedPayload: unknown = null;
  const supabase = createMockSupabase({
    products: {
      update: mock.fn((payload: unknown) => {
        capturedPayload = payload;
        return {
          eq: mock.fn(() => ({
            eq: mock.fn(() => resolved(null, null)),
          })),
        };
      }),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({ id: "prod-1" });
  const result = await deleteProduct(undefined, fd);
  assert.deepEqual(result, { success: true });

  // Verify soft-delete: deleted_at should be set (string timestamp)
  assert.ok(capturedPayload, "update payload should be set");
  const p = capturedPayload as Record<string, unknown>;
  assert.ok(p.deleted_at, "deleted_at should be set");
  assert.equal(typeof p.deleted_at, "string");
});

test("deleteProduct returns success on valid delete", async () => {
  resetMocks();
  mockCtx = mockActionCtx();

  const fd = formData({ id: "prod-1" });
  const result = await deleteProduct(undefined, fd);
  assert.deepEqual(result, { success: true });
});

test("deleteProduct handles DB error", async () => {
  resetMocks();
  const deleteError = { message: "Permission denied" };
  const supabase = createMockSupabase({
    products: {
      update: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => resolved(null, deleteError)),
        })),
      })),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({ id: "prod-1" });
  const result = await deleteProduct(undefined, fd);
  assert.equal(result.error, "Permission denied");
});

// ─── Tests: toggleProductPublication ─────────────────────────────────

test("toggleProductPublication accepts productId and isPublic args", async () => {
  resetMocks();
  mockCtx = mockActionCtx();

  // Should not throw — verifying it accepts (string, boolean) not FormData
  const result = await toggleProductPublication("prod-1", true);
  assert.deepEqual(result, { success: true });
});

test("toggleProductPublication calls supabase.update with correct fields", async () => {
  resetMocks();
  let capturedPayload: unknown = null;
  const supabase = createMockSupabase({
    products: {
      update: mock.fn((payload: unknown) => {
        capturedPayload = payload;
        return {
          eq: mock.fn(() => ({
            eq: mock.fn(() => resolved(null, null)),
          })),
        };
      }),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  await toggleProductPublication("prod-1", true);

  assert.ok(capturedPayload, "update payload should be set");
  const p = capturedPayload as Record<string, unknown>;
  assert.equal(p.is_public, true);
  assert.ok(p.published_at, "published_at should be set when isPublic is true");
});

test("toggleProductPublication sets published_at to null when unpublishing", async () => {
  resetMocks();
  let capturedPayload: unknown = null;
  const supabase = createMockSupabase({
    products: {
      update: mock.fn((payload: unknown) => {
        capturedPayload = payload;
        return {
          eq: mock.fn(() => ({
            eq: mock.fn(() => resolved(null, null)),
          })),
        };
      }),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  await toggleProductPublication("prod-1", false);

  assert.ok(capturedPayload, "update payload should be set");
  const p = capturedPayload as Record<string, unknown>;
  assert.equal(p.is_public, false);
  assert.equal(p.published_at, null);
});

test("toggleProductPublication returns success", async () => {
  resetMocks();
  mockCtx = mockActionCtx();

  const result = await toggleProductPublication("prod-1", true);
  assert.deepEqual(result, { success: true });
});

test("toggleProductPublication handles DB error", async () => {
  resetMocks();
  const toggleError = { message: "Row not found" };
  const supabase = createMockSupabase({
    products: {
      update: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => resolved(null, toggleError)),
        })),
      })),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await toggleProductPublication("prod-1", true);
  assert.equal(result.error, "Нийтлэх статус өөрчлөхөд алдаа гарлаа.");
});

test("toggleProductPublication rejects when requireActionContext fails", async () => {
  mockCtx = { error: "Нэвтрэх эрх хүрэлцэхгүй." };

  const result = await toggleProductPublication("prod-1", true);
  assert.equal(result.error, "Нэвтрэх эрх хүрэлцэхгүй.");
});
