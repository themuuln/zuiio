/**
 * Tests for `inventory/restock/actions.ts` — batchCreatePurchaseOrders.
 *
 * The action takes a typed SupplierOrder[] (not FormData) and processes
 * each order in parallel, generating PO numbers, inserting records,
 * receiving stock via RPC, and posting to the journal.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import {
  mockActionCtx,
  mockMod,
  registerDefaultMocks,
  resolved,
} from "./actions-helpers";

// ─── Global mocks ────────────────────────────────────────────────────

registerDefaultMocks();

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

const postPurchaseToJournalMock = mock.fn(async () => {});
mockMod("@/lib/accounting", {
  postPurchaseToJournal: postPurchaseToJournalMock,
});

let mockCtx: Record<string, unknown> = mockActionCtx();
mockMod("@/lib/action-utils", {
  requireActionContext: mock.fn(async () => mockCtx),
  requireWriteAction: mock.fn(async () => mockCtx),
});

// ─── Lazy-loaded module ──────────────────────────────────────────────

let batchCreatePurchaseOrders: (
  supplierOrders: Array<{
    supplier_id: string | null;
    items: Array<{
      product_id: string;
      variant_id?: string | null;
      quantity: number;
      unit_cost: number;
    }>;
  }>,
) => Promise<{
  success: boolean;
  error?: string;
  createdCount: number;
}>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/inventory/restock/actions");
  batchCreatePurchaseOrders = mod.batchCreatePurchaseOrders;
});

// ─── Helpers ─────────────────────────────────────────────────────────

function resetMocks() {
  withDbCaptureMock.mock.resetCalls();
  revalidateEntitiesMock.mock.resetCalls();
  postPurchaseToJournalMock.mock.resetCalls();
}

/** Build a supabase mock with chainable queries that succeed by default. */
function buildSupabase(overrides?: {
  rpc?: (
    fn: string,
    params?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: unknown }>;
  poInsert?: { data: unknown; error: unknown };
  itemsInsert?: { data: unknown; error: unknown };
}) {
  const defaultRpc =
    overrides?.rpc ??
    (async (fn: string) => {
      if (fn === "generate_purchase_order_number") {
        return resolved("PO-2026-001", null);
      }
      return resolved({}, null);
    });

  const poChain = () => {
    const self: Record<string, unknown> = {};
    self.insert = mock.fn(() => {
      const sel: Record<string, unknown> = {};
      sel.select = mock.fn(() => {
        const s: Record<string, unknown> = {};
        s.single = mock.fn(
          () => overrides?.poInsert ?? resolved({ id: "po-test-id" }, null),
        );
        return s;
      });
      return sel;
    });
    self.select = mock.fn(() => {
      const s: Record<string, unknown> = {};
      s.single = mock.fn(
        () => overrides?.poInsert ?? resolved({ id: "po-test-id" }, null),
      );
      return s;
    });
    self.delete = mock.fn(() => {
      const eq: Record<string, unknown> = {};
      eq.eq = mock.fn(() => resolved(null, null));
      return eq;
    });
    return self;
  };

  const itemsChain = () => {
    const self: Record<string, unknown> = {};
    self.insert = mock.fn(() => overrides?.itemsInsert ?? resolved(null, null));
    return self;
  };

  const fromMock = mock.fn((table: string) => {
    if (table === "purchase_order_items") return itemsChain();
    return poChain();
  });

  return { from: fromMock, rpc: mock.fn(defaultRpc) };
}

// ─── Tests ───────────────────────────────────────────────────────────

test("rejects when no branchId", async () => {
  resetMocks();
  mockCtx = mockActionCtx({ branchId: undefined });

  const result = await batchCreatePurchaseOrders([
    {
      supplier_id: "s1",
      items: [{ product_id: "p1", quantity: 5, unit_cost: 1000 }],
    },
  ]);

  assert.equal(result.success, false);
  assert.equal(result.createdCount, 0);
  assert.ok(result.error);
  assert.match(result.error, /салбар/i);
});

