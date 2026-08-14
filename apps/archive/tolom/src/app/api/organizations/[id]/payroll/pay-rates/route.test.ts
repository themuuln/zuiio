import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const listPayRatesMock = vi.fn();
const upsertPayRateMock = vi.fn();

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

vi.mock("@/lib/services/payroll-service", () => ({
  listPayRates: listPayRatesMock,
  upsertPayRate: upsertPayRateMock,
}));

const { GET, PUT } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/payroll/pay-rates route", () => {
  const orgId = "org-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/payroll/pay-rates`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns pay rates on success", async () => {
      const rates = [{ mechanicId: "mech-1", hourlyRate: 25 }];
      listPayRatesMock.mockResolvedValue(rates);

      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ request, orgId, supabase: {} });
      const body = await response.json();

      expect(listPayRatesMock).toHaveBeenCalledWith({}, orgId, null);
      expect(body.data).toEqual(rates);
      expect(response.status).toBe(200);
    });

    it("filters by branch_id when provided", async () => {
      listPayRatesMock.mockResolvedValue([]);

      const request = new NextRequest(`${baseUrl}?branch_id=br-1`);
      await (GET as any)({ request, orgId, supabase: {} });

      expect(listPayRatesMock).toHaveBeenCalledWith({}, orgId, "br-1");
    });

    it("handles service error", async () => {
      listPayRatesMock.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest(baseUrl);
      await expect(
        (GET as any)({ request, orgId, supabase: {} }),
      ).rejects.toThrow("DB error");
    });
  });

  describe("PUT", () => {
    it("upserts pay rate on success", async () => {
      const rate = {
        mechanicId: "mech-1",
        hourlyRate: 30,
        effectiveFrom: "2026-01-01",
      };
      upsertPayRateMock.mockResolvedValue(rate);

      const request = new NextRequest(baseUrl, {
        method: "PUT",
        body: JSON.stringify({
          mechanicId: "mech-1",
          hourlyRate: 30,
          effectiveFrom: "2026-01-01",
        }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PUT as any)({ request, orgId, supabase: {} });
      const body = await response.json();

      expect(upsertPayRateMock).toHaveBeenCalledWith(
        {},
        orgId,
        "mech-1",
        30,
        "2026-01-01",
      );
      expect(body.data).toEqual(rate);
      expect(response.status).toBe(200);
    });

    it("returns 400 when required fields are missing", async () => {
      const request = new NextRequest(baseUrl, {
        method: "PUT",
        body: JSON.stringify({ mechanicId: "mech-1" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PUT as any)({ request, orgId, supabase: {} });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("BAD_REQUEST");
    });

    it("handles service error", async () => {
      upsertPayRateMock.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest(baseUrl, {
        method: "PUT",
        body: JSON.stringify({
          mechanicId: "mech-1",
          hourlyRate: 30,
          effectiveFrom: "2026-01-01",
        }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (PUT as any)({ request, orgId, supabase: {} }),
      ).rejects.toThrow("DB error");
    });
  });
});
