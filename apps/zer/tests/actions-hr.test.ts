/**
 * Tests for `hr/actions.ts` — createEmployee, updateEmployee, deleteEmployee.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { formData, mockActionCtx, mockMod, resolved } from "./actions-helpers";

// ─── Shared mock helpers ────────────────────────────────────────────
/** Chain of .update().eq().eq() returning the given result */
function updateChain(result: unknown) {
  return {
    update: mock.fn(() => ({
      eq: mock.fn(() => ({
        eq: mock.fn(() => result),
      })),
    })),
  };
}

/** Chain of .delete().eq().eq() returning the given result */
function deleteChain(result: unknown) {
  return {
    delete: mock.fn(() => ({
      eq: mock.fn(() => ({
        eq: mock.fn(() => result),
      })),
    })),
  };
}

// ─── Global mocks ───────────────────────────────────────────────────
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

const revalidateEntityMock = mock.fn(() => {});
mockMod("@/lib/revalidate", {
  revalidateEntities: mock.fn(() => {}),
  revalidateEntityTag: mock.fn(() => {}),
  revalidateEntity: revalidateEntityMock,
});
mockMod("@/lib/audit", { logAuditEventWithClient: mock.fn(async () => {}) });
mockMod("next/server", { after: (fn: () => void) => fn() });
mockMod("next/cache", {
  revalidatePath: mock.fn(() => {}),
  revalidateTag: mock.fn(() => {}),
});
mockMod("server-only", {});

let mockCtx: Record<string, unknown> = mockActionCtx();
mockMod("@/lib/action-utils", {
  requireActionContext: mock.fn(async () => mockCtx),
  requireWriteAction: mock.fn(async () => mockCtx),
});

// ─── Lazy-loaded module ──────────────────────────────────────────────
let createEmployee: typeof import("@/app/(dashboard)/hr/actions").createEmployee;
let updateEmployee: typeof import("@/app/(dashboard)/hr/actions").updateEmployee;
let deleteEmployee: typeof import("@/app/(dashboard)/hr/actions").deleteEmployee;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/hr/actions");
  createEmployee = mod.createEmployee;
  updateEmployee = mod.updateEmployee;
  deleteEmployee = mod.deleteEmployee;
});

// ═══════════════════════════════════════════════════════════════════════
// createEmployee
// ═══════════════════════════════════════════════════════════════════════
test("createEmployee — rejects missing name", async () => {
  const fd = formData({ full_name: "", base_salary: "800000" });
  const result = await createEmployee(null, fd);
  assert.deepEqual(result, { error: "Нэр шаардлагатай." });
});

test("createEmployee — rejects salary below minimum", async () => {
  const fd = formData({ full_name: "Бат", base_salary: "500000" });
  const result = await createEmployee(null, fd);
  assert.deepEqual(result, {
    error: "Цалин хөдөлмөрийн хөлсний доод хэмжээнээс бага байж болохгүй.",
  });
});

test("createEmployee — creates employee successfully", async () => {
  const insertMock = mock.fn(() => resolved({ id: "new-emp" }));
  const employeesTable = { insert: insertMock };
  const supabase = {
    from: mock.fn((table: string) =>
      table === "employees" ? employeesTable : {},
    ),
    rpc: mock.fn(() => resolved({})),
  };
  mockCtx = { ...mockActionCtx(), supabase };

  const fd = formData({
    full_name: "Бат-Эрдэнэ",
    base_salary: "1200000",
    position: "Ахлах",
    department: "Нягтлан",
  });
  const result = await createEmployee(null, fd);

  assert.deepEqual(result, { success: true });
  assert.equal(insertMock.mock.callCount(), 1);
  const insertArg = insertMock.mock.calls[0].arguments[0] as Record<
    string,
    unknown
  >;
  assert.equal(insertArg.full_name, "Бат-Эрдэнэ");
  assert.equal(insertArg.base_salary, 1200000);
  assert.equal(insertArg.organization_id, "test-org-id");
});

test("createEmployee — handles insert error", async () => {
  const insertMock = mock.fn(() =>
    resolved(null, { message: "duplicate key" }),
  );
  const employeesTable = { insert: insertMock };
  const supabase = {
    from: mock.fn((table: string) =>
      table === "employees" ? employeesTable : {},
    ),
    rpc: mock.fn(() => resolved({})),
  };
  mockCtx = { ...mockActionCtx(), supabase };

  const fd = formData({ full_name: "Бат", base_salary: "800000" });
  const result = await createEmployee(null, fd);

  assert.deepEqual(result, { error: "duplicate key" });
});

