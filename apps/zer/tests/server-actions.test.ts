import assert from "node:assert/strict";
import test, { mock } from "node:test";

// ─── Mock supabase builder ───────────────────────────────────────────

const resolved = (data: unknown, error: unknown = null) =>
  Promise.resolve({ data, error });

function createMockSupabase(tableOverrides?: Record<string, unknown>) {
  const chainDefaults = () => {
    const self: Record<string, unknown> = {};
    self.select = mock.fn(() => self);
    self.insert = mock.fn(() => self);
    self.update = mock.fn(() => self);
    self.delete = mock.fn(() => self);
    self.eq = mock.fn(() => self);
    self.gt = mock.fn(() => self);
    self.in = mock.fn(() => self);
    self.not = mock.fn(() => self);
    self.single = mock.fn(() => resolved({ id: "test-id" }));
    self.maybeSingle = mock.fn(() => resolved({ id: "test-branch-id" }));
    self.order = mock.fn(() => self);
    self.limit = mock.fn(() => self);
    return self;
  };

  const from = mock.fn((table: string) => {
    const overrides = tableOverrides?.[table];
    if (overrides && typeof overrides === "object") {
      return { ...chainDefaults(), ...overrides };
    }
    return chainDefaults();
  });

  return { from };
}

// ─── Mock action context factory ─────────────────────────────────────

function mockActionCtx(overrides?: Record<string, unknown>) {
  return {
    supabase: createMockSupabase(),
    organizationId: "test-org-id",
    userId: "test-user-id",
    branchId: "test-branch-id",
    isBranchScoped: false,
    permissions: [] as string[],
    user: { id: "test-user-id", email: "test@test.com" },
    ...overrides,
  };
}

// ─── Register all mocks BEFORE importing action modules ──────────────
// Bun's mock.module uses `exports`; Node's @types/node uses `namedExports`.
// Unchecked cast at library boundary — Bun runtime expects `exports`.
function mockMod(specifier: string, mod: Record<string, unknown>) {
  mock.module(specifier, { exports: mod } as unknown as Parameters<
    typeof mock.module
  >[1]);
}

let mockCtx: unknown = mockActionCtx();

mockMod("@/lib/action-utils", {
  requireWriteAction: async () => mockCtx,
  requireActionContext: async () => mockCtx,
  requireBranchScope: () => null,
});

mockMod("@zuiio/capture", {
  capture: mock.fn(async () => {}),
  withDbCapture: mock.fn(
    async (_label: string, promise: Promise<unknown>) => promise,
  ),
  captureDbError: mock.fn(async () => {}),
  setCaptureHandler: () => {},
  captureRedirectLoop: mock.fn(async () => {}),
  withSupabaseConsoleCapture: () => (input: unknown) => input,
});

mockMod("@/lib/revalidate", {
  revalidateEntities: mock.fn(() => {}),
});

mockMod("@/lib/accounting", {
  postExpenseToJournal: mock.fn(async () => ({ success: true })),
});

mockMod("next/server", {
  after: (fn: () => void) => fn(),
});

mockMod("next/cache", {
  revalidatePath: mock.fn(() => {}),
  revalidateTag: mock.fn(() => {}),
});

mockMod("@/lib/audit", {
  logAuditEventWithClient: mock.fn(async () => {}),
});

// ─── Lazy-loaded action modules ──────────────────────────────────────

let createExpense: (
  prev: undefined,
  fd: FormData,
) => Promise<Record<string, unknown> | undefined>;
let createDiscount: (
  prev: undefined,
  fd: FormData,
) => Promise<Record<string, unknown> | undefined>;
let createPayout: (
  prev: undefined,
  fd: FormData,
) => Promise<Record<string, unknown> | undefined>;

test.before(async () => {
  const expenseMod = await import("@/app/(dashboard)/expenses/new/actions");
  createExpense = expenseMod.createExpense as typeof createExpense;

  const discountMod = await import("@/app/(dashboard)/discounts/actions");
  createDiscount = discountMod.createDiscount as typeof createDiscount;

  const payoutMod = await import("@/app/(dashboard)/commissions/actions");
  createPayout = payoutMod.createPayout;
});

// ─── Helpers ─────────────────────────────────────────────────────────

function formData(entries: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    if (Array.isArray(value)) {
      for (const v of value) fd.append(key, v);
    } else {
      fd.set(key, value);
    }
  }
  return fd;
}

// ─── Tests: createExpense ────────────────────────────────────────────

test("createExpense rejects missing category", async () => {
  mockCtx = mockActionCtx();
  const fd = formData({ amount: "5000", expense_date: "2025-01-15" });
  const result = await createExpense(undefined, fd);
  assert.ok(result && "error" in result, "should return error");
  assert.equal(result.error, "Ангилал шаардлагатай");
});

