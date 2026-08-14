import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getInventoryBalancesMock = vi.fn();
const getInventoryFastMock = vi.fn();
const getWeightedAverageCostsMock = vi.fn();

vi.mock("@/lib/api-response", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
  ok: vi.fn((data) => new Response(JSON.stringify({ data }), { status: 200 })),
}));

vi.mock("@/lib/services/inventory-service", () => ({
  getInventoryBalances: getInventoryBalancesMock,
  getInventoryFast: getInventoryFastMock,
  getWeightedAverageCosts: getWeightedAverageCostsMock,
}));

const { GET } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/balances route", () => {
  const orgId = "org-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    const url = `http://localhost/api/organizations/${orgId}/inventory/balances`;

    it("returns inventory fast when fast=true", async () => {
      getInventoryFastMock.mockResolvedValue([
        { part_id: "part-1", quantity: 10, part_name: "Oil Filter" },
      ]);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${url}?fast=true`);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(getInventoryFastMock).toHaveBeenCalledWith(supabase, orgId, {
        search: undefined,
        lowStockOnly: false,
        limit: 50,
      });
      expect(body.data).toEqual([
        {
          part_id: "part-1",
          quantity: 10,
          part_name: "Oil Filter",
          avg_unit_cost: 0,
        },
      ]);
    });

    it("passes search, low_stock and pageSize params to getInventoryFast", async () => {
      getInventoryFastMock.mockResolvedValue([]);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(
        `${url}?fast=true&q=filter&low_stock=true&pageSize=20`,
      );
      await (GET as any)({ supabase, orgId, request });

      expect(getInventoryFastMock).toHaveBeenCalledWith(supabase, orgId, {
        search: "filter",
        lowStockOnly: true,
        limit: 20,
      });
    });

    it("uses default avg_unit_cost from default_price when costs are undefined", async () => {
      getInventoryFastMock.mockResolvedValue([
        {
          part_id: "part-1",
          quantity: 5,
          default_price: 15000,
          avg_unit_cost: null,
        },
      ]);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${url}?fast=true`);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(body.data[0].avg_unit_cost).toBe(15000);
    });

    it("returns merged balances and costs when fast is false", async () => {
      getInventoryBalancesMock.mockResolvedValue([
        { part_id: "part-1", quantity: 10, default_price: 10000 },
        { part_id: "part-2", quantity: 5, default_price: 20000 },
      ]);
      getWeightedAverageCostsMock.mockResolvedValue({
        "part-1": 12000,
      });

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(getInventoryBalancesMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        undefined,
      );
      expect(getWeightedAverageCostsMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        undefined,
      );
      expect(body.data).toEqual([
        {
          part_id: "part-1",
          quantity: 10,
          default_price: 10000,
          avg_unit_cost: 12000,
        },
        {
          part_id: "part-2",
          quantity: 5,
          default_price: 20000,
          avg_unit_cost: 20000,
        },
      ]);
    });

    it("passes branch_id to getInventoryBalances and getWeightedAverageCosts", async () => {
      getInventoryBalancesMock.mockResolvedValue([]);
      getWeightedAverageCostsMock.mockResolvedValue({});

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${url}?branch_id=br-1`);
      await (GET as any)({ supabase, orgId, request });

      expect(getInventoryBalancesMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        "br-1",
      );
      expect(getWeightedAverageCostsMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        "br-1",
      );
    });

    it("handles service error", async () => {
      getInventoryBalancesMock.mockRejectedValue(new Error("DB error"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url);
      await expect((GET as any)({ supabase, orgId, request })).rejects.toThrow(
        "DB error",
      );
    });
  });
});
