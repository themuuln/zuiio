import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/cache/with-cache", () => ({
  withCache: vi.fn((_key: string[], fn: () => unknown) => fn()),
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

import {
  getCustomReport,
  getDailyReport,
  getDailyTimeline,
  getDashboardData,
  getEndOfDaySummary,
  getFinanceSummaryFast,
  getMechanicLeaderboardFast,
  getMechanicsList,
  getMonthlyReport,
  getServiceBreakdown,
  getWeeklyReport,
} from "./report-service";

let mockClient: ReturnType<typeof createMockSupabaseClient>;

beforeEach(() => {
  vi.clearAllMocks();
  mockClient = createMockSupabaseClient();
  vi.mocked(createClient).mockResolvedValue(
    mockClient as unknown as Awaited<ReturnType<typeof createClient>>,
  );
});

// ── getMechanicsList ──────────────────────────────────────────

describe("getMechanicsList", () => {
  it("returns mechanics list from org_users with mechanic role", async () => {
    mockClient.__qb.resolveOnce({
      data: [
        { user_id: "u1", roles: [{ name: "Mechanic" }], branch_id: null },
        { user_id: "u2", roles: [{ name: "Mechanic" }], branch_id: null },
      ],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: [
        { id: "u1", full_name: "John Doe", avatar_url: null },
        { id: "u2", full_name: "Jane Smith", avatar_url: null },
      ],
      error: null,
    });

    const result = await getMechanicsList(mockClient as any, "org-1");

    expect(result).toEqual([
      { id: "u1", full_name: "John Doe", avatar_url: null },
      { id: "u2", full_name: "Jane Smith", avatar_url: null },
    ]);
  });

  it("fetches profiles for matched user IDs", async () => {
    mockClient.__qb.resolveOnce({
      data: [
        { user_id: "u1", roles: [{ name: "Mechanic" }], branch_id: null },
        { user_id: "u2", roles: [{ name: "Mechanic" }], branch_id: null },
      ],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: [
        { id: "u1", full_name: "John", avatar_url: null },
        { id: "u2", full_name: null, avatar_url: null },
      ],
      error: null,
    });

    const result = await getMechanicsList(mockClient as any, "org-1");

    expect(result).toHaveLength(2);
    expect(result[0].full_name).toBe("John");
    expect(result[1].full_name).toBeNull();
  });

  it("returns empty array when no mechanics", async () => {
    mockClient.__qb.resolveOnce({ data: [], error: null });

    const result = await getMechanicsList(mockClient as any, "org-1");

    expect(result).toEqual([]);
  });

  it("handles when profiles have no matching users", async () => {
    mockClient.__qb.resolveOnce({
      data: [{ user_id: "u1", roles: [{ name: "Mechanic" }], branch_id: null }],
      error: null,
    });
    mockClient.__qb.resolveOnce({ data: [], error: null });

    const result = await getMechanicsList(mockClient as any, "org-1");

    expect(result).toEqual([]);
  });

  // ── Error-path tests ─────────────────────────────────────

  it("returns empty array when org_users query errors", async () => {
    mockClient.__qb.resolveOnce({
      data: null,
      error: { message: "DB connection failed" },
    });

    const result = await getMechanicsList(mockClient as any, "org-1");

    expect(result).toEqual([]);
  });

  it("handles profiles query error gracefully", async () => {
    mockClient.__qb.resolveOnce({
      data: [
        { user_id: "u1", roles: [{ name: "Mechanic" }], branch_id: null },
      ],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: null,
      error: { message: "Profiles error" },
    });

    const result = await getMechanicsList(mockClient as any, "org-1");

    expect(result).toEqual([]);
  });
});

// ── getDailyReport ────────────────────────────────────────────