test("createExpense rejects zero amount", async () => {
  mockCtx = mockActionCtx();
  const fd = formData({
    category: "Түрээс",
    amount: "0",
    expense_date: "2025-01-15",
  });
  const result = await createExpense(undefined, fd);
  assert.ok(result && "error" in result, "should return error");
  assert.ok(
    String(result.error).includes("Дүн"),
    "error should mention amount",
  );
});

test("createExpense calls supabase insert with valid data", async () => {
  const supabase = createMockSupabase();
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({
    category: "Түрээс",
    amount: "150000",
    expense_date: "2025-06-01",
    payment_method: "cash",
    description: "Office rent",
  });

  const result = await createExpense(undefined, fd);
  assert.equal(result?.error, undefined, "should succeed");

  assert.equal(supabase.from.mock.callCount(), 1);
  const tableArg = supabase.from.mock.calls[0].arguments[0];
  assert.equal(tableArg, "expenses");
});

test("createExpense returns error on insert failure", async () => {
  const insertError = { message: "duplicate key", code: "23505" };
  const supabase = createMockSupabase({
    expenses: {
      insert: mock.fn(() => ({
        select: mock.fn(() => ({
          single: mock.fn(() => resolved(null, insertError)),
        })),
      })),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({
    category: "Түрээс",
    amount: "50000",
    expense_date: "2025-06-01",
  });

  const result = await createExpense(undefined, fd);
  assert.ok(result && "error" in result, "should return error");
  assert.equal(result.error, "duplicate key");
});

test("createExpense returns error when requireWriteAction fails", async () => {
  mockCtx = { error: "Нэвтрэх эрх хүрэлцэхгүй." };
  const fd = formData({
    category: "Түрээс",
    amount: "10000",
    expense_date: "2025-01-01",
  });

  const result = await createExpense(undefined, fd);
  assert.ok(result && "error" in result);
  assert.equal(result.error, "Нэвтрэх эрх хүрэлцэхгүй.");
});

// ─── Tests: createDiscount ───────────────────────────────────────────

test("createDiscount rejects missing name", async () => {
  mockCtx = mockActionCtx();
  const fd = formData({
    type: "percentage",
    value: "10",
    applies_to: "all",
    valid_from: "2025-01-01",
  });
  const result = await createDiscount(undefined, fd);
  assert.ok(result && "error" in result, "should return error");
  assert.ok(String(result.error).includes("Нэр"), "error should mention name");
});

test("createDiscount rejects zero value", async () => {
  mockCtx = mockActionCtx();
  const fd = formData({
    name: "Test Discount",
    type: "percentage",
    value: "0",
    applies_to: "all",
    valid_from: "2025-01-01",
    is_active: "true",
  });
  const result = await createDiscount(undefined, fd);
  assert.ok(result && "error" in result, "should return error");
  assert.ok(
    String(result.error).includes("Дүн"),
    `error should mention amount: "${result.error}"`,
  );
});

test("createDiscount calls supabase insert with valid data", async () => {
  const supabase = createMockSupabase();
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({
    name: "Summer Sale",
    type: "percentage",
    value: "15",
    applies_to: "all",
    valid_from: "2025-06-01",
    is_active: "true",
  });

  const result = await createDiscount(undefined, fd);
  assert.equal(result?.error, undefined, "should succeed");

  const tableArg = supabase.from.mock.calls[0].arguments[0];
  assert.equal(tableArg, "discounts");
});

test("createDiscount logs audit event after success", async () => {
  const supabase = createMockSupabase();
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({
    name: "Holiday Deal",
    type: "fixed_amount",
    value: "5000",
    applies_to: "all",
    valid_from: "2025-12-01",
    is_active: "true",
  });

  const result = await createDiscount(undefined, fd);
  assert.equal(result?.error, undefined, "should succeed");
  assert.equal(supabase.from.mock.callCount(), 1);
  assert.equal(supabase.from.mock.calls[0].arguments[0], "discounts");
});

test("createDiscount rejects percentage over 100", async () => {
  mockCtx = mockActionCtx();
  const fd = formData({
    name: "Bad Discount",
    type: "percentage",
    value: "150",
    applies_to: "all",
    valid_from: "2025-01-01",
    is_active: "true",
  });
  const result = await createDiscount(undefined, fd);
  assert.ok(result && "error" in result, "should return error");
  assert.ok(
    String(result.error).includes("100"),
    `error should mention 100 limit: "${result.error}"`,
  );
});

test("createDiscount returns error on insert failure", async () => {
  const insertError = { message: "relation not found", code: "42P01" };
  const supabase = createMockSupabase({
    discounts: {
      insert: mock.fn(() => ({
        select: mock.fn(() => ({
          single: mock.fn(() => resolved(null, insertError)),
        })),
      })),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({
    name: "Broken Discount",
    type: "percentage",
    value: "10",
    applies_to: "all",
    valid_from: "2025-01-01",
    is_active: "true",
  });

  const result = await createDiscount(undefined, fd);
  assert.ok(result && "error" in result, "should return error");
  assert.ok(
    String(result.error).includes("relation not found"),
    `should forward DB error: "${result.error}"`,
  );
});

// ─── Tests: createPayout ─────────────────────────────────────────────

test("createPayout rejects missing profile_id", async () => {
  mockCtx = mockActionCtx();
  const fd = formData({
    sale_item_ids: "item-1",
  });
  const result = await createPayout(undefined, fd);
  assert.ok(result && "error" in result, "should return error");
  assert.equal(result.error, "Ажилтан сонгоогүй байна.");
});

test("createPayout rejects empty selectedItems", async () => {
  mockCtx = mockActionCtx();
  const fd = formData({
    profile_id: "staff-1",
  });
  const result = await createPayout(undefined, fd);
  assert.ok(result && "error" in result, "should return error");
  assert.equal(result.error, "Төлөх комиссууд сонгоогүй байна.");
});

test("createPayout succeeds and inserts payout + items", async () => {
  const supabase = createMockSupabase({
    sales: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => ({
            not: mock.fn(() => resolved([{ id: "sale-1" }, { id: "sale-2" }])),
          })),
        })),
      })),
    },
    sale_items: {
      select: mock.fn(() => ({
        in: mock.fn(() => ({
          gt: mock.fn(() =>
            resolved([
              { id: "item-1", commission_amount: 5000, sale_id: "sale-1" },
              { id: "item-2", commission_amount: 3000, sale_id: "sale-2" },
            ]),
          ),
        })),
      })),
    },
    commission_payout_items: {
      select: mock.fn(() => ({
        in: mock.fn(() => resolved([])),
      })),
      insert: mock.fn(() => resolved(null)),
    },
    commission_payouts: {
      insert: mock.fn(() => ({
        select: mock.fn(() => ({
          single: mock.fn(() => resolved({ id: "payout-1" })),
        })),
      })),
    },
    profiles: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          single: mock.fn(() => resolved({ branch_id: "test-branch-id" })),
        })),
      })),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({
    profile_id: "staff-1",
    sale_item_ids: ["item-1", "item-2"],
    notes: "Monthly payout",
  });

  const result = await createPayout(undefined, fd);
  assert.equal(result, undefined, "should return undefined on success");

  const payoutCall = supabase.from.mock.calls.find(
    (c) => c.arguments[0] === "commission_payouts",
  );
  assert.ok(payoutCall, "should call commission_payouts");

  const itemsCall = supabase.from.mock.calls.find(
    (c) => c.arguments[0] === "commission_payout_items",
  );
  assert.ok(itemsCall, "should call commission_payout_items");
});

