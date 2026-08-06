import { beforeEach, describe, expect, it } from "vitest";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";
import {
  enrichReport,
  fetchCompletedWoIds,
  fetchWoRevenue,
} from "../report-helpers";

const ORG_ID = "org-1";

function svcRow(
  workOrderId: string,
  finalPrice: string,
  unitCost: string | null,
  quantity: number | null,
  discount: string | null,
) {
  return {
    final_price: finalPrice,
    unit_cost: unitCost,
    quantity,
    discount_amount: discount,
    service_name: "Oil Change",
    work_order_id: workOrderId,
  };
}

function partRow(
  workOrderId: string,
  finalPrice: string,
  unitCost: string | null,
  quantity: number | null,
  discount: string | null,
) {
  return {
    final_price: finalPrice,
    unit_cost: unitCost,
    quantity,
    discount_amount: discount,
    work_order_id: workOrderId,
  };
}

let db: MockSupabaseClient;

beforeEach(() => {
  db = createMockSupabaseClient();
});

// ── fetchCompletedWoIds ──────────────────────────────────────────

describe("fetchCompletedWoIds", () => {
  it("returns WO ids filtered by org, status, date range, and mechanic", async () => {
    db.__qb.resolveOnce({
      data: [{ id: "wo-1" }, { id: "wo-2" }],
      error: null,
    });

    const ids = await fetchCompletedWoIds(db as never, {
      orgId: ORG_ID,
      dateFrom: "2025-06-01",
      dateTo: "2025-06-30",
      mechanicId: "mech-1",
    });

    expect(ids).toEqual(["wo-1", "wo-2"]);

    const qb = db.from("work_orders");
    expect(qb.select).toHaveBeenCalledWith("id");
    expect(qb.eq).toHaveBeenCalledWith("organization_id", ORG_ID);
    expect(qb.eq).toHaveBeenCalledWith("status", "Completed");
    expect(qb.eq).toHaveBeenCalledWith("mechanic_id", "mech-1");
    expect(qb.gte).toHaveBeenCalledWith("created_at", "2025-06-01T00:00:00");
    expect(qb.lte).toHaveBeenCalledWith("created_at", "2025-06-30T23:59:59");
    expect(qb.is).toHaveBeenCalledWith("deleted_at", null);
  });

  it("omits the mechanic filter when mechanicId is not provided", async () => {
    db.__qb.resolveOnce({ data: [{ id: "wo-1" }], error: null });

    await fetchCompletedWoIds(db as never, {
      orgId: ORG_ID,
      dateFrom: "2025-06-01",
      dateTo: "2025-06-30",
    });

    expect(db.from("work_orders").eq).not.toHaveBeenCalledWith(
      "mechanic_id",
      expect.anything(),
    );
  });

  it("supports a custom select", async () => {
    db.__qb.resolveOnce({
      data: [{ id: "wo-1", mechanic_id: "mech-1" }],
      error: null,
    });

    const ids = await fetchCompletedWoIds(db as never, {
      orgId: ORG_ID,
      dateFrom: "2025-06-01",
      dateTo: "2025-06-30",
      select: "id, mechanic_id",
    });

    expect(ids).toEqual(["wo-1"]);
    expect(db.from("work_orders").select).toHaveBeenCalledWith(
      "id, mechanic_id",
    );
  });

  it("returns [] when data is null", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    const ids = await fetchCompletedWoIds(db as never, {
      orgId: ORG_ID,
      dateFrom: "2025-06-01",
      dateTo: "2025-06-30",
    });

    expect(ids).toEqual([]);
  });

  it("throws when the query returns an error", async () => {
    const dbError = new Error("db down");
    db.__qb.resolveOnce({
      data: [{ id: "wo-1" }],
      error: dbError,
    });

    const promise = fetchCompletedWoIds(db as never, {
      orgId: ORG_ID,
      dateFrom: "2025-06-01",
      dateTo: "2025-06-30",
    });

    await expect(promise).rejects.toThrow(dbError);
  });
});

// ── fetchWoRevenue ───────────────────────────────────────────────

