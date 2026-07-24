/**
 * Tests for `settings/roles/actions.ts` — createRole, updateRole, deleteRole,
 * setRolePermissions, updateUserRole.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { mockActionCtx, formData, mockMod } from "./actions-helpers";

// ─── Resolve helper ──────────────────────────────────────────────────
function ok<T>(data: T, error: unknown = null) {
  return Promise.resolve({ data, error });
}

// ─── Chain helpers (avoid esbuild depth limits) ──────────────────────
/** Chain ending with eq → result. Used for deleteRole's .delete().eq().eq() */
function deleteChain(result: unknown) {
  return {
    delete: mock.fn(() => ({
      eq: mock.fn(() => ({ eq: mock.fn(() => result) })),
    })),
  };
}

/** Chain ending with eq → result. Used for updateRole's .update().eq().eq() */
function updateChain(result: unknown) {
  return {
    update: mock.fn(() => ({
      eq: mock.fn(() => ({ eq: mock.fn(() => result) })),
    })),
  };
}

/** Chain for profiles count check: .select().eq() → {count, error} */
function countChain(result: unknown) {
  return {
    select: mock.fn(() => ({
      eq: mock.fn(() => result),
    })),
  };
}

// ─── Global mocks ────────────────────────────────────────────────────
const withDbCaptureMock = mock.fn(async (_name: string, query: Promise<unknown>) => {
  const result = await query;
  return result;
});
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
mockMod("@/lib/audit", { logAuditEventWithClient: mock.fn(async () => {}) });
mockMod("next/server", { after: (fn: () => void) => fn() });
mockMod("next/cache", { revalidatePath: mock.fn(() => {}), revalidateTag: mock.fn(() => {}) });
mockMod("server-only", {});

let mockCtx: Record<string, unknown> = mockActionCtx();
mockMod("@/lib/action-utils", {
  requireActionContext: mock.fn(async () => mockCtx),
  requireWriteAction: mock.fn(async () => mockCtx),
});

// ─── Lazy-loaded module ──────────────────────────────────────────────
let createRole: (fd: FormData) => Promise<unknown>;
let updateRole: (roleId: string, fd: FormData) => Promise<unknown>;
let deleteRole: (roleId: string) => Promise<unknown>;
let setRolePermissions: (roleId: string, permissions: unknown[]) => Promise<unknown>;
let updateUserRole: (profileId: string, roleId: string | null) => Promise<unknown>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/settings/roles/actions");
  createRole = mod.createRole;
  updateRole = mod.updateRole;
  deleteRole = mod.deleteRole;
  setRolePermissions = mod.setRolePermissions;
  updateUserRole = mod.updateUserRole;
});

function resetMocks() {
  captureMock.mock.resetCalls();
  revalidateEntityMock.mock.resetCalls();
  mockCtx = mockActionCtx();
}

// ─── createRole ──────────────────────────────────────────────────────
test("createRole — rejects missing name", async () => {
  resetMocks();
  const result = await createRole(formData({ name: "" }));
  assert.deepStrictEqual(result, { error: "Нэр шаардлагатай" });
});

test("createRole — creates role successfully (returns undefined)", async () => {
  resetMocks();
  const result = await createRole(formData({ name: "Admin", description: "Admin role" }));
  assert.strictEqual(result, undefined);
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 1);
  assert.deepStrictEqual(revalidateEntityMock.mock.calls[0].arguments, ["roles"]);
});

test("createRole — handles insert error", async () => {
  resetMocks();
  const dbError = { message: "insert failed", code: "23505" };
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => ({
        insert: mock.fn(() => ok(null, dbError)),
      })),
      rpc: mock.fn(() => ok({})),
    },
  });
  const result = await createRole(formData({ name: "Admin" }));
  assert.deepStrictEqual(result, { error: "Энэ нэртэй үүрэг бүртгэгдсэн байна" });
  assert.strictEqual(captureMock.mock.callCount(), 1);
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 0);
});

// ─── updateRole ──────────────────────────────────────────────────────
test("updateRole — rejects missing name", async () => {
  resetMocks();
  const result = await updateRole("role-1", formData({ name: "  " }));
  assert.deepStrictEqual(result, { error: "Нэр шаардлагатай" });
});

test("updateRole — updates role successfully (returns undefined)", async () => {
  resetMocks();
  const result = await updateRole("role-1", formData({ name: "Editor", description: "Updated" }));
  assert.strictEqual(result, undefined);
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 1);
  assert.deepStrictEqual(revalidateEntityMock.mock.calls[0].arguments, ["roles"]);
});

