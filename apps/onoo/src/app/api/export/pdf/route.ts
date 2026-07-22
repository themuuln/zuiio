import { formatPlayerName, getStatLabel } from "@onoo/core";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const gameId = searchParams.get("gameId");
  const lang = (searchParams.get("lang") ?? "mn") as "mn" | "en";
  const isEn = lang === "en";

  if (!gameId) {
    return NextResponse.json({ error: "gameId required" }, { status: 400 });
  }

  const supabase = await createClient();

  // Get game info
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select(`
      *,
      home_team_season:team_seasons!games_home_team_season_id_fkey (teams (name, short_code)),
      away_team_season:team_seasons!games_away_team_season_id_fkey (teams (name, short_code)),
      competitions (name),
      venues (name, city)
    `)
    .eq("id", gameId)
    .single();

  if (gameError || !game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // Get box score
  const { data: playerStats, error: statsError } = await supabase
    .from("game_player_stats")
    .select(`
      *,
      players (canonical_name, name_latin, jersey_number),
      team_seasons!inner (id, teams (name, short_code))
    `)
    .eq("game_id", gameId);

  if (statsError) {
    return NextResponse.json({ error: statsError.message }, { status: 500 });
  }

  // Get team stats
  const { data: _teamStats } = await supabase
    .from("game_team_stats")
    .select("*")
    .eq("game_id", gameId);

  // Generate HTML for PDF
  const homeTeam = game.home_team_season as {
    teams?: { name?: string; short_code?: string };
  } | null;
  const awayTeam = game.away_team_season as {
    teams?: { name?: string; short_code?: string };
  } | null;
  const homeTeamName = homeTeam?.teams?.name || "Home";
  const awayTeamName = awayTeam?.teams?.name || "Away";

  // Group stats by team
  const homeStats = playerStats.filter(
    (s) => (s.team_seasons as { id: string })?.id === game.home_team_season_id,
  );
  const awayStats = playerStats.filter(
    (s) => (s.team_seasons as { id: string })?.id === game.away_team_season_id,
  );

  const renderTable = (stats: typeof playerStats, teamName: string) => {
    const rows = stats
      .map((stat) => {
        const player = stat.players as {
          canonical_name?: string;
          name_latin?: string;
          jersey_number?: number;
        } | null;
        const name = formatPlayerName(
          player?.name_latin ?? null,
          player?.canonical_name ?? "Unknown",
          lang,
        );
        const jersey = player?.jersey_number || "";
        return `
        <tr>
          <td>${jersey}</td>
          <td>${name}</td>
          <td>${stat.minutes || 0}</td>
          <td><strong>${stat.pts || 0}</strong></td>
          <td>${stat.fgm || 0}/${stat.fga || 0}</td>
          <td>${stat.tpm || 0}/${stat.tpa || 0}</td>
          <td>${stat.ftm || 0}/${stat.fta || 0}</td>
          <td>${(stat.oreb || 0) + (stat.dreb || 0)}</td>
          <td>${stat.ast || 0}</td>
          <td>${stat.stl || 0}</td>
          <td>${stat.blk || 0}</td>
          <td>${stat.tov || 0}</td>
        </tr>`;
      })
      .join("");

    return `
    <h2>${teamName}</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>${isEn ? "Player" : "Name"}</th>
          <th>${isEn ? getStatLabel("mpg", "en") : "MIN"}</th>
          <th>${isEn ? getStatLabel("pts", "en") : "PTS"}</th>
          <th>${isEn ? "FG" : "FG"}</th>
          <th>${isEn ? "3P" : "3P"}</th>
          <th>${isEn ? "FT" : "FT"}</th>
          <th>${isEn ? getStatLabel("reb", "en") : "REB"}</th>
          <th>${isEn ? getStatLabel("ast", "en") : "AST"}</th>
          <th>${isEn ? getStatLabel("stl", "en") : "STL"}</th>
          <th>${isEn ? getStatLabel("blk", "en") : "BLK"}</th>
          <th>${isEn ? getStatLabel("tov", "en") : "TOV"}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${isEn ? "Official player statistics — Onoo" : `Box Score - ${homeTeamName} vs ${awayTeamName}`}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { text-align: center; margin-bottom: 5px; }
    .subtitle { text-align: center; color: #666; margin-bottom: 20px; }
    .score { text-align: center; font-size: 24px; margin: 20px 0; }
    h2 { border-bottom: 2px solid #333; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
    th { background-color: #f5f5f5; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 40px; }
  </style>
</head>
<body>
  <h1>${homeTeamName} vs ${awayTeamName}</h1>
  <div class="subtitle">${game.competitions?.name || ""} | ${game.venues?.name || ""}${game.venues?.city ? `, ${game.venues.city}` : ""}</div>
  <div class="score">${game.home_score ?? 0} - ${game.away_score ?? 0}</div>
  
  ${renderTable(homeStats, homeTeamName)}
  ${renderTable(awayStats, awayTeamName)}
  
  <div class="footer">
    ${isEn ? "Generated by Onoo — Sports Statistics Platform" : "Generated by Onoo - Sports Statistics Platform"}
  </div>
</body>
</html>`;

  // Return HTML (can be converted to PDF client-side or with a library)
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
      "Content-Disposition": `attachment; filename="boxscore-${gameId}.html"`,
    },
  });
}
