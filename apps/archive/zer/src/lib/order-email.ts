/**
 * Buyer order-confirmation email (storefront checkout, R9).
 *
 * Reuses the SMTP infra in src/lib/email.ts (sendEmail auto-selects the
 * active SMTP config). The send is fire-and-forget from the checkout seam:
 * it is wrapped in try/catch + capture() and can NEVER fail or roll back
 * the order.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { capture } from "@zuiio/capture";
import { sendEmail } from "@/lib/email";
import type { Database } from "@/lib/supabase/types";
import { escapeHtml } from "@/lib/validation";

export interface OrderConfirmationParams {
  to: string;
  orgName: string;
  orderId: string;
  totalAmount: number;
  paymentMethod: string | null;
  deliveryType: string | null;
  deliveryAddress: string | null;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Бэлэн",
  card: "Карт",
  qpay: "QPay / банкны шилжүүлэг",
  bank_transfer: "Банкны шилжүүлэг",
};

const DELIVERY_LABELS: Record<string, string> = {
  delivery: "Хүргэлт",
  pickup: "Дэлгүүрээс авах",
};

/** Build the Mongolian confirmation email body (inline-styled HTML). */
export function buildOrderConfirmationHtml(p: OrderConfirmationParams): string {
  const paymentLabel =
    PAYMENT_LABELS[p.paymentMethod ?? ""] ?? p.paymentMethod ?? "—";
  const deliveryLabel =
    DELIVERY_LABELS[p.deliveryType ?? ""] ?? p.deliveryType ?? "—";
  const addressBlock = p.deliveryAddress
    ? `<p style="margin:0;color:#374151;">${escapeHtml(p.deliveryAddress)}</p>`
    : '<p style="margin:0;color:#374151;">—</p>';
  const total = new Intl.NumberFormat("mn-MN", {
    maximumFractionDigits: 0,
  }).format(Math.round(p.totalAmount));

  return `
<!DOCTYPE html>
<html lang="mn">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table align="center" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin:0 auto;background-color:#ffffff;">
    <tr>
      <td style="padding:32px 24px 16px;text-align:center;background:linear-gradient(135deg,#2563eb,#1d4ed8);">
        <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">${escapeHtml(p.orgName)}</h1>
        <p style="margin:8px 0 0;font-size:14px;color:#bfdbfe;">Захиалга баталгаажлаа</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <p style="margin:0 0 16px;font-size:15px;color:#1f2937;">
          Сайн байна уу, таны захиалга хүлээн авлаа.
        </p>
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#6b7280;">Захиалгын дугаар</td>
            <td style="padding:8px 0;font-size:13px;color:#1f2937;text-align:right;font-weight:600;">${escapeHtml(p.orderId.slice(0, 8))}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;">Нийт дүн</td>
            <td style="padding:8px 0;font-size:13px;color:#1f2937;text-align:right;font-weight:600;border-top:1px solid #e5e7eb;">${total} ₮</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;">Төлбөрийн хэлбэр</td>
            <td style="padding:8px 0;font-size:13px;color:#1f2937;text-align:right;border-top:1px solid #e5e7eb;">${escapeHtml(paymentLabel)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;">Хүлээн авах хэлбэр</td>
            <td style="padding:8px 0;font-size:13px;color:#1f2937;text-align:right;border-top:1px solid #e5e7eb;">${escapeHtml(deliveryLabel)}</td>
          </tr>
          ${
            p.deliveryType === "delivery"
              ? `<tr>
            <td style="padding:8px 0;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;">Хүргэлтийн хаяг</td>
            <td style="padding:8px 0;font-size:13px;color:#1f2937;text-align:right;border-top:1px solid #e5e7eb;">${addressBlock}</td>
          </tr>`
              : ""
          }
        </table>
        <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">
          Манай баг таны захиалгыг баталгаажуулж, холбогдох болно. Төлбөрийг
          хүлээн авсны дараа захиалга гүйцэтгэгдэнэ.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send the buyer confirmation email. Never throws: any failure (no SMTP
 * config, transport error, …) is captured and swallowed so the caller's
 * order flow is unaffected.
 */
export async function sendOrderConfirmationEmail(
  supabase: SupabaseClient<Database>,
  p: OrderConfirmationParams,
): Promise<void> {
  try {
    const html = buildOrderConfirmationHtml(p);
    const result = await sendEmail(supabase, {
      to: p.to,
      subject: `Захиалга баталгаажлаа — ${p.orderId.slice(0, 8)}`,
      html,
    });
    if (!result.success) {
      capture(new Error(result.error ?? "И-мэйл илгээхэд алдаа гарлаа"), {
        context: "order-email: sendOrderConfirmationEmail",
      });
    }
  } catch (err) {
    capture(err, {
      context: "order-email: sendOrderConfirmationEmail",
    });
  }
}
