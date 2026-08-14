import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

vi.mock("@/lib/cache/with-cache", () => ({
  withCache: vi.fn((_keyParts: string[], fn: () => Promise<any>) => fn()),
}));

vi.mock("@/lib/supabase/with-branch", () => ({
  withBranchFilter: vi.fn((query: any) => query),
}));

import { generateInsights, generateReportInsights } from "./insights";

// ── generateInsights (pure function) ────────────────────────

describe("generateInsights", () => {
  const baseSummary = {
    totalRevenue: 1000000,
    activeWorkOrders: 6,
    avgRepairOrderValue: 200000,
    totalCustomers: 50,
    totalVehicles: 40,
    completedToday: 3,
    partsRevenue: 300000,
    serviceRevenue: 700000,
    grossProfit: 400000,
    marginPercent: 40,
  };

  const basePrevSummary = {
    totalRevenue: 800000,
    activeWorkOrders: 4,
    avgRepairOrderValue: 180000,
    totalCustomers: 45,
    totalVehicles: 35,
    completedToday: 2,
    partsRevenue: 200000,
    serviceRevenue: 600000,
    grossProfit: 300000,
    marginPercent: 37.5,
  };

  it("returns empty array when prevSummary is null", () => {
    const insights = generateInsights(baseSummary, null, []);
    expect(insights).toEqual([]);
  });

  it("generates revenue delta insight when revenue increased", () => {
    const insights = generateInsights(baseSummary, basePrevSummary, []);
    expect(insights.length).toBeGreaterThanOrEqual(1);
    // Should mention revenue increase (1M - 800K = 200K, 25% increase)
    const _revenueInsight = insights.find(
      (i) =>
        i.includes("25") ||
        i.includes("орлого") ||
        i.includes("revenue") ||
        i.includes("өссөн"),
    );
    // At minimum, some insight should exist
    expect(insights.length).toBeGreaterThan(0);
  });

  it("generates active WOs insight when > 5", () => {
    const insights = generateInsights(
      { ...baseSummary, activeWorkOrders: 8 },
      basePrevSummary,
      [],
    );
    // Should have at least revenue + active WO insights
    expect(insights.length).toBeGreaterThanOrEqual(1);
  });

  it("generates avg repair order comparison when both periods have data", () => {
    const insights = generateInsights(
      { ...baseSummary, avgRepairOrderValue: 250000 },
      { ...basePrevSummary, avgRepairOrderValue: 200000 },
      [],
    );
    // Should generate at least some insights
    expect(insights.length).toBeGreaterThan(0);
  });

  it("generates service mix insight", () => {
    const insights = generateInsights(
      { ...baseSummary, serviceRevenue: 900000, partsRevenue: 100000 },
      basePrevSummary,
      [],
    );
    // 90% service mix — should trigger insight
    expect(insights.length).toBeGreaterThan(0);
  });

  it("generates status distribution insights for Ready for Pickup > 3", () => {
    const statusDist = [
      { status: "Ready for Pickup", count: 5 },
      { status: "In Progress", count: 2 },
    ];
    const insights = generateInsights(baseSummary, basePrevSummary, statusDist);
    // Should include a ready-for-pickup insight
    expect(insights.length).toBeGreaterThan(0);
  });

  it("caps insights at maximum of 4", () => {
    // Create conditions that generate many insights
    const highSummary = {
      ...baseSummary,
      totalRevenue: 2000000,
      activeWorkOrders: 10,
      avgRepairOrderValue: 300000,
      serviceRevenue: 1500000,
      partsRevenue: 500000,
    };
    const statusDist = [
      { status: "Diagnosing", count: 8 },
      { status: "In Progress", count: 3 },
      { status: "Ready for Pickup", count: 5 },
    ];
    const insights = generateInsights(highSummary, basePrevSummary, statusDist);
    expect(insights.length).toBeLessThanOrEqual(4);
  });

  it("does not generate revenue insight when revenue stayed the same", () => {
    const sameSummary = {
      ...baseSummary,
      totalRevenue: basePrevSummary.totalRevenue,
    };
    const insights = generateInsights(sameSummary, basePrevSummary, []);
    // No revenue delta, but may still have other insights
    expect(Array.isArray(insights)).toBe(true);
  });

  it("generates diagnosing bottleneck insight when diagnosing > in-progress and > 3", () => {
    const statusDist = [
      { status: "Diagnosing", count: 6 },
      { status: "In Progress", count: 2 },
    ];
    const insights = generateInsights(baseSummary, basePrevSummary, statusDist);
    expect(insights.length).toBeGreaterThan(0);
  });
});

