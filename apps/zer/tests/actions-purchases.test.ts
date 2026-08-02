/**
 * Tests for `purchases/actions.ts` — createPurchaseOrder, updatePurchaseOrderStatus, receivePurchaseOrderItems.
 *
 * Run: tsx --experimental-test-module-mocks --test tests/actions-purchases.test.ts
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { formData, mockActionCtx, mockMod, resolved } from "./actions-helpers";

// ─── Global mocks ────────────────────────────────────────────────────

const withDbCaptureMock = mock.fn(
  async (_name: string, query: Promise<unknown>) => {
    const result = await query;
    return result;
  },
);

const revalidateEntitiesMock = mock.fn(() => {});
const revalidateEntityTagMock = mock.fn(() => {});
mockMod("@/lib/revalidate", {
  revalidateEntities: revalidateEntitiesMock,
  revalidateEntityTag: revalidateEntityTagMock,
  revalidateEntity: mock.fn(() => {}),
});

mockMod("@/lib/audit", { logAuditEventWithClient: mock.fn(async () => {}) });
mockMod("next/server", { after: (fn: () => void) => fn() });
mockMod("next/cache", {
  revalidatePath: mock.fn(() => {}),
  revalidateTag: mock.fn(() => {}),
});
mockMod("server-only", {});

const captureMock = mock.fn(() => {});
mockMod("@zuiio/capture", {
  capture: captureMock,
  withDbCapture: withDbCaptureMock,
});

const getStringMock = mock.fn((fd: FormData, key: string) => fd.get(key) ?? "");
mockMod("@/lib/validation", { getString: getStringMock });

const safeParseMock = mock.fn(() => ({ success: true, data: {} }));
mockMod("@/lib/validation-schemas", {
  purchaseSchema: { safeParse: safeParseMock },
});

const postPurchaseToJournalMock = mock.fn(async () => {});
mockMod("@/lib/accounting", {
  postPurchaseToJournal: postPurchaseToJournalMock,
});

const withBranchFilterMock = mock.fn(
  (query: Record<string, unknown>, _branchId: string, isScoped: boolean) => {
    if (isScoped && _branchId) {
      return {
        ...query,
        eq: mock.fn(() => ({
          single: mock.fn(() => resolved({ id: "order-id", status: "draft" })),
        })),
      };
    }
    return query;
  },
);
mockMod("@/lib/branches", { withBranchFilter: withBranchFilterMock });

let mockCtx: Record<string, unknown> = mockActionCtx();
mockMod("@/lib/action-utils", {
  requireActionContext: mock.fn(async () => mockCtx),
  requireWriteAction: mock.fn(async () => mockCtx),
});

// ─── Lazy-loaded module ──────────────────────────────────────────────

let createPurchaseOrder: (
  prevState: { error?: string } | undefined,
  fd: FormData,
) => Promise<Record<string, unknown>>;
let updatePurchaseOrderStatus: (
  orderId: string,
  status: string,
) => Promise<Record<string, unknown>>;
let receivePurchaseOrderItems: (
  prevState: { error?: string } | undefined,
  fd: FormData,
) => Promise<Record<string, unknown>>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/purchases/actions");
  createPurchaseOrder = mod.createPurchaseOrder;
  updatePurchaseOrderStatus = mod.updatePurchaseOrderStatus;
  receivePurchaseOrderItems = mod.receivePurchaseOrderItems;
});

// ─── Helpers ─────────────────────────────────────────────────────────

const VALID_ITEMS = JSON.stringify([
  {
    product_id: "p1",
    description: "Widget",
    quantity: 10,
    unit_cost: 5,
    variant_id: "v1",
  },
  { product_id: "p2", quantity: 3, unit_cost: 8 },
]);

function resetMocks() {
  withDbCaptureMock.mock.resetCalls();
  captureMock.mock.resetCalls();
  revalidateEntitiesMock.mock.resetCalls();
  revalidateEntityTagMock.mock.resetCalls();
  safeParseMock.mock.resetCalls();
  postPurchaseToJournalMock.mock.resetCalls();
  withBranchFilterMock.mock.resetCalls();
}

// ─── createPurchaseOrder tests ───────────────────────────────────────

test("createPurchaseOrder: rejects missing items", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => ({
        select: mock.fn(() => ({
          eq: mock.fn(() => ({
            single: mock.fn(() => resolved({ has_suppliers: false }, null)),
          })),
        })),
      })),
      rpc: mock.fn(() => resolved(null)),
    },
  });

  const result = await createPurchaseOrder(
    undefined,
    formData({ supplier_id: "s1", order_date: "2025-01-01" }),
  );

  assert.equal(result.error, "Барааны мэдээлэл шаардлагатай.");
});

test("createPurchaseOrder: rejects empty items array", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => ({
        select: mock.fn(() => ({
          eq: mock.fn(() => ({
            single: mock.fn(() => resolved({ has_suppliers: false }, null)),
          })),
        })),
      })),
      rpc: mock.fn(() => resolved(null)),
    },
  });

  const result = await createPurchaseOrder(
    undefined,
    formData({ items: "[]" }),
  );

  assert.equal(result.error, "Дор хаяж нэг бараа оруулна уу.");
});

test("createPurchaseOrder: rejects when org has suppliers but no supplier_id", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => ({
        select: mock.fn(() => ({
          eq: mock.fn(() => ({
            single: mock.fn(() => resolved({ has_suppliers: true }, null)),
          })),
        })),
      })),
      rpc: mock.fn(() => resolved(null)),
    },
  });

  const result = await createPurchaseOrder(
    undefined,
    formData({ order_date: "2025-01-01", items: VALID_ITEMS }),
  );

  assert.equal(result.error, "Нийлүүлэгч сонгоно уу.");
});

test("createPurchaseOrder: creates successfully", async () => {
  resetMocks();
  const insertOrderMock = mock.fn(() => resolved(null, null));
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn((table: string) => {
        if (table === "organizations") {
          return {
            select: mock.fn(() => ({
              eq: mock.fn(() => ({
                single: mock.fn(() => resolved({ has_suppliers: true }, null)),
              })),
            })),
          };
        }
        if (table === "purchase_orders") {
          return {
            insert: mock.fn(() => ({
              select: mock.fn(() => ({
                single: mock.fn(() => resolved({ id: "po-id-123" }, null)),
              })),
            })),
          };
        }
        if (table === "purchase_order_items") {
          return {
            insert: insertOrderMock,
          };
        }
        return {};
      }),
      rpc: mock.fn(() => resolved("PO-0001")),
    },
  });

  const result = await createPurchaseOrder(
    undefined,
    formData({
      supplier_id: "s1",
      order_date: "2025-01-01",
      expected_date: "2025-01-15",
      notes: "Urgent order",
      items: VALID_ITEMS,
    }),
  );

  assert.deepEqual(result, { success: true, error: undefined });
  assert.equal(postPurchaseToJournalMock.mock.callCount(), 1);
  assert.deepEqual(revalidateEntitiesMock.mock.calls[0]?.arguments[0], [
    "purchases",
  ]);
});

test("createPurchaseOrder: handles RPC order number error", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => ({
        select: mock.fn(() => ({
          eq: mock.fn(() => ({
            single: mock.fn(() => resolved({ has_suppliers: false }, null)),
          })),
        })),
      })),
      rpc: mock.fn(() => resolved(null, { message: "RPC failed" })),
    },
  });

  const result = await createPurchaseOrder(
    undefined,
    formData({ items: VALID_ITEMS }),
  );

  assert.equal(result.error, "Захиалгын дугаар үүсгэхэд алдаа гарлаа.");
});

test("createPurchaseOrder: handles PO insert error", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn((table: string) => {
        if (table === "organizations") {
          return {
            select: mock.fn(() => ({
              eq: mock.fn(() => ({
                single: mock.fn(() => resolved({ has_suppliers: false }, null)),
              })),
            })),
          };
        }
        if (table === "purchase_orders") {
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
        return {};
      }),
      rpc: mock.fn(() => resolved("PO-0001")),
    },
  });

  const result = await createPurchaseOrder(
    undefined,
    formData({ items: VALID_ITEMS }),
  );

  assert.ok(result.error?.includes("Захиалга үүсгэхэд алдаа гарлаа"));
});

test("createPurchaseOrder: handles items insert error with rollback", async () => {
  resetMocks();
  const deleteMock = mock.fn(() => ({
    eq: mock.fn(() => resolved(null, null)),
  }));
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn((table: string) => {
        if (table === "organizations") {
          return {
            select: mock.fn(() => ({
              eq: mock.fn(() => ({
                single: mock.fn(() => resolved({ has_suppliers: false }, null)),
              })),
            })),
          };
        }
        if (table === "purchase_orders") {
          return {
            insert: mock.fn(() => ({
              select: mock.fn(() => ({
                single: mock.fn(() => resolved({ id: "po-id-rollback" }, null)),
              })),
            })),
            delete: deleteMock,
          };
        }
        if (table === "purchase_order_items") {
          return {
            insert: mock.fn(() =>
              resolved(null, { message: "items insert failed" }),
            ),
          };
        }
        return {};
      }),
      rpc: mock.fn(() => resolved("PO-0002")),
    },
  });

  const result = await createPurchaseOrder(
    undefined,
    formData({ items: VALID_ITEMS }),
  );

  assert.ok(result.error?.includes("Барааны мэдээлэл хадгалахад алдаа гарлаа"));
  assert.equal(deleteMock.mock.callCount(), 1);
});

test("createPurchaseOrder: rejects invalid items JSON", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => ({
        select: mock.fn(() => ({
          eq: mock.fn(() => ({
            single: mock.fn(() => resolved({ has_suppliers: false }, null)),
          })),
        })),
      })),
      rpc: mock.fn(() => resolved(null)),
    },
  });

  const result = await createPurchaseOrder(
    undefined,
    formData({ items: "not-json" }),
  );

  assert.equal(result.error, "Барааны мэдээллийн формат буруу байна.");
});

test("createPurchaseOrder: rejects item with missing product_id", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => ({
        select: mock.fn(() => ({
          eq: mock.fn(() => ({
            single: mock.fn(() => resolved({ has_suppliers: false }, null)),
          })),
        })),
      })),
      rpc: mock.fn(() => resolved(null)),
    },
  });

  const items = JSON.stringify([{ product_id: "", quantity: 5, unit_cost: 3 }]);

  const result = await createPurchaseOrder(undefined, formData({ items }));

  assert.equal(result.error, "Бүтээгдэхүүн сонгоно уу.");
});

test("createPurchaseOrder: rejects item with zero quantity", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => ({
        select: mock.fn(() => ({
          eq: mock.fn(() => ({
            single: mock.fn(() => resolved({ has_suppliers: false }, null)),
          })),
        })),
      })),
      rpc: mock.fn(() => resolved(null)),
    },
  });

  const items = JSON.stringify([
    { product_id: "p1", quantity: 0, unit_cost: 3 },
  ]);

  const result = await createPurchaseOrder(undefined, formData({ items }));

  assert.equal(result.error, "Тоо хэмжээ 0-ээс их байх ёстой.");
});

// ─── updatePurchaseOrderStatus tests ─────────────────────────────────

test("updatePurchaseOrderStatus: rejects when order not found", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => ({
        select: mock.fn(() => ({
          eq: mock.fn(() => ({
            eq: mock.fn(() => ({
              single: mock.fn(() => resolved(null, null)),
            })),
          })),
        })),
      })),
    },
  });

  const result = await updatePurchaseOrderStatus("order-123", "confirmed");

  assert.equal(result.error, "Захиалга олдсонгүй.");
});

test("updatePurchaseOrderStatus: updates status successfully (non-received)", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn((table: string) => {
        if (table === "purchase_orders") {
          return {
            select: mock.fn(() => ({
              eq: mock.fn(() => ({
                eq: mock.fn(() => ({
                  single: mock.fn(() =>
                    resolved({ id: "order-1", status: "draft" }, null),
                  ),
                })),
              })),
            })),
            update: mock.fn(() => ({
              eq: mock.fn(() => ({
                eq: mock.fn(() => resolved(null, null)),
              })),
            })),
          };
        }
        return {};
      }),
    },
  });

  const result = await updatePurchaseOrderStatus("order-1", "confirmed");

  assert.deepEqual(result, { success: true, error: undefined });
  assert.deepEqual(revalidateEntitiesMock.mock.calls[0]?.arguments[0], [
    "purchases",
    "inventory",
    "products",
  ]);
  assert.equal(revalidateEntityTagMock.mock.calls[0]?.arguments[0], "products");
});

test("updatePurchaseOrderStatus: handles received status with items (calls RPC)", async () => {
  resetMocks();
  const rpcMock = mock.fn(() => resolved(null, null));
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn((table: string) => {
        if (table === "purchase_orders") {
          return {
            select: mock.fn(() => ({
              eq: mock.fn(() => ({
                eq: mock.fn(() => ({
                  single: mock.fn(() =>
                    resolved({ id: "order-2", status: "draft" }, null),
                  ),
                })),
              })),
            })),
            update: mock.fn(() => ({
              eq: mock.fn(() => ({
                eq: mock.fn(() => resolved(null, null)),
              })),
            })),
          };
        }
        if (table === "purchase_order_items") {
          return {
            select: mock.fn(() => ({
              eq: mock.fn(() =>
                resolved(
                  [
                    {
                      id: "item-1",
                      product_id: "p1",
                      quantity: 10,
                      received_quantity: 0,
                      unit_cost: 5,
                      variant_id: null,
                    },
                    {
                      id: "item-2",
                      product_id: "p2",
                      quantity: 5,
                      received_quantity: 3,
                      unit_cost: 8,
                      variant_id: "v2",
                    },
                  ],
                  null,
                ),
              ),
            })),
          };
        }
        return {};
      }),
      rpc: rpcMock,
    },
  });

  const result = await updatePurchaseOrderStatus("order-2", "received");

  assert.deepEqual(result, { success: true, error: undefined });
  assert.equal(rpcMock.mock.callCount(), 1);
  assert.equal(
    rpcMock.mock.calls[0]?.arguments[0],
    "process_restock_stock_movements",
  );
  const rpcArgs = rpcMock.mock.calls[0]?.arguments[1] as Record<
    string,
    unknown
  >;
  assert.equal(rpcArgs.p_po_id, "order-2");
  assert.ok(Array.isArray(rpcArgs.p_items));
  assert.equal((rpcArgs.p_items as Array<unknown>).length, 2);
  assert.equal(rpcArgs.p_mark_received, true);
});

test("updatePurchaseOrderStatus: handles received status with no items (skips RPC)", async () => {
  resetMocks();
  const rpcMock = mock.fn(() => resolved(null, null));
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn((table: string) => {
        if (table === "purchase_orders") {
          return {
            select: mock.fn(() => ({
              eq: mock.fn(() => ({
                eq: mock.fn(() => ({
                  single: mock.fn(() =>
                    resolved({ id: "order-3", status: "draft" }, null),
                  ),
                })),
              })),
            })),
            update: mock.fn(() => ({
              eq: mock.fn(() => ({
                eq: mock.fn(() => resolved(null, null)),
              })),
            })),
          };
        }
        if (table === "purchase_order_items") {
          return {
            select: mock.fn(() => ({
              eq: mock.fn(() => resolved([], null)),
            })),
          };
        }
        return {};
      }),
      rpc: rpcMock,
    },
  });

  const result = await updatePurchaseOrderStatus("order-3", "received");

  assert.deepEqual(result, { success: true, error: undefined });
  assert.equal(rpcMock.mock.callCount(), 0);
});

test("updatePurchaseOrderStatus: handles RPC error on received", async () => {
  resetMocks();
  const rpcMock = mock.fn(() => resolved(null, { message: "restock failed" }));
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn((table: string) => {
        if (table === "purchase_orders") {
          return {
            select: mock.fn(() => ({
              eq: mock.fn(() => ({
                eq: mock.fn(() => ({
                  single: mock.fn(() =>
                    resolved({ id: "order-4", status: "draft" }, null),
                  ),
                })),
              })),
            })),
          };
        }
        if (table === "purchase_order_items") {
          return {
            select: mock.fn(() => ({
              eq: mock.fn(() =>
                resolved(
                  [
                    {
                      id: "item-1",
                      product_id: "p1",
                      quantity: 10,
                      received_quantity: 0,
                      unit_cost: 5,
                      variant_id: null,
                    },
                  ],
                  null,
                ),
              ),
            })),
          };
        }
        return {};
      }),
      rpc: rpcMock,
    },
  });

  const result = await updatePurchaseOrderStatus("order-4", "received");

  assert.ok(result.error?.includes("Бараа хүлээн авахад алдаа"));
});

// ─── receivePurchaseOrderItems tests ─────────────────────────────────

test("receivePurchaseOrderItems: rejects missing order_id", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => ({
        select: mock.fn(() => ({
          eq: mock.fn(() => ({
            eq: mock.fn(() => ({
              single: mock.fn(() => resolved(null, null)),
            })),
          })),
        })),
      })),
    },
  });

  const result = await receivePurchaseOrderItems(
    undefined,
    formData({ items: '[{"item_id":"i1","received_quantity":5}]' }),
  );

  assert.equal(result.error, "Өгөгдөл дутуу байна.");
});

test("receivePurchaseOrderItems: rejects invalid items JSON", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => ({
        select: mock.fn(() => ({
          eq: mock.fn(() => ({
            eq: mock.fn(() => ({
              single: mock.fn(() => resolved(null, null)),
            })),
          })),
        })),
      })),
    },
  });

  const result = await receivePurchaseOrderItems(
    undefined,
    formData({ order_id: "order-1", items: "not-json" }),
  );

  assert.equal(result.error, "Барааны мэдээллийн формат буруу байна.");
});

test("receivePurchaseOrderItems: processes successfully", async () => {
  resetMocks();
  const rpcMock = mock.fn(() => resolved(null, null));
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn((table: string) => {
        if (table === "purchase_orders") {
          return {
            select: mock.fn(() => ({
              eq: mock.fn(() => ({
                eq: mock.fn(() => ({
                  single: mock.fn(() =>
                    resolved(
                      {
                        id: "order-r1",
                        status: "confirmed",
                        organization_id: "test-org-id",
                      },
                      null,
                    ),
                  ),
                })),
              })),
            })),
          };
        }
        return {};
      }),
      rpc: rpcMock,
    },
  });

  const items = JSON.stringify([{ item_id: "i1", received_quantity: 5 }]);

  const result = await receivePurchaseOrderItems(
    undefined,
    formData({ order_id: "order-r1", items }),
  );

  assert.deepEqual(result, { success: true, error: undefined });
  assert.equal(rpcMock.mock.callCount(), 1);
  assert.equal(
    rpcMock.mock.calls[0]?.arguments[0],
    "process_receive_purchase_items",
  );
  assert.deepEqual(revalidateEntitiesMock.mock.calls[0]?.arguments[0], [
    "purchases",
  ]);
  assert.equal(revalidateEntityTagMock.mock.calls[0]?.arguments[0], "products");
});

test("receivePurchaseOrderItems: handles RPC error", async () => {
  resetMocks();
  const rpcMock = mock.fn(() =>
    resolved(null, { message: "receive items failed" }),
  );
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn((table: string) => {
        if (table === "purchase_orders") {
          return {
            select: mock.fn(() => ({
              eq: mock.fn(() => ({
                eq: mock.fn(() => ({
                  single: mock.fn(() =>
                    resolved(
                      {
                        id: "order-r2",
                        status: "confirmed",
                        organization_id: "test-org-id",
                      },
                      null,
                    ),
                  ),
                })),
              })),
            })),
          };
        }
        return {};
      }),
      rpc: rpcMock,
    },
  });

  const items = JSON.stringify([{ item_id: "i1", received_quantity: 3 }]);

  const result = await receivePurchaseOrderItems(
    undefined,
    formData({ order_id: "order-r2", items }),
  );

  assert.equal(result.error, "receive items failed");
});

test("receivePurchaseOrderItems: handles rpcResult with embedded error property", async () => {
  resetMocks();
  const rpcMock = mock.fn(() =>
    resolved({ error: "insufficient stock for item i1" }, null),
  );
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn((table: string) => {
        if (table === "purchase_orders") {
          return {
            select: mock.fn(() => ({
              eq: mock.fn(() => ({
                eq: mock.fn(() => ({
                  single: mock.fn(() =>
                    resolved(
                      {
                        id: "order-r3",
                        status: "confirmed",
                        organization_id: "test-org-id",
                      },
                      null,
                    ),
                  ),
                })),
              })),
            })),
          };
        }
        return {};
      }),
      rpc: rpcMock,
    },
  });

  const items = JSON.stringify([{ item_id: "i2", received_quantity: 100 }]);

  const result = await receivePurchaseOrderItems(
    undefined,
    formData({ order_id: "order-r3", items }),
  );

  assert.equal(result.error, "insufficient stock for item i1");
});

test("receivePurchaseOrderItems: rejects order not found", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => ({
        select: mock.fn(() => ({
          eq: mock.fn(() => ({
            eq: mock.fn(() => ({
              single: mock.fn(() => resolved(null, null)),
            })),
          })),
        })),
      })),
    },
  });

  const items = JSON.stringify([{ item_id: "i1", received_quantity: 5 }]);

  const result = await receivePurchaseOrderItems(
    undefined,
    formData({ order_id: "order-missing", items }),
  );

  assert.equal(result.error, "Захиалга олдсонгүй.");
});
