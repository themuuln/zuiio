import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const gameId = searchParams.get("gameId");
  const type = searchParams.get("type") || "boxscore"; // boxscore, playbyplay

  if (!gameId) {
    return NextResponse.json({ error: "gameId required" }, { status: 400 });
  }

  const supabase = await createClient();

  if (type === "boxscore") {
    // Get box score data
    const { data: playerStats, error: playerError } = await supabase
      .from("game_player_stats")
      .select(`
        *,
        players (canonical_name, name_latin, jersey_number),
        team_seasons (teams (name, short_code))
      `)
      .eq("game_id", gameId);

    if (playerError) {
      return NextResponse.json({ error: playerError.message }, { status: 500 });
    }

    // Convert to CSV
    const headers = [
      "Player",
      "Team",
      "Jersey",
      "MIN",
      "PTS",
      "FGM",
      "FGA",
      "FG%",
      "3PM",
      "3PA",
      "3P%",
      "FTM",
      "FTA",
      "FT%",
      "OREB",
      "DREB",
      "REB",
      "AST",
      "STL",
      "BLK",
      "TOV",
      "PF",
    ];

    const rows = playerStats.map((stat) => {
      const player = stat.players as {
        canonical_name?: string;
        name_latin?: string;
        jersey_number?: number;
      } | null;
      const team = stat.team_seasons as {
        teams?: { name?: string; short_code?: string };
      } | null;
      const fga = stat.fga || 0;
      const tpa = stat.tpa || 0;
      const fta = stat.fta || 0;

      return [
        player?.canonical_name || player?.name_latin || "Unknown",
        team?.teams?.short_code || team?.teams?.name || "Unknown",
        player?.jersey_number || "",
        stat.minutes || 0,
        stat.pts || 0,
        stat.fgm || 0,
        fga,
        fga > 0 ? ((stat.fgm / fga) * 100).toFixed(1) : "0.0",
        stat.tpm || 0,
        tpa,
        tpa > 0 ? ((stat.tpm / tpa) * 100).toFixed(1) : "0.0",
        stat.ftm || 0,
        fta,
        fta > 0 ? ((stat.ftm / fta) * 100).toFixed(1) : "0.0",
        stat.oreb || 0,
        stat.dreb || 0,
        (stat.oreb || 0) + (stat.dreb || 0),
        stat.ast || 0,
        stat.stl || 0,
        stat.blk || 0,
        stat.tov || 0,
        stat.pf || 0,
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="boxscore-${gameId}.csv"`,
      },
    });
  }

  if (type === "playbyplay") {
    // Get play-by-play data
    const { data: events, error: eventsError } = await supabase
      .from("stat_events")
      .select("*")
      .eq("game_id", gameId)
      .is("deleted_at", null)
      .order("period", { ascending: true })
      .order("clock_seconds", { ascending: false });

    if (eventsError) {
      return NextResponse.json({ error: eventsError.message }, { status: 500 });
    }

    // Convert to CSV
    const headers = [
      "Period",
      "Clock",
      "Event Type",
      "Player ID",
      "Team ID",
      "Details",
    ];

    const rows = events.map((event) => {
      const minutes = Math.floor(event.clock_seconds / 60);
      const seconds = event.clock_seconds % 60;
      const clock = `${minutes}:${seconds.toString().padStart(2, "0")}`;

      return [
        event.period,
        clock,
        event.event_type,
        event.player_id || "",
        event.team_season_id || "",
        JSON.stringify(event.payload || {}),
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="playbyplay-${gameId}.csv"`,
      },
    });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