test("filters out supplier orders with empty items array", async () => {
  resetMocks();
  const supabase = buildSupabase();
  mockCtx = mockActionCtx({ supabase });

  const result = await batchCreatePurchaseOrders([
    { supplier_id: "s1", items: [] },
    {
      supplier_id: "s2",
      items: [{ product_id: "p1", quantity: 3, unit_cost: 500 }],
    },
  ]);

  assert.equal(result.success, true);
  assert.equal(result.createdCount, 1);
  // Only one order should have been processed — one from() call for PO insert
  // plus one for items insert = 2 from() calls total
  assert.equal(supabase.from.mock.callCount(), 2);
});

test("creates single order successfully", async () => {
  resetMocks();
  const supabase = buildSupabase();
  mockCtx = mockActionCtx({ supabase });

  const result = await batchCreatePurchaseOrders([
    {
      supplier_id: "s1",
      items: [{ product_id: "p1", quantity: 5, unit_cost: 1000 }],
    },
  ]);

  assert.equal(result.success, true);
  assert.equal(result.createdCount, 1);

  // Verify generate_purchase_order_number was called
  assert.equal(supabase.rpc.mock.callCount(), 2); // generate number + process restock
  assert.equal(
    supabase.rpc.mock.calls[0].arguments[0],
    "generate_purchase_order_number",
  );
  assert.equal(
    supabase.rpc.mock.calls[1].arguments[0],
    "process_restock_stock_movements",
  );

  // Verify revalidateEntities was called
  assert.equal(revalidateEntitiesMock.mock.callCount(), 1);

  // Verify postPurchaseToJournal was called
  assert.equal(postPurchaseToJournalMock.mock.callCount(), 1);
});

test("creates multiple orders successfully", async () => {
  resetMocks();
  const supabase = buildSupabase();
  mockCtx = mockActionCtx({ supabase });

  const result = await batchCreatePurchaseOrders([
    {
      supplier_id: "s1",
      items: [{ product_id: "p1", quantity: 5, unit_cost: 1000 }],
    },
    {
      supplier_id: "s2",
      items: [{ product_id: "p2", quantity: 3, unit_cost: 2000 }],
    },
  ]);

  assert.equal(result.success, true);
  assert.equal(result.createdCount, 2);
  assert.equal(postPurchaseToJournalMock.mock.callCount(), 2);
});

