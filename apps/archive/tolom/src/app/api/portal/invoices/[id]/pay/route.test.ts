import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/portal-auth", () => ({
  createPortalRouteHandler: vi.fn((handler: unknown) => handler),
}));

const recordPaymentMock = vi.fn();

vi.mock("@/lib/services/invoice-service", () => ({
  recordPayment: recordPaymentMock,
}));

// ── Mock supabase builder ─────────────────────────────────────────

function makeSupabase(
  invoiceData: Record<string, unknown> | null = null,
  invoiceError: Record<string, unknown> | null = null,
) {
  const eqMock = vi.fn().mockReturnThis();
  const isMock = vi.fn().mockReturnThis();
  const singleMock = vi.fn().mockResolvedValue({
    data: invoiceData,
    error: invoiceError,
  });

  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: eqMock,
        is: isMock,
        single: singleMock,
      }),
    }),
  };
}

const { POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────────

describe("POST /api/portal/invoices/[id]/pay", () => {
  const customer = { id: "cust-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records payment with valid request", async () => {
    const invoice = {
      id: "inv-1",
      organization_id: "org-1",
      status: "pending",
      total: 100,
      balance_due: 100,
      customer_id: "cust-1",
    };
    const supabase = makeSupabase(invoice);
    recordPaymentMock.mockResolvedValue(undefined);

    const req = new NextRequest(
      "http://localhost/api/portal/invoices/inv-1/pay",
      {
        method: "POST",
        body: JSON.stringify({ invoiceId: "inv-1", amount: 100 }),
      },
    );
    const response = await POST({ request: req, customer, supabase });
    const body = await response.json();

    expect(body.data.success).toBe(true);
    expect(response.status).toBe(200);
    expect(recordPaymentMock).toHaveBeenCalledWith(supabase, "inv-1", "org-1", {
      amount: 100,
      method: "bank_transfer",
      reference: null,
      notes: "Portal payment",
    });
  });

  it("returns validation error when invoiceId is missing", async () => {
    const supabase = makeSupabase();
    const req = new NextRequest(
      "http://localhost/api/portal/invoices/inv-1/pay",
      {
        method: "POST",
        body: JSON.stringify({ amount: 100 }),
      },
    );
    const response = await POST({ request: req, customer, supabase });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(recordPaymentMock).not.toHaveBeenCalled();
  });

  it("returns validation error when amount is missing", async () => {
    const supabase = makeSupabase();
    const req = new NextRequest(
      "http://localhost/api/portal/invoices/inv-1/pay",
      {
        method: "POST",
        body: JSON.stringify({ invoiceId: "inv-1" }),
      },
    );
    const response = await POST({ request: req, customer, supabase });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(recordPaymentMock).not.toHaveBeenCalled();
  });

  it("returns 404 when invoice not found", async () => {
    const supabase = makeSupabase(null);
    const req = new NextRequest(
      "http://localhost/api/portal/invoices/inv-missing/pay",
      {
        method: "POST",
        body: JSON.stringify({ invoiceId: "inv-missing", amount: 100 }),
      },
    );
    const response = await POST({ request: req, customer, supabase });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
    expect(recordPaymentMock).not.toHaveBeenCalled();
  });

  it("returns 403 when invoice belongs to different customer", async () => {
    const invoice = {
      id: "inv-1",
      organization_id: "org-1",
      status: "pending",
      total: 100,
      balance_due: 100,
      customer_id: "cust-other",
    };
    const supabase = makeSupabase(invoice);
    const req = new NextRequest(
      "http://localhost/api/portal/invoices/inv-1/pay",
      {
        method: "POST",
        body: JSON.stringify({ invoiceId: "inv-1", amount: 100 }),
      },
    );
    const response = await POST({ request: req, customer, supabase });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
    expect(recordPaymentMock).not.toHaveBeenCalled();
  });

  it("returns invalid state error when invoice is already paid", async () => {
    const invoice = {
      id: "inv-1",
      organization_id: "org-1",
      status: "paid",
      total: 100,
      balance_due: 0,
      customer_id: "cust-1",
    };
    const supabase = makeSupabase(invoice);
    const req = new NextRequest(
      "http://localhost/api/portal/invoices/inv-1/pay",
      {
        method: "POST",
        body: JSON.stringify({ invoiceId: "inv-1", amount: 100 }),
      },
    );
    const response = await POST({ request: req, customer, supabase });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_STATE");
    expect(recordPaymentMock).not.toHaveBeenCalled();
  });

  it("returns invalid state error when invoice is cancelled", async () => {
    const invoice = {
      id: "inv-1",
      organization_id: "org-1",
      status: "cancelled",
      total: 100,
      balance_due: 0,
      customer_id: "cust-1",
    };
    const supabase = makeSupabase(invoice);
    const req = new NextRequest(
      "http://localhost/api/portal/invoices/inv-1/pay",
      {
        method: "POST",
        body: JSON.stringify({ invoiceId: "inv-1", amount: 100 }),
      },
    );
    const response = await POST({ request: req, customer, supabase });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_STATE");
    expect(recordPaymentMock).not.toHaveBeenCalled();
  });

  it("propagates service error", async () => {
    const invoice = {
      id: "inv-1",
      organization_id: "org-1",
      status: "pending",
      total: 100,
      balance_due: 100,
      customer_id: "cust-1",
    };
    const supabase = makeSupabase(invoice);
    recordPaymentMock.mockRejectedValue(new Error("Payment gateway failed"));

    const req = new NextRequest(
      "http://localhost/api/portal/invoices/inv-1/pay",
      {
        method: "POST",
        body: JSON.stringify({ invoiceId: "inv-1", amount: 100 }),
      },
    );

    await expect(POST({ request: req, customer, supabase })).rejects.toThrow(
      "Payment gateway failed",
    );
  });
});
