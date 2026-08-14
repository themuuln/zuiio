import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

// Deterministic date math regardless of host timezone.
process.env.TZ = "UTC";

vi.mock("@/lib/supabase/query", () => ({
  withDbCapture: vi.fn(
    (_label: string, promise: PromiseLike<unknown>) => promise,
  ),
}));
vi.mock("@/lib/supabase/with-branch", () => ({
  withBranchFilter: vi.fn((query: unknown) => query),
}));

const siblingMocks = vi.hoisted(() => ({
  getRecentWorkOrdersBatched: vi.fn(),
  calculateProfitability: vi.fn(),
  getComparisonData: vi.fn(),
  getMechanicKpis: vi.fn(),
}));

vi.mock("../report-service/queries", () => ({
  getRecentWorkOrdersBatched: siblingMocks.getRecentWorkOrdersBatched,
}));
vi.mock("../report-service/profitability", () => ({
  calculateProfitability: siblingMocks.calculateProfitability,
  getComparisonData: siblingMocks.getComparisonData,
}));
vi.mock("../report-service/mechanics", () => ({
  getMechanicKpis: siblingMocks.getMechanicKpis,
}));

import { withDbCapture } from "@/lib/supabase/query";
import { withBranchFilter } from "@/lib/supabase/with-branch";

const mockWithDbCapture = vi.mocked(withDbCapture);
const mockWithBranchFilter = vi.mocked(withBranchFilter);

import {
  getCustomReport,
  getDailyReport,
  getFinanceSummaryFast,
  getMechanicLeaderboardFast,
  getMonthlyReport,
  getServiceBreakdown,
  getWeeklyReport,
} from "../report-service/reports";

const ORG_ID = "org-1";
const MECHANIC_ID = "m-1";
const BRANCH_ID = "b-1";

const PROFITABILITY = {
  gross_profit: 120,
  margin_percent: 40,
  service_revenue: 200,
  service_cost: 80,
  parts_revenue: 100,
  parts_cost: 40,
  total_cost: 120,
  effective_labor_rate: 100,
  avg_repair_order: 300,
  parts_to_labor_ratio: 0.5,
};

function makeComparison(overrides: Record<string, unknown> = {}) {
  return {
    work_orders_completed: 1,
    total_revenue: 100,
    services_count: 1,
    parts_count: 0,
    revenue_change_pct: null,
    work_orders_change_pct: null,
    ...overrides,
  };
}

let db: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
  mockWithBranchFilter.mockImplementation((query) => query);
  siblingMocks.getRecentWorkOrdersBatched.mockResolvedValue([]);
  siblingMocks.calculateProfitability.mockResolvedValue(PROFITABILITY);
  siblingMocks.getComparisonData.mockResolvedValue(makeComparison());
  siblingMocks.getMechanicKpis.mockResolvedValue([]);
});

// ── getDailyReport ──────────────────────────────────────────────

