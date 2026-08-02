/**
 * Tests for `quotations/actions.ts` — createQuotation, updateQuotationStatus, convertQuotationToSale.
 *
 * Run: tsx --experimental-test-module-mocks --test tests/actions-quotations.test.ts
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

const getStringMock = mock.fn((fd: FormData, key: string) => {
  const v = fd.get(key);
  return v === null ? "" : String(v);
});
mockMod("@/lib/validation", { getString: getStringMock });

const safeParseMock = mock.fn(() => ({ success: true, data: {} }));
mockMod("@/lib/validation-schemas", {
  quotationSchema: { safeParse: safeParseMock },
});

const withBranchFilterMock = mock.fn(
  (query: Record<string, unknown>, _branchId: string, _isScoped: boolean) =>
    query,
);
mockMod("@/lib/branches", { withBranchFilter: withBranchFilterMock });

const createInvoiceFromSaleMock = mock.fn(async () => {});
mockMod("@/lib/invoicing", {
  createInvoiceFromSale: createInvoiceFromSaleMock,
});

let mockCtx: Record<string, unknown> = mockActionCtx();
mockMod("@/lib/action-utils", {
  requireActionContext: mock.fn(async () => mockCtx),
  requireWriteAction: mock.fn(async () => mockCtx),
});

// ─── Lazy-loaded module ──────────────────────────────────────────────

let createQuotation: (
  prevState: { error?: string } | undefined,
  fd: FormData,
) => Promise<Record<string, unknown>>;
let updateQuotationStatus: (
  quotationId: string,
  status: string,
) => Promise<Record<string, unknown>>;
let convertQuotationToSale: (
  quotationId: string,
) => Promise<Record<string, unknown>>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/quotations/actions");
  createQuotation = mod.createQuotation;
  updateQuotationStatus = mod.updateQuotationStatus;
  convertQuotationToSale = mod.convertQuotationToSale;
});

// ─── Helpers ─────────────────────────────────────────────────────────

const VALID_ITEMS = JSON.stringify([
  {
    product_id: "p1",
    description: "Widget",
    quantity: 10,
    unit_price: 5,
    variant_id: "v1",
  },
  { product_id: "p2", description: "Gadget", quantity: 3, unit_price: 8 },
]);

function resetMocks() {
  withDbCaptureMock.mock.resetCalls();
  captureMock.mock.resetCalls();
  revalidateEntitiesMock.mock.resetCalls();
  revalidateEntityTagMock.mock.resetCalls();
  safeParseMock.mock.resetCalls();
  withBranchFilterMock.mock.resetCalls();
  createInvoiceFromSaleMock.mock.resetCalls();
}

// ─── createQuotation tests ───────────────────────────────────────────

test("createQuotation: rejects Zod validation error", async () => {
  resetMocks();
  safeParseMock.mock.mockImplementation(() => ({
    success: false,
    error: { issues: [{ message: "Асуулт гарлаа" }] },
  }));

  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => ({})),
      rpc: mock.fn(() => resolved(null)),
    },
  });

  const result = await createQuotation(
    undefined,
    formData({ items: VALID_ITEMS }),
  );

  assert.equal(result.error, "Асуулт гарлаа");
  safeParseMock.mock.mockImplementation(() => ({ success: true, data: {} }));
});

test("createQuotation: rejects missing items", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => ({})),
      rpc: mock.fn(() => resolved(null)),
    },
  });

  const result = await createQuotation(
    undefined,
    formData({ contact_id: "c1" }),
  );

  assert.equal(result.error, "Барааны мэдээлэл шаардлагатай.");
});

test("createQuotation: creates quotation successfully", async () => {
  resetMocks();
  const insertItemsMock = mock.fn(() => resolved(null, null));
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn((table: string) => {
        if (table === "quotations") {
          return {
            insert: mock.fn(() => ({
              select: mock.fn(() => ({
                single: mock.fn(() => resolved({ id: "q-new-id" }, null)),
              })),
            })),
          };
        }
        if (table === "quotation_items") {
          return { insert: insertItemsMock };
        }
        return {};
      }),
      rpc: mock.fn(() => resolved("Q-0001")),
    },
  });

  const result = await createQuotation(
    undefined,
    formData({
      contact_id: "c1",
      issue_date: "2025-01-01",
      expiry_date: "2025-02-01",
      notes: "Test quote",
      items: VALID_ITEMS,
    }),
  );

  assert.deepEqual(result, { success: true, error: undefined });
  assert.equal(insertItemsMock.mock.callCount(), 1);
  assert.equal(revalidateEntitiesMock.mock.callCount(), 1);
  assert.deepEqual(revalidateEntitiesMock.mock.calls[0]?.arguments[0], [
    "quotations",
  ]);
});

test("createQuotation: handles RPC generate_quote_number error", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => ({})),
      rpc: mock.fn(() => resolved(null, { message: "RPC failed" })),
    },
  });

  const result = await createQuotation(
    undefined,
    formData({ items: VALID_ITEMS }),
  );

  assert.equal(result.error, "Үнийн саналын дугаар үүсгэхэд алдаа гарлаа.");
});

test("createQuotation: handles quotation insert error", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => ({})),
      rpc: mock.fn(() => resolved("Q-0002")),
    },
  });

  // Override withDbCapture to return error for insert call
  withDbCaptureMock.mock.mockImplementation(
    async (_name: string, query: Promise<unknown>) => {
      const result = await query;
      // If it resolves to something that looks like an insert, inject error
      return result;
    },
  );

  // We need the insert to fail — simulate by returning error via the supabase chain
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn((table: string) => {
        if (table === "quotations") {
          return {
            insert: mock.fn(() => ({
              select: mock.fn(() => ({
                single: mock.fn(() =>
                  resolved(null, { message: "Insert failed" }),
                ),
              })),
            })),
          };
        }
        return {};
      }),
      rpc: mock.fn(() => resolved("Q-0003")),
    },
  });

  const result = await createQuotation(
    undefined,
    formData({ items: VALID_ITEMS }),
  );

  assert.ok(result.error?.includes("Үнийн санал үүсгэхэд алдаа гарлаа"));
});

test("createQuotation: handles items insert error with rollback", async () => {
  resetMocks();
  const deleteMock = mock.fn(() => ({
    eq: mock.fn(() => resolved(null, null)),
  }));
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn((table: string) => {
        if (table === "quotations") {
          return {
            insert: mock.fn(() => ({
              select: mock.fn(() => ({
                single: mock.fn(() => resolved({ id: "q-rollback" }, null)),
              })),
            })),
            delete: deleteMock,
          };
        }
        if (table === "quotation_items") {
          return {
            insert: mock.fn(() =>
              resolved(null, { message: "items insert failed" }),
            ),
          };
        }
        return {};
      }),
      rpc: mock.fn(() => resolved("Q-0004")),
    },
  });

  const result = await createQuotation(
    undefined,
    formData({ items: VALID_ITEMS }),
  );

  assert.ok(result.error?.includes("Барааны мэдээлэл хадгалахад алдаа гарлаа"));
  assert.equal(deleteMock.mock.callCount(), 1);
});

// ─── updateQuotationStatus tests ─────────────────────────────────────

test("updateQuotationStatus: updates status successfully", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn((table: string) => {
        if (table === "quotations") {
          return {
            select: mock.fn(() => ({
              eq: mock.fn(() => ({
                eq: mock.fn(() => ({
                  single: mock.fn(() =>
                    resolved({ status: "draft", quote_number: "Q-0001" }, null),
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

  const result = await updateQuotationStatus("q-1", "sent");

  assert.deepEqual(result, { success: true, error: undefined });
  assert.equal(revalidateEntitiesMock.mock.callCount(), 1);
  assert.deepEqual(revalidateEntitiesMock.mock.calls[0]?.arguments[0], [
    "quotations",
  ]);
});

test("updateQuotationStatus: rejects when quotation not found", async () => {
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

  const result = await updateQuotationStatus("q-missing", "sent");

  assert.equal(result.error, "Үнийн санал олдсонгүй.");
});

test("updateQuotationStatus: handles update DB error", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn((table: string) => {
        if (table === "quotations") {
          return {
            select: mock.fn(() => ({
              eq: mock.fn(() => ({
                eq: mock.fn(() => ({
                  single: mock.fn(() =>
                    resolved({ status: "draft", quote_number: "Q-0001" }, null),
                  ),
                })),
              })),
            })),
            update: mock.fn(() => ({
              eq: mock.fn(() => ({
                eq: mock.fn(() => resolved(null, { message: "Update failed" })),
              })),
            })),
          };
        }
        return {};
      }),
    },
  });

  const result = await updateQuotationStatus("q-1", "sent");

  assert.ok(result.error?.includes("Төлөв шинэчлэхэд алдаа гарлаа"));
});

// ─── convertQuotationToSale tests ────────────────────────────────────

test("convertQuotationToSale: converts successfully", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn((table: string) => {
        if (table === "quotations") {
          return {
            select: mock.fn(() => ({
              eq: mock.fn(() => ({
                eq: mock.fn(() => ({
                  single: mock.fn(() =>
                    resolved(
                      {
                        id: "q-conv",
                        status: "sent",
                        total_amount: 86,
                        contact_id: "c1",
                        notes: "Please hurry",
                        quote_number: "Q-0010",
                      },
                      null,
                    ),
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
        if (table === "quotation_items") {
          return {
            select: mock.fn(() => ({
              eq: mock.fn(() =>
                resolved(
                  [
                    { product_id: "p1", quantity: 10, unit_price: 5 },
                    { product_id: "p2", quantity: 3, unit_price: 8 },
                  ],
                  null,
                ),
              ),
            })),
          };
        }
        if (table === "sales") {
          return {
            insert: mock.fn(() => ({
              select: mock.fn(() => ({
                single: mock.fn(() => resolved({ id: "sale-new" }, null)),
              })),
            })),
            delete: mock.fn(() => ({
              eq: mock.fn(() => resolved(null, null)),
            })),
          };
        }
        if (table === "sale_items") {
          return {
            insert: mock.fn(() => resolved(null, null)),
          };
        }
        if (table === "stock_movements") {
          return {
            insert: mock.fn(() => resolved(null, null)),
          };
        }
        if (table === "products") {
          return {
            select: mock.fn(() => ({
              eq: mock.fn(() => ({
                single: mock.fn(() => resolved({ current_stock: 50 }, null)),
              })),
            })),
            update: mock.fn(() => ({
              eq: mock.fn(() => ({
                gte: mock.fn(() => resolved(null, null)),
              })),
            })),
          };
        }
        return {};
      }),
    },
  });

  const result = await convertQuotationToSale("q-conv");

  assert.deepEqual(result, {
    success: true,
    error: undefined,
    saleId: "sale-new",
  });
  assert.equal(revalidateEntitiesMock.mock.callCount(), 1);
  assert.deepEqual(revalidateEntitiesMock.mock.calls[0]?.arguments[0], [
    "quotations",
    "sales",
    "invoices",
    "inventory",
  ]);
  assert.equal(createInvoiceFromSaleMock.mock.callCount(), 1);
});

test("convertQuotationToSale: rejects when quotation not found", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => ({
        select: mock.fn(() => ({
          eq: mock.fn(() => ({
            eq: mock.fn(() => ({
              single: mock.fn(() => resolved(null, { message: "not found" })),
            })),
          })),
        })),
      })),
    },
  });

  const result = await convertQuotationToSale("q-missing");

  assert.equal(result.error, "Үнийн санал олдсонгүй.");
});

test("convertQuotationToSale: rejects when already converted", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => ({
        select: mock.fn(() => ({
          eq: mock.fn(() => ({
            eq: mock.fn(() => ({
              single: mock.fn(() =>
                resolved(
                  {
                    id: "q-conv",
                    status: "converted",
                    total_amount: 100,
                    contact_id: "c1",
                    notes: null,
                    quote_number: "Q-0011",
                  },
                  null,
                ),
              ),
            })),
          })),
        })),
      })),
    },
  });

  const result = await convertQuotationToSale("q-conv");

  assert.equal(result.error, "Энэ үнийн санал аль хэдийн борлуулалт болсон.");
});

test("convertQuotationToSale: rejects when no items", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn((table: string) => {
        if (table === "quotations") {
          return {
            select: mock.fn(() => ({
              eq: mock.fn(() => ({
                eq: mock.fn(() => ({
                  single: mock.fn(() =>
                    resolved(
                      {
                        id: "q-conv",
                        status: "sent",
                        total_amount: 0,
                        contact_id: "c1",
                        notes: null,
                        quote_number: "Q-0012",
                      },
                      null,
                    ),
                  ),
                })),
              })),
            })),
          };
        }
        if (table === "quotation_items") {
          return {
            select: mock.fn(() => ({
              eq: mock.fn(() => resolved([], null)),
            })),
          };
        }
        return {};
      }),
    },
  });

  const result = await convertQuotationToSale("q-conv");

  assert.equal(result.error, "Үнийн саналд бараа байхгүй байна.");
});

test("convertQuotationToSale: handles sale items insert error with rollback", async () => {
  resetMocks();
  const deleteSaleMock = mock.fn(() => ({
    eq: mock.fn(() => resolved(null, null)),
  }));
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn((table: string) => {
        if (table === "quotations") {
          return {
            select: mock.fn(() => ({
              eq: mock.fn(() => ({
                eq: mock.fn(() => ({
                  single: mock.fn(() =>
                    resolved(
                      {
                        id: "q-conv",
                        status: "sent",
                        total_amount: 50,
                        contact_id: "c1",
                        notes: null,
                        quote_number: "Q-0013",
                      },
                      null,
                    ),
                  ),
                })),
              })),
            })),
          };
        }
        if (table === "quotation_items") {
          return {
            select: mock.fn(() => ({
              eq: mock.fn(() =>
                resolved(
                  [{ product_id: "p1", quantity: 5, unit_price: 10 }],
                  null,
                ),
              ),
            })),
          };
        }
        if (table === "sales") {
          return {
            insert: mock.fn(() => ({
              select: mock.fn(() => ({
                single: mock.fn(() => resolved({ id: "sale-rollback" }, null)),
              })),
            })),
            delete: deleteSaleMock,
          };
        }
        if (table === "sale_items") {
          return {
            insert: mock.fn(() =>
              resolved(null, { message: "sale_items insert failed" }),
            ),
          };
        }
        return {};
      }),
    },
  });

  const result = await convertQuotationToSale("q-conv");

  assert.ok(
    result.error?.includes("Борлуулалтын бараа хадгалахад алдаа гарлаа"),
  );
  assert.equal(deleteSaleMock.mock.callCount(), 1);
});

test("convertQuotationToSale: handles sale insert error", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn((table: string) => {
        if (table === "quotations") {
          return {
            select: mock.fn(() => ({
              eq: mock.fn(() => ({
                eq: mock.fn(() => ({
                  single: mock.fn(() =>
                    resolved(
                      {
                        id: "q-conv",
                        status: "sent",
                        total_amount: 50,
                        contact_id: "c1",
                        notes: null,
                        quote_number: "Q-0014",
                      },
                      null,
                    ),
                  ),
                })),
              })),
            })),
          };
        }
        if (table === "quotation_items") {
          return {
            select: mock.fn(() => ({
              eq: mock.fn(() =>
                resolved(
                  [{ product_id: "p1", quantity: 5, unit_price: 10 }],
                  null,
                ),
              ),
            })),
          };
        }
        if (table === "sales") {
          return {
            insert: mock.fn(() => ({
              select: mock.fn(() => ({
                single: mock.fn(() =>
                  resolved(null, { message: "sale insert failed" }),
                ),
              })),
            })),
          };
        }
        return {};
      }),
    },
  });

  const result = await convertQuotationToSale("q-conv");

  assert.ok(result.error?.includes("Борлуулалт үүсгэхэд алдаа гарлаа"));
});
