/**
 * POST /api/games/[id]/party/play-again
 *
 * Create a new party game session with the same game_type + config,
 * a fresh content queue (reshuffled), and round=1.
 *
 * This does NOT create a new game_sessions row — it reuses the existing
 * session ID but resets the party state completely. The room's lobby
 * config (vibe_tier, drinking settings) is inherited.
 *
 * Host-only action.
 *
 * Body: (none required)
 *
 * Responses:
 *   200 - New game state created successfully
 *   401 - Missing or invalid session
 *   403 - Not the host or spectator
 *   404 - Game session not found
 *   410 - Game has ended
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createContentQueue,
  getNextCard,
  createInitialState,
  DEFAULT_PARTY_GAME_CONFIG,
} from "@/lib/party-engine";
import type { PartyGameConfig, GamePhase } from "@/lib/party-engine";
import type { ContentTier } from "@/lib/content";
import type { Json } from "@/lib/database.types";
import {
  validateAuth,
  validateGameSession,
  validateHost,
  validateNotSpectator,
  fetchPartyContent,
  broadcastCardShow,
  broadcastPhaseChange,
  broadcastPartyEvent,
  persistPartyState,
} from "../helpers";

// Fisher-Yates shuffle for player turn order
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

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

  const { session, vibeTier } = sessionResult;

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

  // ─── Fetch all non-spectator players in the room ───
  const supabase = await createClient();
  const { data: playersData } = await supabase
    .from("players")
    .select("id, display_name, avatar_emoji, is_host")
    .eq("room_id", session.roomId)
    .eq("is_spectator", false)
    .order("joined_at", { ascending: true });

  if (!playersData || playersData.length < 1) {
    return NextResponse.json(
      { error: "Need at least 1 player to start a party game" },
      { status: 400 }
    );
  }

  // ─── Fetch fresh content from game_content table ───
  const rawContent = await fetchPartyContent(session.gameType, vibeTier);

  if (rawContent.length === 0) {
    return NextResponse.json(
      { error: `No content available for game type "${session.gameType}" with vibe tier "${vibeTier}"` },
      { status: 400 }
    );
  }

  // ─── Parse existing config to preserve settings ───
  const oldConfig = session.config as Partial<PartyGameConfig>;
  const drinkingEnabled = oldConfig.drinkingEnabled ?? DEFAULT_PARTY_GAME_CONFIG.drinkingEnabled;
  const maxDrinksPerRound = oldConfig.maxDrinksPerRound ?? DEFAULT_PARTY_GAME_CONFIG.maxDrinksPerRound;
  const passPenalty = oldConfig.passPenalty ?? DEFAULT_PARTY_GAME_CONFIG.passPenalty;
  const timerSeconds = oldConfig.timerSeconds ?? DEFAULT_PARTY_GAME_CONFIG.timerSeconds;
  const tieRule = oldConfig.tieRule ?? DEFAULT_PARTY_GAME_CONFIG.tieRule;
  const allowSelfVote = oldConfig.allowSelfVote ?? DEFAULT_PARTY_GAME_CONFIG.allowSelfVote;

  // ─── Create fresh content queue with smart shuffle ───
  const contentQueue = createContentQueue(
    session.gameType,
    rawContent.map((c) => ({
      id: c.id,
      gameType: c.gameType,
      category: c.category,
      tier: c.tier as ContentTier,
      text: c.text,
    })),
    vibeTier
  );

  // ─── Get the first card ───
  const { card: firstCard, queue: updatedQueue } = getNextCard(contentQueue);

  // ─── Build config (preserve lobby settings) ───
  const gameConfig: PartyGameConfig = {
    ...DEFAULT_PARTY_GAME_CONFIG,
    vibeTier,
    drinkingEnabled,
    maxDrinksPerRound,
    passPenalty,
    timerSeconds,
    tieRule,
    allowSelfVote,
  };

  // ─── Create initial state with round=1 ───
  const initialState = createInitialState({
    gameSessionId,
    gameType: session.gameType,
    config: gameConfig,
    firstCard: firstCard
      ? {
          id: firstCard.id,
          gameType: firstCard.gameType,
          category: firstCard.category,
          tier: firstCard.tier as ContentTier,
          text: firstCard.text,
        }
      : null,
  });

  // For NHIE (simultaneous play), advance directly to "responding" phase
  let initialPhase: GamePhase = "show-card";
  if (session.gameType === "never-have-i-ever" && firstCard) {
    initialPhase = "responding";
  }

  const initialStateWithPhase = initialPhase === "responding"
    ? { ...initialState, status: "responding" as const, phase: "responding" as const, timerSeconds: gameConfig.timerSeconds }
    : initialState;

  // ─── Build the content queue with category info ───
  const queueWithCategories = {
    remaining: updatedQueue.remaining.map((c) => ({ id: c.id, category: c.category })),
    recentlyShown: updatedQueue.recentlyShown.map((c) => ({ id: c.id, category: c.category })),
    windowSize: updatedQueue.windowSize,
  };

  // ─── Set up turn order for turn-based games (truth-or-dare) ───
  const playerIds = playersData.map((p) => p.id);
  const turnOrder = shuffleArray([...playerIds]);

  // ─── Store content queue + turn order in config ───
  const partyState = {
    ...initialStateWithPhase,
    config: {
      ...initialStateWithPhase.config,
      _contentQueue: queueWithCategories,
      activePlayerId: session.gameType === "truth-or-dare" ? turnOrder[0] : undefined,
      turnOrder: session.gameType === "truth-or-dare" ? turnOrder : undefined,
    },
  };

  // ─── Persist to database — reset state to playing ───
  const persisted = await persistPartyState(
    gameSessionId,
    partyState as unknown as Parameters<typeof persistPartyState>[1],
    "playing",
    0 // round_number=0 in DB
  );

  // ─── Broadcast card:show event (first card of new game) ───
  await broadcastCardShow(session.roomId, {
    gameSessionId,
    card: partyState.currentCard ?? null,
    phase: partyState.phase,
    roundNumber: 1,
    state: partyState,
  });

  // ─── Broadcast phase:change event (back to playing) ───
  await broadcastPhaseChange(session.roomId, {
    gameSessionId,
    fromPhase: "game-end",
    toPhase: partyState.phase,
    roundNumber: 1,
    state: partyState,
  });

  // ─── Also broadcast play:again event for client navigation ───
  await broadcastPartyEvent(session.roomId, "play:again", {
    gameSessionId,
    gameType: session.gameType,
    state: partyState,
    players: playersData.map((p) => ({
      id: p.id,
      displayName: p.display_name,
      avatarEmoji: p.avatar_emoji,
      isHost: p.is_host,
    })),
    timestamp: Date.now(),
  });

  return NextResponse.json({
    success: true,
    gameSessionId,
    gameType: session.gameType,
    state: partyState,
    players: playersData.map((p) => ({
      id: p.id,
      displayName: p.display_name,
      avatarEmoji: p.avatar_emoji,
      isHost: p.is_host,
    })),
    persisted,
  });
}
