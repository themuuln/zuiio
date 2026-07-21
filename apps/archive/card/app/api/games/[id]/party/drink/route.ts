/**
 * POST /api/games/[id]/party/drink
 *
 * Record a drink action for a player during the game.
 * Uses the drinking engine to validate and apply the action.
 * Supports: sip, shot, assign, waterfall, group-shot.
 *
 * Body: { playerId: string, action: DrinkAction, targetPlayerId?: string }
 *
 * Responses:
 *   200 - Drink action recorded
 *   400 - Missing fields, invalid action, or limit reached
 *   401 - Missing or invalid session
 *   403 - Spectator cannot drink
 *   404 - Game session not found
 *   409 - Game is not in a phase that allows drinking
 *   410 - Game has ended
 */

import { NextRequest, NextResponse } from "next/server";
import {
  applyDrinkAction,
  createDrinkingState,
  getDrinkCount,
} from "@/lib/party-engine/drinking";
import type { DrinkAction } from "@/lib/constants";
import {
  validateAuth,
  validateGameSession,
  validateNotSpectator,
  parsePartyState,
  persistPartyState,
  broadcastDrinkingPrompt,
} from "../helpers";

const VALID_DRINK_ACTIONS = ["sip", "shot", "assign", "waterfall", "group-shot"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameSessionId } = await params;

  // ─── Parse body ───
  let body: { playerId?: string; action?: string; targetPlayerId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { playerId, action, targetPlayerId } = body;

  // ─── Validate required fields ───
  if (!playerId) {
    return NextResponse.json(
      { error: "playerId is required" },
      { status: 400 }
    );
  }

  if (!action || !VALID_DRINK_ACTIONS.includes(action)) {
    return NextResponse.json(
      {
        error: `Invalid drink action. Must be one of: ${VALID_DRINK_ACTIONS.join(", ")}`,
        validActions: VALID_DRINK_ACTIONS,
      },
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

  // ─── Not spectator check ───
  const spectatorCheck = validateNotSpectator(player);
  if (spectatorCheck instanceof NextResponse) {
    return spectatorCheck;
  }

  // ─── Verify playerId matches authenticated player ───
  if (player.id !== playerId) {
    return NextResponse.json(
      { error: "Player ID does not match authenticated player" },
      { status: 403 }
    );
  }

  // ─── Parse current party state ───
  const partyState = parsePartyState(session.config);
  if (!partyState) {
    return NextResponse.json(
      { error: "Game session is not in a valid party game state" },
      { status: 400 }
    );
  }

  // ─── Check drinking is enabled ───
  if (!partyState.config.drinkingEnabled) {
    return NextResponse.json(
      { error: "Drinking is disabled for this game session" },
      { status: 400 }
    );
  }

  // ─── Drinking state in config ───
  const existingState = partyState.config._drinkingState;
  const drinkingState = existingState
    ? {
        roundRecords: existingState.roundRecords,
        cumulativeRecords: existingState.cumulativeRecords,
        penaltyPoints: existingState.penaltyPoints,
        roundNumber: existingState.roundNumber,
        passes: existingState.passes,
      }
    : createDrinkingState(partyState.roundNumber);

  const drinkingConfig = {
    maxDrinksPerRound: partyState.config.maxDrinksPerRound,
    drinkingEnabled: partyState.config.drinkingEnabled,
  };

  // ─── Apply drink action ───
  const result = applyDrinkAction(
    drinkingState,
    drinkingConfig,
    action as DrinkAction,
    playerId,
    targetPlayerId
  );

  if (!result.success) {
    const status = result.limitReached ? 400 : 400;
    return NextResponse.json(
      {
        error: result.error ?? "Drink action failed",
        limitReached: result.limitReached,
      },
      { status }
    );
  }

  // ─── Get updated drink counts ───
  const drinkCount = getDrinkCount(result.state, playerId);

  // ─── Update party state with new drinking state ───
  const updatedState = {
    ...partyState,
    config: {
      ...partyState.config,
      _drinkingState: result.state,
    },
  };

  // ─── Persist ───
  const persisted = await persistPartyState(gameSessionId, updatedState);

  // ─── Broadcast drinking:prompt event ───
  await broadcastDrinkingPrompt(session.roomId, {
    gameSessionId,
    playerId,
    action: action as import("@/lib/constants").DrinkAction,
    targetPlayerId: targetPlayerId ?? null,
    drinkCount,
    limitReached: result.limitReached ?? false,
    timestamp: Date.now(),
  });

  return NextResponse.json({
    success: true,
    action,
    playerId,
    targetPlayerId: targetPlayerId ?? null,
    drinkCount,
    state: updatedState,
    persisted,
  });
}
