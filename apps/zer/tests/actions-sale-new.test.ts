/**
 * Tests for `sales/new/actions.ts` — createSale.
 *
 * Covers: item validation, stock checks, customer handling, variant support,
 * sale/items insert, stock movement/RPC, rollback on each error stage,
 * cancelled status, salesperson override, and payment splits.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { mockActionCtx, formData, mockMod, resolved } from "./actions-helpers";

// ─── Global mocks ────────────────────────────────────────────────────

const withDbCaptureMock = mock.fn(async (_name: string, query: unknown) => {
  return await (query as Promise<unknown>);
});
mockMod("@zuiio/capture", {
  capture: mock.fn(() => {}),
  withDbCapture: withDbCaptureMock,
});

const revalidateEntitiesMock = mock.fn(() => {});
mockMod("@/lib/revalidate", {
  revalidateEntities: revalidateEntitiesMock,
  revalidateEntityTag: mock.fn(() => {}),
  revalidateEntity: mock.fn(() => {}),
});

mockMod("@/lib/audit", { logAuditEventWithClient: mock.fn(async () => {}) });
mockMod("next/server", { after: (fn: () => void) => fn() });
mockMod("next/cache", {
  revalidatePath: mock.fn(() => {}),
  revalidateTag: mock.fn(() => {}),
});
mockMod("server-only", {});

mockMod("@/lib/validation", {
  getString: mock.fn(
    (fd: FormData, key: string) => String(fd.get(key) ?? ""),
  ),
});

mockMod("@/lib/erp", {
  parseAmount: mock.fn((v: unknown) => {
    if (typeof v !== "string") return 0;
    const n = Number.parseFloat(v.replace(/,/g, ""));
    return Number.isNaN(n) ? 0 : n;
  }),
});

const calculateCommissionMock = mock.fn(() => 0);
mockMod("@/lib/commissions", { calculateCommission: calculateCommissionMock });

const postSaleToJournalMock = mock.fn(() => Promise.resolve());
mockMod("@/lib/accounting", { postSaleToJournal: postSaleToJournalMock });

const createInvoiceFromSaleMock = mock.fn(async () => {});
mockMod("@/lib/invoicing", { createInvoiceFromSale: createInvoiceFromSaleMock });

const sendTelegramNotificationMock = mock.fn(() => {});
const checkLowStockAndNotifyMock = mock.fn(() => {});
mockMod("@/lib/notification", {
  sendTelegramNotification: sendTelegramNotificationMock,
  checkLowStockAndNotify: checkLowStockAndNotifyMock,
});

const findOrCreateContactMock = mock.fn(async () => ({ id: "test-contact-id" }));
mockMod("@/lib/contact-utils", { findOrCreateContact: findOrCreateContactMock });

mockMod("@/lib/format", {
  formatCurrency: mock.fn((v: number) => `${v}₮`),
  formatRouteDate: mock.fn(() => "2026-01-15"),
});

mockMod("@/lib/branches", {
  withBranchFilter: mock.fn((query: unknown) => query),
});

let mockCtx: Record<string, unknown> = mockActionCtx();
mockMod("@/lib/action-utils", {
  requireWriteAction: mock.fn(async () => mockCtx),
});

// ─── Stock utils mocks ───────────────────────────────────────────────

const defaultProductMap = new Map([
  [
    "p1",
    { id: "p1", name: "Product A", current_stock: 100, min_stock: 10 },
  ],
]);

const fetchProductsForStockMock = mock.fn(async () => defaultProductMap);
const fetchVariantsForStockMock = mock.fn(async () => new Map());
const createStockMovementsMock = mock.fn(async () => ({ error: null }));

mockMod("@/lib/stock-utils", {
  fetchProductsForStock: fetchProductsForStockMock,
  fetchVariantsForStock: fetchVariantsForStockMock,
  createStockMovements: createStockMovementsMock,
});

// ─── Lazy-loaded module ──────────────────────────────────────────────

let createSale: (
  prev: { error?: string } | undefined,
  form: FormData,
) => Promise<unknown>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/sales/new/actions");
  createSale = mod.createSale;
});

// ─── Helpers ─────────────────────────────────────────────────────────

type MockFn = { mock: { callCount: () => number } };

/** Snapshot current callCounts so we can assert deltas later. */
function snapshotCounts(): Record<string, number> {
  return {
    fetchProductsForStock: fetchProductsForStockMock.mock.callCount(),
    fetchVariantsForStock: fetchVariantsForStockMock.mock.callCount(),
    createStockMovements: createStockMovementsMock.mock.callCount(),
    findOrCreateContact: findOrCreateContactMock.mock.callCount(),
    createInvoiceFromSale: createInvoiceFromSaleMock.mock.callCount(),
    postSaleToJournal: postSaleToJournalMock.mock.callCount(),
    sendTelegram: sendTelegramNotificationMock.mock.callCount(),
    checkLowStock: checkLowStockAndNotifyMock.mock.callCount(),
    revalidateEntities: revalidateEntitiesMock.mock.callCount(),
  };
}

