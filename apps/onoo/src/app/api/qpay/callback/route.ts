import { type NextRequest, NextResponse } from "next/server";
import {
  checkPayment,
  confirmMockPayment,
  getQPayConfig,
  isMockMode,
} from "@/lib/shop/qpay";
import { createClient } from "@/lib/supabase/server";

/**
 * Unified QPay callback — receives payment notifications from QPay.
 *
 * In mock mode: confirms immediately without QPay API calls.
 * In live mode: verifies payment status with QPay first.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const invoiceId = body.invoice_id ?? body.invoiceId;

    if (!invoiceId) {
      return NextResponse.json(
        { error: "invoice_id required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // ── Mock mode: confirm immediately ──────────────────────────────
    if (isMockMode()) {
      confirmMockPayment(invoiceId);

      // Try shop payment confirmation (gracefully handles non-shop invoices)
      const { data: shopData, error: shopError } = await supabase.rpc(
        "cmd_confirm_shop_payment",
        { p_qpay_invoice_id: invoiceId },
      );

      if (!shopError && shopData) {
        return NextResponse.json({ status: "paid", data: shopData });
      }

      return NextResponse.json({ status: "paid" });
    }

    // ── Live mode: verify with QPay API ─────────────────────────────
    const config = getQPayConfig();
    const paymentStatus = await checkPayment(config, invoiceId);

    if (paymentStatus.status !== "PAID") {
      return NextResponse.json(
        { error: `Payment not completed, status: ${paymentStatus.status}` },
        { status: 402 },
      );
    }

    const { data: shopData, error: shopError } = await supabase.rpc(
      "cmd_confirm_shop_payment",
      { p_qpay_invoice_id: invoiceId },
    );

    if (!shopError && shopData) {
      return NextResponse.json({ status: "paid", data: shopData });
    }

    return NextResponse.json({ status: "paid" });
  } catch (err) {
    console.error("QPay callback error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
