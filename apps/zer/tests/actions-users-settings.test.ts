/**
 * Tests for `settings/users/actions.ts` — inviteMember, removeMember.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { mockActionCtx, formData, mockMod } from "./actions-helpers";

// ─── resolve helper ──────────────────────────────────────────────────
function resolved<T>(data: T, error: unknown = null) {
  return Promise.resolve({ data, error });
}

// ─── Chain helpers (avoid esbuild depth limits) ──────────────────────

/** Chain: select().eq().maybeSingle() → result */
function selectEqMaybeSingle(result: unknown) {
  return {
    select: mock.fn(() => ({
      eq: mock.fn(() => ({
        maybeSingle: mock.fn(() => result),
      })),
    })),
  };
}

/** Chain: update().eq() → result (inviteMember's existing-user update) */
function updateEq(result: unknown) {
  return {
    update: mock.fn(() => ({
      eq: mock.fn(() => result),
    })),
  };
}

/** Chain: insert() → result */
function insertChain(result: unknown) {
  return {
    insert: mock.fn(() => result),
  };
}

/** Chain: update().eq().eq() → result (removeMember) */
function updateTwoEq(result: unknown) {
  return {
    update: mock.fn(() => ({
      eq: mock.fn(() => ({
        eq: mock.fn(() => result),
      })),
    })),
  };
}

/** Fallback table — chainDefaults shape, non-terminating */
function fallbackTable() {
  return {
    select: mock.fn(() => fallbackTable()),
    insert: mock.fn(() => resolved({ id: "x" })),
    update: mock.fn(() => fallbackTable()),
    eq: mock.fn(() => fallbackTable()),
    maybeSingle: mock.fn(() => resolved(null)),
  };
}

// ─── Supabase factory ────────────────────────────────────────────────
function makeSupabase(profiles: Record<string, unknown>) {
  return {
    from: mock.fn((table: string) =>
      table === "profiles" ? { ...fallbackTable(), ...profiles } : fallbackTable(),
    ),
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

// ─── Service client mock ─────────────────────────────────────────────
const listUsersMock = mock.fn(async () => ({ data: { users: [] } }));
const inviteUserByEmailMock = mock.fn(async () => ({
  data: { user: { id: "new-auth-id" } },
  error: null,
}));

mockMod("@/lib/supabase/server-service", {
  createServiceClient: mock.fn(() => ({
    auth: {
      admin: {
        listUsers: listUsersMock,
        inviteUserByEmail: inviteUserByEmailMock,
      },
    },
  })),
});

// ─── Lazy-loaded module ──────────────────────────────────────────────
let inviteMember: (fd: FormData) => Promise<unknown>;
let removeMember: (fd: FormData) => Promise<unknown>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/settings/users/actions");
  inviteMember = mod.inviteMember;
  removeMember = mod.removeMember;
});

function resetAll() {
  captureMock.mock.resetCalls();
  revalidateEntityMock.mock.resetCalls();
  listUsersMock.mock.resetCalls();
  inviteUserByEmailMock.mock.resetCalls();
}

// ═══════════════════════════════════════════════════════════════════════
// inviteMember
// ═══════════════════════════════════════════════════════════════════════

test("inviteMember: rejects missing email", async () => {
  resetAll();
  const result = await inviteMember(formData({ email: "" }));
  assert.deepStrictEqual(result, { error: "И-мэйл хаяг шаардлагатай." });
});

test("inviteMember: rejects invalid email format", async () => {
  resetAll();
  const result = await inviteMember(formData({ email: "not-an-email" }));
  assert.deepStrictEqual(result, { error: "Зөв и-мэйл хаяг оруулна уу." });
});

test("inviteMember: invites new user (no existing auth user)", async () => {
  resetAll();
  listUsersMock.mock.mockImplementation(async () => ({ data: { users: [] } }));
  inviteUserByEmailMock.mock.mockImplementation(async () => ({
    data: { user: { id: "new-auth-id" } },
    error: null,
  }));

  // Profiles insert succeeds (default chain behavior is fine)
  mockCtx = { ...mockCtx, supabase: makeSupabase({}) };

  const result = await inviteMember(formData({ email: "new@test.com" }));

  assert.deepStrictEqual(result, { success: true });
  assert.equal(listUsersMock.mock.callCount(), 1);
  assert.equal(inviteUserByEmailMock.mock.callCount(), 1);
  assert.equal(revalidateEntityMock.mock.callCount(), 1);
});

