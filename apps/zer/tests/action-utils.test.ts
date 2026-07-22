import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { mockMod, resolved } from "./actions-helpers";

// ─── Mock setup ───────────────────────────────────────────────────────

let branchSingleMock: () => Promise<any>;
let mockRequireAppContext: Record<string, unknown>;

function makeSupabase() {
  branchSingleMock = mock.fn(async () => resolved(null));
  return {
    from: mock.fn((_table: string) => ({
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          order: mock.fn(() => ({
            limit: mock.fn(() => ({
              single: mock.fn(async () => branchSingleMock()),
            })),
          })),
        })),
      })),
    })),
  };
}

function resetMocks() {
  const supabase = makeSupabase();
  mockRequireAppContext = {
    supabase,
    organizationId: "org-123",
    userId: "user-456",
    roleId: "role-789",
    permissions: ["sales.create"],
    branchId: null,
    isBranchScoped: false,
    user: { id: "user-456", email: "test@example.com" },
  };
}

mockMod("server-only", {});

mockMod("@/lib/erp", {
  requireAppContext: mock.fn(async () => mockRequireAppContext),
  checkPermission: mock.fn((permissions: string[], required: string) =>
    (permissions ?? []).includes(required) ? null : "Танд эрх байхгүй байна.",
  ),
});

const withDbCaptureFn = mock.fn(async (_name: string, query: Promise<any>) => {
  const result = await query;
  return result;
});

mockMod("@zuiio/capture", {
  capture: mock.fn(() => {}),
  withDbCapture: withDbCaptureFn,
});

// ─── Lazy import ──────────────────────────────────────────────────────

let actionUtils: typeof import("@/lib/action-utils");

test.before(async () => {
  actionUtils = await import("@/lib/action-utils");
});

test.beforeEach(() => {
  resetMocks();
  withDbCaptureFn.mock.resetCalls();
});

// ─── requireActionContext ─────────────────────────────────────────────

test("requireActionContext returns full context when permission granted", async () => {
  const result = await actionUtils.requireActionContext("sales.create" as any);

  assert.ok(!("error" in result), "should not have error");
  assert.equal((result as any).organizationId, "org-123");
  assert.equal((result as any).userId, "user-456");
  assert.deepEqual((result as any).permissions, ["sales.create"]);
});

test("requireActionContext returns error when permission denied", async () => {
  // Set permissions that do NOT include "products.delete"
  (mockRequireAppContext as any).permissions = ["sales.create"];

  const result = await actionUtils.requireActionContext("products.delete" as any);

  assert.ok("error" in result);
  assert.equal((result as any).error, "Танд эрх байхгүй байна.");
});

// ─── requireBranchScope ───────────────────────────────────────────────

test("requireBranchScope returns null when not branch scoped", () => {
  const ctx = { isBranchScoped: false, branchId: null } as any;
  assert.equal(actionUtils.requireBranchScope(ctx), null);
});

test("requireBranchScope returns null when branch scoped with branchId", () => {
  const ctx = { isBranchScoped: true, branchId: "branch-1" } as any;
  assert.equal(actionUtils.requireBranchScope(ctx), null);
});

test("requireBranchScope returns error when branch scoped without branchId", () => {
  const ctx = { isBranchScoped: true, branchId: null } as any;
  const result = actionUtils.requireBranchScope(ctx);

  assert.ok(result !== null);
  assert.equal(result!.error, "Салбар тодорхойгүй байна.");
});

// ─── requireWriteAction ───────────────────────────────────────────────

test("requireWriteAction returns error immediately when permission denied", async () => {
  (mockRequireAppContext as any).permissions = [];

  const result = await actionUtils.requireWriteAction("sales.create" as any);

  assert.ok("error" in result);
  assert.equal((result as any).error, "Танд эрх байхгүй байна.");
});

test("requireWriteAction uses existing branchId when branch scoped with branchId", async () => {
  (mockRequireAppContext as any).isBranchScoped = true;
  (mockRequireAppContext as any).branchId = "existing-branch";

  const result = await actionUtils.requireWriteAction("sales.create" as any);

  assert.ok(!("error" in result), "should not have error");
  assert.equal((result as any).branchId, "existing-branch");
  // Should NOT have queried branches table
  assert.equal(withDbCaptureFn.mock.callCount(), 0);
});

test("requireWriteAction resolves branch when not branch scoped and no branchId", async () => {
  // branchSingleMock defaults to resolved(null), override for this test
  branchSingleMock = mock.fn(async () => resolved({ id: "resolved-branch" }));

  const result = await actionUtils.requireWriteAction("sales.create" as any);

  assert.ok(!("error" in result), "should not have error");
  assert.equal((result as any).branchId, "resolved-branch");
  assert.equal(withDbCaptureFn.mock.callCount(), 1);
});

test("requireWriteAction returns error when no branch exists for non-scoped user", async () => {
  // branchSingleMock returns null data — no branch found
  branchSingleMock = mock.fn(async () => resolved(null));

  const result = await actionUtils.requireWriteAction("sales.create" as any);

  assert.ok("error" in result);
  assert.equal((result as any).error, "Салбар тодорхойгүй байна.");
});