describe("getDailyReport", () => {
  it("aggregates services/parts and patches the comparison", async () => {
    db.__qb.resolveOnce({
      data: [{ id: "wo-1" }, { id: "wo-2" }],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        {
          work_order_id: "wo-1",
          final_price: 100,
          discount_amount: 10,
          service_name: "Oil Change",
        },
        {
          work_order_id: "wo-2",
          final_price: 50,
          discount_amount: null,
          service_name: "Brake",
        },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        {
          work_order_id: "wo-1",
          final_price: 30,
          discount_amount: 5,
          part_name: "Filter",
        },
      ],
      error: null,
    });

    siblingMocks.getRecentWorkOrdersBatched.mockResolvedValue([
      { id: "wo-1", status: "Completed" },
      { id: "wo-2", status: "Completed" },
    ]);
    siblingMocks.getComparisonData.mockResolvedValue(
      makeComparison({ work_orders_completed: 1, total_revenue: 100 }),
    );
    siblingMocks.getMechanicKpis.mockResolvedValue([
      {
        mechanic_id: MECHANIC_ID,
        mechanic_name: "Mia",
        work_orders_completed: 2,
        services_count: 2,
        parts_count: 1,
        total_revenue: 180,
        avg_revenue_per_wo: 90,
        avg_satisfaction: null,
        total_reviews: 0,
        recent_reviews: [],
      },
    ]);

    const result = await getDailyReport(
      db as never,
      ORG_ID,
      null,
      "2025-06-15",
    );

    expect(result).toMatchObject({
      date: "2025-06-15",
      mechanic_id: "",
      mechanic_name: "All Mechanics",
      work_orders_completed: 2,
      services_count: 2,
      parts_count: 1,
      total_revenue: 180,
      total_discounts: 15,
      profitability: PROFITABILITY,
    });
    expect(result.work_orders).toEqual([
      { id: "wo-1", status: "Completed" },
      { id: "wo-2", status: "Completed" },
    ]);
    expect(result.comparison).toEqual(
      makeComparison({
        work_orders_completed: 1,
        total_revenue: 100,
        revenue_change_pct: 80, // (180-100)/100*100
        work_orders_change_pct: 100, // (2-1)/1*100
      }),
    );
    expect(result.comparison?.revenue_change_pct).toBe(80); // (180-100)/100*100
    expect(result.comparison?.work_orders_change_pct).toBe(100); // (2-1)/1*100

    expect(siblingMocks.getRecentWorkOrdersBatched).toHaveBeenCalledWith(db, [
      "wo-1",
      "wo-2",
    ]);
    expect(siblingMocks.calculateProfitability).toHaveBeenCalledWith(db, [
      "wo-1",
      "wo-2",
    ]);
    expect(siblingMocks.getComparisonData).toHaveBeenCalledWith(
      db,
      ORG_ID,
      "2025-06-15",
      "2025-06-15",
      null,
      null,
    );
    expect(siblingMocks.getMechanicKpis).toHaveBeenCalledWith(db, ORG_ID, [
      "wo-1",
      "wo-2",
    ]);
  });

  it("scopes the work orders query to the org, date, and completed status", async () => {
    db.__qb.resolveOnce({ data: [{ id: "wo-1" }], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });

    await getDailyReport(db as never, ORG_ID, null, "2025-06-15");

    const woQuery = db.from("work_orders");
    expect(woQuery.eq).toHaveBeenCalledWith("organization_id", ORG_ID);
    expect(woQuery.eq).toHaveBeenCalledWith("status", "Completed");
    expect(woQuery.gte).toHaveBeenCalledWith(
      "created_at",
      "2025-06-15T00:00:00",
    );
    expect(woQuery.lte).toHaveBeenCalledWith(
      "created_at",
      "2025-06-15T23:59:59",
    );
    expect(woQuery.is).toHaveBeenCalledWith("deleted_at", null);
  });

  it("resolves the mechanic name and filters by mechanic", async () => {
    db.__qb.resolveOnce({ data: { full_name: "Mia" }, error: null });
    db.__qb.resolveOnce({ data: [{ id: "wo-1" }], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await getDailyReport(
      db as never,
      ORG_ID,
      MECHANIC_ID,
      "2025-06-15",
    );

    expect(result.mechanic_name).toBe("Mia");
    expect(result.mechanic_id).toBe(MECHANIC_ID);
    expect(db.from("profiles").eq).toHaveBeenCalledWith("id", MECHANIC_ID);
    expect(db.from("work_orders").eq).toHaveBeenCalledWith(
      "mechanic_id",
      MECHANIC_ID,
    );
    // mechanic KPIs skipped when a single mechanic is selected
    expect(siblingMocks.getMechanicKpis).not.toHaveBeenCalled();
  });

  it("falls back to Unknown when the mechanic profile is missing", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await getDailyReport(
      db as never,
      ORG_ID,
      MECHANIC_ID,
      "2025-06-15",
    );

    expect(result.mechanic_name).toBe("Unknown");
  });

  it("filters by branch when branchId is provided", async () => {
    db.__qb.resolveOnce({ data: [{ id: "wo-1" }], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });

    await getDailyReport(db as never, ORG_ID, null, "2025-06-15", BRANCH_ID);

    expect(db.from("work_orders").eq).toHaveBeenCalledWith(
      "branch_id",
      BRANCH_ID,
    );
  });

  it("returns zeros and skips detail queries on an empty day", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await getDailyReport(
      db as never,
      ORG_ID,
      null,
      "2025-06-15",
    );

    expect(result).toMatchObject({
      work_orders_completed: 0,
      services_count: 0,
      parts_count: 0,
      total_revenue: 0,
      total_discounts: 0,
      work_orders: [],
      comparison: makeComparison({
        revenue_change_pct: -100, // (0-100)/100*100
        work_orders_change_pct: -100, // (0-1)/1*100
      }),
      profitability: PROFITABILITY,
    });
    expect(db.from).not.toHaveBeenCalledWith("work_order_services");
    expect(db.from).not.toHaveBeenCalledWith("work_order_parts");
    expect(siblingMocks.getRecentWorkOrdersBatched).not.toHaveBeenCalled();
    expect(siblingMocks.calculateProfitability).toHaveBeenCalledWith(db, []);
    expect(siblingMocks.getMechanicKpis).toHaveBeenCalledWith(db, ORG_ID, []);
  });
});

