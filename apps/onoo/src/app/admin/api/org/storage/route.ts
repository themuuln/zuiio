/**
 * GET /admin/api/org/storage?org_id=... — list storage buckets for org
 * POST /admin/api/org/storage — create storage bucket entry
 * DELETE /admin/api/org/storage — remove storage bucket
 */
import { withAuth } from "@/lib/supabase/admin-route";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** GET /admin/api/org/storage?org_id=... */
export async function GET(request: NextRequest) {
  return withAuth(async (supabase) => {
    const { searchParams } = request.nextUrl;
    const orgId = searchParams.get("org_id");

    if (!orgId) {
      return NextResponse.json({ error: "org_id parameter is required" }, { status: 400 }) as never;
    }

    const { data, error } = await supabase
      .from("org_storage_buckets")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 }) as never;
    }

    return NextResponse.json(data);
  });
}

/** POST /admin/api/org/storage */
export async function POST(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();
    const { organization_id, bucket_name, bucket_id, is_tenant_isolation } = body;

    if (!organization_id || !bucket_name || !bucket_id) {
      return NextResponse.json(
        { error: "organization_id, bucket_name, and bucket_id are required" },
        { status: 400 },
      ) as never;
    }

    const { data, error } = await supabase
      .from("org_storage_buckets")
      .insert({
        organization_id,
        bucket_name,
        bucket_id,
        is_tenant_isolation: is_tenant_isolation ?? true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 }) as never;
    }

    return NextResponse.json(data);
  });
}

/** DELETE /admin/api/org/storage */
export async function DELETE(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 }) as never;
    }

    const { error } = await supabase
      .from("org_storage_buckets")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 }) as never;
    }

    return NextResponse.json({ success: true } as never);
  });
}