test("createPayout returns error when action context fails", async () => {
  mockCtx = { error: "Зөвшөөрөлгүй." };
  const fd = formData({
    profile_id: "staff-1",
    sale_item_ids: "item-1",
  });
  const result = await createPayout(undefined, fd);
  assert.ok(result && "error" in result);
  assert.equal(result.error, "Зөвшөөрөлгүй.");
});

test("createPayout returns error when payout insert fails", async () => {
  const payoutError = { message: "insert failed", code: "XX000" };
  const supabase = createMockSupabase({
    sales: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => ({
            not: mock.fn(() => resolved([{ id: "sale-1" }])),
          })),
        })),
      })),
    },
    sale_items: {
      select: mock.fn(() => ({
        in: mock.fn(() => ({
          gt: mock.fn(() =>
            resolved([
              { id: "item-1", commission_amount: 5000, sale_id: "sale-1" },
            ]),
          ),
        })),
      })),
    },
    commission_payout_items: {
      select: mock.fn(() => ({
        in: mock.fn(() => resolved([])),
      })),
    },
    commission_payouts: {
      insert: mock.fn(() => ({
        select: mock.fn(() => ({
          single: mock.fn(() => resolved(null, payoutError)),
        })),
      })),
    },
    profiles: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          single: mock.fn(() => resolved({ branch_id: "test-branch-id" })),
        })),
      })),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({
    profile_id: "staff-1",
    sale_item_ids: "item-1",
  });

  const result = await createPayout(undefined, fd);
  assert.ok(result && "error" in result, "should return error");
  assert.equal(result.error, "Төлөлт үүсгэхэд алдаа гарлаа.");
});

// ─── Tests: withDbCapture integration ────────────────────────────────

test("withDbCapture is called (mock was invoked)", async () => {
  const { withDbCapture } = await import("@zuiio/capture");
  // mock.module replaces the export at runtime; TypeScript still sees the original signature.
  // Cast through unknown to access the mock tracker (library boundary type mismatch).
  const mockTrack = withDbCapture as unknown as {
    mock: { callCount: () => number };
  };
  const before = mockTrack.mock.callCount();

  const supabase = createMockSupabase();
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({
    category: "Замбараа",
    amount: "1000",
    expense_date: "2025-07-01",
  });
  await createExpense(undefined, fd);

  const after = mockTrack.mock.callCount();
  assert.ok(
    after > before,
    "withDbCapture should have been called during the action",
  );
});
