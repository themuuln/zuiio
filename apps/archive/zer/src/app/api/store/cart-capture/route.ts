import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server-service";

/**
 * POST /api/store/cart-capture
 *
 * G-ABANDONED: the storefront cart page reports its (anonymous) cart
 * contents here — debounced, on change — so the abandoned-cart cron can
 * email a recovery link when a buyer who shared an email never ordered.
 *
 * Idempotent upsert keyed on (organization_id, session_id): a client can
 * re-post freely; the last write wins.
 */
export async function POST(request: Request) {
  let body: {
    slug?: unknown;
    session_id?: unknown;
    items?: unknown;
    contact_email?: unknown;
    contact_name?: unknown;
    contact_phone?: unknown;
    subtotal?: unknown;
    currency?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid body" },
      { status: 400 },
    );
  }

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const sessionId =
    typeof body.session_id === "string" ? body.session_id.trim() : "";
  if (!slug || !sessionId || !Array.isArray(body.items)) {
    return NextResponse.json(
      { ok: false, error: "slug, session_id, items required" },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) {
    return NextResponse.json(
      { ok: false, error: "unknown store" },
      { status: 404 },
    );
  }

  const { error } = await supabase.from("abandoned_carts").upsert(
    {
      organization_id: org.id,
      session_id: sessionId,
      items: body.items,
      contact_email:
        typeof body.contact_email === "string" && body.contact_email.trim()
          ? body.contact_email.trim()
          : null,
      contact_name:
        typeof body.contact_name === "string" && body.contact_name.trim()
          ? body.contact_name.trim()
          : null,
      contact_phone:
        typeof body.contact_phone === "string" && body.contact_phone.trim()
          ? body.contact_phone.trim()
          : null,
      subtotal:
        typeof body.subtotal === "number" && Number.isFinite(body.subtotal)
          ? body.subtotal
          : 0,
      currency: typeof body.currency === "string" ? body.currency : "MNT",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id, session_id" },
  );
  if (error) {
    capture(error, { context: "store/cart-capture" });
    return NextResponse.json(
      { ok: false, error: "capture failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
