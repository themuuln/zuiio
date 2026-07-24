import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { settleOrderPayment } from "@/lib/orders";
import { mockMarkPaid } from "@/lib/qpay";

/**
 * Dev-only: marks a mock QPay invoice as paid, then settles.
 * Enables the full checkout→delivery flow without credentials.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not available" }, { status: 404 });
  }

  const { code } = (await request.json()) as { code?: string };
  if (!code) {
    return NextResponse.json({ error: "code required" }, { status: 400 });
  }

  const db = getDb();
  const order = await db.getOrderByCode(code);
  if (!order) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const payment = await db.getPaymentByOrderId(order.id);
  if (!payment?.invoice_id || !mockMarkPaid(payment.invoice_id)) {
    return NextResponse.json({ error: "not a mock invoice" }, { status: 400 });
  }

  const result = await settleOrderPayment(code);
  return NextResponse.json({ ok: true, status: result.status });
}