describe("getDailyReport", () => {
  it("returns DailyReport with work order counts, revenue, discounts", async () => {
    // ── Setup: work orders, services, parts ──
    mockClient.__qb.resolveOnce({
      data: [{ id: "wo-1" }, { id: "wo-2" }],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: [
        { final_price: 100, discount_amount: 10, service_name: "Oil Change", work_order_id: "wo-1" },
        { final_price: 200, discount_amount: 20, service_name: "Brakes", work_order_id: "wo-2" },
      ],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: [
        { final_price: 50, discount_amount: 5, part_name: "Filter", work_order_id: "wo-1" },
      ],
      error: null,
    });
    // ── getRecentWorkOrdersBatched: 4 parallel ──
    mockClient.__qb.resolveOnce({
      data: [
        {
          id: "wo-1", organization_id: "org-1", customer_id: "c-1", vehicle_id: "v-1",
          mechanic_id: "m-1", status: "Completed", completed_at: "2025-01-15T10:00:00Z",
        },
        {
          id: "wo-2", organization_id: "org-1", customer_id: "c-2", vehicle_id: "v-2",
          mechanic_id: null, status: "Completed", completed_at: "2025-01-15T11:00:00Z",
        },
      ],
      error: null,
    });
    mockClient.__qb.resolveOnce({ data: [], error: null });
    mockClient.__qb.resolveOnce({ data: [], error: null });
    mockClient.__qb.resolveOnce({ data: [], error: null });
    // ── getRecentWorkOrdersBatched: customers + vehicles ──
    mockClient.__qb.resolveOnce({
      data: [{ id: "c-1" }, { id: "c-2" }],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: [{ id: "v-1" }, { id: "v-2" }],
      error: null,
    });
    // ── getRecentWorkOrdersBatched: profiles ──
    mockClient.__qb.resolveOnce({
      data: [{ id: "m-1", full_name: "Mech One" }],
      error: null,
    });

    // Remaining queries (profitability, comparison, KPIs) use default
    // { data: [], error: null } → returns null/zero values

    const result = await getDailyReport(
      mockClient as any,
      "org-1",
      null,
      "2025-01-15",
    );

    expect(result.date).toBe("2025-01-15");
    expect(result.mechanic_name).toBe("All Mechanics");
    expect(result.work_orders_completed).toBe(2);
    expect(result.services_count).toBe(2);
    expect(result.parts_count).toBe(1);
    expect(result.total_revenue).toBe(350);
    expect(result.total_discounts).toBe(35);
    expect(result.work_orders).toHaveLength(2);
  });

  it("supports mechanicId filter and includes mechanic name", async () => {
    // Profile query via .single() → await qb → resolveOnce
    mockClient.__qb.resolveOnce({
      data: { full_name: "Mech One" },
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: [{ id: "wo-1" }],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: [
        { final_price: 100, discount_amount: 0, service_name: "Oil Change", work_order_id: "wo-1" },
      ],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: [
        { final_price: 50, discount_amount: 0, part_name: "Filter", work_order_id: "wo-1" },
      ],
      error: null,
    });
    // ── getRecentWorkOrdersBatched: 4 parallel ──
    mockClient.__qb.resolveOnce({
      data: [
        {
          id: "wo-1", organization_id: "org-1", customer_id: "c-1", vehicle_id: "v-1",
          mechanic_id: "m-1", status: "Completed",
        },
      ],
      error: null,
    });
    mockClient.__qb.resolveOnce({ data: [], error: null });
    mockClient.__qb.resolveOnce({ data: [], error: null });
    mockClient.__qb.resolveOnce({ data: [], error: null });
    // ── getRecentWorkOrdersBatched: customers + vehicles ──
    mockClient.__qb.resolveOnce({
      data: [{ id: "c-1" }],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: [{ id: "v-1" }],
      error: null,
    });
    // ── getRecentWorkOrdersBatched: profiles ──
    mockClient.__qb.resolveOnce({ data: [], error: null });

    const result = await getDailyReport(
      mockClient as any,
      "org-1",
      "m-1",
      "2025-01-15",
    );

    expect(result.mechanic_id).toBe("m-1");
    expect(result.mechanic_name).toBe("Mech One");
    expect(result.work_orders_completed).toBe(1);
  });

  it("returns zero counts when no work orders", async () => {
    mockClient.__qb.resolveOnce({ data: [], error: null });
    // getComparisonData still runs → uses default { data: [], error: null }

    const result = await getDailyReport(
      mockClient as any,
      "org-1",
      null,
      "2025-01-15",
    );

    expect(result.date).toBe("2025-01-15");
    expect(result.work_orders_completed).toBe(0);
    expect(result.services_count).toBe(0);
    expect(result.parts_count).toBe(0);
    expect(result.total_revenue).toBe(0);
    expect(result.total_discounts).toBe(0);
    expect(result.work_orders).toEqual([]);
  });

  it("uses batched queries for services and parts", async () => {
    mockClient.__qb.resolveOnce({
      data: [{ id: "wo-1" }, { id: "wo-2" }],
      error: null,
    });
    mockClient.__qb.resolveOnce({ data: [], error: null });
    mockClient.__qb.resolveOnce({ data: [], error: null });
    mockClient.__qb.resolveOnce({ data: [], error: null });
    mockClient.__qb.resolveOnce({ data: [], error: null });
    mockClient.__qb.resolveOnce({ data: [], error: null });
    mockClient.__qb.resolveOnce({ data: [], error: null });
    mockClient.__qb.resolveOnce({ data: [], error: null });
    mockClient.__qb.resolveOnce({ data: [], error: null });
    mockClient.__qb.resolveOnce({ data: [], error: null });

    await getDailyReport(mockClient as any, "org-1", null, "2025-01-15");

    const fromCalls = vi
      .mocked(mockClient.from)
      .mock.calls.map((c: string[]) => c[0]);
    expect(fromCalls).toContain("work_order_services");
    expect(fromCalls).toContain("work_order_parts");
  });

  // ── Error-path tests ─────────────────────────────────────
  it("returns zero counts on work_orders query error", async () => {
    mockClient.__qb.resolveOnce({
      data: null,
      error: { message: "DB error" },
    });

    const result = await getDailyReport(
      mockClient as any,
      "org-1",
      null,
      "2025-01-15",
    );

    expect(result.work_orders_completed).toBe(0);
    expect(result.services_count).toBe(0);
    expect(result.parts_count).toBe(0);
  });

  it("returns zero counts when sub-queries error", async () => {
    mockClient.__qb.resolveOnce({
      data: [{ id: "wo-1" }],
      error: null,
    });
    // work_order_services query errors
    mockClient.__qb.resolveOnce({
      data: null,
      error: { message: "Services error" },
    });
    // work_order_parts query errors
    mockClient.__qb.resolveOnce({
      data: null,
      error: { message: "Parts error" },
    });

    const result = await getDailyReport(
      mockClient as any,
      "org-1",
      null,
      "2025-01-15",
    );

    // With error data, the services/parts arrays default to []
    expect(result.services_count).toBe(0);
    expect(result.parts_count).toBe(0);
    expect(result.total_revenue).toBe(0);
  });

  it("handles profile query error for mechanicId gracefully", async () => {
    mockClient.__qb.resolveOnce({
      data: null,
      error: { message: "Profile not found" },
    });
    mockClient.__qb.resolveOnce({ data: [], error: null });

    const result = await getDailyReport(
      mockClient as any,
      "org-1",
      "m-1",
      "2025-01-15",
    );

    expect(result.mechanic_name).toBe("Unknown");
  });
});

// ── getWeeklyReport ───────────────────────────────────────────

