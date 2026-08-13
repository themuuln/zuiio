import "server-only";

import { capture } from "@zuiio/capture";

/**
 * BNPL (buy-now-pay-later) provider abstraction (prepared; activates when
 * credentials exist).
 *
 * Environment contract (all optional today):
 *   BNPL_PROVIDER   — 'storepay' | 'lenddy'
 *   BNPL_API_KEY    — partner API key
 *   BNPL_BASE_URL   — partner base URL (defaults per provider)
 *
 * MN providers verified 2026-08-13:
 *   StorePay — storepay.mn; 100k–10M₮, 30–75 days, 10+ installment
 *              options, 8,000+ partner stores, digital onboarding.
 *   LendMN LendDy — lend.mn; 1k–50M₮, 30/60 days, 0% interest, no fees;
 *              merchant sends a payment request via the LendMN app.
 *
 * Integration flow (once wired):
 *   1. Buyer picks "Хугацаатай төлбөр" at checkout (only shown when
 *      isBnplConfigured()).
 *   2. Order submits with payment_method='bnpl'; a sale_payments row
 *      (gateway='bnpl', status='pending') is created.
 *   3. createCheckoutSession() returns the partner redirect URL / app
 *      deep-link; buyer completes financing there.
 *   4. Partner callback → confirm_online_payment() flips the order.
 */

export type BnplProvider = "storepay" | "lenddy";

export type BnplCheckoutSession = {
  /** Redirect the buyer to this URL (web app or deep link). */
  redirectUrl: string;
  /** Partner-side session reference (recorded in sale_payments.gateway_ref). */
  sessionRef: string;
};

/** True when a BNPL provider + key are configured. */
export function isBnplConfigured(): boolean {
  return Boolean(process.env.BNPL_PROVIDER && process.env.BNPL_API_KEY);
}

export function getBnplProvider(): BnplProvider | null {
  const provider = process.env.BNPL_PROVIDER;
  if (provider === "storepay" || provider === "lenddy") return provider;
  return null;
}

/**
 * Create a partner checkout session for an order.
 *
 * NOTE: provider HTTP contracts arrive with the API keys (the user is
 * obtaining them). The function below is the sealed contract; fill in the
 * exact request/response shapes when the partner docs land. Until then it
 * throws a clear "not configured" error so nothing silently no-ops.
 */
export async function createBnplCheckoutSession(params: {
  orderId: string;
  amount: number;
  customerPhone: string;
  customerName: string;
  returnUrl: string;
}): Promise<BnplCheckoutSession> {
  if (!isBnplConfigured()) {
    throw new Error("BNPL тохиргоогүй байна");
  }
  const provider = getBnplProvider();
  const baseUrl = process.env.BNPL_BASE_URL;
  if (!provider || !baseUrl) {
    throw new Error("BNPL provider / base URL тохиргоогүй байна");
  }

  try {
    const res = await fetch(`${baseUrl}/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BNPL_API_KEY ?? ""}`,
      },
      body: JSON.stringify({
        order_id: params.orderId,
        amount: params.amount,
        customer_phone: params.customerPhone,
        customer_name: params.customerName,
        return_url: params.returnUrl,
      }),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as {
      redirect_url?: string;
      session_id?: string;
    } | null;
    if (!res.ok || !json?.redirect_url || !json.session_id) {
      throw new Error(`BNPL checkout failed: ${res.status}`);
    }
    return { redirectUrl: json.redirect_url, sessionRef: json.session_id };
  } catch (err) {
    capture(err, { context: "bnpl: createCheckoutSession" });
    throw err;
  }
}
