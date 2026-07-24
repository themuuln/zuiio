import { type NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/admin-route";

export async function POST(request: NextRequest) {
  return withAuth<unknown>(async (supabase) => {
    const { student_id, user_id } = await request.json();
    const { error } = await supabase.rpc("cmd_link_student_to_user", {
      p_student_id: student_id,
      p_user_id: user_id,
    });
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  });
}