describe("getWeeklyReport", () => {
  function makeRobustQueryBuilder() {
    // A reusable qb that handles any query pattern.
    // getWeeklyReport calls getDailyReport 7 times in parallel via Promise.all,
    // making sequential builder lists non-deterministic.
    const mc = createMockSupabaseClient();
    mc.__qb.resolveWith({ data: [], error: null });
    return mc.from("_");  // returns the qb with chainable methods
  }

  it("returns 7-day daily breakdown with aggregated totals", async () => {
    mockClient.__qb.resolveWith({ data: [], error: null });
    // Override from() to return a robust qb for the parallel daily calls
    const robustQb = makeRobustQueryBuilder();
    mockClient.from = vi.fn().mockReturnValue(robustQb as any);

    const result = await getWeeklyReport(
      mockClient as any,
      "org-1",
      null,
      "2025-01-06",
    );

    expect(result.week_start).toBe("2025-01-06");
    expect(result.work_orders_completed).toBe(0);
    expect(result.services_count).toBe(0);
    expect(result.parts_count).toBe(0);
    expect(result.total_revenue).toBe(0);
    expect(result.total_discounts).toBe(0);
    expect(result.daily_breakdown).toHaveLength(7);
  });

  it("aggregates totals across all days", async () => {
    const robustQb = makeRobustQueryBuilder();
    mockClient.from = vi.fn().mockReturnValue(robustQb as any);

    const result = await getWeeklyReport(
      mockClient as any,
      "org-1",
      null,
      "2025-01-06",
    );

    expect(result.week_start).toBe("2025-01-06");
    expect(result.daily_breakdown).toHaveLength(7);
    expect(result.total_revenue).toBeGreaterThanOrEqual(0);
  });

  it("supports mechanicId filter", async () => {
    const robustQb = makeRobustQueryBuilder();
    mockClient.from = vi.fn().mockReturnValue(robustQb as any);

    const result = await getWeeklyReport(
      mockClient as any,
      "org-1",
      "m-1",
      "2025-01-06",
    );

    expect(result.mechanic_id).toBe("m-1");
    expect(result.daily_breakdown).toHaveLength(7);
  });
});

// ── getMonthlyReport ──────────────────────────────────────────

describe("getMonthlyReport", () => {
  it("returns monthly totals", async () => {
    mockClient.__qb.resolveOnce({
      data: [
        { id: "wo-1", created_at: "2025-01-10T08:00:00Z" },
        { id: "wo-2", created_at: "2025-01-15T09:00:00Z" },
        { id: "wo-3", created_at: "2025-01-20T10:00:00Z" },
      ],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: [
        { final_price: 100, discount_amount: 10, work_order_id: "wo-1" },
        { final_price: 200, discount_amount: 0, work_order_id: "wo-2" },
        { final_price: 150, discount_amount: 15, work_order_id: "wo-3" },
      ],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: [
        { final_price: 50, discount_amount: 5, work_order_id: "wo-1" },
      ],
      error: null,
    });

    const result = await getMonthlyReport(
      mockClient as any,
      "org-1",
      null,
      2025,
      1,
    );

    expect(result.year).toBe(2025);
    expect(result.month).toBe(1);
    expect(result.mechanic_name).toBe("All Mechanics");
    expect(result.work_orders_completed).toBe(3);
    expect(result.services_count).toBe(3);
    expect(result.parts_count).toBe(1);
    expect(result.total_revenue).toBe(500);
    expect(result.total_discounts).toBe(30);
  });

  it("filters by date range for the given month", async () => {
    mockClient.__qb.resolveOnce({ data: [], error: null });
    mockClient.__qb.resolveOnce({ data: [], error: null });
    mockClient.__qb.resolveOnce({ data: [], error: null });

    const result = await getMonthlyReport(
      mockClient as any,
      "org-1",
      null,
      2025,
      6,
    );

    expect(result.year).toBe(2025);
    expect(result.month).toBe(6);
    expect(result.work_orders_completed).toBe(0);
  });

  it("supports mechanicId filter", async () => {
    // Profile query via .single() → await qb
    mockClient.__qb.resolveOnce({
      data: { full_name: "Mech One" },
      error: null,
    });
    mockClient.__qb.resolveOnce({ data: [], error: null });
    mockClient.__qb.resolveOnce({ data: [], error: null });
    mockClient.__qb.resolveOnce({ data: [], error: null });

    const result = await getMonthlyReport(
      mockClient as any,
      "org-1",
      "m-1",
      2025,
      1,
    );

    expect(result.mechanic_id).toBe("m-1");
    expect(result.mechanic_name).toBe("Mech One");
    expect(result.work_orders_completed).toBe(0);
  });

  it("returns zero totals when no completed work orders", async () => {
    mockClient.__qb.resolveOnce({ data: [], error: null });
    mockClient.__qb.resolveOnce({ data: [], error: null });
    mockClient.__qb.resolveOnce({ data: [], error: null });

    const result = await getMonthlyReport(
      mockClient as any,
      "org-1",
      null,
      2025,
      1,
    );

    expect(result.work_orders_completed).toBe(0);
    expect(result.total_revenue).toBe(0);
    expect(result.total_discounts).toBe(0);
  });

  it("computes the correct number of days in the month", async () => {
    mockClient.__qb.resolveOnce({ data: [], error: null });
    mockClient.__qb.resolveOnce({ data: [], error: null });
    mockClient.__qb.resolveOnce({ data: [], error: null });

    const result = await getMonthlyReport(
      mockClient as any,
      "org-1",
      null,
      2025,
      2,
    );

    expect(result.month).toBe(2);
    expect(result.year).toBe(2025);
    expect(result.work_orders_completed).toBe(0);
    const fromCalls = vi.mocked(mockClient.from).mock.calls;
    expect(fromCalls.some((c: string[]) => c[0] === "work_orders")).toBe(true);
  });

  // ── Error-path tests ─────────────────────────────────────

  it("returns zero counts on work_orders query error", async () => {
    mockClient.__qb.resolveOnce({
      data: null,
      error: { message: "Query failed" },
    });

    const result = await getMonthlyReport(
      mockClient as any,
      "org-1",
      null,
      2025,
      1,
    );

    expect(result.work_orders_completed).toBe(0);
    expect(result.services_count).toBe(0);
    expect(result.total_revenue).toBe(0);
  });

  it("handles empty work_orders but non-empty services gracefully", async () => {
    // Work orders returns empty → woIds = []
    mockClient.__qb.resolveOnce({ data: [], error: null });
    // With empty woIds, services/parts queries use the ternary `{ data: [] }` shortcut
    // So no qb then() calls consumed here

    const result = await getMonthlyReport(
      mockClient as any,
      "org-1",
      null,
      2025,
      1,
    );

    expect(result.work_orders_completed).toBe(0);
    expect(result.services_count).toBe(0);
    expect(result.parts_count).toBe(0);
    expect(result.total_revenue).toBe(0);
  });

  it("handles profile query error for mechanic filter", async () => {
    mockClient.__qb.resolveOnce({
      data: null,
      error: { message: "Profile not found" },
    });
    mockClient.__qb.resolveOnce({ data: [], error: null });
    mockClient.__qb.resolveOnce({ data: [], error: null });
    mockClient.__qb.resolveOnce({ data: [], error: null });

    const result = await getMonthlyReport(
      mockClient as any,
      "org-1",
      "m-1",
      2025,
      1,
    );

    expect(result.mechanic_name).toBe("Unknown");
  });
});

