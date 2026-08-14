import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetInvoice = vi.hoisted(() => vi.fn());
const configured = vi.hoisted(() => ({ value: false }));
const mockRpc = vi.hoisted(() => vi.fn());
const mockMaybeSingle = vi.hoisted(() => vi.fn());
const mockIssueReceipt = vi.hoisted(() => vi.fn());
const mockCapture = vi.hoisted(() => vi.fn());

vi.mock("@/lib/payments/qpay", () => ({
  isQpayConfigured: () => configured.value,
  getQpayInvoice: mockGetInvoice,
}));
vi.mock("@/lib/supabase/server-service", () => ({
  createServiceClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: mockMaybeSingle }),
        }),
      }),
    }),
    rpc: mockRpc,
  }),
}));
vi.mock("@/lib/ebarimt", () => ({
  issueReceiptForPaidOrder: mockIssueReceipt,
}));
vi.mock("@zuiio/capture", () => ({
  capture: mockCapture,
}));

import { POST } from "./route";

async function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/payments/qpay/webhook", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }),
  );
}

describe("POST /api/payments/qpay/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configured.value = false;
    mockIssueReceipt.mockResolvedValue({ issued: false });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 503 until QPAY credentials are configured", async () => {
    const res = await post({ invoice_id: "inv-1" });
    expect(res.status).toBe(503);
    expect(mockGetInvoice).not.toHaveBeenCalled();
  });

  it("rejects a missing invoice_id", async () => {
    configured.value = true;
    const res = await post({});
    expect(res.status).toBe(400);
  });

  it("does not confirm an unpaid invoice", async () => {
    configured.value = true;
    mockGetInvoice.mockResolvedValue({
      invoice_id: "inv-1",
      status: "PENDING",
      amount: 1000,
    });
    const res = await post({ invoice_id: "inv-1" });
    expect(res.status).toBe(200);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("confirms the order for a PAID invoice via the mapped sale and issues the receipt", async () => {
    configured.value = true;
    mockGetInvoice.mockResolvedValue({
      invoice_id: "inv-1",
      status: "PAID",
      amount: 22500,
    });
    mockMaybeSingle.mockResolvedValue({
      data: { sale_id: "sale-1", amount: 22500 },
      error: null,
    });
    mockRpc.mockResolvedValue({
      data: { order_id: "sale-1", status: "completed", paid: true },
      error: null,
    });

    const res = await post({ invoice_id: "inv-1" });
    expect(res.status).toBe(200);

    expect(mockRpc).toHaveBeenCalledWith("confirm_online_payment", {
      p_sale_id: "sale-1",
      p_gateway: "qpay",
      p_gateway_ref: "inv-1",
      p_amount: 22500,
    });
    expect(mockIssueReceipt).toHaveBeenCalledWith(expect.anything(), "sale-1");
  });

  it("rejects an amount mismatch between the invoice and the recorded payment", async () => {
    configured.value = true;
    mockGetInvoice.mockResolvedValue({
      invoice_id: "inv-1",
      status: "PAID",
      amount: 1,
    });
    mockMaybeSingle.mockResolvedValue({
      data: { sale_id: "sale-1", amount: 22500 },
      error: null,
    });

    const res = await post({ invoice_id: "inv-1" });
    expect(res.status).toBe(422);
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