// ── getCustomReport ─────────────────────────────────────────────

describe("getCustomReport", () => {
  it("aggregates a date range and always computes mechanic KPIs", async () => {
    db.__qb.resolveOnce({ data: { full_name: "Mia" }, error: null });
    db.__qb.resolveOnce({ data: [{ id: "wo-1" }], error: null });
    db.__qb.resolveOnce({
      data: [
        {
          work_order_id: "wo-1",
          final_price: "100",
          discount_amount: null,
          service_name: "Oil Change",
        },
      ],
      error: null,
    });
    db.__qb.resolveOnce({ data: [], error: null });

    siblingMocks.getComparisonData.mockResolvedValue(
      makeComparison({ work_orders_completed: 2, total_revenue: 50 }),
    );

    const result = await getCustomReport(
      db as never,
      ORG_ID,
      MECHANIC_ID,
      "2025-06-01",
      "2025-06-10",
    );

    expect(result).toMatchObject({
      date: "2025-06-01_2025-06-10",
      mechanic_id: MECHANIC_ID,
      mechanic_name: "Mia",
      work_orders_completed: 1,
      services_count: 1,
      parts_count: 0,
      total_revenue: 100,
      total_discounts: 0,
    });
    expect(result.comparison?.revenue_change_pct).toBe(100); // (100-50)/50*100
    expect(result.comparison?.work_orders_change_pct).toBe(-50); // (1-2)/2*100
    expect(siblingMocks.getComparisonData).toHaveBeenCalledWith(
      db,
      ORG_ID,
      "2025-06-01",
      "2025-06-10",
      MECHANIC_ID,
      null,
    );
    // custom reports compute mechanic KPIs even with a mechanic filter
    expect(siblingMocks.getMechanicKpis).toHaveBeenCalledWith(db, ORG_ID, [
      "wo-1",
    ]);
  });

  it("returns zeros for an empty range", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await getCustomReport(
      db as never,
      ORG_ID,
      null,
      "2025-06-01",
      "2025-06-10",
    );

    expect(result).toMatchObject({
      work_orders_completed: 0,
      total_revenue: 0,
      work_orders: [],
    });
    expect(db.from).not.toHaveBeenCalledWith("work_order_services");
    expect(db.from).not.toHaveBeenCalledWith("work_order_parts");
  });
});

// ── getWeeklyReport ─────────────────────────────────────────────

