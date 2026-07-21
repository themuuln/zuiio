/**
 * POST /api/games/[id]/party/respond
 *
 * Submit a player's response to the current card/question.
 * Validates the player is in the room and the game is in 'responding' phase.
 * Duplicate responses from the same player overwrite the previous one (200 OK).
 *
 * Body: { playerId: string, playerName: string, value: string | number | boolean }
 *
 * Responses:
 *   200 - Response recorded (or updated if duplicate)
 *   400 - Missing playerId or value
 *   401 - Missing or invalid session
 *   403 - Spectator cannot respond
 *   404 - Game session not found
 *   409 - Game is not in 'responding' phase (VAL-CROSS-014)
 *   410 - Game has ended
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  validateAuth,
  validateGameSession,
  validateNotSpectator,
  validatePhase,
  parsePartyState,
  persistPartyState,
  broadcastResponsesTally,
} from "../helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameSessionId } = await params;

  // ─── Parse body ───
  let body: { playerId?: string; playerName?: string; value?: string | number | boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { playerId, playerName, value } = body;

  // ─── Validate required fields ───
  if (!playerId) {
    return NextResponse.json(
      { error: "playerId is required" },
      { status: 400 }
    );
  }

  if (value === undefined || value === null) {
    return NextResponse.json(
      { error: "value is required" },
      { status: 400 }
    );
  }

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

  // ─── Check not spectator ───
  const spectatorCheck = validateNotSpectator(player);
  if (spectatorCheck instanceof NextResponse) {
    return spectatorCheck;
  }

  // ─── Parse current party state ───
  const partyState = parsePartyState(session.config);
  if (!partyState) {
    return NextResponse.json(
      { error: "Game session is not in a valid party game state" },
      { status: 400 }
    );
  }

  // ─── Validate game is in 'responding' phase ───
  const phaseCheck = validatePhase(partyState, ["responding"]);
  if (phaseCheck instanceof NextResponse) {
    return phaseCheck;
  }

  // ─── Verify player is in the room ───
  // We already validated the player's session belongs to the room via validateAuth
  // Now check playerId matches the authenticated player
  if (player.id !== playerId) {
    return NextResponse.json(
      { error: "Player ID does not match authenticated player" },
      { status: 403 }
    );
  }

  // ─── Create or overwrite response (dedup) ───
  const displayName = playerName || player.displayName;
  const timestamp = Date.now();

  // Check if player already submitted a response this round
  const existingIndex = partyState.responses.findIndex(
    (r) => r.playerId === playerId
  );

  const updatedResponses = [...partyState.responses];

  if (existingIndex >= 0) {
    // Overwrite existing response
    updatedResponses[existingIndex] = {
      playerId,
      playerName: displayName,
      value,
      timestamp,
    };
  } else {
    // Add new response
    updatedResponses.push({
      playerId,
      playerName: displayName,
      value,
      timestamp,
    });
  }

  // ─── Update state ───
  const updatedState = {
    ...partyState,
    responses: updatedResponses,
  };

  // ─── Persist ───
  const persisted = await persistPartyState(gameSessionId, updatedState);

  // ─── Get total player count for tally ───
  let totalPlayers = 0;
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("players")
      .select("id", { count: "exact", head: true })
      .eq("room_id", session.roomId)
      .eq("is_spectator", false);
    totalPlayers = count ?? 0;
  } catch {
    // Non-fatal — tally still works without total
  }

  // ─── Broadcast responses:tally event ───
  await broadcastResponsesTally(session.roomId, {
    gameSessionId,
    responseCount: updatedResponses.length,
    totalPlayers,
    respondentId: playerId,
    respondentName: displayName,
    duplicate: existingIndex >= 0,
    timestamp,
  });

  return NextResponse.json({
    success: true,
    duplicate: existingIndex >= 0,
    responseCount: updatedResponses.length,
    state: updatedState,
    persisted,
  });
}
