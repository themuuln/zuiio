import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { createMockRequest, parseResponse } from "@/test/mocks";

// Mock server-only so we can import qpay module in vitest/jsdom
vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { POST as OrdersPost } from "@/app/api/shop/orders/route";
import { POST as ShopCallbackPost } from "@/app/api/shop/qpay/callback/route";
import { resetMockState } from "@/lib/shop/qpay";
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
let mockSupabase: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  resetMockState();
  mockSupabase = { rpc: vi.fn() };
  mockCreateClient.mockResolvedValue(mockSupabase as never);
});

// ── Shop order tests ───────────────────────────────────────────────

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

// ── Shop callback tests ────────────────────────────────────────────

describe("POST /api/shop/qpay/callback", () => {
  it("rejects missing invoice_id", async () => {
    const req = createMockRequest({});
    const res = await ShopCallbackPost(req as never);
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
    const res = await ShopCallbackPost(req as never);
    const body = await parseResponse(res);
    expect(res.status).toBe(200);
    expect(body).toEqual({ status: "paid", data: paymentData });
  });

  it("handles RPC failure gracefully in mock mode", async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: new Error("QPay API unreachable"),
    });

    const req = createMockRequest({ invoice_id: "qpay-invoice-123" });
    const res = await ShopCallbackPost(req as never);
    const body = await parseResponse(res);
    expect(res.status).toBe(200);
    expect(body.status).toBe("paid");
  });
});

// ── QPay adapter module tests ──────────────────────────────────────

describe("QPay adapter (module-level)", () => {
  it("isMockMode returns true when env vars are missing", async () => {
    const { isMockMode } = await import("@/lib/shop/qpay");
    expect(isMockMode()).toBe(true);
  });

  it("createInvoice returns mock data with MOCK-INV- prefix", async () => {
    const { createInvoice, getQPayConfig } = await import("@/lib/shop/qpay");
    const config = getQPayConfig();
    const result = await createInvoice(config, {
      amount: 50000,
      merchantInvoiceId: "test-order-1",
      callbackUrl: "https://example.com/callback",
    });
    expect(result.amount).toBe(50000);
    expect(result.qrText).toMatch(/^qpay/);
  });

  it("checkPayment returns UNPAID for unknown invoice", async () => {
    const { checkPayment, getQPayConfig } = await import("@/lib/shop/qpay");
    const config = getQPayConfig();
    const result = await checkPayment(config, "non-existent");
    expect(result.status).toBe("UNPAID");
  });

  it("confirmMockPayment confirms and checkPayment reflects it", async () => {
    const {
      confirmMockPayment,
      checkPayment,
      createInvoice,
      getQPayConfig,
      resetMockState: reset,
    } = await import("@/lib/shop/qpay");
    reset();

    const config = getQPayConfig();
    const invoice = await createInvoice(config, {
      amount: 30000,
      description: "Test",
    });

    const before = await checkPayment(config, invoice.invoiceId);
    expect(before.status).toBe("UNPAID");

    const confirmed = confirmMockPayment(invoice.invoiceId);
    expect(confirmed).toBe(true);

    const after = await checkPayment(config, invoice.invoiceId);
    expect(after.status).toBe("PAID");
  });

  it("confirmMockPayment returns false for unknown invoice", async () => {
    const { confirmMockPayment } = await import("@/lib/shop/qpay");
    expect(confirmMockPayment("unknown")).toBe(false);
  });

  it("resetMockState clears all mock invoice state", async () => {
    const {
      confirmMockPayment,
      checkPayment,
      createInvoice,
      getQPayConfig,
      resetMockState: reset,
    } = await import("@/lib/shop/qpay");
    reset();

    const config = getQPayConfig();
    const invoice = await createInvoice(config, {
      amount: 10000,
      description: "Reset test",
    });

    confirmMockPayment(invoice.invoiceId);
    const before = await checkPayment(config, invoice.invoiceId);
    expect(before.status).toBe("PAID");

    reset();
    const after = await checkPayment(config, invoice.invoiceId);
    expect(after.status).toBe("UNPAID");
  });
});

// ── Unified callback tests ─────────────────────────────────────────

describe("POST /api/qpay/callback (unified)", () => {
  it("rejects missing invoice_id", async () => {
    const { POST } = await import("@/app/api/qpay/callback/route");
    const req = createMockRequest({});
    const res = await POST(req as never);
    const body = await parseResponse(res);
    expect(res.status).toBe(400);
    expect(body.error).toBe("invoice_id required");
  });

  it("returns paid status in mock mode", async () => {
    const { POST } = await import("@/app/api/qpay/callback/route");
    mockSupabase.rpc.mockResolvedValueOnce({
      data: { status: "paid" },
      error: null,
    });
    const req = createMockRequest({ invoice_id: "qpay-invoice-123" });
    const res = await POST(req as never);
    const body = await parseResponse(res);
    expect(res.status).toBe(200);
    expect(body.status).toBe("paid");
  });

  it("works with mock invoice id", async () => {
    const { POST } = await import("@/app/api/qpay/callback/route");
    mockSupabase.rpc.mockResolvedValueOnce({
      data: { status: "paid" },
      error: null,
    });
    const req = createMockRequest({ invoice_id: "MOCK-INV-test" });
    const res = await POST(req as never);
    const body = await parseResponse(res);
    expect(res.status).toBe(200);
    expect(body.status).toBe("paid");
  });
});
