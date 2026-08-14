import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { formData, mockActionCtx, mockMod, resolved } from "./actions-helpers";

// ─── Standard boilerplate mocks ──────────────────────────────────────
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

const revalidateEntitiesMock = mock.fn(() => {});
mockMod("@/lib/revalidate", {
  revalidateEntities: revalidateEntitiesMock,
  revalidateEntityTag: mock.fn(() => {}),
  revalidateEntity: mock.fn(() => {}),
});

mockMod("@/lib/audit", { logAuditEventWithClient: mock.fn(async () => {}) });
mockMod("next/server", { after: (fn: () => unknown) => fn() });
mockMod("next/cache", {
  revalidatePath: mock.fn(() => {}),
  revalidateTag: mock.fn(() => {}),
});
mockMod("server-only", {});

// ─── Warehouse-specific mocks ────────────────────────────────────────
mockMod("@/lib/validation", {
  getString: mock.fn((fd: FormData, key: string) => {
    const v = fd.get(key);
    return v === null ? "" : String(v);
  }),
});

// ─── Action context ──────────────────────────────────────────────────
let mockCtx: Record<string, unknown> = mockActionCtx();
mockMod("@/lib/action-utils", {
  requireActionContext: mock.fn(async () => mockCtx),
  requireWriteAction: mock.fn(async () => mockCtx),
});

// ─── Action under test ───────────────────────────────────────────────
let updateWarehouse: (
  prevState: { error?: string } | undefined,
  formData: FormData,
) => Promise<{ error?: string; success?: true }>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/inventory/warehouses/actions");
  updateWarehouse = mod.updateWarehouse;
});

// ─── Tests ───────────────────────────────────────────────────────────

test("rejects missing id", async () => {
  withDbCaptureMock.mock.resetCalls();
  captureMock.mock.resetCalls();
  revalidateEntitiesMock.mock.resetCalls();

  const supabase = {
    from: mock.fn(() => {
      throw new Error("should not reach DB");
    }),
  };
  mockCtx = mockActionCtx({ supabase });

  const result = await updateWarehouse(
    undefined,
    formData({ id: "", name: "Warehouse A", location: "Ulaanbaatar" }),
  );
  assert.deepStrictEqual(result, { error: "Агуулахын ID олдсонгүй." });
  assert.strictEqual(supabase.from.mock.callCount(), 0);
});

test("rejects missing name", async () => {
  withDbCaptureMock.mock.resetCalls();
  captureMock.mock.resetCalls();
  revalidateEntitiesMock.mock.resetCalls();

  const supabase = {
    from: mock.fn(() => {
      throw new Error("should not reach DB");
    }),
  };
  mockCtx = mockActionCtx({ supabase });

  const result = await updateWarehouse(
    undefined,
    formData({ id: "wh-001", name: "", location: "Darkhan" }),
  );
  assert.deepStrictEqual(result, { error: "Нэр шаардлагатай." });
  assert.strictEqual(supabase.from.mock.callCount(), 0);
});

test("updates warehouse successfully", async () => {
  withDbCaptureMock.mock.resetCalls();
  captureMock.mock.resetCalls();
  revalidateEntitiesMock.mock.resetCalls();

  const updateMock = mock.fn(() => ({
    eq: mock.fn(() => ({
      eq: mock.fn(() => resolved(null)),
    })),
  }));
  const fromMock = mock.fn(() => ({ update: updateMock }));
  mockCtx = mockActionCtx({ supabase: { from: fromMock } });

  const result = await updateWarehouse(
    undefined,
    formData({ id: "wh-001", name: "New Name", location: "Erdenet" }),
  );
  assert.deepStrictEqual(result, { success: true, error: undefined });
  assert.strictEqual(fromMock.mock.callCount(), 1);
  assert.deepStrictEqual(fromMock.mock.calls[0].arguments[0], "warehouses");
  assert.deepStrictEqual(updateMock.mock.calls[0].arguments[0], {
    name: "New Name",
    location: "Erdenet",
  });
});

