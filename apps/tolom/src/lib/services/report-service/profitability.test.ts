import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

vi.mock("@/lib/cache/with-cache", () => ({
  withCache: vi.fn((_keyParts: string[], fn: () => Promise<any>) => fn()),
}));

vi.mock("@/lib/supabase/with-branch", () => ({
  withBranchFilter: vi.fn((query: any) => query),
}));

import {
  calculateProfitability,
  getComparisonData,
  getDashboardProfitSummary,
  getPnLSummary,
  getPreviousPeriodSummary,
  getWorkOrderProfit,
} from "./profitability";

// ── Helpers ──────────────────────────────────────────────────

function makeServicesBuilder(data?: Record<string, any>[]) {
  return {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn((resolve: any) =>
      resolve({
        data: data ?? null,
        error: null,
        count: null,
        status: 200,
        statusText: "OK",
      }),
    ),
  };
}

function makeEmptyBuilder() {
  return makeServicesBuilder([]);
}

let mockClient: ReturnType<typeof createMockSupabaseClient>;

beforeEach(() => {
  vi.clearAllMocks();
  mockClient = createMockSupabaseClient();
  mockClient.rpc = vi.fn();
});

// ── calculateProfitability ──────────────────────────────────

describe("calculateProfitability", () => {
  it("returns null for empty work order array", async () => {
    const result = await calculateProfitability(
      mockClient as any,
      [],
    );
    expect(result).toBeNull();
  });

  it("computes revenue, cost, profit, and margin from services and parts", async () => {
    // work_order_services returns data
    // work_order_parts returns data
    const svcBuilder = makeServicesBuilder([
      { final_price: 100000, unit_cost: 40000, quantity: 1 },
      { final_price: 200000, unit_cost: 80000, quantity: 2 },
    ]);
    const partsBuilder = makeServicesBuilder([
      { final_price: 50000, unit_cost: 30000, quantity: 1 },
    ]);

    const fromCalls: Record<string, any> = {
      work_order_services: svcBuilder,
      work_order_parts: partsBuilder,
    };
    mockClient.from = vi.fn((table: string) => fromCalls[table] ?? makeEmptyBuilder());

    const result = await calculateProfitability(
      mockClient as any,
      ["wo-1", "wo-2"],
    );

    expect(result).not.toBeNull();
    expect(result!.service_revenue).toBe(300000); // 100000 + 200000
    expect(result!.service_cost).toBe(200000); // 40000*1 + 80000*2
    expect(result!.parts_revenue).toBe(50000);
    expect(result!.parts_cost).toBe(30000); // 30000*1
    expect(result!.total_cost).toBe(230000);
    expect(result!.gross_profit).toBe(120000); // 350000 - 230000
    expect(result!.margin_percent).toBe(34.3); // (120000/350000)*100 ≈ 34.285 -> 34.3
  });

  it("handles null unit_cost gracefully", async () => {
    const svcBuilder = makeServicesBuilder([
      { final_price: 100000, unit_cost: null, quantity: 1 },
    ]);
    const partsBuilder = makeServicesBuilder([
      { final_price: 50000, unit_cost: null, quantity: 1 },
    ]);

    mockClient.from = vi.fn((table: string) => {
      if (table === "work_order_services") return svcBuilder;
      if (table === "work_order_parts") return partsBuilder;
      return makeEmptyBuilder();
    });

    const result = await calculateProfitability(
      mockClient as any,
      ["wo-1"],
    );

    expect(result!.service_cost).toBe(0);
    expect(result!.parts_cost).toBe(0);
    expect(result!.gross_profit).toBe(150000); // 100000 + 50000
  });

  it("handles empty services/parts gracefully", async () => {
    mockClient.from = vi.fn(() => makeServicesBuilder([]));

    const result = await calculateProfitability(
      mockClient as any,
      ["wo-1"],
    );

    expect(result!.total_cost).toBe(0);
    expect(result!.gross_profit).toBe(0);
    expect(result!.margin_percent).toBe(0);
  });
});

// ── getWorkOrderProfit ─────────────────────────────────────

