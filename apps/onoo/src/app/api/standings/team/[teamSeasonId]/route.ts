import { NextResponse } from "next/server";
import { getTeamQuickView } from "@/app/lib/data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamSeasonId: string }> },
) {
  const { teamSeasonId } = await params;
  const data = await getTeamQuickView(teamSeasonId);
  if (!data) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}
