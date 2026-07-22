import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { createMockRequest, parseResponse } from "@/test/mocks";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { POST as OrdersPost } from "@/app/api/shop/orders/route";
import { POST as CallbackPost } from "@/app/api/shop/qpay/callback/route";
import { createClient } from "@/lib/supabase/server";

interface MockSupabaseClient {
  rpc: Mock<
    (
      name: string,
      params?: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: Error | null }>
  >;
}

const mockCreateClient = vi.mocked(createClient);

describe("QPay Payment Integration", () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = { rpc: vi.fn() };
    mockCreateClient.mockResolvedValue(mockSupabase as never);
  });

  describe("POST /api/shop/orders", () => {
    it("rejects invalid body with missing fields", async () => {
      const req = createMockRequest({});
      const res = await OrdersPost(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(body.error).toBeDefined();
    });

    it("rejects empty customerName", async () => {
      const req = createMockRequest({
        productId: "550e8400-e29b-41d4-a716-446655440000",
        variantIndex: 0,
        customerName: "",
        phone: "99112233",
      });
      const res = await OrdersPost(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(body.error).toBe("Нэрээ оруулна уу");
    });

    it("rejects invalid phone format", async () => {
      const req = createMockRequest({
        productId: "550e8400-e29b-41d4-a716-446655440000",
        variantIndex: 0,
        customerName: "Test",
        phone: "123",
      });
      const res = await OrdersPost(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(body.error).toBe("Утасны дугаар 8 оронтой байх ёстой");
    });

    it("returns correct response structure on success", async () => {
      const orderId = "550e8400-e29b-41d4-a716-446655440000";
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: orderId, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      const req = createMockRequest({
        productId: "550e8400-e29b-41d4-a716-446655440000",
        variantIndex: 0,
        customerName: "Test",
        phone: "99112233",
      });
      const res = await OrdersPost(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toMatchObject({
        orderId,
        totalMnt: expect.any(Number),
        qrImage: expect.any(String),
        qrText: expect.any(String),
        merchantInvoiceId: expect.any(String),
        expiresIn: expect.any(Number),
      });
    });
  });

  describe("POST /api/shop/qpay/callback", () => {
    it("rejects missing invoice_id", async () => {
      const req = createMockRequest({});
      const res = await CallbackPost(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(body.error).toBe("invoice_id required");
    });

    it("returns success on valid callback", async () => {
      const paymentData = { status: "paid", amount: 300 };
      mockSupabase.rpc.mockResolvedValueOnce({
        data: paymentData,
        error: null,
      });

      const req = createMockRequest({ invoice_id: "qpay-invoice-123" });
      const res = await CallbackPost(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual({ status: "paid", data: paymentData });
    });

    it("handles QPay API unavailable (RPC failure)", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: new Error("QPay API unreachable"),
      });

      const req = createMockRequest({ invoice_id: "qpay-invoice-123" });
      const res = await CallbackPost(req as never);
      const body = await parseResponse(res);

      expect(res.status).toBe(422);
      expect(body.error).toBe("Payment confirmation failed");
    });
  });
});