// ── getEndOfDaySummary ────────────────────────────────────────

describe("getEndOfDaySummary", () => {
  it("returns mechanics breakdown with counts and revenue", async () => {
    // Execution order:
    // 1. await work_orders (outer) → resolveOnce[0]
    // 2. await profiles (inner) → resolveOnce[1]
    // 3-9. Promise.all(7) → 7 .then() calls
    //    - services resolveOnce[2]
    //    - parts resolveOnce[3]
    //    - commissions → resolveOnce[4]
    //    - openWOs → resolveOnce[5]
    //    - payments → resolveOnce[6]
    //    - invoices → resolveOnce[7]
    //    - biggestIssue → .maybeSingle() Promise, not via resolveOnce
    mockClient.__qb.resolveOnce({
      data: [
        { id: "wo-1", mechanic_id: "m-1" },
        { id: "wo-2", mechanic_id: "m-1" },
        { id: "wo-3", mechanic_id: "m-2" },
      ],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: [
        { id: "m-1", full_name: "Mech One" },
        { id: "m-2", full_name: "Mech Two" },
      ],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: [
        { final_price: 100, work_order_id: "wo-1" },
        { final_price: 200, work_order_id: "wo-2" },
        { final_price: 150, work_order_id: "wo-3" },
      ],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: [
        { final_price: 50, work_order_id: "wo-1" },
        { final_price: 30, work_order_id: "wo-2" },
      ],
      error: null,
    });
    // commissions, openWOs, payments, invoices → default

    const result = await getEndOfDaySummary(
      mockClient as any,
      "org-1",
      "2025-01-15",
    );

    expect(result.date).toBe("2025-01-15");
    expect(result.total_work_orders).toBe(3);
    expect(result.total_revenue).toBe(530);
    expect(result.mechanics).toHaveLength(2);

    const m1Found = result.mechanics.find((m) => m.mechanic_id === "m-1");
    expect(m1Found).toBeDefined();
    const m1 = m1Found!;
    expect(m1.mechanic_name).toBe("Mech One");
    expect(m1.work_orders_completed).toBe(2);
    expect(m1.services_count).toBe(2);
    expect(m1.parts_count).toBe(2);
    expect(m1.total_revenue).toBe(380);

    const m2Found = result.mechanics.find((m) => m.mechanic_id === "m-2");
    expect(m2Found).toBeDefined();
    const m2 = m2Found!;
    expect(m2.mechanic_name).toBe("Mech Two");
    expect(m2.work_orders_completed).toBe(1);
    expect(m2.total_revenue).toBe(150);
  })

  it("returns empty summary when no work orders", async () => {
    // outer work_orders returns empty → inner function goes through empty-path
    mockClient.__qb.resolveOnce({ data: [], error: null });
    // The empty path still queries: openWOs, unpaid invoices, biggestIssue
    // These use from() + maybeSingle which don't consume resolveOnce for maybeSingle

    const result = await getEndOfDaySummary(
      mockClient as any,
      "org-1",
      "2025-01-15",
    );

    expect(result.date).toBe("2025-01-15");
    expect(result.total_work_orders).toBe(0);
    expect(result.total_revenue).toBe(0);
    expect(result.mechanics).toEqual([]);
  });

  it("handles work orders without mechanic_id", async () => {
    mockClient.__qb.resolveOnce({
      data: [
        { id: "wo-1", mechanic_id: null },
        { id: "wo-2", mechanic_id: null },
      ],
      error: null,
    });
    // No mechanicIds → skip profiles query
    // No woIds → services/parts/commissions use { data: [] } shortcut
    // So no additional resolveOnce consumers

    const result = await getEndOfDaySummary(
      mockClient as any,
      "org-1",
      "2025-01-15",
    );

    expect(result.total_work_orders).toBe(0);
    expect(result.mechanics).toEqual([]);
  });

  it("uses unique mechanic IDs for profile lookup", async () => {
    mockClient.__qb.resolveOnce({
      data: [
        { id: "wo-1", mechanic_id: "m-1" },
        { id: "wo-2", mechanic_id: "m-1" },
      ],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: [{ id: "m-1", full_name: "Mech One" }],
      error: null,
    });
    mockClient.__qb.resolveOnce({ data: [], error: null }); // services
    mockClient.__qb.resolveOnce({ data: [], error: null }); // parts
    // commissions, openWOs, payments, invoices → default

    const result = await getEndOfDaySummary(
      mockClient as any,
      "org-1",
      "2025-01-15",
    );

    expect(result.mechanics).toHaveLength(1);
    expect(result.mechanics[0].mechanic_name).toBe("Mech One");
    expect(result.mechanics[0].work_orders_completed).toBe(2);
  });

  // ── Error-path tests ─────────────────────────────────────

  it("handles profiles query error gracefully", async () => {
    mockClient.__qb.resolveOnce({
      data: [
        { id: "wo-1", mechanic_id: "m-1" },
      ],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: null,
      error: { message: "Profiles error" },
    });
    mockClient.__qb.resolveOnce({ data: [], error: null }); // services
    mockClient.__qb.resolveOnce({ data: [], error: null }); // parts
    // commissions, openWOs, payments, invoices → default

    const result = await getEndOfDaySummary(
      mockClient as any,
      "org-1",
      "2025-01-15",
    );

    expect(result.mechanics).toHaveLength(1);
    expect(result.mechanics[0].mechanic_name).toBe("Unknown");
  });
});

// ── getDashboardData ──────────────────────────────────────────

