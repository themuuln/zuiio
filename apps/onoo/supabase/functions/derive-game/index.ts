import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @deno-types="npm:@onoo/core@0.1.0"
import { deriveBoxScore } from "@onoo/core/stats";
import type { GameRoster, SportConfig, StatEvent } from "@onoo/core/types";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { game_id, mode } = await req.json();

    if (!game_id || !mode || !["finalize", "verify"].includes(mode)) {
      return new Response(
        JSON.stringify({ error: "Invalid request: game_id and mode required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create service-role client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create anon client to verify JWT
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      anonKey,
      { global: { headers: { Authorization: authHeader } } },
    );

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

    // Get game
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

    // Status transition guard
    if (mode === "finalize" && game.status !== "live") {
      return new Response(
        JSON.stringify({ error: "Can only finalize from live status" }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (mode === "verify" && game.status !== "final") {
      return new Response(
        JSON.stringify({ error: "Can only verify from final status" }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Verify user is scorekeeper or league admin
    if (mode === "finalize") {
      const { data: isScorekeeper } = await supabase.rpc(
        "is_game_scorekeeper",
        {
          p_game_id: game_id,
        },
      );
      const { data: isAdmin } = await supabase.rpc("is_league_admin", {
        p_league_id: game.competition_id,
      });
      if (!isScorekeeper && !isAdmin) {
        return new Response(
          JSON.stringify({
            error: "Only scorekeeper or league admin can finalize",
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    } else {
      // verify requires league admin
      const { data: isAdmin } = await supabase.rpc("is_league_admin", {
        p_league_id: game.competition_id,
      });
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: "Only league admin can verify" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // Get non-deleted stat events
    const { data: events, error: eventsError } = await supabase
      .from("stat_events")
      .select("*")
      .eq("game_id", game_id)
      .is("deleted_at", null);

    if (eventsError) {
      return new Response(JSON.stringify({ error: "Failed to fetch events" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get rosters
    const { data: rosters } = await supabase
      .from("game_rosters")
      .select("*")
      .eq("game_id", game_id);

    // Get sport config
    const { data: sport } = await supabase
      .from("sports")
      .select("config")
      .eq("key", "basketball_5x5")
      .single();

    const sportConfig: SportConfig = sport?.config ?? {
      periods: 4,
      period_minutes: 10,
      overtime_minutes: 5,
      fouls_to_bonus: 5,
      personal_foul_limit: 5,
      players_on_court: 5,
    };

    // Run deriveBoxScore from @onoo/core
    const result = deriveBoxScore({
      events: (events ?? []) as StatEvent[],
      rosters: (rosters ?? []) as GameRoster[],
      sportConfig,
    });

    // Get home/away scores
    const homeScore = result.homeAwayScore[game.home_team_season_id] ?? 0;
    const awayScore = result.homeAwayScore[game.away_team_season_id] ?? 0;

    // Prepare player stats for RPC
    const playerStats = result.players.map((p) => ({
      player_id: p.playerId,
      team_season_id: p.teamSeasonId,
      seconds_played: p.secondsPlayed,
      pts: p.pts,
      fgm: p.fgm,
      fga: p.fga,
      tpm: p.tpm,
      tpa: p.tpa,
      ftm: p.ftm,
      fta: p.fta,
      oreb: p.oreb,
      dreb: p.dreb,
      ast: p.ast,
      stl: p.stl,
      blk: p.blk,
      tov: p.tov,
      pf: p.pf,
    }));

    // Prepare team stats for RPC
    const teamStats = result.teams.map((t) => ({
      team_season_id: t.teamSeasonId,
      pts: t.pts,
      fgm: t.fgm,
      fga: t.fga,
      tpm: t.tpm,
      tpa: t.tpa,
      ftm: t.ftm,
      fta: t.fta,
      oreb: t.oreb,
      dreb: t.dreb,
      team_reb: t.teamReb,
      ast: t.ast,
      stl: t.stl,
      blk: t.blk,
      tov: t.tov,
      pf: t.pf,
    }));

    // Apply derived stats via RPC
    const newStatus = mode === "finalize" ? "final" : "verified";
    const { error: rpcError } = await supabase.rpc("apply_derived_stats", {
      p_game_id: game_id,
      p_player_stats: playerStats,
      p_team_stats: teamStats,
      p_home_score: homeScore,
      p_away_score: awayScore,
      p_status: newStatus,
    });

    if (rpcError) {
      return new Response(
        JSON.stringify({ error: `RPC failed: ${rpcError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Refresh season stats
    const competitionId = game.competition_id;
    await supabase.rpc("refresh_season_player_stats", {
      p_competition_id: competitionId,
    });
    await supabase.rpc("refresh_standings", {
      p_competition_id: competitionId,
    });

    // Audit log
    await supabase.from("audit_log").insert({
      actor_id: user.id,
      action: `derive-game:${mode}`,
      entity: "game",
      entity_id: game_id,
      detail: {
        home_score: homeScore,
        away_score: awayScore,
        warnings: result.warnings,
      },
    });

    return new Response(
      JSON.stringify({
        ok: true,
        home_score: homeScore,
        away_score: awayScore,
        warnings: result.warnings,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
