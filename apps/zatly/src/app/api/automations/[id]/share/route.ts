import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { shareAutomationSchema } from "@/lib/validations";
import { getSupabaseRestContext } from "@/lib/supabaseAdmin";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const context = getSupabaseRestContext();
  if (!context) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 },
    );
  }

  const { id } = await params;
  const url = new URL(`${context.baseUrl}/shared_automations`);
  url.searchParams.set("select", "id,shared_with_email,status,created_at");
  url.searchParams.set("automation_id", `eq.${id}`);
  url.searchParams.set("order", "created_at.desc");

  const response = await fetch(url.toString(), {
    headers: context.headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json({ error: `Failed to load shares: ${text}` }, { status: 500 });
  }

  const rows = await response.json();
  return NextResponse.json({ shares: Array.isArray(rows) ? rows : [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const context = getSupabaseRestContext();
  if (!context) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 },
    );
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = shareAutomationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { email } = parsed.data;

  // Get the current user
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if already shared with this email
  const checkUrl = new URL(`${context.baseUrl}/shared_automations`);
  checkUrl.searchParams.set("automation_id", `eq.${id}`);
  checkUrl.searchParams.set("shared_with_email", `eq.${email}`);
  checkUrl.searchParams.set("select", "id");
  checkUrl.searchParams.set("limit", "1");

  const checkResponse = await fetch(checkUrl.toString(), {
    headers: context.headers,
    cache: "no-store",
  });

  if (checkResponse.ok) {
    const existing = await checkResponse.json();
    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json(
        { error: `Already shared with ${email}.` },
        { status: 409 },
      );
    }
  }

  // Create the share record
  const createUrl = new URL(`${context.baseUrl}/shared_automations`);
  createUrl.searchParams.set("select", "id,automation_id,shared_with_email,status,created_at");

  const createResponse = await fetch(createUrl.toString(), {
    method: "POST",
    headers: {
      ...context.headers,
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      automation_id: id,
      shared_by_user_id: userId,
      shared_with_email: email,
      status: "pending",
    }),
    cache: "no-store",
  });

  if (!createResponse.ok) {
    const text = await createResponse.text();
    return NextResponse.json({ error: `Failed to share automation: ${text}` }, { status: 500 });
  }

  const rows = await createResponse.json();
  const share = Array.isArray(rows) ? rows[0] : null;

  console.log(`[share] automation=${id} shared with ${email} by user ${userId}`);

  return NextResponse.json({
    success: true,
    share,
    message: `Automation shared with ${email}. They will see it in their automations list.`,
  });
}
