import assert from "node:assert/strict";
import test from "node:test";
import { canAccessBranch, enforceBranchAccess } from "@/lib/branches";

test("canAccessBranch returns true when user is org-wide (branchId is null)", () => {
  assert.equal(canAccessBranch(null, "some-branch-uuid"), true);
  assert.equal(canAccessBranch(null, null), true);
});

test("canAccessBranch returns true when user's branch matches target branch", () => {
  assert.equal(canAccessBranch("branch-1", "branch-1"), true);
});

test("canAccessBranch returns false when user's branch differs from target branch", () => {
  assert.equal(canAccessBranch("branch-1", "branch-2"), false);
});

test("canAccessBranch returns false when user is scoped but target is null", () => {
  assert.equal(canAccessBranch("branch-1", null), false);
});

test("enforceBranchAccess returns the record when user is org-wide and record exists", () => {
  const record = { id: "1", branch_id: "branch-a" };
  const result = enforceBranchAccess(record, null, false);
  assert.deepEqual(result, record);
});

test("enforceBranchAccess returns the record when user is scoped and branch matches", () => {
  const record = { id: "1", branch_id: "branch-a" };
  const result = enforceBranchAccess(record, "branch-a", true);
  assert.deepEqual(result, record);
});

test("enforceBranchAccess returns record when user is not scoped", () => {
  const record = { id: "1", branch_id: null };
  const result = enforceBranchAccess(record, null, false);
  assert.deepEqual(result, record);
});

test("enforceBranchAccess redirects when record is null", () => {
  assert.throws(() => enforceBranchAccess(null, null, true), /NEXT_REDIRECT/);
});

test("enforceBranchAccess redirects when scoped user's branch doesn't match record", () => {
  const record = { id: "1", branch_id: "branch-b" };
  assert.throws(
    () => enforceBranchAccess(record, "branch-a", true),
    /NEXT_REDIRECT/,
  );
});

test("enforceBranchAccess redirects when scoped user and record has no branch_id", () => {
  const record = { id: "1", branch_id: null };
  assert.throws(
    () => enforceBranchAccess(record, "branch-a", true),
    /NEXT_REDIRECT/,
  );
});
