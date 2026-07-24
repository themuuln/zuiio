/**
 * Tests for `shop/templates/actions.ts` — createOrderTemplate, updateOrderTemplate, deleteOrderTemplate.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";

import {
  mockActionCtx,
  formData,
  mockMod,
  registerDefaultMocks,
} from "./actions-helpers";

// ─── Standard boilerplate mocks ──────────────────────────────────────

registerDefaultMocks();

const withDbCaptureMock = mock.fn(
  async (_name: string, query: Promise<unknown>) => {
    return await query;
  },
);
const captureMock = mock.fn(() => {});
mockMod("@zuiio/capture", {
  capture: captureMock,
  withDbCapture: withDbCaptureMock,
});

const revalidateEntityMock = mock.fn(() => {});
mockMod("@/lib/revalidate", {
  revalidateEntities: mock.fn(() => {}),
  revalidateEntityTag: mock.fn(() => {}),
  revalidateEntity: revalidateEntityMock,
});

let mockCtx: Record<string, unknown> = mockActionCtx();
mockMod("@/lib/action-utils", {
  requireActionContext: mock.fn(async () => mockCtx),
  requireWriteAction: mock.fn(async () => mockCtx),
});

mockMod("@/lib/validation", {
  getString: mock.fn((fd: FormData, key: string) => String(fd.get(key) ?? "")),
});

mockMod("@/lib/stock-utils", {
  fetchProductsForStock: mock.fn(
    async () => new Map([["p1", { id: "p1", name: "Product" }]]),
  ),
  fetchVariantsForStock: mock.fn(async () => new Map()),
});

// ─── Lazy-loaded module ──────────────────────────────────────────────

let createOrderTemplate: (
  prev: { error?: string } | undefined,
  fd: FormData,
) => Promise<Record<string, unknown>>;

let updateOrderTemplate: (
  templateId: string,
  prev: { error?: string } | undefined,
  fd: FormData,
) => Promise<Record<string, unknown>>;

let deleteOrderTemplate: (
  templateId: string,
) => Promise<Record<string, unknown>>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/shop/templates/actions");
  createOrderTemplate = mod.createOrderTemplate;
  updateOrderTemplate = mod.updateOrderTemplate;
  deleteOrderTemplate = mod.deleteOrderTemplate;
});

// ─── Helpers ─────────────────────────────────────────────────────────

function resetMocks() {
  mockCtx = mockActionCtx();
  captureMock.mock.resetCalls();
  revalidateEntityMock.mock.resetCalls();
  withDbCaptureMock.mock.resetCalls();
  // Restore default passthrough so error-injection tests don't leak
  withDbCaptureMock.mock.mockImplementation(
    async (_name: string, query: Promise<unknown>) => {
      return await query;
    },
  );
}

function validItems() {
  return JSON.stringify([{ productId: "p1", quantity: 2 }]);
}

// ─── Tests: createOrderTemplate ─────────────────────────────────────

test("createOrderTemplate rejects missing name", async () => {
  resetMocks();
  const fd = formData({ items: validItems() });
  const result = await createOrderTemplate(undefined, fd);
  assert.equal(result.error, "Загварын нэр шаардлагатай.");
});

test("createOrderTemplate rejects missing items", async () => {
  resetMocks();
  const fd = formData({ name: "Test Template" });
  const result = await createOrderTemplate(undefined, fd);
  assert.equal(result.error, "Бүтээгдэхүүн шаардлагатай.");
});

test("createOrderTemplate creates template successfully", async () => {
  resetMocks();
  const fd = formData({
    name: "Test Template",
    items: validItems(),
  });
  const result = await createOrderTemplate(undefined, fd);
  assert.equal(result.success, true);
  assert.equal(result.templateId, "test-id");
  assert.ok(!result.error, "should have no error");
  assert.equal(
    revalidateEntityMock.mock.calls.length,
    1,
    "revalidateEntity should be called once",
  );
});

test("createOrderTemplate handles template insert error", async () => {
  resetMocks();
  withDbCaptureMock.mock.mockImplementation(
    async (name: string, query: Promise<unknown>) => {
      if (name === "order_templates:create") {
        return { data: null, error: { message: "duplicate key" } };
      }
      return await query;
    },
  );

  const fd = formData({
    name: "Test Template",
    items: validItems(),
  });
  const result = await createOrderTemplate(undefined, fd);
  assert.ok(result.error?.includes("Загвар үүсгэхэд алдаа гарлаа"));
  assert.ok(result.error?.includes("duplicate key"));
});

test("createOrderTemplate handles items insert error with rollback", async () => {
  resetMocks();
  withDbCaptureMock.mock.mockImplementation(
    async (name: string, query: Promise<unknown>) => {
      if (name === "order_templates:create_items") {
        return { data: null, error: { message: "items insert failed" } };
      }
      return await query;
    },
  );

  const fd = formData({
    name: "Test Template",
    items: validItems(),
  });
  const result = await createOrderTemplate(undefined, fd);
  assert.ok(
    result.error?.includes("Загварын бүтээгдэхүүн хадгалахад алдаа гарлаа"),
  );
  assert.ok(result.error?.includes("items insert failed"));

  // Rollback should have been attempted
  const rollbackCall = withDbCaptureMock.mock.calls.find(
    (c: { arguments: unknown[] }) =>
      c.arguments[0] === "order_templates: rollback delete",
  );
  assert.ok(rollbackCall, "rollback delete should have been called");

  // revalidateEntity should NOT be called on error
  assert.equal(
    revalidateEntityMock.mock.calls.length,
    0,
    "revalidateEntity should not be called on error",
  );
});

// ─── Tests: updateOrderTemplate ─────────────────────────────────────

test("updateOrderTemplate rejects when template not found", async () => {
  resetMocks();
  withDbCaptureMock.mock.mockImplementation(
    async (name: string, query: Promise<unknown>) => {
      if (name === "order_templates:fetch_for_update") {
        return { data: null, error: { message: "not found" } };
      }
      return await query;
    },
  );

  const fd = formData({
    name: "Updated Template",
    items: validItems(),
  });
  const result = await updateOrderTemplate("template-1", undefined, fd);
  assert.equal(result.error, "Загвар олдсонгүй.");
});

test("updateOrderTemplate rejects missing name", async () => {
  resetMocks();
  const fd = formData({ items: validItems() });
  const result = await updateOrderTemplate("template-1", undefined, fd);
  assert.equal(result.error, "Загварын нэр шаардлагатай.");
});

test("updateOrderTemplate updates template successfully", async () => {
  resetMocks();
  const fd = formData({
    name: "Updated Template",
    items: validItems(),
  });
  const result = await updateOrderTemplate("template-1", undefined, fd);
  assert.equal(result.success, true);
  assert.ok(!result.error, "should have no error");
  assert.equal(
    revalidateEntityMock.mock.calls.length,
    1,
    "revalidateEntity should be called once",
  );
});

test("updateOrderTemplate handles DB error", async () => {
  resetMocks();
  withDbCaptureMock.mock.mockImplementation(
    async (name: string, query: Promise<unknown>) => {
      if (name === "order_templates:update") {
        return { data: null, error: { message: "update failed" } };
      }
      return await query;
    },
  );

  const fd = formData({
    name: "Updated Template",
    items: validItems(),
  });
  const result = await updateOrderTemplate("template-1", undefined, fd);
  assert.ok(result.error?.includes("Загвар шинэчлэхэд алдаа гарлаа"));
  assert.ok(result.error?.includes("update failed"));
  assert.equal(
    revalidateEntityMock.mock.calls.length,
    0,
    "revalidateEntity should not be called on error",
  );
});

// ─── Tests: deleteOrderTemplate ─────────────────────────────────────

test("deleteOrderTemplate rejects when template not found", async () => {
  resetMocks();
  withDbCaptureMock.mock.mockImplementation(
    async (name: string, query: Promise<unknown>) => {
      if (name === "order_templates:fetch_for_delete") {
        return { data: null, error: { message: "not found" } };
      }
      return await query;
    },
  );

  const result = await deleteOrderTemplate("template-1");
  assert.equal(result.error, "Загвар олдсонгүй.");
});

test("deleteOrderTemplate deletes template successfully", async () => {
  resetMocks();
  const result = await deleteOrderTemplate("template-1");
  assert.equal(result.success, true);
  assert.ok(!result.error, "should have no error");
  assert.equal(
    revalidateEntityMock.mock.calls.length,
    1,
    "revalidateEntity should be called once",
  );
});

test("deleteOrderTemplate handles DB error", async () => {
  resetMocks();
  withDbCaptureMock.mock.mockImplementation(
    async (name: string, query: Promise<unknown>) => {
      if (name === "order_templates:delete_template") {
        return { data: null, error: { message: "delete failed" } };
      }
      return await query;
    },
  );

  const result = await deleteOrderTemplate("template-1");
  assert.ok(result.error?.includes("Загвар устгахад алдаа гарлаа"));
  assert.ok(result.error?.includes("delete failed"));
  assert.equal(
    revalidateEntityMock.mock.calls.length,
    0,
    "revalidateEntity should not be called on error",
  );
});