test("inviteMember: invites existing auth user (no profile yet)", async () => {
  resetAll();
  listUsersMock.mock.mockImplementation(async () => ({
    data: { users: [{ id: "existing-id", email: "existing@test.com" }] },
  }));

  // maybeSingle returns profile with no org — user can be added
  const maybeSingleMock = mock.fn(async () => ({
    data: { id: "existing-id", organization_id: null },
    error: null,
  }));
  mockCtx = {
    ...mockCtx,
    supabase: makeSupabase({
      select: mock.fn(() => ({
        eq: mock.fn(() => ({ maybeSingle: maybeSingleMock })),
      })),
      ...updateEq(resolved({ error: null })),
    }),
  };

  const result = await inviteMember(formData({ email: "existing@test.com" }));

  assert.deepStrictEqual(result, { success: true });
  assert.equal(listUsersMock.mock.callCount(), 1);
  assert.equal(revalidateEntityMock.mock.callCount(), 1);
});

test("inviteMember: returns error when existing user already in org", async () => {
  resetAll();
  listUsersMock.mock.mockImplementation(async () => ({
    data: { users: [{ id: "existing-id", email: "existing@test.com" }] },
  }));

  // maybeSingle returns profile with same org_id
  mockCtx = {
    ...mockCtx,
    supabase: makeSupabase({
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          maybeSingle: mock.fn(async () => ({
            data: { id: "existing-id", organization_id: "test-org-id" },
            error: null,
          })),
        })),
      })),
    }),
  };

  const result = await inviteMember(formData({ email: "existing@test.com" }));

  assert.deepStrictEqual(result, {
    error: "Энэ хэрэглэгч аль хэдийн байгууллагад байна.",
  });
  assert.equal(revalidateEntityMock.mock.callCount(), 0);
});

test("inviteMember: handles inviteUserByEmail error", async () => {
  resetAll();
  listUsersMock.mock.mockImplementation(async () => ({ data: { users: [] } }));
  inviteUserByEmailMock.mock.mockImplementation(async () => ({
    data: null,
    error: { message: "Invite failed" },
  }));

  const result = await inviteMember(formData({ email: "fail@test.com" }));

  assert.deepStrictEqual(result, {
    error: "Урилга илгээхэд алдаа гарлаа: Invite failed",
  });
  assert.equal(revalidateEntityMock.mock.callCount(), 0);
});

test("inviteMember: handles profile insert error", async () => {
  resetAll();
  listUsersMock.mock.mockImplementation(async () => ({ data: { users: [] } }));
  inviteUserByEmailMock.mock.mockImplementation(async () => ({
    data: { user: { id: "new-auth-id" } },
    error: null,
  }));

  // Profile insert fails
  mockCtx = {
    ...mockCtx,
    supabase: makeSupabase({
      insert: mock.fn(() => resolved(null, { message: "Insert failed" })),
    }),
  };

  const result = await inviteMember(formData({ email: "new@test.com" }));

  assert.deepStrictEqual(result, {
    error: "Профайл үүсгэхэд алдаа гарлаа: Insert failed",
  });
  assert.equal(revalidateEntityMock.mock.callCount(), 0);
});

// ═══════════════════════════════════════════════════════════════════════
// removeMember
// ═══════════════════════════════════════════════════════════════════════

test("removeMember: rejects missing profileId", async () => {
  resetAll();
  const result = await removeMember(formData({ profile_id: "" }));
  assert.deepStrictEqual(result, { error: "Хэрэглэгч тодорхойгүй байна." });
});

test("removeMember: rejects self-removal", async () => {
  resetAll();
  const result = await removeMember(formData({ profile_id: "test-user-id" }));
  assert.deepStrictEqual(result, { error: "Та өөрийгөө хасах боломжгүй." });
});

test("removeMember: removes member successfully", async () => {
  resetAll();
  mockCtx = {
    ...mockCtx,
    supabase: makeSupabase({
      ...updateTwoEq(resolved({ error: null })),
    }),
  };

  const result = await removeMember(formData({ profile_id: "other-user-id" }));

  assert.deepStrictEqual(result, { success: true });
  assert.equal(revalidateEntityMock.mock.callCount(), 1);
});

test("removeMember: handles DB error", async () => {
  resetAll();
  mockCtx = {
    ...mockCtx,
    supabase: makeSupabase({
      ...updateTwoEq(resolved(null, { message: "Constraint violation" })),
    }),
  };

  const result = await removeMember(formData({ profile_id: "other-user-id" }));

  assert.deepStrictEqual(result, {
    error: "Хасахад алдаа гарлаа: Constraint violation",
  });
  assert.equal(captureMock.mock.callCount(), 1);
  assert.equal(revalidateEntityMock.mock.callCount(), 0);
});

test("removeMember: calls revalidateEntity on success", async () => {
  resetAll();
  mockCtx = {
    ...mockCtx,
    supabase: makeSupabase({
      ...updateTwoEq(resolved({ error: null })),
    }),
  };

  await removeMember(formData({ profile_id: "other-user-id" }));

  assert.equal(revalidateEntityMock.mock.callCount(), 1);
  assert.deepStrictEqual(revalidateEntityMock.mock.calls[0].arguments, ["users"]);
});
