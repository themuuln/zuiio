import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { mockMod } from "./actions-helpers";

const captureMock = mock.fn(() => {});
mockMod("@zuiio/capture", { capture: captureMock });
mockMod("next/cache", { revalidatePath: mock.fn(() => {}), revalidateTag: mock.fn(() => {}) });
mockMod("next/server", { after: (fn) => fn() });
mockMod("server-only", {});
const redirectMock = mock.fn(() => { throw new Error("REDIRECT"); });
mockMod("next/navigation", { redirect: redirectMock });

const signOutMock = mock.fn(async () => {});
mockMod("@/lib/supabase/server", {
  createClient: mock.fn(async () => ({
    auth: { signOut: signOutMock },
  })),
});

let logout;
test.before(async () => {
  const mod = await import("@/app/(dashboard)/actions");
  logout = mod.logout;
});

test.beforeEach(() => {
  signOutMock.mock.resetCalls();
  captureMock.mock.resetCalls();
  redirectMock.mock.resetCalls();
});

test("logout calls signOut and redirects to /login", async () => {
  await assert.rejects(() => logout(), /REDIRECT/);
  assert.equal(signOutMock.mock.callCount(), 1);
  assert.equal(redirectMock.mock.callCount(), 1);
  assert.equal(redirectMock.mock.calls[0].arguments[0], "/login");
});

test("logout works without exceptions from signOut", async () => {
  signOutMock.mock.mockImplementation(async () => {});
  await assert.rejects(() => logout(), /REDIRECT/);
  assert.equal(signOutMock.mock.callCount(), 1);
});

test("logout calls signOut exactly once", async () => {
  try { await logout(); } catch {}
  assert.equal(signOutMock.mock.callCount(), 1);
});
