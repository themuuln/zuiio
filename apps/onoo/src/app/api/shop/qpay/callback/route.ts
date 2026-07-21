import { type NextRequest, NextResponse } from "next/server";
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

    // In production, call QPay /payment/check here
    // For now, simulate confirmed payment

    const { data, error } = await supabase.rpc("cmd_confirm_shop_payment", {
      p_invoice_id: invoiceId,
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
