/**
 * GET /admin/api/academy/students — list students
 * POST /admin/api/academy/students — create student
 */
import { createRouteHandlers, withAuth } from "@/lib/supabase/admin-route";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const students = createRouteHandlers("academy_students", {
  select: "*, academy_profiles(name)",
});

export const GET = students.list((query, request) => {
  const search = request.nextUrl.searchParams.get("q");
  if (search) {
    return query
      .eq("status", "active")
      .order("canonical_name", { ascending: true }) as never;
  }
  return query.order("created_at", { ascending: false }) as never;
});

export async function POST(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();

    const { data, error } = await supabase.rpc("cmd_create_student", {
      p_academy_id: body.academy_id,
      p_canonical_name: body.canonical_name,
      p_name_latin: body.name_latin ?? null,
      p_date_of_birth: body.date_of_birth ?? null,
      p_photo_url: body.photo_url ?? null,
      p_school_name: body.school_name ?? null,
      p_grade_level: body.grade_level ?? null,
      p_medical_notes: body.medical_notes ?? null,
      p_allergies: body.allergies ?? null,
      p_emergency_contact_name: body.emergency_contact_name ?? null,
      p_emergency_contact_phone: body.emergency_contact_phone ?? null,
      p_notes: body.notes ?? null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  });
}

export async function PUT(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();
    const { data, error } = await supabase.rpc("cmd_update_student", {
      p_student_id: body.id,
      p_canonical_name: body.canonical_name ?? null,
      p_school_name: body.school_name ?? null,
      p_status: body.status ?? null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  });
}
