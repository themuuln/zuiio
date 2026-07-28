import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getSlowMovingStockMock = vi.fn();

vi.mock("@/lib/api-response", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/inventory-reports-service", () => ({
  getSlowMovingStock: getSlowMovingStockMock,
}));

const { GET } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/reports/slow-moving route", () => {
  const orgId = "org-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/inventory/reports/slow-moving`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns slow moving stock with default threshold", async () => {
      const data = [
        { part_id: "part-1", name: "Oil Filter", months_since_movement: 6 },
      ];
      getSlowMovingStockMock.mockResolvedValue(data);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(getSlowMovingStockMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        undefined,
        undefined,
      );
      expect(body.data).toEqual(data);
    });

    it("forwards thresholdDays param", async () => {
      getSlowMovingStockMock.mockResolvedValue([]);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${baseUrl}?thresholdDays=60`);
      await (GET as any)({ supabase, orgId, request });

      expect(getSlowMovingStockMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        60,
        undefined,
      );
    });

    it("forwards branch_id param", async () => {
      getSlowMovingStockMock.mockResolvedValue([]);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${baseUrl}?branch_id=branch-1`);
      await (GET as any)({ supabase, orgId, request });

      expect(getSlowMovingStockMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        undefined,
        "branch-1",
      );
    });

    it("handles service error", async () => {
      getSlowMovingStockMock.mockRejectedValue(new Error("DB error"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      await expect((GET as any)({ supabase, orgId, request })).rejects.toThrow(
        "DB error",
      );
    });
  });
});
