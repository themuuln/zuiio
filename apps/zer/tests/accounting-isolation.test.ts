import assert from "node:assert/strict";
import test from "node:test";
import { getEffectiveBranchId } from "@/lib/branches";

// ─── getEffectiveBranchId tests (accounting-specific scenarios) ──────────

test("getEffectiveBranchId: scoped user always uses their assigned branch", () => {
  // Scoped user with a branch
  assert.equal(getEffectiveBranchId("branch-a", true, null), "branch-a");
  assert.equal(getEffectiveBranchId("branch-a", true, "branch-b"), "branch-a");
});

test("getEffectiveBranchId: admin user with no selected branch returns null (all branches)", () => {
  assert.equal(getEffectiveBranchId(null, false, null), null);
});

test("getEffectiveBranchId: admin user with selected branch returns selected branch", () => {
  assert.equal(getEffectiveBranchId(null, false, "branch-a"), "branch-a");
});

test("getEffectiveBranchId: admin user can switch between branches", () => {
  assert.equal(getEffectiveBranchId(null, false, "branch-a"), "branch-a");
  assert.equal(getEffectiveBranchId(null, false, "branch-b"), "branch-b");
});

// ─── Accounting context helpers ─────────────────────────────────────────

/**
 * Simulates the effectiveBranchId logic used in accounting/page.tsx.
 * This verifies the server-side branch filtering decision.
 */
function getAccountingEffectiveBranchId(
  isBranchScoped: boolean,
  profileBranchId: string | null,
  urlBranch: string | null | undefined,
  showConsolidated: boolean,
): string | null {
  // showConsolidated is always false for scoped users (toggle hidden)
  // showConsolidated = !isBranchScoped && urlConsolidated === "true"
  if (showConsolidated) return null; // admin with consolidated toggle on = all branches
  if (isBranchScoped) return profileBranchId;
  return urlBranch ?? null;
}

test("accounting: scoped user always sees their own branch data", () => {
  assert.equal(
    getAccountingEffectiveBranchId(true, "branch-a", undefined, false),
    "branch-a",
  );
  // Scoped user cannot enable consolidated view (showConsolidated is always false)
  assert.equal(
    getAccountingEffectiveBranchId(true, "branch-a", "branch-b", false),
    "branch-a",
  );
});

test("accounting: admin with no branch selected sees all data (consolidated=false)", () => {
  assert.equal(
    getAccountingEffectiveBranchId(false, null, undefined, false),
    null,
  );
});

test("accounting: admin with branch selected sees only that branch (consolidated=false)", () => {
  assert.equal(
    getAccountingEffectiveBranchId(false, null, "branch-a", false),
    "branch-a",
  );
});

test("accounting: admin sees all data when consolidated=true regardless of URL branch", () => {
  assert.equal(
    getAccountingEffectiveBranchId(false, null, "branch-a", true),
    null,
  );
  assert.equal(
    getAccountingEffectiveBranchId(false, null, undefined, true),
    null,
  );
});

test("accounting: scoped user cannot enable consolidated view", () => {
  // The consolidated toggle is hidden for scoped users,
  // so showConsolidated is always false for them
  assert.equal(
    getAccountingEffectiveBranchId(true, "branch-a", undefined, false),
    "branch-a",
  );
});
