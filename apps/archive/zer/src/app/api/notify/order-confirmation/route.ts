import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { sendOrderStatusSms } from "@/lib/notifications/sms";
import { sendOrderConfirmationEmail } from "@/lib/order-email";
import { createServiceClient } from "@/lib/supabase/server-service";

/**
 * POST /api/notify/order-confirmation
 *
 * Fired by the sales AFTER INSERT trigger (trg_sale_notify_online_order)
 * for every online order — web server action, mobile RPC, and any future
 * client all land here, so the confirmation email has exactly one path.
 *
 * Deduped via order_notifications (unique order_id + channel): a replayed
 * trigger / retried pg_net delivery can never double-send.
 */
export async function POST(request: Request) {
  let body: { order_id?: unknown };
  try {
    body = (await request.json()) as { order_id?: unknown };
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid body" },
      { status: 400 },
    );
  }

  const orderId = typeof body.order_id === "string" ? body.order_id.trim() : "";
  if (!orderId) {
    return NextResponse.json(
      { ok: false, error: "order_id required" },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  // Dedupe first: only the first request for this (order, channel) sends.
  const { error: dedupeError } = await supabase
    .from("order_notifications")
    .insert({
      order_id: orderId,
      channel: "email",
      status: "sent",
    });
  if (dedupeError) {
    // 23505 = unique violation → already notified. Treat as success.
    if (dedupeError.code === "23505") {
      return NextResponse.json({ ok: true, skipped: "already_notified" });
    }
    capture(dedupeError, { context: "notify/order-confirmation: dedupe" });
    return NextResponse.json(
      { ok: false, error: "dedupe failed" },
      { status: 500 },
    );
  }

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .select(
      "id, total_amount, payment_method, delivery_type, delivery_address, contact_email, organization:organizations(name), contact:contacts(phone)",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (saleError || !sale) {
    capture(saleError ?? new Error("sale not found"), {
      context: "notify/order-confirmation: sale",
    });
    await supabase
      .from("order_notifications")
      .update({ status: "failed", error: "sale not found" })
      .eq("order_id", orderId)
      .eq("channel", "email");
    return NextResponse.json(
      { ok: false, error: "sale not found" },
      { status: 404 },
    );
  }

  const email = sale.contact_email;
  if (email) {
    await sendOrderConfirmationEmail(supabase, {
      to: email,
      orgName: sale.organization?.name ?? "Дэлгүүр",
      orderId: sale.id,
      totalAmount: Number(sale.total_amount ?? 0),
      paymentMethod: sale.payment_method ?? "cash",
      deliveryType: sale.delivery_type ?? "pickup",
      deliveryAddress: sale.delivery_address ?? null,
    });
  }

  // G-SMS: order confirmation SMS when a provider is configured.
  const phone = sale.contact?.phone;
  if (phone) {
    await sendOrderStatusSms({
      to: phone,
      orderNumber: sale.id.slice(0, 8),
      status: "pending",
    });
  }

  return NextResponse.json({ ok: true });
}
