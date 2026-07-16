import { NextRequest, NextResponse } from "next/server";
import { revokeGrantAction } from "@/app/(auth)/account/actions";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { client_id } = body;

  if (!client_id) {
    return NextResponse.json({ error: "Missing client_id" }, { status: 400 });
  }

  const result = await revokeGrantAction(client_id);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
