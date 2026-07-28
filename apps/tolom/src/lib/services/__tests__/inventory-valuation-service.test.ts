import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAuditAfter: vi.fn() }));
vi.mock("@/lib/cache/keys", () => ({
  cacheTags: {
    inventoryBalances: (orgId: string) => `inventory-balances:${orgId}`,
    inventoryMovements: (orgId: string) => `inventory-movements:${orgId}`,
  },
}));
vi.mock("@/lib/capture", () => ({ capture: vi.fn() }));
vi.mock("@/lib/errors", () => ({
  NotFoundError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "NotFoundError";
    }
  },
  ValidationError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "ValidationError";
    }
  },
}));
vi.mock("@/lib/supabase/with-branch", () => ({
  withBranchFilter: vi.fn((q: unknown) => q),
}));
vi.mock("@/lib/supabase/query", () => ({
  withDbCapture: vi.fn((_l: string, p: Promise<unknown>) => p),
}));

import { withBranchFilter } from "@/lib/supabase/with-branch";
import {
  getInventoryBalances,
  getInventoryFast,
  getWeightedAverageCosts,
} from "../inventory-service";

const ORG_ID = "org-1";
const PART_ID = "part-1";

let db: MockSupabaseClient;

beforeEach(() => {
  vi.resetAllMocks();
  db = createMockSupabaseClient();
});

// ── Get Inventory Balances ──────────────────────────────────────

describe("getInventoryBalances", () => {
  const balanceRow = {
    part_id: PART_ID,
    part_name: "Oil Filter",
    part_number: "OF-123",
    category: "Filters",
    unit: "piece",
    default_price: 15000,
    quantity_on_hand: 50,
    last_movement_at: "2025-01-15T10:00:00.000Z",
    organization_id: ORG_ID,
    branch_id: null,
  };

  it("returns balances for org", async () => {
    db.__qb.resolveWith({ data: [balanceRow], error: null });

    const result = await getInventoryBalances(db as never, ORG_ID);

    expect(result).toHaveLength(1);
    expect(result[0].part_id).toBe(PART_ID);
    expect(result[0].quantity_on_hand).toBe(50);
    expect(db.from).toHaveBeenCalledWith("inventory_balances");
  });

  it("returns empty array when no data", async () => {
    db.__qb.resolveWith({ data: null, error: null });
    expect(await getInventoryBalances(db as never, ORG_ID)).toEqual([]);
  });

  it("throws on db error", async () => {
    db.__qb.resolveWith({ data: null, error: new Error("DB error") });
    await expect(getInventoryBalances(db as never, ORG_ID)).rejects.toThrow(
      "DB error",
    );
  });

  it("passes branch filter when provided", async () => {
    db.__qb.resolveWith({ data: [balanceRow], error: null });

    await getInventoryBalances(db as never, ORG_ID, "branch-1");

    expect(withBranchFilter).toHaveBeenCalled();
  });

  it("returns multiple balances across categories", async () => {
    const rows = [
      balanceRow,
      {
        ...balanceRow,
        part_id: "part-2",
        part_name: "Brake Pad",
        category: "Brakes",
        quantity_on_hand: 20,
        default_price: 45000,
      },
      {
        ...balanceRow,
        part_id: "part-3",
        part_name: "Engine Oil",
        category: "Fluids",
        quantity_on_hand: 100,
        default_price: 35000,
      },
    ];
    db.__qb.resolveWith({ data: rows, error: null });

    const result = await getInventoryBalances(db as never, ORG_ID);

    expect(result).toHaveLength(3);
    expect(result.map((r) => r.part_id)).toEqual([
      "part-1",
      "part-2",
      "part-3",
    ]);
  });

  it("selects the correct columns", async () => {
    db.__qb.resolveWith({ data: [], error: null });
    await getInventoryBalances(db as never, ORG_ID);

    const selectArg = db.from("inventory_balances").select?.mock.calls[0]?.[0];
    expect(selectArg).toContain("part_id");
    expect(selectArg).toContain("part_name");
    expect(selectArg).toContain("quantity_on_hand");
    expect(selectArg).toContain("default_price");
  });
});

// ── Get Inventory Fast (RPC) ────────────────────────────────────

