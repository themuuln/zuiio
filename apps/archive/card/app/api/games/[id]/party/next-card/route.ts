/**
 * POST /api/games/[id]/party/next-card
 *
 * Host-only: Advance to the next card in the content queue.
 * Moves from 'drinking' or 'next-round' phase to 'show-card' phase,
 * loads the next card from the content queue, increments round number,
 * and broadcasts the new card via Realtime.
 *
 * Body: (none required)
 *
 * Responses:
 *   200 - Advanced to next card
 *   401 - Missing or invalid session
 *   403 - Not the host
 *   404 - Game session not found
 *   409 - Game is in wrong phase for this action
 *   410 - Game has ended
 */

import { NextRequest, NextResponse } from "next/server";
import { advancePhase } from "@/lib/party-engine";
import type { GameContentEntry } from "@/lib/content";
import type { ContentTier } from "@/lib/content";
import { createClient } from "@/lib/supabase/server";
import {
  validateAuth,
  validateGameSession,
  validateHost,
  validateNotSpectator,
  validatePhase,
  parsePartyState,
  persistPartyState,
  broadcastCardShow,
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

  // ─── Validate game is in appropriate phase ───
  // next-card can be triggered from 'responding' (truth-or-dare: player completed),
  // 'drinking' (after drinking is done), 'next-round' (game phase transition),
  // or 'revealing' (after reveal animation)
  const phaseCheck = validatePhase(partyState, ["responding", "drinking", "next-round", "revealing"]);
  if (phaseCheck instanceof NextResponse) {
    return phaseCheck;
  }

  // ─── First advance to 'next-round' (if needed) ───
  let currentState = partyState;

  if (currentState.phase === "responding" || currentState.phase === "drinking" || currentState.phase === "revealing") {
    const advanceToNextRound = advancePhase(currentState, "next-round");
    if ("error" in advanceToNextRound) {
      return NextResponse.json(
        { error: advanceToNextRound.error },
        { status: 409 }
      );
    }
    currentState = advanceToNextRound;
  }

  // ─── Get the next card from the content queue ───
  const contentQueue = currentState.config._contentQueue as
    | { remaining: Array<{ id: string; category: string }>; recentlyShown: Array<{ id: string; category: string }>; windowSize: number }
    | undefined;

  if (!contentQueue || contentQueue.remaining.length === 0) {
    // Content exhausted — end the game
    return NextResponse.json(
      { error: "No more cards available. Content queue is exhausted." },
      { status: 400 }
    );
  }

  // Fetch the next card content from the DB
  const nextCardItem = contentQueue.remaining[0];
  const supabase = await createClient();
  const { data: cardData } = await supabase
    .from("game_content")
    .select("*")
    .eq("id", nextCardItem.id)
    .maybeSingle();

  if (!cardData) {
    // Card not found in DB — skip it and try next
    const updatedRemaining = contentQueue.remaining.slice(1);
    const updatedQueue = {
      ...contentQueue,
      remaining: updatedRemaining,
    };

    const newState = {
      ...currentState,
      config: {
        ...currentState.config,
        _contentQueue: updatedQueue,
      },
    };

    await persistPartyState(gameSessionId, newState);

    // Try again recursively — but to avoid infinite loops, just skip
    return NextResponse.json({
      success: false,
      error: "Next card not found in database",
      state: newState,
    });
  }

  // Map DB row to GameContentEntry
  const nextCard: GameContentEntry = {
    id: cardData.id,
    gameType: cardData.game_type,
    category: cardData.category,
    tier: cardData.tier as ContentTier,
    text: cardData.text_en,
  };

  // Advance to 'show-card' phase
  const advanceToShowCard = advancePhase(currentState, "show-card");
  if ("error" in advanceToShowCard) {
    return NextResponse.json(
      { error: advanceToShowCard.error },
      { status: 409 }
    );
  }

  // Update the content queue (move card from remaining to recentlyShown)
  const updatedRemaining = contentQueue.remaining.slice(1);
  const nextQueueItem = { id: nextCard.id, category: nextCard.category };
  const updatedRecentlyShown = [nextQueueItem, ...contentQueue.recentlyShown];

  // If recentlyShown exceeds window, recycle oldest
  let recycled: Array<{ id: string; category: string }> = [];
  let finalRecentlyShown = updatedRecentlyShown;
  if (updatedRecentlyShown.length > contentQueue.windowSize) {
    recycled = updatedRecentlyShown.slice(contentQueue.windowSize);
    finalRecentlyShown = updatedRecentlyShown.slice(0, contentQueue.windowSize);
  }

  const finalRemaining = [...updatedRemaining, ...recycled];

  // ─── Rotate active player for turn-based games (truth-or-dare) ───
  let activePlayerId = advanceToShowCard.config.activePlayerId;
  const turnOrder = advanceToShowCard.config.turnOrder;

  if (activePlayerId && turnOrder && turnOrder.length > 0) {
    const currentIndex = turnOrder.indexOf(activePlayerId);
    const nextIndex = (currentIndex + 1) % turnOrder.length;
    activePlayerId = turnOrder[nextIndex];
  }

  const updatedState = {
    ...advanceToShowCard,
    currentCard: nextCard,
    roundNumber: currentState.roundNumber + 1,
    responses: [],
    config: {
      ...advanceToShowCard.config,
      _contentQueue: {
        remaining: finalRemaining,
        recentlyShown: finalRecentlyShown,
        windowSize: contentQueue.windowSize,
      },
      activePlayerId,
    },
  };

  // ─── Persist ───
  const persisted = await persistPartyState(
    gameSessionId,
    updatedState,
    "playing",
    updatedState.roundNumber
  );

  // ─── Broadcast card:show event (next card) ───
  await broadcastCardShow(session.roomId, {
    gameSessionId,
    card: nextCard,
    phase: "show-card",
    roundNumber: updatedState.roundNumber,
    state: updatedState,
  });

  // ─── Broadcast phase:change event ───
  await broadcastPhaseChange(session.roomId, {
    gameSessionId,
    fromPhase: partyState.phase,
    toPhase: "show-card",
    roundNumber: updatedState.roundNumber,
    state: updatedState,
  });

  return NextResponse.json({
    success: true,
    card: nextCard,
    roundNumber: updatedState.roundNumber,
    state: updatedState,
    persisted,
  });
}
