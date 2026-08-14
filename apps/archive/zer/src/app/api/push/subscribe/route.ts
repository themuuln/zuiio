import { NextResponse } from "next/server";
import { deletePushSubscription, savePushSubscription } from "@/lib/push";
import { createClient } from "@/lib/supabase/server";

/**
 * Push subscription API.
 *
 * POST   — register the caller's browser push endpoint for their org.
 * DELETE — remove the caller's subscription by endpoint.
 *
 * Auth mirrors the dashboard: createClient() + getClaims, with the org
 * derived from the user's profile.
 */

async function getAuthContext() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub ?? null;
  if (error || !userId) {
    return { supabase, userId: null, organizationId: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .maybeSingle();

  return {
    supabase,
    userId,
    organizationId: (profile?.organization_id as string | null) ?? null,
  };
}

function parseEndpointBody(body: unknown): {
  endpoint?: string;
  p256dh?: string;
  auth?: string;
} {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return {};
  }
  const record = body as Record<string, unknown>;
  return {
    endpoint: typeof record.endpoint === "string" ? record.endpoint : undefined,
    p256dh: typeof record.p256dh === "string" ? record.p256dh : undefined,
    auth: typeof record.auth === "string" ? record.auth : undefined,
  };
}

export async function POST(request: Request) {
  const { supabase, userId, organizationId } = await getAuthContext();
  if (!userId || !organizationId) {
    return NextResponse.json(
      { error: "Нэвтрэх шаардлагатай." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Хүсэлтийн биет буруу байна." },
      { status: 400 },
    );
  }

  const { endpoint, p256dh, auth } = parseEndpointBody(body);
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json(
      { error: "endpoint, p256dh, auth талбарууд шаардлагатай." },
      { status: 400 },
    );
  }

  const ok = await savePushSubscription(supabase, organizationId, userId, {
    endpoint,
    p256dh,
    auth,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  if (!ok) {
    return NextResponse.json(
      { error: "Захиалгыг хадгалахад алдаа гарлаа." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { supabase, userId } = await getAuthContext();
  if (!userId) {
    return NextResponse.json(
      { error: "Нэвтрэх шаардлагатай." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Хүсэлтийн биет буруу байна." },
      { status: 400 },
    );
  }

  const { endpoint } = parseEndpointBody(body);
  if (!endpoint) {
    return NextResponse.json(
      { error: "endpoint талбар шаардлагатай." },
      { status: 400 },
    );
  }

  const ok = await deletePushSubscription(supabase, endpoint);
  if (!ok) {
    return NextResponse.json(
      { error: "Захиалгыг устгахад алдаа гарлаа." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
