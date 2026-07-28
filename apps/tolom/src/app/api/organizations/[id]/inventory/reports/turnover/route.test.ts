import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getInventoryTurnoverMock = vi.fn();

vi.mock("@/lib/api-response", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/inventory-reports-service", () => ({
  getInventoryTurnover: getInventoryTurnoverMock,
}));

const { GET } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/reports/turnover route", () => {
  const orgId = "org-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/inventory/reports/turnover`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns inventory turnover with defaults", async () => {
      const data = [{ part_id: "part-1", turnover_ratio: 3.5 }];
      getInventoryTurnoverMock.mockResolvedValue(data);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(getInventoryTurnoverMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        undefined,
        undefined,
      );
      expect(body.data).toEqual(data);
    });

    it("forwards months param", async () => {
      getInventoryTurnoverMock.mockResolvedValue([]);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${baseUrl}?months=6`);
      await (GET as any)({ supabase, orgId, request });

      expect(getInventoryTurnoverMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        6,
        undefined,
      );
    });

    it("forwards branch_id param", async () => {
      getInventoryTurnoverMock.mockResolvedValue([]);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${baseUrl}?branch_id=branch-1`);
      await (GET as any)({ supabase, orgId, request });

      expect(getInventoryTurnoverMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        undefined,
        "branch-1",
      );
    });

    it("handles service error", async () => {
      getInventoryTurnoverMock.mockRejectedValue(new Error("DB error"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      await expect((GET as any)({ supabase, orgId, request })).rejects.toThrow(
        "DB error",
      );
    });
  });
});
