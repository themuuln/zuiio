/**
 * GET /admin/api/academy/waitlists — list waitlists with student + program names
 * POST /admin/api/academy/waitlists — join waitlist (cmd_join_waitlist)
 * PUT  /admin/api/academy/waitlists — promote waitlist entry
 * DELETE /admin/api/academy/waitlists — remove from waitlist
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/admin-route";

export async function GET() {
  return withAuth(async (supabase) => {
    const { data, error } = await supabase
      .from("academy_waitlists")
      .select("*, academy_students(canonical_name), academy_programs(name)")
      .order("position", { ascending: true });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data) as never;
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();

    const { data, error } = await supabase.rpc("cmd_join_waitlist", {
      p_student_id: body.student_id,
      p_program_id: body.program_id,
    });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data) as never;
  });
}

export async function PUT(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();

    if (body.action === "promote") {
      const { data, error } = await supabase
        .from("academy_waitlists")
        .update({ status: "promoted" })
        .eq("id", body.waitlist_id)
        .eq("status", "waiting")
        .select()
        .single();

      if (error)
        return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json(data) as never;
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  });
}

export async function DELETE(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();

    const { error } = await supabase
      .from("academy_waitlists")
      .delete()
      .eq("id", body.waitlist_id);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true }) as never;
  });
}
