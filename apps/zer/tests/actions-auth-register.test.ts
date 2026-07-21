/**
 * Tests for `(auth)/register/actions.ts` (register) and
 * `(auth)/forgot-password/actions.ts` (requestPasswordReset).
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

const validateRegistrationInputMock = mock.fn(() => null);
const validatePasswordResetRequestInputMock = mock.fn(() => null);
mockMod("@/lib/domain-rules", {
  validateRegistrationInput: validateRegistrationInputMock,
  validatePasswordResetRequestInput: validatePasswordResetRequestInputMock,
});

const getStringMock = mock.fn((_fd: FormData, key: string) => {
  if (key === "email") return "test@example.com";
  if (key === "password") return "password123";
  if (key === "full_name") return "Test User";
  return "";
});
mockMod("@/lib/validation", { getString: getStringMock });

const rateLimitMock = mock.fn(() => ({ error: null }));
mockMod("@zuiio/core", { rateLimit: rateLimitMock });

mockMod("@/lib/supabase/env", {
  getSupabaseEnv: mock.fn(() => ({ url: "https://example.com" })),
});

const signUpMock = mock.fn(
  async () =>
    ({ data: { user: {}, session: null }, error: null }) as never,
);
const resetPasswordMock = mock.fn(
  async () => ({ error: null }) as never,
);
mockMod("@/lib/supabase/server", {
  createClient: mock.fn(async () => ({
    auth: {
      signUp: signUpMock,
      resetPasswordForEmail: resetPasswordMock,
    },
  })),
});

// ─── Lazy-loaded actions ─────────────────────────────────────────────

let register: (
  prevState: unknown,
  fd: FormData,
) => Promise<unknown>;
let requestPasswordReset: (
  prevState: unknown,
  fd: FormData,
) => Promise<unknown>;

test.before(async () => {
  const registerMod = await import(
    "@/app/(auth)/register/actions"
  );
  register = registerMod.register;

  const forgotMod = await import(
    "@/app/(auth)/forgot-password/actions"
  );
  requestPasswordReset = forgotMod.requestPasswordReset;
});

// ─── Reset helpers ───────────────────────────────────────────────────

function resetMocks() {
  captureMock.mock.resetCalls();
  redirectMock.mock.resetCalls();
  validateRegistrationInputMock.mock.resetCalls();
  validateRegistrationInputMock.mock.mockImplementation(() => null);
  validatePasswordResetRequestInputMock.mock.resetCalls();
  validatePasswordResetRequestInputMock.mock.mockImplementation(() => null);
  rateLimitMock.mock.resetCalls();
  rateLimitMock.mock.mockImplementation(() => ({ error: null }));
  getStringMock.mock.resetCalls();
  getStringMock.mock.mockImplementation((_fd: FormData, key: string) => {
    if (key === "email") return "test@example.com";
    if (key === "password") return "password123";
    if (key === "full_name") return "Test User";
    return "";
  });
  signUpMock.mock.resetCalls();
  signUpMock.mock.mockImplementation(
    async () =>
      ({ data: { user: {}, session: null }, error: null }) as never,
  );
  resetPasswordMock.mock.resetCalls();
  resetPasswordMock.mock.mockImplementation(
    async () => ({ error: null }) as never,
  );
}

// ═══════════════════════════════════════════════════════════════════════
// register
// ═══════════════════════════════════════════════════════════════════════

test("register: validation error → returns error", async () => {
  resetMocks();
  validateRegistrationInputMock.mock.mockImplementation(
    () => "Бүртгэлийн мэдээлэл буруу байна.",
  );

  const result = await register(undefined, formData({}));

  assert.deepStrictEqual(result, {
    error: "Бүртгэлийн мэдээлэл буруу байна.",
  });
  assert.equal(signUpMock.mock.callCount(), 0);
});

test("register: rate limited → returns error", async () => {
  resetMocks();
  rateLimitMock.mock.mockImplementation(() => ({
    error: "Too many requests",
  }));

  const result = await register(undefined, formData({}));

  assert.deepStrictEqual(result, { error: "Too many requests" });
  assert.equal(signUpMock.mock.callCount(), 0);
});

test("register: signUp error → captures and returns error", async () => {
  resetMocks();
  signUpMock.mock.mockImplementation(
    async () =>
      ({
        data: {},
        error: { message: "User already registered" },
      }) as never,
  );

  const result = await register(undefined, formData({}));

  assert.deepStrictEqual(result, { error: "User already registered" });
  assert.equal(captureMock.mock.callCount(), 1);
  assert.deepEqual(captureMock.mock.calls[0].arguments[1], {
    context: "register: sign up",
  });
});

test("register: signUp with session → redirects to /organization/new", async () => {
  resetMocks();
  signUpMock.mock.mockImplementation(
    async () =>
      ({
        data: { user: { id: "u1" }, session: { access_token: "tok" } },
        error: null,
      }) as never,
  );

  await assert.rejects(
    () => register(undefined, formData({})),
    (err: Error) => {
      assert.equal(err.message, "REDIRECT");
      return true;
    },
  );

  assert.equal(redirectMock.mock.callCount(), 1);
  assert.equal(redirectMock.mock.calls[0].arguments[0], "/organization/new");
});

test("register: signUp without session → returns success message", async () => {
  resetMocks();
  signUpMock.mock.mockImplementation(
    async () =>
      ({
        data: { user: { id: "u1" }, session: null },
        error: null,
      }) as never,
  );

  const result = await register(undefined, formData({}));

  assert.deepStrictEqual(result, {
    success:
      "Бүртгэл үүслээ. Имэйлээ шалгаад баталгаажуулсны дараа байгууллагаа үүсгэнэ үү.",
  });
  assert.equal(redirectMock.mock.callCount(), 0);
});

// ═══════════════════════════════════════════════════════════════════════
// requestPasswordReset
// ═══════════════════════════════════════════════════════════════════════

test("requestPasswordReset: validation error → returns error", async () => {
  resetMocks();
  validatePasswordResetRequestInputMock.mock.mockImplementation(
    () => "Имэйл хаяг шаардлагатай.",
  );

  const result = await requestPasswordReset(undefined, formData({}));

  assert.deepStrictEqual(result, { error: "Имэйл хаяг шаардлагатай." });
  assert.equal(resetPasswordMock.mock.callCount(), 0);
});

test("requestPasswordReset: rate limited → returns error", async () => {
  resetMocks();
  rateLimitMock.mock.mockImplementation(() => ({
    error: "Too many requests",
  }));

  const result = await requestPasswordReset(undefined, formData({}));

  assert.deepStrictEqual(result, { error: "Too many requests" });
  assert.equal(resetPasswordMock.mock.callCount(), 0);
});

test("requestPasswordReset: resetPasswordForEmail error → captures and returns error", async () => {
  resetMocks();
  resetPasswordMock.mock.mockImplementation(
    async () => ({ error: { message: "Email not found" } }) as never,
  );

  const result = await requestPasswordReset(undefined, formData({}));

  assert.deepStrictEqual(result, { error: "Email not found" });
  assert.equal(captureMock.mock.callCount(), 1);
  assert.deepEqual(captureMock.mock.calls[0].arguments[1], {
    context: "requestPasswordReset: forgot password",
  });
});

test("requestPasswordReset: sends reset email successfully → returns success", async () => {
  resetMocks();
  resetPasswordMock.mock.mockImplementation(
    async () => ({ error: null }) as never,
  );

  const result = await requestPasswordReset(undefined, formData({}));

  assert.deepStrictEqual(result, {
    success: "Нууц үг сэргээх холбоосыг таны имэйл рүү илгээлээ.",
  });
  assert.equal(resetPasswordMock.mock.callCount(), 1);
});
