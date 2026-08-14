/**
 * Tests for `customers/actions.ts` — createContact, updateContact.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { formData, mockActionCtx, mockMod } from "./actions-helpers";

// ─── resolve helper (inline to avoid esbuild depth issues) ──────────
function resolved<T>(data: T, error: unknown = null) {
  return Promise.resolve({ data, error });
}

// ─── Shared mock helpers ────────────────────────────────────────────
/** Three nested .eq() calls for createContact duplicate check */
function threeEq(maybeSingleResult: unknown) {
  return {
    eq: mock.fn(() => ({
      eq: mock.fn(() => ({
        eq: mock.fn(() => ({
          maybeSingle: mock.fn(() => maybeSingleResult),
        })),
      })),
    })),
  };
}

/** Default contacts table mock with deep select().eq().eq().eq().maybeSingle() */
function mockContacts(overrides: Record<string, unknown> = {}) {
  return {
    select: mock.fn(() => threeEq(resolved(null, null))),
    insert: mock.fn(() => ({
      select: mock.fn(() => ({
        single: mock.fn(() => resolved({ id: "new-id" })),
      })),
    })),
    ...overrides,
  };
}

/** Default non-contacts table stub with deep select + 3eq */
function otherTable() {
  return { select: mock.fn(() => threeEq(resolved(null, null))) };
}

/** Build supabase mock for createContact tests */
function makeSupabase(contacts: ReturnType<typeof mockContacts>) {
  return {
    from: mock.fn((table: string) =>
      table === "contacts" ? contacts : otherTable(),
    ),
    rpc: mock.fn(() => resolved({})),
  };
}

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