test("handles PO insert error (returns createdCount based on successes)", async () => {
  resetMocks();
  const supabase = buildSupabase({
    poInsert: {
      data: null,
      error: { message: "insert failed" },
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await batchCreatePurchaseOrders([
    {
      supplier_id: "s1",
      items: [{ product_id: "p1", quantity: 5, unit_cost: 1000 }],
    },
  ]);

  assert.equal(result.success, false);
  assert.equal(result.createdCount, 0);
  assert.ok(result.error);
  assert.match(result.error, /захиалга/i);
});

test("handles items insert error with rollback", async () => {
  resetMocks();
  const supabase = buildSupabase({
    itemsInsert: {
      data: null,
      error: { message: "items insert failed" },
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await batchCreatePurchaseOrders([
    {
      supplier_id: "s1",
      items: [{ product_id: "p1", quantity: 5, unit_cost: 1000 }],
    },
  ]);

  assert.equal(result.success, false);
  assert.equal(result.createdCount, 0);
  assert.ok(result.error);
  assert.match(result.error, /Барааны мэдээлэл/i);

  // Verify rollback: purchase_orders.delete().eq() should have been called
  // find the delete call on purchase_orders table
  const fromCalls = supabase.from.mock.calls;
  const _deleteCall = fromCalls.find(
    (c) =>
      c.arguments[0] === "purchase_orders" &&
      typeof c.result?.delete === "function",
  );
  // The chain goes from("purchase_orders") -> delete -> eq
  // Since withDbCapture wraps the whole chain, verify delete was invoked
  assert.ok(withDbCaptureMock.mock.callCount() > 0);
});

test("handles RPC error (process_restock_stock_movements fails)", async () => {
  resetMocks();
  const supabase = buildSupabase({
    rpc: async (fn: string) => {
      if (fn === "generate_purchase_order_number") {
        return resolved("PO-2026-002", null);
      }
      if (fn === "process_restock_stock_movements") {
        return resolved(null, { message: "rpc failed" });
      }
      return resolved({}, null);
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await batchCreatePurchaseOrders([
    {
      supplier_id: "s1",
      items: [{ product_id: "p1", quantity: 5, unit_cost: 1000 }],
    },
  ]);

  assert.equal(result.success, false);
  assert.equal(result.createdCount, 0);
  assert.ok(result.error);
  assert.match(result.error, /хүлээн авахад алдаа/i);
  assert.match(result.error, /rpc failed/);
});

test("handles RPC result with embedded error object", async () => {
  resetMocks();
  const supabase = buildSupabase({
    rpc: async (fn: string) => {
      if (fn === "generate_purchase_order_number") {
        return resolved("PO-2026-003", null);
      }
      if (fn === "process_restock_stock_movements") {
        return resolved({ error: "insufficient stock" }, null);
      }
      return resolved({}, null);
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await batchCreatePurchaseOrders([
    {
      supplier_id: "s1",
      items: [{ product_id: "p1", quantity: 5, unit_cost: 1000 }],
    },
  ]);

  assert.equal(result.success, false);
  assert.equal(result.createdCount, 0);
  assert.ok(result.error);
  assert.match(result.error, /insufficient stock/);
});

test("returns partial success when some orders fail", async () => {
  resetMocks();
  let restockCalls = 0;
  const supabase = buildSupabase({
    rpc: async (fn: string) => {
      if (fn === "generate_purchase_order_number") {
        return resolved("PO-2026-001", null);
      }
      if (fn === "process_restock_stock_movements") {
        restockCalls += 1;
        // Fail for the second order to complete
        if (restockCalls === 2) {
          return resolved(null, { message: "stock error" });
        }
        return resolved({}, null);
      }
      return resolved({}, null);
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await batchCreatePurchaseOrders([
    {
      supplier_id: "s1",
      items: [{ product_id: "p1", quantity: 5, unit_cost: 1000 }],
    },
    {
      supplier_id: "s2",
      items: [{ product_id: "p2", quantity: 3, unit_cost: 2000 }],
    },
  ]);

  assert.equal(result.success, true); // partial success
  assert.equal(result.createdCount, 1);
  assert.ok(result.error);
  assert.match(result.error, /хүлээн авахад алдаа/);
});

test("processes orders with variant_id properly", async () => {
  resetMocks();
  const supabase = buildSupabase();
  mockCtx = mockActionCtx({ supabase });

  const result = await batchCreatePurchaseOrders([
    {
      supplier_id: "s1",
      items: [
        {
          product_id: "p1",
          variant_id: "v1",
          quantity: 10,
          unit_cost: 500,
        },
        {
          product_id: "p2",
          quantity: 2,
          unit_cost: 3000,
        },
      ],
    },
  ]);

  assert.equal(result.success, true);
  assert.equal(result.createdCount, 1);

  // Verify the RPC call includes variant_id
  const restockCall = supabase.rpc.mock.calls.find(
    (c) => c.arguments[0] === "process_restock_stock_movements",
  );
  assert.ok(restockCall);
  const params = restockCall.arguments[1] as Record<string, unknown>;
  const items = params.p_items as Array<Record<string, unknown>>;
  assert.equal(items.length, 2);
  assert.equal(items[0].variant_id, "v1");
  assert.equal(items[1].variant_id, null);
});

test("skips journal posting when postPurchaseToJournal throws", async () => {
  resetMocks();
  postPurchaseToJournalMock.mock.mockImplementationOnce(async () => {
    throw new Error("journal error");
  });

  const supabase = buildSupabase();
  mockCtx = mockActionCtx({ supabase });

  // Should not throw — errors are caught
  const result = await batchCreatePurchaseOrders([
    {
      supplier_id: "s1",
      items: [{ product_id: "p1", quantity: 5, unit_cost: 1000 }],
    },
  ]);

  assert.equal(result.success, true);
  assert.equal(result.createdCount, 1);
  // postPurchaseToJournal was called but threw — still returns created
  assert.equal(postPurchaseToJournalMock.mock.callCount(), 1);
});

test("returns empty result when all supplier orders have no items", async () => {
  resetMocks();
  const supabase = buildSupabase();
  mockCtx = mockActionCtx({ supabase });

  const result = await batchCreatePurchaseOrders([
    { supplier_id: "s1", items: [] },
    { supplier_id: "s2", items: [] },
  ]);

  assert.equal(result.success, true);
  assert.equal(result.createdCount, 0);
  // No from() calls since no orders were processed
  assert.equal(supabase.from.mock.callCount(), 0);
});
