import "server-only";
import { QPayClient } from "qpay-js";

/**
 * QPay wrapper (adapted from apps/zerbu). Two modes:
 * - real: qpay-js against merchant API
 * - mock (QPAY_MOCK=true): in-memory invoices + /api/payments/mock-pay,
 *   so the full checkout flow works locally with zero credentials.
 *
 * Security note: the callback URL carries only the order code. Payment
 * state is ALWAYS verified via checkPayment — never from callback data.
 */

export interface CreatedInvoice {
  invoiceId: string;
  /** base64 PNG (real QPay) — mock mode returns null */
  qrImage: string | null;
  /** Text/URL to encode client-side when qrImage is absent */
  qrText: string;
  shortUrl: string | null;
}

export interface PaymentCheck {
  paid: boolean;
  paidAmount: number;
  raw: unknown;
}

function isMock(): boolean {
  return process.env.QPAY_MOCK === "true" || !process.env.QPAY_CLIENT_ID;
}

// ── mock backend ─────────────────────────────────────────────────

interface MockQpayState {
  paidInvoices: Set<string>;
  amounts: Map<string, number>;
}

function mockState(): MockQpayState {
  const holder = globalThis as Record<string, unknown>;
  const KEY = "__zim_mock_qpay__";
  if (!holder[KEY]) {
    holder[KEY] = {
      paidInvoices: new Set<string>(),
      amounts: new Map<string, number>(),
    } satisfies MockQpayState;
  }
  return holder[KEY] as MockQpayState;
}

/** Dev-only: mark a mock invoice as paid. */
export function mockMarkPaid(invoiceId: string): boolean {
  if (!isMock()) return false;
  const state = mockState();
  if (!state.amounts.has(invoiceId)) return false;
  state.paidInvoices.add(invoiceId);
  return true;
}

// ── real backend ─────────────────────────────────────────────────

function realClient(): QPayClient {
  return new QPayClient({
    baseUrl: process.env.QPAY_BASE_URL || "https://merchant-sandbox.qpay.mn",
    username: process.env.QPAY_CLIENT_ID || "",
    password: process.env.QPAY_CLIENT_SECRET || "",
    invoiceCode: process.env.QPAY_INVOICE_CODE || "",
    callbackUrl: process.env.QPAY_CALLBACK_URL || "",
  });
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

// ── public API ───────────────────────────────────────────────────

export async function createInvoice(params: {
  orderCode: string;
  amountMnt: number;
  description: string;
}): Promise<CreatedInvoice> {
  if (isMock()) {
    const invoiceId = `mock-inv-${params.orderCode}`;
    const state = mockState();
    state.amounts.set(invoiceId, params.amountMnt);
    return {
      invoiceId,
      qrImage: null,
      qrText: `zim-mock-payment:${params.orderCode}:${params.amountMnt}`,
      shortUrl: null,
    };
  }

  const callbackBase =
    process.env.QPAY_CALLBACK_URL || `${appUrl()}/api/payments/callback`;
  const invoice = await realClient().createSimpleInvoice({
    invoiceCode: process.env.QPAY_INVOICE_CODE || "",
    senderInvoiceNo: params.orderCode,
    invoiceReceiverCode: params.orderCode,
    invoiceDescription: params.description,
    amount: params.amountMnt,
    // Only the order code travels in the callback — never trusted data.
    callbackUrl: `${callbackBase}?code=${params.orderCode}`,
  });

  return {
    invoiceId: invoice.invoiceId,
    qrImage: invoice.qrImage ?? null,
    qrText: invoice.qrText ?? invoice.qPayShortUrl ?? "",
    shortUrl: invoice.qPayShortUrl ?? null,
  };
}

export async function checkPayment(invoiceId: string): Promise<PaymentCheck> {
  if (isMock()) {
    const state = mockState();
    const paid = state.paidInvoices.has(invoiceId);
    return {
      paid,
      paidAmount: paid ? (state.amounts.get(invoiceId) ?? 0) : 0,
      raw: { mock: true, paid },
    };
  }

  const result = await realClient().checkPayment({
    objectType: "INVOICE",
    objectId: invoiceId,
    offset: { pageNumber: 1, pageLimit: 10 },
  });
  return {
    paid: result.count > 0,
    paidAmount: result.paidAmount ?? 0,
    raw: result,
  };
}