describe("getWeeklyReport", () => {
  it("builds a 7-day breakdown and totals across the week", async () => {
    // One WO on day 0 (2025-06-16); empty the rest.
    // getDailyReport awaits: wos per day (7), then services/parts interleaved.
    const queue: Array<{ data: unknown; error: null }> = [];
    queue.push({ data: [{ id: "wo-1" }], error: null });
    for (let i = 1; i < 7; i++) queue.push({ data: [], error: null });
    queue.push({
      data: [
        {
          work_order_id: "wo-1",
          final_price: 100,
          discount_amount: 0,
          service_name: "Oil Change",
        },
      ],
      error: null,
    });
    queue.push({ data: [], error: null });
    for (let i = 1; i < 7; i++) {
      queue.push({ data: [], error: null });
      queue.push({ data: [], error: null });
    }
    for (const v of queue) db.__qb.resolveOnce(v);

    siblingMocks.getComparisonData.mockResolvedValue(
      makeComparison({ work_orders_completed: 1, total_revenue: 90 }),
    );

    const result = await getWeeklyReport(
      db as never,
      ORG_ID,
      null,
      "2025-06-16",
    );

    expect(result).toMatchObject({
      week_start: "2025-06-16",
      week_end: "2025-06-22",
      mechanic_id: "",
      mechanic_name: "All Mechanics",
      work_orders_completed: 1,
      services_count: 1,
      parts_count: 0,
      total_revenue: 100,
      total_discounts: 0,
      profitability: PROFITABILITY,
    });
    expect(result.daily_breakdown).toHaveLength(7);
    expect(result.daily_breakdown[0].date).toBe("2025-06-16");
    expect(result.daily_breakdown[6].date).toBe("2025-06-22");
    expect(result.daily_breakdown[0]).toMatchObject({
      work_orders_completed: 1,
      services_count: 1,
      total_revenue: 100,
    });
    expect(result.daily_breakdown[1].work_orders_completed).toBe(0);
    expect(result.comparison?.revenue_change_pct).toBe(11.1); // (100-90)/90*100
    expect(result.comparison?.work_orders_change_pct).toBe(0);
    expect(siblingMocks.getComparisonData).toHaveBeenCalledWith(
      db,
      ORG_ID,
      "2025-06-16",
      "2025-06-22",
      null,
      null,
    );
    expect(siblingMocks.getMechanicKpis).toHaveBeenCalledWith(db, ORG_ID, [
      "wo-1",
    ]);
  });

  it("skips mechanic KPIs when a mechanic filter is set", async () => {
    // 7 days x (profile single + wos + services + parts) = 28 awaits
    for (let i = 0; i < 28; i++) {
      db.__qb.resolveOnce({ data: i % 4 === 0 ? null : [], error: null });
    }

    const result = await getWeeklyReport(
      db as never,
      ORG_ID,
      MECHANIC_ID,
      "2025-06-16",
    );

    expect(result.mechanic_id).toBe(MECHANIC_ID);
    expect(result.mechanic_name).toBe("Unknown");
    expect(result.mechanic_kpis).toEqual([]);
    expect(siblingMocks.getMechanicKpis).not.toHaveBeenCalled();
  });
});

// ── getMonthlyReport ────────────────────────────────────────────

