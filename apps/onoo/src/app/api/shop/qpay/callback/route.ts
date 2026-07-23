import { type NextRequest, NextResponse } from "next/server";
import {
  checkPayment,
  confirmMockPayment,
  getQPayConfig,
  isMockMode,
} from "@/lib/shop/qpay";
import { createClient } from "@/lib/supabase/server";

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

    // Mock mode: confirm immediately
    if (isMockMode()) {
      confirmMockPayment(invoiceId);

      const { data, error } = await supabase.rpc("cmd_confirm_shop_payment", {
        p_qpay_invoice_id: invoiceId,
      });

      if (error && !error.message?.includes("not found")) {
        console.error("Payment confirmation error:", error);
      }

      return NextResponse.json({ status: "paid", data: data ?? null });
    }

    // Live mode: verify payment with QPay API first
    const config = getQPayConfig();
    const paymentStatus = await checkPayment(config, invoiceId);

    if (paymentStatus.status !== "PAID") {
      return NextResponse.json(
        { error: `Payment not completed, status: ${paymentStatus.status}` },
        { status: 402 },
      );
    }

    const { data, error } = await supabase.rpc("cmd_confirm_shop_payment", {
      p_qpay_invoice_id: invoiceId,
    });

    if (error) {
      console.error("Payment confirmation error:", error);
      return NextResponse.json(
        { error: "Payment confirmation failed" },
        { status: 422 },
      );
    }

    return NextResponse.json({ status: "paid", data });
  } catch (err) {
    console.error("QPay callback error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
