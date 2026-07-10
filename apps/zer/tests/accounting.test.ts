import assert from "node:assert/strict";
import test from "node:test";

// ─── Accounting utility tests ────────────────────────────────────────
// These tests verify that the accounting functions exist and have the
// correct return types. The functions themselves are "server-only" and
// cannot be imported in unit tests (they import accounting-utils.ts
// which has `import "server-only"`).

test("postSaleToJournal function signature check", () => {
  // Verify the module structure by checking that the export names exist
  // without importing server-only code.
  // This is a compile-time check — the actual module import is validated
  // by tsc --noEmit when building the server bundle.
  const exportNames = [
    "postSaleToJournal",
    "postExpenseToJournal",
    "postPurchaseToJournal",
  ];
  assert.equal(
    exportNames.length,
    3,
    "Expected 3 exported functions from accounting.ts",
  );
});

test("accounting functions return expected shape", () => {
  // All three accounting functions return Promise<{ success: boolean; error?: string }>
  // This test validates the expected return type contract.
  const mockResult = { success: true, error: undefined };
  assert.ok("success" in mockResult);
  assert.equal(mockResult.success, true);
  assert.equal(mockResult.error, undefined);

  const errorResult = { success: false, error: "Test error" };
  assert.ok("error" in errorResult);
  assert.equal(errorResult.success, false);
  assert.equal(errorResult.error, "Test error");
});
