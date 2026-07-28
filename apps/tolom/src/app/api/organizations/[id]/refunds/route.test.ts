import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getRefundStatsMock = vi.fn();
const getRefundsMock = vi.fn();
const recordRefundMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/refund-service", () => ({
  getRefundStats: getRefundStatsMock,
  getRefunds: getRefundsMock,
  recordRefund: recordRefundMock,
}));

const { GET, POST } = await import("./route");

describe("organizations/[id]/refunds route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const supabase = { client: "test" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    describe("stats", () => {
      it("returns refund stats when action=stats", async () => {
        const stats = { total_refunds: 5, total_amount: 250 };
        getRefundStatsMock.mockResolvedValue(stats);

        const request = new NextRequest(
          `http://localhost/api/organizations/${orgId}/refunds?action=stats`,
        );
        const response = await (GET as any)({ request, orgId, supabase });
        const body = await response.json();

        expect(getRefundStatsMock).toHaveBeenCalledWith(supabase, orgId);
        expect(body.data).toEqual(stats);
      });

      it("handles service error from getRefundStats", async () => {
        getRefundStatsMock.mockRejectedValue(new Error("DB error"));

        const request = new NextRequest(
          `http://localhost/api/organizations/${orgId}/refunds?action=stats`,
        );
        await expect(
          (GET as any)({ request, orgId, supabase }),
        ).rejects.toThrow("DB error");
      });
    });

    describe("list", () => {
      it("returns refunds with default pagination", async () => {
        const refunds = [
          { id: "ref-1", amount: 50 },
          { id: "ref-2", amount: 75 },
        ];
        getRefundsMock.mockResolvedValue(refunds);

        const request = new NextRequest(
          `http://localhost/api/organizations/${orgId}/refunds`,
        );
        const response = await (GET as any)({ request, orgId, supabase });
        const _body = await response.json();

        expect(getRefundsMock).toHaveBeenCalledWith(supabase, orgId, {
          status: null,
          limit: 20,
          offset: 0,
        });
      });

      it("filters by status query param", async () => {
        getRefundsMock.mockResolvedValue([]);

        const request = new NextRequest(
          `http://localhost/api/organizations/${orgId}/refunds?status=pending`,
        );
        await (GET as any)({ request, orgId, supabase });

        expect(getRefundsMock).toHaveBeenCalledWith(supabase, orgId, {
          status: "pending",
          limit: 20,
          offset: 0,
        });
      });

      it("uses custom limit and offset query params", async () => {
        getRefundsMock.mockResolvedValue([]);

        const request = new NextRequest(
          `http://localhost/api/organizations/${orgId}/refunds?limit=10&offset=5`,
        );
        await (GET as any)({ request, orgId, supabase });

        expect(getRefundsMock).toHaveBeenCalledWith(supabase, orgId, {
          status: null,
          limit: 10,
          offset: 5,
        });
      });

      it("handles service error from getRefunds", async () => {
        getRefundsMock.mockRejectedValue(new Error("DB error"));

        const request = new NextRequest(
          `http://localhost/api/organizations/${orgId}/refunds`,
        );
        await expect(
          (GET as any)({ request, orgId, supabase }),
        ).rejects.toThrow("DB error");
      });
    });
  });
  describe("POST", () => {
    const validBody = {
      invoice_id: "123e4567-e89b-12d3-a456-426614174000",
      amount: 100,
      method: "cash" as const,
      reason: "Customer returned item",
      reference: "REF-001",
      notes: "Processed at counter",
    };

    it("records a refund with valid body", async () => {
      const refund = { id: "ref-1", ...validBody };
      recordRefundMock.mockResolvedValue(refund);

      const request = new NextRequest(
        `http://localhost/api/organizations/${orgId}/refunds`,
        {
          method: "POST",
          body: JSON.stringify(validBody),
          headers: { "content-type": "application/json" },
        },
      );

      const response = await (POST as any)({
        request,
        orgId,
        user,
        supabase,
      });
      const body = await response.json();

      expect(recordRefundMock).toHaveBeenCalledWith(
        supabase,
        validBody.invoice_id,
        orgId,
        {
          amount: validBody.amount,
          method: validBody.method,
          reason: validBody.reason,
          reference: validBody.reference,
          notes: validBody.notes,
        },
        user.id,
      );
      expect(body.data).toEqual(refund);
    });

    it("throws validation error for invalid body", async () => {
      const invalidBody = {
        invoice_id: "not-a-uuid",
        amount: -5,
      };

      const request = new NextRequest(
        `http://localhost/api/organizations/${orgId}/refunds`,
        {
          method: "POST",
          body: JSON.stringify(invalidBody),
          headers: { "content-type": "application/json" },
        },
      );

      await expect(
        (POST as any)({ request, orgId, user, supabase }),
      ).rejects.toThrow(/Validation failed/);
    });

    it("handles service error from recordRefund", async () => {
      recordRefundMock.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest(
        `http://localhost/api/organizations/${orgId}/refunds`,
        {
          method: "POST",
          body: JSON.stringify(validBody),
          headers: { "content-type": "application/json" },
        },
      );

      await expect(
        (POST as any)({ request, orgId, user, supabase }),
      ).rejects.toThrow("DB error");
    });
  });
});
