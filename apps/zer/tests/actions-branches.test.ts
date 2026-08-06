/**
 * Tests for `settings/branches/actions.ts` — createBranch, updateBranch,
 * setDefaultBranch, deleteBranch, assignUserBranch.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { formData, mockActionCtx, mockMod, resolved } from "./actions-helpers";

/** Shape of a mock.fn() result for accessing mock.callCount / mock.calls. */
type MockFn = {
  mock: { callCount: () => number; calls: Array<{ arguments: unknown[] }> };
};

// ─── Global mocks ────────────────────────────────────────────────────

const withDbCaptureMock = mock.fn(async (_name: string, query: unknown) => {
  return await (query as Promise<unknown>);
});
const captureMock = mock.fn(() => {});
mockMod("@zuiio/capture", {
  capture: captureMock,
  withDbCapture: withDbCaptureMock,
});

const revalidateEntitiesMock = mock.fn(() => {});
const revalidateEntityTagMock = mock.fn(() => {});
const revalidateEntityMock = mock.fn(() => {});
mockMod("@/lib/revalidate", {
  revalidateEntities: revalidateEntitiesMock,
  revalidateEntityTag: revalidateEntityTagMock,
  revalidateEntity: revalidateEntityMock,
});

mockMod("@/lib/audit", { logAuditEventWithClient: mock.fn(async () => {}) });
mockMod("next/server", { after: (fn: () => unknown) => fn() });
mockMod("next/cache", {
  revalidatePath: mock.fn(() => {}),
  revalidateTag: mock.fn(() => {}),
});
mockMod("server-only", {});

// ─── Branch-specific mocks ───────────────────────────────────────────

const slugifyMock = mock.fn((name: string) =>
  name.toLowerCase().replace(/\s+/g, "-"),
);
mockMod("@/lib/format", { slugify: slugifyMock });

// ─── Chain builders ──────────────────────────────────────────────────

/**
 * Build a full Supabase-like chain with all standard query-builder methods.
 * Terminal methods (.single, .maybeSingle) resolve with the given data/error.
 * Intermediate methods (.eq, .neq, .select, .insert, .update, .delete) return
 * the same chain so callers can keep chaining.
 */
function chain(resolve: { data: unknown; error: unknown; count?: number }) {
  const self: Record<string, unknown> = {};
  const result = {
    data: resolve.data,
    error: resolve.error,
    count: resolve.count,
  };
  self.single = mock.fn(() => resolved(resolve.data, resolve.error));
  self.maybeSingle = mock.fn(() => resolved(resolve.data, resolve.error));
  // Make the chain a thenable so `await chain(...)` resolves to { data, error, count }
  // biome-ignore lint/suspicious/noThenProperty: Supabase query builders are intentionally thenable in this test mock.
  self.then = (onfulfilled?: (v: unknown) => unknown) => onfulfilled?.(result);
  self.eq = mock.fn(() => self);
  self.neq = mock.fn(() => self);
  self.gt = mock.fn(() => self);
  self.lt = mock.fn(() => self);
  self.in = mock.fn(() => self);
  self.select = mock.fn(() => self);
  self.insert = mock.fn(() => self);
  self.update = mock.fn(() => self);
  self.delete = mock.fn(() => self);
  self.order = mock.fn(() => self);
  self.limit = mock.fn(() => self);
  return self;
}

/** Full chain resolving with no error (for insert/delete without terminal). */
function okChain() {
  return chain({ data: null, error: null });
}

/** Build a select → eq → eq → terminal chain for fetch-by-id patterns. */
function selectChain(result: unknown, error: unknown = null) {
  const self: Record<string, unknown> = {};
  self.select = mock.fn(() => {
    const inner: Record<string, unknown> = {};
    inner.eq = mock.fn(() => {
      const eq2: Record<string, unknown> = {};
      eq2.eq = mock.fn(() => {
        const eq3 = chain({ data: result, error });
        return eq3;
      });
      // For .eq().neq() pattern (updateBranch slug uniqueness check)
      eq2.neq = mock.fn(() => {
        const neqChain = chain({ data: result, error });
        return neqChain;
      });
      // For .eq().delete() pattern (branch delete with eq chain)
      eq2.delete = mock.fn(() => chain({ data: null, error: null }));
      return eq2;
    });
    return inner;
  });
  return self;
}

