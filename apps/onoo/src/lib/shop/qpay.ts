import "server-only";

/**
 * QPay payment adapter — plain fetch, no qpay-js dependency.
 *
 * Caches the OAuth access token in a module variable with expiry so multiple
 * invoice creations within the same process reuse the same token without
 * re-authenticating.
 *
 * When QPay environment variables (QPAY_CLIENT_ID, QPAY_CLIENT_SECRET) are
 * not configured, the adapter runs in **mock mode** — it returns realistic
 * fake data so the full payment flow can be developed and tested without a
 * QPay merchant account. Mock invoices auto-confirm after ~20 seconds.
 *
 * All mutations (invoice creation, payment confirmation) happen through the
 * server-owner database commands — this adapter only communicates with the
 * QPay merchant API.
 */

// ── Types ───────────────────────────────────────────────────────────

export interface QPayConfig {
  clientId: string;
  clientSecret: string;
  invoiceCode: string;
  baseUrl: string;
}

export interface QPayInvoice {
  invoiceId: string;
  qrText: string;
  qrImage: string;
  expiresIn: number;
  merchantInvoiceId: string;
  amount: number;
  currency: string;
}

export interface QPayPaymentStatus {
  status: string;
  paidAmount: number;
  currency: string;
  invoiceId: string;
}

// ── Error class ──────────────────────────────────────────────────────

export class QPayError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "QPayError";
    this.code = code;
  }
}

// ── Mock mode ────────────────────────────────────────────────────────

/** Check if QPay credentials are configured. If not, run in mock mode. */
export function isMockMode(): boolean {
  return !process.env.QPAY_CLIENT_ID || !process.env.QPAY_CLIENT_SECRET;
}

/** In-memory mock invoice statuses: invoiceId -> UNPAID | PAID | EXPIRED. */
const mockInvoiceStatuses = new Map<string, string>();

/** Register a mock invoice and auto-confirm after ~20 seconds. */
function createMockInvoice(): string {
  const id = `MOCK-INV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  mockInvoiceStatuses.set(id, "UNPAID");
  setTimeout(() => {
    if (mockInvoiceStatuses.get(id) === "UNPAID") {
      mockInvoiceStatuses.set(id, "PAID");
    }
  }, 20_000);
  return id;
}

/** Confirm a mock payment immediately (callback route or tests). */
export function confirmMockPayment(invoiceId: string): boolean {
  if (!mockInvoiceStatuses.has(invoiceId)) return false;
  mockInvoiceStatuses.set(invoiceId, "PAID");
  return true;
}

/** Reset mock state (for tests). */
export function resetMockState(): void {
  mockInvoiceStatuses.clear();
}

// ── Configuration ───────────────────────────────────────────────────

export function getQPayConfig(): QPayConfig {
  return {
    clientId: process.env.QPAY_CLIENT_ID ?? "",
    clientSecret: process.env.QPAY_CLIENT_SECRET ?? "",
    baseUrl: process.env.QPAY_BASE_URL || "https://merchant-sandbox.qpay.mn",
    invoiceCode: process.env.QPAY_INVOICE_CODE ?? "",
  };
}

// ── Token cache ─────────────────────────────────────────────────────

interface CachedToken {
  token: string;
  expiresAt: number; // epoch ms
}

let tokenCache: CachedToken | null = null;

function isTokenExpired(): boolean {
  if (!tokenCache) return true;
  // Refresh 30 seconds before actual expiry to avoid edge races
  return Date.now() >= tokenCache.expiresAt - 30_000;
}

// ── HTTP helpers ────────────────────────────────────────────────────

async function qpayFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    let detail: string;
    try {
      const json = JSON.parse(body);
      detail = json.message ?? json.error ?? json.detail ?? body;
    } catch {
      detail = body;
    }
    throw new QPayError(
      `HTTP_${response.status}`,
      `QPay request failed (${response.status}): ${detail}`,
    );
  }

  return response;
}

// ── Access token ────────────────────────────────────────────────────

export async function getAccessToken(config: QPayConfig): Promise<string> {
  // Mock mode: return fake token
  if (!config.clientId || !config.clientSecret) {
    return "mock-access-token";
  }

  if (!isTokenExpired() && tokenCache) {
    return tokenCache.token;
  }

  const credentials = btoa(`${config.clientId}:${config.clientSecret}`);

  const response = await fetch(`${config.baseUrl}/auth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new QPayError(
      `AUTH_${response.status}`,
      `QPay auth failed (${response.status}): ${body}`,
    );
  }

  const data = await response.json();
  const accessToken = data.access_token as string;
  const expiresIn = (data.expires_in as number) ?? 3600;

  if (!accessToken) {
    throw new QPayError(
      "AUTH_NO_TOKEN",
      "QPay auth response missing access_token",
    );
  }

  tokenCache = {
    token: accessToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };

  return tokenCache.token;
}

