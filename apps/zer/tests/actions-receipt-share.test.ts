/**
 * Tests for `shop/receipt/[id]/actions.ts` — createReceiptShareLink,
 * rotateReceiptShareLink, revokeReceiptShareLink.
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

mockMod("@/lib/revalidate", {
  revalidateEntities: mock.fn(() => {}),
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

const generateTokenMock = mock.fn(() => "raw-token");
const hashTokenMock = mock.fn((t: string) => `${t}-hashed`);
mockMod("@/lib/public-share-token", {
  generateToken: generateTokenMock,
  hashToken: hashTokenMock,
  defaultExpiryDate: mock.fn(() => new Date("2026-12-31")),
});

let mockCtx: Record<string, unknown> = mockActionCtx();
mockMod("@/lib/action-utils", {
  requireActionContext: mock.fn(async () => mockCtx),
  requireWriteAction: mock.fn(async () => mockCtx),
});

// ─── Lazy-loaded module ──────────────────────────────────────────────

let createReceiptShareLink: (prev: unknown, form: FormData) => Promise<unknown>;
let rotateReceiptShareLink: (prev: unknown, form: FormData) => Promise<unknown>;
let revokeReceiptShareLink: (prev: unknown, form: FormData) => Promise<unknown>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/shop/receipt/[id]/actions");
  createReceiptShareLink = mod.createReceiptShareLink;
  rotateReceiptShareLink = mod.rotateReceiptShareLink;
  revokeReceiptShareLink = mod.revokeReceiptShareLink;
});

// ─── Helpers ─────────────────────────────────────────────────────────

function resetMocks() {
  withDbCaptureMock.mock.resetCalls();
  generateTokenMock.mock.resetCalls();
  hashTokenMock.mock.resetCalls();
}

/**
 * Build a Supabase mock for share link tests.
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

// ─── createReceiptShareLink ──────────────────────────────────────────

test("createReceiptShareLink rejects missing invoice_id", async () => {
  resetMocks();
  const result = await createReceiptShareLink(undefined, formData({}));

  assert.ok("error" in result, "should return error");
  assert.match(
    (result as { error: string }).error,
    /ID олдсонгүй/,
    "error should mention missing ID",
  );
});

test("createReceiptShareLink creates share link successfully", async () => {
  resetMocks();
  const supabase = makeShareLinkSupabase();
  mockCtx = mockActionCtx({ supabase });

  const result = await createReceiptShareLink(
    undefined,
    formData({
      invoice_id: "inv-001",
    }),
  );

  assert.equal(
    generateTokenMock.mock.callCount(),
    1,
    "generateToken called once",
  );
  assert.equal(hashTokenMock.mock.callCount(), 1, "hashToken called once");
  assert.deepStrictEqual(result, { token: "raw-token", success: true });
});

test("createReceiptShareLink handles update error", async () => {
  resetMocks();
  const supabase = makeShareLinkSupabase({ message: "db failure" });
  mockCtx = mockActionCtx({ supabase });

  const result = await createReceiptShareLink(
    undefined,
    formData({
      invoice_id: "inv-001",
    }),
  );

  assert.ok("error" in result, "should return error");
  assert.match(
    (result as { error: string }).error,
    /db failure/,
    "error should contain DB message",
  );
});

// ─── rotateReceiptShareLink ──────────────────────────────────────────

test("rotateReceiptShareLink rejects missing invoice_id", async () => {
  resetMocks();
  const result = await rotateReceiptShareLink(undefined, formData({}));

  assert.ok("error" in result, "should return error");
  assert.match(
    (result as { error: string }).error,
    /ID олдсонгүй/,
    "error should mention missing ID",
  );
});

test("rotateReceiptShareLink rotates share link successfully", async () => {
  resetMocks();
  const supabase = makeShareLinkSupabase();
  mockCtx = mockActionCtx({ supabase });

  const result = await rotateReceiptShareLink(
    undefined,
    formData({
      invoice_id: "inv-002",
    }),
  );

  assert.equal(
    generateTokenMock.mock.callCount(),
    1,
    "generateToken called once",
  );
  assert.equal(hashTokenMock.mock.callCount(), 1, "hashToken called once");
  assert.deepStrictEqual(result, { token: "raw-token", success: true });
});

test("rotateReceiptShareLink handles update error", async () => {
  resetMocks();
  const supabase = makeShareLinkSupabase({ message: "update failed" });
  mockCtx = mockActionCtx({ supabase });

  const result = await rotateReceiptShareLink(
    undefined,
    formData({
      invoice_id: "inv-002",
    }),
  );

  assert.ok("error" in result, "should return error");
  assert.match(
    (result as { error: string }).error,
    /update failed/,
    "error should contain DB message",
  );
});

// ─── revokeReceiptShareLink ──────────────────────────────────────────

test("revokeReceiptShareLink rejects missing invoice_id", async () => {
  resetMocks();
  const result = await revokeReceiptShareLink(undefined, formData({}));

  assert.ok("error" in result, "should return error");
  assert.match(
    (result as { error: string }).error,
    /ID олдсонгүй/,
    "error should mention missing ID",
  );
});

test("revokeReceiptShareLink revokes share link successfully", async () => {
  resetMocks();
  const supabase = makeShareLinkSupabase();
  mockCtx = mockActionCtx({ supabase });

  const result = await revokeReceiptShareLink(
    undefined,
    formData({
      invoice_id: "inv-003",
    }),
  );

  assert.deepStrictEqual(result, { success: true });
});

test("revokeReceiptShareLink handles update error", async () => {
  resetMocks();
  const supabase = makeShareLinkSupabase({ message: "revoke failed" });
  mockCtx = mockActionCtx({ supabase });

  const result = await revokeReceiptShareLink(
    undefined,
    formData({
      invoice_id: "inv-003",
    }),
  );

  assert.ok("error" in result, "should return error");
  assert.match(
    (result as { error: string }).error,
    /revoke failed/,
    "error should contain DB message",
  );
});