// ─── Context supabase builder ────────────────────────────────────────

type BranchTable =
  | "branches"
  | "sales"
  | "expenses"
  | "invoices"
  | "purchase_orders"
  | "quotations"
  | "returns"
  | "stock_movements"
  | "discounts"
  | "commission_payouts"
  | "journal_entries"
  | "profiles";

/**
 * Build the ctx.supabase mock for branch action tests.
 * Tracks call count per table to return different results on repeated calls.
 */
function buildCtxSupabase(
  opts: {
    /** What the first .from("branches") call returns for .select().eq().eq().maybeSingle() */
    duplicateCheckData?: unknown;
    /** What the second .from("branches") call returns for .insert().select().single() */
    insertData?: { id: string; name: string; slug: string } | null;
    insertError?: { message: string; code?: string } | null;
    /** Count to return for transactional table checks (used in deleteBranch). */
    countResult?: number;
    /** If true, the unset-default update returns an error. */
    unsetDefaultError?: { message: string } | null;
    /** If true, the set-default update returns an error. */
    setDefaultError?: { message: string } | null;
    /** If true, the branch delete returns an error. */
    branchDeleteError?: { message: string } | null;
    /** Profile update error for assignUserBranch. */
    profileUpdateError?: { message: string } | null;
  } = {},
) {
  const branchesCalls = { count: 0 };

  const fromMock = mock.fn((table: BranchTable) => {
    // ── branches table ──
    if (table === "branches") {
      branchesCalls.count++;

      // For updateBranch/setDefaultBranch/deleteBranch: first call is fetch
      // If count === 1 and this is a fetch (select), return current branch data
      // If count === 2, this might be an insert or update

      if (branchesCalls.count === 1) {
        // First call: could be duplicate-check (maybeSingle) or current-branch fetch (single)
        return selectChain(opts.duplicateCheckData ?? null);
      }

      if (branchesCalls.count === 2) {
        if (opts.insertError) {
          // insert error path
          const self: Record<string, unknown> = {};
          self.insert = mock.fn(() => {
            const sel: Record<string, unknown> = {};
            sel.select = mock.fn(() => {
              const s: Record<string, unknown> = {};
              s.single = mock.fn(() => resolved(null, opts.insertError));
              return s;
            });
            return sel;
          });
          return self;
        }
        // Normal insert path
        const self: Record<string, unknown> = {};
        self.insert = mock.fn(() => {
          const sel: Record<string, unknown> = {};
          sel.select = mock.fn(() => {
            const s: Record<string, unknown> = {};
            s.single = mock.fn(() =>
              resolved(
                opts.insertData ?? {
                  id: "br-test",
                  name: "Test Branch",
                  slug: "test-branch",
                },
                null,
              ),
            );
            return s;
          });
          return sel;
        });
        self.update = mock.fn(() => chain({ data: null, error: null }));
        return self;
      }

      // count >= 3: rollback deletes, setDefault updates, or deleteBranch
      const self: Record<string, unknown> = {};
      self.delete = mock.fn(() => chain({ data: null, error: null }));
      self.update = mock.fn(() => {
        // Could be unset-default or set-default
        if (opts.setdefaultError) {
          return chain({ data: null, error: opts.setdefaultError });
        }
        if (opts.unsetDefaultError && branchesCalls.count <= 4) {
          return chain({ data: null, error: opts.unsetDefaultError });
        }
        return chain({ data: null, error: null });
      });
      self.select = mock.fn(() => {
        const inner: Record<string, unknown> = {};
        inner.eq = mock.fn(() => {
          const eq2: Record<string, unknown> = {};
          eq2.eq = mock.fn(() => {
            const eq3: Record<string, unknown> = {};
            // For count checks: .select("*", {count: "exact", head: true}).eq("branch_id", branchId)
            // For setDefaultBranch: .select("id, is_default").eq("id", branchId).eq("organization_id", orgId).single()
            if (
              opts.insertData === undefined &&
              opts.duplicateCheckData === undefined
            ) {
              // setDefaultBranch path
              eq3.single = mock.fn(() =>
                resolved(
                  opts.insertData ?? { id: "br-test", is_default: false },
                  null,
                ),
              );
            }
            eq3.delete = mock.fn(() => chain({ data: null, error: null }));
            return eq3;
          });
          eq2.delete = mock.fn(() =>
            chain({ data: null, error: opts.branchDeleteError }),
          );
          return eq2;
        });
        return inner;
      });
      return self;
    }

    // ── Transactional tables for deleteBranch count checks ──
    const transactionalTables = [
      "sales",
      "expenses",
      "invoices",
      "purchase_orders",
      "quotations",
      "returns",
      "stock_movements",
      "discounts",
      "commission_payouts",
      "journal_entries",
    ];
    if (transactionalTables.includes(table)) {
      const countResult = opts.countResult ?? 0;
      const self: Record<string, unknown> = {};
      self.select = mock.fn(() => {
        const inner: Record<string, unknown> = {};
        inner.eq = mock.fn(() =>
          chain({ data: null, error: null, count: countResult }),
        );
        return inner;
      });
      return self;
    }

    // ── profiles table (assignUserBranch) ──
    if (table === "profiles") {
      const self: Record<string, unknown> = {};
      self.update = mock.fn(() =>
        chain({ data: null, error: opts.profileUpdateError ?? null }),
      );
      return self;
    }

    // Fallback
    return okChain();
  });

  return { from: fromMock };
}

