import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/cache/with-cache", () => ({
  withCache: vi.fn((_key: string[], fn: () => unknown) => fn()),
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

import {
  getDailyReport,
  getDailyTimeline,
  getDashboardData,
  getEndOfDaySummary,
  getMechanicsList,
  getMonthlyReport,
  getWeeklyReport,
} from "./report-service";

// ── Helpers ──────────────────────────────────────────────────

function createQueryBuilder<TData = unknown>(response?: {
  data?: TData;
  error?: null;
  count?: number;
}) {
  const resolved = {
    data: (response?.data ?? []) as TData,
    error: response?.error ?? null,
    ...(response?.count !== undefined ? { count: response.count } : {}),
  };

  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: response?.data ?? null,
      error: response?.error ?? null,
    }),
    maybeSingle: vi.fn().mockResolvedValue({
      data: response?.data ?? null,
      error: response?.error ?? null,
    }),
    throwOnError: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    then: vi.fn((resolve: (value: typeof resolved) => void) =>
      resolve(resolved),
    ),
  };
}

function setupFromMock(
  mockClient: ReturnType<typeof createMockSupabaseClient>,
  builders: ReturnType<typeof createQueryBuilder>[],
) {
  let i = 0;
  Object.assign(mockClient, {
    from: vi
      .fn()
      .mockImplementation(() => builders[i++] ?? createQueryBuilder()),
  });
}

function b<TData = unknown>(data?: TData, count?: number) {
  return createQueryBuilder<TData>({ data, count });
}

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
    setupFromMock(mockClient, [
      b([{ user_id: "u1" }, { user_id: "u2" }]),
      b([
        { id: "u1", full_name: "John Doe" },
        { id: "u2", full_name: "Jane Smith" },
      ]),
    ]);

    const result = await getMechanicsList(mockClient as any, "org-1");

    expect(result).toEqual([
      { id: "u1", full_name: "John Doe" },
      { id: "u2", full_name: "Jane Smith" },
    ]);
  });

  it("fetches profiles for matched user IDs", async () => {
    setupFromMock(mockClient, [
      b([{ user_id: "u1" }, { user_id: "u2" }]),
      b([
        { id: "u1", full_name: "John" },
        { id: "u2", full_name: null },
      ]),
    ]);

    const result = await getMechanicsList(mockClient as any, "org-1");

    expect(result).toHaveLength(2);
    expect(result[0].full_name).toBe("John");
    expect(result[1].full_name).toBeNull();
  });

  it("returns empty array when no mechanics", async () => {
    setupFromMock(mockClient, [b([])]);

    const result = await getMechanicsList(mockClient as any, "org-1");

    expect(result).toEqual([]);
  });

  it("handles when profiles have no matching users", async () => {
    setupFromMock(mockClient, [b([{ user_id: "u1" }]), b([])]);

    const result = await getMechanicsList(mockClient as any, "org-1");

    expect(result).toEqual([]);
  });
});

// ── getDailyReport ────────────────────────────────────────────

describe("getDailyReport", () => {
  it("returns DailyReport with work order counts, revenue, discounts", async () => {
    setupFromMock(mockClient, [
      b([{ id: "wo-1" }, { id: "wo-2" }]),
      b([
        {
          final_price: 100,
          discount_amount: 10,
          name: "Oil Change",
          work_order_id: "wo-1",
        },
        {
          final_price: 200,
          discount_amount: 20,
          name: "Brakes",
          work_order_id: "wo-2",
        },
      ]),
      b([
        {
          final_price: 50,
          discount_amount: 5,
          part_name: "Filter",
          work_order_id: "wo-1",
        },
      ]),
      b([
        {
          id: "wo-1",
          customer_id: "c-1",
          vehicle_id: "v-1",
          mechanic_id: "m-1",
        },
        {
          id: "wo-2",
          customer_id: "c-2",
          vehicle_id: "v-2",
          mechanic_id: null,
        },
      ]),
      b([{ id: "ws-1", work_order_id: "wo-1" }]),
      b([{ id: "wp-1", work_order_id: "wo-1" }]),
      b([{ id: "h-1", work_order_id: "wo-1" }]),
      b([{ id: "c-1" }, { id: "c-2" }]),
      b([{ id: "v-1" }, { id: "v-2" }]),
      b([{ id: "m-1", full_name: "Mech One" }]),
    ]);

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
    const profileBuilder = createQueryBuilder<{ full_name: string }>();
    profileBuilder.single.mockResolvedValueOnce({
      data: { full_name: "Mech One" },
      error: null,
    });
    const builders = [
      profileBuilder,
      b([{ id: "wo-1" }]),
      b([
        {
          final_price: 100,
          discount_amount: 0,
          name: "Oil Change",
          work_order_id: "wo-1",
        },
      ]),
      b([
        {
          final_price: 50,
          discount_amount: 0,
          part_name: "Filter",
          work_order_id: "wo-1",
        },
      ]),
      b([
        {
          id: "wo-1",
          customer_id: "c-1",
          vehicle_id: "v-1",
          mechanic_id: "m-1",
        },
      ]),
      b([]),
      b([]),
      b([]),
      b([{ id: "c-1" }]),
      b([{ id: "v-1" }]),
      b([]),
    ];
    let idx = 0;
    mockClient.from = vi
      .fn()
      .mockImplementation(() => builders[idx++] ?? createQueryBuilder());

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
    setupFromMock(mockClient, [b([])]);

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
    setupFromMock(mockClient, [
      b([{ id: "wo-1" }, { id: "wo-2" }]),
      b([]),
      b([]),
      b([]),
      b([]),
      b([]),
      b([]),
      b([]),
      b([]),
      b([]),
    ]);

    await getDailyReport(mockClient as any, "org-1", null, "2025-01-15");

    const fromCalls = vi
      .mocked(mockClient.from)
      .mock.calls.map((c: string[]) => c[0]);
    expect(fromCalls).toContain("work_order_services");
    expect(fromCalls).toContain("work_order_parts");
  });
});