/** Assert that a mock's callCount increased by exactly `delta` since snapshot. */
function assertDelta(
  before: Record<string, number>,
  key: string,
  mockFn: MockFn,
  delta: number,
) {
  const actual = mockFn.mock.callCount() - before[key];
  assert.equal(actual, delta, `${key}: expected delta ${delta}, got ${actual}`);
}

function resetMocks() {
  mockCtx = mockActionCtx();
  fetchProductsForStockMock.mock.mockImplementation(
    async () => defaultProductMap,
  );
  fetchVariantsForStockMock.mock.mockImplementation(async () => new Map());
  createStockMovementsMock.mock.mockImplementation(
    async () => ({ error: null }),
  );
  findOrCreateContactMock.mock.mockImplementation(
    async () => ({ id: "test-contact-id" }),
  );
  createInvoiceFromSaleMock.mock.mockImplementation(async () => {});
  postSaleToJournalMock.mock.mockImplementation(() => Promise.resolve());
  calculateCommissionMock.mock.mockImplementation(() => 0);
}

/**
 * Build a supabase mock supporting the full createSale flow.
 */
function buildSupabase(opts: {
  saleInsertError?: { message: string } | null;
  itemsInsertError?: { message: string } | null;
  rpcResult?: unknown;
  rpcError?: { message: string } | null;
  lowStockProduct?: {
    current_stock: number;
    min_stock: number;
    name: string;
  } | null;
  profilesError?: { message: string } | null;
} = {}) {
  const saleInsertResult = opts.saleInsertError
    ? resolved(null, opts.saleInsertError)
    : resolved({ id: "sale-test-id" }, null);

  const itemsInsertResult = opts.itemsInsertError
    ? resolved(null, opts.itemsInsertError)
    : resolved(null, null);

  const rpcResult = opts.rpcResult ?? { success: true };

  const deleteChain = () => {
    const self: Record<string, unknown> = {};
    self.eq = mock.fn(() => resolved(null, null));
    return self;
  };

  const profilesQuery = () => {
    const self: Record<string, unknown> = {};
    self.select = mock.fn(() => {
      const inner: Record<string, unknown> = {};
      inner.eq = mock.fn(() => {
        const eq2: Record<string, unknown> = {};
        eq2.eq = mock.fn(() => {
          const maybe: Record<string, unknown> = {};
          maybe.maybeSingle = mock.fn(() =>
            opts.profilesError
              ? resolved(null, opts.profilesError)
              : resolved({ id: "test-user-id" }, null),
          );
          return maybe;
        });
        return eq2;
      });
      return inner;
    });
    return self;
  };

  const productsQuery = () => {
    const updatedProduct = opts.lowStockProduct ?? {
      current_stock: 95,
      min_stock: 10,
      name: "Product A",
    };
    const self: Record<string, unknown> = {};
    self.select = mock.fn(() => {
      const inner: Record<string, unknown> = {};
      inner.eq = mock.fn(() => {
        const eq2: Record<string, unknown> = {};
        eq2.single = mock.fn(() => resolved(updatedProduct, null));
        return eq2;
      });
      return inner;
    });
    return self;
  };

  const fromMock = mock.fn((table: string) => {
    if (table === "sales") {
      const self: Record<string, unknown> = {};
      self.insert = mock.fn(() => {
        const sel: Record<string, unknown> = {};
        sel.select = mock.fn(() => {
          const s: Record<string, unknown> = {};
          s.single = mock.fn(() => saleInsertResult);
          return s;
        });
        return sel;
      });
      self.delete = mock.fn(() => deleteChain());
      return self;
    }
    if (table === "sale_items") {
      const self: Record<string, unknown> = {};
      self.insert = mock.fn(() => itemsInsertResult);
      self.delete = mock.fn(() => deleteChain());
      return self;
    }
    if (table === "contacts") {
      const self: Record<string, unknown> = {};
      self.delete = mock.fn(() => deleteChain());
      return self;
    }
    if (table === "stock_movements") {
      const self: Record<string, unknown> = {};
      self.delete = mock.fn(() => deleteChain());
      return self;
    }
    if (table === "profiles") return profilesQuery();
    if (table === "products") return productsQuery();
    const self: Record<string, unknown> = {};
    self.insert = mock.fn(() => resolved(null, null));
    self.delete = mock.fn(() => deleteChain());
    return self;
  });

  const rpcResultResolved = opts.rpcError
    ? resolved(null, opts.rpcError)
    : resolved(rpcResult, null);

  return {
    from: fromMock,
    rpc: mock.fn(async () => rpcResultResolved),
  };
}

