/**
 * GET /admin/api/org/break-glass?org_id=... — list active break-glass entries
 * POST /admin/api/org/break-glass — grant emergency access
 * PUT /admin/api/org/break-glass — expire an entry
 */
import { withAuth } from "@/lib/supabase/admin-route";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** GET /admin/api/org/break-glass?org_id=... */
export async function GET(request: NextRequest) {
  return withAuth(async (supabase) => {
    const { searchParams } = request.nextUrl;
    const orgId = searchParams.get("org_id");

    if (!orgId) {
      return NextResponse.json({ error: "org_id parameter is required" }, { status: 400 }) as never;
    }

    const { data, error } = await supabase
      .from("break_glass_access")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 }) as never;
    }

    return NextResponse.json(data);
  });
}

/** POST /admin/api/org/break-glass */
export async function POST(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();
    const { organization_id, granted_to, reason, expires_at } = body;

    if (!organization_id || !granted_to || !reason || !expires_at) {
      return NextResponse.json(
        { error: "organization_id, granted_to, reason, and expires_at are required" },
        { status: 400 },
      ) as never;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    const { data, error } = await supabase
      .from("break_glass_access")
      .insert({
        organization_id,
        granted_to,
        reason,
        expires_at,
        granted_by: userId,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 }) as never;
    }

    return NextResponse.json(data);
  });
}

/** PUT /admin/api/org/break-glass */
export async function PUT(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 }) as never;
    }

    const { data, error } = await supabase
      .from("break_glass_access")
      .update({ is_expired: true })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 }) as never;
    }

    return NextResponse.json(data);
  });
}