/**
 * Build the serviceClient mock (returned by createServiceClient).
 */
function buildServiceClient(
  opts: {
    /** If true, warehouse insert returns an error. */
    warehouseError?: { message: string } | null;
    /** If set, chart_of_accounts root insert returns an error. */
    chartRootError?: { message: string } | null;
    /** If set, chart_of_accounts child insert returns an error. */
    chartChildError?: { message: string } | null;
    /** Root accounts to return from seedChartOfAccounts root insert. */
    rootAccountResults?: Array<{ id: string; code: string }>;
  } = {},
) {
  const chartCalls = { count: 0 };

  const fromMock = mock.fn((table: string) => {
    if (table === "warehouses") {
      const self: Record<string, unknown> = {};
      self.insert = mock.fn(() =>
        opts.warehouseError
          ? resolved(null, opts.warehouseError)
          : resolved(null, null),
      );
      self.delete = mock.fn(() => chain({ data: null, error: null }));
      return self;
    }

    if (table === "chart_of_accounts") {
      chartCalls.count++;
      const self: Record<string, unknown> = {};

      // Always provide delete for cleanup operations
      self.delete = mock.fn(() => chain({ data: null, error: null }));

      if (chartCalls.count === 1) {
        // Root accounts insert → .select("id, code") with results
        self.insert = mock.fn(() => {
          const sel: Record<string, unknown> = {};
          sel.select = mock.fn(() => {
            if (opts.chartRootError) {
              return resolved(null, opts.chartRootError);
            }
            return resolved(
              opts.rootAccountResults ?? [
                { id: "r1", code: "1000" },
                { id: "r2", code: "2000" },
                { id: "r3", code: "3000" },
                { id: "r4", code: "4000" },
                { id: "r5", code: "5000" },
              ],
              null,
            );
          });
          return sel;
        });
        return self;
      }

      // count >= 2: child accounts insert or delete
      self.insert = mock.fn(() =>
        opts.chartChildError
          ? resolved(null, opts.chartChildError)
          : resolved(null, null),
      );
      return self;
    }

    return okChain();
  });

  return { from: fromMock };
}

// ─── Module mocks for createServiceClient ────────────────────────────

let serviceClientInstance: { from: MockFn };
mockMod("@/lib/supabase/server-service", {
  createServiceClient: mock.fn(() => serviceClientInstance),
});

// ─── Action context ──────────────────────────────────────────────────

let mockCtx: Record<string, unknown>;
mockMod("@/lib/action-utils", {
  requireActionContext: mock.fn(async () => mockCtx),
  requireWriteAction: mock.fn(async () => mockCtx),
});

