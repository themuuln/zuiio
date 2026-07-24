/**
 * POST /api/games/[id]/party/skip
 *
 * Host-only: Skip the current card and advance to the next one.
 * Clears all pending responses for the skipped card, discards the current
 * card (adds it back to the recently shown list to prevent immediate repeat),
 * loads the next card from the content queue, and increments the round number.
 *
 * Body: (none required)
 *
 * Responses:
 *   200 - Card skipped, advanced to next
 *   401 - Missing or invalid session
 *   403 - Not the host
 *   404 - Game session not found
 *   409 - Game is in wrong phase for this action
 *   410 - Game has ended
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { GameContentEntry } from "@/lib/content";
import type { ContentTier } from "@/lib/content";
import {
  validateAuth,
  validateGameSession,
  validateHost,
  validateNotSpectator,
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

  // ─── Get the content queue ───
  const contentQueue = partyState.config._contentQueue as
    | { remaining: Array<{ id: string; category: string }>; recentlyShown: Array<{ id: string; category: string }>; windowSize: number }
    | undefined;

  if (!contentQueue || contentQueue.remaining.length === 0) {
    return NextResponse.json(
      { error: "No more cards available. Content queue is exhausted." },
      { status: 400 }
    );
  }

  // ─── Get the next card from the queue ───
  const nextCardItem = contentQueue.remaining[0];

  // Fetch the card content from DB
  const supabase = await createClient();
  const { data: cardData } = await supabase
    .from("game_content")
    .select("*")
    .eq("id", nextCardItem.id)
    .maybeSingle();

  if (!cardData) {
    // Card not found — skip it
    const updatedRemaining = contentQueue.remaining.slice(1);
    const updatedQueue = { ...contentQueue, remaining: updatedRemaining };

    const newState = {
      ...partyState,
      responses: [],
      config: {
        ...partyState.config,
        _contentQueue: updatedQueue,
      },
    };

    await persistPartyState(gameSessionId, newState);

    return NextResponse.json({
      success: false,
      error: "Next card not found in database",
      state: newState,
    });
  }

  const nextCard: GameContentEntry = {
    id: cardData.id,
    gameType: cardData.game_type,
    category: cardData.category,
    tier: cardData.tier as ContentTier,
    text: cardData.text_en,
  };

  // ─── Update the content queue ───
  const updatedRemaining = contentQueue.remaining.slice(1);
  const nextQueueItem = { id: nextCard.id, category: nextCard.category };

  // Add the current card (if any) to recentlyShown to prevent immediate repeat
  const currentCardId = partyState.currentCard?.id;
  const currentCardCategory = partyState.currentCard?.category;
  const recentlyShownWithCurrent = currentCardId
    ? [nextQueueItem, { id: currentCardId, category: currentCardCategory ?? "general" }, ...contentQueue.recentlyShown]
    : [nextQueueItem, ...contentQueue.recentlyShown];

  // If recentlyShown exceeds window, recycle oldest
  let recycled: Array<{ id: string; category: string }> = [];
  let finalRecentlyShown = recentlyShownWithCurrent;
  if (recentlyShownWithCurrent.length > contentQueue.windowSize) {
    recycled = recentlyShownWithCurrent.slice(contentQueue.windowSize);
    finalRecentlyShown = recentlyShownWithCurrent.slice(0, contentQueue.windowSize);
  }

  const finalRemaining = [...updatedRemaining, ...recycled];

  // ─── Build updated state with cleared responses ───
  const updatedState = {
    ...partyState,
    status: "show-card" as const,
    phase: "show-card" as const,
    currentCard: nextCard,
    roundNumber: partyState.roundNumber + 1,
    responses: [], // Clear pending responses
    timerSeconds: partyState.config.timerSeconds,
    config: {
      ...partyState.config,
      _contentQueue: {
        remaining: finalRemaining,
        recentlyShown: finalRecentlyShown,
        windowSize: contentQueue.windowSize,
      },
    },
  };

  // ─── Persist ───
  const persisted = await persistPartyState(
    gameSessionId,
    updatedState,
    "playing",
    updatedState.roundNumber
  );

  // ─── Broadcast card:show event (new card after skip) ───
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
    skippedCard: partyState.currentCard,
    nextCard,
    roundNumber: updatedState.roundNumber,
    state: updatedState,
    persisted,
  });
}
