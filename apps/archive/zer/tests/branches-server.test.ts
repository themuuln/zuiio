/**
 * Tests for src/lib/branches-server.ts — getUserBranches, getAccessibleBranches.
 */
import assert from "node:assert/strict";
import test, { mock } from "node:test";

mock.module("server-only", { exports: {} });
const captureSpy = mock.fn();
mock.module("@zuiio/capture", { exports: { capture: captureSpy } });
mock.module("next/navigation", { exports: { redirect: mock.fn() } });

// The supabase mock will be set per-test
let mockSupabase: Record<string, unknown> = {};
mock.module("@/lib/supabase/server", {
  exports: { createClient: mock.fn(async () => mockSupabase) },
});

let profileResult = { data: null, error: null };
let branchQueryResult = { data: [], error: null };

function makeSupabase() {
  return {
    from: mock.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: mock.fn(() => ({
            eq: mock.fn(() => ({
              single: mock.fn(async () => profileResult),
            })),
          })),
        };
      }
      if (table === "branches") {
        return {
          select: mock.fn(() => ({
            eq: mock.fn(() => ({
              order: mock.fn(async () => branchQueryResult),
            })),
          })),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

let getUserBranches: (userId: string) => Promise<unknown[]>;
let _getAccessibleBranches: (
  orgId: string,
  userId: string,
) => Promise<unknown[]>;

test.before(async () => {
  const mod = await import("@/lib/branches-server");
  getUserBranches = mod.getUserBranches;
  _getAccessibleBranches = mod.getAccessibleBranches;
});

test.beforeEach(() => {
  captureSpy.mock.resetCalls();
  mockSupabase = makeSupabase() as unknown as Record<string, unknown>;
  profileResult = {
    data: { organization_id: "org-123", branch_id: null },
    error: null,
  };
  branchQueryResult = {
    data: [
      {
        id: "b1",
        name: "Салбар 1",
        slug: "salbar-1",
        address: null,
        phone: null,
        email: null,
        is_default: true,
      },
      {
        id: "b2",
        name: "Салбар 2",
        slug: "salbar-2",
        address: null,
        phone: null,
        email: null,
        is_default: false,
      },
    ],
    error: null,
  };
});

test("getUserBranches returns branches for org-wide user", async () => {
  const branches = await getUserBranches("user-1");
  assert.equal(branches.length, 2);
});

test("getUserBranches returns empty array on profile error", async () => {
  profileResult = { data: null, error: new Error("Profile not found") };
  const branches = await getUserBranches("user-1");
  assert.equal(branches.length, 0);
});

test("getUserBranches returns empty array when no org", async () => {
  profileResult = {
    data: { organization_id: null as unknown as string, branch_id: null },
    error: null,
  };
  const branches = await getUserBranches("user-1");
  assert.equal(branches.length, 0);
});

test("getUserBranches captures branch query error", async () => {
  branchQueryResult = { data: [], error: new Error("Query error") };
  const branches = await getUserBranches("user-1");
  assert.equal(branches.length, 0);
  assert.equal(captureSpy.mock.calls.length, 1);
});
