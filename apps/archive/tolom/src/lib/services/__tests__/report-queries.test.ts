import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

vi.mock("@/lib/supabase/with-branch", () => ({
  withBranchFilter: vi.fn((query) => query),
}));

import { withBranchFilter } from "@/lib/supabase/with-branch";

const mockWithBranchFilter = vi.mocked(withBranchFilter);

import {
  getCustomerAcquisitionTrendBatched,
  getRecentWorkOrdersBatched,
  getRevenueTrendBatched,
  getServiceCategoryBreakdownBatched,
  getTechnicianPerformanceBatched,
  getTopServicesBatched,
} from "../report-service/queries";

const ORG_ID = "org-1";

let db: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
  mockWithBranchFilter.mockImplementation((query) => query);
});

afterEach(() => {
  vi.useRealTimers();
});

// ── getRevenueTrendBatched ───────────────────────────────────────

describe("getRevenueTrendBatched", () => {
  it("groups daily services + parts revenue by WO date", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));

    db.__qb.resolveOnce({
      data: [
        { id: "wo-1", updated_at: "2025-06-15T10:00:00Z" },
        { id: "wo-2", updated_at: "2025-06-15T08:00:00Z" },
        { id: "wo-3", updated_at: "2025-06-14T09:00:00Z" },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        { final_price: "100", work_order_id: "wo-1" },
        { final_price: "50", work_order_id: "wo-3" },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [{ final_price: "30", work_order_id: "wo-2" }],
      error: null,
    });

    const result = await getRevenueTrendBatched(db as never, ORG_ID, 2);

    expect(result).toEqual([
      { date: "2025-06-14", revenue: 50, workOrders: 1 },
      { date: "2025-06-15", revenue: 130, workOrders: 2 },
    ]);
    expect(mockWithBranchFilter).toHaveBeenLastCalledWith(
      expect.anything(),
      null,
    );
  });

  it("passes branchId to withBranchFilter", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    await getRevenueTrendBatched(db as never, ORG_ID, 2, "branch-1");

    expect(mockWithBranchFilter).toHaveBeenLastCalledWith(
      expect.anything(),
      "branch-1",
    );
  });

  it("returns zero rows for every date when no WOs exist", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));

    db.__qb.resolveOnce({ data: [], error: null });

    const result = await getRevenueTrendBatched(db as never, ORG_ID, 3);

    expect(result).toEqual([
      { date: "2025-06-13", revenue: 0, workOrders: 0 },
      { date: "2025-06-14", revenue: 0, workOrders: 0 },
      { date: "2025-06-15", revenue: 0, workOrders: 0 },
    ]);
    // services/parts queries are skipped entirely
    expect(db.from).toHaveBeenCalledTimes(1);
  });
});

// ── getTopServicesBatched ────────────────────────────────────────

describe("getTopServicesBatched", () => {
  it("aggregates revenue and count per service name, sorted desc", async () => {
    db.__qb.resolveOnce({
      data: [
        { service_name: "Oil Change", final_price: "100" },
        { service_name: "Brake Pad", final_price: "200" },
        { service_name: "Oil Change", final_price: "50" },
      ],
      error: null,
    });

    const result = await getTopServicesBatched(db as never, ["wo-1", "wo-2"]);

    expect(result).toEqual([
      { name: "Brake Pad", revenue: 200, count: 1 },
      { name: "Oil Change", revenue: 150, count: 2 },
    ]);
  });

  it("limits results to the top 10", async () => {
    const rows = Array.from({ length: 12 }, (_, i) => ({
      service_name: `svc-${i + 1}`,
      final_price: String(i + 1),
    }));
    db.__qb.resolveOnce({ data: rows, error: null });

    const result = await getTopServicesBatched(db as never, ["wo-1"]);

    expect(result).toHaveLength(10);
    expect(result[0].name).toBe("svc-12");
    expect(result[9].name).toBe("svc-3");
  });

  it("returns [] for empty completedWoIds without querying", async () => {
    const result = await getTopServicesBatched(db as never, []);

    expect(result).toEqual([]);
    expect(db.from).not.toHaveBeenCalled();
  });
});

