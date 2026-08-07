/**
 * GET  /admin/api/academy/attendance — list attendance (filterable by program_id, session_date)
 * POST /admin/api/academy/attendance — create via cmd_record_attendance
 * PUT  /admin/api/academy/attendance — update attendance status
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/admin-route";

export async function GET(request: NextRequest) {
  return withAuth(async (supabase) => {
    const programId = request.nextUrl.searchParams.get("program_id");
    const sessionDate = request.nextUrl.searchParams.get("session_date");

    let query = supabase
      .from("academy_attendance")
      .select("*, academy_students(canonical_name)")
      .order("session_date", { ascending: false });

    if (programId) query = query.eq("program_id", programId);
    if (sessionDate) query = query.eq("session_date", sessionDate);

    const { data, error } = await query;

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data) as never;
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();

    const { data, error } = await supabase.rpc("cmd_record_attendance", {
      p_student_id: body.student_id,
      p_program_id: body.program_id,
      p_session_date: body.session_date,
      p_status: body.status,
      p_note: body.note ?? null,
    });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data) as never;
  });
}

export async function PUT(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();

    const { data, error } = await supabase
      .from("academy_attendance")
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq("id", body.id)
      .select()
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data) as never;
  });
}