describe("getMonthlyReport", () => {
  it("builds the weekly breakdown from already-fetched WOs", async () => {
    db.__qb.resolveOnce({
      data: [
        { id: "wo-1", created_at: "2025-06-05T10:00:00Z" },
        { id: "wo-2", created_at: "2025-06-20T10:00:00Z" },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        {
          work_order_id: "wo-1",
          final_price: "100",
          discount_amount: null,
        },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        { work_order_id: "wo-2", final_price: "50", discount_amount: "5" },
      ],
      error: null,
    });

    siblingMocks.getComparisonData.mockResolvedValue(
      makeComparison({ work_orders_completed: 2, total_revenue: 100 }),
    );

    const result = await getMonthlyReport(db as never, ORG_ID, null, 2025, 6);

    expect(result).toMatchObject({
      year: 2025,
      month: 6,
      mechanic_id: "",
      mechanic_name: "All Mechanics",
      work_orders_completed: 2,
      services_count: 1,
      parts_count: 1,
      total_revenue: 150,
      total_discounts: 5,
    });
    expect(result.comparison?.revenue_change_pct).toBe(50); // (150-100)/100*100
    expect(result.comparison?.work_orders_change_pct).toBe(0);
    expect(siblingMocks.getComparisonData).toHaveBeenCalledWith(
      db,
      ORG_ID,
      "2025-06-01",
      "2025-06-30",
      null,
      null,
    );
    expect(siblingMocks.getMechanicKpis).toHaveBeenCalledWith(db, ORG_ID, [
      "wo-1",
      "wo-2",
    ]);

    // June 2025 starts on a Sunday -> weeks aligned to Mondays May 26 .. Jun 30
    expect(result.weekly_breakdown).toHaveLength(6);
    expect(result.weekly_breakdown[0].week_start).toBe("2025-05-26");
    expect(result.weekly_breakdown[0].daily_breakdown).toHaveLength(7);
    expect(result.weekly_breakdown[3].week_start).toBe("2025-06-16");
    expect(result.weekly_breakdown[3]).toMatchObject({
      work_orders_completed: 1,
      parts_count: 1,
      total_revenue: 50,
      total_discounts: 5,
    });
    expect(result.weekly_breakdown[3].daily_breakdown[4].date).toBe(
      "2025-06-20",
    );
    expect(result.weekly_breakdown[5].week_start).toBe("2025-06-30");
    expect(result.weekly_breakdown[5].week_end).toBe("2025-07-06");
    expect(result.weekly_breakdown[5].daily_breakdown).toHaveLength(1);
  });

  it("returns an all-zero breakdown for an empty month", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await getMonthlyReport(db as never, ORG_ID, null, 2025, 6);

    expect(result).toMatchObject({
      work_orders_completed: 0,
      services_count: 0,
      parts_count: 0,
      total_revenue: 0,
      total_discounts: 0,
      weekly_breakdown: expect.any(Array),
    });
    expect(result.weekly_breakdown).toHaveLength(6);
    expect(
      result.weekly_breakdown.reduce(
        (sum, w) => sum + w.work_orders_completed,
        0,
      ),
    ).toBe(0);
    expect(db.from).not.toHaveBeenCalledWith("work_order_services");
    expect(siblingMocks.getMechanicKpis).toHaveBeenCalledWith(db, ORG_ID, []);
  });
});

// ── getServiceBreakdown ─────────────────────────────────────────

describe("getServiceBreakdown", () => {
  it("rolls up revenue, counts, and share per service name, sorted desc", async () => {
    db.__qb.resolveOnce({
      data: [{ id: "wo-1" }, { id: "wo-2" }, { id: "wo-3" }],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        { service_name: "Oil Change", final_price: 100 },
        { service_name: "Oil Change", final_price: 50 },
        { service_name: "Brake", final_price: 250 },
        { service_name: null, final_price: 30 },
      ],
      error: null,
    });

    const result = await getServiceBreakdown(
      db as never,
      ORG_ID,
      "2025-06-01",
      "2025-06-30",
    );

    expect(result).toEqual([
      {
        service_name: "Brake",
        service_count: 1,
        total_revenue: 250,
        avg_price: 250,
        percentage_of_revenue: 58.1,
      },
      {
        service_name: "Oil Change",
        service_count: 2,
        total_revenue: 150,
        avg_price: 75,
        percentage_of_revenue: 34.9,
      },
      {
        service_name: "Other",
        service_count: 1,
        total_revenue: 30,
        avg_price: 30,
        percentage_of_revenue: 7,
      },
    ]);
    expect(db.from("work_orders").eq).toHaveBeenCalledWith(
      "organization_id",
      ORG_ID,
    );
    expect(db.from("work_orders").eq).toHaveBeenCalledWith(
      "status",
      "Completed",
    );
    expect(db.from("work_orders").gte).toHaveBeenCalledWith(
      "created_at",
      "2025-06-01T00:00:00",
    );
    expect(db.from("work_orders").lte).toHaveBeenCalledWith(
      "created_at",
      "2025-06-30T23:59:59",
    );
  });

  it("passes the branch to withBranchFilter", async () => {
    db.__qb.resolveOnce({ data: [{ id: "wo-1" }], error: null });
    db.__qb.resolveOnce({ data: [], error: null });

    await getServiceBreakdown(
      db as never,
      ORG_ID,
      "2025-06-01",
      "2025-06-30",
      BRANCH_ID,
    );

    expect(mockWithBranchFilter).toHaveBeenLastCalledWith(
      expect.anything(),
      BRANCH_ID,
    );
  });

  it("returns [] when no completed WOs exist", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await getServiceBreakdown(
      db as never,
      ORG_ID,
      "2025-06-01",
      "2025-06-30",
    );

    expect(result).toEqual([]);
    expect(db.from).not.toHaveBeenCalledWith("work_order_services");
  });
});