function validItems(productId = "p1", quantity = 2, unitPrice = 100) {
  return JSON.stringify([{ productId, quantity, unitPrice }]);
}

function basicForm(overrides: Record<string, string | null> = {}) {
  return formData({
    items: validItems(),
    ...overrides,
  });
}

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

test("rejects missing items", async () => {
  resetMocks();
  const fd = formData({});
  const result = await createSale(undefined, fd);
  assert.deepStrictEqual(result, { error: "Бүтээгдэхүүн сонгоно уу." });
});

test("rejects invalid items JSON", async () => {
  resetMocks();
  const fd = formData({ items: "not-json" });
  const result = await createSale(undefined, fd);
  assert.deepStrictEqual(result, {
    error: "Бүтээгдэхүүний мэдээлэл буруу байна.",
  });
});

test("rejects empty items array", async () => {
  resetMocks();
  const fd = formData({ items: "[]" });
  const result = await createSale(undefined, fd);
  assert.deepStrictEqual(result, {
    error: "Дор хаяж нэг мөр оруулна уу.",
  });
});

test("rejects item with missing productId", async () => {
  resetMocks();
  const items = JSON.stringify([
    { productId: "", quantity: 1, unitPrice: 100 },
  ]);
  const fd = formData({ items });
  const result = await createSale(undefined, fd);
  assert.deepStrictEqual(result, {
    error: "Бүтээгдэхүүн, тоо хэмжээ, үнэ зөв бөглөгдөх ёстой.",
  });
});

test("rejects item with zero quantity", async () => {
  resetMocks();
  const items = JSON.stringify([
    { productId: "p1", quantity: 0, unitPrice: 100 },
  ]);
  const fd = formData({ items });
  const result = await createSale(undefined, fd);
  assert.deepStrictEqual(result, {
    error: "Бүтээгдэхүүн, тоо хэмжээ, үнэ зөв бөглөгдөх ёстой.",
  });
});

test("rejects item with negative unitPrice", async () => {
  resetMocks();
  const items = JSON.stringify([
    { productId: "p1", quantity: 1, unitPrice: -5 },
  ]);
  const fd = formData({ items });
  const result = await createSale(undefined, fd);
  assert.deepStrictEqual(result, {
    error: "Бүтээгдэхүүн, тоо хэмжээ, үнэ зөв бөглөгдөх ёстой.",
  });
});

test("rejects insufficient stock", async () => {
  resetMocks();
  fetchProductsForStockMock.mock.mockImplementation(async () => {
    return new Map([
      [
        "p1",
        { id: "p1", name: "Product A", current_stock: 5, min_stock: 1 },
      ],
    ]);
  });
  const items = JSON.stringify([
    { productId: "p1", quantity: 10, unitPrice: 100 },
  ]);
  const fd = formData({ items });
  const result = await createSale(undefined, fd);
  assert.ok(result && typeof result === "object" && "error" in result);
  const err = (result as { error: string }).error;
  assert.ok(
    err.includes("үлдэгдэл хүрэлцэхгүй"),
    `Expected insufficient stock error, got: ${err}`,
  );
});

