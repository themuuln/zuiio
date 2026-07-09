import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create service-role client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get game
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("id", game_id)
      .single();

    if (gameError || !game) {
      return new Response(
        JSON.stringify({ error: "Game not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Status transition guard
    if (mode === "finalize" && game.status !== "live") {
      return new Response(
        JSON.stringify({ error: "Can only finalize from live status" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (mode === "verify" && game.status !== "final") {
      return new Response(
        JSON.stringify({ error: "Can only verify from final status" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get non-deleted stat events
    const { data: events, error: eventsError } = await supabase
      .from("stat_events")
      .select("*")
      .eq("game_id", game_id)
      .is("deleted_at", null)
      .order("period", { ascending: true })
      .order("clock_seconds", { ascending: false })
      .order("local_seq", { ascending: true });

    if (eventsError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch events" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    const sportConfig = sport?.config ?? {
      periods: 4,
      period_minutes: 10,
      overtime_minutes: 5,
      fouls_to_bonus: 5,
      personal_foul_limit: 5,
      players_on_court: 5,
    };

    // TODO: Import and run deriveBoxScore from @onoo/core
    // For now, compute basic scores from events
    let homeScore = 0;
    let awayScore = 0;
    const warnings: string[] = [];

    for (const event of events ?? []) {
      if (event.event_type === "shot_2pt_made") {
        if (event.team_season_id === game.home_team_season_id) homeScore += 2;
        else awayScore += 2;
      } else if (event.event_type === "shot_3pt_made") {
        if (event.team_season_id === game.home_team_season_id) homeScore += 3;
        else awayScore += 3;
      } else if (event.event_type === "ft_made") {
        if (event.team_season_id === game.home_team_season_id) homeScore += 1;
        else awayScore += 1;
      }
    }

    // Apply derived stats via RPC
    const newStatus = mode === "finalize" ? "final" : "verified";
    const { error: rpcError } = await supabase.rpc("apply_derived_stats", {
      p_game_id: game_id,
      p_home_score: homeScore,
      p_away_score: awayScore,
      p_status: newStatus,
    });

    if (rpcError) {
      return new Response(
        JSON.stringify({ error: `RPC failed: ${rpcError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Refresh season stats
    const competitionId = game.competition_id;
    await supabase.rpc("refresh_season_player_stats", { p_competition_id: competitionId });
    await supabase.rpc("refresh_standings", { p_competition_id: competitionId });

    // Audit log
    await supabase.from("audit_log").insert({
      action: `derive-game:${mode}`,
      entity_type: "game",
      entity_id: game_id,
      payload: { home_score: homeScore, away_score: awayScore },
    });

    return new Response(
      JSON.stringify({ ok: true, home_score: homeScore, away_score: awayScore, warnings }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
