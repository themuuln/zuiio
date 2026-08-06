/**
 * Tests for `invoices/actions.ts` — createInvoice, createInvoiceShareLink,
 * rotateInvoiceShareLink, revokeInvoiceShareLink, updateInvoiceStatus.
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

const logAuditEventMock = mock.fn(async () => {});
mockMod("@/lib/audit", { logAuditEventWithClient: logAuditEventMock });
mockMod("next/server", { after: (fn: () => void) => fn() });
mockMod("next/cache", {
  revalidatePath: mock.fn(() => {}),
  revalidateTag: mock.fn(() => {}),
});
mockMod("server-only", {});

mockMod("@/lib/validation", {
  getString: mock.fn((fd: FormData, key: string) => {
    const v = fd.get(key);
    return v === null ? "" : String(v);
  }),
});

const findOrCreateContactMock = mock.fn(async () => ({
  id: "contact-from-find-or-create",
}));
mockMod("@/lib/contact-utils", {
  findOrCreateContact: findOrCreateContactMock,
});

mockMod("@/lib/public-share-token", {
  generateToken: mock.fn(() => "raw-token-value"),
  hashToken: mock.fn((t: string) => `${t}-hashed`),
  defaultExpiryDate: mock.fn(() => new Date("2026-12-31")),
});

mockMod("@/lib/branches", {
  withBranchFilter: mock.fn((query: unknown) => query),
});
mockMod("next/navigation", {
  redirect: mock.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
});

let mockCtx: Record<string, unknown> = mockActionCtx();
mockMod("@/lib/action-utils", {
  requireActionContext: mock.fn(async () => mockCtx),
  requireWriteAction: mock.fn(async () => mockCtx),
});

// ─── Lazy-loaded module ──────────────────────────────────────────────

let createInvoice: (
  prev: { error?: string } | undefined,
  form: FormData,
) => Promise<unknown>;
let createInvoiceShareLink: (prev: unknown, form: FormData) => Promise<unknown>;
let rotateInvoiceShareLink: (prev: unknown, form: FormData) => Promise<unknown>;
let revokeInvoiceShareLink: (prev: unknown, form: FormData) => Promise<unknown>;
let updateInvoiceStatus: (
  invoiceId: string,
  status: string,
) => Promise<unknown>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/invoices/actions");
  createInvoice = mod.createInvoice;
  createInvoiceShareLink = mod.createInvoiceShareLink;
  rotateInvoiceShareLink = mod.rotateInvoiceShareLink;
  revokeInvoiceShareLink = mod.revokeInvoiceShareLink;
  updateInvoiceStatus = mod.updateInvoiceStatus;
});

// ─── Helpers ─────────────────────────────────────────────────────────

function resetMocks() {
  withDbCaptureMock.mock.resetCalls();
  revalidateEntitiesMock.mock.resetCalls();
  findOrCreateContactMock.mock.resetCalls();
  logAuditEventMock.mock.resetCalls();
}

/**
 * Build a Supabase mock for createInvoice tests.
 * Supports simulating errors at RPC, invoice insert, or items insert stages.
 */
function makeCreateInvoiceSupabase(
  opts: {
    rpcError?: { message: string };
    invoiceError?: { message: string };
    itemsError?: { message: string };
  } = {},
) {
  return {
    from: mock.fn((table: string) => {
      if (table === "invoices") {
        const singleResult = opts.invoiceError
          ? resolved(null, opts.invoiceError)
          : resolved({ id: "test-invoice-id" });
        return {
          insert: mock.fn(() => ({
            select: mock.fn(() => ({
              single: mock.fn(() => singleResult),
            })),
          })),
        };
      }
      if (table === "invoice_items") {
        return {
          insert: mock.fn(() => resolved(null, opts.itemsError || null)),
        };
      }
      return {};
    }),
    rpc: mock.fn(() =>
      opts.rpcError ? resolved(null, opts.rpcError) : resolved("INV-001"),
    ),
  };
}

/**
 * Build a Supabase mock for share link tests (create, rotate, revoke).
 * The update chain returns the terminal result after two .eq() calls.
 */
function makeShareLinkSupabase(updateError: { message: string } | null = null) {
  const terminalResult = updateError ? { error: updateError } : { error: null };
  const eq2 = mock.fn(() => terminalResult);
  const eq1 = mock.fn(() => ({ eq: eq2 }));
  return {
    from: mock.fn(() => ({
      update: mock.fn(() => ({ eq: eq1 })),
    })),
    rpc: mock.fn(() => resolved({})),
  };
}

