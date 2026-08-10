/**
 * Tests for src/lib/order-email.ts — buyer confirmation email (R9).
 * The send is best-effort: a mail failure must never throw.
 */

import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/validation", () => ({
  escapeHtml: (s: string) => s,
}));

import { sendEmail } from "@/lib/email";
import {
  buildOrderConfirmationHtml,
  sendOrderConfirmationEmail,
} from "../order-email";

const sendEmailMock = vi.mocked(sendEmail);

const baseParams = {
  to: "buyer@example.mn",
  orgName: "Тест Дэлгүүр",
  orderId: "11111111-2222-3333-4444-555555555555",
  totalAmount: 13500,
  paymentMethod: "qpay",
  deliveryType: "delivery",
  deliveryAddress: "УБ, Баянгол дүүрэг, 1-р хороо",
};

describe("buildOrderConfirmationHtml", () => {
  it("includes the order id, total, payment and delivery info", () => {
    const html = buildOrderConfirmationHtml(baseParams);
    expect(html).toContain("Тест Дэлгүүр");
    expect(html).toContain("Захиалга баталгаажлаа");
    expect(html).toContain("11111111");
    expect(html).toContain("13,500");
    expect(html).toContain("QPay / банкны шилжүүлэг");
    expect(html).toContain("Хүргэлт");
    expect(html).toContain("УБ, Баянгол дүүрэг");
  });

  it("hides the address block for pickup orders", () => {
    const html = buildOrderConfirmationHtml({
      ...baseParams,
      deliveryType: "pickup",
      deliveryAddress: null,
    });
    expect(html).toContain("Дэлгүүрээс авах");
    expect(html).not.toContain("УБ, Баянгол дүүрэг");
  });
});

describe("sendOrderConfirmationEmail", () => {
  const supabase = {} as never;

  it("sends via the SMTP infra and never throws on success", async () => {
    sendEmailMock.mockResolvedValue({ success: true });
    await expect(
      sendOrderConfirmationEmail(supabase, baseParams),
    ).resolves.toBeUndefined();
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const call = sendEmailMock.mock.calls[0];
    expect(call[0]).toBe(supabase);
    expect(call[1].to).toBe("buyer@example.mn");
    expect(call[1].subject).toContain("11111111");
  });

  it("swallows a failed send (no SMTP config) without throwing", async () => {
    sendEmailMock.mockResolvedValue({
      success: false,
      error: "Идэвхтэй SMTP тохиргоо олдсонгүй.",
    });
    await expect(
      sendOrderConfirmationEmail(supabase, baseParams),
    ).resolves.toBeUndefined();
  });

  it("swallows a thrown transport error without throwing", async () => {
    sendEmailMock.mockRejectedValue(new Error("ECONNREFUSED"));
    await expect(
      sendOrderConfirmationEmail(supabase, baseParams),
    ).resolves.toBeUndefined();
  });
});
