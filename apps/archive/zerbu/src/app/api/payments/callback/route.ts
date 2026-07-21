import { createClient } from "@/lib/supabase/server";
import { checkPaymentStatus } from "@/lib/payment-service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const invoiceId = searchParams.get("invoice_id");
  const userId = searchParams.get("user_id");
  const coupleId = searchParams.get("couple_id");
  const plan = searchParams.get("plan");

  if (!invoiceId || !userId || !coupleId || !plan) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const result = await checkPaymentStatus(invoiceId);

  if (result.paid) {
    const supabase = await createClient();
    const expiresAt = calculateExpiry(plan);

    await supabase.from("couples").update({
      relationship_stage: "premium",
    }).eq("id", coupleId);

    return NextResponse.json({
      success: true,
      message: `Төлбөр амжилттай. ${plan} төлөвлөгөө идэвхжлээ.`,
      expiresAt,
    });
  }

  return NextResponse.json({
    success: false,
    message: "Төлбөр төлөгдөөгүй байна.",
  });
}

function calculateExpiry(plan: string): string {
  const now = new Date();
  switch (plan) {
    case "monthly":
      return new Date(now.setMonth(now.getMonth() + 1)).toISOString();
    case "annual":
      return new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
    case "lifetime":
      return new Date("2099-12-31").toISOString();
    default:
      return new Date(now.setMonth(now.getMonth() + 1)).toISOString();
  }
}
