/**
 * POST /api/games/[id]/party/end
 *
 * Host-only: End the current party game session.
 * Sets the game status to 'game_end' in the database, preventing all
 * subsequent game actions (they will return 410 Gone).
 * Broadcasts the game end event via Realtime.
 *
 * Body: (none required)
 *
 * Responses:
 *   200 - Game ended successfully
 *   401 - Missing or invalid session
 *   403 - Not the host
 *   404 - Game session not found
 *   410 - Game has already ended
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";
import {
  validateAuth,
  validateGameSession,
  validateHost,
  validateNotSpectator,
  parsePartyState,
  broadcastGameEnd,
} from "../helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameSessionId } = await params;

  // ─── Validate game session ───
  const sessionResult = await validateGameSession(gameSessionId);
  if (sessionResult instanceof NextResponse) {
    return sessionResult;
  }

  const { session } = sessionResult;

  // ─── Authenticate ───
  const authResult = await validateAuth(request, session.roomId);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { player } = authResult;

  // ─── Host-only check ───
  const hostCheck = validateHost(player);
  if (hostCheck instanceof NextResponse) {
    return hostCheck;
  }

  // ─── Not spectator check ───
  const spectatorCheck = validateNotSpectator(player);
  if (spectatorCheck instanceof NextResponse) {
    return spectatorCheck;
  }

  // ─── Parse current party state (if any) ───
  const partyState = parsePartyState(session.config);

  // ─── Update state to game-end ───
  const supabase = await createClient();
  const endedState = partyState
    ? {
        ...partyState,
        status: "game-end" as const,
        phase: "game-end" as const,
        responses: [],
        timerSeconds: null,
      }
    : null;

  // ─── Persist to database — set status to 'game_end' ───
  const { error: updateError } = await supabase
    .from("game_sessions")
    .update({
      status: "game_end",
      config: (endedState ?? {}) as unknown as Json,
      last_action_at: new Date().toISOString(),
    })
    .eq("id", gameSessionId);

  if (updateError) {
    console.error("Failed to end game session:", updateError.message);
    return NextResponse.json(
      { error: "Failed to end game session" },
      { status: 500 }
    );
  }

  // ─── Clean up room state ───
  // Clear current_game_id and reset game_state so the room is ready
  // for the next game selection
  const { error: roomUpdateError } = await supabase
    .from("rooms")
    .update({
      game_state: "lobby",
      current_game_id: null,
    })
    .eq("id", session.roomId)
    .eq("current_game_id", gameSessionId);

  if (roomUpdateError) {
    console.error("Failed to update room state:", roomUpdateError.message);
    // Non-fatal — game session is still ended
  }

  // ─── Broadcast game:end event ───
  await broadcastGameEnd(session.roomId, {
    gameSessionId,
    reason: "host_ended",
    timestamp: Date.now(),
  });

  return NextResponse.json({
    success: true,
    gameSessionId,
    status: "game_end",
    reason: "host_ended",
  });
}
