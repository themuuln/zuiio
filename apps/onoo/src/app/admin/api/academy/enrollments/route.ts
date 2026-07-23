/**
 * GET  /admin/api/academy/enrollments — list enrollments with joins
 * POST /admin/api/academy/enrollments — create via cmd_create_enrollment
 * PUT  /admin/api/academy/enrollments — update via cmd_update_enrollment
 * DELETE /admin/api/academy/enrollments — delete enrollment
 */
import { withAuth } from "@/lib/supabase/admin-route";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET() {
  return withAuth(async (supabase) => {
    const { data, error } = await supabase
      .from("academy_enrollments")
      .select("*, academy_students(canonical_name), academy_programs(name)")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data) as never;
    
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();

    const { data, error } = await supabase.rpc("cmd_create_enrollment", {
      p_student_id: body.student_id,
      p_program_id: body.program_id,
      p_start_date: body.start_date ?? null,
      p_end_date: body.end_date ?? null,
      p_notes: body.notes ?? null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data) as never;
    
  });
}

export async function PUT(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();

    const { data, error } = await supabase.rpc("cmd_update_enrollment", {
      p_enrollment_id: body.enrollment_id,
      p_status: body.status ?? null,
      p_notes: body.notes ?? null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data) as never;
    
  });
}

export async function DELETE(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();

    const { error } = await supabase
      .from("academy_enrollments")
      .delete()
      .eq("id", body.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return new NextResponse(null, { status: 204 });
  });
}