test("creates sale successfully (completed, no customer name)", async () => {
  resetMocks();
  const sb = buildSupabase();
  mockCtx = { ...mockCtx, supabase: sb };
  const before = snapshotCounts();

  const fd = basicForm();
  const result = await createSale(undefined, fd);

  assert.deepStrictEqual(result, {
    success: true,
    error: undefined,
    sale: { id: "sale-test-id", total_amount: 200, customer_name: "" },
  });
  assertDelta(before, "findOrCreateContact", findOrCreateContactMock, 0);
  assertDelta(before, "createStockMovements", createStockMovementsMock, 1);
  assertDelta(before, "createInvoiceFromSale", createInvoiceFromSaleMock, 1);
  assertDelta(before, "postSaleToJournal", postSaleToJournalMock, 1);
  assertDelta(before, "sendTelegram", sendTelegramNotificationMock, 1);
  assertDelta(before, "checkLowStock", checkLowStockAndNotifyMock, 1);
  assertDelta(before, "revalidateEntities", revalidateEntitiesMock, 1);
});

test("creates sale with customer (findOrCreateContact)", async () => {
  resetMocks();
  const sb = buildSupabase();
  mockCtx = { ...mockCtx, supabase: sb };
  const before = snapshotCounts();

  const fd = basicForm({
    customer_name: "Test Customer",
    customer_phone: "99001234",
  });
  const result = await createSale(undefined, fd);

  assert.deepStrictEqual(result, {
    success: true,
    error: undefined,
    sale: {
      id: "sale-test-id",
      total_amount: 200,
      customer_name: "Test Customer",
    },
  });
  assertDelta(before, "findOrCreateContact", findOrCreateContactMock, 1);
  const lastIdx = findOrCreateContactMock.mock.callCount() - 1;
  const contactArgs =
    findOrCreateContactMock.mock.calls[lastIdx].arguments;
  assert.equal(contactArgs[2], "customer");
  assert.equal(contactArgs[3], "Test Customer");
  assert.equal(contactArgs[4], "99001234");
});

test("creates sale with variant (valid variant stock)", async () => {
  resetMocks();
  fetchVariantsForStockMock.mock.mockImplementation(async () => {
    return new Map([["v1", { current_stock: 50 }]]);
  });

  const sb = buildSupabase();
  mockCtx = { ...mockCtx, supabase: sb };
  const before = snapshotCounts();

  const items = JSON.stringify([
    { productId: "p1", variantId: "v1", quantity: 3, unitPrice: 200 },
  ]);
  const fd = formData({ items });
  const result = await createSale(undefined, fd);

  assert.deepStrictEqual(result, {
    success: true,
    error: undefined,
    sale: { id: "sale-test-id", total_amount: 600, customer_name: "" },
  });
  assertDelta(before, "fetchVariantsForStock", fetchVariantsForStockMock, 1);
});

test("rejects variant with insufficient stock", async () => {
  resetMocks();
  fetchVariantsForStockMock.mock.mockImplementation(async () => {
    return new Map([["v1", { current_stock: 2 }]]);
  });
  fetchProductsForStockMock.mock.mockImplementation(async () => {
    return new Map([
      [
        "p1",
        { id: "p1", name: "Product A", current_stock: 100, min_stock: 10 },
      ],
    ]);
  });

  const sb = buildSupabase();
  mockCtx = { ...mockCtx, supabase: sb };

  const items = JSON.stringify([
    { productId: "p1", variantId: "v1", quantity: 5, unitPrice: 100 },
  ]);
  const fd = formData({ items });
  const result = await createSale(undefined, fd);

  assert.ok(result && typeof result === "object" && "error" in result);
  assert.ok(
    ((result as { error: string }).error).includes(
      "Вариантын үлдэгдэл хүрэлцэхгүй",
    ),
  );
});

test("handles sale insert error", async () => {
  resetMocks();
  const sb = buildSupabase({
    saleInsertError: { message: "DB insert failed" },
  });
  mockCtx = { ...mockCtx, supabase: sb };
  const before = snapshotCounts();

  const fd = basicForm();
  const result = await createSale(undefined, fd);

  assert.deepStrictEqual(result, { error: "DB insert failed" });
  assertDelta(before, "createStockMovements", createStockMovementsMock, 0);
  assertDelta(before, "createInvoiceFromSale", createInvoiceFromSaleMock, 0);
});

