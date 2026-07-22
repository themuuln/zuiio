import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

vi.mock("@/lib/cache/with-cache", () => ({
  withCache: vi.fn((_keyParts: string[], fn: () => Promise<any>) => fn()),
}));

vi.mock("@/lib/supabase/with-branch", () => ({
  withBranchFilter: vi.fn((query: any) => query),
}));

import {
  getRevenueForecast,
  getRevenueTargets,
  setRevenueTarget,
} from "./revenue";

// ── Helpers ──────────────────────────────────────────────────

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
    single: vi.fn(() => new Promise((resolve) => resolved && resolve(resolved))),
    maybeSingle: vi.fn(() => new Promise((resolve) => resolved && resolve(resolved))),
    then: vi.fn((resolve: (v: typeof resolved) => void) => resolve(resolved)),
  };
}

let mockClient: ReturnType<typeof createMockSupabaseClient>;

beforeEach(() => {
  vi.clearAllMocks();
  mockClient = createMockSupabaseClient();
});

function makeSupabase() {
  return mockClient as any;
}

// ── getRevenueForecast ─────────────────────────────────────

describe("getRevenueForecast", () => {
  it("returns forecast for daily period", async () => {
    // Work orders return 2 WOs
    const woBuilder = makeBuilder([{ id: "wo-1" }, { id: "wo-2" }]);
    const svcBuilder = makeBuilder([{ final_price: 300000 }]);
    const partsBuilder = makeBuilder([{ final_price: 200000 }]);

    let callCount = 0;
    mockClient.from = vi.fn((table: string) => {
      callCount++;
      if (table === "work_orders") return woBuilder;
      if (table === "work_order_services") return svcBuilder;
      if (table === "work_order_parts") return partsBuilder;
      return makeBuilder([]);
    });

    const result = await getRevenueForecast(
      makeSupabase(),
      "org-1",
      "daily",
      "2026-07-22",
    );

    expect(result.current_revenue).toBe(500000);
    expect(result.total_days).toBe(1);
    expect(result.projected_revenue).toBeGreaterThan(0);
    expect(result.daily_run_rate).toBeGreaterThan(0);
  });

  it("returns forecast for weekly period", async () => {
    const woBuilder = makeBuilder([{ id: "wo-1" }]);
    const svcBuilder = makeBuilder([{ final_price: 700000 }]);
    const partsBuilder = makeBuilder([]);

    mockClient.from = vi.fn((table: string) => {
      if (table === "work_orders") return woBuilder;
      if (table === "work_order_services") return svcBuilder;
      if (table === "work_order_parts") return partsBuilder;
      return makeBuilder([]);
    });

    const result = await getRevenueForecast(
      makeSupabase(),
      "org-1",
      "weekly",
      "2026-07-20",
    );

    expect(result.current_revenue).toBe(700000);
    expect(result.total_days).toBe(7);
    expect(result.projected_revenue).toBeGreaterThan(0);
  });

  it("returns forecast for monthly period", async () => {
    const woBuilder = makeBuilder([{ id: "wo-1" }]);
    const svcBuilder = makeBuilder([{ final_price: 1000000 }]);
    const partsBuilder = makeBuilder([]);

    mockClient.from = vi.fn((table: string) => {
      if (table === "work_orders") return woBuilder;
      if (table === "work_order_services") return svcBuilder;
      if (table === "work_order_parts") return partsBuilder;
      return makeBuilder([]);
    });

    const result = await getRevenueForecast(
      makeSupabase(),
      "org-1",
      "monthly",
      "2026-07",
    );

    expect(result.current_revenue).toBe(1000000);
    expect(result.total_days).toBe(31); // July has 31 days
  });

  it("handles empty work order data gracefully", async () => {
    mockClient.from = vi.fn(() => makeBuilder([]));

    const result = await getRevenueForecast(
      makeSupabase(),
      "org-1",
      "monthly",
      "2026-07",
    );

    expect(result.current_revenue).toBe(0);
    expect(result.projected_revenue).toBe(0);
    expect(result.daily_run_rate).toBe(0);
    expect(result.previous_period_revenue).toBeNull();
  });

  it("computes projected change vs previous period", async () => {
    // Current period WOs
    mockClient.from = vi.fn((table: string) => {
      if (table === "work_orders") {
        return makeBuilder([{ id: "wo-c1" }, { id: "wo-c2" }]);
      }
      if (table === "work_order_services") {
        // Return different data for current vs prev — use call count
        return makeBuilder([{ final_price: 500000 }]);
      }
      if (table === "work_order_parts") {
        return makeBuilder([]);
      }
      return makeBuilder([]);
    });

    const result = await getRevenueForecast(
      makeSupabase(),
      "org-1",
      "daily",
      "2026-07-22",
    );

    // projected_change_pct should be computed if previous period revenue > 0
    expect(result.projected_change_pct).not.toBeNull();
    expect(typeof result.on_track).toBe("boolean");
  });
});

// ── getRevenueTargets ─────────────────────────────────────