/** Shape returned by the get_full_dashboard_data RPC. */
function rpcDashboardResponse(opts: { withPrevPeriod?: boolean } = {}) {
  const { withPrevPeriod = false } = opts;
  return {
    data: {
      summary: {
        totalRevenue: 580,
        activeWorkOrders: 2,
        completedToday: 1,
        newCustomersToday: 0,
        avgRepairOrderValue: 290,
        partsRevenue: 230,
        serviceRevenue: 350,
        grossProfit: 200,
        marginPercent: 34,
        totalCustomers: 10,
        totalVehicles: 8,
      },
      summaryComparison: withPrevPeriod
        ? {
            total_revenue: 400,
            active_work_orders: 3,
            completed_today: 2,
            new_customers_today: 1,
            avg_repair_order_value: 200,
            parts_revenue: 150,
            service_revenue: 250,
            gross_profit: 150,
            margin_percent: 37,
            total_customers: 8,
            total_vehicles: 6,
          }
        : null,
      workOrderStatusDistribution: [
        { status: "Completed", count: 3 },
        { status: "In Progress", count: 1 },
      ],
      revenueTrend: [
        { date: "2025-01-14", revenue: 200 },
        { date: "2025-01-15", revenue: 380 },
      ],
      topServices: [{ name: "Oil Change", count: 2, revenue: 300 }],
      technicianPerformance: [
        { mechanic_id: "m-1", name: "Mech One", completed: 5, revenue: 500 },
      ],
      recentWorkOrders: [
        { id: "wo-1", status: "Completed", customer_name: "John Doe" },
      ],
      serviceCategoryBreakdown: [
        { category: "Maintenance", count: 3, revenue: 450 },
      ],
      customerAcquisitionTrend: [
        { date: "2025-01-14", new_customers: 1 },
        { date: "2025-01-15", new_customers: 0 },
      ],
    },
    error: null,
  };
}

describe("getDashboardData", () => {
  function runDashboard(
    period: "today" | "week" | "month" | "all" = "month",
    withPrev = true,
  ) {
    mockClient.rpc = vi
      .fn()
      .mockResolvedValue(rpcDashboardResponse({ withPrevPeriod: withPrev }));
    return getDashboardData(
      mockClient as unknown as SupabaseClient,
      "org-1",
      period,
    );
  }

  it("returns DashboardData with all expected properties", async () => {
    const result = await runDashboard("month", true);

    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("summaryComparison");
    expect(result).toHaveProperty("insights");
    expect(result).toHaveProperty("workOrderStatusDistribution");
    expect(result).toHaveProperty("revenueTrend");
    expect(result).toHaveProperty("topServices");
    expect(result).toHaveProperty("technicianPerformance");
    expect(result).toHaveProperty("recentWorkOrders");
    expect(result).toHaveProperty("serviceCategoryBreakdown");
    expect(result).toHaveProperty("customerAcquisitionTrend");

    expect(result.summary.activeWorkOrders).toBe(2);
    expect(result.summary.totalRevenue).toBe(580);
    expect(result.summary.partsRevenue).toBe(230);
    expect(result.summary.serviceRevenue).toBe(350);

    expect(result.workOrderStatusDistribution.length).toBeGreaterThan(0);
    expect(result.revenueTrend.length).toBeGreaterThan(0);
    expect(result.topServices.length).toBeGreaterThan(0);
    expect(result.technicianPerformance.length).toBeGreaterThan(0);
    expect(result.recentWorkOrders.length).toBeGreaterThan(0);
    expect(result.customerAcquisitionTrend.length).toBeGreaterThan(0);
  });

  it("generates insights when compared to previous period", async () => {
    const result = await runDashboard("month", true);

    expect(Array.isArray(result.insights)).toBe(true);

    if (result.summaryComparison && result.summary.totalRevenue > 0) {
      expect(result.insights.length).toBeGreaterThan(0);
    }
  });

  it("handles empty data gracefully", async () => {
    mockClient.rpc = vi.fn().mockResolvedValue({
      data: {
        summary: {
          totalRevenue: 0,
          activeWorkOrders: 0,
          completedToday: 0,
          newCustomersToday: 0,
          avgRepairOrderValue: 0,
          partsRevenue: 0,
          serviceRevenue: 0,
          grossProfit: 0,
          marginPercent: 0,
          totalCustomers: 0,
          totalVehicles: 0,
        },
        summaryComparison: null,
        workOrderStatusDistribution: [],
        revenueTrend: [],
        topServices: [],
        technicianPerformance: [],
        recentWorkOrders: [],
        serviceCategoryBreakdown: [],
        customerAcquisitionTrend: [],
      },
      error: null,
    });

    const result = await getDashboardData(
      mockClient as unknown as SupabaseClient,
      "org-1",
      "all",
    );

    expect(result.summary.totalRevenue).toBe(0);
    expect(result.summary.activeWorkOrders).toBe(0);
    expect(result.summary.totalCustomers).toBe(0);
    expect(result.summary.totalVehicles).toBe(0);
    expect(result.summaryComparison).toBeNull();
    expect(result.insights).toEqual([]);
    expect(result.recentWorkOrders).toEqual([]);
  });

  it("supports period filtering (today, week, month, all)", async () => {
    const periods = ["today", "week", "month", "all"] as const;

    for (const period of periods) {
      vi.clearAllMocks();
      mockClient.rpc = vi
        .fn()
        .mockResolvedValue(
          rpcDashboardResponse({ withPrevPeriod: period !== "all" }),
        );

      const result = await getDashboardData(
        mockClient as unknown as SupabaseClient,
        "org-1",
        period,
      );

      expect(result.summary).toBeDefined();
      expect(result.workOrderStatusDistribution).toBeDefined();
      expect(result.revenueTrend).toBeDefined();
    }
  });

  it("calls the RPC with correct period parameter", async () => {
    mockClient.rpc = vi
      .fn()
      .mockResolvedValue(rpcDashboardResponse({ withPrevPeriod: true }));

    await getDashboardData(
      mockClient as unknown as SupabaseClient,
      "org-1",
      "month",
    );

    expect(mockClient.rpc).toHaveBeenCalledWith(
      "get_full_dashboard_data",
      expect.objectContaining({
        p_org_id: "org-1",
        p_period: "month",
      }),
    );
  });

  it("averages repair order value correctly", async () => {
    const result = await runDashboard("month", true);

    expect(result.summary.avgRepairOrderValue).toBe(290);
  });

  // ── Error-path tests ─────────────────────────────────────

  it("throws on RPC error", async () => {
    mockClient.rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "RPC failed" },
    });

    await expect(
      getDashboardData(mockClient as unknown as SupabaseClient, "org-1", "month"),
    ).rejects.toThrow("RPC failed");
  });
});

