import { beforeEach, describe, expect, it, vi } from "vitest";
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
  getInventoryTurnover,
  getSlowMovingStock,
  getUsageTrends,
} from "../inventory-reports-service";

const ORG_ID = "org-1";

let db: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
  mockWithBranchFilter.mockImplementation((query) => query);
});

// ── getInventoryTurnover ──────────────────────────────────────────

describe("getInventoryTurnover", () => {
  it("calculates turnover from purchases and balances", async () => {
    // Purchases result
    db.__qb.resolveOnce({
      data: [
        { quantity: 10, unit_cost: 5 },
        { quantity: 5, unit_cost: 10 },
      ],
      error: null,
    });
    // Balances result
    db.__qb.resolveOnce({
      data: [
        { quantity_on_hand: 20, default_price: 15 },
        { quantity_on_hand: 10, default_price: 25 },
      ],
      error: null,
    });

    const result = await getInventoryTurnover(db as never, ORG_ID, 12);

    // COGS = 10*5 + 5*10 = 100
    expect(result.cogs).toBe(100);
    // Avg inventory = 20*15 + 10*25 = 550
    expect(result.averageInventoryValue).toBe(550);
    // Turnover = 100 / 550
    expect(result.turnoverRate).toBeCloseTo(100 / 550, 6);
  });

  it("returns zero turnover when there are no purchases", async () => {
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({
      data: [{ quantity_on_hand: 10, default_price: 20 }],
      error: null,
    });

    const result = await getInventoryTurnover(db as never, ORG_ID, 12);

    expect(result.cogs).toBe(0);
    expect(result.averageInventoryValue).toBe(200);
    expect(result.turnoverRate).toBe(0);
  });

  it("returns zero for everything when no data exists", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await getInventoryTurnover(db as never, ORG_ID, 12);

    expect(result.cogs).toBe(0);
    expect(result.averageInventoryValue).toBe(0);
    expect(result.turnoverRate).toBe(0);
  });

  it("handles branchId filter", async () => {
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });

    await getInventoryTurnover(db as never, ORG_ID, 12, "branch-1");

    expect(mockWithBranchFilter).toHaveBeenCalledTimes(2);
  });

  it("defaults to 12 months", async () => {
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await getInventoryTurnover(db as never, ORG_ID);

    expect(result.cogs).toBe(0);
    expect(result.turnoverRate).toBe(0);
  });
});

// ── getUsageTrends ────────────────────────────────────────────────

describe("getUsageTrends", () => {
  it("returns usage trends grouped by month and part", async () => {
    const salesData = [
      {
        created_at: "2025-01-15T10:00:00Z",
        part_id: "part-1",
        quantity: 3,
        unit_price: 20,
        part: { name: "Oil Filter", category: "Filters" },
      },
      {
        created_at: "2025-01-20T10:00:00Z",
        part_id: "part-1",
        quantity: 2,
        unit_price: 20,
        part: { name: "Oil Filter", category: "Filters" },
      },
      {
        created_at: "2025-02-05T10:00:00Z",
        part_id: "part-2",
        quantity: 1,
        unit_price: 100,
        part: { name: "Brake Pad Set", category: "Brakes" },
      },
    ];

    db.__qb.resolveOnce({ data: salesData, error: null });

    const result = await getUsageTrends(db as never, ORG_ID, 6);

    expect(result).toHaveLength(2);
    // Part-1 in Jan: quantity=5, amount=5*20=100
    expect(result[0].month).toBe("2025-01");
    expect(result[0].part_id).toBe("part-1");
    expect(result[0].quantity).toBe(5);
    expect(result[0].totalAmount).toBe(100);
    expect(result[0].partName).toBe("Oil Filter");
    expect(result[0].category).toBe("Filters");

    // Part-2 in Feb
    expect(result[1].month).toBe("2025-02");
    expect(result[1].part_id).toBe("part-2");
    expect(result[1].quantity).toBe(1);
    expect(result[1].totalAmount).toBe(100);
  });

  it("returns empty array when no sales data", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await getUsageTrends(db as never, ORG_ID, 6);

    expect(result).toEqual([]);
  });

  it("throws on database error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("Query failed") });

    await expect(getUsageTrends(db as never, ORG_ID, 6)).rejects.toThrow(
      "Query failed",
    );
  });

  it("applies branch filter when branchId is provided", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    await getUsageTrends(db as never, ORG_ID, 6, "branch-1");

    expect(mockWithBranchFilter).toHaveBeenCalled();
  });

  it("handles null part data gracefully", async () => {
    const salesData = [
      {
        created_at: "2025-01-15T10:00:00Z",
        part_id: "part-1",
        quantity: 1,
        unit_price: 10,
        part: null,
      },
    ];

    db.__qb.resolveOnce({ data: salesData, error: null });

    const result = await getUsageTrends(db as never, ORG_ID, 6);

    expect(result).toHaveLength(1);
    expect(result[0].partName).toBe("Unknown");
    expect(result[0].category).toBeNull();
  });
});

