import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/lib/errors";

const getInvoicesMock = vi.fn();
const createStandaloneInvoiceMock = vi.fn();
const createInvoiceFromWorkOrderMock = vi.fn();
const mutationRateLimiterCheckMock = vi.fn(() => ({
  allowed: true,
  resetAt: Date.now() + 1000,
}));

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/invoice-service", () => ({
  getInvoices: getInvoicesMock,
  createStandaloneInvoice: createStandaloneInvoiceMock,
  createInvoiceFromWorkOrder: createInvoiceFromWorkOrderMock,
}));

vi.mock("@/lib/services/subscription-enforcement", () => ({
  requireActiveSubscription: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  mutationRateLimiter: {
    check: mutationRateLimiterCheckMock,
  },
}));

const { GET, POST } = await import("./route");

describe("organizations/[id]/invoices route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const supabase = { client: "test" };

  beforeEach(() => {
    vi.clearAllMocks();
    mutationRateLimiterCheckMock.mockReturnValue({
      allowed: true,
      resetAt: Date.now() + 1000,
    });
  });

  describe("GET", () => {
    it("returns invoices for the organization", async () => {
      const invoices = [{ id: "inv-1", total: 100 }];
      getInvoicesMock.mockResolvedValue(invoices);

      const request = new NextRequest(
        `http://localhost/api/organizations/${orgId}/invoices`,
      );
      const response = await (GET as any)({ request, orgId, supabase });
      const body = await response.json();

      expect(getInvoicesMock).toHaveBeenCalledWith(supabase, orgId, {
        status: undefined,
        branchId: undefined,
      });
      expect(body.data).toEqual(invoices);
    });

    it("filters invoices by status query param", async () => {
      getInvoicesMock.mockResolvedValue([]);

      const request = new NextRequest(
        `http://localhost/api/organizations/${orgId}/invoices?status=paid`,
      );
      await (GET as any)({ request, orgId, supabase });

      expect(getInvoicesMock).toHaveBeenCalledWith(supabase, orgId, {
        status: "paid",
        branchId: undefined,
      });
    });

    it("filters invoices by branch_id query param", async () => {
      getInvoicesMock.mockResolvedValue([]);

      const request = new NextRequest(
        `http://localhost/api/organizations/${orgId}/invoices?branch_id=branch-1`,
      );
      await (GET as any)({ request, orgId, supabase });

      expect(getInvoicesMock).toHaveBeenCalledWith(supabase, orgId, {
        status: undefined,
        branchId: "branch-1",
      });
    });

    it("handles service error", async () => {
      getInvoicesMock.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest(
        `http://localhost/api/organizations/${orgId}/invoices`,
      );
      await expect((GET as any)({ request, orgId, supabase })).rejects.toThrow(
        "DB error",
      );
    });
  });

  describe("POST", () => {
    describe("standalone invoice with items", () => {
      it("creates a standalone invoice with items", async () => {
        const invoice = { id: "inv-1" };
        createStandaloneInvoiceMock.mockResolvedValue(invoice);
        const itemsBody = {
          items: [{ description: "Service", amount: 100 }],
          notes: "Test invoice",
        };

        const request = new NextRequest(
          `http://localhost/api/organizations/${orgId}/invoices`,
          {
            method: "POST",
            body: JSON.stringify(itemsBody),
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

        expect(createStandaloneInvoiceMock).toHaveBeenCalledWith(
          supabase,
          orgId,
          itemsBody,
          user.id,
        );
        expect(body.data).toEqual(invoice);
      });

      it("handles ValidationError from createStandaloneInvoice", async () => {
        createStandaloneInvoiceMock.mockRejectedValue(
          new ValidationError("Invalid items"),
        );

        const request = new NextRequest(
          `http://localhost/api/organizations/${orgId}/invoices`,
          {
            method: "POST",
            body: JSON.stringify({
              items: [{ description: "Bad", amount: -1 }],
            }),
            headers: { "content-type": "application/json" },
          },
        );

        await expect(
          (POST as any)({ request, orgId, user, supabase }),
        ).rejects.toThrow(ValidationError);
      });

      it("handles service error from createStandaloneInvoice", async () => {
        createStandaloneInvoiceMock.mockRejectedValue(new Error("DB error"));

        const request = new NextRequest(
          `http://localhost/api/organizations/${orgId}/invoices`,
          {
            method: "POST",
            body: JSON.stringify({
              items: [{ description: "Test", amount: 50 }],
            }),
            headers: { "content-type": "application/json" },
          },
        );

        await expect(
          (POST as any)({ request, orgId, user, supabase }),
        ).rejects.toThrow("DB error");
      });
    });

    describe("work-order invoice", () => {
      it("creates an invoice from a work order", async () => {
        const invoice = { id: "inv-2" };
        createInvoiceFromWorkOrderMock.mockResolvedValue(invoice);

        const request = new NextRequest(
          `http://localhost/api/organizations/${orgId}/invoices`,
          {
            method: "POST",
            body: JSON.stringify({
              work_order_id: "wo-1",
              due_days: 30,
              notes: "Payment due in 30 days",
            }),
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

        expect(createInvoiceFromWorkOrderMock).toHaveBeenCalledWith(
          supabase,
          orgId,
          "wo-1",
          {
            dueDays: 30,
            notes: "Payment due in 30 days",
            terms: undefined,
            userId: user.id,
          },
        );
        expect(body.data).toEqual(invoice);
      });

      it("throws ValidationError when neither items nor work_order_id provided", async () => {
        const request = new NextRequest(
          `http://localhost/api/organizations/${orgId}/invoices`,
          {
            method: "POST",
            body: JSON.stringify({}),
            headers: { "content-type": "application/json" },
          },
        );

        await expect(
          (POST as any)({ request, orgId, user, supabase }),
        ).rejects.toThrow(ValidationError);
      });

      it("handles service error from createInvoiceFromWorkOrder", async () => {
        createInvoiceFromWorkOrderMock.mockRejectedValue(
          new Error("Work order not found"),
        );

        const request = new NextRequest(
          `http://localhost/api/organizations/${orgId}/invoices`,
          {
            method: "POST",
            body: JSON.stringify({ work_order_id: "wo-invalid" }),
            headers: { "content-type": "application/json" },
          },
        );

        await expect(
          (POST as any)({ request, orgId, user, supabase }),
        ).rejects.toThrow("Work order not found");
      });
    });
  });
});
