import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getTaxReportMock = vi.fn();

vi.mock("@/lib/api-response", () => ({
  apiError: vi.fn(
    (type: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code: type, message } }), {
        status,
      }),
  ),
  createRouteHandler: vi.fn((handler: unknown) => handler),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/tax-report-service", () => ({
  getTaxReport: getTaxReportMock,
}));

const { GET } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/reports/tax route", () => {
  const orgId = "org-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/reports/tax`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns tax report with startDate and endDate", async () => {
      const report = { totalTax: 5000, items: [] };
      getTaxReportMock.mockResolvedValue(report);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(
        `${baseUrl}?startDate=2024-01-01&endDate=2024-12-31`,
      );
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(getTaxReportMock).toHaveBeenCalledWith(supabase, orgId, {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      });
      expect(body.data).toEqual(report);
    });

    it("returns 400 when startDate is missing", async () => {
      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${baseUrl}?endDate=2024-12-31`);
      const response = await (GET as any)({ supabase, orgId, request });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when endDate is missing", async () => {
      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${baseUrl}?startDate=2024-01-01`);
      const response = await (GET as any)({ supabase, orgId, request });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("handles service error", async () => {
      getTaxReportMock.mockRejectedValue(new Error("Report failed"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(
        `${baseUrl}?startDate=2024-01-01&endDate=2024-12-31`,
      );
      await expect((GET as any)({ supabase, orgId, request })).rejects.toThrow(
        "Report failed",
      );
    });
  });
});
