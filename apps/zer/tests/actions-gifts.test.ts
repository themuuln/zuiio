/**
 * Tests for `shop/gifts/actions.ts` — createGiftOption, updateGiftOption, deleteGiftOption.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { mockActionCtx, formData, mockMod } from "./actions-helpers";

// ─── Resolve helper (inline to avoid esbuild depth issues) ──────────
function resolved<T>(data: T, error: unknown = null) {
  return Promise.resolve({ data, error });
}

// ─── Supabase chain builders ────────────────────────────────────────

/** Build supabase mock for createGiftOption — insert returns a Promise */
function makeCreateSupabase(opts: {
  insertError?: { message: string; code?: string } | null;
} = {}) {
  const { insertError = null } = opts;

  return {
    from: mock.fn((_table: string) => ({
      insert: mock.fn(() => resolved(null, insertError)),
    })),
  };
}

/** Build supabase mock for updateGiftOption — update → eq → eq chain */
function makeUpdateSupabase(opts: {
  updateError?: { message: string } | null;
} = {}) {
  const { updateError = null } = opts;

  return {
    from: mock.fn((_table: string) => ({
      update: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => resolved(null, updateError)),
        })),
      })),
    })),
  };
}

/** Build supabase mock for deleteGiftOption — delete → eq → eq chain */
function makeDeleteSupabase(opts: {
  deleteError?: { message: string } | null;
} = {}) {
  const { deleteError = null } = opts;

  return {
    from: mock.fn((_table: string) => ({
      delete: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => resolved(null, deleteError)),
        })),
      })),
    })),
  };
}

// ─── Global mocks ───────────────────────────────────────────────────
const withDbCaptureMock = mock.fn(async (_name: string, query: Promise<unknown>) => {
  return await query;
});
mockMod("@zuiio/capture", {
  capture: mock.fn(() => {}),
  withDbCapture: withDbCaptureMock,
});

const revalidateEntityMock = mock.fn(() => {});
mockMod("@/lib/revalidate", {
  revalidateEntities: mock.fn(() => {}),
  revalidateEntityTag: mock.fn(() => {}),
  revalidateEntity: revalidateEntityMock,
});

mockMod("@/lib/audit", { logAuditEventWithClient: mock.fn(async () => {}) });
mockMod("next/server", { after: (fn: () => void) => fn() });
mockMod("next/cache", { revalidatePath: mock.fn(() => {}), revalidateTag: mock.fn(() => {}) });
mockMod("server-only", {});

let mockCtx: Record<string, unknown> = mockActionCtx();
mockMod("@/lib/action-utils", {
  requireActionContext: mock.fn(async () => mockCtx),
  requireWriteAction: mock.fn(async () => mockCtx),
});

// ─── Lazy-loaded module ─────────────────────────────────────────────
let createGiftOption: (
  prev: { error?: string } | undefined,
  form: FormData,
) => Promise<unknown>;
let updateGiftOption: (
  id: string,
  prev: { error?: string } | undefined,
  form: FormData,
) => Promise<unknown>;
let deleteGiftOption: (id: string) => Promise<unknown>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/shop/gifts/actions");
  createGiftOption = mod.createGiftOption;
  updateGiftOption = mod.updateGiftOption;
  deleteGiftOption = mod.deleteGiftOption;
});

function resetMocks() {
  withDbCaptureMock.mock.resetCalls();
  revalidateEntityMock.mock.resetCalls();
}

/** Default valid formData for createGiftOption */
function validCreateData(overrides: Record<string, string | null> = {}) {
  return formData({
    name: "Gift Wrap",
    description: "Beautiful wrapping",
    price: "5000",
    ...overrides,
  });
}

/** Default valid formData for updateGiftOption */
function validUpdateData(overrides: Record<string, string | null> = {}) {
  return formData({
    name: "Updated Gift",
    description: "Updated description",
    price: "7500",
    ...overrides,
  });
}

// ═══════════════════════════════════════════════════════════════════
// createGiftOption tests
// ═══════════════════════════════════════════════════════════════════

test("createGiftOption rejects missing name", async () => {
  resetMocks();
  mockCtx = mockActionCtx();
  const result = await createGiftOption(undefined, validCreateData({ name: "" }));
  assert.deepStrictEqual(result, { error: "Нэр шаардлагатай." });
});

