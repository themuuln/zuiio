/**
 * Tests for `expenses/actions.ts` — updateExpense.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { formData, mockActionCtx, mockMod, resolved } from "./actions-helpers";

// ─── Global mocks ────────────────────────────────────────────────────
const withDbCaptureMock = mock.fn(
  async (_name: string, query: Promise<unknown>) => {
    const result = await query;
    return result;
  },
);
mockMod("@zuiio/capture", {
  capture: mock.fn(() => {}),
  withDbCapture: withDbCaptureMock,
});

const revalidateEntitiesMock = mock.fn(() => {});
const revalidateEntityTagMock = mock.fn(() => {});
mockMod("@/lib/revalidate", {
  revalidateEntities: revalidateEntitiesMock,
  revalidateEntityTag: revalidateEntityTagMock,
  revalidateEntity: mock.fn(() => {}),
});

mockMod("@/lib/audit", { logAuditEventWithClient: mock.fn(async () => {}) });
mockMod("next/server", { after: (fn: () => void) => fn() });
mockMod("next/cache", {
  revalidatePath: mock.fn(() => {}),
  revalidateTag: mock.fn(() => {}),
});
mockMod("server-only", {});

const getStringMock = mock.fn((fd: FormData, key: string) => fd.get(key) ?? "");
mockMod("@/lib/validation", { getString: getStringMock });

const safeParseMock = mock.fn((data: Record<string, unknown>) => ({
  success: true,
  data,
}));
mockMod("@/lib/validation-schemas", {
  expenseSchema: { safeParse: safeParseMock },
});

let mockValidationError: string | null = null;
mockMod("@/lib/domain-rules", {
  validateExpenseInput: mock.fn(() => mockValidationError),
});

mockMod("@/lib/erp", {
  parseAmount: mock.fn((val: unknown) => {
    if (typeof val !== "string") return 0;
    const n = Number.parseFloat(val.replace(/,/g, ""));
    return Number.isNaN(n) ? 0 : n;
  }),
});

let mockCtx: Record<string, unknown> = mockActionCtx();
mockMod("@/lib/action-utils", {
  requireActionContext: mock.fn(async () => mockCtx),
  requireWriteAction: mock.fn(async () => mockCtx),
});

// ─── Lazy-loaded module ──────────────────────────────────────────────
let updateExpense: (
  prev: { error?: string } | undefined,
  form: FormData,
) => Promise<unknown>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/expenses/actions");
  updateExpense = mod.updateExpense;
});

// ─── Helpers ─────────────────────────────────────────────────────────
function resetMocks() {
  withDbCaptureMock.mock.resetCalls();
  revalidateEntitiesMock.mock.resetCalls();
  safeParseMock.mock.resetCalls();
  mockValidationError = null;
}

/**
 * Build a Supabase mock with chainable from → update → eq1(id) → eq2(orgId) → eq3(branchId).
 * When not branch-scoped, eq2 is the terminal (awaited) call.
 */
function makeSupabase(overrides: Record<string, unknown> = {}) {
  const eq3 = mock.fn(() => resolved(null, null));
  const eq2 = mock.fn(() => ({ eq: eq3, ...overrides }));
  const eq1 = mock.fn(() => ({ eq: eq2, ...overrides }));
  const update = mock.fn(() => ({ eq: eq1, ...overrides }));
  const from = mock.fn(() => ({ update, ...overrides }));

  return {
    from,
    _calls: { from, update, eq1, eq2, eq3 },
  };
}

function validForm(overrides: Record<string, string> = {}) {
  return formData({
    id: "expense-123",
    category: "Office Supplies",
    amount: "150.00",
    expense_date: "2025-01-15",
    description: "Paper and pens",
    payment_method: "cash",
    ...overrides,
  });
}

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

