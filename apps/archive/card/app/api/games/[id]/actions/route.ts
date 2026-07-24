import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  playCard,
  drawCard,
  isValidPlay,
  calculateRoundScores,
  callUno,
  handleTimeout,
} from "@/lib/game-engine/uno";
import type { CardColor, GameState } from "@/lib/game-engine/types";
import type { Json } from "@/lib/database.types";

const TIMEOUT_SECONDS = 60;

// ─── In-memory deduplication cache ───
// Tracks recently processed action fingerprints to prevent duplicate
// processing when clients rapidly fire the same action (double-click).
// Entries expire after 5 seconds.
const recentActionCache = new Map<string, number>();

function isDuplicateAction(fingerprint: string): boolean {
  const now = Date.now();
  const lastSeen = recentActionCache.get(fingerprint);

  if (lastSeen && now - lastSeen < 5000) {
    return true; // Duplicate — same action processed within 5 seconds
  }

  // Not a duplicate — update the cache
  recentActionCache.set(fingerprint, now);

  // Periodic cleanup to prevent memory leak
  if (recentActionCache.size > 1000) {
    const cutoff = now - 10000;
    for (const [key, timestamp] of recentActionCache.entries()) {
      if (timestamp < cutoff) {
        recentActionCache.delete(key);
      }
    }
  }

  return false;
}

function buildActionFingerprint(body: {
  action?: string;
  playerId?: string;
  cardIndex?: number;
}): string {
  // For play_card: unique per (gameSessionId, action, playerId, cardIndex)
  // For draw_card: unique per (gameSessionId, action, playerId) within a short window
  // For call_uno / catch_uno: unique per (gameSessionId, action, playerId, targetPlayerId?)
  return `${body.action}:${body.playerId}:${body.cardIndex ?? "none"}`;
}

