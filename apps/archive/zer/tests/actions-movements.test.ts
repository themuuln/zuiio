/**
 * Tests for `inventory/movements/actions.ts` — createStockMovement.
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

mockMod("@zuiio/capture", {
  capture: mock.fn(() => {}),
});

// Keep a reference so tests can assert on calls without re-mocking
const revalidateEntitiesMock = mock.fn(() => {});
mockMod("@/lib/revalidate", {
  revalidateEntities: revalidateEntitiesMock,
  revalidateEntityTag: mock.fn(() => {}),
  revalidateEntity: mock.fn(() => {}),
});

mockMod("@/lib/action-utils", {
  requireWriteAction: mock.fn(async () => mockCtx),
});

mockMod("@/lib/validation", {
  getString: mock.fn((fd: FormData, key: string) => {
    const v = fd.get(key);
    return v === null ? "" : String(v);
  }),
});

mockMod("@/lib/erp", {
  parseAmount: mock.fn((val: unknown) => {
    if (typeof val !== "string") return 0;
    const n = Number.parseFloat(val.replace(/,/g, ""));
    return Number.isNaN(n) ? 0 : n;
  }),
});

mockMod("@/lib/notification", {
  checkLowStockAndNotify: mock.fn(async () => {}),
});

// Mutable validation error for per-test control
let mockValidationError: string | null = null;
mockMod("@/lib/domain-rules", {
  validateStockMovementInput: mock.fn(() => mockValidationError),
});

// ─── Lazy-loaded module ──────────────────────────────────────────────

let createStockMovement: (
  prevState: { error?: string } | undefined,
  fd: FormData,
) => Promise<Record<string, unknown>>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/inventory/movements/actions");
  createStockMovement = mod.createStockMovement as typeof createStockMovement;
});

// ─── Chain helpers (avoid esbuild parse-depth issues) ────────────────

/** Build a .from("products").select().eq().eq().single() chain */
function productSelectChain(result: unknown) {
  return {
    select: mock.fn(() => ({
      eq: mock.fn(() => ({
        eq: mock.fn(() => ({
          single: mock.fn(() => result),
        })),
      })),
    })),
  };
}

/** Build a .from("products").update().eq().eq()[.gte()].select().maybeSingle() chain */
function productUpdateChain(result: unknown) {
  const maybeSingle = { maybeSingle: mock.fn(() => result) };
  const selectTail = { select: mock.fn(() => maybeSingle) };
  return {
    update: mock.fn(() => ({
      eq: mock.fn(() => ({
        eq: mock.fn(() => ({
          gte: mock.fn(() => selectTail),
          ...selectTail,
        })),
      })),
    })),
  };
}

/** Build a .from("stock_movements").insert() chain */
function stockMovementsInsertChain(result: unknown) {
  return {
    insert: mock.fn(() => result),
  };
}

/** Build a .from("stock_movements").delete().eq().eq().eq().eq().eq().order().limit() chain */
function stockMovementsDeleteChain() {
  return {
    delete: mock.fn(() => ({
      eq: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => ({
            eq: mock.fn(() => ({
              eq: mock.fn(() => ({
                order: mock.fn(() => ({
                  limit: mock.fn(() => resolved(null, null)),
                })),
              })),
            })),
          })),
        })),
      })),
    })),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────

function resetMocks() {
  mockValidationError = null;
}

function validFormData(overrides?: Record<string, string | null>): FormData {
  return formData({
    product_id: "prod-1",
    type: "stock_in",
    quantity: "10",
    unit_cost: "1000",
    reference: null,
    notes: null,
    ...overrides,
  });
}

function makeSupabase(
  productSelect: unknown,
  productUpdate: unknown,
  stockInsert?: unknown,
) {
  const from = mock.fn((table: string) => {
    if (table === "products") {
      return {
        ...productSelectChain(productSelect),
        ...productUpdateChain(productUpdate),
      };
    }
    if (table === "stock_movements") {
      return {
        ...stockMovementsInsertChain(stockInsert ?? resolved(null, null)),
        ...stockMovementsDeleteChain(),
      };
    }
    return {};
  });
  return { from, rpc: mock.fn(() => resolved({}, null)) };
}

// ─── Tests: createStockMovement ──────────────────────────────────────

test("rejects when validation returns error", async () => {
  resetMocks();
  mockValidationError = "Төрөл заавал байх ёстой.";
  mockCtx = mockActionCtx();

  const result = await createStockMovement(undefined, validFormData());
  assert.equal(result.error, "Төрөл заавал байх ёстой.");
});

test("rejects when no branchId", async () => {
  resetMocks();
  mockCtx = mockActionCtx({ branchId: undefined });

  const result = await createStockMovement(undefined, validFormData());
  assert.equal(result.error, "Салбар сонгоогүй байна.");
});

test("rejects when product not found (null data)", async () => {
  resetMocks();
  const supabase = makeSupabase(resolved(null, null), resolved(null, null));
  mockCtx = mockActionCtx({ supabase });

  const result = await createStockMovement(undefined, validFormData());
  assert.equal(result.error, "Сонгосон бүтээгдэхүүн олдсонгүй.");
});

test("rejects when product query returns error", async () => {
  resetMocks();
  const supabase = makeSupabase(
    resolved(null, { message: "db error" }),
    resolved(null, null),
  );
  mockCtx = mockActionCtx({ supabase });

  const result = await createStockMovement(undefined, validFormData());
  assert.equal(result.error, "Сонгосон бүтээгдэхүүн олдсонгүй.");
});

