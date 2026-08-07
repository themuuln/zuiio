/**
 * GET /admin/api/org/consent?org_id=... — list consent policies for org
 * POST /admin/api/org/consent — create policy
 * PUT /admin/api/org/consent?id=... — update policy
 * DELETE /admin/api/org/consent — delete policy
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/admin-route";

/** GET /admin/api/org/consent?org_id=... */
export async function GET(request: NextRequest) {
  return withAuth(async (supabase) => {
    const { searchParams } = request.nextUrl;
    const orgId = searchParams.get("org_id");

    if (!orgId) {
      return NextResponse.json(
        { error: "org_id parameter is required" },
        { status: 400 },
      ) as never;
    }

    const { data, error } = await supabase
      .from("consent_policies")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      ) as never;
    }

    return NextResponse.json(data);
  });
}

/** POST /admin/api/org/consent */
export async function POST(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();
    const {
      organization_id,
      title,
      description,
      retention_days,
      data_categories,
      is_active,
    } = body;

    if (!organization_id || !title) {
      return NextResponse.json(
        { error: "organization_id and title are required" },
        { status: 400 },
      ) as never;
    }

    const { data, error } = await supabase
      .from("consent_policies")
      .insert({
        organization_id,
        title,
        description: description ?? null,
        retention_days: retention_days ?? 365,
        data_categories: data_categories ?? [],
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      ) as never;
    }

    return NextResponse.json(data);
  });
}

/** PUT /admin/api/org/consent?id=... */
export async function PUT(request: NextRequest) {
  return withAuth(async (supabase) => {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id query parameter is required" },
        { status: 400 },
      ) as never;
    }

    const body = await request.json();
    const { title, description, retention_days, data_categories, is_active } =
      body;

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (retention_days !== undefined) updates.retention_days = retention_days;
    if (data_categories !== undefined)
      updates.data_categories = data_categories;
    if (is_active !== undefined) updates.is_active = is_active;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("consent_policies")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      ) as never;
    }

    return NextResponse.json(data);
  });
}

/** DELETE /admin/api/org/consent */
export async function DELETE(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 },
      ) as never;
    }

    const { error } = await supabase
      .from("consent_policies")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      ) as never;
    }

    return NextResponse.json({ success: true } as never);
  });
}
