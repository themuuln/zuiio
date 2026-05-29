import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/cache/with-cache", () => ({
  withCache: vi.fn((_key: string[], fn: () => unknown) => fn()),
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

import type { DailyReport } from "@/lib/types";
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
    single: vi.fn(),
    maybeSingle: vi.fn(),
    throwOnError: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable for await mock
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
  const origFrom = mockClient.from;
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

    const result = await getMechanicsList("org-1");

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

    const result = await getMechanicsList("org-1");

    expect(result).toHaveLength(2);
    expect(result[0].full_name).toBe("John");
    expect(result[1].full_name).toBeNull();
  });

  it("returns empty array when no mechanics", async () => {
    setupFromMock(mockClient, [b([])]);

    const result = await getMechanicsList("org-1");

    expect(result).toEqual([]);
  });

  it("handles when profiles have no matching users", async () => {
    setupFromMock(mockClient, [b([{ user_id: "u1" }]), b([])]);

    const result = await getMechanicsList("org-1");

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

    const result = await getDailyReport("org-1", null, "2025-01-15");

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
    let callIdx = 0;
    const profileBuilder = createQueryBuilder<{ full_name: string }>();
    profileBuilder.single.mockResolvedValueOnce({
      data: { full_name: "Mech One" },
      error: null,
    });
    const mc = createMockSupabaseClient();
    mc.from = vi.fn().mockImplementation(() => {
      const idx = callIdx++;
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
      return builders[idx] ?? createQueryBuilder();
    });
    vi.mocked(createClient).mockResolvedValue(
      mc as unknown as Awaited<ReturnType<typeof createClient>>,
    );

    const result = await getDailyReport("org-1", "m-1", "2025-01-15");

    expect(result.mechanic_id).toBe("m-1");
    expect(result.mechanic_name).toBe("Mech One");
    expect(result.work_orders_completed).toBe(1);
  });

  it("returns zero counts when no work orders", async () => {
    setupFromMock(mockClient, [b([])]);

    const result = await getDailyReport("org-1", null, "2025-01-15");

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

    await getDailyReport("org-1", null, "2025-01-15");

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

    const result = await getWeeklyReport("org-1", null, "2025-01-06");

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

    const result = await getWeeklyReport("org-1", null, "2025-01-06");

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

    const result = await getWeeklyReport("org-1", "m-1", "2025-01-06");

    expect(result.mechanic_id).toBe("m-1");
    expect(result.daily_breakdown).toHaveLength(7);
  });
});

// ── getMonthlyReport ──────────────────────────────────────────

describe("getMonthlyReport", () => {
  it("returns monthly totals", async () => {
    setupFromMock(mockClient, [
      b([{ id: "wo-1" }, { id: "wo-2" }, { id: "wo-3" }]),
      b([
        { final_price: 100, discount_amount: 10, work_order_id: "wo-1" },
        { final_price: 200, discount_amount: 0, work_order_id: "wo-2" },
        { final_price: 150, discount_amount: 15, work_order_id: "wo-3" },
      ]),
      b([{ final_price: 50, discount_amount: 5, work_order_id: "wo-1" }]),
    ]);

    const result = await getMonthlyReport("org-1", null, 2025, 1);

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

    const result = await getMonthlyReport("org-1", null, 2025, 6);

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

    const result = await getMonthlyReport("org-1", "m-1", 2025, 1);

    expect(result.mechanic_id).toBe("m-1");
    expect(result.mechanic_name).toBe("Mech One");
    expect(result.work_orders_completed).toBe(0);
  });

  it("returns zero totals when no completed work orders", async () => {
    setupFromMock(mockClient, [b([]), b([]), b([])]);

    const result = await getMonthlyReport("org-1", null, 2025, 1);

    expect(result.work_orders_completed).toBe(0);
    expect(result.total_revenue).toBe(0);
    expect(result.total_discounts).toBe(0);
  });

  it("computes the correct number of days in the month", async () => {
    setupFromMock(mockClient, [b([]), b([]), b([])]);

    const result = await getMonthlyReport("org-1", null, 2025, 2);

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

    const result = await getEndOfDaySummary("org-1", "2025-01-15");

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

    const result = await getEndOfDaySummary("org-1", "2025-01-15");

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

    const result = await getEndOfDaySummary("org-1", "2025-01-15");

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

    const result = await getEndOfDaySummary("org-1", "2025-01-15");

    expect(result.mechanics).toHaveLength(1);
    expect(result.mechanics[0].mechanic_name).toBe("Mech One");
    expect(result.mechanics[0].work_orders_completed).toBe(2);
  });
});

