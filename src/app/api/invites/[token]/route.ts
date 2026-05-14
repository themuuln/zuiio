import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors";
import { getInviteByToken } from "@/lib/services/invite-service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const invite = await getInviteByToken(token);
    return NextResponse.json({ data: invite });
  } catch (error) {
    return handleApiError(error);
  }
}
