import { NextResponse } from "next/server";
import { getFacebookConnection } from "@/lib/facebookConnection";

export async function GET() {
  const connection = await getFacebookConnection();

  if (!connection) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    pageId: connection.pageId,
    pageName: connection.pageName,
    connectedAt: connection.connectedAt,
  });
}
