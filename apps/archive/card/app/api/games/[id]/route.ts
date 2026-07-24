import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidPartyGameType, parsePartyState } from "@/app/api/games/[id]/party/helpers";
import type { PartyGameState } from "@/lib/party-engine";

// ─── PARTY GAME TYPES (for rehydration) ───
const PARTY_GAME_TYPES = [
  "truth-or-dare",
  "never-have-i-ever",
  "hot-takes",
  "most-likely-to",
];

// GET /api/games/[id] — Fetch current game state for page refresh
// Returns the current game session state and the requesting player's hand
// so clients can rehydrate after page refresh.
// For party games, returns the PartyGameState from config.
// For UNO games, returns the UNO-specific state.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameSessionId } = await params;

  const supabase = await createClient();
  const sessionId = request.cookies.get("session_id")?.value;

  if (!sessionId) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  // Fetch the game session
  let session: unknown = null;
  let roomId: string | null = null;
  let roomCode: string | null = null;
  let storedConfig: Record<string, unknown> | null = null;
  let isPartyGame = false;

  // Try reading game_sessions directly
  const directResult = await supabase
    .from("game_sessions")
    .select("*")
    .eq("id", gameSessionId)
    .maybeSingle();

  if (directResult.data) {
    const sd = directResult.data as Record<string, unknown>;
    session = sd;
    roomId = sd.room_id as string;
    storedConfig = (sd.config as Record<string, unknown>) ?? null;
    isPartyGame = PARTY_GAME_TYPES.includes(sd.game_type as string);
  }

  // Fallback: find room by current_game_id and reconstruct from player_hands
  if (!session) {
    const { data: roomByGame } = await supabase
      .from("rooms")
      .select("id, code, game_state, current_game_id")
      .eq("current_game_id", gameSessionId)
      .maybeSingle();

    if (roomByGame) {
      roomId = roomByGame.id;
      roomCode = roomByGame.code;

      // Try one more time with room_id hint
      const retryResult = await supabase
        .from("game_sessions")
        .select("*")
        .eq("id", gameSessionId)
        .eq("room_id", roomId)
        .maybeSingle();

      if (retryResult.data) {
        const sd = retryResult.data as Record<string, unknown>;
        session = sd;
        storedConfig = (sd.config as Record<string, unknown>) ?? null;
        isPartyGame = PARTY_GAME_TYPES.includes(sd.game_type as string);
      } else {
        // Last resort: read game config from player_hands "_config" entry
        const { data: configHand } = await supabase
          .from("player_hands")
          .select("cards")
          .eq("game_session_id", gameSessionId)
          .eq("player_id", "_config")
          .maybeSingle();

        if (configHand?.cards) {
          storedConfig = configHand.cards as Record<string, unknown>;
        }

        // Create a minimal session object
        session = {
          id: gameSessionId,
          room_id: roomId,
          game_type: "uno",
          status: roomByGame.game_state || "playing",
          direction: (storedConfig?.direction as number) ?? 1,
          round_number: (storedConfig?.roundNumber as number) ?? 1,
          config: storedConfig ?? {},
          turn_order: [],
          created_at: new Date().toISOString(),
        };
      }
    }
  }

  if (!session || !roomId) {
    return NextResponse.json(
      { error: "Game session not found" },
      { status: 404 }
    );
  }

  // Get room code if not already found
  if (!roomCode) {
    const { data: roomByCode } = await supabase
      .from("rooms")
      .select("code")
      .eq("id", roomId)
      .maybeSingle();
    roomCode = roomByCode?.code ?? "UNKNOWN";
  }

  // Get the player associated with this session
  const { data: currentPlayer } = await supabase
    .from("players")
    .select("id, display_name, avatar_emoji, is_host, is_spectator")
    .eq("room_id", roomId)
    .eq("session_id", sessionId)
    .maybeSingle();

  if (!currentPlayer) {
    return NextResponse.json(
      { error: "Player not found" },
      { status: 404 }
    );
  }

  // Fetch all non-spectator players for this room
  const { data: players } = await supabase
    .from("players")
    .select("id, display_name, avatar_emoji, is_host, is_spectator")
    .eq("room_id", roomId)
    .eq("is_spectator", false)
    .order("joined_at", { ascending: true });

  // ═══ PARTY GAME REHYDRATION ═══
  if (isPartyGame && storedConfig) {
    const partyState = parsePartyState(storedConfig);
    if (partyState) {
      return NextResponse.json({
        isPartyGame: true,
        gameSessionId,
        roomId,
        roomCode,
        gameType: (session as Record<string, unknown>).game_type,
        status: (session as Record<string, unknown>).status,
        state: partyState,
        players: (players ?? []).map((p) => ({
          id: p.id,
          displayName: p.display_name,
          avatarEmoji: p.avatar_emoji,
          isHost: p.is_host,
          isSpectator: p.is_spectator,
        })),
        currentPlayer: {
          id: currentPlayer.id,
          displayName: currentPlayer.display_name,
          avatarEmoji: currentPlayer.avatar_emoji,
          isHost: currentPlayer.is_host,
          isSpectator: currentPlayer.is_spectator,
        },
      });
    }
  }

  // ═══ UNO GAME REHYDRATION (existing behavior) ═══
  // Fetch the requesting player's hands from the player_hands table
  const { data: myHand } = await supabase
    .from("player_hands")
    .select("cards")
    .eq("game_session_id", gameSessionId)
    .eq("player_id", currentPlayer.id)
    .maybeSingle();

  // Fetch scores for this game session
  const { data: scores } = await supabase
    .from("scores")
    .select("*")
    .eq("game_session_id", gameSessionId)
    .order("round_number", { ascending: true });

  // Parse stored game config
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionData = session as any;
  const gameConfig = storedConfig ?? {};

  // Get current player from the stored config
  const configPlayers = (gameConfig.players as Array<{ playerId: string }>) ?? [];
  const storedCurrentPlayerIndex = (gameConfig.currentPlayerIndex as number) ?? 0;
  const storedCurrentPlayerId =
    configPlayers[storedCurrentPlayerIndex]?.playerId ?? null;

  const currentTurnPlayer = players?.find((p) => p.id === storedCurrentPlayerId);
  const discardPile = (gameConfig.discardPile as Array<Record<string, unknown>>) ?? [];
  const topDiscard = discardPile[discardPile.length - 1] ?? null;

  // Build response
  return NextResponse.json({
    isPartyGame: false,
    gameSessionId: sessionData.id,
    roomId,
    roomCode,
    gameType: sessionData.game_type,
    status: sessionData.status,
    roundNumber: sessionData.round_number ?? 1,
    currentPlayerId: storedCurrentPlayerId,
    currentPlayerName: currentTurnPlayer?.display_name ?? null,
    players: (players ?? []).map((p) => ({
      id: p.id,
      displayName: p.display_name,
      avatarEmoji: p.avatar_emoji,
      isHost: p.is_host,
    })),
    hand: (myHand?.cards as Array<Record<string, unknown>>) ?? [],
    config: gameConfig,
    deckCount: (gameConfig.deck as Array<unknown>)?.length ?? 0,
    direction: sessionData.direction ?? 1,
    currentColor: (gameConfig.currentColor as string) ?? "red",
    topDiscard,
    scores: scores ?? [],
    persisted: true,
  });
}