/**
 * Build a Supabase mock for updateInvoiceStatus tests.
 * Supports both the fetch chain (.select().eq().eq().single()) and
 * the update chain (.update().eq().eq()).
 */
function makeUpdateStatusSupabase(
  opts: {
    fetchInvoice?: { status: string } | null;
    updateError?: { message: string };
  } = {},
) {
  const fetchResult =
    opts.fetchInvoice !== undefined
      ? resolved(opts.fetchInvoice)
      : resolved(null);

  const terminalResult = opts.updateError
    ? { error: opts.updateError }
    : { error: null };

  return {
    from: mock.fn((table: string) => {
      if (table === "invoices") {
        return {
          select: mock.fn(() => {
            const eq2 = mock.fn(() => ({
              single: mock.fn(() => fetchResult),
            }));
            const eq1 = mock.fn(() => ({ eq: eq2 }));
            return { eq: eq1 };
          }),
          update: mock.fn(() => {
            const eq2 = mock.fn(() => terminalResult);
            const eq1 = mock.fn(() => ({ eq: eq2 }));
            return { eq: eq1 };
          }),
        };
      }
      return {};
    }),
    rpc: mock.fn(() => resolved({})),
  };
}

function validInvoiceForm(overrides: Record<string, string> = {}) {
  return formData({
    contact_id: "",
    new_contact_name: "",
    issue_date: "2026-01-15",
    due_date: "2026-02-15",
    notes: "Test invoice",
    items: JSON.stringify([
      {
        product_id: "prod-1",
        description: "Widget",
        quantity: 2,
        unit_price: 100,
      },
    ]),
    ...overrides,
  });
}

function shareLinkForm(overrides: Record<string, string> = {}) {
  return formData({ invoice_id: "test-invoice-id", ...overrides });
}

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

// ─── createInvoice ────────────────────────────────────────────────

test("createInvoice rejects when no branchId", async () => {
  resetMocks();
  mockCtx = mockActionCtx({ branchId: null });
  const result = await createInvoice(undefined, validInvoiceForm());
  assert.deepStrictEqual(result, { error: "Салбар сонгоогүй байна." });
});

test("createInvoice rejects missing itemsJson", async () => {
  resetMocks();
  mockCtx = mockActionCtx();
  // Omit "items" entirely so formData.get("items") returns null
  const form = formData({
    contact_id: "",
    new_contact_name: "",
    issue_date: "2026-01-15",
    due_date: "2026-02-15",
    notes: "",
  });
  const result = await createInvoice(undefined, form);
  assert.deepStrictEqual(result, { error: "Барааны мэдээлэл шаардлагатай." });
});

test("createInvoice rejects empty items array", async () => {
  resetMocks();
  mockCtx = mockActionCtx({ supabase: makeCreateInvoiceSupabase() });
  const form = validInvoiceForm({ items: "[]" });
  const result = await createInvoice(undefined, form);
  assert.deepStrictEqual(result, { error: "Дор хаяж нэг бараа оруулна уу." });
});

test("createInvoice creates with existing contact", async () => {
  resetMocks();
  mockCtx = mockActionCtx({ supabase: makeCreateInvoiceSupabase() });
  const form = validInvoiceForm({ contact_id: "existing-contact" });

  try {
    await createInvoice(undefined, form);
    assert.fail("should have thrown redirect");
  } catch (e) {
    assert.ok(String(e).includes("NEXT_REDIRECT"));
  }

  // Should NOT call findOrCreateContact when contact_id is provided
  assert.strictEqual(findOrCreateContactMock.mock.callCount(), 0);
  assert.ok(withDbCaptureMock.mock.callCount() >= 2, "invoice + items insert");
  assert.ok(revalidateEntitiesMock.mock.callCount() >= 1);
  assert.ok(logAuditEventMock.mock.callCount() >= 1);
});

test("createInvoice creates with findOrCreateContact", async () => {
  resetMocks();
  mockCtx = mockActionCtx({ supabase: makeCreateInvoiceSupabase() });
  const form = validInvoiceForm({
    contact_id: "",
    new_contact_name: "New Customer",
    new_contact_phone: "99112233",
  });

  try {
    await createInvoice(undefined, form);
    assert.fail("should have thrown redirect");
  } catch (e) {
    assert.ok(String(e).includes("NEXT_REDIRECT"));
  }

  assert.strictEqual(findOrCreateContactMock.mock.callCount(), 1);
  assert.ok(withDbCaptureMock.mock.callCount() >= 2);
  assert.ok(revalidateEntitiesMock.mock.callCount() >= 1);
});

