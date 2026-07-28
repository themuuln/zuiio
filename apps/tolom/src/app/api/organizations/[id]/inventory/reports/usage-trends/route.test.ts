import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getUsageTrendsMock = vi.fn();

vi.mock("@/lib/api-response", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/inventory-reports-service", () => ({
  getUsageTrends: getUsageTrendsMock,
}));

const { GET } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/reports/usage-trends route", () => {
  const orgId = "org-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/inventory/reports/usage-trends`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns usage trends with defaults", async () => {
      const data = [{ month: "2024-01", quantity_used: 100 }];
      getUsageTrendsMock.mockResolvedValue(data);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(getUsageTrendsMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        undefined,
        undefined,
      );
      expect(body.data).toEqual(data);
    });

    it("forwards months param", async () => {
      getUsageTrendsMock.mockResolvedValue([]);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${baseUrl}?months=3`);
      await (GET as any)({ supabase, orgId, request });

      expect(getUsageTrendsMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        3,
        undefined,
      );
    });

    it("forwards branch_id param", async () => {
      getUsageTrendsMock.mockResolvedValue([]);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${baseUrl}?branch_id=branch-1`);
      await (GET as any)({ supabase, orgId, request });

      expect(getUsageTrendsMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        undefined,
        "branch-1",
      );
    });

    it("handles service error", async () => {
      getUsageTrendsMock.mockRejectedValue(new Error("DB error"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      await expect((GET as any)({ supabase, orgId, request })).rejects.toThrow(
        "DB error",
      );
    });
  });
});
