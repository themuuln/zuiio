import { NextRequest, NextResponse } from "next/server";
import { getPendingSelectionPages } from "@/lib/facebookSelections";

export async function GET(request: NextRequest) {
  const selectionId = request.nextUrl.searchParams.get("selection");

  if (!selectionId) {
    return NextResponse.json({ error: "Missing selection id" }, { status: 400 });
  }

  const pages = await getPendingSelectionPages(selectionId);
  if (!pages) {
    return NextResponse.json({ error: "Selection expired or invalid" }, { status: 404 });
  }

  return NextResponse.json({ pages });
}