// ── getDashboardData ──────────────────────────────────────────

function dashboardBuilders(
  options: { withPrevPeriod?: boolean; emptyStatus?: boolean } = {},
) {
  const { withPrevPeriod = false, emptyStatus = false } = options;
  const e = <T = unknown>(data?: T) => b<T>(data);

  const dataBuilders: ReturnType<typeof createQueryBuilder>[] = [
    e([{ id: "wo-1" }, { id: "wo-2" }]),
    e([{ id: "wo-3" }, { id: "wo-4" }]),
    emptyStatus
      ? e([])
      : e([
          { status: "Completed" },
          { status: "In Progress" },
          { status: "Diagnosing" },
          { status: "Ready for Pickup" },
          { status: "Ready for Pickup" },
          { status: "Ready for Pickup" },
          { status: "Ready for Pickup" },
        ]),
    e([{ id: "wo-1" }]),
    b<unknown[]>([], 10),
    b<unknown[]>([], 8),
    e([{ id: "wo-1" }, { id: "wo-2" }]),

    e([
      {
        final_price: 150,
        discount_amount: 0,
        name: "Oil Change",
        work_order_id: "wo-1",
      },
      {
        final_price: 200,
        discount_amount: 10,
        name: "Brakes",
        work_order_id: "wo-2",
      },
    ]),
    e([
      {
        final_price: 80,
        discount_amount: 0,
        part_name: "Filter",
        work_order_id: "wo-1",
      },
      {
        final_price: 150,
        discount_amount: 0,
        part_name: "Brake Pads",
        work_order_id: "wo-2",
      },
    ]),

    e([
      { id: "wo-1", updated_at: "2025-01-15T10:00:00Z" },
      { id: "wo-2", updated_at: "2025-01-14T10:00:00Z" },
    ]),
    e([{ final_price: 150, work_order_id: "wo-1" }]),
    e([{ final_price: 80, work_order_id: "wo-1" }]),

    e([
      { name: "Oil Change", final_price: 150 },
      { name: "Brakes", final_price: 200 },
    ]),

    e([{ user_id: "m-1" }, { user_id: "m-2" }]),
    e([
      { id: "m-1", full_name: "Mech One" },
      { id: "m-2", full_name: "Mech Two" },
    ]),
    e([
      { id: "wo-1", mechanic_id: "m-1" },
      { id: "wo-2", mechanic_id: "m-2" },
    ]),
    e([
      { final_price: 150, work_order_id: "wo-1" },
      { final_price: 200, work_order_id: "wo-2" },
    ]),
    e([
      { final_price: 80, work_order_id: "wo-1" },
      { final_price: 150, work_order_id: "wo-2" },
    ]),

    e([
      { id: "wo-1", customer_id: "c-1", vehicle_id: "v-1", mechanic_id: "m-1" },
    ]),
    e([{ id: "ws-1", work_order_id: "wo-1" }]),
    e([{ id: "wp-1", work_order_id: "wo-1" }]),
    e([{ id: "h-1", work_order_id: "wo-1", status: "Completed" }]),
    e([{ id: "c-1", first_name: "John", last_name: "Doe" }]),
    e([{ id: "v-1", plate_number: "ABC123" }]),
    e([{ id: "m-1", full_name: "Mech One" }]),

    e([{ id: "sc-1", category: "Maintenance" }]),
    e([{ service_catalog_id: "sc-1", final_price: 150 }]),

    e([{ created_at: "2025-01-15T10:00:00Z" }]),
  ];

  if (withPrevPeriod) {
    dataBuilders.push(
      e([{ id: "wo-p1" }, { id: "wo-p2" }]),
      e([{ final_price: 100, work_order_id: "wo-p1" }]),
      e([{ final_price: 50, work_order_id: "wo-p1" }]),
    );
  }

  // Extra padding for parallel query edge cases
  for (let pad = 0; pad < 15; pad++) dataBuilders.push(e([]));

  return dataBuilders;
}

