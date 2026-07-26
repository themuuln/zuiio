/**
 * GET    /admin/api/academy/consent — list consent templates + records
 * POST   /admin/api/academy/consent — create consent template
 * PUT    /admin/api/academy/consent — update consent template
 * DELETE /admin/api/academy/consent — delete consent template
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/admin-route";

export async function GET() {
  return withAuth(async (supabase) => {
    const [templatesResult, recordsResult] = await Promise.all([
      supabase
        .from("academy_consent_templates")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("academy_consent_records")
        .select(
          "*, academy_consent_templates(title), academy_students(canonical_name)",
        )
        .order("signed_at", { ascending: false }),
    ]);

    if (templatesResult.error)
      return NextResponse.json(
        { error: templatesResult.error.message },
        { status: 500 },
      );
    if (recordsResult.error)
      return NextResponse.json(
        { error: recordsResult.error.message },
        { status: 500 },
      );

    return NextResponse.json({
      templates: templatesResult.data,
      records: recordsResult.data,
    }) as never;
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();

    const { data, error } = await supabase
      .from("academy_consent_templates")
      .insert({
        academy_id: body.academy_id,
        title: body.title,
        body: body.body,
        scope: body.scope,
      })
      .select()
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data) as never;
  });
}

export async function PUT(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.body !== undefined) updates.body = body.body;
    if (body.scope !== undefined) updates.scope = body.scope;
    if (body.is_active !== undefined) updates.is_active = body.is_active;

    const { data, error } = await supabase
      .from("academy_consent_templates")
      .update(updates)
      .eq("id", body.id)
      .select()
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data) as never;
  });
}

export async function DELETE(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();

    const { error } = await supabase
      .from("academy_consent_templates")
      .delete()
      .eq("id", body.id);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return new NextResponse(null, { status: 204 });
  });
}
