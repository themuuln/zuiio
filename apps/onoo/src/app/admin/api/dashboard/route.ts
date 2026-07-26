/**
 * GET /admin/api/dashboard — returns games, leagues, and teams in one response
 * with a single auth check, instead of 3 separate API calls.
 */

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/admin-route";

interface DashboardGame {
  id: string;
  status: string;
  scheduled_at: string | null;
  home_team_season: { teams: { short_code: string } | null } | null;
  away_team_season: { teams: { short_code: string } | null } | null;
}

const GAME_SELECT =
  "id, status, scheduled_at, home_team_season:team_seasons!home_team_season_id(teams(short_code)), away_team_season:team_seasons!away_team_season_id(teams(short_code))";

interface DashboardData {
  games: DashboardGame[];
  leagues: unknown[];
  teams: unknown[];
}

export const GET = () =>
  withAuth<DashboardData>(async (supabase) => {
    const [games, leagueCount, teamCount] = await Promise.all([
      supabase
        .from("games")
        .select(GAME_SELECT)
        .order("scheduled_at", { ascending: false }),
      supabase.from("leagues").select("*", { count: "exact", head: true }),
      supabase.from("teams").select("*", { count: "exact", head: true }),
    ]);

    if (games.error) {
      return NextResponse.json(
        { error: games.error.message },
        { status: 500 },
      ) as unknown as NextResponse<DashboardData>;
    }
    if (leagueCount.error) {
      return NextResponse.json(
        { error: leagueCount.error.message },
        { status: 500 },
      ) as unknown as NextResponse<DashboardData>;
    }
    if (teamCount.error) {
      return NextResponse.json(
        { error: teamCount.error.message },
        { status: 500 },
      ) as unknown as NextResponse<DashboardData>;
    }

    // Count queries return null data with count in the response
    const leagueList = Array.from({ length: leagueCount.count ?? 0 });
    const teamList = Array.from({ length: teamCount.count ?? 0 });

    return NextResponse.json({
      games: (games.data ?? []) as unknown as DashboardGame[],
      leagues: leagueList,
      teams: teamList,
    });
  });
