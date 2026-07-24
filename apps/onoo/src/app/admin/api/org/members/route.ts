/**
 * GET /admin/api/org/members — list members for a scope
 * POST /admin/api/org/members — assign a role to a user
 * DELETE /admin/api/org/members — remove a role
 */
import { withAuth } from "@/lib/supabase/admin-route";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** GET /admin/api/org/members?scope_type=org&scope_id=... */
export async function GET(request: NextRequest) {
  return withAuth(async (supabase) => {
    const { searchParams } = request.nextUrl;
    const scopeType = searchParams.get("scope_type") ?? "org";
    const scopeId = searchParams.get("scope_id");

    if (!scopeId) {
      return NextResponse.json({ error: "scope_id is required" }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("cmd_list_members", {
      p_scope_type: scopeType,
      p_scope_id: scopeId,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(data);
  });
}

/** POST /admin/api/org/members */
export async function POST(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();
    const { user_id, scope_type, scope_id, role } = body;

    if (!user_id || !scope_type || !scope_id || !role) {
      return NextResponse.json(
        { error: "user_id, scope_type, scope_id, and role are required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase.rpc("cmd_assign_role", {
      p_user_id: user_id,
      p_scope_type: scope_type,
      p_scope_id: scope_id,
      p_role: role,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(data);
  });
}

/** DELETE /admin/api/org/members */
export async function DELETE(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();
    const { membership_id } = body;

    if (!membership_id) {
      return NextResponse.json(
        { error: "membership_id is required" },
        { status: 400 },
      );
    }

    const { error } = await supabase.rpc("cmd_remove_role", {
      p_membership_id: membership_id,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json({ success: true } as never);
  });
}
