import { type NextRequest, NextResponse } from "next/server";
import { sendExpiryReminderEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  EsimRow,
  OrderItemRow,
  OrderRow,
  PackageRow,
} from "@/lib/supabase/types";

/**
 * Cron (every ~12 h): sends expiry-reminder emails for eSIMs whose
 * validity expires within 24 hours. Protected by CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const client = createAdminClient();
  const now = new Date();
  const horizon24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // 1. Find activated eSIMs with delivered status
  const { data: esimRows, error: esimError } = await client
    .from("esims")
    .select("*")
    .eq("status", "delivered")
    .not("activated_at", "is", null);

  if (esimError) {
    console.error("send-reminders: esim query failed", esimError);
    return NextResponse.json(
      { ok: false, error: esimError.message },
      { status: 500 },
    );
  }

  const esims = (esimRows ?? []) as EsimRow[];
  if (esims.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  // 2. Batch-fetch related entities
  const orderIds = [...new Set(esims.map((e) => e.order_id))];
  const orderItemIds = [...new Set(esims.map((e) => e.order_item_id))];

  const [ordersRes, itemsRes] = await Promise.all([
    client.from("orders").select("*").in("id", orderIds),
    client.from("order_items").select("*").in("id", orderItemIds),
  ]);

  if (ordersRes.error || itemsRes.error) {
    console.error(
      "send-reminders: related query failed",
      ordersRes.error ?? itemsRes.error,
    );
    return NextResponse.json(
      { ok: false, error: ordersRes.error?.message ?? itemsRes.error?.message },
      { status: 500 },
    );
  }

  const ordersById = new Map<string, OrderRow>(
    ((ordersRes.data ?? []) as OrderRow[]).map((o) => [o.id, o]),
  );
  const itemsById = new Map<string, OrderItemRow>(
    ((itemsRes.data ?? []) as OrderItemRow[]).map((i) => [i.id, i]),
  );

  // 3. Fetch packages for validity_days
  const packageIds = [
    ...new Set((itemsRes.data as OrderItemRow[]).map((i) => i.package_id)),
  ];
  const packagesRes = await client
    .from("packages")
    .select("*")
    .in("id", packageIds);

  const packagesById = new Map<string, PackageRow>(
    ((packagesRes.data ?? []) as PackageRow[]).map((p) => [p.id, p]),
  );

  // 4. Filter eSIMs expiring within 24 h and send reminders
  let sent = 0;

  for (const esim of esims) {
    const order = ordersById.get(esim.order_id);
    const item = itemsById.get(esim.order_item_id);
    if (!order || !item) continue;

    const pkg = packagesById.get(item.package_id);
    if (!pkg) continue;

    const activatedAt = new Date(esim.activated_at as string);
    const expiresAt = new Date(
      activatedAt.getTime() + pkg.validity_days * 24 * 60 * 60 * 1000,
    );

    // Already expired or more than 24 h away — skip
    if (expiresAt <= now || expiresAt > horizon24h) continue;

    const daysRemaining = Math.ceil(
      (expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
    );

    await sendExpiryReminderEmail(
      order,
      esim,
      item.package_name,
      daysRemaining,
    );
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