// ── Create invoice ──────────────────────────────────────────────────

export async function createInvoice(
  config: QPayConfig,
  params: {
    amount: number;
    merchantInvoiceId: string;
    callbackUrl: string;
  },
): Promise<QPayInvoice> {
  // Mock mode: return realistic fake data
  if (!config.clientId || !config.clientSecret) {
    const mockId = createMockInvoice();
    return {
      invoiceId: mockId,
      qrText: `qpay://mock/${mockId}`,
      qrImage: "",
      expiresIn: 300,
      merchantInvoiceId: params.merchantInvoiceId,
      amount: params.amount,
      currency: "MNT",
    };
  }

  const token = await getAccessToken(config);

  const response = await qpayFetch(`${config.baseUrl}/invoice`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      invoice_code: config.invoiceCode,
      sender_invoice_no: params.merchantInvoiceId,
      invoice_receiver_code: params.merchantInvoiceId,
      amount: params.amount,
      callback_url: params.callbackUrl,
    }),
  });

  const data = await response.json();

  return {
    invoiceId: data.invoice_id ?? "",
    qrText: data.qr_text ?? data.qrText ?? data.qPayShortUrl ?? "",
    qrImage: data.qr_image ?? data.qrImage ?? "",
    expiresIn: data.expires_in ?? data.expiresIn ?? 300,
    merchantInvoiceId: data.merchant_invoice_id ?? params.merchantInvoiceId,
    amount: data.amount ?? params.amount,
    currency: data.currency ?? "MNT",
  };
}

// ── Check payment status ────────────────────────────────────────────

export async function checkPayment(
  config: QPayConfig,
  invoiceId: string,
): Promise<QPayPaymentStatus> {
  // Mock mode: return status from in-memory tracking
  if (invoiceId.startsWith("MOCK-INV-")) {
    const status = mockInvoiceStatuses.get(invoiceId) ?? "UNPAID";
    return {
      status,
      paidAmount: status === "PAID" ? 50000 : 0,
      currency: "MNT",
      invoiceId,
    };
  }

  if (!config.clientId || !config.clientSecret) {
    return {
      status: "UNPAID",
      paidAmount: 0,
      currency: "MNT",
      invoiceId,
    };
  }

  const token = await getAccessToken(config);

  const response = await qpayFetch(`${config.baseUrl}/payment/check`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      object_type: "INVOICE",
      object_id: invoiceId,
      offset: {
        page_number: 1,
        page_limit: 100,
      },
    }),
  });

  const data = await response.json();

  // QPay returns { count, paid_amount, rows, ... }
  // statuses are typically "PAID", "UNPAID", "CANCELLED", "EXPIRED"
  const isPaid = data.count > 0;
  const rows = data.rows ?? [];
  const firstRow = rows[0] as Record<string, unknown> | undefined;

  return {
    status: isPaid ? ((firstRow?.status as string) ?? "PAID") : "UNPAID",
    paidAmount: data.paid_amount ?? data.paidAmount ?? 0,
    currency: data.currency ?? "MNT",
    invoiceId: data.invoice_id ?? data.invoiceId ?? invoiceId,
  };
}