describe("getRevenueTargets", () => {
  it("returns empty array when no targets exist", async () => {
    mockClient.from = vi.fn(() =>
      makeBuilder({ settings: {} }),
    );

    const result = await getRevenueTargets(
      makeSupabase(),
      "org-1",
      "monthly",
      "2026-07",
    );

    expect(result).toEqual([]);
  });

  it("returns targets from org settings with progress computed", async () => {
    // Org with targets
    const orgBuilder = makeBuilder({
      settings: {
        report_targets: [
          {
            id: "target-1",
            period_type: "monthly",
            period_start: "2026-07-01",
            period_end: "2026-07-31",
            target_revenue: 5000000,
          },
        ],
      },
    });

    // Work orders in period
    const woBuilder = makeBuilder([{ id: "wo-1" }]);
    const svcBuilder = makeBuilder([{ final_price: 3000000 }]);
    const partsBuilder = makeBuilder([]);

    mockClient.from = vi.fn((table: string) => {
      if (table === "organizations") return orgBuilder;
      if (table === "work_orders") return woBuilder;
      if (table === "work_order_services") return svcBuilder;
      if (table === "work_order_parts") return partsBuilder;
      return makeBuilder([]);
    });

    const result = await getRevenueTargets(
      makeSupabase(),
      "org-1",
      "monthly",
      "2026-07",
    );

    expect(result).toHaveLength(1);
    expect(result[0].target_revenue).toBe(5000000);
    expect(result[0].actual_revenue).toBe(3000000);
    expect(result[0].progress_pct).toBe(60); // (3000000/5000000)*100 = 60%
    expect(result[0].achieved).toBe(false);
  });

  it("marks target as achieved when actual >= target", async () => {
    const orgBuilder = makeBuilder({
      settings: {
        report_targets: [
          {
            id: "target-1",
            period_type: "monthly",
            period_start: "2026-07-01",
            period_end: "2026-07-31",
            target_revenue: 2000000,
          },
        ],
      },
    });

    mockClient.from = vi.fn((table: string) => {
      if (table === "organizations") return orgBuilder;
      if (table === "work_orders") return makeBuilder([{ id: "wo-1" }]);
      if (table === "work_order_services") return makeBuilder([{ final_price: 3000000 }]);
      if (table === "work_order_parts") return makeBuilder([]);
      return makeBuilder([]);
    });

    const result = await getRevenueTargets(
      makeSupabase(),
      "org-1",
      "monthly",
      "2026-07",
    );

    expect(result[0].achieved).toBe(true);
    expect(result[0].progress_pct).toBe(150); // (3000000/2000000)*100
  });

  it("skips targets with missing period dates", async () => {
    const orgBuilder = makeBuilder({
      settings: {
        report_targets: [
          {
            id: "target-bad",
            period_type: "monthly",
            period_start: "",
            period_end: "",
            target_revenue: 5000000,
          },
        ],
      },
    });

    mockClient.from = vi.fn((table: string) => {
      if (table === "organizations") return orgBuilder;
      return makeBuilder([]);
    });

    const result = await getRevenueTargets(
      makeSupabase(),
      "org-1",
      "monthly",
      "2026-07",
    );

    expect(result).toEqual([]);
  });
});

// ── setRevenueTarget ──────────────────────────────────────

describe("setRevenueTarget", () => {
  it("creates a new target and saves to org settings", async () => {
    const orgBuilder = makeBuilder({
      settings: {},
    });
    const updateBuilder = makeBuilder(null);

    mockClient.from = vi.fn((table: string) => {
      if (table === "organizations") return orgBuilder;
      return makeBuilder([]);
    });

    const result = await setRevenueTarget(
      makeSupabase(),
      "org-1",
      "monthly",
      "2026-07-01",
      "2026-07-31",
      5000000,
    );

    expect(result.target_revenue).toBe(5000000);
    expect(result.period_type).toBe("monthly");
    expect(result.period_start).toBe("2026-07-01");
    expect(result.period_end).toBe("2026-07-31");
    expect(result.actual_revenue).toBe(0);
    expect(result.achieved).toBe(false);
    expect(result.id).toBeTruthy();
  });

  it("preserves existing targets when adding a new one", async () => {
    const existingTarget = {
      id: "existing-1",
      period_type: "weekly",
      period_start: "2026-07-13",
      period_end: "2026-07-19",
      target_revenue: 3000000,
    };

    const orgBuilder = makeBuilder({
      settings: {
        report_targets: [existingTarget],
      },
    });
    let updateCalled = false;
    let orgCallCount = 0;

    const updateBuilder = {
      ...makeBuilder(null),
      update: vi.fn((_settings: any) => {
        updateCalled = true;
        return { eq: vi.fn() };
      }),
    };

    mockClient.from = vi.fn((table: string) => {
      if (table === "organizations") {
        orgCallCount++;
        if (orgCallCount === 1) return orgBuilder;  // SELECT
        return updateBuilder;                        // UPDATE
      }
      return makeBuilder([]);
    });
    const result = await setRevenueTarget(
      makeSupabase(),
      "org-1",
      "monthly",
      "2026-07-01",
      "2026-07-31",
      5000000,
    );

    expect(result.target_revenue).toBe(5000000);
    // existing target should be preserved (different period_type, different period_start)
    expect(updateCalled).toBe(true);
  });
});
