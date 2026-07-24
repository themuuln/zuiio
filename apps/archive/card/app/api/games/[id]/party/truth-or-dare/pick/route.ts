/**
 * POST /api/games/[id]/party/truth-or-dare/pick
 *
 * Truth or Dare specific: Active player picks Truth or Dare, and the system
 * retrieves the appropriate card from the content queue.
 *
 * Truth cards = categories other than "dares"
 * Dare cards = category "dares"
 *
 * Flow:
 *   1. Validates the requesting player is the active player (VAL-TOD-006)
 *   2. Finds the next card matching the choice from the content queue
 *   3. Sets the card as currentCard, moves to "responding" phase
 *   4. Broadcasts the card to ALL players simultaneously via Realtime (VAL-TOD-001)
 *
 * Body: { playerId: string, choice: "truth" | "dare" }
 *
 * Responses:
 *   200 - Card picked and broadcast to all players
 *   400 - Invalid choice, no matching cards
 *   401 - Missing or invalid session
 *   403 - Not the active player (VAL-TOD-008)
 *   404 - Game session not found
 *   409 - Game is in wrong phase
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
  validatePhase,
  parsePartyState,
  persistPartyState,
  broadcastCardShow,
  broadcastPhaseChange,
} from "../../helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameSessionId } = await params;

  // ─── Parse body ───
  let body: { playerId?: string; choice?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { playerId, choice } = body;

  // ─── Validate required fields ───
  if (!playerId) {
    return NextResponse.json(
      { error: "playerId is required" },
      { status: 400 }
    );
  }

  if (!choice || !["truth", "dare"].includes(choice)) {
    return NextResponse.json(
      { error: "choice must be 'truth' or 'dare'" },
      { status: 400 }
    );
  }

  // ─── Validate game session ───
  const sessionResult = await validateGameSession(gameSessionId);
  if (sessionResult instanceof NextResponse) {
    return sessionResult;
  }

  const { session } = sessionResult;

  // ─── Verify it's a truth-or-dare game ───
  if (session.gameType !== "truth-or-dare") {
    return NextResponse.json(
      { error: "This endpoint is only for truth-or-dare games" },
      { status: 400 }
    );
  }

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

  // ─── Parse current party state ───
  const partyState = parsePartyState(session.config);
  if (!partyState) {
    return NextResponse.json(
      { error: "Game session is not in a valid party game state" },
      { status: 400 }
    );
  }

  // ─── Validate game is in 'show-card' phase ───
  const phaseCheck = validatePhase(partyState, ["show-card"]);
  if (phaseCheck instanceof NextResponse) {
    return phaseCheck;
  }

  // ─── Verify playerId matches authenticated player ───
  if (player.id !== playerId) {
    return NextResponse.json(
      { error: "Player ID does not match authenticated player" },
      { status: 403 }
    );
  }

  // ─── Verify this player is the active player ───
  if (partyState.config.activePlayerId !== playerId) {
    return NextResponse.json(
      {
        error: "It is not your turn. The active player must pick Truth or Dare.",
        activePlayerId: partyState.config.activePlayerId,
      },
      { status: 403 }
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

  // ─── Find the first card matching the choice ───
  // Truth = categories other than "dares"
  // Dare = category "dares"
  const isDare = choice === "dare";

  // Batch-fetch all remaining cards from DB to find matching one
  const supabase = await createClient();
  const remainingIds = contentQueue.remaining.map((item) => item.id);
  
  const { data: remainingCards } = await supabase
    .from("game_content")
    .select("id, game_type, category, tier, text_en, is_active")
    .in("id", remainingIds)
    .eq("is_active", true);

  if (!remainingCards || remainingCards.length === 0) {
    return NextResponse.json(
      { error: "No cards found in content queue" },
      { status: 400 }
    );
  }

  // Find the first card matching the choice type
  const matchingCard = remainingCards.find((c) => {
    if (isDare) {
      return c.category === "dares";
    }
    return c.category !== "dares";
  });

  if (!matchingCard) {
    return NextResponse.json(
      { error: `No ${choice} cards available in the content queue` },
      { status: 400 }
    );
  }

  // ─── Map to GameContentEntry ───
  const pickedCard: GameContentEntry = {
    id: matchingCard.id,
    gameType: matchingCard.game_type,
    category: matchingCard.category,
    tier: matchingCard.tier as ContentTier,
    text: matchingCard.text_en,
  };

  // ─── Update the content queue ───
  // Remove the picked card from remaining, add to recently shown
  const pickedIndex = contentQueue.remaining.findIndex(
    (item) => item.id === pickedCard.id
  );

  const updatedRemaining = [...contentQueue.remaining];
  let pickedQueueItem: { id: string; category: string };
  
  if (pickedIndex >= 0) {
    pickedQueueItem = updatedRemaining.splice(pickedIndex, 1)[0];
  } else {
    // Fallback: should not happen since we found it in DB
    pickedQueueItem = { id: pickedCard.id, category: pickedCard.category };
  }

  const updatedRecentlyShown = [pickedQueueItem, ...contentQueue.recentlyShown];

  // If recentlyShown exceeds window, recycle oldest
  let recycled: Array<{ id: string; category: string }> = [];
  let finalRecentlyShown = updatedRecentlyShown;
  if (updatedRecentlyShown.length > contentQueue.windowSize) {
    recycled = updatedRecentlyShown.slice(contentQueue.windowSize);
    finalRecentlyShown = updatedRecentlyShown.slice(0, contentQueue.windowSize);
  }

  const finalRemaining = [...updatedRemaining, ...recycled];

  // ─── Update game state ───
  // Move to "responding" phase with timer, set current card
  const updatedState = {
    ...partyState,
    status: "responding" as const,
    phase: "responding" as const,
    currentCard: pickedCard,
    timerSeconds: partyState.config.timerSeconds,
    responses: [],
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
    undefined
  );

  // ─── Broadcast card:show to ALL players (VAL-TOD-001, VAL-ENG-007) ───
  await broadcastCardShow(session.roomId, {
    gameSessionId,
    card: pickedCard,
    phase: "responding",
    roundNumber: updatedState.roundNumber,
    state: updatedState,
  });

  // ─── Broadcast phase:change ───
  await broadcastPhaseChange(session.roomId, {
    gameSessionId,
    fromPhase: "show-card",
    toPhase: "responding",
    roundNumber: updatedState.roundNumber,
    state: updatedState,
  });

  return NextResponse.json({
    success: true,
    choice,
    card: pickedCard,
    activePlayerId: playerId,
    activePlayerName: player.displayName,
    state: updatedState,
    persisted,
  });
}
