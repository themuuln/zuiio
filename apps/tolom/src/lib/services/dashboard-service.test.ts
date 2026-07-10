import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import { getDashboardStats } from "./dashboard-service";

describe("getDashboardStats", () => {
  let db: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = createMockSupabaseClient();
  });

  it("returns zeros when orgId is empty", async () => {
    const stats = await getDashboardStats(db as unknown as SupabaseClient, "");

    expect(stats.totalWorkOrders).toBe(0);
    expect(stats.activeWorkOrders).toBe(0);
    expect(stats.totalCustomers).toBe(0);
    expect(stats.monthlyRevenue).toBe(0);
  });

  it("aggregates counts from parallel queries", async () => {
    // Promise.all runs 5 queries in parallel, all using the same qb.
    // The resolved value applies to ALL of them.
    db.__qb.resolveWith({
      count: 42,
      data: [{ amount: 500000 }, { amount: 300000 }, { amount: 100000 }],
      error: null,
    });

    const stats = await getDashboardStats(
      db as unknown as SupabaseClient,
      "org-1",
    );

    // All 5 queries get the same resolved value, so:
    // - work_orders count → 42 (used as totalWorkOrders)
    // - work_orders active count → 42 (used as activeWorkOrders)
    // - customers count → 42 (used as totalCustomers)
    // - invoice_payments data → [{amount: 500000}, {amount: 300000}, {amount: 100000}]
    // - payments data → [{amount: 500000}, {amount: 300000}, {amount: 100000}]
    expect(stats.totalWorkOrders).toBe(42);
    expect(stats.activeWorkOrders).toBe(42);
    expect(stats.totalCustomers).toBe(42);
    // Revenue: 500000 + 300000 + 100000 + 500000 + 300000 + 100000 = 1800000
    expect(stats.monthlyRevenue).toBe(1800000);
  });

  it("handles null data gracefully", async () => {
    db.__qb.resolveWith({ count: 0, data: null, error: null });

    const stats = await getDashboardStats(
      db as unknown as SupabaseClient,
      "org-1",
    );

    expect(stats.monthlyRevenue).toBe(0);
  });

  it("handles non-numeric amounts gracefully", async () => {
    db.__qb.resolveWith({
      count: 1,
      data: [{ amount: null }, { amount: "not-a-number" }],
      error: null,
    });

    const stats = await getDashboardStats(
      db as unknown as SupabaseClient,
      "org-1",
    );

    // null and NaN both coerce to 0 via Number() || 0
    expect(stats.monthlyRevenue).toBe(0);
  });
});
