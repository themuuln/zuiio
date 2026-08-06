/**
 * Tests for `commissions/actions.ts` — getCommissionSummary, getUnpaidItems, getPayoutHistory.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { mockMod } from "./actions-helpers";

// ─── resolve helper ──────────────────────────────────────────────────
function resolved<T>(data: T, error: unknown = null) {
  return Promise.resolve({ data, error });
}

// ─── Chainable builder: every method returns a promise-resolving chain end ──
function chain(result: { data: unknown; error: unknown }) {
  const self: Record<string, unknown> = {};
  self.select = mock.fn(() => self);
  self.insert = mock.fn(() => self);
  self.update = mock.fn(() => self);
  self.eq = mock.fn(() => self);
  self.neq = mock.fn(() => self);
  self.gt = mock.fn(() => self);
  self.in = mock.fn(() => self);
  self.not = mock.fn(() => self);
  self.is = mock.fn(() => self);
  self.order = mock.fn(() => self);
  self.single = mock.fn(() => resolved(result.data, result.error));
  self.maybeSingle = mock.fn(() => resolved(result.data, result.error));
  // When the chain is awaited, it must resolve to { data, error }
  const thenable = {
    // biome-ignore lint/suspicious/noThenProperty: Supabase query builders are intentionally thenable in this test mock.
    then: (resolve: (v: unknown) => unknown) => resolve(result),
  };
  Object.assign(self, thenable);
  return self;
}

// ─── Global mocks ────────────────────────────────────────────────────
const captureMock = mock.fn(() => {});
mockMod("@zuiio/capture", { capture: captureMock });

mockMod("@/lib/revalidate", {
  revalidateEntities: mock.fn(() => {}),
  revalidateEntityTag: mock.fn(() => {}),
  revalidateEntity: mock.fn(() => {}),
});
mockMod("@/lib/audit", { logAuditEventWithClient: mock.fn(async () => {}) });
mockMod("next/server", { after: (fn: () => void) => fn() });
mockMod("next/cache", {
  revalidatePath: mock.fn(() => {}),
  revalidateTag: mock.fn(() => {}),
});
mockMod("server-only", {});

mockMod("@/lib/branches", {
  withBranchFilter: mock.fn((q: unknown) => q),
});

mockMod("@/lib/commissions", {
  buildStaffSummary: mock.fn(
    (params: {
      profileId: string;
      fullName: string;
      totalEarned: number;
      totalPaid: number;
    }) => ({
      profileId: params.profileId,
      fullName: params.fullName,
      totalEarned: params.totalEarned,
      totalPaid: params.totalPaid,
      totalUnpaid: Math.max(0, params.totalEarned - params.totalPaid),
    }),
  ),
  calculatePayoutTotal: mock.fn((items: Array<{ commission_amount: number }>) =>
    items.reduce(
      (sum: number, item: { commission_amount: number }) =>
        sum + Number(item.commission_amount),
      0,
    ),
  ),
  getAlreadyPaidIds: mock.fn(
    (paidItems: Array<{ sale_item_id: string }>, selectedIds: string[]) => {
      const paidIdSet = new Set(
        paidItems.map((pi: { sale_item_id: string }) => pi.sale_item_id),
      );
      return selectedIds.filter((id: string) => paidIdSet.has(id));
    },
  ),
  validatePayoutRequest: mock.fn(() => null),
});

// ─── Mutable supabase mock (replaced per-test) ───────────────────────
// Register @/lib/erp ONCE — each test swaps currentMockSupabase before calling actions.
let currentMockSupabase: { from: ReturnType<typeof mock.fn> } = {
  from: mock.fn(() => chain(resolved([], null))),
};

mockMod("@/lib/erp", {
  requireAppContext: mock.fn(async () => ({
    supabase: currentMockSupabase,
    branchId: "test-branch-id",
    isBranchScoped: false,
  })),
});

// ─── Module under test (lazy-loaded) ─────────────────────────────────
let getCommissionSummary: (orgId: string) => Promise<
  Array<{
    profileId: string;
    fullName: string;
    totalEarned: number;
    totalPaid: number;
    totalUnpaid: number;
  }>
>;
let getUnpaidItems: (
  orgId: string,
  profileId: string,
) => Promise<
  Array<{
    id: string;
    sale_id: string;
    total_price: number;
    commission_amount: number;
    sale_date: string;
    sale_status: string | null;
  }>
>;
let getPayoutHistory: (orgId: string) => Promise<
  Array<{
    id: string;
    profile_id: string;
    profile_name: string | null;
    paid_at: string;
    paid_by: string;
    paid_by_name: string | null;
    total_amount: number;
    notes: string | null;
    status: string;
    item_count: number;
    created_at: string | null;
  }>
>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/commissions/actions");
  getCommissionSummary = mod.getCommissionSummary;
  getUnpaidItems = mod.getUnpaidItems;
  getPayoutHistory = mod.getPayoutHistory;
});

// ═══════════════════════════════════════════════════════════════════════
// getCommissionSummary
// ═══════════════════════════════════════════════════════════════════════

test("getCommissionSummary returns empty when no profiles", async () => {
  captureMock.mock.resetCalls();
  currentMockSupabase = {
    from: mock.fn(() => chain(resolved([], null))),
  };

  const result = await getCommissionSummary("org-1");
  assert.deepEqual(result, []);
});

test("getCommissionSummary returns summary for profile with earned commissions", async () => {
  captureMock.mock.resetCalls();
  currentMockSupabase = {
    from: mock.fn((table: string) => {
      if (table === "profiles") {
        return chain(resolved([{ id: "p1", full_name: "Alice" }], null));
      }
      if (table === "sales") {
        return chain(resolved([{ id: "sale-1" }, { id: "sale-2" }], null));
      }
      if (table === "sale_items") {
        return chain(
          resolved(
            [{ commission_amount: 100 }, { commission_amount: 200 }],
            null,
          ),
        );
      }
      if (table === "commission_payouts") {
        return chain(resolved([{ id: "pay-1" }], null));
      }
      if (table === "commission_payout_items") {
        return chain(resolved([{ commission_amount: 50 }], null));
      }
      return chain(resolved([], null));
    }),
  };

  const result = await getCommissionSummary("org-1");
  assert.equal(result.length, 1);
  assert.equal(result[0].profileId, "p1");
  assert.equal(result[0].fullName, "Alice");
  assert.equal(result[0].totalEarned, 300);
  assert.equal(result[0].totalPaid, 50);
  assert.equal(result[0].totalUnpaid, 250);
});

test("getCommissionSummary filters out profiles with zero earned", async () => {
  captureMock.mock.resetCalls();
  currentMockSupabase = {
    from: mock.fn((table: string) => {
      if (table === "profiles") {
        return chain(
          resolved(
            [
              { id: "p1", full_name: "Alice" },
              { id: "p2", full_name: "Bob" },
            ],
            null,
          ),
        );
      }
      // All other tables return empty → totalEarned = 0 for both
      return chain(resolved([], null));
    }),
  };

  const result = await getCommissionSummary("org-1");
  assert.deepEqual(result, []);
});

test("getCommissionSummary handles profiles fetch error", async () => {
  captureMock.mock.resetCalls();
  currentMockSupabase = {
    from: mock.fn(() => chain(resolved(null, { message: "db error" }))),
  };

  const result = await getCommissionSummary("org-1");
  assert.deepEqual(result, []);
  assert.ok(captureMock.mock.calls.length > 0);
});

// ═══════════════════════════════════════════════════════════════════════
// getUnpaidItems
// ═══════════════════════════════════════════════════════════════════════

test("getUnpaidItems returns empty when no sales found", async () => {
  captureMock.mock.resetCalls();
  currentMockSupabase = {
    from: mock.fn((table: string) => {
      if (table === "sales") return chain(resolved([], null));
      return chain(resolved([], null));
    }),
  };

  const result = await getUnpaidItems("org-1", "p1");
  assert.deepEqual(result, []);
});

test("getUnpaidItems returns unpaid items filtering out already-paid", async () => {
  captureMock.mock.resetCalls();
  currentMockSupabase = {
    from: mock.fn((table: string) => {
      if (table === "sales") {
        return chain(
          resolved(
            [
              { id: "sale-1", sale_date: "2025-01-15", status: "completed" },
              { id: "sale-2", sale_date: "2025-02-10", status: "completed" },
            ],
            null,
          ),
        );
      }
      if (table === "sale_items") {
        return chain(
          resolved(
            [
              {
                id: "item-1",
                sale_id: "sale-1",
                total_price: 1000,
                commission_amount: 100,
              },
              {
                id: "item-2",
                sale_id: "sale-1",
                total_price: 500,
                commission_amount: 50,
              },
              {
                id: "item-3",
                sale_id: "sale-2",
                total_price: 2000,
                commission_amount: 200,
              },
            ],
            null,
          ),
        );
      }
      if (table === "commission_payout_items") {
        // item-1 has already been paid
        return chain(resolved([{ sale_item_id: "item-1" }], null));
      }
      return chain(resolved([], null));
    }),
  };

  const result = await getUnpaidItems("org-1", "p1");
  assert.equal(result.length, 2);
  // Sorted by sale_date descending → sale-2 first
  assert.equal(result[0].id, "item-3");
  assert.equal(result[0].sale_date, "2025-02-10");
  assert.equal(result[0].commission_amount, 200);
  assert.equal(result[1].id, "item-2");
  assert.equal(result[1].sale_date, "2025-01-15");
  assert.equal(result[1].commission_amount, 50);
});

test("getUnpaidItems handles error gracefully", async () => {
  captureMock.mock.resetCalls();
  currentMockSupabase = {
    from: mock.fn((table: string) => {
      if (table === "sales") {
        return chain(
          resolved(
            [{ id: "sale-1", sale_date: "2025-01-15", status: "completed" }],
            null,
          ),
        );
      }
      if (table === "sale_items") {
        return chain(resolved(null, { message: "db error" }));
      }
      return chain(resolved([], null));
    }),
  };

  const result = await getUnpaidItems("org-1", "p1");
  assert.deepEqual(result, []);
  assert.ok(captureMock.mock.calls.length > 0);
});

// ═══════════════════════════════════════════════════════════════════════
// getPayoutHistory
// ═══════════════════════════════════════════════════════════════════════

test("getPayoutHistory returns payout history with profile names", async () => {
  captureMock.mock.resetCalls();
  currentMockSupabase = {
    from: mock.fn((table: string) => {
      if (table === "commission_payouts") {
        return chain(
          resolved(
            [
              {
                id: "pay-1",
                profile_id: "p1",
                paid_at: "2025-03-01",
                paid_by: "admin-1",
                total_amount: 500,
                notes: "March payout",
                status: "completed",
                created_at: "2025-03-01",
                profile_profiles: { full_name: "Alice" },
                payer_profiles: { full_name: "Admin" },
              },
            ],
            null,
          ),
        );
      }
      if (table === "commission_payout_items") {
        // Count query: .select("id", {count:"exact",head:true}).eq("payout_id", id)
        const self: Record<string, unknown> = {};
        self.select = mock.fn(() => self);
        self.eq = mock.fn(() => Promise.resolve({ count: 3, error: null }));
        return self;
      }
      return chain(resolved([], null));
    }),
  };

  const result = await getPayoutHistory("org-1");
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "pay-1");
  assert.equal(result[0].profile_name, "Alice");
  assert.equal(result[0].paid_by_name, "Admin");
  assert.equal(result[0].total_amount, 500);
  assert.equal(result[0].notes, "March payout");
  assert.equal(result[0].item_count, 3);
});

test("getPayoutHistory returns empty array on error", async () => {
  captureMock.mock.resetCalls();
  currentMockSupabase = {
    from: mock.fn(() => chain(resolved(null, { message: "db error" }))),
  };

  const result = await getPayoutHistory("org-1");
  assert.deepEqual(result, []);
  assert.ok(captureMock.mock.calls.length > 0);
});

test("getPayoutHistory includes item count for each payout", async () => {
  captureMock.mock.resetCalls();
  let payoutCountCalls = 0;
  currentMockSupabase = {
    from: mock.fn((table: string) => {
      if (table === "commission_payouts") {
        return chain(
          resolved(
            [
              {
                id: "pay-1",
                profile_id: "p1",
                paid_at: "2025-03-01",
                paid_by: "admin-1",
                total_amount: 300,
                notes: null,
                status: "completed",
                created_at: "2025-03-01",
                profile_profiles: { full_name: "Alice" },
                payer_profiles: { full_name: "Admin" },
              },
              {
                id: "pay-2",
                profile_id: "p2",
                paid_at: "2025-02-01",
                paid_by: "admin-1",
                total_amount: 700,
                notes: "February payout",
                status: "completed",
                created_at: "2025-02-01",
                profile_profiles: { full_name: "Bob" },
                payer_profiles: { full_name: "Admin" },
              },
            ],
            null,
          ),
        );
      }
      if (table === "commission_payout_items") {
        payoutCountCalls++;
        const count = payoutCountCalls === 1 ? 2 : 5;
        const self: Record<string, unknown> = {};
        self.select = mock.fn(() => self);
        self.eq = mock.fn(() => Promise.resolve({ count, error: null }));
        return self;
      }
      return chain(resolved([], null));
    }),
  };

  const result = await getPayoutHistory("org-1");
  assert.equal(result.length, 2);
  assert.equal(result[0].item_count, 2);
  assert.equal(result[0].profile_name, "Alice");
  assert.equal(result[1].item_count, 5);
  assert.equal(result[1].profile_name, "Bob");
});