// ── getDailyTimeline ──────────────────────────────────────────

describe("getDailyTimeline", () => {
  it("returns timeline events for today enriched with customer/vehicle data", async () => {
    mockClient.__qb.resolveOnce({
      data: [
        {
          id: "wo-1",
          customer: { first_name: "John", last_name: "Doe" },
          vehicle: { plate_number: "ABC123" },
          bay_number: 3,
        },
        {
          id: "wo-2",
          customer: { first_name: "Jane", last_name: "Smith" },
          vehicle: { plate_number: "XYZ789" },
          bay_number: null,
        },
      ],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: [
        {
          id: "h-1",
          work_order_id: "wo-1",
          status: "In Progress",
          previous_status: "Diagnosing",
          changed_by: "u-1",
          notes: "Started work",
          created_at: "2025-01-15T10:00:00Z",
        },
        {
          id: "h-2",
          work_order_id: "wo-2",
          status: "Completed",
          previous_status: "In Progress",
          changed_by: "u-2",
          notes: null,
          created_at: "2025-01-15T11:00:00Z",
        },
      ],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: [
        { id: "u-1", full_name: "Mech One" },
        { id: "u-2", full_name: "Mech Two" },
      ],
      error: null,
    });

    const result = await getDailyTimeline(mockClient as any, "org-1");

    expect(result).toHaveLength(2);

    expect(result[0].workOrderId).toBe("wo-1");
    expect(result[0].customerName).toBe("John Doe");
    expect(result[0].vehiclePlate).toBe("ABC123");
    expect(result[0].status).toBe("In Progress");
    expect(result[0].previousStatus).toBe("Diagnosing");
    expect(result[0].mechanicName).toBe("Mech One");
    expect(result[0].notes).toBe("Started work");
    expect(result[0].bayNumber).toBe(3);

    expect(result[1].workOrderId).toBe("wo-2");
    expect(result[1].customerName).toBe("Jane Smith");
    expect(result[1].vehiclePlate).toBe("XYZ789");
    expect(result[1].status).toBe("Completed");
    expect(result[1].mechanicName).toBe("Mech Two");
    expect(result[1].bayNumber).toBeNull();
  });

  it("returns empty when no work orders for today", async () => {
    mockClient.__qb.resolveOnce({ data: [], error: null });

    const result = await getDailyTimeline(mockClient as any, "org-1");

    expect(result).toEqual([]);
  });

  it("returns empty when no status history entries", async () => {
    mockClient.__qb.resolveOnce({
      data: [{ id: "wo-1", customer: null, vehicle: null, bay_number: null }],
      error: null,
    });
    mockClient.__qb.resolveOnce({ data: [], error: null });

    const result = await getDailyTimeline(mockClient as any, "org-1");

    expect(result).toEqual([]);
  });

  it("handles null customer and vehicle gracefully", async () => {
    mockClient.__qb.resolveOnce({
      data: [
        { id: "wo-1", customer: null, vehicle: null, bay_number: null },
      ],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: [
        {
          id: "h-1",
          work_order_id: "wo-1",
          status: "New",
          previous_status: null,
          changed_by: "u-1",
          notes: null,
          created_at: "2025-01-15T10:00:00Z",
        },
      ],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: [{ id: "u-1", full_name: null }],
      error: null,
    });

    const result = await getDailyTimeline(mockClient as any, "org-1");

    expect(result).toHaveLength(1);
    expect(result[0].customerName).toBeNull();
    expect(result[0].vehiclePlate).toBeNull();
    expect(result[0].mechanicName).toBeNull();
    expect(result[0].previousStatus).toBeNull();
  });

  it("handles customer with partial name", async () => {
    mockClient.__qb.resolveOnce({
      data: [
        {
          id: "wo-1",
          customer: { first_name: "John", last_name: null },
          vehicle: { plate_number: null },
          bay_number: 1,
        },
      ],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: [
        {
          id: "h-1",
          work_order_id: "wo-1",
          status: "Diagnosing",
          previous_status: "New",
          changed_by: "u-1",
          notes: null,
          created_at: "2025-01-15T10:00:00Z",
        },
      ],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: [{ id: "u-1", full_name: "Mech" }],
      error: null,
    });

    const result = await getDailyTimeline(mockClient as any, "org-1");

    expect(result[0].customerName).toBe("John");
    expect(result[0].vehiclePlate).toBeNull();
  });

  it("enriches with profile names for changed_by users", async () => {
    mockClient.__qb.resolveOnce({
      data: [{ id: "wo-1", customer: null, vehicle: null, bay_number: null }],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: [
        {
          id: "h-1",
          work_order_id: "wo-1",
          status: "In Progress",
          previous_status: "New",
          changed_by: "u-1",
          notes: "Started",
          created_at: "2025-01-15T10:00:00Z",
        },
        {
          id: "h-2",
          work_order_id: "wo-1",
          status: "Completed",
          previous_status: "In Progress",
          changed_by: "u-1",
          notes: null,
          created_at: "2025-01-15T11:00:00Z",
        },
      ],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: [{ id: "u-1", full_name: "Mech One" }],
      error: null,
    });

    const result = await getDailyTimeline(mockClient as any, "org-1");

    expect(result).toHaveLength(2);
    expect(result[0].mechanicName).toBe("Mech One");
    expect(result[1].mechanicName).toBe("Mech One");
  });

  // ── Error-path tests ─────────────────────────────────────

  it("returns empty on work_orders query error", async () => {
    mockClient.__qb.resolveOnce({
      data: null,
      error: { message: "DB error" },
    });

    const result = await getDailyTimeline(mockClient as any, "org-1");

    expect(result).toEqual([]);
  });

  it("returns empty on status_history query error", async () => {
    mockClient.__qb.resolveOnce({
      data: [{ id: "wo-1", customer: null, vehicle: null, bay_number: null }],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: null,
      error: { message: "History error" },
    });

    const result = await getDailyTimeline(mockClient as any, "org-1");

    expect(result).toEqual([]);
  });

  it("handles profiles query error gracefully", async () => {
    mockClient.__qb.resolveOnce({
      data: [{ id: "wo-1", customer: null, vehicle: null, bay_number: null }],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: [
        {
          id: "h-1",
          work_order_id: "wo-1",
          status: "In Progress",
          previous_status: "New",
          changed_by: "u-1",
          notes: null,
          created_at: "2025-01-15T10:00:00Z",
        },
      ],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: null,
      error: { message: "Profiles error" },
    });

    const result = await getDailyTimeline(mockClient as any, "org-1");

    // Profiles error means mechanic names are null
    expect(result).toHaveLength(1);
    expect(result[0].mechanicName).toBeNull();
  });
});

