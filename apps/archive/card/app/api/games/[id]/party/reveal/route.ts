/**
 * POST /api/games/[id]/party/reveal
 *
 * Host-only: Trigger reveal of current round results.
 * Computes tallies from accumulated responses, advances the phase from
 * 'responding' to 'revealing', and broadcasts the results via Realtime.
 *
 * Body: (none required)
 *
 * Responses:
 *   200 - Reveal triggered, tallies returned
 *   401 - Missing or invalid session
 *   403 - Not the host
 *   404 - Game session not found
 *   409 - Game is not in 'responding' phase
 *   410 - Game has ended
 */

import { NextRequest, NextResponse } from "next/server";
import { advancePhase, computeReveal } from "@/lib/party-engine";
import type { RevealPlayerEntry } from "@/lib/party-engine/realtime";
import {
  validateAuth,
  validateGameSession,
  validateHost,
  validateNotSpectator,
  validatePhase,
  parsePartyState,
  persistPartyState,
  broadcastRevealResults,
  broadcastPhaseChange,
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

  // ─── Compute reveal tallies ───
  const revealResult = computeReveal(partyState);

  // ─── Advance phase to 'revealing' ───
  const advancedResult = advancePhase(partyState, "revealing");
  if ("error" in advancedResult) {
    return NextResponse.json(
      { error: advancedResult.error },
      { status: 409 }
    );
  }

  const updatedState = advancedResult;

  // ─── Persist ───
  const persisted = await persistPartyState(gameSessionId, updatedState);

  // ─── Build reveal:results payload ───
  const responsesArray = partyState.responses.map(
    (r): RevealPlayerEntry => ({
      playerId: r.playerId,
      playerName: r.playerName,
      value: r.value,
    })
  );

  const revealResponses = updatedState.responses.map(
    (r): RevealPlayerEntry => ({
      playerId: r.playerId,
      playerName: r.playerName,
      value: r.value,
    })
  );

  // ─── Broadcast reveal:results event ───
  await broadcastRevealResults(session.roomId, {
    gameSessionId,
    counts: revealResult.counts,
    totalResponses: revealResult.totalResponses,
    breakdown: (revealResult.breakdown ?? []).map((b) => ({
      value: b.value,
      count: b.count,
      players: b.players?.map((p) => ({
        playerId: p.playerId ?? "",
        playerName: p.playerName ?? "",
        value: p.playerName ?? "",
      })) ?? [],
    })),
    responses: revealResponses,
    reveal: revealResult as unknown as Record<string, unknown>,
    state: updatedState,
  });

  // ─── Broadcast phase:change event (responding → revealing) ───
  await broadcastPhaseChange(session.roomId, {
    gameSessionId,
    fromPhase: "responding",
    toPhase: "revealing",
    roundNumber: updatedState.roundNumber,
    state: updatedState,
  });

  // ─── Advance to 'drinking' phase ───
  // After broadcasting reveal results, transition from 'revealing' to 'drinking'
  // so the client can show drinking prompts. This completes the NHIE game flow:
  // show-card → responding → revealing → drinking → next-round
  const drinkingStateResult = advancePhase(updatedState, "drinking");
  if ("error" in drinkingStateResult) {
    // Non-fatal: reveal has already been broadcast successfully.
    // If phase transition fails, the client-side inDrinkingPhase fallback
    // will handle the UI transition, and polling will eventually catch up.
    console.error(
      "Failed to advance to drinking phase after reveal:",
      drinkingStateResult.error
    );
  } else {
    // ─── Persist drinking state ───
    const drinkingPersisted = await persistPartyState(
      gameSessionId,
      drinkingStateResult
    );

    // ─── Broadcast phase:change (revealing → drinking) ───
    await broadcastPhaseChange(session.roomId, {
      gameSessionId,
      fromPhase: "revealing",
      toPhase: "drinking",
      roundNumber: drinkingStateResult.roundNumber,
      state: drinkingStateResult,
    });

    return NextResponse.json({
      success: true,
      reveal: revealResult,
      state: drinkingStateResult,
      persisted: drinkingPersisted,
    });
  }

  return NextResponse.json({
    success: true,
    reveal: revealResult,
    state: updatedState,
    persisted,
  });
}
