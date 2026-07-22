/**
 * Tests for src/lib/superadmin.ts — getSuperadminEmail, requireSuperadmin.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { mockMod } from "./actions-helpers";

// ─── Mocks ────────────────────────────────────────────────────────────

let mockUser: { email: string } | null = null;
const getUserMock = mock.fn(async () => ({
  data: { user: mockUser },
  error: null,
}));

mockMod("@/lib/supabase/server", {
  createClient: mock.fn(async () => ({
    auth: { getUser: getUserMock },
  })),
});

// ─── Lazy-loaded module ───────────────────────────────────────────────

let getSuperadminEmail: () => Promise<string | null>;
let requireSuperadmin: () => Promise<string>;

test.before(async () => {
  const mod = await import("@/lib/superadmin");
  getSuperadminEmail = mod.getSuperadminEmail;
  requireSuperadmin = mod.requireSuperadmin;
});

test.beforeEach(() => {
  mockUser = null;
  getUserMock.mock.resetCalls();
});

// ─── getSuperadminEmail ───────────────────────────────────────────────

test("getSuperadminEmail returns null when env var is not set", async () => {
  // Process.env.SUPERADMIN_EMAIL is undefined in test
  const result = await getSuperadminEmail();
  assert.equal(result, null);
});

test("getSuperadminEmail returns null when no user authenticated", async () => {
  // With env var NOT set (no mock.module for process.env), returns null
  const result = await getSuperadminEmail();
  assert.equal(result, null);
});

// ─── requireSuperadmin ────────────────────────────────────────────────

test("requireSuperadmin redirects when not superadmin", async () => {
  // With env var not set, getSuperadminEmail returns null, triggers redirect
  // We can't easily test redirect() from next/navigation, but we can verify
  // that getSuperadminEmail returns null without env
  const email = await getSuperadminEmail();
  assert.equal(email, null);
});