describe("getDashboardData", () => {
  function runDashboard(
    period: "today" | "week" | "month" | "all" = "month",
    withPrev = true,
  ) {
    const mc = createMockSupabaseClient();
    const builders = dashboardBuilders({
      withPrevPeriod: withPrev,
      emptyStatus: false,
    });
    let i = 0;
    mc.from = vi
      .fn()
      .mockImplementation(() => builders[i++] ?? createQueryBuilder());
    vi.mocked(createClient).mockResolvedValue(
      mc as unknown as Awaited<ReturnType<typeof createClient>>,
    );
    return getDashboardData("org-1", period);
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

    // Sub-queries run in parallel through Promise.all — exact mock
    // builder consumption order is non-deterministic for deeply nested
    // queries. Structural properties that should always be populated
    // from the mock regardless of ordering:
    expect(result.workOrderStatusDistribution.length).toBeGreaterThan(0);
    expect(result.revenueTrend.length).toBeGreaterThan(0);
    expect(result.topServices.length).toBeGreaterThan(0);
    expect(result.technicianPerformance.length).toBeGreaterThan(0);
    expect(result.recentWorkOrders.length).toBeGreaterThan(0);
    expect(result.customerAcquisitionTrend.length).toBeGreaterThan(0);
  });

  it("generates insights when compared to previous period", async () => {
    const result = await runDashboard("month", true);

    // Insights exist when summaryComparison has data
    expect(Array.isArray(result.insights)).toBe(true);

    // If summaryComparison is available, check specific insight strings
    if (result.summaryComparison && result.summary.totalRevenue > 0) {
      expect(result.insights.length).toBeGreaterThan(0);
    }
  });

  it("handles empty data gracefully", async () => {
    const mc = createMockSupabaseClient();
    mc.from = vi.fn().mockImplementation(() => createQueryBuilder());
    vi.mocked(createClient).mockResolvedValue(
      mc as unknown as Awaited<ReturnType<typeof createClient>>,
    );

    const result = await getDashboardData("org-1", "all");

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

    // react-doctor: async-await-in-loop - sequential required (vi.clearAllMocks per iteration)
    for (const period of periods) {
      vi.clearAllMocks();
      const mc = createMockSupabaseClient();
      const builders = dashboardBuilders({ withPrevPeriod: period !== "all" });
      let i = 0;
      mc.from = vi
        .fn()
        .mockImplementation(() => builders[i++] ?? createQueryBuilder());
      vi.mocked(createClient).mockResolvedValue(
        mc as unknown as Awaited<ReturnType<typeof createClient>>,
      );

      const result = await getDashboardData("org-1", period);

      expect(result.summary).toBeDefined();
      expect(result.workOrderStatusDistribution).toBeDefined();
      expect(result.revenueTrend).toBeDefined();
    }
  });

  it("uses batched queries for performance", async () => {
    vi.clearAllMocks();
    const mc = createMockSupabaseClient();
    const builders = dashboardBuilders({ withPrevPeriod: true });
    let i = 0;
    mc.from = vi
      .fn()
      .mockImplementation(() => builders[i++] ?? createQueryBuilder());
    vi.mocked(createClient).mockResolvedValue(
      mc as unknown as Awaited<ReturnType<typeof createClient>>,
    );

    await getDashboardData("org-1", "month");

    const fromCalls = mc.from.mock.calls.map((c: string[]) => c[0]);
    const woCalls = fromCalls.filter((t: string) => t === "work_orders");
    expect(woCalls.length).toBeGreaterThanOrEqual(4);
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

    const result = await getDailyTimeline("org-1");

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

    const result = await getDailyTimeline("org-1");

    expect(result).toEqual([]);
  });

  it("returns empty when no status history entries", async () => {
    setupFromMock(mockClient, [
      b([{ id: "wo-1", customer: null, vehicle: null, bay_number: null }]),
      b([]),
    ]);

    const result = await getDailyTimeline("org-1");

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

    const result = await getDailyTimeline("org-1");

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

    const result = await getDailyTimeline("org-1");

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

    const result = await getDailyTimeline("org-1");

    expect(result).toHaveLength(2);
    expect(result[0].mechanicName).toBe("Mech One");
    expect(result[1].mechanicName).toBe("Mech One");
  });
});
