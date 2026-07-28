import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const getPayrollRecordsMock = vi.fn();

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
  getPayrollRecords: getPayrollRecordsMock,
}));

const { GET } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/payroll/records route", () => {
  const orgId = "org-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/payroll/records`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns payroll records on success", async () => {
      const records = [{ id: "rec-1", employee: "emp-1", amount: 1500 }];
      getPayrollRecordsMock.mockResolvedValue(records);

      const request = new NextRequest(`${baseUrl}?year=2025&month=3`);
      const response = await (GET as any)({ request, orgId, supabase: {} });
      const body = await response.json();

      expect(getPayrollRecordsMock).toHaveBeenCalledWith(
        {},
        orgId,
        2025,
        3,
        null,
      );
      expect(body.data).toEqual(records);
      expect(response.status).toBe(200);
    });

    it("filters by branch_id when provided", async () => {
      getPayrollRecordsMock.mockResolvedValue([]);

      const request = new NextRequest(
        `${baseUrl}?year=2025&month=3&branch_id=br-1`,
      );
      await (GET as any)({ request, orgId, supabase: {} });

      expect(getPayrollRecordsMock).toHaveBeenCalledWith(
        {},
        orgId,
        2025,
        3,
        "br-1",
      );
    });

    it("returns 400 for month < 1", async () => {
      const request = new NextRequest(`${baseUrl}?year=2025&month=0`);
      const response = await (GET as any)({ request, orgId, supabase: {} });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("BAD_REQUEST");
      expect(getPayrollRecordsMock).not.toHaveBeenCalled();
    });

    it("returns 400 for month > 12", async () => {
      const request = new NextRequest(`${baseUrl}?year=2025&month=13`);
      const response = await (GET as any)({ request, orgId, supabase: {} });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("BAD_REQUEST");
      expect(getPayrollRecordsMock).not.toHaveBeenCalled();
    });

    it("returns 400 for missing month", async () => {
      const request = new NextRequest(`${baseUrl}?year=2025`);
      const response = await (GET as any)({ request, orgId, supabase: {} });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("BAD_REQUEST");
      expect(getPayrollRecordsMock).not.toHaveBeenCalled();
    });

    it("returns 400 for missing year", async () => {
      const request = new NextRequest(`${baseUrl}?month=3`);
      const response = await (GET as any)({ request, orgId, supabase: {} });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("BAD_REQUEST");
      expect(getPayrollRecordsMock).not.toHaveBeenCalled();
    });

    it("handles service error", async () => {
      getPayrollRecordsMock.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest(`${baseUrl}?year=2025&month=3`);
      await expect(
        (GET as any)({ request, orgId, supabase: {} }),
      ).rejects.toThrow("DB error");
    });
  });
});
