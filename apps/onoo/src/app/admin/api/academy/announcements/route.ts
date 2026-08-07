/**
 * GET /admin/api/academy/announcements — list announcements with creator info
 * POST /admin/api/academy/announcements — create announcement (cmd_create_announcement)
 * DELETE /admin/api/academy/announcements — remove announcement
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/admin-route";

export async function GET() {
  return withAuth(async (supabase) => {
    const { data, error } = await supabase
      .from("academy_announcements")
      .select("*, users!created_by(email), academy_programs(name)")
      .order("created_at", { ascending: false });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data) as never;
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();

    const { data, error } = await supabase.rpc("cmd_create_announcement", {
      p_academy_id: body.academy_id,
      p_title: body.title,
      p_body: body.body,
      p_program_id: body.program_id ?? null,
    });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data) as never;
  });
}

export async function DELETE(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();

    const { error } = await supabase
      .from("academy_announcements")
      .delete()
      .eq("id", body.id);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true }) as never;
  });
}
