import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors";
import { redeemInvite } from "@/lib/services/invite-service";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 },
      );
    }

    const { token } = await params;
    const result = await redeemInvite(token, user.id);
    return NextResponse.json({ data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