test("createGiftOption creates gift option successfully", async () => {
  resetMocks();
  const supabase = makeCreateSupabase();
  mockCtx = mockActionCtx({ supabase });

  const result = await createGiftOption(undefined, validCreateData());
  assert.deepStrictEqual(result, { success: true });

  // Verify supabase.from was called with gift_options
  assert.strictEqual(supabase.from.mock.callCount(), 1);
  assert.strictEqual(supabase.from.mock.calls[0].arguments[0], "gift_options");

  // Verify revalidation
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 1);
  assert.strictEqual(revalidateEntityMock.mock.calls[0].arguments[0], "shop");
});

test("createGiftOption handles insert error", async () => {
  resetMocks();
  const supabase = makeCreateSupabase({
    insertError: { message: "db failure" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await createGiftOption(undefined, validCreateData());
  assert.deepStrictEqual(result, {
    error: "Бэлэг сонголт үүсгэхэд алдаа гарлаа: db failure",
  });
  // Revalidation should NOT be called on error
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 0);
});

test("createGiftOption handles duplicate name (23505)", async () => {
  resetMocks();
  const supabase = makeCreateSupabase({
    insertError: { message: "duplicate key", code: "23505" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await createGiftOption(undefined, validCreateData());
  assert.deepStrictEqual(result, {
    error: `"Gift Wrap" нэртэй бэлэг сонголт аль хэдийн байна.`,
  });
});

// ═══════════════════════════════════════════════════════════════════
// updateGiftOption tests
// ═══════════════════════════════════════════════════════════════════

test("updateGiftOption rejects missing name", async () => {
  resetMocks();
  mockCtx = mockActionCtx();
  const result = await updateGiftOption(
    "gift-123",
    undefined,
    validUpdateData({ name: "" }),
  );
  assert.deepStrictEqual(result, { error: "Нэр шаардлагатай." });
});

test("updateGiftOption updates successfully", async () => {
  resetMocks();
  const supabase = makeUpdateSupabase();
  mockCtx = mockActionCtx({ supabase });

  const result = await updateGiftOption("gift-123", undefined, validUpdateData());
  assert.deepStrictEqual(result, { success: true });

  // Verify supabase.from was called with gift_options
  assert.strictEqual(supabase.from.mock.callCount(), 1);
  assert.strictEqual(supabase.from.mock.calls[0].arguments[0], "gift_options");

  // Verify revalidation
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 1);
  assert.strictEqual(revalidateEntityMock.mock.calls[0].arguments[0], "shop");
});

test("updateGiftOption handles DB error", async () => {
  resetMocks();
  const supabase = makeUpdateSupabase({
    updateError: { message: "update failed" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await updateGiftOption("gift-123", undefined, validUpdateData());
  assert.deepStrictEqual(result, {
    error: "Бэлэг сонголт шинэчлэхэд алдаа гарлаа: update failed",
  });
  // Revalidation should NOT be called on error
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 0);
});

test("updateGiftOption updates with valid price", async () => {
  resetMocks();
  const supabase = makeUpdateSupabase();
  mockCtx = mockActionCtx({ supabase });

  const result = await updateGiftOption(
    "gift-456",
    undefined,
    validUpdateData({ price: "12000" }),
  );
  assert.deepStrictEqual(result, { success: true });
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 1);
});

// ═══════════════════════════════════════════════════════════════════
// deleteGiftOption tests
// ═══════════════════════════════════════════════════════════════════

test("deleteGiftOption deletes successfully", async () => {
  resetMocks();
  const supabase = makeDeleteSupabase();
  mockCtx = mockActionCtx({ supabase });

  const result = await deleteGiftOption("gift-789");
  assert.deepStrictEqual(result, { success: true });

  // Verify supabase.from was called with gift_options
  assert.strictEqual(supabase.from.mock.callCount(), 1);
  assert.strictEqual(supabase.from.mock.calls[0].arguments[0], "gift_options");

  // Verify revalidation
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 1);
  assert.strictEqual(revalidateEntityMock.mock.calls[0].arguments[0], "shop");
});

test("deleteGiftOption handles DB error", async () => {
  resetMocks();
  const supabase = makeDeleteSupabase({
    deleteError: { message: "delete failed" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await deleteGiftOption("gift-789");
  assert.deepStrictEqual(result, {
    error: "Бэлэг сонголт устгахад алдаа гарлаа: delete failed",
  });
  // Revalidation should NOT be called on error
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 0);
});
