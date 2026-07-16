import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/webhooks
 * List webhook subscriptions for the current user's products.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  const admin = await createAdminClient();

  const { data } = await admin
    .from("webhook_subscriptions")
    .select("*, product_catalog(display_name)")
    .order("created_at", { ascending: false });

  return NextResponse.json({ subscriptions: data ?? [] });
}

/**
 * POST /api/admin/webhooks
 * Create a new webhook subscription.
 * Body: { product_id: string, url: string, events?: string[] }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { product_id, url, events } = body;

  if (!product_id || !url) {
    return NextResponse.json(
      { error: "product_id болон url шаардлагатай." },
      { status: 400 },
    );
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Буруу URL." }, { status: 400 });
  }

  const admin = await createAdminClient();

  const { data, error } = await admin
    .from("webhook_subscriptions")
    .insert({
      product_id,
      url,
      events: events ?? [],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ subscription: data }, { status: 201 });
}
