/**
 * Tests for `products/attributes/actions.ts` — createAttributeDefinition,
 * updateAttributeDefinition, deleteAttributeDefinition.
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

let mockCtx: Record<string, unknown> = mockActionCtx();

mockMod("@zuiio/capture", {
  capture: mock.fn(() => {}),
});

const revalidateEntitySpy = mock.fn(() => {});
mockMod("@/lib/revalidate", {
  revalidateEntity: revalidateEntitySpy,
  revalidateEntityTag: mock.fn(() => {}),
  revalidateEntities: mock.fn(() => {}),
});

mockMod("@/lib/action-utils", {
  requireActionContext: mock.fn(async () => mockCtx),
  requireWriteAction: mock.fn(async () => mockCtx),
});

// ─── Lazy-loaded module ──────────────────────────────────────────────

let createAttributeDefinition: (
  ...args: unknown[]
) => Promise<Record<string, unknown>>;
let updateAttributeDefinition: (
  ...args: unknown[]
) => Promise<Record<string, unknown>>;
let deleteAttributeDefinition: (id: string) => Promise<Record<string, unknown>>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/products/attributes/actions");
  createAttributeDefinition =
    mod.createAttributeDefinition as typeof createAttributeDefinition;
  updateAttributeDefinition =
    mod.updateAttributeDefinition as typeof updateAttributeDefinition;
  deleteAttributeDefinition =
    mod.deleteAttributeDefinition as typeof deleteAttributeDefinition;
});

// ─── Helpers ─────────────────────────────────────────────────────────

function resetMocks() {
  revalidateEntitySpy.mock.resetCalls();
}

// ─── Tests: createAttributeDefinition ────────────────────────────────

test("createAttributeDefinition rejects missing name", async () => {
  resetMocks();
  mockCtx = mockActionCtx();

  const fd = formData({ value_type: "text" });
  const result = await createAttributeDefinition(undefined, fd);
  assert.equal(result.error, "Нэр шаардлагатай.");
});

test("createAttributeDefinition rejects invalid value type", async () => {
  resetMocks();
  mockCtx = mockActionCtx();

  const fd = formData({ name: "Color", value_type: "invalid" });
  const result = await createAttributeDefinition(undefined, fd);
  assert.equal(result.error, "Төрөл буруу байна.");
});

test("createAttributeDefinition creates with text type", async () => {
  resetMocks();
  const supabase = createMockSupabase();
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({
    name: "Material",
    value_type: "text",
    unit: "kg",
    is_required: "true",
    is_filterable: "false",
    sort_order: "2",
  });
  const result = await createAttributeDefinition(undefined, fd);

  assert.deepEqual(result, { success: true });

  // Verify insert was called on correct table
  const fromCalls = (supabase.from as ReturnType<typeof mock.fn>).mock.calls;
  assert.equal(fromCalls.length, 1);
  assert.equal(fromCalls[0].arguments[0], "product_attribute_definitions");

  // Verify revalidate was called
  assert.equal(revalidateEntitySpy.mock.callCount(), 1);
  assert.deepEqual(revalidateEntitySpy.mock.calls[0].arguments, ["products"]);
});

test("createAttributeDefinition creates with select type and options", async () => {
  resetMocks();
  const supabase = createMockSupabase();
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({
    name: "Size",
    value_type: "select",
    options: "S, M, L, XL",
    sort_order: "0",
  });
  const result = await createAttributeDefinition(undefined, fd);

  assert.deepEqual(result, { success: true });
  assert.equal(revalidateEntitySpy.mock.callCount(), 1);
});

test("createAttributeDefinition handles duplicate name error (23505)", async () => {
  resetMocks();
  const dupError = { code: "23505", message: "duplicate key value" };
  const supabase = createMockSupabase({
    product_attribute_definitions: {
      insert: mock.fn(() => resolved(null, dupError)),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({ name: "Material", value_type: "text" });
  const result = await createAttributeDefinition(undefined, fd);

  assert.equal(result.error, '"Material" нэртэй шинж чанар аль хэдийн байна.');
  // revalidate should NOT be called on error
  assert.equal(revalidateEntitySpy.mock.callCount(), 0);
});

// ─── Tests: updateAttributeDefinition ────────────────────────────────

test("updateAttributeDefinition rejects missing name", async () => {
  resetMocks();
  mockCtx = mockActionCtx();

  const fd = formData({ value_type: "text" });
  const result = await updateAttributeDefinition("attr-1", undefined, fd);
  assert.equal(result.error, "Нэр шаардлагатай.");
});

test("updateAttributeDefinition updates successfully", async () => {
  resetMocks();
  const supabase = createMockSupabase();
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({
    name: "Updated Attr",
    value_type: "text",
    unit: "pcs",
    is_required: "false",
    is_filterable: "true",
    sort_order: "5",
  });
  const result = await updateAttributeDefinition("attr-1", undefined, fd);

  assert.deepEqual(result, { success: true });
  assert.equal(revalidateEntitySpy.mock.callCount(), 1);
});

test("updateAttributeDefinition handles DB error", async () => {
  resetMocks();
  const dbError = { code: "XX000", message: "connection refused" };
  // Chain: .update().eq().eq() — two eq() calls
  const supabase = createMockSupabase({
    product_attribute_definitions: {
      update: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => resolved(null, dbError)),
        })),
      })),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({ name: "Updated Attr", value_type: "text" });
  const result = await updateAttributeDefinition("attr-1", undefined, fd);

  assert.ok(result.error?.includes("алдаа гарлаа"));
  assert.equal(revalidateEntitySpy.mock.callCount(), 0);
});

test("updateAttributeDefinition updates with select options", async () => {
  resetMocks();
  const supabase = createMockSupabase();
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({
    name: "Color",
    value_type: "select",
    options: "Red, Blue, Green",
    sort_order: "1",
  });
  const result = await updateAttributeDefinition("attr-2", undefined, fd);

  assert.deepEqual(result, { success: true });
  assert.equal(revalidateEntitySpy.mock.callCount(), 1);
});

// ─── Tests: deleteAttributeDefinition ────────────────────────────────

test("deleteAttributeDefinition deletes successfully", async () => {
  resetMocks();
  const supabase = createMockSupabase();
  mockCtx = mockActionCtx({ supabase });

  const result = await deleteAttributeDefinition("attr-1");

  assert.deepEqual(result, { success: true });
  assert.equal(revalidateEntitySpy.mock.callCount(), 1);
});

test("deleteAttributeDefinition handles DB error", async () => {
  resetMocks();
  const dbError = { code: "XX000", message: "connection refused" };
  // Chain: .delete().eq().eq() — two eq() calls
  const supabase = createMockSupabase({
    product_attribute_definitions: {
      delete: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => resolved(null, dbError)),
        })),
      })),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await deleteAttributeDefinition("attr-1");

  assert.ok(result.error?.includes("алдаа гарлаа"));
  assert.equal(revalidateEntitySpy.mock.callCount(), 0);
});

test("deleteAttributeDefinition calls revalidateEntity on success", async () => {
  resetMocks();
  const supabase = createMockSupabase();
  mockCtx = mockActionCtx({ supabase });

  await deleteAttributeDefinition("attr-1");

  assert.equal(revalidateEntitySpy.mock.callCount(), 1);
  assert.deepEqual(revalidateEntitySpy.mock.calls[0].arguments, ["products"]);
});
