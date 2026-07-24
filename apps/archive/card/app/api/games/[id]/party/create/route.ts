/**
 * POST /api/games/[id]/party/create
 *
 * Create a party game session. Validates auth, fetches content from the
 * game_content table filtered by game_type + room vibe tier, creates a
 * content queue, initializes the PartyGameState, and persists to the DB.
 *
 * Body: { gameType: "truth-or-dare" | "never-have-i-ever" | "hot-takes" | "most-likely-to",
 *          config?: Partial<PartyGameConfig> }
 *
 * Responses:
 *   200 - Game session created with initial state
 *   400 - Invalid game type or missing fields
 *   401 - Missing or invalid session
 *   403 - Not the host or spectator
 *   404 - Room or game session not found
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
  broadcastPartyEvent,
  broadcastCardShow,
  broadcastPhaseChange,
  persistPartyState,
  isValidPartyGameType,
  PARTY_GAME_TYPES,
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

  // ─── Parse body ───
  let body: { gameType?: string; config?: Partial<PartyGameConfig> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { gameType, config: overrides } = body;

  // ─── Validate game type ───
  if (!gameType || !isValidPartyGameType(gameType)) {
    return NextResponse.json(
      {
        error: `Invalid game type. Must be one of: ${PARTY_GAME_TYPES.join(", ")}`,
        validTypes: PARTY_GAME_TYPES,
      },
      { status: 400 }
    );
  }

  // ─── Authenticate ───
  const supabase = await createClient();
  const sessionId = request.cookies.get("session_id")?.value;

  if (!sessionId) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  // ─── Verify the game session exists and is a valid type ───
  const sessionResult = await validateGameSession(gameSessionId);
  if (sessionResult instanceof NextResponse) {
    return sessionResult;
  }

  const { session, roomCode, vibeTier } = sessionResult;

  // ─── Verify the requester is the host of the room ───
  const authResult = await validateAuth(request, session.roomId);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { player } = authResult;

  const hostCheck = validateHost(player);
  if (hostCheck instanceof NextResponse) {
    return hostCheck;
  }

  const spectatorCheck = validateNotSpectator(player);
  if (spectatorCheck instanceof NextResponse) {
    return spectatorCheck;
  }

  // ─── Fetch all non-spectator players in the room ───
  const { data: players } = await supabase
    .from("players")
    .select("id, display_name, avatar_emoji, is_host")
    .eq("room_id", session.roomId)
    .eq("is_spectator", false)
    .order("joined_at", { ascending: true });

  if (!players || players.length < 1) {
    return NextResponse.json(
      { error: "Need at least 1 player to start a party game" },
      { status: 400 }
    );
  }

  // ─── Fetch content from game_content table ───
  const rawContent = await fetchPartyContent(gameType, vibeTier);

  if (rawContent.length === 0) {
    return NextResponse.json(
      { error: `No content available for game type "${gameType}" with vibe tier "${vibeTier}"` },
      { status: 400 }
    );
  }

  // ─── Create content queue with smart shuffle ───
  const contentQueue = createContentQueue(
    gameType,
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

  // ─── Build config ───
  const gameConfig: PartyGameConfig = {
    ...DEFAULT_PARTY_GAME_CONFIG,
    vibeTier,
    ...overrides,
  };

  // ─── Create initial state ───
  const initialState = createInitialState({
    gameSessionId,
    gameType,
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
  // so all players see the card and can respond immediately (VAL-NHIE-001, VAL-NHIE-002)
  let initialPhase: GamePhase = "show-card";
  if (gameType === "never-have-i-ever" && firstCard) {
    initialPhase = "responding";
  }

  const initialStateWithPhase = initialPhase === "responding"
    ? { ...initialState, status: "responding" as const, phase: "responding" as const, timerSeconds: gameConfig.timerSeconds }
    : initialState;

  // ─── Build the content queue with category info for truth/dare filtering ───
  const queueWithCategories = {
    remaining: updatedQueue.remaining.map((c) => ({ id: c.id, category: c.category })),
    recentlyShown: updatedQueue.recentlyShown.map((c) => ({ id: c.id, category: c.category })),
    windowSize: updatedQueue.windowSize,
  };

  // ─── Set up turn order for turn-based games (truth-or-dare) ───
  const playerIds = players.map((p) => p.id);
  const turnOrder = shuffleArray([...playerIds]);

  // ─── Store the content queue in the state config for subsequent card draws ───
  const partyState = {
    ...initialStateWithPhase,
    config: {
      ...initialStateWithPhase.config,
      _contentQueue: queueWithCategories,
      activePlayerId: gameType === "truth-or-dare" ? turnOrder[0] : undefined,
      turnOrder: gameType === "truth-or-dare" ? turnOrder : undefined,
    },
  };

  // ─── Persist to database ───
  const persisted = await persistPartyState(
    gameSessionId,
    partyState as unknown as Parameters<typeof persistPartyState>[1],
    "playing",
    0 // round_number=0 in DB per expected behavior
  );

  // ─── Broadcast game start event ───
  // card:show — first card displayed to all players
  await broadcastCardShow(session.roomId, {
    gameSessionId,
    card: partyState.currentCard ?? null,
    phase: partyState.phase,
    roundNumber: partyState.roundNumber,
    state: partyState,
  });

  // phase:change — initial state transition
  await broadcastPhaseChange(session.roomId, {
    gameSessionId,
    fromPhase: "show-card",
    toPhase: partyState.phase,
    roundNumber: partyState.roundNumber,
    state: partyState,
  });

  return NextResponse.json({
    success: true,
    gameSessionId,
    gameType,
    roomCode,
    state: partyState,
    players: players.map((p) => ({
      id: p.id,
      displayName: p.display_name,
      avatarEmoji: p.avatar_emoji,
      isHost: p.is_host,
    })),
    persisted,
  });
}