describe("getWorkOrderProfit", () => {
  it("computes profit for a single work order", async () => {
    const svcBuilder = makeServicesBuilder([
      { final_price: 150000, unit_cost: 60000, quantity: 1 },
    ]);
    const partsBuilder = makeServicesBuilder([
      { final_price: 30000, unit_cost: 15000, quantity: 2 },
    ]);

    mockClient.from = vi.fn((table: string) => {
      if (table === "work_order_services") return svcBuilder;
      if (table === "work_order_parts") return partsBuilder;
      return makeEmptyBuilder();
    });

    const result = await getWorkOrderProfit(
      mockClient as any,
      "wo-1",
      "org-1",
    );

    expect(result.totalRevenue).toBe(180000);
    expect(result.totalCost).toBe(90000); // 60000 + 15000*2
    expect(result.grossProfit).toBe(90000);
    expect(result.marginPercent).toBe(50); // (90000/180000)*100
  });

  it("handles empty services and parts", async () => {
    mockClient.from = vi.fn(() => makeServicesBuilder([]));

    const result = await getWorkOrderProfit(
      mockClient as any,
      "wo-1",
      "org-1",
    );

    expect(result.totalRevenue).toBe(0);
    expect(result.totalCost).toBe(0);
    expect(result.grossProfit).toBe(0);
    expect(result.marginPercent).toBe(0);
  });
});

// ── getPreviousPeriodSummary ────────────────────────────────

describe("getPreviousPeriodSummary", () => {
  it("returns null when period is 'all'", async () => {
    const result = await getPreviousPeriodSummary(
      mockClient as any,
      "org-1",
      "all",
    );
    expect(result).toBeNull();
  });

  it("returns empty summary when no WOs in previous period", async () => {
    // Make from() return empty array for work_orders
    const emptyBuilder = makeServicesBuilder([]);
    mockClient.from = vi.fn(() => emptyBuilder);

    const result = await getPreviousPeriodSummary(
      mockClient as any,
      "org-1",
      "today",
    );

    expect(result).not.toBeNull();
    expect(result!.totalRevenue).toBe(0);
    expect(result!.completedToday).toBe(0);
  });

  it("computes revenue from previous period WOs", async () => {
    // First call (work_orders) returns WO IDs
    const woBuilder = makeServicesBuilder([
      { id: "wo-1" },
      { id: "wo-2" },
    ]);

    // Second calls (services + parts) return data
    const svcBuilder = makeServicesBuilder([
      { final_price: 200000 },
      { final_price: 300000 },
    ]);
    const partsBuilder = makeServicesBuilder([
      { final_price: 100000 },
    ]);

    let callCount = 0;
    mockClient.from = vi.fn((table: string) => {
      callCount++;
      if (table === "work_orders") return woBuilder;
      if (table === "work_order_services") return svcBuilder;
      if (table === "work_order_parts") return partsBuilder;
      return makeEmptyBuilder();
    });

    const result = await getPreviousPeriodSummary(
      mockClient as any,
      "org-1",
      "today",
    );

    expect(result!.totalRevenue).toBe(600000); // 200000 + 300000 + 100000
    expect(result!.completedToday).toBe(2);
    expect(result!.serviceRevenue).toBe(500000);
    expect(result!.partsRevenue).toBe(100000);
  });
});

// ── getDashboardProfitSummary ──────────────────────────────

describe("getDashboardProfitSummary", () => {
  it("returns zero profits when no WOs exist", async () => {
    mockClient.from = vi.fn(() => makeServicesBuilder([]));

    const result = await getDashboardProfitSummary(
      mockClient as any,
      "org-1",
    );

    expect(result.todayProfit.totalRevenue).toBe(0);
    expect(result.todayProfit.grossProfit).toBe(0);
    expect(result.weekProfit.totalRevenue).toBe(0);
    expect(result.monthProfit.totalRevenue).toBe(0);
  });

  it("returns profits for today, week, and month periods", async () => {
    // Each from call returns WOs that then trigger nested services/parts queries
    // We need at least 3 from calls (today, week, month) for work_orders
    let woCallCount = 0;
    mockClient.from = vi.fn((table: string) => {
      if (table === "work_orders") {
        woCallCount++;
        // Return a WO so it proceeds to fetch services/parts
        return makeServicesBuilder([{ id: `wo-${woCallCount}` }]);
      }
      if (table === "work_order_services") {
        return makeServicesBuilder([
          { final_price: 100000, unit_cost: 40000, quantity: 1 },
        ]);
      }
      // Parts return empty so revenue = services only
      return makeServicesBuilder([]);
    });

    const result = await getDashboardProfitSummary(
      mockClient as any,
      "org-1",
    );

    // Each period computed 100K revenue - 40K cost = 60K profit
    expect(result.todayProfit.totalRevenue).toBe(100000);
    expect(result.todayProfit.grossProfit).toBe(60000);
    expect(result.weekProfit.totalRevenue).toBe(100000);
    expect(result.monthProfit.totalRevenue).toBe(100000);
  });
});