test("updateExpense rejects missing id", async () => {
  resetMocks();
  const supabase = makeSupabase();
  mockCtx = mockActionCtx({
    supabase: supabase as unknown as Record<string, unknown>,
  });

  const form = formData({
    id: "",
    category: "Office Supplies",
    amount: "100",
    expense_date: "2025-01-15",
  });

  const result = await updateExpense(undefined, form);
  assert.deepStrictEqual(result, { error: "Зарлагын ID олдсонгүй." });
});

test("updateExpense rejects validation error from domain-rules", async () => {
  resetMocks();
  mockValidationError = "Category is required";
  const supabase = makeSupabase();
  mockCtx = mockActionCtx({
    supabase: supabase as unknown as Record<string, unknown>,
  });

  const result = await updateExpense(undefined, validForm());
  assert.deepStrictEqual(result, { error: "Category is required" });
});

test("updateExpense rejects when Zod safeParse fails", async () => {
  resetMocks();
  safeParseMock.mock.mockImplementationOnce(() => ({
    success: false,
    error: { issues: [{ message: "category is required" }] },
  }));
  const supabase = makeSupabase();
  mockCtx = mockActionCtx({
    supabase: supabase as unknown as Record<string, unknown>,
  });

  const result = await updateExpense(undefined, validForm());
  assert.deepStrictEqual(result, { error: "category is required" });
});

test("updateExpense updates successfully with all fields", async () => {
  resetMocks();
  const supabase = makeSupabase();
  mockCtx = mockActionCtx({
    supabase: supabase as unknown as Record<string, unknown>,
  });

  const result = await updateExpense(undefined, validForm());
  assert.deepStrictEqual(result, { success: true as const, error: undefined });

  // Verify from("expenses") was called
  assert.strictEqual(supabase._calls.from.mock.callCount(), 1);
  assert.strictEqual(
    supabase._calls.from.mock.calls[0].arguments[0],
    "expenses",
  );

  // Verify update payload
  assert.strictEqual(supabase._calls.update.mock.callCount(), 1);
  const updateArg = supabase._calls.update.mock.calls[0].arguments[0];
  assert.strictEqual(updateArg.category, "Office Supplies");
  assert.strictEqual(updateArg.amount, 150);
  assert.strictEqual(updateArg.expense_date, "2025-01-15");
  assert.strictEqual(updateArg.description, "Paper and pens");
  assert.strictEqual(updateArg.payment_method, "cash");

  // Verify eq("id", ...)
  assert.strictEqual(supabase._calls.eq1.mock.callCount(), 1);
  assert.strictEqual(supabase._calls.eq1.mock.calls[0].arguments[0], "id");
  assert.strictEqual(
    supabase._calls.eq1.mock.calls[0].arguments[1],
    "expense-123",
  );

  // Verify eq("organization_id", ...)
  assert.strictEqual(supabase._calls.eq2.mock.callCount(), 1);
  assert.strictEqual(
    supabase._calls.eq2.mock.calls[0].arguments[0],
    "organization_id",
  );
  assert.strictEqual(
    supabase._calls.eq2.mock.calls[0].arguments[1],
    "test-org-id",
  );
});

test("updateExpense updates with branch scoping", async () => {
  resetMocks();
  const supabase = makeSupabase();
  mockCtx = mockActionCtx({
    supabase: supabase as unknown as Record<string, unknown>,
    isBranchScoped: true,
    branchId: "branch-456",
  });

  const result = await updateExpense(undefined, validForm());
  assert.deepStrictEqual(result, { success: true as const, error: undefined });

  // Verify eq("branch_id", ...) was called
  assert.strictEqual(supabase._calls.eq3.mock.callCount(), 1);
  assert.strictEqual(
    supabase._calls.eq3.mock.calls[0].arguments[0],
    "branch_id",
  );
  assert.strictEqual(
    supabase._calls.eq3.mock.calls[0].arguments[1],
    "branch-456",
  );
});