test("handles sale insert error cleans up created contact", async () => {
  resetMocks();
  const sb = buildSupabase({
    saleInsertError: { message: "DB insert failed" },
  });
  mockCtx = { ...mockCtx, supabase: sb };

  const fd = basicForm({ customer_name: "Test Customer" });
  const result = await createSale(undefined, fd);

  assert.deepStrictEqual(result, { error: "DB insert failed" });
  const contactsDeleteCalls = sb.from.mock.calls.filter(
    (c: { arguments: unknown[] }) => c.arguments[0] === "contacts",
  );
  assert.ok(
    contactsDeleteCalls.length > 0,
    "Should delete created contact on sale insert error",
  );
});

test("handles sale_items insert error with rollback", async () => {
  resetMocks();
  const sb = buildSupabase({
    itemsInsertError: { message: "Items insert failed" },
  });
  mockCtx = { ...mockCtx, supabase: sb };
  const before = snapshotCounts();

  const fd = basicForm();
  const result = await createSale(undefined, fd);

  assert.deepStrictEqual(result, { error: "Items insert failed" });
  assertDelta(before, "createStockMovements", createStockMovementsMock, 0);

  const salesDeleteCalls = sb.from.mock.calls.filter(
    (c: { arguments: unknown[] }) => c.arguments[0] === "sales",
  );
  assert.ok(
    salesDeleteCalls.length > 0,
    "Should delete sale on items insert error",
  );
});

test("handles stock movement error with rollback", async () => {
  resetMocks();
  createStockMovementsMock.mock.mockImplementation(async () => ({
    error: "Stock movement failed",
  }));
  const sb = buildSupabase();
  mockCtx = { ...mockCtx, supabase: sb };
  const before = snapshotCounts();

  const fd = basicForm();
  const result = await createSale(undefined, fd);

  assert.deepStrictEqual(result, { error: "Stock movement failed" });
  assertDelta(before, "createInvoiceFromSale", createInvoiceFromSaleMock, 0);
  assertDelta(before, "postSaleToJournal", postSaleToJournalMock, 0);

  const itemsDeleteCalls = sb.from.mock.calls.filter(
    (c: { arguments: unknown[] }) => c.arguments[0] === "sale_items",
  );
  const salesDeleteCalls = sb.from.mock.calls.filter(
    (c: { arguments: unknown[] }) => c.arguments[0] === "sales",
  );
  assert.ok(
    itemsDeleteCalls.length > 0,
    "Should delete sale_items on stock movement error",
  );
  assert.ok(
    salesDeleteCalls.length > 0,
    "Should delete sale on stock movement error",
  );
});

test("handles stock decrement RPC error with rollback", async () => {
  resetMocks();
  const sb = buildSupabase({
    rpcResult: null,
    rpcError: { message: "RPC failed" },
  });
  mockCtx = { ...mockCtx, supabase: sb };
  const before = snapshotCounts();

  const fd = basicForm();
  const result = await createSale(undefined, fd);

  assert.deepStrictEqual(result, { error: "RPC failed" });
  assertDelta(before, "createInvoiceFromSale", createInvoiceFromSaleMock, 0);
});

test("handles stock decrement RPC returning malformed result", async () => {
  resetMocks();
  // RPC returns a result without "success" property — action detects malformed shape
  const sb = buildSupabase({ rpcResult: "bad" });
  mockCtx = { ...mockCtx, supabase: sb };

  const fd = basicForm();
  const result = await createSale(undefined, fd);

  assert.ok(result && typeof result === "object" && "error" in result);
  const err = (result as { error: string }).error;
  assert.ok(err.length > 0, "Should return an error message for malformed RPC result");
});