describe("getInventoryFast", () => {
  const rpcRow = {
    part_id: PART_ID,
    part_name: "Oil Filter",
    part_number: "OF-101",
    category: "Filters",
    unit: "piece",
    default_price: 15000,
    quantity_on_hand: 25,
    last_movement_at: "2025-01-15T10:00:00.000Z",
    min_threshold: 5,
    max_threshold: 50,
    stock_status: "in_stock",
  };

  it("returns mapped RPC rows", async () => {
    db.rpc.mockResolvedValue({ data: [rpcRow], error: null });

    const result = await getInventoryFast(db as never, ORG_ID);

    expect(result).toHaveLength(1);
    expect(result[0].part_id).toBe(PART_ID);
    expect(result[0].stock_status).toBe("in_stock");
    expect(result[0].min_threshold).toBe(5);
    expect(result[0].max_threshold).toBe(50);
  });

  it("returns empty array on null data", async () => {
    db.rpc.mockResolvedValue({ data: null, error: null });

    const result = await getInventoryFast(db as never, ORG_ID);

    expect(result).toEqual([]);
  });

  it("passes search and lowStockOnly params", async () => {
    db.rpc.mockResolvedValue({ data: [], error: null });

    await getInventoryFast(db as never, ORG_ID, {
      search: "Filter",
      lowStockOnly: true,
      limit: 25,
    });

    expect(db.rpc).toHaveBeenCalledWith("get_inventory_with_stock", {
      p_org_id: ORG_ID,
      p_search: "Filter",
      p_low_stock_only: true,
      p_limit: 25,
      p_offset: 0,
    });
  });

  it("defaults params when no options given", async () => {
    db.rpc.mockResolvedValue({ data: [], error: null });

    await getInventoryFast(db as never, ORG_ID);

    expect(db.rpc).toHaveBeenCalledWith("get_inventory_with_stock", {
      p_org_id: ORG_ID,
      p_search: null,
      p_low_stock_only: false,
      p_limit: 50,
      p_offset: 0,
    });
  });

  it("defaults search to null and lowStockOnly to false when options partially provided", async () => {
    db.rpc.mockResolvedValue({ data: [], error: null });

    await getInventoryFast(db as never, ORG_ID, { limit: 10 });

    expect(db.rpc).toHaveBeenCalledWith("get_inventory_with_stock", {
      p_org_id: ORG_ID,
      p_search: null,
      p_low_stock_only: false,
      p_limit: 10,
      p_offset: 0,
    });
  });

  it("maps stock_status correctly for low stock items", async () => {
    const lowStockRow = {
      ...rpcRow,
      stock_status: "low_stock",
      quantity_on_hand: 3,
    };
    db.rpc.mockResolvedValue({ data: [lowStockRow], error: null });

    const result = await getInventoryFast(db as never, ORG_ID, {
      lowStockOnly: true,
    });

    expect(result).toHaveLength(1);
    expect(result[0].stock_status).toBe("low_stock");
    expect(result[0].quantity_on_hand).toBe(3);
  });

  it("maps stock_status correctly for out of stock items", async () => {
    const oosRow = {
      ...rpcRow,
      stock_status: "out_of_stock",
      quantity_on_hand: 0,
    };
    db.rpc.mockResolvedValue({ data: [oosRow], error: null });

    const result = await getInventoryFast(db as never, ORG_ID);

    expect(result[0].stock_status).toBe("out_of_stock");
    expect(result[0].quantity_on_hand).toBe(0);
  });

  it("throws on RPC error", async () => {
    db.rpc.mockResolvedValue({ data: null, error: new Error("RPC failed") });

    await expect(getInventoryFast(db as never, ORG_ID)).rejects.toThrow(
      "RPC failed",
    );
  });
});

// ── Get Weighted Average Costs ──────────────────────────────────

describe("getWeightedAverageCosts", () => {
  it("computes weighted average from purchase movements", async () => {
    db.__qb.resolveWith({
      data: [
        { part_id: "p1", quantity: 10, unit_cost: 100 },
        { part_id: "p1", quantity: 5, unit_cost: 200 },
        { part_id: "p2", quantity: 3, unit_cost: 500 },
      ],
      error: null,
    });

    const result = await getWeightedAverageCosts(db as never, ORG_ID);

    // p1: (10*100 + 5*200) / (10+5) = (1000+1000)/15 = 133.33
    expect(result.p1).toBeCloseTo(133.33, 1);
    // p2: single movement => 500
    expect(result.p2).toBeCloseTo(500, 0);
  });

  it("returns empty object for no data", async () => {
    db.__qb.resolveWith({ data: [], error: null });

    expect(await getWeightedAverageCosts(db as never, ORG_ID)).toEqual({});
  });

  it("handles single purchase entry per part", async () => {
    db.__qb.resolveWith({
      data: [{ part_id: "p1", quantity: 10, unit_cost: 250 }],
      error: null,
    });

    const result = await getWeightedAverageCosts(db as never, ORG_ID);

    expect(result.p1).toBeCloseTo(250, 0);
  });

  it("handles zero-quantity movements gracefully", async () => {
    db.__qb.resolveWith({
      data: [
        { part_id: "p1", quantity: 0, unit_cost: 100 },
        { part_id: "p1", quantity: 10, unit_cost: 200 },
      ],
      error: null,
    });

    const result = await getWeightedAverageCosts(db as never, ORG_ID);

    // (0*100 + 10*200) / (0+10) = 2000/10 = 200
    expect(result.p1).toBeCloseTo(200, 0);
  });

  it("queries purchase movements for org", async () => {
    db.__qb.resolveWith({ data: [], error: null });

    await getWeightedAverageCosts(db as never, ORG_ID);

    const chain = db.from("inventory_movements");
    expect(chain.eq).toHaveBeenCalledWith("organization_id", ORG_ID);
    expect(chain.eq).toHaveBeenCalledWith("movement_type", "purchase");
  });

  it("accepts branch filter", async () => {
    db.__qb.resolveWith({ data: [], error: null });

    await getWeightedAverageCosts(db as never, ORG_ID, "branch-1");

    expect(withBranchFilter).toHaveBeenCalled();
  });
});