test("createInvoice handles RPC generate_invoice_number error", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: makeCreateInvoiceSupabase({
      rpcError: { message: "RPC failed" },
    }),
  });
  const result = await createInvoice(undefined, validInvoiceForm());
  assert.deepStrictEqual(result, {
    error: "Нэхэмжлэлийн дугаар үүсгэхэд алдаа гарлаа.",
  });
});

test("createInvoice handles insert error", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: makeCreateInvoiceSupabase({
      invoiceError: { message: "insert failed" },
    }),
  });
  const result = await createInvoice(undefined, validInvoiceForm());
  assert.ok(result && typeof result === "object" && "error" in result);
  assert.ok(
    String((result as { error: string }).error).includes("insert failed"),
  );
});

test("createInvoice handles items insert error", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: makeCreateInvoiceSupabase({
      itemsError: { message: "items insert failed" },
    }),
  });
  const result = await createInvoice(undefined, validInvoiceForm());
  assert.ok(result && typeof result === "object" && "error" in result);
  assert.ok(
    String((result as { error: string }).error).includes("items insert failed"),
  );
});

// ─── createInvoiceShareLink ───────────────────────────────────────

test("createInvoiceShareLink creates share link", async () => {
  resetMocks();
  mockCtx = mockActionCtx({ supabase: makeShareLinkSupabase() });
  const result = await createInvoiceShareLink(undefined, shareLinkForm());
  assert.deepStrictEqual(result, { token: "raw-token-value", success: true });
  assert.ok(logAuditEventMock.mock.callCount() >= 1);
});

test("createInvoiceShareLink rejects missing invoice_id", async () => {
  resetMocks();
  mockCtx = mockActionCtx();
  const result = await createInvoiceShareLink(
    undefined,
    shareLinkForm({ invoice_id: "" }),
  );
  assert.deepStrictEqual(result, {
    error: "Нэхэмжлэлийн ID олдсонгүй.",
  });
});

test("createInvoiceShareLink handles update error", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: makeShareLinkSupabase({ message: "update failed" }),
  });
  const result = await createInvoiceShareLink(undefined, shareLinkForm());
  assert.ok(result && typeof result === "object" && "error" in result);
  assert.ok(
    String((result as { error: string }).error).includes("update failed"),
  );
});

// ─── rotateInvoiceShareLink ───────────────────────────────────────

test("rotateInvoiceShareLink rotates share link", async () => {
  resetMocks();
  mockCtx = mockActionCtx({ supabase: makeShareLinkSupabase() });
  const result = await rotateInvoiceShareLink(undefined, shareLinkForm());
  assert.deepStrictEqual(result, { token: "raw-token-value", success: true });
  assert.ok(logAuditEventMock.mock.callCount() >= 1);
});

test("rotateInvoiceShareLink handles update error", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: makeShareLinkSupabase({ message: "rotate failed" }),
  });
  const result = await rotateInvoiceShareLink(undefined, shareLinkForm());
  assert.ok(result && typeof result === "object" && "error" in result);
  assert.ok(
    String((result as { error: string }).error).includes("rotate failed"),
  );
});

// ─── revokeInvoiceShareLink ───────────────────────────────────────

test("revokeInvoiceShareLink revokes share link", async () => {
  resetMocks();
  mockCtx = mockActionCtx({ supabase: makeShareLinkSupabase() });
  const result = await revokeInvoiceShareLink(undefined, shareLinkForm());
  assert.deepStrictEqual(result, { success: true });
  assert.ok(logAuditEventMock.mock.callCount() >= 1);
});

// ─── updateInvoiceStatus ──────────────────────────────────────────

test("updateInvoiceStatus updates status successfully", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: makeUpdateStatusSupabase({ fetchInvoice: { status: "pending" } }),
  });
  const result = await updateInvoiceStatus("test-invoice-id", "paid");
  assert.deepStrictEqual(result, { success: true, error: undefined });
  assert.ok(revalidateEntitiesMock.mock.callCount() >= 1);
  assert.ok(logAuditEventMock.mock.callCount() >= 1);
});

test("updateInvoiceStatus rejects when invoice not found", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: makeUpdateStatusSupabase({ fetchInvoice: null }),
  });
  const result = await updateInvoiceStatus("nonexistent-id", "paid");
  assert.deepStrictEqual(result, { error: "Нэхэмжлэл олдсонгүй." });
});
