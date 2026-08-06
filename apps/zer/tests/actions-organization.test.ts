/**
 * Tests for `settings/organization/actions.ts` — updateReportEmailSettings,
 * updatePublicProfile.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { formData, mockActionCtx, mockMod, resolved } from "./actions-helpers";

// ─── Chain helpers (avoid esbuild depth limits) ──────────────────────
/** Chain: .update().eq() → result (single eq, used by updateReportEmailSettings) */
function updateEqChain(result: unknown) {
  return {
    update: mock.fn(() => ({
      eq: mock.fn(() => result),
    })),
  };
}

/** Chain: .upsert() → result (used by updatePublicProfile) */
function upsertChain(result: unknown) {
  return {
    upsert: mock.fn(() => result),
  };
}

// ─── Global mocks ────────────────────────────────────────────────────
const withDbCaptureMock = mock.fn(
  async (_name: string, query: Promise<unknown>) => {
    const result = await query;
    return result;
  },
);
const captureMock = mock.fn(() => {});
mockMod("@zuiio/capture", {
  capture: captureMock,
  withDbCapture: withDbCaptureMock,
});

const revalidateEntityMock = mock.fn(() => {});
const revalidateEntitiesMock = mock.fn(() => {});
const revalidateEntityTagMock = mock.fn(() => {});
mockMod("@/lib/revalidate", {
  revalidateEntities: revalidateEntitiesMock,
  revalidateEntityTag: revalidateEntityTagMock,
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
let updateReportEmailSettings: (
  prevState: unknown,
  fd: FormData,
) => Promise<unknown>;
let updatePublicProfile: (prevState: unknown, fd: FormData) => Promise<unknown>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/settings/organization/actions");
  updateReportEmailSettings = mod.updateReportEmailSettings;
  updatePublicProfile = mod.updatePublicProfile;
});

function resetMocks() {
  captureMock.mock.resetCalls();
  revalidateEntityMock.mock.resetCalls();
  withDbCaptureMock.mock.resetCalls();
}

// ─── updateReportEmailSettings ───────────────────────────────────────

test("updateReportEmailSettings — rejects missing time when enabled", async () => {
  resetMocks();
  const fd = formData({
    report_email_enabled: "on",
    report_email_time: "",
    report_email_recipient: "admin@example.com",
  });

  const result = await updateReportEmailSettings(undefined, fd);
  assert.deepEqual(result, { error: "Цагийг сонгоно уу." });
});

test("updateReportEmailSettings — rejects invalid time format", async () => {
  resetMocks();
  const fd = formData({
    report_email_enabled: "on",
    report_email_time: "6:00",
    report_email_recipient: "admin@example.com",
  });

  const result = await updateReportEmailSettings(undefined, fd);
  assert.deepEqual(result, {
    error: "Цагийн формат буруу байна. (Жишээ: 18:00)",
  });
});

test("updateReportEmailSettings — enables report email with valid time and recipient", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => updateEqChain(resolved(null, null))),
    },
  });

  const fd = formData({
    report_email_enabled: "on",
    report_email_time: "18:00",
    report_email_recipient: "admin@example.com",
  });

  const result = await updateReportEmailSettings(undefined, fd);
  assert.deepEqual(result, { success: true });
  assert.equal(revalidateEntityMock.mock.callCount(), 1);
  assert.deepEqual(revalidateEntityMock.mock.calls[0].arguments[0], "settings");
});

test("updateReportEmailSettings — disables report email (enabled=false)", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => updateEqChain(resolved(null, null))),
    },
  });

  const fd = formData({
    report_email_time: "18:00",
    report_email_recipient: "admin@example.com",
  });
  // report_email_enabled is NOT set → === "on" is false

  const result = await updateReportEmailSettings(undefined, fd);
  assert.deepEqual(result, { success: true });
  assert.equal(revalidateEntityMock.mock.callCount(), 1);
});

test("updateReportEmailSettings — handles DB error", async () => {
  resetMocks();
  const dbError = { message: "db failure" };
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => updateEqChain(resolved(null, dbError))),
    },
  });

  const fd = formData({
    report_email_enabled: "on",
    report_email_time: "09:00",
    report_email_recipient: "admin@example.com",
  });

  const result = await updateReportEmailSettings(undefined, fd);
  assert.deepEqual(result, {
    error: `Тохиргоо хадгалахад алдаа гарлаа: ${dbError.message}`,
  });
  assert.equal(captureMock.mock.callCount(), 1);
});

// ─── updatePublicProfile ─────────────────────────────────────────────

test("updatePublicProfile — enables catalog with all fields", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => upsertChain(resolved(null, null))),
    },
  });

  const fd = formData({
    catalog_enabled: "on",
    display_name: "My Shop",
    description: "Best shop ever",
    contact_email: "shop@example.com",
    contact_phone: "99112233",
    address: "123 Main St",
    website_url: "https://example.com",
  });

  const result = await updatePublicProfile(undefined, fd);
  assert.deepEqual(result, { success: true });
  assert.equal(revalidateEntityMock.mock.callCount(), 1);
  assert.deepEqual(revalidateEntityMock.mock.calls[0].arguments[0], "settings");
});

test("updatePublicProfile — disables catalog", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => upsertChain(resolved(null, null))),
    },
  });

  const fd = formData({
    display_name: "My Shop",
    description: "Some desc",
  });
  // catalog_enabled is NOT set → === "on" is false

  const result = await updatePublicProfile(undefined, fd);
  assert.deepEqual(result, { success: true });
});

test("updatePublicProfile — handles upsert error", async () => {
  resetMocks();
  const dbError = { message: "upsert failed" };
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => upsertChain(resolved(null, dbError))),
    },
  });

  const fd = formData({
    catalog_enabled: "on",
    display_name: "My Shop",
  });

  const result = await updatePublicProfile(undefined, fd);
  assert.deepEqual(result, {
    error: `Хадгалахад алдаа гарлаа: ${dbError.message}`,
  });
  assert.equal(captureMock.mock.callCount(), 1);
  assert.equal(revalidateEntityMock.mock.callCount(), 0);
});

test("updatePublicProfile — updates display name and description", async () => {
  resetMocks();
  const fromMock = mock.fn(() => upsertChain(resolved(null, null)));
  mockCtx = mockActionCtx({
    supabase: {
      from: fromMock,
    },
  });

  const fd = formData({
    catalog_enabled: "on",
    display_name: "Updated Name",
    description: "Updated description",
    contact_email: "new@example.com",
  });

  const result = await updatePublicProfile(undefined, fd);
  assert.deepEqual(result, { success: true });
  assert.equal(fromMock.mock.callCount(), 1);
  assert.equal(revalidateEntityMock.mock.callCount(), 1);
});

test("updatePublicProfile — calls revalidateEntity on success", async () => {
  resetMocks();
  mockCtx = mockActionCtx({
    supabase: {
      from: mock.fn(() => upsertChain(resolved(null, null))),
    },
  });

  const fd = formData({
    display_name: "Shop",
  });

  const result = await updatePublicProfile(undefined, fd);
  assert.deepEqual(result, { success: true });
  assert.equal(revalidateEntityMock.mock.callCount(), 1);
  assert.deepEqual(revalidateEntityMock.mock.calls[0].arguments[0], "settings");
});