// ─── Lazy-loaded action functions ────────────────────────────────────

let createBranch: (formData: FormData) => Promise<unknown>;
let updateBranch: (branchId: string, formData: FormData) => Promise<unknown>;
let setDefaultBranch: (branchId: string) => Promise<unknown>;
let deleteBranch: (branchId: string) => Promise<unknown>;
let assignUserBranch: (
  profileId: string,
  branchId: string | null,
) => Promise<unknown>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/settings/branches/actions");
  createBranch = mod.createBranch;
  updateBranch = mod.updateBranch;
  setDefaultBranch = mod.setDefaultBranch;
  deleteBranch = mod.deleteBranch;
  assignUserBranch = mod.assignUserBranch;
});

// ─── Reset helpers ───────────────────────────────────────────────────

function resetMocks() {
  captureMock.mock.resetCalls();
  revalidateEntityMock.mock.resetCalls();
  revalidateEntitiesMock.mock.resetCalls();
  revalidateEntityTagMock.mock.resetCalls();
  withDbCaptureMock.mock.resetCalls();
  slugifyMock.mock.resetCalls();
}

// ═════════════════════════════════════════════════════════════════════
// createBranch
// ═════════════════════════════════════════════════════════════════════

test("createBranch: rejects missing name", async () => {
  resetMocks();
  serviceClientInstance = buildServiceClient();
  mockCtx = { ...mockActionCtx(), supabase: buildCtxSupabase() };

  const result = await createBranch(formData({ name: "" }));

  assert.deepStrictEqual(result, { error: "Салбарын нэр шаардлагатай." });
});

test("createBranch: rejects duplicate slug", async () => {
  resetMocks();
  serviceClientInstance = buildServiceClient();
  mockCtx = {
    ...mockActionCtx(),
    supabase: buildCtxSupabase({
      duplicateCheckData: { id: "existing-branch" },
    }),
  };

  const result = await createBranch(formData({ name: "Existing Branch" }));

  assert.deepStrictEqual(result, {
    error: "Энэ нэртэй салбар бүртгэгдсэн байна.",
  });
});

test("createBranch: creates branch, warehouse, and seeds chart of accounts", async () => {
  resetMocks();
  serviceClientInstance = buildServiceClient();
  mockCtx = {
    ...mockActionCtx(),
    supabase: buildCtxSupabase({
      duplicateCheckData: null, // no duplicate
      insertData: { id: "br-new", name: "New Branch", slug: "new-branch" },
    }),
  };

  const result = await createBranch(
    formData({
      name: "New Branch",
      address: "123 Main St",
      phone: "1234",
      email: "b@test.com",
    }),
  );

  assert.deepStrictEqual(result, {
    success: true,
    branch: { id: "br-new", name: "New Branch", slug: "new-branch" },
  });

  // slugify was called
  assert.equal(slugifyMock.mock.callCount(), 1);
  assert.equal(slugifyMock.mock.calls[0].arguments[0], "New Branch");

  // Warehouse was created via serviceClient
  const whFrom = serviceClientInstance.from as MockFn;
  const warehouseCall = whFrom.mock.calls.find(
    (c: { arguments: unknown[] }) => c.arguments[0] === "warehouses",
  );
  assert.ok(warehouseCall, "warehouses table was accessed via serviceClient");

  // Chart of accounts was seeded
  const coaCall = whFrom.mock.calls.find(
    (c: { arguments: unknown[] }) => c.arguments[0] === "chart_of_accounts",
  );
  assert.ok(coaCall, "chart_of_accounts was accessed via serviceClient");

  // Revalidation happened
  assert.equal(revalidateEntityMock.mock.callCount(), 3);
  const revalCalls = revalidateEntityMock.mock.calls.map(
    (c: { arguments: unknown[] }) => c.arguments[0],
  );
  assert.ok(revalCalls.includes("branches"));
  assert.ok(revalCalls.includes("inventory"));
  assert.ok(revalCalls.includes("settings"));
});

