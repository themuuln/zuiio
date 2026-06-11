import { describe, expect, it, vi } from "vitest";

// Mock withCache to bypass Next.js unstable_cache requirement
vi.mock("@/lib/cache/with-cache", () => ({
  withCache: vi.fn((_keyParts: string[], fn: () => Promise<any>) => fn()),
}));

import { getBranchComparison } from "./branch-comparison";

// ── Simplified mock: stores responses by table name ──────────

function createMockDb(responses: Record<string, any[]>) {
  const tableCalls = new Map<string, number>();

  const createChain = (table: string) => {
    const chain: Record<string, any> = {};

    for (const m of [
      "select",
      "insert",
      "update",
      "delete",
      "eq",
      "neq",
      "gt",
      "gte",
      "lt",
      "lte",
      "is",
      "in",
      "contains",
      "or",
      "and",
      "not",
      "order",
      "limit",
      "range",
    ]) {
      chain[m] = vi.fn().mockReturnValue(chain);
    }

    // Terminal: return response
    chain.then = vi.fn((resolve: any) => {
      const data = responses[table] ?? [];
      return resolve({ data, error: null });
    });

    return chain;
  };

  return {
    db: {
      from: vi.fn((table: string) => createChain(table)),
    } as any,
    tableCalls,
  };
}

// ── Tests ────────────────────────────────────────────────────

describe("getBranchComparison", () => {
  it("returns empty data when no branches exist", async () => {
    const { db } = createMockDb({ branches: [] });

    const result = await getBranchComparison(
      db,
      "org-1",
      "2026-06-01",
      "2026-06-10",
    );

    expect(result.branches).toEqual([]);
    expect(result.totals.totalRevenue).toBe(0);
    expect(result.periodLabel).toBe("2026-06-01 – 2026-06-10");
  });

  it("returns per-branch summaries with correct structure", async () => {
    const { db } = createMockDb({
      branches: [
        { id: "b1", name: "Branch A", is_main: true },
        { id: "b2", name: "Branch B", is_main: false },
      ],
      work_orders: [
        { id: "wo1", branch_id: "b1" },
        { id: "wo2", branch_id: "b1" },
        { id: "wo3", branch_id: "b2" },
      ],
      work_order_services: [],
      work_order_parts: [],
    });

    const result = await getBranchComparison(
      db,
      "org-1",
      "2026-06-01",
      "2026-06-10",
    );

    expect(result.branches).toHaveLength(2);

    const branchA = result.branches.find((b) => b.branchId === "b1");
    expect(branchA).toBeDefined();
    expect(branchA!.branchName).toBe("Branch A");
    expect(branchA!.isMain).toBe(true);
    expect(branchA!.completedWorkOrders).toBe(2);

    const branchB = result.branches.find((b) => b.branchId === "b2");
    expect(branchB).toBeDefined();
    expect(branchB!.branchName).toBe("Branch B");
    expect(branchB!.isMain).toBe(false);
    expect(branchB!.completedWorkOrders).toBe(1);
  });

  it("calculates revenue from services and parts", async () => {
    const { db } = createMockDb({
      branches: [{ id: "b1", name: "A", is_main: true }],
      work_orders: [{ id: "wo1", branch_id: "b1" }],
      work_order_services: [
        {
          final_price: 100,
          unit_cost: 30,
          quantity: 1,
          work_order_id: "wo1",
        },
      ],
      work_order_parts: [
        {
          final_price: 50,
          unit_cost: 20,
          quantity: 1,
          work_order_id: "wo1",
        },
      ],
    });

    const result = await getBranchComparison(
      db,
      "org-1",
      "2026-06-01",
      "2026-06-10",
    );

    const branch = result.branches[0];
    expect(branch.serviceRevenue).toBe(100);
    expect(branch.partsRevenue).toBe(50);
    expect(branch.totalRevenue).toBe(150);
    // grossProfit = totalRevenue - (serviceCost + partsCost) = 150 - (30 + 20) = 100
    expect(branch.grossProfit).toBe(100);
    expect(branch.avgRepairOrderValue).toBe(150);
  });

  it("computes totals across all branches", async () => {
    const { db } = createMockDb({
      branches: [
        { id: "b1", name: "A", is_main: true },
        { id: "b2", name: "B", is_main: false },
      ],
      work_orders: [
        { id: "wo1", branch_id: "b1" },
        { id: "wo2", branch_id: "b2" },
      ],
      work_order_services: [
        {
          final_price: 100,
          unit_cost: 30,
          quantity: 1,
          work_order_id: "wo1",
        },
      ],
      work_order_parts: [
        {
          final_price: 200,
          unit_cost: 50,
          quantity: 1,
          work_order_id: "wo2",
        },
      ],
    });

    const result = await getBranchComparison(
      db,
      "org-1",
      "2026-06-01",
      "2026-06-10",
    );

    expect(result.totals.completedWorkOrders).toBe(2);
    expect(result.totals.totalRevenue).toBe(300);
    expect(result.totals.serviceRevenue).toBe(100);
    expect(result.totals.partsRevenue).toBe(200);
    // totalCost = 30 + 50 = 80, grossProfit = 300 - 80 = 220
    expect(result.totals.grossProfit).toBe(220);
    expect(result.totals.marginPercent).toBeCloseTo(73.3, 0);
  });
});
