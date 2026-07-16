import { NextRequest, NextResponse } from "next/server";
import { revokeSession } from "@/app/(auth)/account/actions";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { session_id } = body;

  if (!session_id) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const result = await revokeSession(session_id);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
