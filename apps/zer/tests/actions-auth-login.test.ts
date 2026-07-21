/**
 * Tests for `(auth)/login/actions.ts` — login server action.
 *
 * Key differences from typical action tests:
 * - Uses createClient() from @/lib/supabase/server (not requireActionContext)
 * - Uses supabase.auth.signInWithPassword({email, password})
 * - Uses validateLoginInput from @/lib/domain-rules
 * - Uses rateLimit from @zuiio/core
 * - Uses getString / sanitizeRedirectPath from @/lib/validation
 * - Calls redirect() from next/navigation on success
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { formData, mockMod } from "./actions-helpers";

// ─── Global mocks ─────────────────────────────────────────────────────

const captureMock = mock.fn(() => {});
mockMod("@zuiio/capture", { capture: captureMock });
mockMod("next/cache", {
  revalidatePath: mock.fn(() => {}),
  revalidateTag: mock.fn(() => {}),
});
mockMod("next/server", { after: (fn: () => void) => fn() });
mockMod("server-only", {});

const redirectMock = mock.fn(() => {
  throw new Error("REDIRECT");
});
mockMod("next/navigation", { redirect: redirectMock });

// ─── Validation mocks ─────────────────────────────────────────────────

const validateLoginInputMock = mock.fn(() => null);
mockMod("@/lib/domain-rules", { validateLoginInput: validateLoginInputMock });

const getStringMock = mock.fn((_fd: FormData, key: string) => {
  if (key === "email") return "test@example.com";
  if (key === "password") return "password123";
  if (key === "next") return "/dashboard";
  return "";
});
const sanitizeRedirectPathMock = mock.fn((path: string) => path || "/");
mockMod("@/lib/validation", {
  getString: getStringMock,
  sanitizeRedirectPath: sanitizeRedirectPathMock,
});

// ─── Rate limit mock ──────────────────────────────────────────────────

const rateLimitMock = mock.fn(() => ({ error: null }));
mockMod("@zuiio/core", { rateLimit: rateLimitMock });

// ─── Supabase auth mock ───────────────────────────────────────────────

let signInWithPasswordMock = mock.fn(async () => ({ error: null }));
const createClientMock = mock.fn(async () => ({
  auth: { signInWithPassword: signInWithPasswordMock },
}));
mockMod("@/lib/supabase/server", { createClient: createClientMock });

// ─── Lazy-loaded action ───────────────────────────────────────────────

let login: (
  prevState: { error?: string } | undefined,
  fd: FormData,
) => Promise<unknown>;

test.before(async () => {
  const mod = await import("@/app/(auth)/login/actions");
  login = mod.login;
});

// ─── Reset helpers ────────────────────────────────────────────────────

function resetMocks() {
  captureMock.mock.resetCalls();
  redirectMock.mock.resetCalls();
  validateLoginInputMock.mock.resetCalls();
  validateLoginInputMock.mock.mockImplementation(() => null);
  getStringMock.mock.resetCalls();
  getStringMock.mock.mockImplementation((_fd: FormData, key: string) => {
    if (key === "email") return "test@example.com";
    if (key === "password") return "password123";
    if (key === "next") return "/dashboard";
    return "";
  });
  sanitizeRedirectPathMock.mock.resetCalls();
  sanitizeRedirectPathMock.mock.mockImplementation(
    (path: string) => path || "/",
  );
  rateLimitMock.mock.resetCalls();
  rateLimitMock.mock.mockImplementation(() => ({ error: null }));
  signInWithPasswordMock.mock.resetCalls();
  signInWithPasswordMock.mock.mockImplementation(async () => ({ error: null }));
  createClientMock.mock.resetCalls();
}

// ─── Helper to build standard login FormData ──────────────────────────

function loginFd(
  overrides?: Partial<{ email: string; password: string; next: string }>,
): FormData {
  return formData({
    email: overrides?.email ?? "test@example.com",
    password: overrides?.password ?? "password123",
    next: overrides?.next ?? "/dashboard",
  });
}

// ═══════════════════════════════════════════════════════════════════════
// Test cases
// ═══════════════════════════════════════════════════════════════════════

test("login: rejects validation error", async () => {
  resetMocks();
  validateLoginInputMock.mock.mockImplementation(() => "Email is required");

  const result = await login(undefined, loginFd());

  assert.deepStrictEqual(result, { error: "Email is required" });
  assert.equal(rateLimitMock.mock.callCount(), 0, "should not reach rateLimit");
  assert.equal(
    signInWithPasswordMock.mock.callCount(),
    0,
    "should not reach signInWithPassword",
  );
});

test("login: rejects rate limited", async () => {
  resetMocks();
  rateLimitMock.mock.mockImplementation(() => ({
    error: "Too many login attempts. Try again later.",
  }));

  const result = await login(undefined, loginFd());

  assert.deepStrictEqual(result, {
    error: "Too many login attempts. Try again later.",
  });
  assert.equal(
    signInWithPasswordMock.mock.callCount(),
    0,
    "should not reach signInWithPassword",
  );
});

test("login: rejects invalid credentials", async () => {
  resetMocks();
  signInWithPasswordMock.mock.mockImplementation(async () => ({
    error: { message: "Invalid login credentials" },
  }));

  const result = await login(undefined, loginFd());

  assert.deepStrictEqual(result, { error: "Invalid login credentials" });
});

test("login: calls capture on auth error", async () => {
  resetMocks();
  const authError = { message: "Invalid login credentials" };
  signInWithPasswordMock.mock.mockImplementation(async () => ({
    error: authError,
  }));

  await login(undefined, loginFd());

  assert.equal(captureMock.mock.callCount(), 1);
  const [err, ctx] = captureMock.mock.calls[0].arguments;
  assert.deepStrictEqual(err, authError);
  assert.deepStrictEqual(ctx, { context: "login: sign in" });
});

test("login: logs in successfully and redirects", async () => {
  resetMocks();
  const fd = loginFd({ next: "/dashboard" });

  await assert.rejects(() => login(undefined, fd), (err: Error) => {
    assert.equal(err.message, "REDIRECT");
    return true;
  });

  assert.equal(redirectMock.mock.callCount(), 1);
  assert.equal(redirectMock.mock.calls[0].arguments[0], "/dashboard");
});

test("login: redirects to / when no next param", async () => {
  resetMocks();
  getStringMock.mock.mockImplementation((_fd: FormData, key: string) => {
    if (key === "email") return "test@example.com";
    if (key === "password") return "password123";
    if (key === "next") return "";
    return "";
  });

  const fd = loginFd({ next: "" });

  await assert.rejects(() => login(undefined, fd), (err: Error) => {
    assert.equal(err.message, "REDIRECT");
    return true;
  });

  assert.equal(redirectMock.mock.callCount(), 1);
  assert.equal(redirectMock.mock.calls[0].arguments[0], "/");
});

test("login: sanitizes redirect path", async () => {
  resetMocks();
  sanitizeRedirectPathMock.mock.mockImplementation(() => "/safe-path");
  // getStringMock must return the path we want to test sanitization on
  getStringMock.mock.mockImplementation((_fd: FormData, key: string) => {
    if (key === "email") return "test@example.com";
    if (key === "password") return "password123";
    if (key === "next") return "/evil/path";
    return "";
  });

  const fd = loginFd({ next: "/evil/path" });

  await assert.rejects(() => login(undefined, fd), (err: Error) => {
    assert.equal(err.message, "REDIRECT");
    return true;
  });

  assert.equal(redirectMock.mock.callCount(), 1);
  assert.equal(redirectMock.mock.calls[0].arguments[0], "/safe-path");
  assert.equal(sanitizeRedirectPathMock.mock.callCount(), 1);
  assert.equal(
    sanitizeRedirectPathMock.mock.calls[0].arguments[0],
    "/evil/path",
  );
});

test("login: passes email and password to validateLoginInput", async () => {
  resetMocks();
  // Override getString to return specific values
  getStringMock.mock.mockImplementation((_fd: FormData, key: string) => {
    if (key === "email") return "user@test.com";
    if (key === "password") return "secret123";
    if (key === "next") return "/dashboard";
    return "";
  });

  const fd = loginFd({ email: "user@test.com", password: "secret123" });

  // login calls redirect() on success — catch it
  await assert.rejects(() => login(undefined, fd), { message: "REDIRECT" });

  assert.equal(validateLoginInputMock.mock.callCount(), 1);
  const [input] = validateLoginInputMock.mock.calls[0].arguments;
  assert.deepStrictEqual(input, {
    email: "user@test.com",
    password: "secret123",
  });
});

test("login: passes email and password to signInWithPassword", async () => {
  resetMocks();
  getStringMock.mock.mockImplementation((_fd: FormData, key: string) => {
    if (key === "email") return "user@test.com";
    if (key === "password") return "secret123";
    if (key === "next") return "/dashboard";
    return "";
  });

  const fd = loginFd({ email: "user@test.com", password: "secret123" });

  await assert.rejects(() => login(undefined, fd), { message: "REDIRECT" });

  assert.equal(signInWithPasswordMock.mock.callCount(), 1);
  const [creds] = signInWithPasswordMock.mock.calls[0].arguments;
  assert.deepStrictEqual(creds, {
    email: "user@test.com",
    password: "secret123",
  });
});

test("login: calls rateLimit with correct key", async () => {
  resetMocks();
  getStringMock.mock.mockImplementation((_fd: FormData, key: string) => {
    if (key === "email") return "rl@test.com";
    if (key === "password") return "password123";
    if (key === "next") return "/dashboard";
    return "";
  });

  const fd = loginFd({ email: "rl@test.com" });

  await assert.rejects(() => login(undefined, fd), { message: "REDIRECT" });

  assert.equal(rateLimitMock.mock.callCount(), 1);
  const [key, max, window] = rateLimitMock.mock.calls[0].arguments;
  assert.equal(key, "login:rl@test.com");
  assert.equal(max, 5);
  assert.equal(window, 60_000);
});

test("login: creates supabase client", async () => {
  resetMocks();

  await assert.rejects(() => login(undefined, loginFd()), {
    message: "REDIRECT",
  });

  assert.equal(createClientMock.mock.callCount(), 1);
});