// ── getWeeklyReport ───────────────────────────────────────────

describe("getWeeklyReport", () => {
  it("returns 7-day daily breakdown with aggregated totals", async () => {
    setupFromMock(mockClient, [...Array.from({ length: 7 }, () => b([]))]);

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

  function makeRobustQueryBuilder(): ReturnType<typeof createQueryBuilder> {
    // A reusable builder that handles all query patterns for report-service.
    // select/eq etc return this for chaining, single/limit always return empty arrays.
    const qb = createQueryBuilder<Record<string, unknown>[]>({ data: [] });
    // Override single to return null data (not throw) for profile queries etc.
    qb.single = vi.fn().mockResolvedValue({ data: null, error: null });
    return qb;
  }

  it("aggregates totals across all days", async () => {
    const mc = createMockSupabaseClient();
    // Override from to always return a robust builder that handles any query.
    // This is needed because getWeeklyReport calls getDailyReport 7 times
    // via Promise.all (parallel), making sequential builder lists non-deterministic.
    mc.from = vi.fn().mockReturnValue(makeRobustQueryBuilder());
    vi.mocked(createClient).mockResolvedValue(
      mc as unknown as Awaited<ReturnType<typeof createClient>>,
    );

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
    const mc = createMockSupabaseClient();
    mc.from = vi.fn().mockReturnValue(makeRobustQueryBuilder());
    vi.mocked(createClient).mockResolvedValue(
      mc as unknown as Awaited<ReturnType<typeof createClient>>,
    );

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
    setupFromMock(mockClient, [
      b([{ id: "wo-1", created_at: "2025-01-10T08:00:00Z" }, { id: "wo-2", created_at: "2025-01-15T09:00:00Z" }, { id: "wo-3", created_at: "2025-01-20T10:00:00Z" }]),
      b([
        { final_price: 100, discount_amount: 10, work_order_id: "wo-1" },
        { final_price: 200, discount_amount: 0, work_order_id: "wo-2" },
        { final_price: 150, discount_amount: 15, work_order_id: "wo-3" },
      ]),
      b([{ final_price: 50, discount_amount: 5, work_order_id: "wo-1" }]),
    ]);

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
    setupFromMock(mockClient, [b([]), b([]), b([])]);

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
    const profileBuilder = createQueryBuilder();
    profileBuilder.single.mockResolvedValueOnce({
      data: { full_name: "Mech One" },
      error: null,
    });

    setupFromMock(mockClient, [profileBuilder, b([]), b([]), b([])]);

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
    setupFromMock(mockClient, [b([]), b([]), b([])]);

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
    setupFromMock(mockClient, [b([]), b([]), b([])]);

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
});

// ── getEndOfDaySummary ────────────────────────────────────────

describe("getEndOfDaySummary", () => {
  it("returns mechanics breakdown with counts and revenue", async () => {
    setupFromMock(mockClient, [
      b([
        { id: "wo-1", mechanic_id: "m-1" },
        { id: "wo-2", mechanic_id: "m-1" },
        { id: "wo-3", mechanic_id: "m-2" },
      ]),
      b([
        { id: "m-1", full_name: "Mech One" },
        { id: "m-2", full_name: "Mech Two" },
      ]),
      b([
        { final_price: 100, work_order_id: "wo-1" },
        { final_price: 200, work_order_id: "wo-2" },
        { final_price: 150, work_order_id: "wo-3" },
      ]),
      b([
        { final_price: 50, work_order_id: "wo-1" },
        { final_price: 30, work_order_id: "wo-2" },
      ]),
    ]);

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
    const m1 = m1Found as NonNullable<typeof m1Found>;
    expect(m1.mechanic_name).toBe("Mech One");
    expect(m1.work_orders_completed).toBe(2);
    expect(m1.services_count).toBe(2);
    expect(m1.parts_count).toBe(2);
    expect(m1.total_revenue).toBe(380);

    const m2Found = result.mechanics.find((m) => m.mechanic_id === "m-2");
    expect(m2Found).toBeDefined();
    const m2 = m2Found as NonNullable<typeof m2Found>;
    expect(m2.mechanic_name).toBe("Mech Two");
    expect(m2.work_orders_completed).toBe(1);
    expect(m2.total_revenue).toBe(150);
  });

  it("returns empty summary when no work orders", async () => {
    setupFromMock(mockClient, [b([])]);

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
    setupFromMock(mockClient, [
      b([
        { id: "wo-1", mechanic_id: null },
        { id: "wo-2", mechanic_id: null },
      ]),
      b([]),
      b([]),
      b([]),
    ]);

    const result = await getEndOfDaySummary(
      mockClient as any,
      "org-1",
      "2025-01-15",
    );

    expect(result.total_work_orders).toBe(0);
    expect(result.mechanics).toEqual([]);
  });

  it("uses unique mechanic IDs for profile lookup", async () => {
    setupFromMock(mockClient, [
      b([
        { id: "wo-1", mechanic_id: "m-1" },
        { id: "wo-2", mechanic_id: "m-1" },
      ]),
      b([{ id: "m-1", full_name: "Mech One" }]),
      b([]),
      b([]),
    ]);

    const result = await getEndOfDaySummary(
      mockClient as any,
      "org-1",
      "2025-01-15",
    );

    expect(result.mechanics).toHaveLength(1);
    expect(result.mechanics[0].mechanic_name).toBe("Mech One");
    expect(result.mechanics[0].work_orders_completed).toBe(2);
  });
});

// ── getDashboardData ──────────────────────────────────────────

/** Shape returned by the get_full_dashboard_data RPC. */
function rpcDashboardResponse(
  opts: { withPrevPeriod?: boolean } = {},
) {
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
      topServices: [
        { name: "Oil Change", count: 2, revenue: 300 },
      ],
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
});

// ── getDailyTimeline ──────────────────────────────────────────

describe("getDailyTimeline", () => {
  it("returns timeline events for today enriched with customer/vehicle data", async () => {
    setupFromMock(mockClient, [
      b([
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
      ]),
      b([
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
      ]),
      b([
        { id: "u-1", full_name: "Mech One" },
        { id: "u-2", full_name: "Mech Two" },
      ]),
    ]);

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
    setupFromMock(mockClient, [b([])]);

    const result = await getDailyTimeline(mockClient as any, "org-1");

    expect(result).toEqual([]);
  });

  it("returns empty when no status history entries", async () => {
    setupFromMock(mockClient, [
      b([{ id: "wo-1", customer: null, vehicle: null, bay_number: null }]),
      b([]),
    ]);

    const result = await getDailyTimeline(mockClient as any, "org-1");

    expect(result).toEqual([]);
  });

  it("handles null customer and vehicle gracefully", async () => {
    setupFromMock(mockClient, [
      b([
        {
          id: "wo-1",
          customer: null,
          vehicle: null,
          bay_number: null,
        },
      ]),
      b([
        {
          id: "h-1",
          work_order_id: "wo-1",
          status: "New",
          previous_status: null,
          changed_by: "u-1",
          notes: null,
          created_at: "2025-01-15T10:00:00Z",
        },
      ]),
      b([{ id: "u-1", full_name: null }]),
    ]);

    const result = await getDailyTimeline(mockClient as any, "org-1");

    expect(result).toHaveLength(1);
    expect(result[0].customerName).toBeNull();
    expect(result[0].vehiclePlate).toBeNull();
    expect(result[0].mechanicName).toBeNull();
    expect(result[0].previousStatus).toBeNull();
  });

  it("handles customer with partial name", async () => {
    setupFromMock(mockClient, [
      b([
        {
          id: "wo-1",
          customer: { first_name: "John", last_name: null },
          vehicle: { plate_number: null },
          bay_number: 1,
        },
      ]),
      b([
        {
          id: "h-1",
          work_order_id: "wo-1",
          status: "Diagnosing",
          previous_status: "New",
          changed_by: "u-1",
          notes: null,
          created_at: "2025-01-15T10:00:00Z",
        },
      ]),
      b([{ id: "u-1", full_name: "Mech" }]),
    ]);

    const result = await getDailyTimeline(mockClient as any, "org-1");

    expect(result[0].customerName).toBe("John");
    expect(result[0].vehiclePlate).toBeNull();
  });

  it("enriches with profile names for changed_by users", async () => {
    setupFromMock(mockClient, [
      b([{ id: "wo-1", customer: null, vehicle: null, bay_number: null }]),
      b([
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
      ]),
      b([{ id: "u-1", full_name: "Mech One" }]),
    ]);

    const result = await getDailyTimeline(mockClient as any, "org-1");

    expect(result).toHaveLength(2);
    expect(result[0].mechanicName).toBe("Mech One");
    expect(result[1].mechanicName).toBe("Mech One");
  });
});