test("createBranch: handles warehouse creation error with rollback", async () => {
  resetMocks();
  serviceClientInstance = buildServiceClient({
    warehouseError: { message: "Warehouse insert failed" },
  });
  mockCtx = {
    ...mockActionCtx(),
    supabase: buildCtxSupabase({
      duplicateCheckData: null,
      insertData: { id: "br-err", name: "Err Branch", slug: "err-branch" },
    }),
  };

  const result = await createBranch(formData({ name: "Err Branch" }));

  assert.deepStrictEqual(result, {
    error: "Агуулах үүсгэхэд алдаа гарлаа: Warehouse insert failed",
  });

  // capture was called for the warehouse error
  assert.ok(captureMock.mock.callCount() >= 1);
});

test("createBranch: handles chart of accounts seed error with rollback", async () => {
  resetMocks();
  serviceClientInstance = buildServiceClient({
    chartRootError: { message: "COA root insert failed" },
  });
  mockCtx = {
    ...mockActionCtx(),
    supabase: buildCtxSupabase({
      duplicateCheckData: null,
      insertData: { id: "br-coa", name: "COA Branch", slug: "coa-branch" },
    }),
  };

  const result = await createBranch(formData({ name: "COA Branch" }));

  assert.deepStrictEqual(result, {
    error: `Дансны бүртгэл үүсгэхэд алдаа гарлаа: COA root insert failed`,
  });

  // capture was called for the chart error
  assert.ok(captureMock.mock.callCount() >= 1);
});

// ═════════════════════════════════════════════════════════════════════
// updateBranch
// ═════════════════════════════════════════════════════════════════════

test("updateBranch: rejects missing name", async () => {
  resetMocks();
  serviceClientInstance = buildServiceClient();
  mockCtx = { ...mockActionCtx(), supabase: buildCtxSupabase() };

  const result = await updateBranch("br-1", formData({ name: "" }));

  assert.deepStrictEqual(result, { error: "Салбарын нэр шаардлагатай." });
});

test("updateBranch: rejects when branch not found", async () => {
  resetMocks();
  serviceClientInstance = buildServiceClient();
  mockCtx = {
    ...mockActionCtx(),
    supabase: buildCtxSupabase({ duplicateCheckData: null }), // null = branch not found
  };

  const result = await updateBranch(
    "br-missing",
    formData({ name: "Updated Name" }),
  );

  assert.deepStrictEqual(result, { error: "Салбар олдсонгүй." });
});

test("updateBranch: updates with new name (slug changes)", async () => {
  resetMocks();
  serviceClientInstance = buildServiceClient();
  // First call: fetch current branch returns { name: "Old Name", slug: "old-name" }
  // Second call: slug uniqueness check returns null (no conflict)
  // We need a custom ctx supabase that tracks branches calls
  let branchesCallCount = 0;
  const fromMock = mock.fn((table: string) => {
    if (table === "branches") {
      branchesCallCount++;
      if (branchesCallCount === 1) {
        // Fetch current branch
        return selectChain({ name: "Old Name", slug: "old-name" });
      }
      if (branchesCallCount === 2) {
        // Slug uniqueness check → null (unique)
        return selectChain(null);
      }
      // Third call: the actual update
      return { update: mock.fn(() => chain({ data: null, error: null })) };
    }
    return okChain();
  });
  mockCtx = { ...mockActionCtx(), supabase: { from: fromMock } };

  const result = await updateBranch("br-1", formData({ name: "New Name" }));

  assert.deepStrictEqual(result, { success: true });

  // slugify was called since name changed
  assert.equal(slugifyMock.mock.callCount(), 1);
  assert.equal(slugifyMock.mock.calls[0].arguments[0], "New Name");

  // Revalidation
  assert.equal(revalidateEntityMock.mock.callCount(), 2);
  const revalCalls = revalidateEntityMock.mock.calls.map(
    (c: { arguments: unknown[] }) => c.arguments[0],
  );
  assert.ok(revalCalls.includes("branches"));
  assert.ok(revalCalls.includes("settings"));
});