// ── getPnLSummary ──────────────────────────────────────────

describe("getPnLSummary", () => {
  it("returns full P&L summary with revenue, costs, and expenses", async () => {
    let fromCallCount = 0;
    mockClient.from = vi.fn((table: string) => {
      fromCallCount++;
      if (table === "work_orders") {
        return makeServicesBuilder([
          { id: "wo-1" },
          { id: "wo-2" },
        ]);
      }
      if (table === "work_order_services") {
        return makeServicesBuilder([
          { final_price: 500000, unit_cost: 200000, quantity: 1 },
        ]);
      }
      if (table === "work_order_parts") {
        return makeServicesBuilder([
          { final_price: 200000, unit_cost: 100000, quantity: 1 },
        ]);
      }
      if (table === "expenses") {
        return makeServicesBuilder([
          { amount: 50000, category: "Rent" },
          { amount: 30000, category: "Utilities" },
          { amount: 20000, category: "Rent" },
        ]);
      }
      return makeEmptyBuilder();
    });

    const result = await getPnLSummary(
      mockClient as any,
      "org-1",
      "2026-07-01",
      "2026-07-31",
    );

    expect(result.revenue.total).toBe(700000); // 500000 + 200000
    expect(result.cogs.total).toBe(300000); // 200000 + 100000
    expect(result.gross_profit).toBe(400000); // 700000 - 300000
    expect(result.gross_margin_pct).toBe(57.1); // (400000/700000)*100 ≈ 57.14
    expect(result.expenses.total).toBe(100000); // 50000 + 30000 + 20000
    expect(result.net_profit).toBe(300000); // 400000 - 100000
    // Expenses broken down by category
    expect(result.expenses.by_category).toHaveLength(2);
    expect(result.expenses.by_category[0].amount).toBe(70000); // Rent: 50000+20000
    expect(result.expenses.by_category[1].amount).toBe(30000); // Utilities
  });

  it("handles empty work order period", async () => {
    mockClient.from = vi.fn((table: string) => {
      if (table === "expenses") {
        return makeServicesBuilder([
          { amount: 20000, category: "Other" },
        ]);
      }
      return makeServicesBuilder([]);
    });

    const result = await getPnLSummary(
      mockClient as any,
      "org-1",
      "2026-07-01",
      "2026-07-31",
    );

    expect(result.revenue.total).toBe(0);
    expect(result.gross_profit).toBe(0);
    expect(result.expenses.total).toBe(20000);
    expect(result.net_profit).toBe(-20000);
  });
});

// ── getComparisonData ─────────────────────────────────────

describe("getComparisonData", () => {
  it("returns null when no previous period WOs exist", async () => {
    mockClient.from = vi.fn(() => makeServicesBuilder([]));

    const result = await getComparisonData(
      mockClient as any,
      "org-1",
      "2026-07-15",
      "2026-07-22",
      null,
      null,
    );

    expect(result).toBeNull();
  });

  it("computes previous period comparison data", async () => {
    const woBuilder = makeServicesBuilder([
      { id: "prev-1" },
      { id: "prev-2" },
    ]);
    const svcBuilder = makeServicesBuilder([
      { final_price: 200000 },
      { final_price: 300000 },
    ]);
    const partsBuilder = makeServicesBuilder([
      { final_price: 150000 },
    ]);

    let callCount = 0;
    mockClient.from = vi.fn((table: string) => {
      callCount++;
      if (table === "work_orders") return woBuilder;
      if (table === "work_order_services") return svcBuilder;
      if (table === "work_order_parts") return partsBuilder;
      return makeEmptyBuilder();
    });

    const result = await getComparisonData(
      mockClient as any,
      "org-1",
      "2026-07-15",
      "2026-07-22",
      null,
      "branch-1",
    );

    expect(result).not.toBeNull();
    expect(result!.work_orders_completed).toBe(2);
    expect(result!.total_revenue).toBe(650000); // 200000 + 300000 + 150000
    expect(result!.services_count).toBe(2);
    expect(result!.parts_count).toBe(1);
  });
});
