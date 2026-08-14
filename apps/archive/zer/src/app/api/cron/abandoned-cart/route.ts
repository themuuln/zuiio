import { capture } from "@zuiio/capture";
import { connection, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { createServiceClient } from "@/lib/supabase/server-service";

const STALE_AFTER_HOURS = 2;

/**
 * GET /api/cron/abandoned-cart
 *
 * G-ABANDONED: called by pg_cron (abandoned-cart-recovery, every 30 min)
 * via net.http_post. Finds carts that:
 *   - have a contact_email (the buyer shared it at checkout),
 *   - were last updated > 2h ago (enough time to have completed an order),
 *   - have NOT been emailed yet (abandoned_cart_emails dedupe).
 * Sends a recovery email with a link back to the cart, then marks the
 * cart emailed. Emails are fire-and-forget; a failure never breaks the
 * cron run.
 */
export async function GET() {
  await connection();
  const supabase = createServiceClient();
  // the migration is applied + types regenerate; untyped client until then.
  const cutoff = new Date(
    Date.now() - STALE_AFTER_HOURS * 3_600_000,
  ).toISOString();

  const { data: carts, error } = await supabase
    .from("abandoned_carts")
    .select(
      "id, subtotal, currency, contact_email, organization:organizations(name, slug)",
    )
    .not("contact_email", "is", null)
    .lt("updated_at", cutoff)
    .limit(50);

  if (error) {
    capture(error, { context: "cron/abandoned-cart: scan" });
    return NextResponse.json(
      { ok: false, error: "scan failed" },
      { status: 500 },
    );
  }

  let sent = 0;
  for (const cart of carts ?? []) {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://zer.zuiiotech.com";
    const org = Array.isArray(cart.organization)
      ? (cart.organization[0] ?? null)
      : cart.organization;
    const cartUrl = `${siteUrl}/${org?.slug ?? ""}/cart`;
    const orgName = org?.name ?? "Дэлгүүр";

    // Dedupe: only the first email per cart.
    const { error: dedupeError } = await supabase
      .from("abandoned_cart_emails")
      .insert({ cart_id: cart.id });
    if (dedupeError) continue; // 23505 → already emailed

    const result = await sendEmail(supabase, {
      to: cart.contact_email ?? "",
      subject: `${orgName} — Таны сагс хүлээж байна`,
      html: buildRecoveryHtml(
        orgName,
        cartUrl,
        cart.subtotal ?? 0,
        cart.currency ?? "MNT",
      ),
    });
    if (!result.success) {
      capture(new Error(result.error ?? "abandoned cart email failed"), {
        context: "cron/abandoned-cart",
      });
    } else {
      sent += 1;
    }
  }

  return NextResponse.json({ ok: true, sent });
}

function buildRecoveryHtml(
  orgName: string,
  cartUrl: string,
  subtotal: number,
  currency: string,
): string {
  const formatted = `${subtotal.toLocaleString("mn-MN")} ${currency}`;
  return `<!doctype html>
<html><body style="font-family:sans-serif;line-height:1.6;color:#1f2937">
  <h2>Сайн байна уу?</h2>
  <p><strong>${escapeHtml(orgName)}</strong>-ийн дэлгүүрт таны сагсанд бараа үлдсэн байна.</p>
  <p>Сагсны дүн: <strong>${formatted}</strong></p>
  <p style="margin:24px 0">
    <a href="${escapeHtml(cartUrl)}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">
      Сагс руу буцах
    </a>
  </p>
  <p style="color:#6b7280;font-size:13px">Захиалгаа дуусгахад бид танд туслахад баяртай байх болно.</p>
</body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