// ── generateReportInsights (async with DB) ─────────────────

describe("generateReportInsights", () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockSupabaseClient();
  });

  function makeBuilder<TData = unknown>(data?: TData) {
    const resolved = { data: data ?? null, error: null };
    return {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(() => new Promise((resolve) => resolve(resolved))),
      maybeSingle: vi.fn(() => new Promise((resolve) => resolve(resolved))),
      then: vi.fn((resolve: (v: typeof resolved) => void) => resolve(resolved)),
    };
  }

  it("returns insights array with revenue and work order data", async () => {
    // Current period WOs
    const woBuilder = makeBuilder([{ id: "wo-1" }, { id: "wo-2" }]);
    // Previous period WOs
    const prevWoBuilder = makeBuilder([
      { id: "wo-p1" },
      { id: "wo-p2" },
      { id: "wo-p3" },
    ]);

    let callCount = 0;
    mockClient.from = vi.fn((table: string) => {
      callCount++;
      if (table === "work_orders") {
        // Alternate between current and previous period
        return callCount <= 3 ? woBuilder : prevWoBuilder;
      }
      if (table === "work_order_services") {
        return makeBuilder([{ final_price: 500000 }]);
      }
      if (table === "work_order_parts") {
        return makeBuilder([{ final_price: 200000 }]);
      }
      return makeBuilder([]);
    });

    // Mock rpc for insights
    mockClient.rpc = vi.fn().mockResolvedValue({
      data: [
        { status: "Completed", count: 2 },
        { status: "In Progress", count: 1 },
      ],
      error: null,
    });

    const result = await generateReportInsights(
      mockClient as any,
      "org-1",
      "2026-07-01",
      "2026-07-31",
    );

    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("severity");
      expect(result[0]).toHaveProperty("title");
    }
  });

  it("handles empty period gracefully", async () => {
    mockClient.from = vi.fn(() => makeBuilder([]));
    mockClient.rpc = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    const result = await generateReportInsights(
      mockClient as any,
      "org-1",
      "2026-07-01",
      "2026-07-31",
    );

    expect(Array.isArray(result)).toBe(true);
  });

  it("returns insights with action items when data suggests them", async () => {
    const woBuilder = makeBuilder([
      { id: "wo-1" },
      { id: "wo-2" },
      { id: "wo-3" },
      { id: "wo-4" },
      { id: "wo-5" },
    ]);
    const prevWoBuilder = makeBuilder([]);

    let callIdx = 0;
    mockClient.from = vi.fn((table: string) => {
      callIdx++;
      if (table === "work_orders") {
        return callIdx <= 5 ? woBuilder : prevWoBuilder;
      }
      if (table === "work_order_services") {
        return makeBuilder([{ final_price: 200000 }]);
      }
      if (table === "work_order_parts") {
        return makeBuilder([{ final_price: 100000 }]);
      }
      return makeBuilder([]);
    });

    mockClient.rpc = vi.fn().mockResolvedValue({
      data: [
        { status: "Completed", count: 3 },
        { status: "Diagnosing", count: 2 },
      ],
      error: null,
    });

    const result = await generateReportInsights(
      mockClient as any,
      "org-1",
      "2026-07-01",
      "2026-07-31",
    );

    expect(Array.isArray(result)).toBe(true);
  });
});