const revalidateEntitiesMock = mock.fn(() => {});
const revalidateEntityTagMock = mock.fn(() => {});
mockMod("@/lib/revalidate", {
  revalidateEntities: revalidateEntitiesMock,
  revalidateEntityTag: revalidateEntityTagMock,
  revalidateEntity: mock.fn(() => {}),
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

let mockValidationError: string | null = null;
mockMod("@/lib/domain-rules", {
  validateContactInput: mock.fn(() => mockValidationError),
});

// ─── Lazy-loaded module ──────────────────────────────────────────────
let createContact: (
  prev: { error?: string } | undefined,
  form: FormData,
) => Promise<unknown>;
let updateContact: (
  prev: { error?: string } | undefined,
  form: FormData,
) => Promise<unknown>;
test.before(async () => {
  const mod = await import("@/app/(dashboard)/customers/actions");
  createContact = mod.createContact;
  updateContact = mod.updateContact;
});

function resetMocks() {
  withDbCaptureMock.mock.resetCalls();
  revalidateEntitiesMock.mock.resetCalls();
  revalidateEntityTagMock.mock.resetCalls();
  mockValidationError = null;
}

// ─── updateContact supabase factory ──────────────────────────────────
function updateSupabase(
  existingContact: unknown,
  duplicateResult: unknown,
  updateResult: unknown,
) {
  let callIdx = 0;
  return {
    from: mock.fn((table: string) => {
      if (table !== "contacts") return otherTable();
      callIdx++;
      if (callIdx === 1) {
        return {
          select: mock.fn(() => ({
            eq: mock.fn(() => ({
              eq: mock.fn(() => ({
                maybeSingle: mock.fn(() => existingContact),
              })),
            })),
          })),
          maybeSingle: mock.fn(() => existingContact),
        };
      }
      if (callIdx === 2) {
        return {
          select: mock.fn(() => ({
            eq: mock.fn(() => ({
              eq: mock.fn(() => ({
                eq: mock.fn(() => ({
                  neq: mock.fn(() => ({
                    maybeSingle: mock.fn(() => duplicateResult),
                  })),
                })),
              })),
            })),
          })),
        };
      }
      return {
        update: mock.fn(() => ({
          eq: mock.fn(() => ({ eq: mock.fn(() => updateResult) })),
        })),
      };
    }),
    rpc: mock.fn(() => resolved({})),
  };
}

// ═══════════════════════════════════════════════════════════════════
// createContact tests
// ═══════════════════════════════════════════════════════════════════

test("createContact rejects missing name", async () => {
  resetMocks();
  mockValidationError = "Нэр шаардлагатай.";
  mockCtx = mockActionCtx();
  const result = await createContact(undefined, formData({ name: "" }));
  assert.ok(result && "error" in result);
});

test("createContact checks for duplicate by name + type", async () => {
  resetMocks();
  const contacts = mockContacts({
    select: mock.fn(() => threeEq(resolved({ id: "existing" }))),
  });
  mockCtx = mockActionCtx({ supabase: makeSupabase(contacts) });
  const result = await createContact(
    undefined,
    formData({ name: "Болор", type: "customer" }),
  );
  assert.ok(result && "error" in result);
});

test("createContact inserts with all fields", async () => {
  resetMocks();
  mockCtx = mockActionCtx({ supabase: makeSupabase(mockContacts()) });
  const result = await createContact(
    undefined,
    formData({
      name: "Болор",
      phone: "99112233",
      email: "b@test.mn",
      address: "УБ",
      type: "customer",
    }),
  );
  assert.ok(result && "success" in result);
});

test("createContact uses withDbCapture", async () => {
  resetMocks();
  mockCtx = mockActionCtx({ supabase: makeSupabase(mockContacts()) });
  await createContact(undefined, formData({ name: "Тест", type: "customer" }));
  assert.ok(withDbCaptureMock.mock.calls.length >= 1);
});

test("createContact revalidates on success", async () => {
  resetMocks();
  mockCtx = mockActionCtx({ supabase: makeSupabase(mockContacts()) });
  await createContact(undefined, formData({ name: "Тест", type: "customer" }));
  assert.ok(revalidateEntitiesMock.mock.calls.length >= 1);
  assert.ok(revalidateEntityTagMock.mock.calls.length >= 1);
});

test("createContact handles insert error", async () => {
  resetMocks();
  const contacts = mockContacts({
    insert: mock.fn(() => ({
      select: mock.fn(() => ({
        single: mock.fn(() => resolved(null, { message: "DB err" })),
      })),
    })),
  });
  mockCtx = mockActionCtx({ supabase: makeSupabase(contacts) });
  const result = await createContact(
    undefined,
    formData({ name: "Тест", type: "customer" }),
  );
  assert.ok(result && "error" in result);
});

// ═══════════════════════════════════════════════════════════════════
// updateContact tests
// ═══════════════════════════════════════════════════════════════════

test("updateContact rejects missing id", async () => {
  resetMocks();
  mockCtx = mockActionCtx();
  const result = await updateContact(undefined, formData({ name: "Тест" }));
  assert.ok(result && "error" in result);
});

test("updateContact updates with correct fields", async () => {
  resetMocks();
  const supabase = updateSupabase(
    resolved({ type: "customer" }),
    resolved(null, null),
    resolved(null, null),
  );
  mockCtx = mockActionCtx({ supabase });
  const result = await updateContact(
    undefined,
    formData({ id: "c1", name: "Шинэ нэр" }),
  );
  assert.ok(result && "success" in result);
});

test("updateContact handles DB error", async () => {
  resetMocks();
  const thenable = {
    // biome-ignore lint/suspicious/noThenProperty: Supabase query builders are intentionally thenable in this test mock.
    then: (resolve: (v: unknown) => void) =>
      resolve({ data: null, error: { message: "Update failed" } }),
  };
  const supabase = updateSupabase(
    resolved({ type: "customer" }),
    resolved(null, null),
    thenable,
  );
  mockCtx = mockActionCtx({ supabase });
  const result = await updateContact(
    undefined,
    formData({ id: "c1", name: "Тест" }),
  );
  assert.deepStrictEqual(result, { error: "Update failed" });
});

test("updateContact revalidates on success", async () => {
  resetMocks();
  const supabase = updateSupabase(
    resolved({ type: "customer" }),
    resolved(null, null),
    resolved(null, null),
  );
  mockCtx = mockActionCtx({ supabase });
  revalidateEntitiesMock.mock.resetCalls();
  revalidateEntityTagMock.mock.resetCalls();
  await updateContact(undefined, formData({ id: "c1", name: "Тест нэр" }));
  assert.ok(revalidateEntitiesMock.mock.calls.length >= 1);
  assert.ok(revalidateEntityTagMock.mock.calls.length >= 1);
});

test("updateContact returns duplicate error", async () => {
  resetMocks();
  const supabase = updateSupabase(
    resolved({ type: "customer" }),
    resolved({ id: "dup" }),
    resolved(null, null),
  );
  mockCtx = mockActionCtx({ supabase });
  const result = await updateContact(
    undefined,
    formData({ id: "c1", name: "Давхар" }),
  );
  assert.ok(result && "error" in result);
});
