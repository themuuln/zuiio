/**
 * Tests for `settings/smtp/actions.ts` — addSmtpConfig, deleteSmtpConfig, toggleSmtpConfig.
 *
 * Key: these are superadmin actions (not org-scoped). They use
 * requireSuperadminAction() → getSuperadminEmail() and createServiceClient().
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { formData, mockMod, resolved } from "./actions-helpers";

// ─── Global mocks ────────────────────────────────────────────────────

const captureMock = mock.fn(() => {});
mockMod("@zuiio/capture", { capture: captureMock });

const revalidatePathMock = mock.fn(() => {});
mockMod("next/cache", { revalidatePath: revalidatePathMock, revalidateTag: mock.fn(() => {}) });

mockMod("next/server", { after: (fn: () => unknown) => fn() });
mockMod("server-only", {});

mockMod("next/navigation", {
  redirect: mock.fn(() => {
    throw new Error("REDIRECT");
  }),
});

// requireSuperadminAction uses getSuperadminEmail
const getSuperadminEmailMock = mock.fn(async () => "admin@example.com");
mockMod("@/lib/superadmin", { getSuperadminEmail: getSuperadminEmailMock });

// ─── Service client mock builder ─────────────────────────────────────

interface ServiceMocks {
  from: ReturnType<typeof mock.fn>;
  insert: ReturnType<typeof mock.fn>;
  deleteEq: ReturnType<typeof mock.fn>;
  updateEq: ReturnType<typeof mock.fn>;
}

function buildServiceMocks(overrides?: {
  insertResult?: { error: { message: string } | null };
  deleteResult?: { error: { message: string } | null };
  updateResult?: { error: { message: string } | null };
}): ServiceMocks {
  const insert = mock.fn(() => overrides?.insertResult ?? { error: null });
  const deleteEq = mock.fn(() => overrides?.deleteResult ?? { error: null });
  const updateEq = mock.fn(() => overrides?.updateResult ?? { error: null });
  const from = mock.fn(() => ({
    insert,
    delete: mock.fn(() => ({ eq: deleteEq })),
    update: mock.fn((_data: Record<string, unknown>) => ({ eq: updateEq })),
  }));
  return { from, insert, deleteEq, updateEq };
}

let svc: ServiceMocks;

mockMod("@/lib/supabase/server-service", {
  createServiceClient: mock.fn(() => ({
    from: (...args: unknown[]) => svc.from(...args),
  })),
});

// ─── Lazy-loaded actions ─────────────────────────────────────────────

let addSmtpConfig: (
  prevState: { error?: string; success?: boolean } | undefined,
  fd: FormData,
) => Promise<unknown>;
let deleteSmtpConfig: (configId: string) => Promise<unknown>;
let toggleSmtpConfig: (configId: string, isActive: boolean) => Promise<unknown>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/settings/smtp/actions");
  addSmtpConfig = mod.addSmtpConfig;
  deleteSmtpConfig = mod.deleteSmtpConfig;
  toggleSmtpConfig = mod.toggleSmtpConfig;
});

// ─── Reset helpers ───────────────────────────────────────────────────

function resetMocks() {
  captureMock.mock.resetCalls();
  revalidatePathMock.mock.resetCalls();
  getSuperadminEmailMock.mock.resetCalls();
  getSuperadminEmailMock.mock.mockImplementation(async () => "admin@example.com");
  svc = buildServiceMocks();
}

// ═════════════════════════════════════════════════════════════════════
// addSmtpConfig
// ═════════════════════════════════════════════════════════════════════

test("addSmtpConfig: rejects when not superadmin", async () => {
  resetMocks();
  getSuperadminEmailMock.mock.mockImplementation(async () => null);

  await assert.rejects(
    () => addSmtpConfig(undefined, formData({})),
    (err: Error) => {
      assert.equal(err.message, "REDIRECT");
      return true;
    },
  );
});

test("addSmtpConfig: creates with defaults for missing fields", async () => {
  resetMocks();

  const fd = formData({
    username: "user@gmail.com",
    password: "secret",
    from_email: "no-reply@example.com",
  });

  const result = await addSmtpConfig(undefined, fd);

  assert.deepEqual(result, { success: true });
  assert.equal(svc.from.mock.callCount(), 1);
  assert.deepEqual(svc.from.mock.calls[0].arguments, ["smtp_configs"]);

  // insert was called with default host, port, priority, and null from_name
  assert.equal(svc.insert.mock.callCount(), 1);
  const inserted = svc.insert.mock.calls[0].arguments[0];
  assert.equal(inserted.host, "smtp.gmail.com");
  assert.equal(inserted.port, 587);
  assert.equal(inserted.username, "user@gmail.com");
  assert.equal(inserted.password, "secret");
  assert.equal(inserted.from_email, "no-reply@example.com");
  assert.equal(inserted.from_name, null);
  assert.equal(inserted.priority, 0);

  assert.equal(revalidatePathMock.mock.callCount(), 1);
  assert.deepEqual(revalidatePathMock.mock.calls[0].arguments, ["/settings/smtp"]);
});

test("addSmtpConfig: creates with all fields", async () => {
  resetMocks();

  const fd = formData({
    host: "smtp.mailgun.org",
    port: "465",
    username: "mg@example.com",
    password: "s3cret",
    from_email: "hello@example.com",
    from_name: "My App",
    priority: "10",
  });

  const result = await addSmtpConfig(undefined, fd);

  assert.deepEqual(result, { success: true });
  const inserted = svc.insert.mock.calls[0].arguments[0];
  assert.equal(inserted.host, "smtp.mailgun.org");
  assert.equal(inserted.port, 465);
  assert.equal(inserted.username, "mg@example.com");
  assert.equal(inserted.password, "s3cret");
  assert.equal(inserted.from_email, "hello@example.com");
  assert.equal(inserted.from_name, "My App");
  assert.equal(inserted.priority, 10);
});

test("addSmtpConfig: handles DB error", async () => {
  resetMocks();
  svc = buildServiceMocks({
    insertResult: { error: { message: "relation smtp_configs does not exist" } },
  });

  const fd = formData({
    host: "smtp.example.com",
    port: "587",
    username: "u",
    password: "p",
    from_email: "f@e.com",
  });

  const result = await addSmtpConfig(undefined, fd);

  assert.deepEqual(result, { error: "relation smtp_configs does not exist" });
  assert.equal(captureMock.mock.callCount(), 1);
  assert.equal(revalidatePathMock.mock.callCount(), 0);
});

// ═════════════════════════════════════════════════════════════════════
// deleteSmtpConfig
// ═════════════════════════════════════════════════════════════════════

test("deleteSmtpConfig: deletes successfully", async () => {
  resetMocks();

  const result = await deleteSmtpConfig("config-abc-123");

  assert.deepEqual(result, { success: true });
  assert.equal(svc.from.mock.callCount(), 1);
  assert.deepEqual(svc.from.mock.calls[0].arguments, ["smtp_configs"]);
  assert.equal(svc.deleteEq.mock.callCount(), 1);
  assert.deepEqual(svc.deleteEq.mock.calls[0].arguments, ["id", "config-abc-123"]);
  assert.equal(revalidatePathMock.mock.callCount(), 1);
  assert.deepEqual(revalidatePathMock.mock.calls[0].arguments, ["/settings/smtp"]);
});

test("deleteSmtpConfig: rejects when not superadmin", async () => {
  resetMocks();
  getSuperadminEmailMock.mock.mockImplementation(async () => null);

  await assert.rejects(
    () => deleteSmtpConfig("config-abc-123"),
    (err: Error) => {
      assert.equal(err.message, "REDIRECT");
      return true;
    },
  );
  assert.equal(svc.from.mock.callCount(), 0);
});

test("deleteSmtpConfig: handles DB error", async () => {
  resetMocks();
  svc = buildServiceMocks({
    deleteResult: { error: { message: "foreign key violation" } },
  });

  const result = await deleteSmtpConfig("config-abc-123");

  assert.deepEqual(result, { error: "foreign key violation" });
  assert.equal(captureMock.mock.callCount(), 1);
  assert.equal(revalidatePathMock.mock.callCount(), 0);
});

// ═════════════════════════════════════════════════════════════════════
// toggleSmtpConfig
// ═════════════════════════════════════════════════════════════════════

test("toggleSmtpConfig: toggles on successfully", async () => {
  resetMocks();

  const result = await toggleSmtpConfig("config-abc-123", true);

  assert.deepEqual(result, { success: true });
  assert.equal(svc.from.mock.callCount(), 1);
  assert.deepEqual(svc.from.mock.calls[0].arguments, ["smtp_configs"]);
  assert.equal(svc.updateEq.mock.callCount(), 1);
  assert.deepEqual(svc.updateEq.mock.calls[0].arguments, ["id", "config-abc-123"]);
  assert.equal(revalidatePathMock.mock.callCount(), 1);
  assert.deepEqual(revalidatePathMock.mock.calls[0].arguments, ["/settings/smtp"]);
});

test("toggleSmtpConfig: toggles off successfully", async () => {
  resetMocks();

  const result = await toggleSmtpConfig("config-abc-123", false);

  assert.deepEqual(result, { success: true });
  assert.equal(svc.updateEq.mock.callCount(), 1);
  assert.deepEqual(svc.updateEq.mock.calls[0].arguments, ["id", "config-abc-123"]);
  assert.equal(revalidatePathMock.mock.callCount(), 1);
});
test("toggleSmtpConfig: handles DB error", async () => {
  resetMocks();
  svc = buildServiceMocks({
    updateResult: { error: { message: "column is_active does not exist" } },
  });

  const result = await toggleSmtpConfig("config-abc-123", true);

  assert.deepEqual(result, { error: "column is_active does not exist" });
  assert.equal(captureMock.mock.callCount(), 1);
  assert.equal(revalidatePathMock.mock.callCount(), 0);
});
