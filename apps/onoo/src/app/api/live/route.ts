import { NextResponse } from "next/server";
import { getLiveGames } from "@/app/lib/data";

/**
 * Returns currently live games as JSON.
 *
 * Used by the LiveScoreCard client component for 20s polling.
 * NOTE(5.1): Replace polling with realtime subscription.
 */
export async function GET() {
  const games = await getLiveGames();
  return NextResponse.json(games);
}