test("updateRole — handles DB error", async () => {
  resetMocks();
  const dbError = { message: "update failed" };
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => updateChain(ok(null, dbError))),
      rpc: mock.fn(() => ok({})),
    },
  });
  const result = await updateRole("role-1", formData({ name: "Editor" }));
  assert.deepStrictEqual(result, { error: "update failed" });
  assert.strictEqual(captureMock.mock.callCount(), 1);
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 0);
});

// ─── deleteRole ──────────────────────────────────────────────────────
test("deleteRole — deletes successfully (returns undefined)", async () => {
  resetMocks();
  // profiles count check → 0 members, then roles delete → ok
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn((table: string) => {
        if (table === "profiles") return countChain(ok([], null));
        if (table === "roles") return deleteChain(ok(null, null));
        return {};
      }),
      rpc: mock.fn(() => ok({})),
    },
  });
  const result = await deleteRole("role-1");
  assert.strictEqual(result, undefined);
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 1);
  assert.deepStrictEqual(revalidateEntityMock.mock.calls[0].arguments, ["roles"]);
});

test("deleteRole — handles DB error", async () => {
  resetMocks();
  const dbError = { message: "delete failed" };
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn((table: string) => {
        if (table === "profiles") return countChain(ok([], null));
        if (table === "roles") return deleteChain(ok(null, dbError));
        return {};
      }),
      rpc: mock.fn(() => ok({})),
    },
  });
  const result = await deleteRole("role-1");
  assert.deepStrictEqual(result, { error: "delete failed" });
  assert.strictEqual(captureMock.mock.callCount(), 1);
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 0);
});

// ─── setRolePermissions ──────────────────────────────────────────────
test("setRolePermissions — sets permissions via RPC successfully (returns undefined)", async () => {
  resetMocks();
  const rpcMock = mock.fn(() => ok(true, null));
  mockCtx = mockActionCtx({
    supabase: { from: mock.fn(() => ({})), rpc: rpcMock },
  });
  const permissions = ["products.view", "products.edit"];
  const result = await setRolePermissions("role-1", permissions);
  assert.strictEqual(result, undefined);
  assert.strictEqual(rpcMock.mock.callCount(), 1);
  assert.deepStrictEqual(rpcMock.mock.calls[0].arguments, [
    "set_role_permissions",
    { p_role_id: "role-1", p_permissions: permissions },
  ]);
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 1);
});

test("setRolePermissions — sets empty permissions (returns undefined)", async () => {
  resetMocks();
  const rpcMock = mock.fn(() => ok(true, null));
  mockCtx = mockActionCtx({
    supabase: { from: mock.fn(() => ({})), rpc: rpcMock },
  });
  const result = await setRolePermissions("role-1", []);
  assert.strictEqual(result, undefined);
  assert.deepStrictEqual(rpcMock.mock.calls[0].arguments, [
    "set_role_permissions",
    { p_role_id: "role-1", p_permissions: [] },
  ]);
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 1);
});

test("setRolePermissions — handles RPC error", async () => {
  resetMocks();
  const rpcError = { message: "rpc failed" };
  mockCtx = mockActionCtx({
    supabase: { from: mock.fn(() => ({})), rpc: mock.fn(() => ok(null, rpcError)) },
  });
  const result = await setRolePermissions("role-1", ["products.view"]);
  assert.deepStrictEqual(result, { error: "rpc failed" });
  assert.strictEqual(captureMock.mock.callCount(), 1);
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 0);
});

// ─── updateUserRole ──────────────────────────────────────────────────
test("updateUserRole — updates user role successfully (returns undefined)", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => updateChain(ok(null, null))),
      rpc: mock.fn(() => ok({})),
    },
  });
  const result = await updateUserRole("profile-1", "role-1");
  assert.strictEqual(result, undefined);
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 1);
  assert.deepStrictEqual(revalidateEntityMock.mock.calls[0].arguments, ["users"]);
});

test("updateUserRole — sets role to null (returns undefined)", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => updateChain(ok(null, null))),
      rpc: mock.fn(() => ok({})),
    },
  });
  const result = await updateUserRole("profile-1", null);
  assert.strictEqual(result, undefined);
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 1);
  assert.deepStrictEqual(revalidateEntityMock.mock.calls[0].arguments, ["users"]);
});

test("updateUserRole — handles DB error", async () => {
  resetMocks();
  const dbError = { message: "update failed" };
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => updateChain(ok(null, dbError))),
      rpc: mock.fn(() => ok({})),
    },
  });
  const result = await updateUserRole("profile-1", "role-1");
  assert.deepStrictEqual(result, { error: "update failed" });
  assert.strictEqual(captureMock.mock.callCount(), 1);
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 0);
});
