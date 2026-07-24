import { type NextRequest, NextResponse } from "next/server";
import { settleOrderPayment } from "@/lib/orders";

/**
 * QPay payment callback. Carries only the order code; settlement
 * verifies payment state directly with QPay. Always returns 200 so
 * QPay stops retrying — polling covers any missed settlement.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ ok: false }, { status: 200 });

  try {
    const result = await settleOrderPayment(code);
    return NextResponse.json({ ok: true, status: result.status });
  } catch (error) {
    console.error("payments/callback failed", error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
