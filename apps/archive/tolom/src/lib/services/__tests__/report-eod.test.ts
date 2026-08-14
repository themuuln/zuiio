import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

// Deterministic date math regardless of host timezone.
process.env.TZ = "UTC";

vi.mock("@/lib/supabase/with-branch", () => ({
  withBranchFilter: vi.fn((query: unknown) => query),
}));

import { withBranchFilter } from "@/lib/supabase/with-branch";

const mockWithBranchFilter = vi.mocked(withBranchFilter);

import { getEndOfDaySummary } from "../report-service/eod";

const ORG_ID = "org-1";
const BRANCH_ID = "b-1";
const MECHANIC_ID = "m-1";

let db: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
  mockWithBranchFilter.mockImplementation((query) => query);
});

afterEach(() => {
  vi.useRealTimers();
});

// ── getEndOfDaySummary ──────────────────────────────────────────

describe("getEndOfDaySummary", () => {
  it("aggregates mechanics, revenue, payments, and open items for the day", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));

    db.__qb.resolveOnce({
      data: [
        { id: "wo-1", mechanic_id: MECHANIC_ID },
        { id: "wo-2", mechanic_id: MECHANIC_ID },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [{ id: MECHANIC_ID, full_name: "Mia" }],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [{ final_price: "100", work_order_id: "wo-1" }],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [{ final_price: "50", work_order_id: "wo-2" }],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [{ mechanic_id: MECHANIC_ID, commission_amount: "20" }],
      error: null,
    });
    db.__qb.resolveOnce({ count: 3, data: null, error: null });
    db.__qb.resolveOnce({
      data: [
        { payment_method: "cash", amount: "100" },
        { payment_method: "CARD", amount: "50" },
        { payment_method: "crypto", amount: "7" },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [{ balance_due: "30" }, { balance_due: null }],
      error: null,
    });
    db.from("work_orders").maybeSingle.mockResolvedValueOnce({
      data: {
        id: "wo-9",
        description: "Engine noise",
        created_at: "2025-06-12T10:00:00Z",
        customers: { full_name: "Alice" },
      },
      error: null,
    });

    const result = await getEndOfDaySummary(db as never, ORG_ID, "2025-06-15");

    expect(result).toEqual({
      date: "2025-06-15",
      mechanics: [
        {
          mechanic_id: MECHANIC_ID,
          mechanic_name: "Mia",
          work_orders_completed: 2,
          services_count: 1,
          parts_count: 1,
          total_revenue: 150,
          total_commission: 20,
        },
      ],
      total_work_orders: 2,
      total_revenue: 150,
      total_commission: 20,
      open_work_orders: 3,
      payment_breakdown: { cash: 100, card: 50, bank_transfer: 0, other: 7 },
      unpaid_invoices: { count: 2, total: 30 },
      best_mechanic: { id: MECHANIC_ID, name: "Mia", revenue: 150, jobs: 2 },
      biggest_issue: {
        description: "Engine noise",
        work_order_id: "wo-9",
        customer: "Alice",
        days_open: 3,
      },
    });
    // Work orders scoped to the org, completed status, and day window
    expect(db.from("work_orders").eq).toHaveBeenCalledWith(
      "organization_id",
      ORG_ID,
    );
    expect(db.from("work_orders").eq).toHaveBeenCalledWith(
      "status",
      "Completed",
    );
    expect(db.from("work_orders").gte).toHaveBeenCalledWith(
      "completed_at",
      "2025-06-15T00:00:00",
    );
    expect(db.from("work_orders").lte).toHaveBeenCalledWith(
      "completed_at",
      "2025-06-15T23:59:59",
    );
    expect(db.from("work_orders").is).toHaveBeenCalledWith("deleted_at", null);
  });

  it("filters by mechanic and falls back to Unknown names", async () => {
    db.__qb.resolveOnce({
      data: [{ id: "wo-1", mechanic_id: MECHANIC_ID }],
      error: null,
    });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ count: 1, data: null, error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.from("work_orders").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const result = await getEndOfDaySummary(
      db as never,
      ORG_ID,
      "2025-06-15",
      null,
      MECHANIC_ID,
    );

    expect(db.from("work_orders").eq).toHaveBeenCalledWith(
      "mechanic_id",
      MECHANIC_ID,
    );
    expect(result.mechanics).toEqual([
      {
        mechanic_id: MECHANIC_ID,
        mechanic_name: "Unknown",
        work_orders_completed: 1,
        services_count: 0,
        parts_count: 0,
        total_revenue: 0,
        total_commission: 0,
      },
    ]);
    expect(result.total_work_orders).toBe(1);
    expect(result.best_mechanic).toBeNull();
    expect(result.biggest_issue).toBeNull();
  });

  it("counts open work orders by row length when a branch is set", async () => {
    db.__qb.resolveOnce({
      data: [{ id: "wo-1", mechanic_id: MECHANIC_ID }],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [{ id: MECHANIC_ID, full_name: "Mia" }],
      error: null,
    });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({
      data: [{ id: "a" }, { id: "b" }, { id: "c" }],
      error: null,
    });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.from("work_orders").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const result = await getEndOfDaySummary(
      db as never,
      ORG_ID,
      "2025-06-15",
      BRANCH_ID,
    );

    expect(mockWithBranchFilter).toHaveBeenLastCalledWith(
      expect.anything(),
      BRANCH_ID,
    );
    expect(db.from("work_orders").eq).toHaveBeenCalledWith(
      "branch_id",
      BRANCH_ID,
    );
    expect(result.open_work_orders).toBe(3);
    expect(result.total_work_orders).toBe(1);
    expect(result.best_mechanic).toBeNull(); // zero revenue -> no best mechanic
  });

  it("returns a zeroed summary on an empty day, with open counts from the head query", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));

    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ count: 5, data: null, error: null });
    db.__qb.resolveOnce({
      data: [{ balance_due: "10" }, { balance_due: "20" }],
      error: null,
    });
    db.from("work_orders").maybeSingle.mockResolvedValueOnce({
      data: {
        id: "wo-9",
        description: null,
        created_at: "2025-06-12T10:00:00Z",
        customers: { full_name: "Alice" },
      },
      error: null,
    });

    const result = await getEndOfDaySummary(db as never, ORG_ID, "2025-06-15");

    expect(result).toEqual({
      date: "2025-06-15",
      mechanics: [],
      total_work_orders: 0,
      total_revenue: 0,
      total_commission: 0,
      open_work_orders: 5,
      payment_breakdown: { cash: 0, card: 0, bank_transfer: 0, other: 0 },
      unpaid_invoices: { count: 2, total: 30 },
      best_mechanic: null,
      biggest_issue: {
        description: "Open work order",
        work_order_id: "wo-9",
        customer: "Alice",
        days_open: 3,
      },
    });
    expect(db.from).not.toHaveBeenCalledWith("profiles");
    expect(db.from).not.toHaveBeenCalledWith("payments");
  });

  it("keeps open work orders as a row count on empty days with a branch", async () => {
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({
      data: [{ id: "a" }, { id: "b" }],
      error: null,
    });
    db.__qb.resolveOnce({ data: [{ balance_due: "15" }], error: null });
    db.from("work_orders").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const result = await getEndOfDaySummary(
      db as never,
      ORG_ID,
      "2025-06-15",
      BRANCH_ID,
    );

    expect(result.open_work_orders).toBe(2);
    expect(result.unpaid_invoices).toEqual({ count: 1, total: 15 });
    expect(result.biggest_issue).toBeNull();
  });

  it("handles work orders without a mechanic", async () => {
    db.__qb.resolveOnce({
      data: [{ id: "wo-1", mechanic_id: null }],
      error: null,
    });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ count: 2, data: null, error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.from("work_orders").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const result = await getEndOfDaySummary(db as never, ORG_ID, "2025-06-15");

    // Profiles query skipped — no mechanic ids
    expect(db.from).not.toHaveBeenCalledWith("profiles");
    expect(result.mechanics).toEqual([]);
    expect(result.total_work_orders).toBe(0);
    expect(result.best_mechanic).toBeNull();
  });
});
