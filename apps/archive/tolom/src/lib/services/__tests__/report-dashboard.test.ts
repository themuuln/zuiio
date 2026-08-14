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

const insightsMock = vi.hoisted(() => ({
  generateInsights: vi.fn(),
}));

vi.mock("../report-service/insights", () => ({
  generateInsights: insightsMock.generateInsights,
}));

import { withDbCapture } from "@/lib/supabase/query";
import { withBranchFilter } from "@/lib/supabase/with-branch";

const mockWithDbCapture = vi.mocked(withDbCapture);
const mockWithBranchFilter = vi.mocked(withBranchFilter);

import {
  getCustomerRetention,
  getDailyTimeline,
  getDashboardData,
} from "../report-service/dashboard";

const ORG_ID = "org-1";
const BRANCH_ID = "b-1";

function makeDashboardData(overrides: Record<string, unknown> = {}) {
  return {
    summary: {
      totalRevenue: 1000,
      activeWorkOrders: 5,
      completedToday: 3,
      newCustomersToday: 1,
      avgRepairOrderValue: 200,
      partsRevenue: 300,
      serviceRevenue: 700,
      grossProfit: 400,
      marginPercent: 40,
      totalCustomers: 50,
      totalVehicles: 60,
    },
    summaryComparison: {
      total_revenue: 800,
      active_work_orders: 4,
      completed_today: 2,
      new_customers_today: 0,
      avg_repair_order_value: 150,
      parts_revenue: 250,
      service_revenue: 550,
      gross_profit: 300,
      margin_percent: 37.5,
      total_customers: 45,
      total_vehicles: 55,
    },
    workOrderStatusDistribution: [{ status: "Completed", count: 3 }],
    revenueTrend: [{ date: "2025-06-15", revenue: 1000, workOrders: 3 }],
    topServices: [{ name: "Oil Change", revenue: 700, count: 1 }],
    technicianPerformance: [
      { id: "m-1", name: "Mia", completedOrders: 3, revenue: 1000 },
    ],
    recentWorkOrders: [{ id: "wo-1", status: "Completed" }],
    serviceCategoryBreakdown: [
      { category: "Maintenance", revenue: 700, count: 1 },
    ],
    customerAcquisitionTrend: [{ month: "2025-06", newCustomers: 1 }],
    ...overrides,
  };
}

let db: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
  mockWithBranchFilter.mockImplementation((query) => query);
  insightsMock.generateInsights.mockReturnValue(["insight-1"]);
});

// ── getDashboardData ────────────────────────────────────────────

