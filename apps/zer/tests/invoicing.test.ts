/**
 * Tests for `src/lib/invoicing.ts` — createInvoiceFromSale.
 *
 * The function fetches a sale + items, generates an invoice number via RPC,
 * then inserts invoices + invoice_items records.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { mockMod, resolved } from "./actions-helpers";

// ─── Global mocks ────────────────────────────────────────────────────

const withDbCaptureMock = mock.fn(async (_name: string, query: Promise<unknown>) => {
  return query;
});
const captureMock = mock.fn(() => {});

mockMod("@zuiio/capture", {
  capture: captureMock,
  withDbCapture: withDbCaptureMock,
});

mockMod("server-only", {});
mockMod("@/lib/supabase/types", {
  Database: {},
});

// ─── Lazy-loaded module ──────────────────────────────────────────────

let createInvoiceFromSale: (
  supabase: unknown,
  orgId: string,
  userId: string,
  saleId: string,
  contactId?: string | null,
  branchId?: string,
) => Promise<{ invoiceId: string; invoiceNumber: string } | null>;

test.before(async () => {
  const mod = await import("@/lib/invoicing");
  createInvoiceFromSale = mod.createInvoiceFromSale;
});


// ─── Supabase mock builder ──────────────────────────────────────────

/**
 * Build a mock Supabase client for createInvoiceFromSale tests.
 *
 * The chain order for sale lookup is:
 *   from("sales").select().eq().eq().is().single()
 * For sale items:
 *   from("sale_items").select().eq().is()
 * For invoice creation:
 *   from("invoices").insert().select().single()
 * For invoice items:
 *   from("invoice_items").insert()
 * Plus top-level .rpc("generate_invoice_number")
 */
function makeSupabase(opts: {
  sale?: { total_amount: number; paid_amount: number | null } | null;
  saleError?: { message: string };
  items?: Array<Record<string, unknown>>;
  itemsNull?: boolean;
  itemsError?: { message: string };
  rpcResult?: string;
  rpcError?: { message: string };
  invoiceId?: string;
  invoiceError?: { message: string };
  itemsInsertError?: { message: string };
} = {}) {
  const saleData = opts.sale === undefined ? { total_amount: 50000, paid_amount: 50000 } : opts.sale;
  const saleError = opts.saleError ?? null;
  const saleItems = opts.itemsNull ? null : (opts.items ?? [
    {
      product_id: "prod-1",
      quantity: 2,
      unit_price: 10000,
      total_price: 20000,
      products: { name: "Widget" },
    },
  ]);
  const itemsError = opts.itemsError ?? null;
  const rpcResult = opts.rpcResult ?? "INV-2026-0001";
  const rpcError = opts.rpcError ?? null;
  const invoiceId = opts.invoiceId ?? "inv-test-id";
  const invoiceError = opts.invoiceError ?? null;
  const itemsInsertError = opts.itemsInsertError ?? null;

  // Track returned chain objects so tests can inspect them
  const chains: Record<string, unknown> = {};

  const from = mock.fn((table: string) => {
    if (table === "sales") {
      chains.sales = {
        select: mock.fn(() => ({
          eq: mock.fn(() => ({
            eq: mock.fn(() => ({
              is: mock.fn(() => ({
                single: mock.fn(() => resolved(saleData, saleError)),
              })),
            })),
          })),
        })),
      };
      return chains.sales;
    }

    if (table === "sale_items") {
      chains.saleItems = {
        select: mock.fn(() => ({
          eq: mock.fn(() => ({
            is: mock.fn(() => resolved(saleItems, itemsError)),
          })),
        })),
      };
      return chains.saleItems;
    }

    if (table === "invoices") {
      const invoiceResult = invoiceError
        ? { data: null, error: invoiceError }
        : { data: { id: invoiceId }, error: null };
      chains.invoices = {
        insert: mock.fn(() => ({
          select: mock.fn(() => ({
            single: mock.fn(() => resolved(invoiceResult.data, invoiceResult.error)),
          })),
        })),
      };
      return chains.invoices;
    }

    if (table === "invoice_items") {
      chains.invoiceItems = {
        insert: mock.fn(() => resolved(null, itemsInsertError)),
      };
      return chains.invoiceItems;
    }

    return {};
  });

  const rpc = mock.fn(() =>
    rpcError ? resolved(null, rpcError) : resolved(rpcResult),
  );

  return { from, rpc, chains };
}
// ─── Tests ───────────────────────────────────────────────────────────

