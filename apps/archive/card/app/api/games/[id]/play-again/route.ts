import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createInitialGameState } from "@/lib/game-engine/uno";
import type { Json } from "@/lib/database.types";

// POST /api/games/[id]/play-again — Start a new round with the same players
// Body: { roomCode: string }
// This endpoint:
// 1. Verifies the requester is the host
// 2. Increments the round number
// 3. Uses game engine to deal fresh cards
// 4. Persists new hands via upsert_player_hand RPC
// 5. Updates game session state via update_game_session_state RPC
// 6. Broadcasts the new round
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameSessionId } = await params;

  let body: { roomCode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { roomCode } = body;
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
    .select("id, code, host_session_id, game_state")
    .eq("code", code)
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  // Verify the requester is the host
  if (room.host_session_id !== sessionId) {
    return NextResponse.json(
      { error: "Only the host can start a new round" },
      { status: 403 }
    );
  }

  // Get the current game session
  const { data: session } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("id", gameSessionId)
    .maybeSingle();

  if (!session) {
    return NextResponse.json(
      { error: "Game session not found" },
      { status: 404 }
    );
  }

  // Convert any spectators to players for the new round
  // This ensures spectators who joined mid-game get dealt in
  await supabase
    .from("players")
    .update({ is_spectator: false })
    .eq("room_id", room.id)
    .eq("is_spectator", true);

  // Get all players (now including ex-spectators)
  const { data: players } = await supabase
    .from("players")
    .select("id, session_id, display_name, avatar_emoji, is_host")
    .eq("room_id", room.id)
    .eq("is_spectator", false)
    .order("joined_at", { ascending: true });

  if (!players || players.length < 2) {
    return NextResponse.json(
      { error: "Need at least 2 players" },
      { status: 400 }
    );
  }

  // Get house rules from existing config
  const existingConfig = session.config as Record<string, unknown> ?? {};
  const houseRules: Record<string, unknown> = {};
  if (typeof existingConfig.drawStacking === "boolean") {
    houseRules.drawStacking = existingConfig.drawStacking;
  }
  if (typeof existingConfig.drawUntilYouPlay === "boolean") {
    houseRules.drawUntilYouPlay = existingConfig.drawUntilYouPlay;
  }
  if (typeof existingConfig.turnTimeoutSeconds === "number") {
    houseRules.turnTimeoutSeconds = existingConfig.turnTimeoutSeconds;
  }
  if (typeof existingConfig.winningScore === "number") {
    houseRules.winningScore = existingConfig.winningScore;
  }

  // Increment round number
  const newRoundNumber = (session.round_number ?? 1) + 1;

  // Use game engine to deal fresh cards
  const playerIds = players.map((p) => p.id);
  const gameState = createInitialGameState(houseRules, playerIds);
  // Set the round number
  gameState.roundNumber = newRoundNumber;

  // Get current player (first player)
  const currentPlayerId = gameState.players[gameState.currentPlayerIndex].playerId;
  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  // Persist each player's new hand via upsert_player_hand RPC
  const handPromises = gameState.players.map((p) => {
    return supabase.rpc("upsert_player_hand", {
      p_game_session_id: gameSessionId,
      p_player_id: p.playerId,
      p_cards: JSON.parse(JSON.stringify(p.hand)),
    });
  });

  await Promise.all(handPromises);

  // Build game state config
  const gameConfig = {
    deck: gameState.deck,
    discardPile: gameState.discardPile,
    players: gameState.players,
    currentColor: gameState.currentColor,
    currentPlayerIndex: gameState.currentPlayerIndex,
    direction: gameState.direction,
    pendingDrawCount: gameState.pendingDrawCount,
    status: "playing" as const,
    roundNumber: newRoundNumber,
    turnStartTime: gameState.turnStartTime,
    config: gameState.config,
    winnerId: undefined as string | undefined,
    roomId: room.id,
  };

  // Persist game state via update_game_session_state RPC
  const { error: updateError } = await supabase.rpc(
    "update_game_session_state",
    {
      p_game_session_id: gameSessionId,
      p_config: gameConfig as unknown as Json,
      p_status: "playing",
      p_current_turn_player_id: currentPlayerId,
      p_direction: gameState.direction,
      p_round_number: newRoundNumber,
    }
  );

  if (updateError) {
    console.error("Failed to update game session for new round:", updateError);
  }

  // Broadcast new round to room channel
  try {
    const channel = supabase.channel(`room:${room.id}`, {
      config: { broadcast: { self: false } },
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.send({
          type: "broadcast",
          event: "new_round",
          payload: {
            gameSessionId,
            roundNumber: newRoundNumber,
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
          },
        });
      }
    });
  } catch (broadcastError) {
    console.error("Failed to broadcast new round:", broadcastError);
  }

  // Build response with the current player's hand
  const currentPlayerHand = gameState.players.find(
    (p) => p.playerId === currentPlayerId
  )?.hand ?? [];

  return NextResponse.json({
    success: true,
    gameSessionId,
    roundNumber: newRoundNumber,
    currentPlayerId,
    currentPlayerName: currentPlayer?.display_name,
    currentColor: gameState.currentColor,
    topDiscard: gameState.discardPile[gameState.discardPile.length - 1],
    direction: gameState.direction,
    hand: currentPlayerHand,
    deckCount: gameState.deck.length,
    status: "playing",
    config: gameConfig,
  });
}