describe("getDashboardData", () => {
  it("maps the RPC payload and builds insights from summary + comparison", async () => {
    db.rpc.mockResolvedValueOnce({
      data: makeDashboardData(),
      error: null,
    });

    const result = await getDashboardData(db as never, ORG_ID, "today");

    expect(result.summary).toEqual(makeDashboardData().summary);
    expect(result.summaryComparison).toEqual({
      totalRevenue: 800,
      activeWorkOrders: 4,
      completedToday: 2,
      newCustomersToday: 0,
      avgRepairOrderValue: 150,
      partsRevenue: 250,
      serviceRevenue: 550,
      grossProfit: 300,
      marginPercent: 37.5,
      totalCustomers: 45,
      totalVehicles: 55,
    });
    expect(result.insights).toEqual(["insight-1"]);
    expect(result.workOrderStatusDistribution).toEqual([
      { status: "Completed", count: 3 },
    ]);
    expect(result.revenueTrend).toEqual([
      { date: "2025-06-15", revenue: 1000, workOrders: 3 },
    ]);
    expect(result.recentWorkOrders).toEqual([
      { id: "wo-1", status: "Completed" },
    ]);
    expect(db.rpc).toHaveBeenCalledWith("get_full_dashboard_data", {
      p_org_id: ORG_ID,
      p_period: "today",
      p_branch_id: null,
      p_date_from: null,
      p_date_to: null,
    });
    expect(mockWithDbCapture).toHaveBeenCalledWith(
      "getFullDashboardData",
      expect.anything(),
    );
    expect(insightsMock.generateInsights).toHaveBeenCalledWith(
      makeDashboardData().summary,
      expect.objectContaining({ totalRevenue: 800 }),
      [{ status: "Completed", count: 3 }],
    );
  });

  it("defaults to period all and null branch", async () => {
    db.rpc.mockResolvedValueOnce({
      data: makeDashboardData({ summaryComparison: null }),
      error: null,
    });

    await getDashboardData(db as never, ORG_ID);

    expect(db.rpc).toHaveBeenCalledWith("get_full_dashboard_data", {
      p_org_id: ORG_ID,
      p_period: "all",
      p_branch_id: null,
      p_date_from: null,
      p_date_to: null,
    });
  });

  it("uses date range and branch from the options object", async () => {
    db.rpc.mockResolvedValueOnce({
      data: makeDashboardData({ summaryComparison: null }),
      error: null,
    });

    await getDashboardData(db as never, ORG_ID, {
      dateFrom: "2025-06-01",
      dateTo: "2025-06-30",
      branchId: BRANCH_ID,
    });

    expect(db.rpc).toHaveBeenCalledWith("get_full_dashboard_data", {
      p_org_id: ORG_ID,
      p_period: "all",
      p_branch_id: BRANCH_ID,
      p_date_from: "2025-06-01",
      p_date_to: "2025-06-30",
    });
  });

  it("defaults missing summary fields to zero and handles null comparison", async () => {
    db.rpc.mockResolvedValueOnce({
      data: makeDashboardData({
        summary: { totalRevenue: 5 },
        summaryComparison: null,
      }),
      error: null,
    });

    const result = await getDashboardData(db as never, ORG_ID);

    expect(result.summary.totalRevenue).toBe(5);
    expect(result.summary.activeWorkOrders).toBe(0);
    expect(result.summary.marginPercent).toBe(0);
    expect(result.summaryComparison).toBeNull();
    expect(result.insights).toEqual(["insight-1"]);
    expect(insightsMock.generateInsights).toHaveBeenCalledWith(
      {
        totalRevenue: 5,
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
      null,
      [{ status: "Completed", count: 3 }],
    );
  });

  it("throws when the RPC returns an error", async () => {
    db.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "dashboard rpc failed" },
    });

    await expect(getDashboardData(db as never, ORG_ID)).rejects.toThrow(
      "dashboard rpc failed",
    );
  });

  it("returns defaults instead of throwing when the RPC resolves null data", async () => {
    db.rpc.mockResolvedValueOnce({ data: null, error: null });

    const result = await getDashboardData(db as never, ORG_ID, "today");

    expect(result.summary).toEqual({
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
    });
    expect(result.summaryComparison).toBeNull();
    expect(result.workOrderStatusDistribution).toEqual([]);
    expect(result.revenueTrend).toEqual([]);
    expect(result.topServices).toEqual([]);
    expect(result.technicianPerformance).toEqual([]);
    expect(result.recentWorkOrders).toEqual([]);
    expect(result.serviceCategoryBreakdown).toEqual([]);
    expect(result.customerAcquisitionTrend).toEqual([]);
    expect(result.insights).toEqual(["insight-1"]);
  });
});

// ── getDailyTimeline ────────────────────────────────────────────

