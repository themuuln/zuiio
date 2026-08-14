import "server-only";

import { capture } from "@zuiio/capture";

/**
 * QPay merchant API client (prepared; activates when credentials exist).
 *
 * Environment contract (all optional today — nothing runs until configured):
 *   QPAY_MERCHANT_ID    — merchant id (client_id)
 *   QPAY_USERNAME       — API username
 *   QPAY_PASSWORD       — API password
 *   QPAY_INVOICE_CODE   — invoice code to attach (e.g. ZER_POS)
 *   QPAY_BASE_URL       — default https://merchant.qpay.mn
 *
 * Flow (once wired into checkout):
 *   1. createInvoice({ amount, description, orderId }) at order submit →
 *      returns { invoice_id, qr_text, qr_image, payment_urls }.
 *   2. The invoice_id is recorded in sale_payments(gateway='qpay',
 *      gateway_ref=invoice_id, status='pending') so the webhook can map it
 *      back to the sale without trusting the callback.
 *   3. QPay posts to /api/payments/qpay/webhook; the route re-fetches the
 *      invoice from the API (never trusts the callback body alone),
 *      matches it to the sale, and calls confirm_online_payment().
 */

export type QpayConfig = {
  merchantId: string;
  username: string;
  password: string;
  invoiceCode?: string;
  baseUrl: string;
};

export type QpayInvoice = {
  invoice_id: string;
  qr_text: string | null;
  qr_image: string | null;
  payment_urls: {
    name: string;
    description: string;
    link: string;
    logo?: string;
  }[];
  amount: number;
  status: string;
};

/** True when QPay credentials are present; the webhook route returns 503 until then. */
export function isQpayConfigured(): boolean {
  return Boolean(
    process.env.QPAY_MERCHANT_ID &&
      process.env.QPAY_USERNAME &&
      process.env.QPAY_PASSWORD,
  );
}

export function getQpayConfig(): QpayConfig {
  return {
    merchantId: process.env.QPAY_MERCHANT_ID ?? "",
    username: process.env.QPAY_USERNAME ?? "",
    password: process.env.QPAY_PASSWORD ?? "",
    invoiceCode: process.env.QPAY_INVOICE_CODE ?? undefined,
    baseUrl: process.env.QPAY_BASE_URL ?? "https://merchant.qpay.mn",
  };
}

async function qpayFetch(
  config: QpayConfig,
  path: string,
  init: RequestInit,
): Promise<Response> {
  // QPay v2 auth: POST /v2/auth/token with basic auth → bearer token,
  // cached per call (the merchant API tolerates short-lived tokens; a
  // production client should cache + refresh instead).
  const tokenRes = await fetch(`${config.baseUrl}/v2/auth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${btoa(`${config.username}:${config.password}`)}`,
    },
    body: JSON.stringify({ grant_type: "client_credentials" }),
    cache: "no-store",
  });
  if (!tokenRes.ok) {
    throw new Error(`QPay auth failed: ${tokenRes.status}`);
  }
  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  const token = tokenJson.access_token;
  if (!token) throw new Error("QPay auth returned no access_token");

  return fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
}

/**
 * Create a QPay invoice for an order. Returns the invoice id the buyer
 * pays against and the QR / deep-link URLs to show at checkout.
 */
export async function createQpayInvoice(params: {
  amount: number;
  description: string;
  orderId: string;
}): Promise<QpayInvoice> {
  const config = getQpayConfig();
  const res = await qpayFetch(config, "/v2/invoice", {
    method: "POST",
    body: JSON.stringify({
      invoice_code: config.invoiceCode ?? "ZER_POS",
      sender_invoice_no: params.orderId,
      invoice_receiver_code: "terminal",
      invoice_description: params.description.slice(0, 200),
      amount: params.amount,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/payments/qpay/webhook`,
    }),
  });
  const json = (await res.json()) as Partial<QpayInvoice> & { error?: string };
  if (!res.ok || !json.invoice_id) {
    capture(new Error(json.error ?? `QPay invoice failed: ${res.status}`), {
      context: "qpay: createInvoice",
    });
    throw new Error(json.error ?? "QPay нэхэмжлэл үүсгэхэд алдаа гарлаа");
  }
  return json as QpayInvoice;
}

/**
 * Re-fetch an invoice from QPay. The webhook handler uses this INSTEAD of
 * trusting the callback payload (status, amount) — the API is the source
 * of truth.
 */
export async function getQpayInvoice(invoiceId: string): Promise<QpayInvoice> {
  const config = getQpayConfig();
  const res = await qpayFetch(config, `/v2/invoice/${invoiceId}`, {
    method: "GET",
  });
  const json = (await res.json()) as Partial<QpayInvoice> & { error?: string };
  if (!res.ok || !json.invoice_id) {
    throw new Error(json.error ?? `QPay invoice fetch failed: ${res.status}`);
  }
  return json as QpayInvoice;
}
