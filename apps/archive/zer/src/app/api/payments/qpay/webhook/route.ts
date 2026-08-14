import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { issueReceiptForPaidOrder } from "@/lib/ebarimt";
import { getQpayInvoice, isQpayConfigured } from "@/lib/payments/qpay";
import { createServiceClient } from "@/lib/supabase/server-service";

/**
 * POST /api/payments/qpay/webhook
 *
 * QPay merchant callback. Prepared: returns 503 until QPAY_* env vars are
 * set (the user is obtaining merchant credentials).
 *
 * Security model:
 *   - The callback payload is NOT trusted. The handler re-fetches the
 *     invoice from the QPay merchant API and only confirms payment for a
 *     PAID invoice whose amount matches the sale.
 *   - The invoice_id maps to the sale via sale_payments(gateway='qpay',
 *     gateway_ref=invoice_id) — recorded when the invoice was created at
 *     checkout (flow to be wired with credentials).
 *   - confirm_online_payment() is idempotent (unique gateway+ref), so
 *     replayed callbacks are no-ops.
 */
export async function POST(request: Request) {
  if (!isQpayConfigured()) {
    return NextResponse.json(
      { ok: false, error: "QPay тохиргоогүй байна (QPAY_* env)" },
      { status: 503 },
    );
  }

  let body: { invoice_id?: unknown };
  try {
    body = (await request.json()) as { invoice_id?: unknown };
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid body" },
      { status: 400 },
    );
  }

  const invoiceId =
    typeof body.invoice_id === "string" ? body.invoice_id.trim() : "";
  if (!invoiceId) {
    return NextResponse.json(
      { ok: false, error: "invoice_id required" },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  try {
    // Source of truth: the QPay API, not the callback.
    const invoice = await getQpayInvoice(invoiceId);
    if (invoice.status !== "PAID") {
      return NextResponse.json({ ok: true, status: invoice.status });
    }

    // Map invoice → sale via the payment record written at invoice creation.
    const { data: payment } = await supabase
      .from("sale_payments")
      .select("sale_id, amount")
      .eq("gateway", "qpay")
      .eq("gateway_ref", invoiceId)
      .maybeSingle();

    if (!payment) {
      return NextResponse.json(
        { ok: false, error: "unknown invoice" },
        { status: 404 },
      );
    }

    // Amount must match the recorded payment; never trust callback totals.
    if (Number(invoice.amount) !== Number(payment.amount)) {
      return NextResponse.json(
        { ok: false, error: "amount mismatch" },
        { status: 422 },
      );
    }

    const { data, error } = await supabase.rpc("confirm_online_payment", {
      p_sale_id: payment.sale_id,
      p_gateway: "qpay",
      p_gateway_ref: invoiceId,
      p_amount: payment.amount,
    });
    if (error) {
      capture(error, { context: "qpay webhook: confirm_online_payment" });
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    // G-EBARIMT: paid online order → issue the tax receipt (best-effort).
    await issueReceiptForPaidOrder(supabase, payment.sale_id);

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    capture(err, { context: "qpay webhook" });
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