describe("getDailyTimeline", () => {
  it("composes timeline events from history, WOs, and profiles", async () => {
    const today = new Date().toISOString().split("T")[0];

    db.__qb.resolveOnce({
      data: [
        {
          id: "wo-1",
          customer: { first_name: "Alice", last_name: "A" },
          vehicle: { plate_number: "123-ABC" },
          bay_number: 3,
        },
        {
          id: "wo-2",
          customer: [{ first_name: "Bob", last_name: "B" }],
          vehicle: null,
          bay_number: null,
        },
        { id: "wo-3", customer: null, vehicle: null, bay_number: null },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        {
          id: "h-1",
          work_order_id: "wo-1",
          previous_status: "Pending",
          status: "In Progress",
          notes: "Started",
          changed_by: "u-1",
          created_at: "2025-06-15T10:00:00Z",
        },
        {
          id: "h-2",
          work_order_id: "wo-2",
          previous_status: null,
          status: "Checked In",
          notes: null,
          changed_by: "u-2",
          created_at: "2025-06-15T09:00:00Z",
        },
        {
          id: "h-3",
          work_order_id: "wo-3",
          previous_status: null,
          status: "Pending",
          notes: null,
          changed_by: null,
          created_at: "2025-06-15T08:00:00Z",
        },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [{ id: "u-1", full_name: "Mia" }],
      error: null,
    });

    const result = await getDailyTimeline(db as never, ORG_ID);

    expect(result).toEqual([
      {
        id: "h-1",
        workOrderId: "wo-1",
        customerName: "Alice A",
        vehiclePlate: "123-ABC",
        status: "In Progress",
        previousStatus: "Pending",
        mechanicName: "Mia",
        notes: "Started",
        createdAt: "2025-06-15T10:00:00Z",
        bayNumber: 3,
      },
      {
        id: "h-2",
        workOrderId: "wo-2",
        customerName: "Bob B",
        vehiclePlate: null,
        status: "Checked In",
        previousStatus: null,
        mechanicName: null, // u-2 has no profile
        notes: null,
        createdAt: "2025-06-15T09:00:00Z",
        bayNumber: null,
      },
      {
        id: "h-3",
        workOrderId: "wo-3",
        customerName: null,
        vehiclePlate: null,
        status: "Pending",
        previousStatus: null,
        mechanicName: null, // no changed_by
        notes: null,
        createdAt: "2025-06-15T08:00:00Z",
        bayNumber: null,
      },
    ]);
    expect(db.from("work_orders").eq).toHaveBeenCalledWith(
      "organization_id",
      ORG_ID,
    );
    expect(db.from("work_orders").gte).toHaveBeenCalledWith(
      "updated_at",
      `${today}T00:00:00`,
    );
    expect(db.from("work_order_status_history").eq).toHaveBeenCalledWith(
      "organization_id",
      ORG_ID,
    );
    expect(mockWithBranchFilter).toHaveBeenLastCalledWith(
      expect.anything(),
      null,
    );
  });

  it("passes the branch to withBranchFilter", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    await getDailyTimeline(db as never, ORG_ID, BRANCH_ID);

    expect(mockWithBranchFilter).toHaveBeenLastCalledWith(
      expect.anything(),
      BRANCH_ID,
    );
  });

  it("returns [] when there are no updated work orders", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await getDailyTimeline(db as never, ORG_ID);

    expect(result).toEqual([]);
    expect(db.from).not.toHaveBeenCalledWith("work_order_status_history");
  });

  it("returns [] when the work orders query errors", async () => {
    db.__qb.resolveOnce({ data: null, error: { message: "db down" } });

    const result = await getDailyTimeline(db as never, ORG_ID);

    expect(result).toEqual([]);
  });

  it("returns [] when there is no status history", async () => {
    db.__qb.resolveOnce({ data: [{ id: "wo-1" }], error: null });
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await getDailyTimeline(db as never, ORG_ID);

    expect(result).toEqual([]);
    expect(db.from).not.toHaveBeenCalledWith("profiles");
  });

  it("returns [] when the history query errors", async () => {
    db.__qb.resolveOnce({ data: [{ id: "wo-1" }], error: null });
    db.__qb.resolveOnce({ data: null, error: { message: "history down" } });

    const result = await getDailyTimeline(db as never, ORG_ID);

    expect(result).toEqual([]);
  });
});

