/**
 * Tests for `customers/segments/actions.ts` — createCustomerSegment,
 * updateCustomerSegment, deleteCustomerSegment, seedCustomerSegmentPreset.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { mockActionCtx, formData, mockMod, resolved } from "./actions-helpers";

// ─── Global mocks ──────────────────────────────────────────────────
const withDbCaptureMock = mock.fn(async (_name: string, query: Promise<unknown>) => {
  const result = await query;
  return result;
});
const captureMock = mock.fn(() => {});
mockMod("@zuiio/capture", { capture: captureMock, withDbCapture: withDbCaptureMock });

const revalidateEntitiesMock = mock.fn(() => {});
const revalidateEntityTagMock = mock.fn(() => {});
const revalidateEntityMock = mock.fn(() => {});
mockMod("@/lib/revalidate", {
  revalidateEntities: revalidateEntitiesMock,
  revalidateEntityTag: revalidateEntityTagMock,
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

// ─── Supabase mock factory for segments ────────────────────────────
function makeSegmentsSupabase(opts: {
  insertResult?: unknown;
  updateResult?: unknown;
  deleteResult?: unknown;
  upsertFn?: (data: unknown, opts: unknown) => unknown;
} = {}) {
  const {
    insertResult = resolved(null),
    updateResult = resolved(null),
    deleteResult = resolved(null),
  } = opts;

  return {
    from: mock.fn((table: string) => {
      if (table !== "customer_segments") {
        throw new Error(`unexpected table: ${table}`);
      }
      return {
        insert: mock.fn(() => insertResult),
        update: mock.fn(() => ({
          eq: mock.fn(() => ({
            eq: mock.fn(() => updateResult),
          })),
        })),
        delete: mock.fn(() => ({
          eq: mock.fn(() => ({
            eq: mock.fn(() => deleteResult),
          })),
        })),
        upsert: opts.upsertFn
          ? mock.fn((data: unknown, o: unknown) => opts.upsertFn!(data, o))
          : mock.fn(() => resolved(null)),
      };
    }),
  };
}

// ─── Lazy-loaded module ────────────────────────────────────────────
let createCustomerSegment: (
  prev: { error?: string } | undefined,
  form: FormData,
) => Promise<unknown>;
let updateCustomerSegment: (
  id: string,
  prev: { error?: string } | undefined,
  form: FormData,
) => Promise<unknown>;
let deleteCustomerSegment: (id: string) => Promise<unknown>;
let seedCustomerSegmentPreset: () => Promise<unknown>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/customers/segments/actions");
  createCustomerSegment = mod.createCustomerSegment;
  updateCustomerSegment = mod.updateCustomerSegment;
  deleteCustomerSegment = mod.deleteCustomerSegment;
  seedCustomerSegmentPreset = mod.seedCustomerSegmentPreset;
});

function resetMocks() {
  captureMock.mock.resetCalls();
  revalidateEntitiesMock.mock.resetCalls();
  revalidateEntityMock.mock.resetCalls();
  withDbCaptureMock.mock.resetCalls();
}

// ═════════════════════════════════════════════════════════════════════
//  createCustomerSegment
// ═════════════════════════════════════════════════════════════════════

test("createCustomerSegment — rejects missing name", async () => {
  resetMocks();
  mockCtx = mockActionCtx();
  const supabase = makeSegmentsSupabase();
  mockCtx.supabase = supabase;

  const result = await createCustomerSegment(undefined, formData({ name: "" }));

  assert.deepStrictEqual(result, { error: "Нэр шаардлагатай." });
  assert.strictEqual(supabase.from.mock.callCount(), 0);
});

test("createCustomerSegment — creates successfully with default is_active", async () => {
  resetMocks();
  mockCtx = mockActionCtx();
  const supabase = makeSegmentsSupabase();
  mockCtx.supabase = supabase;

  const result = await createCustomerSegment(undefined, formData({ name: "VIP" }));

  assert.deepStrictEqual(result, { success: true });
  assert.strictEqual(supabase.from.mock.callCount(), 1);

  // Verify the insert call
  const tableMock = supabase.from.mock.calls[0].arguments[0];
  assert.strictEqual(tableMock, "customer_segments");

  // Verify revalidation was called
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 1);
  assert.deepStrictEqual(revalidateEntityMock.mock.calls[0].arguments, ["customers"]);
});

test("createCustomerSegment — handles 23505 duplicate error", async () => {
  resetMocks();
  mockCtx = mockActionCtx();
  const supabase = makeSegmentsSupabase({
    insertResult: resolved(null, { code: "23505", message: "duplicate key" }),
  });
  mockCtx.supabase = supabase;

  const result = await createCustomerSegment(undefined, formData({ name: "VIP" }));

  assert.ok("error" in result);
  assert.ok((result as { error: string }).error.includes("VIP"));
  assert.ok((result as { error: string }).error.includes("аль хэдийн байна"));
  assert.strictEqual(captureMock.mock.callCount(), 1);
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 0);
});

test("createCustomerSegment — handles insert error", async () => {
  resetMocks();
  mockCtx = mockActionCtx();
  const supabase = makeSegmentsSupabase({
    insertResult: resolved(null, { code: "XX000", message: "connection refused" }),
  });
  mockCtx.supabase = supabase;

  const result = await createCustomerSegment(undefined, formData({ name: "Test" }));

  assert.ok("error" in result);
  assert.ok(
    (result as { error: string }).error.includes("Сегмент үүсгэхэд алдаа гарлаа"),
  );
  assert.strictEqual(captureMock.mock.callCount(), 1);
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 0);
});

// ═════════════════════════════════════════════════════════════════════
//  updateCustomerSegment
// ═════════════════════════════════════════════════════════════════════

test("updateCustomerSegment — updates successfully", async () => {
  resetMocks();
  mockCtx = mockActionCtx();
  const supabase = makeSegmentsSupabase();
  mockCtx.supabase = supabase;

  const result = await updateCustomerSegment(
    "seg-1",
    undefined,
    formData({ name: "New Name", sort_order: "5" }),
  );

  assert.deepStrictEqual(result, { success: true });
  assert.strictEqual(supabase.from.mock.callCount(), 1);
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 1);
  assert.deepStrictEqual(revalidateEntityMock.mock.calls[0].arguments, ["customers"]);
});

test("updateCustomerSegment — handles DB error", async () => {
  resetMocks();
  mockCtx = mockActionCtx();
  const supabase = makeSegmentsSupabase({
    updateResult: resolved(null, { code: "XX000", message: "timeout" }),
  });
  mockCtx.supabase = supabase;

  const result = await updateCustomerSegment(
    "seg-1",
    undefined,
    formData({ name: "Updated" }),
  );

  assert.ok("error" in result);
  assert.ok(
    (result as { error: string }).error.includes("Сегмент шинэчлэхэд алдаа гарлаа"),
  );
  assert.strictEqual(captureMock.mock.callCount(), 1);
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 0);
});

test("updateCustomerSegment — updates with is_active=false", async () => {
  resetMocks();
  mockCtx = mockActionCtx();
  const supabase = makeSegmentsSupabase();
  mockCtx.supabase = supabase;

  const result = await updateCustomerSegment(
    "seg-1",
    undefined,
    formData({ name: "Inactive Segment", is_active: "false" }),
  );

  assert.deepStrictEqual(result, { success: true });
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 1);
});

// ═════════════════════════════════════════════════════════════════════
//  deleteCustomerSegment
// ═════════════════════════════════════════════════════════════════════

test("deleteCustomerSegment — deletes successfully", async () => {
  resetMocks();
  mockCtx = mockActionCtx();
  const supabase = makeSegmentsSupabase();
  mockCtx.supabase = supabase;

  const result = await deleteCustomerSegment("seg-1");

  assert.deepStrictEqual(result, { success: true });
  assert.strictEqual(supabase.from.mock.callCount(), 1);
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 1);
  assert.deepStrictEqual(revalidateEntityMock.mock.calls[0].arguments, ["customers"]);
});

test("deleteCustomerSegment — handles DB error", async () => {
  resetMocks();
  mockCtx = mockActionCtx();
  const supabase = makeSegmentsSupabase({
    deleteResult: resolved(null, { code: "XX000", message: "fk violation" }),
  });
  mockCtx.supabase = supabase;

  const result = await deleteCustomerSegment("seg-1");

  assert.ok("error" in result);
  assert.ok(
    (result as { error: string }).error.includes("Сегмент устгахад алдаа гарлаа"),
  );
  assert.strictEqual(captureMock.mock.callCount(), 1);
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 0);
});

// ═════════════════════════════════════════════════════════════════════
//  seedCustomerSegmentPreset
// ═════════════════════════════════════════════════════════════════════

test("seedCustomerSegmentPreset — seeds all 4 presets successfully", async () => {
  resetMocks();
  mockCtx = mockActionCtx();
  const supabase = makeSegmentsSupabase();
  mockCtx.supabase = supabase;

  const result = await seedCustomerSegmentPreset();

  assert.deepStrictEqual(result, { success: true, created: 4 });
  // from() called once per preset (4 times total) in the loop
  assert.strictEqual(supabase.from.mock.callCount(), 4);
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 1);
  assert.deepStrictEqual(revalidateEntityMock.mock.calls[0].arguments, ["customers"]);
});

test("seedCustomerSegmentPreset — handles upsert error (captures but continues)", async () => {
  resetMocks();
  mockCtx = mockActionCtx();
  let upsertIdx = 0;
  const supabase = makeSegmentsSupabase({
    upsertFn: () => {
      upsertIdx++;
      // Second upsert fails
      if (upsertIdx === 2) {
        return resolved(null, { code: "23505", message: "conflict" });
      }
      return resolved(null);
    },
  });
  mockCtx.supabase = supabase;

  const result = await seedCustomerSegmentPreset();

  // 3 of 4 succeeded, 1 failed (captured)
  assert.deepStrictEqual(result, { success: true, created: 3 });
  assert.strictEqual(captureMock.mock.callCount(), 1);
  // Revalidation still called even with errors
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 1);
});

test("seedCustomerSegmentPreset — returns correct created count", async () => {
  resetMocks();
  mockCtx = mockActionCtx();
  let upsertIdx = 0;
  const supabase = makeSegmentsSupabase({
    upsertFn: () => {
      upsertIdx++;
      // First and third fail
      if (upsertIdx === 1 || upsertIdx === 3) {
        return resolved(null, { code: "XX000", message: "fail" });
      }
      return resolved(null);
    },
  });
  mockCtx.supabase = supabase;

  const result = await seedCustomerSegmentPreset();

  assert.deepStrictEqual(result, { success: true, created: 2 });
  assert.strictEqual(captureMock.mock.callCount(), 2);
});
