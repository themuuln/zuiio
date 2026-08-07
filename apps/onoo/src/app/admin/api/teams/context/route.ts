import { NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/admin-route";

interface TeamsContext {
  teamSeasons: unknown[];
  players: unknown[];
}

export const GET = () =>
  withAuth<TeamsContext>(async (supabase) => {
    const [teamSeasons, players] = await Promise.all([
      supabase
        .from("team_seasons")
        .select("*, teams(name, short_code)")
        .order("id"),
      supabase
        .from("players")
        .select("*")
        .order("canonical_name", { ascending: true }),
    ]);

    if (teamSeasons.error)
      return NextResponse.json(
        { error: teamSeasons.error.message },
        { status: 500 },
      ) as never;
    if (players.error)
      return NextResponse.json(
        { error: players.error.message },
        { status: 500 },
      ) as never;

    return NextResponse.json({
      teamSeasons: (teamSeasons.data ?? []) as unknown as unknown[],
      players: (players.data ?? []) as unknown as unknown[],
    });
  });
