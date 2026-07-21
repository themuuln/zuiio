/**
 * Tests for `(auth)/reset-password/actions.ts` (updatePassword) and
 * `src/app/update-password/actions.ts` (updatePassword).
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { formData, mockMod } from "./actions-helpers";

// ─── Shared mocks ────────────────────────────────────────────────────

const captureMock = mock.fn(() => {});
mockMod("@zuiio/capture", { capture: captureMock });

mockMod("next/cache", {
  revalidatePath: mock.fn(() => {}),
  revalidateTag: mock.fn(() => {}),
});
mockMod("next/server", { after: (fn: () => unknown) => fn() });
mockMod("server-only", {});

const redirectMock = mock.fn(() => {
  throw new Error("REDIRECT");
});
mockMod("next/navigation", { redirect: redirectMock });

const validatePasswordUpdateInputMock = mock.fn(() => null);
mockMod("@/lib/domain-rules", {
  validatePasswordUpdateInput: validatePasswordUpdateInputMock,
});

const rateLimitMock = mock.fn(() => ({ error: null }));
mockMod("@zuiio/core", { rateLimit: rateLimitMock });

const updateUserMock = mock.fn(
  async () => ({ error: null }) as never,
);
mockMod("@/lib/supabase/server", {
  createClient: mock.fn(async () => ({
    auth: {
      updateUser: updateUserMock,
    },
  })),
});

// ─── Lazy-loaded actions ─────────────────────────────────────────────

let resetUpdatePassword: (
  prevState: unknown,
  fd: FormData,
) => Promise<unknown>;
let settingsUpdatePassword: (
  prevState: unknown,
  fd: FormData,
) => Promise<unknown>;

test.before(async () => {
  const resetMod = await import(
    "@/app/(auth)/reset-password/actions"
  );
  resetUpdatePassword = resetMod.updatePassword;

  const settingsMod = await import(
    "@/app/update-password/actions"
  );
  settingsUpdatePassword = settingsMod.updatePassword;
});

// ─── Reset helpers ───────────────────────────────────────────────────

function resetMocks() {
  captureMock.mock.resetCalls();
  redirectMock.mock.resetCalls();
  validatePasswordUpdateInputMock.mock.resetCalls();
  validatePasswordUpdateInputMock.mock.mockImplementation(() => null);
  rateLimitMock.mock.resetCalls();
  rateLimitMock.mock.mockImplementation(() => ({ error: null }));
  updateUserMock.mock.resetCalls();
  updateUserMock.mock.mockImplementation(
    async () => ({ error: null }) as never,
  );
}

// ═══════════════════════════════════════════════════════════════════════
// (auth)/reset-password — updatePassword
// ═══════════════════════════════════════════════════════════════════════

test("reset-password/updatePassword: validation error → returns error", async () => {
  resetMocks();
  validatePasswordUpdateInputMock.mock.mockImplementation(
    () => "Нууц үг таарахгүй байна.",
  );

  const result = await resetUpdatePassword(
    undefined,
    formData({ password: "12345678", confirm_password: "87654321" }),
  );

  assert.deepStrictEqual(result, { error: "Нууц үг таарахгүй байна." });
  assert.equal(updateUserMock.mock.callCount(), 0);
});

test("reset-password/updatePassword: rate limited → returns error", async () => {
  resetMocks();
  rateLimitMock.mock.mockImplementation(() => ({
    error: "Too many requests",
  }));

  const result = await resetUpdatePassword(
    undefined,
    formData({ password: "newpass123", confirm_password: "newpass123" }),
  );

  assert.deepStrictEqual(result, { error: "Too many requests" });
  assert.equal(updateUserMock.mock.callCount(), 0);
});

test("reset-password/updatePassword: updateUser error → captures and returns error", async () => {
  resetMocks();
  updateUserMock.mock.mockImplementation(
    async () =>
      ({ error: { message: "Session expired" } }) as never,
  );

  const result = await resetUpdatePassword(
    undefined,
    formData({ password: "newpass123", confirm_password: "newpass123" }),
  );

  assert.deepStrictEqual(result, { error: "Session expired" });
  assert.equal(captureMock.mock.callCount(), 1);
  assert.deepEqual(captureMock.mock.calls[0].arguments[1], {
    context: "updatePassword: reset password",
  });
});

test("reset-password/updatePassword: updates password successfully → redirects to /", async () => {
  resetMocks();
  updateUserMock.mock.mockImplementation(
    async () => ({ error: null }) as never,
  );

  await assert.rejects(
    () =>
      resetUpdatePassword(
        undefined,
        formData({ password: "newpass123", confirm_password: "newpass123" }),
      ),
    (err: Error) => {
      assert.equal(err.message, "REDIRECT");
      return true;
    },
  );

  assert.equal(redirectMock.mock.callCount(), 1);
  assert.equal(redirectMock.mock.calls[0].arguments[0], "/");
  assert.equal(updateUserMock.mock.callCount(), 1);
  assert.deepEqual(updateUserMock.mock.calls[0].arguments[0], {
    password: "newpass123",
  });
});

test("reset-password/updatePassword: handles short password validation", async () => {
  resetMocks();
  validatePasswordUpdateInputMock.mock.mockImplementation(
    () => "Нууц үг хамгийн багадаа 8 тэмдэгттэй байна.",
  );

  const result = await resetUpdatePassword(
    undefined,
    formData({ password: "short", confirm_password: "short" }),
  );

  assert.deepStrictEqual(result, {
    error: "Нууц үг хамгийн багадаа 8 тэмдэгттэй байна.",
  });
  assert.equal(updateUserMock.mock.callCount(), 0);
});

// ═══════════════════════════════════════════════════════════════════════
// src/app/update-password — updatePassword
// ═══════════════════════════════════════════════════════════════════════

test("update-password: rejects non-string password", async () => {
  resetMocks();

  const result = await settingsUpdatePassword(
    undefined,
    formData({ password: null }),
  );

  assert.deepStrictEqual(result, { error: "Нууц үг шаардлагатай." });
  assert.equal(updateUserMock.mock.callCount(), 0);
});

test("update-password: rejects password shorter than 8 chars", async () => {
  resetMocks();

  const result = await settingsUpdatePassword(
    undefined,
    formData({ password: "short" }),
  );

  assert.deepStrictEqual(result, {
    error: "Нууц үг хамгийн багадаа 8 тэмдэгттэй байна.",
  });
  assert.equal(updateUserMock.mock.callCount(), 0);
});

test("update-password: updateUser error → returns error message", async () => {
  resetMocks();
  updateUserMock.mock.mockImplementation(
    async () =>
      ({ error: { message: "Not authenticated" } }) as never,
  );

  const result = await settingsUpdatePassword(
    undefined,
    formData({ password: "longpassword" }),
  );

  assert.deepStrictEqual(result, {
    error: "Нууц үг солиход алдаа гарлаа: Not authenticated",
  });
  assert.equal(captureMock.mock.callCount(), 1);
});

test("update-password: updates successfully → returns { success: true }", async () => {
  resetMocks();
  updateUserMock.mock.mockImplementation(
    async () => ({ error: null }) as never,
  );

  const result = await settingsUpdatePassword(
    undefined,
    formData({ password: "longpassword" }),
  );

  assert.deepStrictEqual(result, { success: true });
  assert.equal(updateUserMock.mock.callCount(), 1);
  assert.deepEqual(updateUserMock.mock.calls[0].arguments[0], {
    password: "longpassword",
  });
  assert.equal(redirectMock.mock.callCount(), 0);
});
