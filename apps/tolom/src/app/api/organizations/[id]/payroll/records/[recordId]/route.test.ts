import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const updatePayrollRecordStatusMock = vi.fn();

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
  updatePayrollRecordStatus: updatePayrollRecordStatusMock,
}));

const { PATCH } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/payroll/records/[recordId] route", () => {
  const orgId = "org-1";
  const recordId = "rec-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/payroll/records/${recordId}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PATCH", () => {
    it("approve action success", async () => {
      const record = { id: recordId, status: "approved" };
      updatePayrollRecordStatusMock.mockResolvedValue(record);

      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ action: "approve" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({
        request,
        orgId,
        params: { recordId },
        supabase: {},
      });
      const body = await response.json();

      expect(updatePayrollRecordStatusMock).toHaveBeenCalledWith(
        {},
        orgId,
        recordId,
        "approved",
      );
      expect(body.data).toEqual(record);
      expect(response.status).toBe(200);
    });

    it("pay action success", async () => {
      const record = { id: recordId, status: "paid" };
      updatePayrollRecordStatusMock.mockResolvedValue(record);

      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ action: "pay" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({
        request,
        orgId,
        params: { recordId },
        supabase: {},
      });
      const body = await response.json();

      expect(updatePayrollRecordStatusMock).toHaveBeenCalledWith(
        {},
        orgId,
        recordId,
        "paid",
      );
      expect(body.data).toEqual(record);
      expect(response.status).toBe(200);
    });

    it("invalid action returns apiError", async () => {
      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ action: "reject" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({
        request,
        orgId,
        params: { recordId },
        supabase: {},
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("BAD_REQUEST");
      expect(body.error.message).toBe("action must be 'approve' or 'pay'");
    });

    it("service error", async () => {
      updatePayrollRecordStatusMock.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ action: "approve" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (PATCH as any)({ request, orgId, params: { recordId }, supabase: {} }),
      ).rejects.toThrow("DB error");
    });
  });
});
