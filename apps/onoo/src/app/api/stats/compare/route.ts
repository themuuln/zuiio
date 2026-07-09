import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const playerId = searchParams.get("playerId");
  const teamId = searchParams.get("teamId");

  if (!playerId && !teamId) {
    return NextResponse.json(
      { error: "playerId or teamId required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  if (playerId) {
    // Get player's stats across seasons
    const { data: stats, error } = await supabase
      .from("season_player_stats")
      .select(`
        *,
        team_seasons!inner (
          id,
          season:seasons (name, starts_on),
          league:leagues (name)
        )
      `)
      .eq("player_id", playerId)
      .order("team_seasons.season.starts_on", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data for comparison
    const seasons = stats.map((stat) => {
      const ts = stat.team_seasons as {
        season?: { name?: string; starts_on?: string };
        league?: { name?: string };
      };
      return {
        season: ts.season?.name || "Unknown",
        league: ts.league?.name || "Unknown",
        startDate: ts.season?.starts_on,
        gp: stat.gp,
        minutes: stat.minutes,
        pts: stat.pts,
        fgm: stat.fgm,
        fga: stat.fga,
        tpm: stat.tpm,
        tpa: stat.tpa,
        ftm: stat.ftm,
        fta: stat.fta,
        oreb: stat.oreb,
        dreb: stat.dreb,
        ast: stat.ast,
        stl: stat.stl,
        blk: stat.blk,
        tov: stat.tov,
        pf: stat.pf,
        perGame: {
          pts: stat.gp > 0 ? (stat.pts / stat.gp).toFixed(1) : "0.0",
          reb: stat.gp > 0 ? ((stat.oreb + stat.dreb) / stat.gp).toFixed(1) : "0.0",
          ast: stat.gp > 0 ? (stat.ast / stat.gp).toFixed(1) : "0.0",
        },
      };
    });

    return NextResponse.json({ type: "player", data: seasons });
  }

  if (teamId) {
    // Get team's stats across seasons
    const { data: stats, error } = await supabase
      .from("game_team_stats")
      .select(`
        *,
        games!inner (
          competition_id,
          competitions!inner (
            name,
            season:seasons (name, starts_on)
          )
        )
      `)
      .eq("team_season_id", teamId)
      .order("games.competitions.season.starts_on", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by season
    const seasonMap = new Map<
      string,
      {
        season: string;
        games: number;
        wins: number;
        losses: number;
        ptsFor: number;
        ptsAgainst: number;
      }
    >();

    for (const stat of stats) {
      const game = stat.games as {
        competitions?: { season?: { name?: string } };
      };
      const seasonName = game.competitions?.season?.name || "Unknown";

      if (!seasonMap.has(seasonName)) {
        seasonMap.set(seasonName, {
          season: seasonName,
          games: 0,
          wins: 0,
          losses: 0,
          ptsFor: 0,
          ptsAgainst: 0,
        });
      }

      const season = seasonMap.get(seasonName)!;
      season.games++;
      season.ptsFor += stat.pts || 0;
      season.ptsAgainst += stat.pts_allowed || 0;

      // Determine win/loss (simplified)
      if ((stat.pts || 0) > (stat.pts_allowed || 0)) {
        season.wins++;
      } else {
        season.losses++;
      }
    }

    const seasons = Array.from(seasonMap.values()).map((s) => ({
      ...s,
      winPct: s.games > 0 ? (s.wins / s.games).toFixed(3) : ".000",
      avgPtsFor: s.games > 0 ? (s.ptsFor / s.games).toFixed(1) : "0.0",
      avgPtsAgainst: s.games > 0 ? (s.ptsAgainst / s.games).toFixed(1) : "0.0",
      diff: s.games > 0 ? ((s.ptsFor - s.ptsAgainst) / s.games).toFixed(1) : "0.0",
    }));

    return NextResponse.json({ type: "team", data: seasons });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