// ── getTechnicianPerformanceBatched ──────────────────────────────

describe("getTechnicianPerformanceBatched", () => {
  it("computes per-mechanic orders and revenue, sorted desc", async () => {
    db.__qb.resolveOnce({
      data: [
        { user_id: "m-1", branch_id: "b-1", roles: [{ name: "Mechanic" }] },
        { user_id: "m-2", branch_id: "b-2", roles: [{ name: "Mechanic" }] },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        { id: "m-1", full_name: "Mia" },
        { id: "m-2", full_name: null },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        { id: "wo-1", mechanic_id: "m-1" },
        { id: "wo-2", mechanic_id: "m-1" },
        { id: "wo-3", mechanic_id: "m-2" },
        { id: "wo-4", mechanic_id: null },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        { final_price: "100", work_order_id: "wo-1" },
        { final_price: "60", work_order_id: "wo-3" },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [{ final_price: "20", work_order_id: "wo-2" }],
      error: null,
    });

    const result = await getTechnicianPerformanceBatched(db as never, ORG_ID, [
      "wo-1",
      "wo-2",
      "wo-3",
      "wo-4",
    ]);

    expect(result).toEqual([
      { id: "m-1", name: "Mia", completedOrders: 2, revenue: 120 },
      { id: "m-2", name: "Unknown", completedOrders: 1, revenue: 60 },
    ]);
  });

  it("scopes mechanics to the branch when branchId is provided", async () => {
    db.__qb.resolveOnce({
      data: [
        { user_id: "m-1", branch_id: "b-1", roles: [] },
        { user_id: "m-2", branch_id: "b-2", roles: [] },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [{ id: "m-1", full_name: "Mia" }],
      error: null,
    });
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await getTechnicianPerformanceBatched(
      db as never,
      ORG_ID,
      [],
      "b-1",
    );

    expect(result).toEqual([
      { id: "m-1", name: "Mia", completedOrders: 0, revenue: 0 },
    ]);
    expect(mockWithBranchFilter).toHaveBeenLastCalledWith(
      expect.anything(),
      "b-1",
    );
  });

  it("returns [] when no mechanics exist", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await getTechnicianPerformanceBatched(db as never, ORG_ID, [
      "wo-1",
    ]);

    expect(result).toEqual([]);
    expect(db.from).not.toHaveBeenCalledWith("profiles");
  });
});

// ── getRecentWorkOrdersBatched ───────────────────────────────────

describe("getRecentWorkOrdersBatched", () => {
  it("composes details with services, parts, history, customer, vehicle, mechanic", async () => {
    db.__qb.resolveOnce({
      data: [
        {
          id: "wo-1",
          organization_id: ORG_ID,
          customer_id: "c-1",
          vehicle_id: "v-1",
          mechanic_id: "m-1",
          status: "Completed",
          total: 200,
        },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        { id: "s-1", work_order_id: "wo-1", service_name: "Oil Change" },
        { id: "s-2", work_order_id: "wo-other", service_name: "Other" },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [{ id: "p-1", work_order_id: "wo-1", part_name: "Filter" }],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [{ id: "h-1", work_order_id: "wo-1", status: "Completed" }],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [{ id: "c-1", first_name: "Alice", last_name: "A" }],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [{ id: "v-1", plate_number: "123-ABC" }],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [{ id: "m-1", full_name: "Mia" }],
      error: null,
    });

    const result = await getRecentWorkOrdersBatched(db as never, ["wo-1"]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "wo-1",
      status: "Completed",
      total: 200,
      customer: { id: "c-1", first_name: "Alice", last_name: "A" },
      vehicle: { id: "v-1", plate_number: "123-ABC" },
      mechanic: { id: "m-1", full_name: "Mia" },
    });
    // Only this WO's services attach — s-2 belongs to another WO
    expect(result[0].services).toEqual([
      { id: "s-1", work_order_id: "wo-1", service_name: "Oil Change" },
    ]);
    expect(result[0].parts).toEqual([
      { id: "p-1", work_order_id: "wo-1", part_name: "Filter" },
    ]);
    expect(result[0].status_history).toEqual([
      { id: "h-1", work_order_id: "wo-1", status: "Completed" },
    ]);
  });

  it("returns null relations when a WO has no customer, vehicle, or mechanic", async () => {
    db.__qb.resolveOnce({
      data: [{ id: "wo-2", status: "In Progress" }],
      error: null,
    });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await getRecentWorkOrdersBatched(db as never, ["wo-2"]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "wo-2",
      customer: null,
      vehicle: null,
      mechanic: null,
      services: [],
      parts: [],
      status_history: [],
    });
    // customers/vehicles/profiles queries skipped
    expect(db.from).not.toHaveBeenCalledWith("customers");
    expect(db.from).not.toHaveBeenCalledWith("vehicles");
    expect(db.from).not.toHaveBeenCalledWith("profiles");
  });

  it("returns [] for empty woIds without querying", async () => {
    const result = await getRecentWorkOrdersBatched(db as never, []);

    expect(result).toEqual([]);
    expect(db.from).not.toHaveBeenCalled();
  });
});

