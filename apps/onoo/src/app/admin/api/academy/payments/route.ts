/**
 * CRUD /admin/api/academy/payments — student payment records
 */

import { type NextRequest, NextResponse } from "next/server";
import { createRouteHandlers, withAuth } from "@/lib/supabase/admin-route";

const payments = createRouteHandlers("student_payments", {
  select: "*, students:academy_students(canonical_name)",
});

export const GET = payments.list();

export const POST = payments.create();

export async function PUT(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json(
        { error: "id заавал байх ёстой" },
        { status: 400 },
      );
    }
    const { data, error } = await supabase
      .from("student_payments")
      .update(body)
      .eq("id", body.id)
      .select("*, students:academy_students(canonical_name)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data);
  });
}

export async function DELETE(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json(
        { error: "id заавал байх ёстой" },
        { status: 400 },
      );
    }
    const { error } = await supabase
      .from("student_payments")
      .delete()
      .eq("id", body.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return new NextResponse(null, { status: 204 });
  });
}
