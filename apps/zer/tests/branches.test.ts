/**
 * Tests for src/lib/branches.ts — branch filtering utilities.
 */
import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { mockMod } from "./actions-helpers";

mockMod("next/navigation", {
  redirect: mock.fn(() => { throw new Error("NEXT_REDIRECT"); }),
});

let getEffectiveBranchId: (...args: unknown[]) => string | null;
let enforceBranchAccess: (...args: unknown[]) => unknown;
let canAccessBranch: (...args: unknown[]) => boolean;

test.before(async () => {
  const mod = await import("@/lib/branches");
  getEffectiveBranchId = mod.getEffectiveBranchId;
  enforceBranchAccess = mod.enforceBranchAccess;
  canAccessBranch = mod.canAccessBranch;
});

// ─── getEffectiveBranchId ─────────────────────────────────────────────
test("getEffectiveBranchId: org-wide user without selection returns null", () => {
  assert.equal(getEffectiveBranchId("branch-1", false, null), null);
});
test("getEffectiveBranchId: org-wide user with selection uses selectedBranchId", () => {
  assert.equal(getEffectiveBranchId("branch-1", false, "branch-2"), "branch-2");
});
test("getEffectiveBranchId: org-wide user with null context and null selection returns null", () => {
  assert.equal(getEffectiveBranchId(null, false, null), null);
});
test("getEffectiveBranchId: scoped user uses contextBranchId regardless of selection", () => {
  assert.equal(getEffectiveBranchId("assigned-branch", true, "selected-branch"), "assigned-branch");
});
test("getEffectiveBranchId: scoped user with null context returns null", () => {
  assert.equal(getEffectiveBranchId(null, true, "selected-branch"), null);
});

// ─── enforceBranchAccess ──────────────────────────────────────────────
test("enforceBranchAccess: allows access when record branch matches context", () => {
  const record = { id: "rec-1", branch_id: "branch-1" };
  assert.equal(enforceBranchAccess(record, "branch-1", true), record);
});

test("enforceBranchAccess: redirects when record branch does not match context", () => {
  assert.throws(
    () => enforceBranchAccess({ id: "rec-1", branch_id: "branch-2" }, "branch-1", true),
    /NEXT_REDIRECT/,
  );
});

test("enforceBranchAccess: allows access when not branch scoped", () => {
  const record = { id: "rec-1", branch_id: "branch-2" };
  assert.equal(enforceBranchAccess(record, "branch-1", false), record);
});

test("enforceBranchAccess: redirects when record is null", () => {
  assert.throws(
    () => enforceBranchAccess(null, "branch-1", true),
    /NEXT_REDIRECT/,
  );
});

test("enforceBranchAccess: allows access when context branch is null", () => {
  const record = { id: "rec-1", branch_id: null };
  assert.equal(enforceBranchAccess(record, null, true), record);
});

test("enforceBranchAccess: redirects when record has no branch_id", () => {
  assert.throws(
    () => enforceBranchAccess({ id: "rec-1" }, "branch-1", true),
    /NEXT_REDIRECT/,
  );
});

// ─── canAccessBranch ──────────────────────────────────────────────────
test("canAccessBranch: org-wide user (null) can access any branch", () => {
  assert.equal(canAccessBranch(null, "branch-1"), true);
});
test("canAccessBranch: org-wide user can access null branch", () => {
  assert.equal(canAccessBranch(null, null), true);
});
test("canAccessBranch: scoped user can access their assigned branch", () => {
  assert.equal(canAccessBranch("branch-1", "branch-1"), true);
});
test("canAccessBranch: scoped user cannot access different branch", () => {
  assert.equal(canAccessBranch("branch-1", "branch-2"), false);
});
test("canAccessBranch: scoped user cannot access null (org-wide data)", () => {
  assert.equal(canAccessBranch("branch-1", null), false);
});