test("updateBranch: updates without name change (slug unchanged)", async () => {
  resetMocks();
  serviceClientInstance = buildServiceClient();
  let branchesCallCount = 0;
  const fromMock = mock.fn((table: string) => {
    if (table === "branches") {
      branchesCallCount++;
      if (branchesCallCount === 1) {
        // Fetch current branch — same name
        return selectChain({ name: "Same Name", slug: "same-name" });
      }
      // Second call: the actual update (no slug check since name didn't change)
      return { update: mock.fn(() => chain({ data: null, error: null })) };
    }
    return okChain();
  });
  mockCtx = { ...mockActionCtx(), supabase: { from: fromMock } };

  const result = await updateBranch("br-1", formData({ name: "Same Name" }));

  assert.deepStrictEqual(result, { success: true });

  // slugify was NOT called since name didn't change
  assert.equal(slugifyMock.mock.callCount(), 0);
});

// ═════════════════════════════════════════════════════════════════════
// setDefaultBranch
// ═════════════════════════════════════════════════════════════════════

test("setDefaultBranch: sets default when not already default", async () => {
  resetMocks();
  serviceClientInstance = buildServiceClient();
  let branchesCallCount = 0;
  const fromMock = mock.fn((table: string) => {
    if (table === "branches") {
      branchesCallCount++;
      if (branchesCallCount === 1) {
        // Fetch branch — is_default: false
        return selectChain({ id: "br-1", is_default: false });
      }
      if (branchesCallCount === 2) {
        // Unset previous default
        return { update: mock.fn(() => chain({ data: null, error: null })) };
      }
      // Set new default
      return { update: mock.fn(() => chain({ data: null, error: null })) };
    }
    return okChain();
  });
  mockCtx = { ...mockActionCtx(), supabase: { from: fromMock } };

  const result = await setDefaultBranch("br-1");

  assert.deepStrictEqual(result, { success: true });

  assert.equal(revalidateEntityMock.mock.callCount(), 2);
  const revalCalls = revalidateEntityMock.mock.calls.map(
    (c: { arguments: unknown[] }) => c.arguments[0],
  );
  assert.ok(revalCalls.includes("branches"));
  assert.ok(revalCalls.includes("settings"));
});

test("setDefaultBranch: returns success when already default", async () => {
  resetMocks();
  serviceClientInstance = buildServiceClient();
  const fromMock = mock.fn((table: string) => {
    if (table === "branches") {
      return selectChain({ id: "br-1", is_default: true });
    }
    return chain({ data: null, error: null });
  });
  mockCtx = { ...mockActionCtx(), supabase: { from: fromMock } };

  const result = await setDefaultBranch("br-1");

  assert.deepStrictEqual(result, { success: true });

  // No revalidation should happen (early return)
  assert.equal(revalidateEntityMock.mock.callCount(), 0);
});

test("setDefaultBranch: handles unset-default error", async () => {
  resetMocks();
  serviceClientInstance = buildServiceClient();
  let branchesCallCount = 0;
  const fromMock = mock.fn((table: string) => {
    if (table === "branches") {
      branchesCallCount++;
      if (branchesCallCount === 1) {
        return selectChain({ id: "br-1", is_default: false });
      }
      // Unset default returns error
      return {
        update: mock.fn(() =>
          chain({ data: null, error: { message: "Update failed" } }),
        ),
      };
    }
    return okChain();
  });
  mockCtx = { ...mockActionCtx(), supabase: { from: fromMock } };

  const result = await setDefaultBranch("br-1");

  assert.deepStrictEqual(result, {
    error: "Өмнөх үндсэн салбарыг арилгахад алдаа гарлаа: Update failed",
  });
});

// ═════════════════════════════════════════════════════════════════════
// deleteBranch
// ═════════════════════════════════════════════════════════════════════