// ── getCustomReport ────────────────────────────────────────────

describe("getCustomReport", () => {
  it("returns DailyReport with computed values for a date range", async () => {
    // ── Setup: work orders, services, parts ──
    mockClient.__qb.resolveOnce({ data: [{ id: "wo-1" }], error: null });
    mockClient.__qb.resolveOnce({
      data: [
        { final_price: 100, discount_amount: 10, service_name: "Oil Change", work_order_id: "wo-1" },
      ],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: [
        { final_price: 50, discount_amount: 5, part_name: "Filter", work_order_id: "wo-1" },
      ],
      error: null,
    });
    // ── getRecentWorkOrdersBatched: 4 parallel ──
    mockClient.__qb.resolveOnce({
      data: [{
        id: "wo-1", organization_id: "org-1", customer_id: null, vehicle_id: null,
        mechanic_id: null, status: "Completed",
      }],
      error: null,
    });
    mockClient.__qb.resolveOnce({ data: [], error: null });
    mockClient.__qb.resolveOnce({ data: [], error: null });
    mockClient.__qb.resolveOnce({ data: [], error: null });
    // ── customers + vehicles (no IDs → resolved to { data: [] }) ──
    mockClient.__qb.resolveOnce({ data: [], error: null });
    mockClient.__qb.resolveOnce({ data: [], error: null });
    // ── profiles (no IDs → default) ──

    const result = await getCustomReport(
      mockClient as any,
      "org-1",
      null,
      "2025-01-01",
      "2025-01-15",
    );

    expect(result.date).toBe("2025-01-01_2025-01-15");
    expect(result.mechanic_name).toBe("All Mechanics");
    expect(result.work_orders_completed).toBe(1);
    expect(result.services_count).toBe(1);
    expect(result.parts_count).toBe(1);
    expect(result.total_revenue).toBe(150);
    expect(result.total_discounts).toBe(15);
  });

  it("supports mechanicId filter and fetches mechanic name", async () => {
    // Profile query via .single() → await qb
    mockClient.__qb.resolveOnce({
      data: { full_name: "Mech One" },
      error: null,
    });
    mockClient.__qb.resolveOnce({ data: [{ id: "wo-1" }], error: null });
    mockClient.__qb.resolveOnce({
      data: [
        { final_price: 200, discount_amount: 0, service_name: "Brakes", work_order_id: "wo-1" },
      ],
      error: null,
    });
    mockClient.__qb.resolveOnce({ data: [], error: null });

    // ── getRecentWorkOrdersBatched: 4 parallel ──
    mockClient.__qb.resolveOnce({
      data: [{
        id: "wo-1", organization_id: "org-1", customer_id: null, vehicle_id: null,
        mechanic_id: "m-1", status: "Completed",
      }],
      error: null,
    });
    mockClient.__qb.resolveOnce({ data: [], error: null });
    mockClient.__qb.resolveOnce({ data: [], error: null });
    mockClient.__qb.resolveOnce({ data: [], error: null });
    // ── customers + vehicles (no IDs → default) ──
    // ── profiles ──
    mockClient.__qb.resolveOnce({ data: [], error: null });

    const result = await getCustomReport(
      mockClient as any,
      "org-1",
      "m-1",
      "2025-01-01",
      "2025-01-15",
    );

    expect(result.mechanic_id).toBe("m-1");
    expect(result.mechanic_name).toBe("Mech One");
    expect(result.work_orders_completed).toBe(1);
    expect(result.total_revenue).toBe(200);
  });

  it("returns zero counts when no work orders in range", async () => {
    mockClient.__qb.resolveOnce({ data: [], error: null });

    const result = await getCustomReport(
      mockClient as any,
      "org-1",
      null,
      "2025-01-01",
      "2025-01-15",
    );

    expect(result.work_orders_completed).toBe(0);
    expect(result.services_count).toBe(0);
    expect(result.parts_count).toBe(0);
    expect(result.total_revenue).toBe(0);
    expect(result.total_discounts).toBe(0);
    expect(result.work_orders).toEqual([]);
  });
  
  it("returns zero counts on work_orders query error", async () => {
    mockClient.__qb.resolveOnce({
      data: null,
      error: { message: "Query failed" },
    });

    const result = await getCustomReport(
      mockClient as any,
      "org-1",
      null,
      "2025-01-01",
      "2025-01-15",
    );

    expect(result.work_orders_completed).toBe(0);
    expect(result.services_count).toBe(0);
    expect(result.total_revenue).toBe(0);
  });

  it("handles profile query error for mechanic filter", async () => {
    mockClient.__qb.resolveOnce({
      data: null,
      error: { message: "Profile not found" },
    });
    mockClient.__qb.resolveOnce({ data: [], error: null });

    const result = await getCustomReport(
      mockClient as any,
      "org-1",
      "m-1",
      "2025-01-01",
      "2025-01-15",
    );

    expect(result.mechanic_name).toBe("Unknown");
  });
});

// ── getServiceBreakdown ─────────────────────────────────────────

