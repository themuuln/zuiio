/**
 * POST /api/games/party/start
 *
 * Create and initialize a party game session from the lobby.
 * Combines: create game session (RPC) → initialize party state.
 *
 * Body: { roomCode: string, gameType: string, config?: Partial<PartyGameConfig> }
 *
 * Responses:
 *   200 - Game started with session ID and state
 *   400 - Missing fields or invalid game type
 *   401 - Not authenticated
 *   403 - Not the host or spectator
 *   404 - Room not found
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ContentTier } from "@/lib/content";
import type { PartyGameConfig, GamePhase } from "@/lib/party-engine";
import {
  createContentQueue,
  getNextCard,
  createInitialState,
  DEFAULT_PARTY_GAME_CONFIG,
} from "@/lib/party-engine";
import {
  isValidPartyGameType,
  PARTY_GAME_TYPES,
  fetchPartyContent,
  broadcastCardShow,
  broadcastPhaseChange,
  persistPartyState,
} from "@/app/api/games/[id]/party/helpers";

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function POST(request: NextRequest) {
  // ─── Parse body ───
  let body: { roomCode?: string; gameType?: string; config?: Partial<PartyGameConfig> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { roomCode, gameType, config: overrides } = body;

  if (!roomCode || typeof roomCode !== "string" || !/^[A-Z]{4}$/i.test(roomCode)) {
    return NextResponse.json({ error: "Invalid room code" }, { status: 400 });
  }

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
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // ─── Get the room ───
  const code = roomCode.toUpperCase();
  const { data: room } = await supabase
    .from("rooms")
    .select("id, code, host_session_id, vibe_tier")
    .eq("code", code)
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  // Verify host
  if (room.host_session_id !== sessionId) {
    return NextResponse.json(
      { error: "Only the host can start a game" },
      { status: 403 }
    );
  }

  const vibeTier = (room.vibe_tier as ContentTier) ?? "spicy";

  // ─── Fetch all non-spectator players ───
  const { data: players } = await supabase
    .from("players")
    .select("id, display_name, avatar_emoji, is_host")
    .eq("room_id", room.id)
    .eq("is_spectator", false)
    .order("joined_at", { ascending: true });

  if (!players || players.length < 1) {
    return NextResponse.json(
      { error: "Need at least 1 player to start a party game" },
      { status: 400 }
    );
  }

  // ─── Create game session via RPC ───
  const { data: sessionResult, error: sessionError } = await supabase.rpc(
    "create_game_session",
    {
      p_room_id: room.id,
      p_game_type: gameType,
      p_status: "playing",
    }
  );

  if (sessionError) {
    console.error("Failed to create game session:", sessionError);
    return NextResponse.json(
      { error: "Failed to create game session" },
      { status: 500 }
    );
  }

  const sessionData =
    typeof sessionResult === "string"
      ? JSON.parse(sessionResult)
      : sessionResult;

  const gameSessionId: string = sessionData.id;

  // ─── Fetch content from game_content table ───
  const rawContent = await fetchPartyContent(gameType, vibeTier);

  if (rawContent.length === 0) {
    // Clean up the session we just created
    await supabase.from("game_sessions").delete().eq("id", gameSessionId);
    return NextResponse.json(
      { error: `No content available for "${gameType}" with vibe tier "${vibeTier}"` },
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
  let initialPhase: GamePhase = "show-card";
  if (gameType === "never-have-i-ever" && firstCard) {
    initialPhase = "responding";
  }

  const initialStateWithPhase = initialPhase === "responding"
    ? { ...initialState, status: "responding" as const, phase: "responding" as const, timerSeconds: gameConfig.timerSeconds }
    : initialState;

  // ─── Build the content queue ───
  const queueWithCategories = {
    remaining: updatedQueue.remaining.map((c) => ({ id: c.id, category: c.category })),
    recentlyShown: updatedQueue.recentlyShown.map((c) => ({ id: c.id, category: c.category })),
    windowSize: updatedQueue.windowSize,
  };

  // ─── Set up turn order for turn-based games ───
  const playerIds = players.map((p) => p.id);
  const turnOrder = shuffleArray([...playerIds]);

  // ─── Store the content queue in the state config ───
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
  await persistPartyState(
    gameSessionId,
    partyState as Parameters<typeof persistPartyState>[1],
    "playing",
    0
  );

  // ─── Broadcast game start event ───
  await broadcastCardShow(room.id, {
    gameSessionId,
    card: partyState.currentCard ?? null,
    phase: partyState.phase,
    roundNumber: partyState.roundNumber,
    state: partyState,
  });

  await broadcastPhaseChange(room.id, {
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
    roomCode: code,
    state: partyState,
    players: players.map((p) => ({
      id: p.id,
      displayName: p.display_name,
      avatarEmoji: p.avatar_emoji,
      isHost: p.is_host,
    })),
  });
}