test("updateExpense does not add branch eq when not branch-scoped", async () => {
  resetMocks();
  const supabase = makeSupabase();
  mockCtx = mockActionCtx({
    supabase: supabase as unknown as Record<string, unknown>,
    isBranchScoped: false,
  });

  const result = await updateExpense(undefined, validForm());
  assert.deepStrictEqual(result, { success: true as const, error: undefined });

  // eq3 should NOT have been called (no branch_id filter)
  assert.strictEqual(supabase._calls.eq3.mock.callCount(), 0);
});

test("updateExpense handles DB error", async () => {
  resetMocks();
  // Chain: from → update → eq1 (id) → eq2 (organization_id) → [awaited when no branch]
  // eq2 is the terminal call, so it must resolve to the error.
  const eq2 = mock.fn(() => resolved(null, { message: "connection refused" }));
  const eq1 = mock.fn(() => ({ eq: eq2 }));
  const update = mock.fn(() => ({ eq: eq1 }));
  const from = mock.fn(() => ({ update }));
  const supabase = { from };

  mockCtx = mockActionCtx({
    supabase: supabase as unknown as Record<string, unknown>,
  });

  const result = await updateExpense(undefined, validForm());
  assert.ok(result && "error" in result);
  assert.ok(
    (result as { error: string }).error.includes("connection refused"),
    `Expected error to include "connection refused", got: ${(result as { error: string }).error}`,
  );
});

test("updateExpense calls revalidateEntities on success", async () => {
  resetMocks();
  const supabase = makeSupabase();
  mockCtx = mockActionCtx({
    supabase: supabase as unknown as Record<string, unknown>,
  });

  await updateExpense(undefined, validForm());

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
  const args = revalidateEntitiesMock.mock.calls[0].arguments[0];
  assert.deepStrictEqual(args, ["expenses"]);
});

test("updateExpense rejects missing category via domain-rules", async () => {
  resetMocks();
  mockValidationError = "Category is required for expense";
  const supabase = makeSupabase();
  mockCtx = mockActionCtx({
    supabase: supabase as unknown as Record<string, unknown>,
  });

  const form = formData({
    id: "expense-789",
    category: "",
    amount: "50",
    expense_date: "2025-02-01",
  });

  const result = await updateExpense(undefined, form);
  assert.deepStrictEqual(result, { error: "Category is required for expense" });

  // DB should NOT have been called
  assert.strictEqual(supabase._calls.from.mock.callCount(), 0);
});

test("updateExpense defaults payment_method to cash when omitted", async () => {
  resetMocks();
  const supabase = makeSupabase();
  mockCtx = mockActionCtx({
    supabase: supabase as unknown as Record<string, unknown>,
  });

  const form = formData({
    id: "expense-101",
    category: "Travel",
    amount: "200",
    expense_date: "2025-03-10",
    payment_method: null,
  });

  const result = await updateExpense(undefined, form);
  assert.deepStrictEqual(result, { success: true as const, error: undefined });

  const updateArg = supabase._calls.update.mock.calls[0].arguments[0];
  assert.strictEqual(updateArg.payment_method, "cash");
});

test("updateExpense defaults description to null when empty", async () => {
  resetMocks();
  const supabase = makeSupabase();
  mockCtx = mockActionCtx({
    supabase: supabase as unknown as Record<string, unknown>,
  });

  const form = formData({
    id: "expense-202",
    category: "Utilities",
    amount: "75.50",
    expense_date: "2025-04-05",
    description: null,
  });

  const result = await updateExpense(undefined, form);
  assert.deepStrictEqual(result, { success: true as const, error: undefined });

  const updateArg = supabase._calls.update.mock.calls[0].arguments[0];
  assert.strictEqual(updateArg.description, null);
});

test("updateExpense handles Zod parse with no issues message", async () => {
  resetMocks();
  safeParseMock.mock.mockImplementationOnce(() => ({
    success: false,
    error: { issues: [] },
  }));
  const supabase = makeSupabase();
  mockCtx = mockActionCtx({
    supabase: supabase as unknown as Record<string, unknown>,
  });

  const result = await updateExpense(undefined, validForm());
  assert.deepStrictEqual(result, { error: "Мэдээлэл буруу байна." });
});