describe("fetchWoRevenue", () => {
  it("computes revenue/cost aggregates from services and parts", async () => {
    db.__qb.resolveOnce({
      data: [
        {
          final_price: "100",
          unit_cost: "40",
          quantity: 2,
          discount_amount: "5",
        },
        {
          final_price: "50",
          unit_cost: null,
          quantity: null,
          discount_amount: null,
        },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        {
          final_price: "30",
          unit_cost: "10",
          quantity: 3,
          discount_amount: "2",
        },
      ],
      error: null,
    });

    const result = await fetchWoRevenue(db as never, ["wo-1", "wo-2"]);

    expect(result.serviceRevenue).toBe(150);
    expect(result.serviceCost).toBe(80); // 40*2 + 0*1
    expect(result.partsRevenue).toBe(30);
    expect(result.partsCost).toBe(30); // 10*3
    expect(result.totalRevenue).toBe(180);
    expect(result.totalCost).toBe(110);
    expect(result.grossProfit).toBe(70);
    expect(result.serviceCount).toBe(2);
    expect(result.partsCount).toBe(1);
    expect(result.totalDiscounts).toBe(7);
  });

  it("returns zeros for empty woIds without querying", async () => {
    const result = await fetchWoRevenue(db as never, []);

    expect(result).toEqual({
      serviceRevenue: 0,
      serviceCost: 0,
      partsRevenue: 0,
      partsCost: 0,
      totalRevenue: 0,
      totalCost: 0,
      grossProfit: 0,
      serviceCount: 0,
      partsCount: 0,
      totalDiscounts: 0,
    });
    expect(db.from).not.toHaveBeenCalled();
  });

  it("treats null data as empty", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await fetchWoRevenue(db as never, ["wo-1"]);

    expect(result.totalRevenue).toBe(0);
    expect(result.serviceCount).toBe(0);
    expect(result.partsCount).toBe(0);
  });

  it("throws when a query returns an error", async () => {
    const svcError = new Error("boom");
    db.__qb.resolveOnce({
      data: [
        {
          final_price: "10",
          unit_cost: "5",
          quantity: 1,
          discount_amount: "0",
        },
      ],
      error: svcError,
    });
    db.__qb.resolveOnce({ data: [], error: null });

    const promise = fetchWoRevenue(db as never, ["wo-1"]);

    await expect(promise).rejects.toThrow(svcError);
  });
});

// ── enrichReport ─────────────────────────────────────────────────