test("sets location to null when empty", async () => {
  withDbCaptureMock.mock.resetCalls();
  captureMock.mock.resetCalls();
  revalidateEntitiesMock.mock.resetCalls();

  const updateMock = mock.fn(() => ({
    eq: mock.fn(() => ({
      eq: mock.fn(() => resolved(null)),
    })),
  }));
  const fromMock = mock.fn(() => ({ update: updateMock }));
  mockCtx = mockActionCtx({ supabase: { from: fromMock } });

  const result = await updateWarehouse(
    undefined,
    formData({ id: "wh-002", name: "No Location", location: "" }),
  );
  assert.deepStrictEqual(result, { success: true, error: undefined });
  assert.deepStrictEqual(updateMock.mock.calls[0].arguments[0], {
    name: "No Location",
    location: null,
  });
});

test("updates location when provided", async () => {
  withDbCaptureMock.mock.resetCalls();
  captureMock.mock.resetCalls();
  revalidateEntitiesMock.mock.resetCalls();

  const updateMock = mock.fn(() => ({
    eq: mock.fn(() => ({
      eq: mock.fn(() => resolved(null)),
    })),
  }));
  const fromMock = mock.fn(() => ({ update: updateMock }));
  mockCtx = mockActionCtx({ supabase: { from: fromMock } });

  const result = await updateWarehouse(
    undefined,
    formData({ id: "wh-003", name: "Moved", location: "Choibalsan" }),
  );
  assert.deepStrictEqual(result, { success: true, error: undefined });
  assert.deepStrictEqual(updateMock.mock.calls[0].arguments[0], {
    name: "Moved",
    location: "Choibalsan",
  });
});

test("handles DB error and calls capture", async () => {
  withDbCaptureMock.mock.resetCalls();
  captureMock.mock.resetCalls();
  revalidateEntitiesMock.mock.resetCalls();

  const dbError = { message: "connection refused" };
  const eq2Mock = mock.fn(() => resolved(null, dbError));
  const eq1Mock = mock.fn(() => ({ eq: eq2Mock }));
  const updateMock = mock.fn(() => ({ eq: eq1Mock }));
  const fromMock = mock.fn(() => ({ update: updateMock }));
  mockCtx = mockActionCtx({ supabase: { from: fromMock } });

  const result = await updateWarehouse(
    undefined,
    formData({ id: "wh-001", name: "Test", location: "" }),
  );
  assert.ok(result.error);
  assert.ok(result.error.includes("connection refused"));
  assert.strictEqual(captureMock.mock.callCount(), 1);
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 0);
});

test("calls revalidateEntities on success", async () => {
  withDbCaptureMock.mock.resetCalls();
  captureMock.mock.resetCalls();
  revalidateEntitiesMock.mock.resetCalls();

  const eq2Mock = mock.fn(() => resolved(null));
  const eq1Mock = mock.fn(() => ({ eq: eq2Mock }));
  const updateMock = mock.fn(() => ({ eq: eq1Mock }));
  const fromMock = mock.fn(() => ({ update: updateMock }));
  mockCtx = mockActionCtx({ supabase: { from: fromMock } });

  const result = await updateWarehouse(
    undefined,
    formData({ id: "wh-001", name: "Updated", location: "" }),
  );
  assert.deepStrictEqual(result, { success: true, error: undefined });
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
  assert.deepStrictEqual(revalidateEntitiesMock.mock.calls[0].arguments[0], [
    "inventory",
  ]);
});

test("passes correct organization_id to eq chain", async () => {
  withDbCaptureMock.mock.resetCalls();
  captureMock.mock.resetCalls();
  revalidateEntitiesMock.mock.resetCalls();

  const eq2Mock = mock.fn(() => resolved(null));
  const eq1Mock = mock.fn(() => ({ eq: eq2Mock }));
  const updateMock = mock.fn(() => ({ eq: eq1Mock }));
  const fromMock = mock.fn(() => ({ update: updateMock }));
  mockCtx = mockActionCtx({
    supabase: { from: fromMock },
    organizationId: "org-specific-123",
  });

  await updateWarehouse(
    undefined,
    formData({ id: "wh-001", name: "Test", location: "" }),
  );
  assert.deepStrictEqual(eq1Mock.mock.calls[0].arguments, ["id", "wh-001"]);
  assert.deepStrictEqual(eq2Mock.mock.calls[0].arguments, [
    "organization_id",
    "org-specific-123",
  ]);
});
