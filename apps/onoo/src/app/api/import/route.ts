/**
 * Historical season stats import (bootstrap path — DEPRECATED for V2).
 *
 * In V2, all stats come from game-level tracking through the revision pipeline.
 * This route exists only for bootstrapping historical season_player_stats from
 * CSV. Instead of writing directly to the protected season_player_stats table,
 * it creates source_submissions that enter the review pipeline.
 *
 * The submission's normalized_payload contains the full parsed CSV rows grouped
 * by competition. An admin can then approve the submission and the stats are
 * materialized via cmd_approve_source → cmd_create_revision → cmd_approve_revision.
 *
 * CSVs should have these columns (order-independent):
 *   player_name, team_name, season, gp, minutes, pts, fgm, fga, tpm, tpa,
 *   ftm, fta, oreb, dreb, ast, stl, blk, tov, pf
 */
import { type NextRequest, NextResponse } from "next/server";
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
        { status: 400 },
      );
    }

    // Parse CSV
    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV must have header + at least 1 data row" },
        { status: 400 },
      );
    }

    const headers = (lines[0] ?? "")
      .split(",")
      .map((h) => h.trim().toLowerCase());
    const rows: ImportRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = (lines[i] ?? "").split(",").map((v) => v.trim());
      const row: Record<string, string | number> = {};

      headers.forEach((header, idx) => {
        const val = values[idx] || "";
        row[header] = Number.isNaN(Number(val)) ? val : Number(val);
      });

      rows.push(row as unknown as ImportRow);
    }

    const supabase = await createClient();

    // Get or create season (reference data — not a protected table)
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
        return NextResponse.json(
          { error: seasonError.message },
          { status: 500 },
        );
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
        .insert({
          season_id: season.id,
          name: "Regular Season",
          type: "regular",
        })
        .select("id")
        .single();

      if (compError) {
        return NextResponse.json({ error: compError.message }, { status: 500 });
      }
      competition = newComp;
    }

    // Resolve teams and players (reference data — fine)
    const resolvedStats: Array<{
      player_id: string;
      team_season_id: string;
      row: ImportRow;
    }> = [];
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
            continue;
          }
          player = newPlayer;
        }

        resolvedStats.push({
          player_id: player.id,
          team_season_id: teamSeason.id,
          row,
        });
      } catch (err) {
        errors.push(`Row ${row.player_name}: ${err}`);
      }
    }

    // Package resolved data as a source submission (enters the review pipeline)
    const normalizedPayload = {
      competition_id: competition.id,
      season_id: season.id,
      stats: resolvedStats.map((s) => ({
        player_id: s.player_id,
        team_season_id: s.team_season_id,
        gp: s.row.gp || 0,
        minutes: s.row.minutes || 0,
        pts: s.row.pts || 0,
        fgm: s.row.fgm || 0,
        fga: s.row.fga || 0,
        tpm: s.row.tpm || 0,
        tpa: s.row.tpa || 0,
        ftm: s.row.ftm || 0,
        fta: s.row.fta || 0,
        oreb: s.row.oreb || 0,
        dreb: s.row.dreb || 0,
        ast: s.row.ast || 0,
        stl: s.row.stl || 0,
        blk: s.row.blk || 0,
        tov: s.row.tov || 0,
        pf: s.row.pf || 0,
      })),
    };

    // Create a submission — this enters the pipeline instead of writing
    // directly to season_player_stats (which is a protected table in V2)
    const { error: subError } = await supabase
      .from("source_submissions")
      .insert({
        game_id: null, // Season-level import — not associated with a specific game
        source_type: "import",
        evidence_url: null,
        submitted_by: (await supabase.auth.getUser()).data.user?.id,
        normalized_payload: normalizedPayload,
        confidence: 1.0,
        status: "pending",
      });

    if (subError) {
      return NextResponse.json(
        { error: `Failed to create submission: ${subError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      rows_parsed: rows.length,
      rows_resolved: resolvedStats.length,
      errors: errors.slice(0, 10),
      note: "Data entered as pending submission. Approve via admin Review UI to materialize into season_player_stats.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Import failed: ${err}` },
      { status: 500 },
    );
  }
}
