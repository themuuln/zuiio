import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createInitialGameState } from "@/lib/game-engine/uno";
import type { Json } from "@/lib/database.types";

// POST /api/games — Start a game session for a room
// Body: { roomCode: string, houseRules?: object }
// This endpoint:
// 1. Uses start_game SECURITY DEFINER RPC to create the game session
// 2. Gets all non-spectator players
// 3. Deals cards using the game engine
// 4. Persists each player's hand via upsert_player_hand RPC
// 5. Persists game state via update_game_session_state RPC
// 6. Broadcasts via Realtime
export async function POST(request: NextRequest) {
  let body: { roomCode?: string; houseRules?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { roomCode, houseRules } = body;
  if (!roomCode || typeof roomCode !== "string" || !/^[A-Z]{4}$/i.test(roomCode)) {
    return NextResponse.json(
      { error: "Invalid room code" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const sessionId = request.cookies.get("session_id")?.value;

  if (!sessionId) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const code = roomCode.toUpperCase();

  // Get the room
  const { data: room } = await supabase
    .from("rooms")
    .select("id, code, host_session_id, game_state, current_game_id")
    .eq("code", code)
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  // Verify the requester is the host
  if (room.host_session_id !== sessionId) {
    return NextResponse.json(
      { error: "Only the host can start the game" },
      { status: 403 }
    );
  }

  // Get all non-spectator players in the room
  const { data: players } = await supabase
    .from("players")
    .select("id, session_id, display_name, avatar_emoji, is_host")
    .eq("room_id", room.id)
    .eq("is_spectator", false)
    .order("joined_at", { ascending: true });

  if (!players || players.length < 2) {
    return NextResponse.json(
      { error: "Need at least 2 players to start" },
      { status: 400 }
    );
  }

  // Check if there's an existing game session (e.g., from picker/confirm or mutual match)
  const existingSessionGameId = room.current_game_id;
  let mergedHouseRules = houseRules ?? {};

  if (existingSessionGameId) {
    // Try to get the existing session's config for house rules
    const { data: existingSession } = await supabase
      .from("game_sessions")
      .select("config")
      .eq("id", existingSessionGameId)
      .maybeSingle();

    if (existingSession?.config) {
      const existingConfig = existingSession.config as Record<string, unknown>;
      // Merge house rules with existing config (client rules take precedence)
      mergedHouseRules = {
        ...existingConfig,
        ...(houseRules ?? {}),
      };
    }
  }

  // Use start_game RPC (SECURITY DEFINER) to create the game session and update room
  let gameSessionId = "";
  
  const { data: startGameResult, error: startGameError } = await supabase.rpc(
    "start_game",
    {
      p_room_id: room.id,
      p_game_type: "uno",
      p_config: mergedHouseRules as unknown as Json,
    }
  );

  if (startGameError) {
    console.error("Failed to start game via RPC:", startGameError);
    // Fallback: use create_game_session RPC instead (which works)
    console.log("Falling back to create_game_session RPC...");
    
    const { data: fallbackResult, error: fallbackError } = await supabase.rpc(
      "create_game_session",
      {
        p_room_id: room.id,
        p_game_type: "uno",
        p_status: "playing",
      }
    );

    if (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
      return NextResponse.json(
        { error: "Failed to start game" },
        { status: 500 }
      );
    }

    const fallbackData =
      typeof fallbackResult === "string"
        ? JSON.parse(fallbackResult)
        : fallbackResult;

    gameSessionId = fallbackData.id ?? "";

    // Update room state to playing
    await supabase
      .from("rooms")
      .update({ game_state: "playing", current_game_id: gameSessionId })
      .eq("id", room.id);
  } else {
    const startData =
      typeof startGameResult === "string"
        ? JSON.parse(startGameResult)
        : startGameResult;

    gameSessionId = startData.game_session_id ?? "";
  }

  // Use the game engine to deal cards
  const playerIds = players.map((p) => p.id);
  const gameState = createInitialGameState(mergedHouseRules as Record<string, boolean> || {}, playerIds);

  // Get the current player's info (the first player)
  const currentPlayerId = gameState.players[gameState.currentPlayerIndex].playerId;
  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  // Persist each player's hand to player_hands table via upsert_player_hand RPC (SECURITY DEFINER)
  const handPromises = gameState.players.map((p) => {
    return supabase.rpc("upsert_player_hand", {
      p_game_session_id: gameSessionId,
      p_player_id: p.playerId,
      p_cards: JSON.parse(JSON.stringify(p.hand)),
    });
  });

  const handResults = await Promise.all(handPromises);
  const handErrors = handResults.filter((r) => r.error);
  if (handErrors.length > 0) {
    console.error("Failed to persist some player hands:", handErrors);
    // Non-fatal — game can still proceed
  }

  // Build game state config to persist in game_sessions.config
  const gameConfig = {
    deck: gameState.deck,
    discardPile: gameState.discardPile,
    currentColor: gameState.currentColor,
    currentPlayerIndex: gameState.currentPlayerIndex,
    direction: gameState.direction,
    pendingDrawCount: gameState.pendingDrawCount,
    status: gameState.status,
    roundNumber: gameState.roundNumber,
    turnStartTime: gameState.turnStartTime,
    config: gameState.config,
    winnerId: gameState.winnerId,
    roomId: room.id,
    players: gameState.players,
  };

  // Persist game state config via update_game_session_state RPC (SECURITY DEFINER)
  const { error: updateSessionError } = await supabase.rpc(
    "update_game_session_state",
    {
      p_game_session_id: gameSessionId,
      p_config: gameConfig as unknown as Json,
      p_status: "playing",
      p_current_turn_player_id: currentPlayerId,
      p_direction: gameState.direction,
      p_round_number: gameState.roundNumber,
    }
  );

  if (updateSessionError) {
    console.error("Failed to persist game session state:", updateSessionError);
    // Non-fatal
  }

  // Also store the game config in player_hands as a special "_config" player entry
  // This makes the game state accessible to all players via the player_hands table
  await supabase.rpc("upsert_player_hand", {
    p_game_session_id: gameSessionId,
    p_player_id: "_config",
    p_cards: JSON.parse(JSON.stringify(gameConfig)),
  });

  // Broadcast game start to the room channel
  try {
    const channel = supabase.channel(`room:${room.id}`, {
      config: { broadcast: { self: false } },
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.send({
          type: "broadcast",
          event: "game_started",
          payload: {
            gameSessionId,
            gameType: "uno",
            players: players.map((p) => ({
              id: p.id,
              displayName: p.display_name,
              avatarEmoji: p.avatar_emoji,
              isHost: p.is_host,
              cardCount: 7,
            })),
            currentPlayerId,
            currentPlayerName: currentPlayer?.display_name,
            currentColor: gameState.currentColor,
            topDiscard: gameState.discardPile[gameState.discardPile.length - 1],
            direction: gameState.direction,
            roundNumber: 1,
          },
        });
      }
    });
  } catch (broadcastError) {
    console.error("Failed to broadcast game start:", broadcastError);
  }

  // Build response
  const currentPlayerHand = gameState.players.find(
    (p) => p.playerId === currentPlayerId
  )?.hand ?? [];

  return NextResponse.json({
    roomId: room.id,
    gameSessionId,
    gameType: "uno",
    players: players.map((p) => ({
      id: p.id,
      displayName: p.display_name,
      avatarEmoji: p.avatar_emoji,
      isHost: p.is_host,
    })),
    currentPlayerId,
    currentPlayerName: currentPlayer?.display_name,
    currentColor: gameState.currentColor,
    topDiscard: gameState.discardPile[gameState.discardPile.length - 1],
    direction: gameState.direction,
    roundNumber: 1,
    hand: currentPlayerHand,
    deckCount: gameState.deck.length,
    status: "playing",
    config: { ...gameConfig, roomId: room.id },
    persisted: true,
  });
}