// ── getCustomerRetention ────────────────────────────────────────

describe("getCustomerRetention", () => {
  it("classifies returning vs new customers and ranks top customers", async () => {
    db.__qb.resolveOnce({
      data: [
        { id: "wo-1", customer_id: "c-1", created_at: "2025-06-10T10:00:00Z" },
        { id: "wo-2", customer_id: "c-2", created_at: "2025-06-11T10:00:00Z" },
        { id: "wo-3", customer_id: "c-1", created_at: "2025-06-12T10:00:00Z" },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        { customer_id: "c-1", total_amount: "100" },
        { customer_id: "c-1", total_amount: "50" },
        { customer_id: "c-2", total_amount: "30" },
      ],
      error: null,
    });
    db.__qb.resolveOnce({ data: [{ customer_id: "c-1" }], error: null });
    db.__qb.resolveOnce({
      data: [
        { work_order_id: "wo-1", final_price: "60" },
        { work_order_id: "wo-2", final_price: "40" },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [{ work_order_id: "wo-3", final_price: "20" }],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        { id: "c-1", first_name: "Alice", last_name: null },
        { id: "c-2", first_name: "Bob", last_name: "B" },
      ],
      error: null,
    });

    const result = await getCustomerRetention(
      db as never,
      ORG_ID,
      "2025-06-01",
      "2025-06-30",
    );

    expect(result).toEqual({
      total_customers: 2,
      returning_customers: 1,
      new_customers: 1,
      retention_rate: 50,
      avg_visits_per_customer: 1.5,
      avg_lifetime_value: 90,
      top_customers: [
        {
          customer_id: "c-1",
          customer_name: "Alice",
          total_revenue: 80,
          visit_count: 2,
        },
        {
          customer_id: "c-2",
          customer_name: "Bob B",
          total_revenue: 40,
          visit_count: 1,
        },
      ],
    });
    // WOs scoped to org, period, and completed status
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

  it("passes the branch to withBranchFilter for all scoped queries", async () => {
    db.__qb.resolveOnce({
      data: [
        { id: "wo-1", customer_id: "c-1", created_at: "2025-06-10T10:00:00Z" },
      ],
      error: null,
    });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });

    await getCustomerRetention(
      db as never,
      ORG_ID,
      "2025-06-01",
      "2025-06-30",
      BRANCH_ID,
    );

    expect(mockWithBranchFilter).toHaveBeenCalledTimes(3);
    for (const call of mockWithBranchFilter.mock.calls) {
      expect(call[1]).toBe(BRANCH_ID);
    }
  });

  it("returns zeroed metrics when no WOs exist in the period", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await getCustomerRetention(
      db as never,
      ORG_ID,
      "2025-06-01",
      "2025-06-30",
    );

    expect(result).toEqual({
      total_customers: 0,
      returning_customers: 0,
      new_customers: 0,
      retention_rate: 0,
      avg_visits_per_customer: 0,
      avg_lifetime_value: 0,
      top_customers: [],
    });
    expect(db.from).toHaveBeenCalledTimes(1);
  });

  it("uses Customer as the fallback name when profiles are missing", async () => {
    db.__qb.resolveOnce({
      data: [
        { id: "wo-1", customer_id: "c-1", created_at: "2025-06-10T10:00:00Z" },
      ],
      error: null,
    });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({
      data: [{ id: "c-1", first_name: null, last_name: null }],
      error: null,
    });

    const result = await getCustomerRetention(
      db as never,
      ORG_ID,
      "2025-06-01",
      "2025-06-30",
    );

    expect(result.top_customers).toEqual([
      {
        customer_id: "c-1",
        customer_name: "Customer",
        total_revenue: 0,
        visit_count: 1,
      },
    ]);
    expect(result.returning_customers).toBe(0); // no previous visits -> new
    expect(result.new_customers).toBe(1);
  });
});
