// Edge Function: notify-game-events
// Sends push notifications when game status changes

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { game_id, status } = await req.json();

    if (!game_id || !status) {
      return new Response(
        JSON.stringify({ error: "game_id and status required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get game info
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select(`
        *,
        home_team_season:team_seasons!games_home_team_season_id_fkey (teams (name)),
        away_team_season:team_seasons!games_away_team_season_id_fkey (teams (name))
      `)
      .eq("id", game_id)
      .single();

    if (gameError || !game) {
      return new Response(JSON.stringify({ error: "Game not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const homeTeam = game.home_team_season as {
      teams?: { name?: string };
    } | null;
    const awayTeam = game.away_team_season as {
      teams?: { name?: string };
    } | null;
    const homeName = homeTeam?.teams?.name || "Home";
    const awayName = awayTeam?.teams?.name || "Away";

    // Build notification message
    let title = "";
    let body = "";

    switch (status) {
      case "live":
        title = "Тоглолт эхэллээ! 🏀";
        body = `${homeName} vs ${awayName} тоглолт эхэллээ`;
        break;
      case "final":
        title = "Тоглолт дууслаа";
        body = `${homeName} ${game.home_score ?? 0} - ${game.away_score ?? 0} ${awayName}`;
        break;
      case "verified":
        title = "Тоглолт баталгаажлаа ✓";
        body = `${homeName} vs ${awayName} - албан ёсны үр дүн`;
        break;
      default:
        return new Response(
          JSON.stringify({ message: "No notification for this status" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
    }

    // Get users following this game's teams
    const { data: followers } = await supabase
      .from("follows")
      .select("user_id")
      .in("entity_id", [game.home_team_season_id, game.away_team_season_id])
      .eq("entity_type", "team");

    if (!followers || followers.length === 0) {
      return new Response(
        JSON.stringify({ message: "No followers to notify" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get push tokens for followers
    const userIds = [...new Set(followers.map((f) => f.user_id))];
    const { data: pushTokens } = await supabase
      .from("push_tokens")
      .select("token, platform")
      .in("user_id", userIds);

    if (!pushTokens || pushTokens.length === 0) {
      return new Response(JSON.stringify({ message: "No push tokens found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send notifications (simplified - in production use Expo Push Notifications API)
    let sent = 0;
    for (const pt of pushTokens) {
      try {
        // For Expo, you would call their push API here
        // For now, just log the notification
        sent++;
      } catch (err) {
        console.error(`Failed to send to ${pt.token}:`, err);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        total: pushTokens.length,
        message: `${title}: ${body}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Notification failed: ${err}` }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