// POST /api/games/[id]/actions — Perform a game action
// Body: {
//   action: "play_card" | "draw_card" | "call_uno" | "catch_uno",
//   playerId: string,
//   cardIndex?: number,
//   chosenColor?: CardColor,
//   targetPlayerId?: string,   // For catch_uno
//   gameState: GameState       // Current game state from client
// }
//
// This endpoint:
// 1. Checks for duplicate actions (double-click prevention)
// 2. Checks if the current turn has timed out (auto-draws + passes turn)
// 3. Validates the action using the game engine
// 4. Persists via SECURITY DEFINER RPCs
// 5. Broadcasts via Realtime
// 6. Returns the updated game state
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameSessionId } = await params;

  let body: {
    action?: string;
    playerId?: string;
    cardIndex?: number;
    chosenColor?: string;
    targetPlayerId?: string;
    gameState?: GameState;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { action, playerId, cardIndex, chosenColor, targetPlayerId, gameState } = body;

  if (!action || !["play_card", "draw_card", "call_uno", "catch_uno"].includes(action)) {
    return NextResponse.json(
      { error: "Invalid action. Must be 'play_card', 'draw_card', 'call_uno', or 'catch_uno'" },
      { status: 400 }
    );
  }

  if (!playerId || typeof playerId !== "string") {
    return NextResponse.json(
      { error: "Player ID is required" },
      { status: 400 }
    );
  }

  if (!gameState) {
    return NextResponse.json(
      { error: "Game state is required" },
      { status: 400 }
    );
  }

  // ─── Check if game is paused ───
  // When paused, all game actions are rejected
  if (gameState.status === "paused") {
    return NextResponse.json(
      { error: "Game is paused. Wait for the host to resume." },
      { status: 403 }
    );
  }

  // ─── Double-click / duplicate action prevention ───
  // Build a fingerprint of this action and check if we've processed it recently.
  // This prevents the same card from being played twice when a user double-clicks.
  const fingerprint = buildActionFingerprint(body);
  if (isDuplicateAction(fingerprint)) {
    return NextResponse.json(
      { error: "Duplicate action detected", duplicate: true },
      { status: 429 }
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

  // Verify the player is in the game
  const playerExists = gameState.players.some((p) => p.playerId === playerId);
  if (!playerExists) {
    return NextResponse.json(
      { error: "Player not found in game" },
      { status: 404 }
    );
  }

  // ─── Check for turn timeout and disconnected players ───
  // Before processing any action, check if the current turn has timed out.
  // If so, auto-draw a card and pass the turn.
  // Also marks players as disconnected if no activity for 2+ turns.
  let currentState = gameState;
  const { data: sessionData } = await supabase
    .from("game_sessions")
    .select("last_action_at")
    .eq("id", gameSessionId)
    .maybeSingle();

  if (sessionData?.last_action_at) {
    const lastActionTime = new Date(sessionData.last_action_at).getTime();
    const elapsed = Date.now() - lastActionTime;

    // Only auto-handle timeout for play_card and draw_card actions
    // (call_uno and catch_uno are always allowed)
    if (elapsed > TIMEOUT_SECONDS * 1000 && !["call_uno", "catch_uno"].includes(action)) {
      // Check if the current turn player is the one who timed out
      const currentTurnPlayer = currentState.players[currentState.currentPlayerIndex];
      if (currentTurnPlayer && currentTurnPlayer.playerId !== playerId) {
        // The current turn has timed out — auto-handle it
        const timeoutState = handleTimeout(currentState, currentTurnPlayer.playerId);
        if (timeoutState !== currentState) {
          currentState = timeoutState;

          // Record the timeout move
          await supabase.rpc("record_game_move", {
            p_game_session_id: gameSessionId,
            p_player_id: currentTurnPlayer.playerId,
            p_move_type: "timeout",
            p_card_played: null,
            p_round_number: currentState.roundNumber,
          });
        }
      }
    }

    // If the current turn has been idle for more than 2x the timeout,
    // mark the current player as disconnected in the players table
    if (elapsed > TIMEOUT_SECONDS * 1000 * 2) {
      const currentTurnPlayer = currentState.players[currentState.currentPlayerIndex];
      if (currentTurnPlayer) {
        await supabase
          .from("players")
          .update({ disconnected_at: new Date().toISOString() })
          .eq("id", currentTurnPlayer.playerId)
          .is("disconnected_at", null);
      }
    }
  }

  // Validate it's the player's turn
  // (call_uno and catch_uno are exempt — players can call UNO or catch
  //  at any point before the next player starts their turn)
  const currentPlayer = currentState.players[currentState.currentPlayerIndex];
  if (
    currentPlayer.playerId !== playerId &&
    action !== "catch_uno" &&
    action !== "call_uno"
  ) {
    return NextResponse.json(
      { error: "Not your turn" },
      { status: 403 }
    );
  }

  // Validate chosen color for wild cards
  const validColors: CardColor[] = ["red", "blue", "green", "yellow"];
  if (
    chosenColor &&
    !validColors.includes(chosenColor as CardColor)
  ) {
    return NextResponse.json(
      { error: "Invalid color choice. Must be red, blue, green, or yellow" },
      { status: 400 }
    );
  }

  let result: GameState;
  let moveType: string;
  let playedCardValue: string | undefined;

  switch (action) {
    case "play_card": {
      if (cardIndex === undefined || cardIndex === null) {
        return NextResponse.json(
          { error: "Card index is required for play_card action" },
          { status: 400 }
        );
      }

      // Validate the card index is in range
      if (cardIndex < 0 || cardIndex >= currentPlayer.hand.length) {
        return NextResponse.json(
          { error: "Invalid card index" },
          { status: 400 }
        );
      }

      const card = currentPlayer.hand[cardIndex];

      // Check if this is a wild card that needs a color choice
      if (
        (card.value === "wild" || card.value === "wild4") &&
        !chosenColor
      ) {
        return NextResponse.json(
          { error: "Must choose a color for wild cards" },
          { status: 400 }
        );
      }

      // Validate the play is legal
      const topDiscard = currentState.discardPile[currentState.discardPile.length - 1];
      if (!isValidPlay(card, topDiscard, currentState.currentColor)) {
        return NextResponse.json(
          {
            error: "Invalid play",
            reason: "Card does not match color or value",
          },
          { status: 400 }
        );
      }

      // Execute the play using the game engine
      const playResult = playCard(
        currentState,
        playerId,
        cardIndex,
        chosenColor as CardColor | undefined
      );

      if (playResult.error) {
        return NextResponse.json(
          { error: playResult.error },
          { status: 400 }
        );
      }

      result = playResult.state;
      moveType = "play_card";
      playedCardValue = card.value;
      break;
    }

    case "draw_card": {
      const drawResult = drawCard(currentState, playerId);

      if (drawResult.error) {
        return NextResponse.json(
          { error: drawResult.error },
          { status: 400 }
        );
      }

      result = drawResult.state;
      moveType = "draw_card";
      break;
    }

    case "call_uno": {
      // Player is calling UNO for themselves
      const unoResult = callUno(currentState, playerId);

      if (!unoResult.state.players.find((p) => p.playerId === playerId)?.calledUno) {
        return NextResponse.json(
          { error: "Cannot call UNO when you have more than 1 card" },
          { status: 400 }
        );
      }

      result = unoResult.state;
      moveType = "call_uno";
      break;
    }

    case "catch_uno": {
      // A player catches another player for not calling UNO
      if (!targetPlayerId) {
        return NextResponse.json(
          { error: "Target player ID is required for catch_uno" },
          { status: 400 }
        );
      }

      const catchResult = callUno(currentState, playerId, targetPlayerId);

      if (!catchResult.penaltyApplied) {
        return NextResponse.json(
          { error: "Cannot catch: player has already called UNO or has more than 1 card" },
          { status: 400 }
        );
      }

      result = catchResult.state;
      moveType = "catch_uno";
      break;
    }

    default:
      return NextResponse.json(
        { error: "Invalid action type" },
        { status: 400 }
      );
  }

  // ─── Persist the move via record_game_move RPC (SECURITY DEFINER) ───
  const { error: moveError } = await supabase.rpc("record_game_move", {
    p_game_session_id: gameSessionId,
    p_player_id: playerId,
    p_move_type: moveType,
    p_card_played: playedCardValue ? { value: playedCardValue, color: chosenColor ?? null } : null,
    p_round_number: result.roundNumber,
  });

  if (moveError) {
    console.error("Failed to record game move:", moveError);
    // Non-fatal
  }

  // ─── Persist all player hands via upsert_player_hand RPC (SECURITY DEFINER) ───
  const handPromises = result.players.map((p) => {
    return supabase.rpc("upsert_player_hand", {
      p_game_session_id: gameSessionId,
      p_player_id: p.playerId,
      p_cards: JSON.parse(JSON.stringify(p.hand)),
    });
  });

  await Promise.all(handPromises);

  // ─── Persist game state config via update_game_session_state RPC ───
  const gameConfig = {
    deck: result.deck,
    discardPile: result.discardPile,
    players: result.players,
    currentColor: result.currentColor,
    currentPlayerIndex: result.currentPlayerIndex,
    direction: result.direction,
    pendingDrawCount: result.pendingDrawCount,
    status: result.status,
    roundNumber: result.roundNumber,
    turnStartTime: result.turnStartTime,
    config: result.config,
    winnerId: result.winnerId,
  };

  const { error: updateSessionError } = await supabase.rpc(
    "update_game_session_state",
    {
      p_game_session_id: gameSessionId,
      p_config: gameConfig as unknown as Json,
      p_status: result.status,
      p_current_turn_player_id: result.players[result.currentPlayerIndex]?.playerId ?? null,
      p_direction: result.direction,
      p_round_number: result.roundNumber,
      p_last_action_at: new Date().toISOString(),
    }
  );

  if (updateSessionError) {
    console.error("Failed to update game session state:", updateSessionError);
  }

  // ─── If round ended, record scores via record_round_score RPC ───
  if (result.status === "round_end" && result.winnerId) {
    const roundScores = calculateRoundScores(result);

    const scorePromises = Object.entries(roundScores).map(
      ([pid, points]) => {
        return supabase.rpc("record_round_score", {
          p_game_session_id: gameSessionId,
          p_player_id: pid,
          p_round_number: result.roundNumber,
          p_points_scored: points,
          p_is_winner: pid === result.winnerId,
        });
      }
    );

    const scoreResults = await Promise.all(scorePromises);
    const scoreErrors = scoreResults.filter((r) => r.error);
    if (scoreErrors.length > 0) {
      console.error("Failed to record some scores:", scoreErrors);
    }
  }

  // ─── Broadcast the action to the room channel ───
  let roomId: string | null = null;
  try {
    const { data: sessions } = await supabase
      .from("game_sessions")
      .select("room_id")
      .eq("id", gameSessionId)
      .maybeSingle();

    roomId = sessions?.room_id ?? null;

    if (roomId) {
      const broadcastChannel = supabase.channel(`room:${roomId}`, {
        config: { broadcast: { self: false } },
      });

      broadcastChannel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Send the game action broadcast
          broadcastChannel.send({
            type: "broadcast",
            event: "game_action",
            payload: {
              action: moveType,
              playerId,
              gameSessionId,
              gameState: result,
              timestamp: Date.now(),
            },
          });

          // If round ended, send a round_ended event for the scores page
          if (result.status === "round_end") {
            broadcastChannel.send({
              type: "broadcast",
              event: "round_ended",
              payload: {
                gameSessionId,
                roundNumber: result.roundNumber,
                winnerId: result.winnerId,
                timestamp: Date.now(),
              },
            });
          }
        }
      });
    }
  } catch (broadcastError) {
    console.error("Failed to broadcast game action:", broadcastError);
    // Non-fatal — state is still returned in the response
  }

  return NextResponse.json({
    success: true,
    action: moveType,
    playerId,
    gameState: result,
    currentPlayerId: result.players[result.currentPlayerIndex].playerId,
    currentColor: result.currentColor,
    topDiscard: result.discardPile[result.discardPile.length - 1],
    status: result.status,
    winnerId: result.winnerId,
    deckCount: result.deck.length,
    persisted: true,
  });
}