// ── getSlowMovingStock ────────────────────────────────────────────

describe("getSlowMovingStock", () => {
  const now = new Date();
  const daysAgo = (days: number) =>
    new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  it("returns slow-moving items sorted by days since last move", async () => {
    const balances = [
      {
        part_id: "part-1",
        part_name: "Old Oil Filter",
        part_number: "OF-001",
        quantity_on_hand: 15,
        category: "Filters",
        last_movement_at: daysAgo(200),
      },
      {
        part_id: "part-2",
        part_name: "Dusty Brake Pad",
        part_number: "BP-002",
        quantity_on_hand: 10,
        category: "Brakes",
        last_movement_at: daysAgo(100),
      },
    ];

    db.__qb.resolveOnce({ data: balances, error: null });

    const result = await getSlowMovingStock(db as never, ORG_ID, 90);

    expect(result).toHaveLength(2);
    // Oldest first (descending daysSinceLastMove)
    expect(result[0].partId).toBe("part-1");
    expect(result[0].daysSinceLastMove).toBeGreaterThanOrEqual(199);
    expect(result[0].quantity).toBe(15);
    expect(result[0].category).toBe("Filters");
    expect(result[1].partId).toBe("part-2");
  });

  it("returns empty array when no stock has positive quantity", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await getSlowMovingStock(db as never, ORG_ID, 90);

    expect(result).toEqual([]);
  });

  it("includes items with no last_movement_at as slow", async () => {
    const balances = [
      {
        part_id: "part-1",
        part_name: "Never Moved",
        part_number: "NM-001",
        quantity_on_hand: 5,
        category: "Misc",
        last_movement_at: null,
      },
    ];

    db.__qb.resolveOnce({ data: balances, error: null });

    const result = await getSlowMovingStock(db as never, ORG_ID, 90);

    expect(result).toHaveLength(1);
    expect(result[0].daysSinceLastMove).toBeGreaterThan(90);
  });

  it("filters out items with recent movement", async () => {
    const balances = [
      {
        part_id: "part-new",
        part_name: "Recent Item",
        part_number: "RI-001",
        quantity_on_hand: 3,
        category: "Misc",
        last_movement_at: daysAgo(5),
      },
      {
        part_id: "part-old",
        part_name: "Old Item",
        part_number: "OI-001",
        quantity_on_hand: 8,
        category: "Misc",
        last_movement_at: daysAgo(200),
      },
    ];

    db.__qb.resolveOnce({ data: balances, error: null });

    const result = await getSlowMovingStock(db as never, ORG_ID, 30);

    expect(result).toHaveLength(1);
    expect(result[0].partId).toBe("part-old");
  });

  it("returns empty array when balances is null", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await getSlowMovingStock(db as never, ORG_ID, 90);

    expect(result).toEqual([]);
  });

  it("uses branch filter when branchId is provided", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    await getSlowMovingStock(db as never, ORG_ID, 90, "branch-1");

    expect(mockWithBranchFilter).toHaveBeenCalled();
  });
});
