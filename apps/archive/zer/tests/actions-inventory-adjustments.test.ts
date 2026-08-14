/**
 * Tests for `inventory/adjustments/actions.ts` — createBatchAdjustment.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import {
  createMockSupabase,
  formData,
  mockActionCtx,
  mockMod,
  registerDefaultMocks,
  resolved,
} from "./actions-helpers";

// ─── Global mocks ────────────────────────────────────────────────────

registerDefaultMocks();

let mockCtx: unknown = mockActionCtx();

mockMod("@/lib/action-utils", {
  requireWriteAction: mock.fn(async () => mockCtx),
});

// Capture revalidateEntities calls
const revalidateMock = { entities: null as string[] | null };
mockMod("@/lib/revalidate", {
  revalidateEntities: mock.fn((entities: string[]) => {
    revalidateMock.entities = entities;
  }),
  revalidateEntity: mock.fn(() => {}),
  revalidateEntityTag: mock.fn(() => {}),
});

// ─── Lazy-loaded module ──────────────────────────────────────────────

let createBatchAdjustment: (
  prevState: { error?: string } | undefined,
  fd: FormData,
) => Promise<Record<string, unknown>>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/inventory/adjustments/actions");
  createBatchAdjustment = mod.createBatchAdjustment;
});

// ─── Helpers ─────────────────────────────────────────────────────────

const VALID_ITEMS = JSON.stringify([
  { product_id: "p1", variant_id: null, quantity: 10, unit_cost: 5 },
  { product_id: "p2", variant_id: "v2", quantity: -3, unit_cost: 8 },
]);

function resetRevalidate() {
  revalidateMock.entities = null;
}

// ─── Tests: createBatchAdjustment ────────────────────────────────────

test("rejects missing branchId", async () => {
  mockCtx = mockActionCtx({ branchId: null });
  resetRevalidate();

  const result = await createBatchAdjustment(undefined, formData({}));

  assert.equal(result.error, "Салбар сонгоогүй байна.");
});

test("rejects missing items JSON", async () => {
  mockCtx = mockActionCtx();
  resetRevalidate();

  const result = await createBatchAdjustment(
    undefined,
    formData({ notes: "some notes" }),
  );

  assert.equal(result.error, "Барааны мэдээлэл шаардлагатай.");
});

test("rejects invalid JSON for items", async () => {
  mockCtx = mockActionCtx();
  resetRevalidate();

  const result = await createBatchAdjustment(
    undefined,
    formData({ items: "not valid json{" }),
  );

  assert.equal(result.error, "Барааны мэдээллийн формат буруу байна.");
});

test("rejects empty items array", async () => {
  mockCtx = mockActionCtx();
  resetRevalidate();

  const result = await createBatchAdjustment(
    undefined,
    formData({ items: "[]" }),
  );

  assert.equal(result.error, "Дор хаяж нэг бараа оруулна уу.");
});

test("rejects non-array items (object)", async () => {
  mockCtx = mockActionCtx();
  resetRevalidate();

  const result = await createBatchAdjustment(
    undefined,
    formData({ items: '{"foo":"bar"}' }),
  );

  assert.equal(result.error, "Дор хаяж нэг бараа оруулна уу.");
});

test("calls supabase.rpc with correct payload structure", async () => {
  const supabase = createMockSupabase();
  supabase.rpc = mock.fn(() => resolved({}, null));
  mockCtx = mockActionCtx({ supabase });
  resetRevalidate();

  await createBatchAdjustment(
    undefined,
    formData({ items: VALID_ITEMS, notes: "Test batch" }),
  );

  assert.equal(supabase.rpc.mock.callCount(), 1);

  const rpcName = supabase.rpc.mock.calls[0].arguments[0] as string;
  assert.equal(rpcName, "process_batch_adjustment");

  const rpcParams = supabase.rpc.mock.calls[0].arguments[1] as Record<
    string,
    unknown
  >;

  // Verify param keys
  assert.equal(typeof rpcParams.p_org_id, "string");
  assert.equal(typeof rpcParams.p_branch_id, "string");
  assert.equal(typeof rpcParams.p_user_id, "string");
  assert.equal(typeof rpcParams.p_reference, "string");
  assert.ok((rpcParams.p_reference as string).startsWith("batch:"));
  assert.equal(rpcParams.p_notes, "Test batch");

  // Items with quantity=0 are filtered out; both test items are non-zero
  const pItems = rpcParams.p_items as Array<Record<string, unknown>>;
  assert.ok(Array.isArray(pItems));
  assert.equal(pItems.length, 2);
  assert.deepEqual(pItems[0], {
    product_id: "p1",
    variant_id: null,
    quantity: 10,
    unit_cost: 5,
  });
  assert.deepEqual(pItems[1], {
    product_id: "p2",
    variant_id: "v2",
    quantity: -3,
    unit_cost: 8,
  });
});

test("filters out items with quantity=0 before rpc call", async () => {
  const supabase = createMockSupabase();
  supabase.rpc = mock.fn(() => resolved({}, null));
  mockCtx = mockActionCtx({ supabase });
  resetRevalidate();

  const items = JSON.stringify([
    { product_id: "p1", variant_id: null, quantity: 10, unit_cost: 5 },
    { product_id: "p2", variant_id: null, quantity: 0, unit_cost: 3 },
    { product_id: "p3", variant_id: "v3", quantity: -2, unit_cost: null },
  ]);

  await createBatchAdjustment(undefined, formData({ items }));

  const rpcParams = supabase.rpc.mock.calls[0].arguments[1] as Record<
    string,
    unknown
  >;
  const pItems = rpcParams.p_items as Array<Record<string, unknown>>;
  assert.equal(pItems.length, 2);
  assert.equal(pItems[0].product_id, "p1");
  assert.equal(pItems[1].product_id, "p3");
});

test("uses default notes when notes not provided", async () => {
  const supabase = createMockSupabase();
  supabase.rpc = mock.fn(() => resolved({}, null));
  mockCtx = mockActionCtx({ supabase });
  resetRevalidate();

  await createBatchAdjustment(undefined, formData({ items: VALID_ITEMS }));

  const rpcParams = supabase.rpc.mock.calls[0].arguments[1] as Record<
    string,
    unknown
  >;
  assert.equal(rpcParams.p_notes, "Бөөнөөр тохируулга");
});

test("handles rpc error", async () => {
  const supabase = createMockSupabase();
  supabase.rpc = mock.fn(() => resolved(null, { message: "Database failure" }));
  mockCtx = mockActionCtx({ supabase });
  resetRevalidate();

  const result = await createBatchAdjustment(
    undefined,
    formData({ items: VALID_ITEMS }),
  );

  assert.equal(result.error, "Database failure");
});

test("handles rpcResult.error string", async () => {
  const supabase = createMockSupabase();
  supabase.rpc = mock.fn(() => resolved({ error: "Some error" }, null));
  mockCtx = mockActionCtx({ supabase });
  resetRevalidate();

  const result = await createBatchAdjustment(
    undefined,
    formData({ items: VALID_ITEMS }),
  );

  assert.equal(result.error, "Some error");
});

test("returns success with batchId on success", async () => {
  const supabase = createMockSupabase();
  supabase.rpc = mock.fn(() => resolved({}, null));
  mockCtx = mockActionCtx({ supabase });
  resetRevalidate();

  const result = await createBatchAdjustment(
    undefined,
    formData({ items: VALID_ITEMS }),
  );

  assert.equal(result.success, true);
  assert.equal(result.error, undefined);
  assert.ok(typeof result.batchId === "string");
  assert.ok((result.batchId as string).length > 0);
});

test("calls revalidateEntities(['inventory']) on success", async () => {
  const supabase = createMockSupabase();
  supabase.rpc = mock.fn(() => resolved({}, null));
  mockCtx = mockActionCtx({ supabase });
  resetRevalidate();

  await createBatchAdjustment(undefined, formData({ items: VALID_ITEMS }));

  assert.deepEqual(revalidateMock.entities, ["inventory"]);
});

test("does not call revalidateEntities on rpc error", async () => {
  const supabase = createMockSupabase();
  supabase.rpc = mock.fn(() => resolved(null, { message: "fail" }));
  mockCtx = mockActionCtx({ supabase });
  resetRevalidate();

  await createBatchAdjustment(undefined, formData({ items: VALID_ITEMS }));

  assert.equal(revalidateMock.entities, null);
});
