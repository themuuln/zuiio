import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PlayerLine {
  player_id: string;
  team_season_id: string;
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
  seconds_played: number | null;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Use service-role client for admin operations
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify caller is authenticated and is a league admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create anon client to verify JWT
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { game_id, player_lines } = await req.json();

    if (!game_id || !Array.isArray(player_lines) || player_lines.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Invalid request: game_id and player_lines required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Load game
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("id", game_id)
      .single();

    if (gameError || !game) {
      return new Response(JSON.stringify({ error: "Game not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if game is in a valid state for manual entry
    if (game.status !== "scheduled" && game.status !== "final") {
      return new Response(
        JSON.stringify({
          error: "Game must be scheduled or final for manual entry",
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Verify user is league admin
    const { data: isAdmin } = await supabase.rpc("is_league_admin", {
      p_league_id: game.competition_id,
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Only league admins can enter box scores" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Compute team lines from player lines
    const teamLines = new Map<string, PlayerLine>();

    for (const line of player_lines) {
      const tid = line.team_season_id;
      if (!teamLines.has(tid)) {
        teamLines.set(tid, {
          player_id: "TEAM_TOTAL",
          team_season_id: tid,
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
          seconds_played: null,
        });
      }
      const teamLine = teamLines.get(tid)!;
      teamLine.pts += line.pts;
      teamLine.fgm += line.fgm;
      teamLine.fga += line.fga;
      teamLine.tpm += line.tpm;
      teamLine.tpa += line.tpa;
      teamLine.ftm += line.ftm;
      teamLine.fta += line.fta;
      teamLine.oreb += line.oreb;
      teamLine.dreb += line.dreb;
      teamLine.ast += line.ast;
      teamLine.stl += line.stl;
      teamLine.blk += line.blk;
      teamLine.tov += line.tov;
      teamLine.pf += line.pf;
    }

    // Delete existing derived stats for this game
    await supabase.from("game_player_stats").delete().eq("game_id", game_id);

    await supabase.from("game_team_stats").delete().eq("game_id", game_id);

    // Insert player stats
    const playerStatsInserts = player_lines.map((line: PlayerLine) => ({
      game_id,
      player_id: line.player_id,
      team_season_id: line.team_season_id,
      seconds_played: line.seconds_played,
      pts: line.pts,
      fgm: line.fgm,
      fga: line.fga,
      tpm: line.tpm,
      tpa: line.tpa,
      ftm: line.ftm,
      fta: line.fta,
      oreb: line.oreb,
      dreb: line.dreb,
      ast: line.ast,
      stl: line.stl,
      blk: line.blk,
      tov: line.tov,
      pf: line.pf,
    }));

    const { error: playerStatsError } = await supabase
      .from("game_player_stats")
      .insert(playerStatsInserts);

    if (playerStatsError) {
      throw new Error(
        `Failed to insert player stats: ${playerStatsError.message}`,
      );
    }

    // Insert team stats
    const teamStatsInserts = Array.from(teamLines.values()).map((line) => ({
      game_id,
      team_season_id: line.team_season_id,
      pts: line.pts,
      fgm: line.fgm,
      fga: line.fga,
      tpm: line.tpm,
      tpa: line.tpa,
      ftm: line.ftm,
      fta: line.fta,
      oreb: line.oreb,
      dreb: line.dreb,
      team_reb: 0, // Manual entry doesn't track team rebounds
      ast: line.ast,
      stl: line.stl,
      blk: line.blk,
      tov: line.tov,
      pf: line.pf,
    }));

    const { error: teamStatsError } = await supabase
      .from("game_team_stats")
      .insert(teamStatsInserts);

    if (teamStatsError) {
      throw new Error(`Failed to insert team stats: ${teamStatsError.message}`);
    }

    // Update game scores and status
    const homeTeamLine = teamLines.get(game.home_team_season_id);
    const awayTeamLine = teamLines.get(game.away_team_season_id);

    const { error: updateError } = await supabase
      .from("games")
      .update({
        home_score: homeTeamLine?.pts ?? 0,
        away_score: awayTeamLine?.pts ?? 0,
        status: "final",
      })
      .eq("id", game_id);

    if (updateError) {
      throw new Error(`Failed to update game: ${updateError.message}`);
    }

    // Refresh season stats and standings
    const { error: refreshError } = await supabase.rpc(
      "refresh_season_player_stats",
      {
        p_competition_id: game.competition_id,
      },
    );

    if (refreshError) {
      console.error("Failed to refresh season stats:", refreshError);
    }

    const { error: standingsError } = await supabase.rpc("refresh_standings", {
      p_competition_id: game.competition_id,
    });

    if (standingsError) {
      console.error("Failed to refresh standings:", standingsError);
    }

    // Audit log
    await supabase.from("audit_log").insert({
      actor_id: user.id,
      action: "manual-box-entry",
      entity: "game",
      entity_id: game_id,
      detail: { player_lines: player_lines.length },
    });

    return new Response(
      JSON.stringify({
        ok: true,
        home_score: homeTeamLine?.pts ?? 0,
        away_score: awayTeamLine?.pts ?? 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