test("creates stock-in movement successfully (positive quantity)", async () => {
  resetMocks();
  const productData = {
    id: "prod-1",
    current_stock: 10,
    name: "Widget",
  };
  const updatedProduct = {
    id: "prod-1",
    current_stock: 20,
    name: "Widget",
    min_stock: 5,
  };
  const supabase = makeSupabase(
    resolved(productData, null),
    resolved(updatedProduct, null),
  );
  mockCtx = mockActionCtx({ supabase });

  const result = await createStockMovement(
    undefined,
    validFormData({ quantity: "10" }),
  );
  assert.deepEqual(result, { success: true, error: undefined });
});

test("creates stock-out movement successfully (negative quantity)", async () => {
  resetMocks();
  const productData = {
    id: "prod-1",
    current_stock: 50,
    name: "Widget",
  };
  const updatedProduct = {
    id: "prod-1",
    current_stock: 40,
    name: "Widget",
    min_stock: 5,
  };
  const supabase = makeSupabase(
    resolved(productData, null),
    resolved(updatedProduct, null),
  );
  mockCtx = mockActionCtx({ supabase });

  const result = await createStockMovement(
    undefined,
    validFormData({ quantity: "-10" }),
  );
  assert.deepEqual(result, { success: true, error: undefined });
});

test("handles stock movement insert error", async () => {
  resetMocks();
  const productData = {
    id: "prod-1",
    current_stock: 10,
    name: "Widget",
  };
  const supabase = makeSupabase(
    resolved(productData, null),
    resolved(null, null),
    resolved(null, { message: "insert failed" }),
  );
  mockCtx = mockActionCtx({ supabase });

  const result = await createStockMovement(undefined, validFormData());
  assert.equal(result.error, "insert failed");
});

test("handles stock update error (update returns error)", async () => {
  resetMocks();
  const productData = {
    id: "prod-1",
    current_stock: 10,
    name: "Widget",
  };
  const supabase = makeSupabase(
    resolved(productData, null),
    resolved(null, { message: "update failed" }),
  );
  mockCtx = mockActionCtx({ supabase });

  const result = await createStockMovement(
    undefined,
    validFormData({ quantity: "-5" }),
  );
  assert.equal(result.error, "update failed");
});

test("handles insufficient stock (negative qty, no updated product)", async () => {
  resetMocks();
  const productData = {
    id: "prod-1",
    current_stock: 3,
    name: "Widget",
  };
  const supabase = makeSupabase(
    resolved(productData, null),
    resolved(null, null),
  );
  mockCtx = mockActionCtx({ supabase });

  const result = await createStockMovement(
    undefined,
    validFormData({ quantity: "-10" }),
  );
  assert.equal(result.error, "Үлдэгдэл хүрэлцэхгүй байна.");
});

test("calls revalidateEntities(['inventory']) on success", async () => {
  resetMocks();
  revalidateEntitiesMock.mock.resetCalls();

  const productData = {
    id: "prod-1",
    current_stock: 10,
    name: "Widget",
  };
  const updatedProduct = {
    id: "prod-1",
    current_stock: 20,
    name: "Widget",
    min_stock: 5,
  };
  const supabase = makeSupabase(
    resolved(productData, null),
    resolved(updatedProduct, null),
  );
  mockCtx = mockActionCtx({ supabase });

  await createStockMovement(undefined, validFormData());
  assert.equal(revalidateEntitiesMock.mock.callCount(), 1);
  assert.deepEqual(revalidateEntitiesMock.mock.calls[0].arguments, [
    ["inventory"],
  ]);
});

test("creates with all optional fields (reference and notes)", async () => {
  resetMocks();
  const productData = {
    id: "prod-1",
    current_stock: 10,
    name: "Widget",
  };
  const updatedProduct = {
    id: "prod-1",
    current_stock: 20,
    name: "Widget",
    min_stock: 5,
  };
  const supabase = makeSupabase(
    resolved(productData, null),
    resolved(updatedProduct, null),
  );
  mockCtx = mockActionCtx({ supabase });

  const result = await createStockMovement(
    undefined,
    validFormData({
      reference: "PO-001",
      notes: "Restock from supplier",
    }),
  );
  assert.deepEqual(result, { success: true, error: undefined });
});

test("passes correct fields to stock_movements insert", async () => {
  resetMocks();
  let insertPayload: Record<string, unknown> | null = null;

  const productData = {
    id: "prod-1",
    current_stock: 10,
    name: "Widget",
  };
  const updatedProduct = {
    id: "prod-1",
    current_stock: 20,
    name: "Widget",
    min_stock: 5,
  };

  // Build supabase with insert spy
  const from = mock.fn((table: string) => {
    if (table === "products") {
      return {
        ...productSelectChain(resolved(productData, null)),
        ...productUpdateChain(resolved(updatedProduct, null)),
      };
    }
    if (table === "stock_movements") {
      return {
        insert: mock.fn((payload: Record<string, unknown>) => {
          insertPayload = payload;
          return resolved(null, null);
        }),
        ...stockMovementsDeleteChain(),
      };
    }
    return {};
  });
  const supabase = { from, rpc: mock.fn(() => resolved({}, null)) };

  mockCtx = mockActionCtx({
    supabase,
    organizationId: "org-123",
    branchId: "branch-456",
    userId: "user-789",
  });

  await createStockMovement(
    undefined,
    validFormData({ quantity: "10", unit_cost: "2500" }),
  );

  assert.ok(insertPayload, "insert payload should be captured");
  assert.equal(insertPayload.organization_id, "org-123");
  assert.equal(insertPayload.branch_id, "branch-456");
  assert.equal(insertPayload.product_id, "prod-1");
  assert.equal(insertPayload.type, "stock_in");
  assert.equal(insertPayload.quantity, 10);
  assert.equal(insertPayload.unit_cost, 2500);
  assert.equal(insertPayload.created_by, "user-789");
});