test.beforeEach(() => {
  withDbCaptureMock.mock.resetCalls();
  captureMock.mock.resetCalls();
});
test("creates invoice successfully with sale items", async () => {
  const sb = makeSupabase();
  const result = await createInvoiceFromSale(
    sb,
    "org-1",
    "user-1",
    "sale-1",
    "contact-1",
    "branch-1",
  );

  assert.deepEqual(result, {
    invoiceId: "inv-test-id",
    invoiceNumber: "INV-2026-0001",
  });
});

// 2. Returns null when sale not found
test("returns null when sale not found", async () => {
  const sb = makeSupabase({ sale: null });
  const result = await createInvoiceFromSale(sb, "org-1", "user-1", "sale-missing", null, "branch-1");

  assert.equal(result, null);
  assert.equal(captureMock.mock.callCount(), 1);
  const [err, ctx] = captureMock.mock.calls[0].arguments;
  assert.ok(err instanceof Error);
  assert.ok(String(err).includes("sale not found"));
  assert.deepEqual(ctx, { context: "invoicing: sale lookup" });
});

// 3. Returns null when sale has no items
test("returns null when sale has no items", async () => {
  const sb = makeSupabase({ items: [] });
  const result = await createInvoiceFromSale(sb, "org-1", "user-1", "sale-1", null, "branch-1");

  assert.equal(result, null);
  assert.equal(captureMock.mock.callCount(), 1);
  const [err, ctx] = captureMock.mock.calls[0].arguments;
  assert.ok(err instanceof Error);
  assert.ok(String(err).includes("no sale items found"));
  assert.deepEqual(ctx, { context: "invoicing: items lookup" });
});

// 4. Returns null when items data is null
test("returns null when sale items data is null", async () => {
  const sb = makeSupabase({ itemsNull: true });
  const result = await createInvoiceFromSale(sb, "org-1", "user-1", "sale-1", null, "branch-1");

  assert.equal(result, null);
  assert.equal(captureMock.mock.callCount(), 1);
  const [err] = captureMock.mock.calls[0].arguments;
  assert.ok(String(err).includes("no sale items found"));
});

// 5. Handles invoice number generation via RPC
test("generates invoice number via RPC", async () => {
  const sb = makeSupabase({ rpcResult: "INV-2026-0042" });
  const result = await createInvoiceFromSale(sb, "org-1", "user-1", "sale-1", null, "branch-1");

  assert.equal(result?.invoiceNumber, "INV-2026-0042");
  assert.equal(sb.rpc.mock.callCount(), 1);
  assert.equal(sb.rpc.mock.calls[0].arguments[0], "generate_invoice_number");
});

// 6. Captures RPC error but still proceeds with invoice creation
test("captures RPC error but still creates invoice", async () => {
  const sb = makeSupabase({ rpcError: { message: "RPC failed" } });
  const result = await createInvoiceFromSale(sb, "org-1", "user-1", "sale-1", null, "branch-1");

  // Invoice is still created even when RPC fails (invoiceNumber will be undefined/null)
  assert.ok(result !== null);
  assert.equal(result?.invoiceId, "inv-test-id");
  assert.equal(captureMock.mock.callCount(), 1);
  const [err, ctx] = captureMock.mock.calls[0].arguments;
  assert.deepEqual(ctx, { context: "invoicing: generate number" });
});

test("creates invoice_items from sale items with product names", async () => {
  const items = [
    {
      product_id: "prod-1",
      quantity: 2,
      unit_price: 10000,
      total_price: 20000,
      products: { name: "Widget" },
    },
    {
      product_id: "prod-2",
      quantity: 1,
      unit_price: 5000,
      total_price: 5000,
      products: null,
    },
  ];
  const sb = makeSupabase({ items, invoiceId: "inv-new" });
  const result = await createInvoiceFromSale(sb, "org-1", "user-1", "sale-1", null, "branch-1");

  assert.equal(result?.invoiceId, "inv-new");

  const invoiceItemsInsert = sb.chains.invoiceItems.insert as mock.Mock;
  assert.equal(invoiceItemsInsert.mock.callCount(), 1);

  const insertedItems = invoiceItemsInsert.mock.calls[0].arguments[0] as Array<Record<string, unknown>>;
  assert.equal(insertedItems.length, 2);

  assert.equal(insertedItems[0].invoice_id, "inv-new");
  assert.equal(insertedItems[0].product_id, "prod-1");
  assert.equal(insertedItems[0].description, "Widget");
  assert.equal(insertedItems[0].quantity, 2);
  assert.equal(insertedItems[0].unit_price, 10000);
  assert.equal(insertedItems[0].total_price, 20000);

  // Product with null name defaults to "Бүтээгдэхүүн"
  assert.equal(insertedItems[1].description, "Бүтээгдэхүүн");
});