describe("enrichReport", () => {
  it("composes profitability and comparison, skipping KPIs for a single mechanic", async () => {
    db.__qb.resolveOnce({
      data: [svcRow("wo-1", "200", "80", 1, "0")],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [partRow("wo-1", "50", "20", 2, "0")],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [{ id: "wo-p1" }, { id: "wo-p2" }],
      error: null,
    });
    db.__qb.resolveOnce({ data: [{ final_price: "100" }], error: null });
    db.__qb.resolveOnce({ data: [{ final_price: "40" }], error: null });

    const result = await enrichReport(
      db as never,
      ORG_ID,
      ["wo-1"],
      "2025-06-01",
      "2025-06-30",
      "mech-1",
      200,
    );

    expect(result.mechanicKpis).toEqual([]);
    expect(result.profitability).toEqual({
      gross_profit: 130,
      margin_percent: 52,
      service_revenue: 200,
      service_cost: 80,
      parts_revenue: 50,
      parts_cost: 40,
      total_cost: 120,
      effective_labor_rate: 200,
      avg_repair_order: 250,
      parts_to_labor_ratio: 0.25,
    });
    expect(result.comparison).toEqual({
      work_orders_completed: 2,
      total_revenue: 140,
      services_count: 1,
      parts_count: 1,
      revenue_change_pct: 42.9,
      work_orders_change_pct: null,
    });

    // Previous period is the same length immediately before currentStart
    const qb = db.from("work_orders");
    expect(qb.gte).toHaveBeenCalledWith("created_at", "2025-05-02T00:00:00");
    expect(qb.lte).toHaveBeenCalledWith("created_at", "2025-05-31T23:59:59");
  });

  it("returns null comparison when the previous period has no work orders", async () => {
    db.__qb.resolveOnce({
      data: [svcRow("wo-1", "100", "40", 1, "0")],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [partRow("wo-1", "10", "5", 1, "0")],
      error: null,
    });
    db.__qb.resolveOnce({ data: [], error: null });
    // KPI phase 1 fires even though comparison is null
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await enrichReport(
      db as never,
      ORG_ID,
      ["wo-1"],
      "2025-06-01",
      "2025-06-30",
      null,
      100,
    );

    expect(result.comparison).toBeNull();
    expect(result.profitability).not.toBeNull();
    expect(result.mechanicKpis).toEqual([]);
  });

  it("returns null revenue_change_pct when previous revenue is zero", async () => {
    db.__qb.resolveOnce({
      data: [svcRow("wo-1", "100", "40", 1, "0")],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [partRow("wo-1", "10", "5", 1, "0")],
      error: null,
    });
    db.__qb.resolveOnce({ data: [{ id: "wo-p1" }], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    // KPI phase 1 fires even though mechanicId is null
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await enrichReport(
      db as never,
      ORG_ID,
      ["wo-1"],
      "2025-06-01",
      "2025-06-30",
      null,
      100,
    );

    expect(result.comparison).toEqual({
      work_orders_completed: 1,
      total_revenue: 0,
      services_count: 0,
      parts_count: 0,
      revenue_change_pct: null,
      work_orders_change_pct: null,
    });
    expect(result.mechanicKpis).toEqual([]);
  });

  it("returns null profitability and empty KPIs when woIds is empty", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await enrichReport(
      db as never,
      ORG_ID,
      [],
      "2025-06-01",
      "2025-06-30",
      null,
      0,
    );

    expect(result.profitability).toBeNull();
    expect(result.comparison).toBeNull();
    expect(result.mechanicKpis).toEqual([]);
  });

  it("computes mechanic KPIs with satisfaction, reviews, names, and sorting", async () => {
    // profitability: svcs + parts
    db.__qb.resolveOnce({
      data: [svcRow("wo-1a", "170", "70", 1, "0")],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [partRow("wo-1a", "20", "5", 2, "0")],
      error: null,
    });
    // comparison: no previous WOs -> null
    db.__qb.resolveOnce({ data: [], error: null });
    // KPI phase 1: mechanics, services, parts, completion data, customer rows
    db.__qb.resolveOnce({
      data: [
        { id: "wo-1a", mechanic_id: "m-1" },
        { id: "wo-1b", mechanic_id: "m-1" },
        { id: "wo-2", mechanic_id: "m-2" },
        { id: "wo-3", mechanic_id: "m-2" },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        { final_price: "100", work_order_id: "wo-1a" },
        { final_price: "50", work_order_id: "wo-1b" },
        { final_price: "60", work_order_id: "wo-2" },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [{ final_price: "20", work_order_id: "wo-1a" }],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        {
          work_order_id: "wo-1a",
          customer_satisfaction: 4,
          customer_feedback: "ok",
          created_at: "2025-06-10T10:00:00Z",
        },
        {
          work_order_id: "wo-1b",
          customer_satisfaction: 5,
          customer_feedback: "great",
          created_at: "2025-06-12T10:00:00Z",
        },
        {
          work_order_id: "wo-2",
          customer_satisfaction: 3,
          customer_feedback: null,
          created_at: "2025-06-11T10:00:00Z",
        },
        {
          work_order_id: "wo-3",
          customer_satisfaction: null,
          customer_feedback: "ignored",
          created_at: "2025-06-13T10:00:00Z",
        },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        { id: "wo-1a", customer_id: "c-1" },
        { id: "wo-1b", customer_id: "c-1" },
        { id: "wo-2", customer_id: "c-2" },
        { id: "wo-3", customer_id: null },
      ],
      error: null,
    });
    // KPI phase 2: profiles + customers
    db.__qb.resolveOnce({
      data: [
        { id: "m-1", full_name: "Mia" },
        { id: "m-2", full_name: null },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        { id: "c-1", first_name: "Alice", last_name: "A" },
        { id: "c-2", first_name: null, last_name: null },
      ],
      error: null,
    });

    const result = await enrichReport(
      db as never,
      ORG_ID,
      ["wo-1a", "wo-1b", "wo-2", "wo-3"],
      "2025-06-01",
      "2025-06-30",
      null,
      190,
    );

    expect(result.comparison).toBeNull();
    expect(result.profitability?.gross_profit).toBe(110);
    expect(result.profitability?.margin_percent).toBe(57.9);

    expect(result.mechanicKpis).toHaveLength(2);
    // Sorted by total revenue desc: m-1 (170 incl. parts) before m-2 (60)
    expect(result.mechanicKpis[0].mechanic_id).toBe("m-1");
    expect(result.mechanicKpis[0]).toMatchObject({
      mechanic_name: "Mia",
      work_orders_completed: 2,
      services_count: 2,
      parts_count: 1,
      total_revenue: 170,
      avg_revenue_per_wo: 85,
      avg_satisfaction: 4.5,
      total_reviews: 2,
    });
    // Reviews sorted by date desc, customer names resolved
    expect(result.mechanicKpis[0].recent_reviews).toEqual([
      {
        rating: 5,
        feedback: "great",
        customer_name: "Alice A",
        date: "2025-06-12T10:00:00Z",
      },
      {
        rating: 4,
        feedback: "ok",
        customer_name: "Alice A",
        date: "2025-06-10T10:00:00Z",
      },
    ]);

    expect(result.mechanicKpis[1].mechanic_id).toBe("m-2");
    expect(result.mechanicKpis[1]).toMatchObject({
      mechanic_name: "Unknown",
      work_orders_completed: 2,
      services_count: 1,
      parts_count: 0,
      total_revenue: 60,
      avg_revenue_per_wo: 30,
      avg_satisfaction: 3,
      total_reviews: 1,
    });
    // wo-3 has no completion data -> no review row; missing customer -> "Customer"
    expect(result.mechanicKpis[1].recent_reviews).toEqual([
      {
        rating: 3,
        feedback: null,
        customer_name: "Customer",
        date: "2025-06-11T10:00:00Z",
      },
    ]);
  });

  it("returns empty mechanic KPIs when no work order has a mechanic", async () => {
    db.__qb.resolveOnce({
      data: [svcRow("wo-1", "100", "40", 1, "0")],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [partRow("wo-1", "10", "5", 1, "0")],
      error: null,
    });
    db.__qb.resolveOnce({ data: [], error: null });
    // KPI phase 1: all five queries fire, but no mechanic rows
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await enrichReport(
      db as never,
      ORG_ID,
      ["wo-1"],
      "2025-06-01",
      "2025-06-30",
      null,
      100,
    );

    expect(result.mechanicKpis).toEqual([]);
    expect(result.profitability?.gross_profit).toBe(65);
    // Phase 2 (profiles/customers) never runs
    expect(db.from).not.toHaveBeenCalledWith("profiles");
    expect(db.from).not.toHaveBeenCalledWith("customers");
  });
});