// ── getFinanceSummaryFast ───────────────────────────────────────

describe("getFinanceSummaryFast", () => {
  it("returns the RPC result with the default month period", async () => {
    db.rpc.mockResolvedValueOnce({ data: { total_revenue: 100 }, error: null });

    const result = await getFinanceSummaryFast(db as never, ORG_ID);

    expect(result).toEqual({ total_revenue: 100 });
    expect(db.rpc).toHaveBeenCalledWith("get_finance_summary", {
      p_org_id: ORG_ID,
      p_period: "month",
    });
    expect(mockWithDbCapture).toHaveBeenCalledWith(
      "getFinanceSummaryFast",
      expect.anything(),
    );
  });

  it("passes the requested period to the RPC", async () => {
    db.rpc.mockResolvedValueOnce({ data: null, error: null });

    await getFinanceSummaryFast(db as never, ORG_ID, "day");

    expect(db.rpc).toHaveBeenCalledWith("get_finance_summary", {
      p_org_id: ORG_ID,
      p_period: "day",
    });
  });

  it("returns {} when the RPC returns no data", async () => {
    db.rpc.mockResolvedValueOnce({ data: null, error: null });

    const result = await getFinanceSummaryFast(db as never, ORG_ID, "week");

    expect(result).toEqual({});
  });

  it("throws when the RPC returns an error", async () => {
    db.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "rpc fail" },
    });

    await expect(getFinanceSummaryFast(db as never, ORG_ID)).rejects.toThrow(
      "rpc fail",
    );
  });
});

// ── getMechanicLeaderboardFast ──────────────────────────────────

describe("getMechanicLeaderboardFast", () => {
  it("returns the RPC rows", async () => {
    db.rpc.mockResolvedValueOnce({
      data: [{ id: "m-1", revenue: 100 }],
      error: null,
    });

    const result = await getMechanicLeaderboardFast(
      db as never,
      ORG_ID,
      "week",
    );

    expect(result).toEqual([{ id: "m-1", revenue: 100 }]);
    expect(db.rpc).toHaveBeenCalledWith("get_mechanic_leaderboard", {
      p_org_id: ORG_ID,
      p_period: "week",
    });
    expect(mockWithDbCapture).toHaveBeenCalledWith(
      "getMechanicLeaderboardFast",
      expect.anything(),
    );
  });

  it("returns [] when the RPC returns no data", async () => {
    db.rpc.mockResolvedValueOnce({ data: null, error: null });

    const result = await getMechanicLeaderboardFast(db as never, ORG_ID);

    expect(result).toEqual([]);
    expect(db.rpc).toHaveBeenCalledWith("get_mechanic_leaderboard", {
      p_org_id: ORG_ID,
      p_period: "month",
    });
  });

  it("throws when the RPC returns an error", async () => {
    db.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "leaderboard down" },
    });

    await expect(
      getMechanicLeaderboardFast(db as never, ORG_ID, "year"),
    ).rejects.toThrow("leaderboard down");
  });
});
