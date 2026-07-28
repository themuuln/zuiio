import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const recordPaymentMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/invoice-service", () => ({
  recordPayment: recordPaymentMock,
}));

const { POST } = await import("./route");

describe("organizations/[id]/invoices/[invoiceId]/payments route", () => {
  const orgId = "org-1";
  const invoiceId = "inv-1";
  const user = { id: "user-1" };
  const supabase = { client: "test" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    const validBody = {
      amount: 100,
      method: "credit_card",
      reference: "REF-001",
      notes: "Payment at counter",
    };

    it("records a payment with valid body", async () => {
      const payment = {
        id: "pay-1",
        invoice_id: invoiceId,
        amount: 100,
        method: "credit_card",
        reference: "REF-001",
        notes: "Payment at counter",
      };
      recordPaymentMock.mockResolvedValue([payment]);

      const request = new NextRequest(
        `http://localhost/api/organizations/${orgId}/invoices/${invoiceId}/payments`,
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
        params: { invoiceId },
      });
      const body = await response.json();

      expect(recordPaymentMock).toHaveBeenCalledWith(
        supabase,
        invoiceId,
        orgId,
        {
          amount: validBody.amount,
          method: validBody.method,
          reference: validBody.reference,
          notes: validBody.notes,
        },
        user.id,
      );
      expect(body.data).toEqual([payment]);
      expect(response.status).toBe(201);
    });

    it("defaults method to cash when not provided", async () => {
      recordPaymentMock.mockResolvedValue([
        { id: "pay-2", invoice_id: invoiceId, amount: 50, method: "cash" },
      ]);

      const request = new NextRequest(
        `http://localhost/api/organizations/${orgId}/invoices/${invoiceId}/payments`,
        {
          method: "POST",
          body: JSON.stringify({ amount: 50 }),
          headers: { "content-type": "application/json" },
        },
      );

      await (POST as any)({
        request,
        orgId,
        user,
        supabase,
        params: { invoiceId },
      });

      expect(recordPaymentMock).toHaveBeenCalledWith(
        supabase,
        invoiceId,
        orgId,
        expect.objectContaining({ amount: 50, method: "cash" }),
        user.id,
      );
    });

    it("defaults reference and notes to undefined when not provided", async () => {
      recordPaymentMock.mockResolvedValue([
        { id: "pay-3", invoice_id: invoiceId, amount: 75, method: "cash" },
      ]);

      const request = new NextRequest(
        `http://localhost/api/organizations/${orgId}/invoices/${invoiceId}/payments`,
        {
          method: "POST",
          body: JSON.stringify({ amount: 75, method: "bank_transfer" }),
          headers: { "content-type": "application/json" },
        },
      );

      await (POST as any)({
        request,
        orgId,
        user,
        supabase,
        params: { invoiceId },
      });

      expect(recordPaymentMock).toHaveBeenCalledWith(
        supabase,
        invoiceId,
        orgId,
        {
          amount: 75,
          method: "bank_transfer",
          reference: undefined,
          notes: undefined,
        },
        user.id,
      );
    });

    it("throws validation error for negative amount", async () => {
      const request = new NextRequest(
        `http://localhost/api/organizations/${orgId}/invoices/${invoiceId}/payments`,
        {
          method: "POST",
          body: JSON.stringify({ amount: -5, method: "cash" }),
          headers: { "content-type": "application/json" },
        },
      );

      await expect(
        (POST as any)({
          request,
          orgId,
          user,
          supabase,
          params: { invoiceId },
        }),
      ).rejects.toThrow(/positive amount/);
    });

    it("throws validation error for zero amount", async () => {
      const request = new NextRequest(
        `http://localhost/api/organizations/${orgId}/invoices/${invoiceId}/payments`,
        {
          method: "POST",
          body: JSON.stringify({ amount: 0, method: "cash" }),
          headers: { "content-type": "application/json" },
        },
      );

      await expect(
        (POST as any)({
          request,
          orgId,
          user,
          supabase,
          params: { invoiceId },
        }),
      ).rejects.toThrow(/positive amount/);
    });

    it("throws validation error for missing amount", async () => {
      const request = new NextRequest(
        `http://localhost/api/organizations/${orgId}/invoices/${invoiceId}/payments`,
        {
          method: "POST",
          body: JSON.stringify({ method: "cash" }),
          headers: { "content-type": "application/json" },
        },
      );

      await expect(
        (POST as any)({
          request,
          orgId,
          user,
          supabase,
          params: { invoiceId },
        }),
      ).rejects.toThrow(/positive amount/);
    });

    it("handles service error from recordPayment", async () => {
      recordPaymentMock.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest(
        `http://localhost/api/organizations/${orgId}/invoices/${invoiceId}/payments`,
        {
          method: "POST",
          body: JSON.stringify(validBody),
          headers: { "content-type": "application/json" },
        },
      );

      await expect(
        (POST as any)({
          request,
          orgId,
          user,
          supabase,
          params: { invoiceId },
        }),
      ).rejects.toThrow("DB error");
    });
  });
});
