import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { acceptInvite } from "@/lib/organizations";

/**
 * POST /api/org/accept-invite
 * Body: { token: string }
 * Accepts an organization invite and adds the user as a member.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token } = body;

  if (!token || typeof token !== "string") {
    return NextResponse.json(
      { error: "Урилгын токен шаардлагатай." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Нэвтрэх шаардлагатай." },
      { status: 401 },
    );
  }

  const result = await acceptInvite(token, user.id);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ orgId: result.orgId, success: true });
}
