import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createRouteHandlers, withAuth } from "@/lib/supabase/admin-route";

const students = createRouteHandlers("academy_students");

export const DELETE = students.remove();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth(async (supabase) => {
    const { id } = await params;
    const body = await request.json();
    const { data, error } = await supabase.rpc("cmd_update_student", {
      p_student_id: id,
      p_canonical_name: body.canonical_name ?? null,
      p_name_latin: body.name_latin ?? null,
      p_school_name: body.school_name ?? null,
      p_emergency_contact_phone: body.emergency_contact_phone ?? null,
    });
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  });
}