// ── getServiceCategoryBreakdownBatched ───────────────────────────

describe("getServiceCategoryBreakdownBatched", () => {
  it("rolls revenue and counts up by catalog category, sorted desc", async () => {
    db.__qb.resolveOnce({
      data: [
        { id: "cat-1", category: "Maintenance" },
        { id: "cat-2", category: "Maintenance" },
        { id: "cat-3", category: "Repair" },
        { id: "cat-4", category: null },
        { id: "cat-5", category: "Other" },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        { service_catalog_id: "cat-1", final_price: "100" },
        { service_catalog_id: "cat-1", final_price: "50" },
        { service_catalog_id: "cat-2", final_price: "30" },
        { service_catalog_id: "cat-3", final_price: "200" },
        { service_catalog_id: "cat-9", final_price: "999" },
        { service_catalog_id: null, final_price: "5" },
      ],
      error: null,
    });

    const result = await getServiceCategoryBreakdownBatched(
      db as never,
      ORG_ID,
      ["wo-1"],
    );

    expect(result).toEqual([
      { category: "Repair", revenue: 200, count: 1 },
      { category: "Maintenance", revenue: 180, count: 3 },
    ]);
  });

  it("returns [] for empty completed ids without querying", async () => {
    const result = await getServiceCategoryBreakdownBatched(
      db as never,
      ORG_ID,
      [],
    );

    expect(result).toEqual([]);
    expect(db.from).not.toHaveBeenCalled();
  });
});

// ── getCustomerAcquisitionTrendBatched ───────────────────────────

describe("getCustomerAcquisitionTrendBatched", () => {
  it("returns 12 monthly buckets ending at the current month", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));

    db.__qb.resolveOnce({
      data: [
        { created_at: "2025-06-10T10:00:00Z" },
        { created_at: "2025-06-11T10:00:00Z" },
        { created_at: "2025-03-05T10:00:00Z" },
        { created_at: null },
      ],
      error: null,
    });

    const result = await getCustomerAcquisitionTrendBatched(
      db as never,
      ORG_ID,
    );

    expect(result).toHaveLength(12);
    expect(result[0].month).toBe("2024-07");
    expect(result[11]).toEqual({ month: "2025-06", newCustomers: 2 });
    expect(result[8]).toEqual({ month: "2025-03", newCustomers: 1 });
    // months with no customers default to 0
    expect(result[5]).toEqual({ month: "2024-12", newCustomers: 0 });
  });

  it("passes branchId to withBranchFilter", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    await getCustomerAcquisitionTrendBatched(db as never, ORG_ID, "branch-1");

    expect(mockWithBranchFilter).toHaveBeenLastCalledWith(
      expect.anything(),
      "branch-1",
    );
  });
});