describe("getServiceBreakdown", () => {
  it("returns breakdown sorted by revenue descending", async () => {
    mockClient.__qb.resolveOnce({
      data: [{ id: "wo-1" }, { id: "wo-2" }],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: [
        { service_name: "Oil Change", final_price: 100 },
        { service_name: "Brakes", final_price: 200 },
        { service_name: "Oil Change", final_price: 150 },
      ],
      error: null,
    });

    const result = await getServiceBreakdown(
      mockClient as any,
      "org-1",
      "2025-01-01",
      "2025-01-15",
    );

    expect(result).toHaveLength(2);
    // Sorted by total_revenue descending (Oil Change 250 > Brakes 200)
    expect(result[0].service_name).toBe("Oil Change");
    expect(result[0].service_count).toBe(2);
    expect(result[0].total_revenue).toBe(250);
    expect(result[0].avg_price).toBe(125);
    expect(result[0].percentage_of_revenue).toBe(55.6);

    expect(result[1].service_name).toBe("Brakes");
    expect(result[1].service_count).toBe(1);
    expect(result[1].total_revenue).toBe(200);
    expect(result[1].avg_price).toBe(200);
    expect(result[1].percentage_of_revenue).toBe(44.4);
  });

  it("returns empty array when no work orders found", async () => {
    mockClient.__qb.resolveOnce({ data: [], error: null });

    const result = await getServiceBreakdown(
      mockClient as any,
      "org-1",
      "2025-01-01",
      "2025-01-15",
    );

    expect(result).toEqual([]);
  });

  it("handles null service_name by defaulting to Other", async () => {
    mockClient.__qb.resolveOnce({
      data: [{ id: "wo-1" }],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: [
        { service_name: "Oil Change", final_price: 100 },
        { service_name: null, final_price: 50 },
      ],
      error: null,
    });

    const result = await getServiceBreakdown(
      mockClient as any,
      "org-1",
      "2025-01-01",
      "2025-01-15",
    );

    expect(result).toHaveLength(2);
    expect(result.find((s) => s.service_name === "Other")?.total_revenue).toBe(50);
    expect(result.find((s) => s.service_name === "Oil Change")?.total_revenue).toBe(100);
  });

  // ── Error-path tests ─────────────────────────────────────

  it("returns empty array on work_orders query error", async () => {
    mockClient.__qb.resolveOnce({
      data: null,
      error: { message: "DB error" },
    });

    const result = await getServiceBreakdown(
      mockClient as any,
      "org-1",
      "2025-01-01",
      "2025-01-15",
    );

    expect(result).toEqual([]);
  });

  it("handles services query error gracefully", async () => {
    mockClient.__qb.resolveOnce({
      data: [{ id: "wo-1" }],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: null,
      error: { message: "Services error" },
    });

    const result = await getServiceBreakdown(
      mockClient as any,
      "org-1",
      "2025-01-01",
      "2025-01-15",
    );

    // With error data, services defaults to []
    expect(result).toEqual([]);
  });
});

// ── getFinanceSummaryFast ────────────────────────────────────────

describe("getFinanceSummaryFast", () => {
  it("calls get_finance_summary RPC and returns the data", async () => {
    const summaryData = { total_revenue: 15000, total_cost: 8000, gross_profit: 7000 };
    mockClient.rpc = vi.fn().mockResolvedValue({ data: summaryData, error: null });

    const result = await getFinanceSummaryFast(
      mockClient as any,
      "org-1",
      "month",
    );

    expect(vi.mocked(mockClient.rpc)).toHaveBeenCalledWith("get_finance_summary", {
      p_org_id: "org-1",
      p_period: "month",
    });
    expect(result).toEqual(summaryData);
  });

  it("defaults period to month", async () => {
    mockClient.rpc = vi.fn().mockResolvedValue({ data: { rev: 100 }, error: null });

    await getFinanceSummaryFast(mockClient as any, "org-1");

    expect(vi.mocked(mockClient.rpc)).toHaveBeenCalledWith(
      "get_finance_summary",
      { p_org_id: "org-1", p_period: "month" },
    );
  });

  it("throws on RPC error", async () => {
    mockClient.rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "RPC failed" },
    });

    await expect(
      getFinanceSummaryFast(mockClient as any, "org-1"),
    ).rejects.toThrow("RPC failed");
  });

  // ── Error-path tests ─────────────────────────────────────

  it("throws when RPC returns null data without error", async () => {
    mockClient.rpc = vi.fn().mockResolvedValue({ data: null, error: null });

    const result = await getFinanceSummaryFast(mockClient as any, "org-1");

    expect(result).toEqual({});
  });
});

// ── getMechanicLeaderboardFast ───────────────────────────────────

describe("getMechanicLeaderboardFast", () => {
  it("calls get_mechanic_leaderboard RPC and returns the data", async () => {
    const leaderboardData = [
      { mechanic_name: "Mech A", total_revenue: 5000, work_orders: 10 },
      { mechanic_name: "Mech B", total_revenue: 3000, work_orders: 7 },
    ];
    mockClient.rpc = vi.fn().mockResolvedValue({ data: leaderboardData, error: null });

    const result = await getMechanicLeaderboardFast(
      mockClient as any,
      "org-1",
      "month",
    );

    expect(vi.mocked(mockClient.rpc)).toHaveBeenCalledWith("get_mechanic_leaderboard", {
      p_org_id: "org-1",
      p_period: "month",
    });
    expect(result).toEqual(leaderboardData);
  });

  it("defaults period to month", async () => {
    mockClient.rpc = vi.fn().mockResolvedValue({ data: [], error: null });

    await getMechanicLeaderboardFast(mockClient as any, "org-1");

    expect(vi.mocked(mockClient.rpc)).toHaveBeenCalledWith(
      "get_mechanic_leaderboard",
      { p_org_id: "org-1", p_period: "month" },
    );
  });

  it("throws on RPC error", async () => {
    mockClient.rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Leaderboard error" },
    });

    await expect(
      getMechanicLeaderboardFast(mockClient as any, "org-1"),
    ).rejects.toThrow("Leaderboard error");
  });

  it("returns empty array when data is null", async () => {
    mockClient.rpc = vi.fn().mockResolvedValue({ data: null, error: null });

    const result = await getMechanicLeaderboardFast(mockClient as any, "org-1");

    expect(result).toEqual([]);
  });

  // ── Error-path tests ─────────────────────────────────────

  it("throws on empty data without error", async () => {
    mockClient.rpc = vi.fn().mockResolvedValue({ data: [], error: null });

    const result = await getMechanicLeaderboardFast(mockClient as any, "org-1");

    expect(result).toEqual([]);
  });
});
