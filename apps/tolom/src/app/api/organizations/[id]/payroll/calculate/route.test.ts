import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const calculateMonthlyPayrollMock = vi.fn();

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
  calculateMonthlyPayroll: calculateMonthlyPayrollMock,
}));

const { POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/payroll/calculate route", () => {
  const orgId = "org-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/payroll/calculate`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("returns payroll records on success", async () => {
      const records = [{ id: "rec-1", employee_id: "emp-1" }];
      calculateMonthlyPayrollMock.mockResolvedValue(records);

      const supabase = {} as any;
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ year: 2026, month: 6, branch_id: "branch-1" }),
        headers: { "content-type": "application/json" },
      });

      const response = await (POST as any)({ orgId, supabase, request });
      const data = await response.json();

      expect(calculateMonthlyPayrollMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        2026,
        6,
        "branch-1",
      );
      expect(data.data).toEqual(records);
      expect(response.status).toBe(200);
    });

    it("returns 400 when year is missing", async () => {
      const supabase = {} as any;
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ month: 6 }),
        headers: { "content-type": "application/json" },
      });

      const response = await (POST as any)({ orgId, supabase, request });
      const data = await response.json();

      expect(data.error.code).toBe("BAD_REQUEST");
      expect(data.error.message).toBe(
        "Valid year and month (1-12) are required",
      );
      expect(response.status).toBe(400);
    });

    it("returns 400 when month is out of range", async () => {
      const supabase = {} as any;
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ year: 2026, month: 13 }),
        headers: { "content-type": "application/json" },
      });

      const response = await (POST as any)({ orgId, supabase, request });
      const data = await response.json();

      expect(data.error.code).toBe("BAD_REQUEST");
      expect(data.error.message).toBe(
        "Valid year and month (1-12) are required",
      );
      expect(response.status).toBe(400);
    });

    it("handles service error", async () => {
      calculateMonthlyPayrollMock.mockRejectedValue(
        new Error("Payroll calculation failed"),
      );

      const supabase = {} as any;
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ year: 2026, month: 6 }),
        headers: { "content-type": "application/json" },
      });

      await expect((POST as any)({ orgId, supabase, request })).rejects.toThrow(
        "Payroll calculation failed",
      );
    });
  });
});