test("deleteBranch: deletes when no transactional data", async () => {
  resetMocks();
  serviceClientInstance = buildServiceClient();

  // Build ctx supabase with count=0 for all 10 tables, then branch delete
  let _callCount = 0;
  const fromMock = mock.fn((table: string) => {
    const transactionalTables = [
      "sales",
      "expenses",
      "invoices",
      "purchase_orders",
      "quotations",
      "returns",
      "stock_movements",
      "discounts",
      "commission_payouts",
      "journal_entries",
    ];

    if (transactionalTables.includes(table)) {
      // Return chain: .select().eq() → { count: 0 }
      const self: Record<string, unknown> = {};
      self.select = mock.fn(() => {
        const inner: Record<string, unknown> = {};
        inner.eq = mock.fn(() => chain({ data: null, error: null, count: 0 }));
        return inner;
      });
      return self;
    }

    if (table === "branches") {
      _callCount++;
      // The final branch delete: .delete().eq().eq()
      const self: Record<string, unknown> = {};
      self.delete = mock.fn(() => {
        const eq1: Record<string, unknown> = {};
        eq1.eq = mock.fn(() => {
          const eq2: Record<string, unknown> = {};
          eq2.eq = mock.fn(() => chain({ data: null, error: null }));
          return eq2;
        });
        return eq1;
      });
      return self;
    }

    return okChain();
  });
  mockCtx = { ...mockActionCtx(), supabase: { from: fromMock } };

  const result = await deleteBranch("br-del");

  assert.deepStrictEqual(result, { success: true });

  // Service client should have been called for warehouse + chart_of_accounts
  const svcFrom = serviceClientInstance.from as MockFn;
  const whDelete = svcFrom.mock.calls.find(
    (c: { arguments: unknown[] }) => c.arguments[0] === "warehouses",
  );
  assert.ok(whDelete, "warehouse delete was called via serviceClient");

  const coaDelete = svcFrom.mock.calls.find(
    (c: { arguments: unknown[] }) => c.arguments[0] === "chart_of_accounts",
  );
  assert.ok(coaDelete, "chart_of_accounts delete was called via serviceClient");

  assert.equal(revalidateEntityMock.mock.callCount(), 1);
  assert.equal(
    (revalidateEntityMock.mock.calls[0].arguments as unknown[])[0],
    "branches",
  );
});

test("deleteBranch: returns error when transactional data exists", async () => {
  resetMocks();
  serviceClientInstance = buildServiceClient();

  const fromMock = mock.fn((table: string) => {
    if (table === "sales") {
      // First table checked — has data
      const self: Record<string, unknown> = {};
      self.select = mock.fn(() => {
        const inner: Record<string, unknown> = {};
        inner.eq = mock.fn(() => chain({ data: null, error: null, count: 3 }));
        return inner;
      });
      return self;
    }
    // Other tables shouldn't be reached, but provide fallback
    const self: Record<string, unknown> = {};
    self.select = mock.fn(() => {
      const inner: Record<string, unknown> = {};
      inner.eq = mock.fn(() => chain({ data: null, error: null, count: 0 }));
      return inner;
    });
    return self;
  });
  mockCtx = { ...mockActionCtx(), supabase: { from: fromMock } };

  const result = await deleteBranch("br-del");

  assert.deepStrictEqual(result, {
    error:
      "Энэ салбар дээр өгөгдөл байна. Өгөгдөлтэй салбарыг устгах боломжгүй.",
  });

  // No revalidation (early return)
  assert.equal(revalidateEntityMock.mock.callCount(), 0);
});

// ═════════════════════════════════════════════════════════════════════
// assignUserBranch
// ═════════════════════════════════════════════════════════════════════

test("assignUserBranch: assigns branch successfully", async () => {
  resetMocks();
  serviceClientInstance = buildServiceClient();
  mockCtx = {
    ...mockActionCtx(),
    supabase: buildCtxSupabase(),
  };

  const result = await assignUserBranch("profile-1", "br-1");

  assert.deepStrictEqual(result, { success: true });

  assert.equal(revalidateEntityMock.mock.callCount(), 1);
  assert.equal(
    (revalidateEntityMock.mock.calls[0].arguments as unknown[])[0],
    "users",
  );
});

test("assignUserBranch: assigns null branch", async () => {
  resetMocks();
  serviceClientInstance = buildServiceClient();
  mockCtx = {
    ...mockActionCtx(),
    supabase: buildCtxSupabase(),
  };

  const result = await assignUserBranch("profile-1", null);

  assert.deepStrictEqual(result, { success: true });

  assert.equal(revalidateEntityMock.mock.callCount(), 1);
  assert.equal(
    (revalidateEntityMock.mock.calls[0].arguments as unknown[])[0],
    "users",
  );
});
