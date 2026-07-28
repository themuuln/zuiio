import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getStoreCreditBalanceMock = vi.fn();
const getStoreCreditBalanceByInvoiceMock = vi.fn();
const getStoreCreditTransactionsMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  apiError: vi.fn(
    (type: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code: type, message } }), {
        status,
      }),
  ),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/store-credit-service", () => ({
  getStoreCreditBalance: getStoreCreditBalanceMock,
  getStoreCreditBalanceByInvoice: getStoreCreditBalanceByInvoiceMock,
  getStoreCreditTransactions: getStoreCreditTransactionsMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve({})),
}));

const { GET } = await import("./route");

interface HandlerContext {
  request: NextRequest;
  orgId: string;
}

describe("organizations/[id]/store-credits route", () => {
  const orgId = "org-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/store-credits`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns balance by invoice when invoice_id provided", async () => {
      const data = { balance: 50.0, customer: { id: "c-1", name: "John" } };
      getStoreCreditBalanceByInvoiceMock.mockResolvedValue(data);

      const req = new NextRequest(new URL(`${baseUrl}?invoice_id=inv-1`));
      const context: HandlerContext = { request: req, orgId };
      const response = await GET(context);
      const body = await response.json();

      expect(getStoreCreditBalanceByInvoiceMock).toHaveBeenCalledWith(
        {},
        "inv-1",
        orgId,
      );
      expect(body.data).toEqual(data);
    });

    it("returns balance and transactions for customer", async () => {
      const balance = { total: 100, customer_id: "c-1" };
      const transactions = [{ id: "t-1", amount: -20 }];
      getStoreCreditBalanceMock.mockResolvedValue(balance);
      getStoreCreditTransactionsMock.mockResolvedValue(transactions);

      const req = new NextRequest(
        new URL(`${baseUrl}?customer_id=c-1&include=transactions`),
      );
      const context: HandlerContext = { request: req, orgId };
      const response = await GET(context);
      const body = await response.json();

      expect(getStoreCreditBalanceMock).toHaveBeenCalledWith({}, "c-1", orgId);
      expect(getStoreCreditTransactionsMock).toHaveBeenCalledWith(
        {},
        "c-1",
        orgId,
        { limit: 10 },
      );
      expect(body.data).toEqual({ balance, transactions });
    });

    it("returns balance without transactions when include not set", async () => {
      const balance = { total: 100, customer_id: "c-1" };
      getStoreCreditBalanceMock.mockResolvedValue(balance);

      const req = new NextRequest(new URL(`${baseUrl}?customer_id=c-1`));
      const context: HandlerContext = { request: req, orgId };
      const response = await GET(context);
      const body = await response.json();

      expect(getStoreCreditBalanceMock).toHaveBeenCalledWith({}, "c-1", orgId);
      expect(getStoreCreditTransactionsMock).not.toHaveBeenCalled();
      expect(body.data).toEqual({ balance, transactions: [] });
    });

    it("returns 400 when no customer_id or invoice_id provided", async () => {
      const req = new NextRequest(new URL(baseUrl));
      const context: HandlerContext = { request: req, orgId };
      const response = await GET(context);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("BAD_REQUEST");
    });

    it("handles service error from balance fetch", async () => {
      getStoreCreditBalanceMock.mockRejectedValue(new Error("Balance error"));

      const req = new NextRequest(new URL(`${baseUrl}?customer_id=c-1`));
      const context: HandlerContext = { request: req, orgId };
      await expect(GET(context)).rejects.toThrow("Balance error");
    });
  });
});
