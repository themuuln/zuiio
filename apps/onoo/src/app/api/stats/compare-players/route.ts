import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const playerIds = searchParams.get("playerIds")?.split(",") || [];
  const seasonId = searchParams.get("seasonId");

  if (playerIds.length < 2 || playerIds.length > 5) {
    return NextResponse.json(
      { error: "2-5 playerIds required (comma-separated)" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Get players info
  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("id, canonical_name, name_latin, jersey_number, position")
    .in("id", playerIds);

  if (playersError) {
    return NextResponse.json({ error: playersError.message }, { status: 500 });
  }

  // Get stats for each player
  const playerStats = await Promise.all(
    playerIds.map(async (playerId) => {
      let query = supabase
        .from("season_player_stats")
        .select(`
          *,
          team_seasons!inner (
            id,
            season:seasons (id, name),
            teams (name, short_code)
          )
        `)
        .eq("player_id", playerId);

      if (seasonId) {
        query = query.eq("team_seasons.season.id", seasonId);
      }

      const { data: stats, error } = await query;

      if (error) throw error;

      // Aggregate stats across seasons if no season filter
      const aggregated = stats.reduce(
        (acc, stat) => ({
          gp: acc.gp + (stat.gp || 0),
          minutes: acc.minutes + (stat.minutes || 0),
          pts: acc.pts + (stat.pts || 0),
          fgm: acc.fgm + (stat.fgm || 0),
          fga: acc.fga + (stat.fga || 0),
          tpm: acc.tpm + (stat.tpm || 0),
          tpa: acc.tpa + (stat.tpa || 0),
          ftm: acc.ftm + (stat.ftm || 0),
          fta: acc.fta + (stat.fta || 0),
          oreb: acc.oreb + (stat.oreb || 0),
          dreb: acc.dreb + (stat.dreb || 0),
          ast: acc.ast + (stat.ast || 0),
          stl: acc.stl + (stat.stl || 0),
          blk: acc.blk + (stat.blk || 0),
          tov: acc.tov + (stat.tov || 0),
          pf: acc.pf + (stat.pf || 0),
        }),
        {
          gp: 0,
          minutes: 0,
          pts: 0,
          fgm: 0,
          fga: 0,
          tpm: 0,
          tpa: 0,
          ftm: 0,
          fta: 0,
          oreb: 0,
          dreb: 0,
          ast: 0,
          stl: 0,
          blk: 0,
          tov: 0,
          pf: 0,
        }
      );

      return {
        playerId,
        ...aggregated,
        perGame: {
          pts: aggregated.gp > 0 ? (aggregated.pts / aggregated.gp).toFixed(1) : "0.0",
          reb: aggregated.gp > 0 ? ((aggregated.oreb + aggregated.dreb) / aggregated.gp).toFixed(1) : "0.0",
          ast: aggregated.gp > 0 ? (aggregated.ast / aggregated.gp).toFixed(1) : "0.0",
          stl: aggregated.gp > 0 ? (aggregated.stl / aggregated.gp).toFixed(1) : "0.0",
          blk: aggregated.gp > 0 ? (aggregated.blk / aggregated.gp).toFixed(1) : "0.0",
          tov: aggregated.gp > 0 ? (aggregated.tov / aggregated.gp).toFixed(1) : "0.0",
        },
        efficiency: {
          efg:
            aggregated.fga > 0
              ? ((aggregated.fgm + 0.5 * aggregated.tpm) / aggregated.fga).toFixed(3)
              : ".000",
          ts:
            aggregated.fga + 0.44 * aggregated.fta > 0
              ? (
                  aggregated.pts /
                  (2 * (aggregated.fga + 0.44 * aggregated.fta))
                ).toFixed(3)
              : ".000",
          astTo:
            aggregated.tov > 0
              ? (aggregated.ast / aggregated.tov).toFixed(2)
              : aggregated.ast.toFixed(2),
        },
      };
    })
  );

  // Merge player info with stats
  const result = playerStats.map((stats) => {
    const player = players?.find((p) => p.id === stats.playerId);
    return {
      ...player,
      stats,
    };
  });

  return NextResponse.json(result);
}