// 8. Returns null when branchId is missing
test("returns null when branchId is missing", async () => {
  const sb = makeSupabase();
  const result = await createInvoiceFromSale(sb, "org-1", "user-1", "sale-1", null);

  assert.equal(result, null);
  assert.equal(captureMock.mock.callCount(), 1);
  const [err, ctx] = captureMock.mock.calls[0].arguments;
  assert.ok(err instanceof Error);
  assert.ok(String(err).includes("branchId is required"));
  assert.deepEqual(ctx, { context: "invoicing: branchId guard" });
});

// 9. Returns null when branchId is undefined (not provided)
test("returns null when branchId is undefined", async () => {
  const sb = makeSupabase();
  const result = await createInvoiceFromSale(sb, "org-1", "user-1", "sale-1", null, undefined);

  assert.equal(result, null);
  assert.equal(captureMock.mock.callCount(), 1);
  const [err] = captureMock.mock.calls[0].arguments;
  assert.ok(String(err).includes("branchId is required"));
});

// 10. Captures errors on invoice creation failure
test("returns null and captures error on invoice creation failure", async () => {
  const sb = makeSupabase({ invoiceError: { message: "insert failed" } });
  const result = await createInvoiceFromSale(sb, "org-1", "user-1", "sale-1", null, "branch-1");

  assert.equal(result, null);
  assert.equal(captureMock.mock.callCount(), 1);
  const [err, ctx] = captureMock.mock.calls[0].arguments;
  assert.deepEqual(ctx, { context: "invoicing: create invoice" });
});

// 11. Captures error when invoice items insert fails (still returns invoiceId)
test("returns invoiceId even when invoice_items insert fails", async () => {
  const sb = makeSupabase({ itemsInsertError: { message: "items insert failed" } });
  const result = await createInvoiceFromSale(sb, "org-1", "user-1", "sale-1", null, "branch-1");

  // Invoice was created successfully — items failure is logged but doesn't roll back
  assert.deepEqual(result, {
    invoiceId: "inv-test-id",
    invoiceNumber: "INV-2026-0001",
  });
  assert.equal(captureMock.mock.callCount(), 1);
  const [err, ctx] = captureMock.mock.calls[0].arguments;
  assert.deepEqual(ctx, { context: "invoicing: create invoice items" });
});

test("passes null contact_id when contactId is not provided", async () => {
  const sb = makeSupabase({ invoiceId: "inv-contact-test" });
  const result = await createInvoiceFromSale(sb, "org-1", "user-1", "sale-1", null, "branch-1");

  assert.equal(result?.invoiceId, "inv-contact-test");

  const invoicesInsert = sb.chains.invoices.insert as mock.Mock;
  const insertArg = invoicesInsert.mock.calls[0].arguments[0] as Record<string, unknown>;
  assert.equal(insertArg.contact_id, null);
});

test("passes provided contact_id to invoice insert", async () => {
  const sb = makeSupabase();
  await createInvoiceFromSale(sb, "org-1", "user-1", "sale-1", "contact-42", "branch-1");

  const invoicesInsert = sb.chains.invoices.insert as mock.Mock;
  const insertArg = invoicesInsert.mock.calls[0].arguments[0] as Record<string, unknown>;
  assert.equal(insertArg.contact_id, "contact-42");
});

test("creates invoice with correct status and sale totals", async () => {
  const sb = makeSupabase({
    sale: { total_amount: 150000, paid_amount: 100000 },
  });
  await createInvoiceFromSale(sb, "org-1", "user-1", "sale-1", null, "branch-1");

  const invoicesInsert = sb.chains.invoices.insert as mock.Mock;
  const insertArg = invoicesInsert.mock.calls[0].arguments[0] as Record<string, unknown>;

  assert.equal(insertArg.status, "paid");
  assert.equal(insertArg.total_amount, 150000);
  assert.equal(insertArg.paid_amount, 100000);
  assert.equal(insertArg.organization_id, "org-1");
  assert.equal(insertArg.created_by, "user-1");
  assert.equal(insertArg.branch_id, "branch-1");
});

test("defaults paid_amount to 0 when sale paid_amount is null", async () => {
  const sb = makeSupabase({
    sale: { total_amount: 50000, paid_amount: null },
  });
  await createInvoiceFromSale(sb, "org-1", "user-1", "sale-1", null, "branch-1");

  const invoicesInsert = sb.chains.invoices.insert as mock.Mock;
  const insertArg = invoicesInsert.mock.calls[0].arguments[0] as Record<string, unknown>;
  assert.equal(insertArg.paid_amount, 0);
});
