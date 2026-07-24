import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface ImportRow {
  player_name: string;
  team_name: string;
  season: string;
  gp: number;
  minutes: number;
  pts: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const leagueId = formData.get("leagueId") as string;
    const seasonName = formData.get("seasonName") as string;

    if (!file || !leagueId || !seasonName) {
      return NextResponse.json(
        { error: "file, leagueId, and seasonName required" },
        { status: 400 }
      );
    }

    // Parse CSV
    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV must have header + at least 1 data row" },
        { status: 400 }
      );
    }

    const headers = (lines[0] ?? "").split(",").map((h) => h.trim().toLowerCase());
    const rows: ImportRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = (lines[i] ?? "").split(",").map((v) => v.trim());
      const row: Record<string, string | number> = {};

      headers.forEach((header, idx) => {
        const val = values[idx] || "";
        row[header] = isNaN(Number(val)) ? val : Number(val);
      });

      rows.push(row as unknown as ImportRow);
    }

    const supabase = await createClient();

    // Get or create season
    let { data: season } = await supabase
      .from("seasons")
      .select("id")
      .eq("league_id", leagueId)
      .eq("name", seasonName)
      .single();

    if (!season) {
      const { data: newSeason, error: seasonError } = await supabase
        .from("seasons")
        .insert({ league_id: leagueId, name: seasonName })
        .select("id")
        .single();

      if (seasonError) {
        return NextResponse.json({ error: seasonError.message }, { status: 500 });
      }
      season = newSeason;
    }

    // Get or create competition
    let { data: competition } = await supabase
      .from("competitions")
      .select("id")
      .eq("season_id", season.id)
      .eq("name", "Regular Season")
      .single();

    if (!competition) {
      const { data: newComp, error: compError } = await supabase
        .from("competitions")
        .insert({ season_id: season.id, name: "Regular Season", type: "regular" })
        .select("id")
        .single();

      if (compError) {
        return NextResponse.json({ error: compError.message }, { status: 500 });
      }
      competition = newComp;
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        // Find or create team
        let { data: team } = await supabase
          .from("teams")
          .select("id")
          .ilike("name", row.team_name)
          .single();

        if (!team) {
          const slug = row.team_name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");

          const { data: newTeam, error: teamError } = await supabase
            .from("teams")
            .insert({ name: row.team_name, slug })
            .select("id")
            .single();

          if (teamError) {
            errors.push(`Team "${row.team_name}": ${teamError.message}`);
            skipped++;
            continue;
          }
          team = newTeam;
        }

        // Get or create team_season
        let { data: teamSeason } = await supabase
          .from("team_seasons")
          .select("id")
          .eq("team_id", team.id)
          .eq("season_id", season.id)
          .single();

        if (!teamSeason) {
          const { data: newTS, error: tsError } = await supabase
            .from("team_seasons")
            .insert({ team_id: team.id, season_id: season.id })
            .select("id")
            .single();

          if (tsError) {
            errors.push(`TeamSeason: ${tsError.message}`);
            skipped++;
            continue;
          }
          teamSeason = newTS;
        }

        // Find or create player
        let { data: player } = await supabase
          .from("players")
          .select("id")
          .ilike("canonical_name", row.player_name)
          .single();

        if (!player) {
          const { data: newPlayer, error: playerError } = await supabase
            .from("players")
            .insert({
              canonical_name: row.player_name,
              name_latin: row.player_name,
            })
            .select("id")
            .single();

          if (playerError) {
            errors.push(`Player "${row.player_name}": ${playerError.message}`);
            skipped++;
            continue;
          }
          player = newPlayer;
        }

        // Insert season_player_stats
        const { error: statsError } = await supabase
          .from("season_player_stats")
          .upsert(
            {
              player_id: player.id,
              team_season_id: teamSeason.id,
              competition_id: competition.id,
              gp: row.gp || 0,
              minutes: row.minutes || 0,
              pts: row.pts || 0,
              fgm: row.fgm || 0,
              fga: row.fga || 0,
              tpm: row.tpm || 0,
              tpa: row.tpa || 0,
              ftm: row.ftm || 0,
              fta: row.fta || 0,
              oreb: row.oreb || 0,
              dreb: row.dreb || 0,
              ast: row.ast || 0,
              stl: row.stl || 0,
              blk: row.blk || 0,
              tov: row.tov || 0,
              pf: row.pf || 0,
            },
            { onConflict: "player_id,team_season_id,competition_id" }
          );

        if (statsError) {
          errors.push(`Stats for "${row.player_name}": ${statsError.message}`);
          skipped++;
          continue;
        }

        imported++;
      } catch (err) {
        errors.push(`Row ${row.player_name}: ${err}`);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors: errors.slice(0, 10), // Return first 10 errors
      total: rows.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Import failed: ${err}` },
      { status: 500 }
    );
  }
}
