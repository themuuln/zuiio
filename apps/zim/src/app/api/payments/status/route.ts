import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { settleOrderPayment } from "@/lib/orders";
import { orderAccessToken } from "@/lib/token";

/**
 * Polled by the pay page. For pending orders this also attempts
 * settlement (covers missed callbacks). Returns the access token only
 * once paid, so the client can redirect to the delivery page.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "code required" }, { status: 400 });
  }

  const db = getDb();
  const order = await db.getOrderByCode(code);
  if (!order) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  let status = order.status;
  if (status === "pending_payment") {
    try {
      status = (await settleOrderPayment(code)).status;
    } catch (error) {
      console.error("payments/status settle failed", error);
    }
  }

  const settled = !["pending_payment", "expired", "cancelled"].includes(status);
  return NextResponse.json({
    status,
    token: settled ? orderAccessToken(code) : null,
  });
}
