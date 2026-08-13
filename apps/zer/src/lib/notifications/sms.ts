import "server-only";

import { capture } from "@zuiio/capture";

/**
 * SMS sender (prepared; activates when a provider + key exist).
 *
 * Environment contract (all optional today):
 *   SMS_PROVIDER   — 'smsmn' | 'sendease' (Mongolian providers)
 *   SMS_API_KEY    — provider API key
 *   SMS_SENDER_ID  — sender label (optional, provider-dependent)
 *
 * `sendOrderStatusSms` is the integration point for buyer status-change
 * SMS (G-SMS): order confirmation + delivery status changes. Callers
 * guard with isSmsConfigured(); when not configured the call is a no-op
 * that never throws — same contract as the email helpers.
 */

export type SmsResult = { success: boolean; error?: string };

/** True when an SMS provider + key are configured. */
export function isSmsConfigured(): boolean {
  return Boolean(process.env.SMS_PROVIDER && process.env.SMS_API_KEY);
}

/**
 * Send a single SMS. Dispatches to the configured provider's HTTP API.
 * The exact endpoint/field contract arrives with the provider key; the
 * dispatcher below is the sealed seam (currently provider-agnostic POST).
 * Never throws — failures are captured and reported.
 */
export async function sendSms(to: string, text: string): Promise<SmsResult> {
  if (!isSmsConfigured()) return { success: false, error: "not_configured" };

  const baseUrl = process.env.SMS_BASE_URL;
  if (!baseUrl) {
    return { success: false, error: "no_base_url" };
  }

  try {
    const res = await fetch(`${baseUrl}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SMS_API_KEY ?? ""}`,
      },
      body: JSON.stringify({
        to,
        text,
        sender: process.env.SMS_SENDER_ID ?? undefined,
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      return { success: false, error: `http_${res.status}` };
    }
    return { success: true };
  } catch (err) {
    capture(err, { context: "sms: sendSms" });
    return { success: false, error: "error" };
  }
}

/**
 * Buyer-facing order status SMS. Best-effort: callers never await a
 * failure, and the notification is deduped upstream by the caller when
 * applicable (see order_notifications for the email path).
 */
export async function sendOrderStatusSms(params: {
  to: string;
  orderNumber: string;
  status: string;
}): Promise<SmsResult> {
  if (!isSmsConfigured()) return { success: false, error: "not_configured" };

  const statusLabel =
    {
      pending: "хүлээгдэж байна",
      completed: "баталгаажсан",
      cancelled: "цуцлагдсан",
      delivered: "хүргэгдсэн",
    }[params.status] ?? params.status;

  return sendSms(
    params.to,
    `Сайн байна уу? Таны ${params.orderNumber} дугаар захиалгын төлөв: ${statusLabel}.`,
  );
}
