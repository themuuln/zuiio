import { beforeEach, describe, expect, it, vi } from "vitest";

const mockInsert = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockMaybeSingle = vi.hoisted(() => vi.fn());
const mockSendEmail = vi.hoisted(() => vi.fn());
const mockSendSms = vi.hoisted(() => vi.fn());
const mockCapture = vi.hoisted(() => vi.fn());

vi.mock("@/lib/order-email", () => ({
  sendOrderConfirmationEmail: mockSendEmail,
}));
vi.mock("@/lib/notifications/sms", () => ({
  sendOrderStatusSms: mockSendSms,
}));
vi.mock("@zuiio/capture", () => ({
  capture: mockCapture,
}));
vi.mock("@/lib/supabase/server-service", () => ({
  createServiceClient: () => ({
    from: (table: string) => {
      if (table === "order_notifications") {
        return {
          insert: mockInsert,
          update: (payload: unknown) => ({
            eq: () => ({
              eq: () => mockUpdate(payload),
            }),
          }),
        };
      }
      if (table === "sales") {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: mockMaybeSingle }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

import { POST } from "./route";

const SALE = {
  id: "11111111-2222-4333-8444-555555555555",
  total_amount: 22500,
  payment_method: "cash",
  delivery_type: "delivery",
  delivery_address: "СБД, 1-р хороо",
  contact_email: "buyer@example.com",
  organization: { name: "Тест Дэлгүүр" },
  contact: { phone: "99112233" },
};

function saleWith(overrides: Partial<typeof SALE>): typeof SALE {
  return { ...SALE, ...overrides };
}

async function postOrder(orderId: string) {
  return POST(
    new Request("http://localhost/api/notify/order-confirmation", {
      method: "POST",
      body: JSON.stringify({ order_id: orderId }),
      headers: { "Content-Type": "application/json" },
    }),
  );
}

describe("POST /api/notify/order-confirmation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
    mockUpdate.mockResolvedValue({ error: null });
    mockMaybeSingle.mockResolvedValue({ data: saleWith({}), error: null });
    mockSendEmail.mockResolvedValue({ success: true });
    mockSendSms.mockResolvedValue({ success: true });
  });

  it("rejects a missing order_id", async () => {
    const res = await POST(
      new Request("http://localhost/api/notify/order-confirmation", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("dedupes: a replayed callback never double-sends", async () => {
    const first = await postOrder(SALE.id);
    expect(first.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);

    mockInsert.mockResolvedValueOnce({
      error: { code: "23505", message: "duplicate" },
    });
    const second = await postOrder(SALE.id);
    const body = (await second.json()) as { skipped?: string };
    expect(second.status).toBe(200);
    expect(body.skipped).toBe("already_notified");
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });

  it("sends the confirmation email and the SMS when contact data exists", async () => {
    const res = await postOrder(SALE.id);
    expect(res.status).toBe(200);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        to: "buyer@example.com",
        orgName: "Тест Дэлгүүр",
        orderId: SALE.id,
        totalAmount: 22500,
        paymentMethod: "cash",
        deliveryType: "delivery",
        deliveryAddress: "СБД, 1-р хороо",
      }),
    );

    expect(mockSendSms).toHaveBeenCalledTimes(1);
    expect(mockSendSms).toHaveBeenCalledWith({
      to: "99112233",
      orderNumber: SALE.id.slice(0, 8),
      status: "pending",
    });
  });

  it("skips the SMS when the buyer has no contact phone", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: saleWith({ contact: null }),
      error: null,
    });
    const res = await postOrder(SALE.id);
    expect(res.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendSms).not.toHaveBeenCalled();
  });

  it("marks the notification failed and 404s when the sale is missing", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    const res = await postOrder(SALE.id);
    expect(res.status).toBe(404);
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});