test("handles cancelled status (skips stock, no customer)", async () => {
  resetMocks();
  const sb = buildSupabase();
  mockCtx = { ...mockCtx, supabase: sb };
  const before = snapshotCounts();

  const fd = basicForm({ status: "cancelled" });
  const result = await createSale(undefined, fd);

  assert.deepStrictEqual(result, {
    success: true,
    error: undefined,
    sale: { id: "sale-test-id", total_amount: 200, customer_name: "" },
  });
  // Cancelled sales skip stock movements, invoice, journal, and notifications
  assertDelta(before, "createStockMovements", createStockMovementsMock, 0);
  assertDelta(before, "createInvoiceFromSale", createInvoiceFromSaleMock, 0);
  assertDelta(before, "postSaleToJournal", postSaleToJournalMock, 0);
  assertDelta(before, "sendTelegram", sendTelegramNotificationMock, 0);
  assertDelta(before, "checkLowStock", checkLowStockAndNotifyMock, 0);
  assertDelta(before, "findOrCreateContact", findOrCreateContactMock, 0);
});

test("creates sale with salesperson override (valid)", async () => {
  resetMocks();
  const sb = buildSupabase();
  mockCtx = { ...mockCtx, supabase: sb };

  const fd = basicForm({ salesperson_id: "other-user-id" });
  const result = await createSale(undefined, fd);

  assert.deepStrictEqual(result, {
    success: true,
    error: undefined,
    sale: { id: "sale-test-id", total_amount: 200, customer_name: "" },
  });
  const profilesCalls = sb.from.mock.calls.filter(
    (c: { arguments: unknown[] }) => c.arguments[0] === "profiles",
  );
  assert.ok(
    profilesCalls.length > 0,
    "Should query profiles to validate salesperson",
  );
});

test("creates sale with payment_splits", async () => {
  resetMocks();
  const sb = buildSupabase();
  mockCtx = { ...mockCtx, supabase: sb };

  const splits = JSON.stringify([
    { method: "cash", amount: 100 },
    { method: "card", amount: 100 },
  ]);
  const fd = basicForm({ payment_splits: splits, payment_method: "split" });
  const result = await createSale(undefined, fd);

  assert.deepStrictEqual(result, {
    success: true,
    error: undefined,
    sale: { id: "sale-test-id", total_amount: 200, customer_name: "" },
  });
});

test("calculates correct total with multiple items", async () => {
  resetMocks();
  const sb = buildSupabase();
  mockCtx = { ...mockCtx, supabase: sb };

  const items = JSON.stringify([
    { productId: "p1", quantity: 3, unitPrice: 100 },
    { productId: "p2", quantity: 2, unitPrice: 50 },
  ]);
  fetchProductsForStockMock.mock.mockImplementation(async () => {
    return new Map([
      [
        "p1",
        { id: "p1", name: "Product A", current_stock: 100, min_stock: 10 },
      ],
      [
        "p2",
        { id: "p2", name: "Product B", current_stock: 100, min_stock: 10 },
      ],
    ]);
  });

  const fd = formData({ items });
  const result = await createSale(undefined, fd);

  assert.deepStrictEqual(result, {
    success: true,
    error: undefined,
    sale: { id: "sale-test-id", total_amount: 400, customer_name: "" },
  });
});

test("rolls back contact on sale_items insert error", async () => {
  resetMocks();
  const sb = buildSupabase({
    itemsInsertError: { message: "Items insert failed" },
  });
  mockCtx = { ...mockCtx, supabase: sb };

  const fd = basicForm({ customer_name: "Test Customer" });
  const result = await createSale(undefined, fd);

  assert.deepStrictEqual(result, { error: "Items insert failed" });
  const contactsCalls = sb.from.mock.calls.filter(
    (c: { arguments: unknown[] }) => c.arguments[0] === "contacts",
  );
  assert.ok(
    contactsCalls.length > 0,
    "Should clean up contact on items insert error",
  );
});

test("rolls back contact on stock movement error", async () => {
  resetMocks();
  createStockMovementsMock.mock.mockImplementation(async () => ({
    error: "Stock movement failed",
  }));
  const sb = buildSupabase();
  mockCtx = { ...mockCtx, supabase: sb };

  const fd = basicForm({ customer_name: "Test Customer" });
  const result = await createSale(undefined, fd);

  assert.deepStrictEqual(result, { error: "Stock movement failed" });
  const contactsCalls = sb.from.mock.calls.filter(
    (c: { arguments: unknown[] }) => c.arguments[0] === "contacts",
  );
  assert.ok(
    contactsCalls.length > 0,
    "Should clean up contact on stock movement error",
  );
});