// ═══════════════════════════════════════════════════════════════════════
// updateEmployee
// ═══════════════════════════════════════════════════════════════════════
test("updateEmployee — rejects missing id", async () => {
  const fd = formData({ id: null, full_name: "Бат" });
  const result = await updateEmployee(null, fd);
  assert.deepEqual(result, { error: "Ажилтан тодорхойгүй байна." });
});

test("updateEmployee — updates employee successfully", async () => {
  revalidateEntityMock.mock.resetCalls();
  const chain = updateChain(resolved({ id: "emp-1" }));
  const supabase = {
    from: mock.fn((table: string) => (table === "employees" ? chain : {})),
    rpc: mock.fn(() => resolved({})),
  };
  mockCtx = { ...mockActionCtx(), supabase };

  const fd = formData({
    id: "emp-1",
    full_name: "Бат-Эрдэнэ",
    base_salary: "1500000",
    hire_date: "2024-01-15",
  });
  const result = await updateEmployee(null, fd);

  assert.deepEqual(result, { success: true });
  assert.equal(revalidateEntityMock.mock.callCount(), 1);
});

test("updateEmployee — handles DB error", async () => {
  const chain = updateChain(resolved(null, { message: "db failure" }));
  const supabase = {
    from: mock.fn((table: string) => (table === "employees" ? chain : {})),
    rpc: mock.fn(() => resolved({})),
  };
  mockCtx = { ...mockActionCtx(), supabase };

  const fd = formData({ id: "emp-1", full_name: "Бат" });
  const result = await updateEmployee(null, fd);

  assert.deepEqual(result, { error: "db failure" });
});

test("updateEmployee — only includes provided fields in updates", async () => {
  let capturedUpdates: Record<string, unknown> = {};
  const chain = {
    update: mock.fn((updates: Record<string, unknown>) => {
      capturedUpdates = updates;
      return {
        eq: mock.fn(() => ({
          eq: mock.fn(() => resolved({ id: "emp-1" })),
        })),
      };
    }),
  };
  const supabase = {
    from: mock.fn((table: string) => (table === "employees" ? chain : {})),
    rpc: mock.fn(() => resolved({})),
  };
  mockCtx = { ...mockActionCtx(), supabase };

  const fd = formData({
    id: "emp-1",
    full_name: "Бат",
  });
  await updateEmployee(null, fd);

  assert.equal(capturedUpdates.full_name, "Бат");
  assert.equal(capturedUpdates.base_salary, undefined);
  assert.equal(capturedUpdates.hire_date, undefined);
});

// ═══════════════════════════════════════════════════════════════════════
// deleteEmployee
// ═══════════════════════════════════════════════════════════════════════
test("deleteEmployee — rejects missing id", async () => {
  const fd = formData({ id: null });
  const result = await deleteEmployee(fd);
  assert.deepEqual(result, { error: "Ажилтан тодорхойгүй байна." });
});

test("deleteEmployee — deletes employee successfully", async () => {
  const chain = deleteChain(resolved(null));
  const supabase = {
    from: mock.fn((table: string) => (table === "employees" ? chain : {})),
    rpc: mock.fn(() => resolved({})),
  };
  mockCtx = { ...mockActionCtx(), supabase };

  const fd = formData({ id: "emp-1" });
  const result = await deleteEmployee(fd);

  assert.deepEqual(result, { success: true });
});

test("deleteEmployee — handles DB error", async () => {
  const chain = deleteChain(resolved(null, { message: "not found" }));
  const supabase = {
    from: mock.fn((table: string) => (table === "employees" ? chain : {})),
    rpc: mock.fn(() => resolved({})),
  };
  mockCtx = { ...mockActionCtx(), supabase };

  const fd = formData({ id: "emp-1" });
  const result = await deleteEmployee(fd);

  assert.deepEqual(result, { error: "not found" });
});

test("deleteEmployee — calls revalidateEntity on success", async () => {
  const chain = deleteChain(resolved(null));
  const supabase = {
    from: mock.fn((table: string) => (table === "employees" ? chain : {})),
    rpc: mock.fn(() => resolved({})),
  };
  mockCtx = { ...mockActionCtx(), supabase };

  revalidateEntityMock.mock.resetCalls();
  const fd = formData({ id: "emp-1" });
  await deleteEmployee(fd);

  assert.equal(revalidateEntityMock.mock.callCount(), 1);
  assert.equal(revalidateEntityMock.mock.calls[0].arguments[0], "hr");
});
