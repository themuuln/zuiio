/**
 * Shared helpers for party game API routes.
 *
 * Provides common auth, validation, and broadcast utilities
 * used across all party game endpoints.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ContentTier } from "@/lib/content";
import type { PartyGameState, GamePhase } from "@/lib/party-engine";
import type { Json } from "@/lib/database.types";
import {
  broadcastPartyGameEvent,
  PARTY_EVENTS,
} from "@/lib/party-engine/realtime";
import type {
  CardShowPayload,
  ResponsesTallyPayload,
  RevealResultsPayload,
  DrinkingPromptPayload,
  PhaseChangePayload,
  GameEndPayload,
  PlayerLeftPayload,
  RoomExpiredPayload,
} from "@/lib/party-engine/realtime";

// ──────────────────────────────────────────────
// VALID PARTY GAME TYPES
// ──────────────────────────────────────────────

export const PARTY_GAME_TYPES = [
  "truth-or-dare",
  "never-have-i-ever",
  "hot-takes",
  "most-likely-to",
] as const;

export type PartyGameType = (typeof PARTY_GAME_TYPES)[number];

export function isValidPartyGameType(
  gameType: string
): gameType is PartyGameType {
  return PARTY_GAME_TYPES.includes(gameType as PartyGameType);
}

// ──────────────────────────────────────────────
// PLAYER INFO (from DB)
// ──────────────────────────────────────────────

export interface PlayerInfo {
  id: string;
  displayName: string;
  avatarEmoji: string;
  isHost: boolean;
  isSpectator: boolean;
}

// ──────────────────────────────────────────────
// AUTH & VALIDATION
// ──────────────────────────────────────────────

/**
 * Validate the session_id cookie and return the associated player info.
 * Returns a 401 response if the cookie is missing or the player is not found.
 */
export async function validateAuth(
  request: NextRequest,
  roomId: string
): Promise<{ player: PlayerInfo } | NextResponse> {
  const supabase = await createClient();
  const sessionId = request.cookies.get("session_id")?.value;

  if (!sessionId) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const { data: player } = await supabase
    .from("players")
    .select("id, display_name, avatar_emoji, is_host, is_spectator")
    .eq("room_id", roomId)
    .eq("session_id", sessionId)
    .maybeSingle();

  if (!player) {
    return NextResponse.json(
      { error: "Player not found" },
      { status: 401 }
    );
  }

  return {
    player: {
      id: player.id,
      displayName: player.display_name,
      avatarEmoji: player.avatar_emoji,
      isHost: player.is_host,
      isSpectator: player.is_spectator,
    },
  };
}

/**
 * Validate the game session exists and is a party game.
 * Returns the game session data or a 404/400 response.
 */
export async function validateGameSession(
  gameSessionId: string
): Promise<{
  session: {
    roomId: string;
    gameType: string;
    status: string;
    config: Record<string, unknown>;
    roundNumber: number;
  };
  roomCode: string;
  vibeTier: ContentTier;
} | NextResponse> {
  const supabase = await createClient();

  // Fetch the game session
  const { data: session } = await supabase
    .from("game_sessions")
    .select("id, room_id, game_type, status, config, round_number, created_at")
    .eq("id", gameSessionId)
    .maybeSingle();

  if (!session) {
    return NextResponse.json(
      { error: "Game session not found" },
      { status: 404 }
    );
  }

  // Check if game has ended
  if (session.status === "game_end") {
    return NextResponse.json(
      { error: "Game has ended" },
      { status: 410 }
    );
  }

  // Validate it's a party game type
  if (!isValidPartyGameType(session.game_type)) {
    return NextResponse.json(
      { error: "Invalid game type. Expected a party game type." },
      { status: 400 }
    );
  }

  // Get the room info including vibe tier
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: room } = await (supabase as any)
    .from("rooms")
    .select("id, code, vibe_tier")
    .eq("id", session.room_id)
    .maybeSingle();

  if (!room) {
    return NextResponse.json(
      { error: "Room not found" },
      { status: 404 }
    );
  }

  const config = session.config as Record<string, unknown>;

  return {
    session: {
      roomId: session.room_id,
      gameType: session.game_type,
      status: session.status,
      config,
      roundNumber: session.round_number,
    },
    roomCode: room.code as string,
    vibeTier: (room.vibe_tier as ContentTier) ?? "spicy",
  };
}

/**
 * Validate that the requesting player is the host.
 * Returns a 403 response if they are not the host.
 */
export function validateHost(
  player: PlayerInfo
): { isHost: true } | NextResponse {
  if (!player.isHost) {
    return NextResponse.json(
      { error: "Only the host can perform this action" },
      { status: 403 }
    );
  }
  return { isHost: true };
}

/**
 * Validate that the requesting player is not a spectator.
 * Returns a 403 response if they are a spectator.
 */
export function validateNotSpectator(
  player: PlayerInfo
): { ok: true } | NextResponse {
  if (player.isSpectator) {
    return NextResponse.json(
      { error: "Spectators cannot perform game actions" },
      { status: 403 }
    );
  }
  return { ok: true };
}

/**
 * Validate the current game phase. Returns a 409 response if the phase doesn't match.
 */
export function validatePhase(
  state: PartyGameState,
  expectedPhases: GamePhase[]
): { ok: true } | NextResponse {
  if (!expectedPhases.includes(state.phase)) {
    return NextResponse.json(
      {
        error: `Action not allowed in phase "${state.phase}". Expected phase: ${expectedPhases.join(" or ")}`,
        currentPhase: state.phase,
        expectedPhases,
      },
      { status: 409 }
    );
  }
  return { ok: true };
}

// ──────────────────────────────────────────────
// CONTENT FETCHING
// ──────────────────────────────────────────────

/**
 * Fetch party game content from the game_content table,
 * filtered by game type and tier.
 *
 * Tier inclusion rules:
 * - "spicy": only spicy entries
 * - "wild": spicy + wild entries
 * - "after-dark": all three tiers
 */
export async function fetchPartyContent(
  gameType: string,
  vibeTier: ContentTier
): Promise<
  Array<{
    id: string;
    gameType: string;
    category: string;
    tier: string;
    text: string;
  }>
> {
  const supabase = await createClient();

  // Determine which tiers to include based on vibe tier
  const tierOrder: ContentTier[] = ["spicy", "wild", "after-dark"];
  const maxTierIndex = tierOrder.indexOf(vibeTier);
  const validTiers = tierOrder.slice(0, maxTierIndex + 1);

  const { data, error } = await supabase
    .from("game_content")
    .select("*")
    .eq("game_type", gameType)
    .eq("is_active", true)
    .in("tier", validTiers);

  if (error) {
    console.error("Failed to fetch party content:", error.message);
    return [];
  }

  // Map DB rows to our internal format
  return (data ?? []).map((row) => ({
    id: row.id,
    gameType: row.game_type,
    category: row.category,
    tier: row.tier as ContentTier,
    text: row.text_en,
  }));
}

// ──────────────────────────────────────────────
// REALTIME BROADCAST
// ──────────────────────────────────────────────

/**
 * Broadcast a party game event to the room's Realtime channel.
 *
 * Uses the standardized event naming from lib/party-engine/realtime.
 * Accepts any event string for backward compatibility with existing callers.
 */
export async function broadcastPartyEvent(
  roomId: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  // Forward to the typed broadcast function
  await broadcastPartyGameEvent(roomId, event, payload);
}

// ──────────────────────────────────────────────
// TYPED BROADCAST HELPERS
// ──────────────────────────────────────────────

/**
 * Broadcast a card:show event - current card + phase displayed to all players.
 */
export async function broadcastCardShow(
  roomId: string,
  payload: CardShowPayload
): Promise<void> {
  await broadcastPartyGameEvent(roomId, PARTY_EVENTS.CARD_SHOW, payload as unknown as Record<string, unknown>);
}

/**
 * Broadcast a responses:tally event - live response tally during voting.
 */
export async function broadcastResponsesTally(
  roomId: string,
  payload: ResponsesTallyPayload
): Promise<void> {
  await broadcastPartyGameEvent(roomId, PARTY_EVENTS.RESPONSES_TALLY, payload as unknown as Record<string, unknown>);
}

/**
 * Broadcast a reveal:results event - full reveal with counts + voter names.
 */
export async function broadcastRevealResults(
  roomId: string,
  payload: RevealResultsPayload
): Promise<void> {
  await broadcastPartyGameEvent(roomId, PARTY_EVENTS.REVEAL_RESULTS, payload as unknown as Record<string, unknown>);
}

/**
 * Broadcast a drinking:prompt event - drink action to specific players.
 */
export async function broadcastDrinkingPrompt(
  roomId: string,
  payload: DrinkingPromptPayload
): Promise<void> {
  await broadcastPartyGameEvent(roomId, PARTY_EVENTS.DRINKING_PROMPT, payload as unknown as Record<string, unknown>);
}

/**
 * Broadcast a phase:change event - state transitions.
 */
export async function broadcastPhaseChange(
  roomId: string,
  payload: PhaseChangePayload
): Promise<void> {
  await broadcastPartyGameEvent(roomId, PARTY_EVENTS.PHASE_CHANGE, payload as unknown as Record<string, unknown>);
}

/**
 * Broadcast a game:end event - game over signal.
 */
export async function broadcastGameEnd(
  roomId: string,
  payload: GameEndPayload
): Promise<void> {
  await broadcastPartyGameEvent(roomId, PARTY_EVENTS.GAME_END, payload as unknown as Record<string, unknown>);
}

/**
 * Broadcast a player:left event.
 */
export async function broadcastPlayerLeft(
  roomId: string,
  payload: PlayerLeftPayload
): Promise<void> {
  await broadcastPartyGameEvent(roomId, PARTY_EVENTS.PLAYER_LEFT, payload as unknown as Record<string, unknown>);
}

/**
 * Broadcast a room:expired event.
 */
export async function broadcastRoomExpired(
  roomId: string,
  payload: RoomExpiredPayload
): Promise<void> {
  await broadcastPartyGameEvent(roomId, PARTY_EVENTS.ROOM_EXPIRED, payload as unknown as Record<string, unknown>);
}

// ──────────────────────────────────────────────
// STATE PERSISTENCE
// ──────────────────────────────────────────────

/**
 * Persist party game state to the game_sessions table.
 * Stores the PartyGameState in the config JSON field.
 */
export async function persistPartyState(
  gameSessionId: string,
  state: PartyGameState,
  dbStatus: string = "playing",
  dbRoundNumber?: number
): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("game_sessions")
      .update({
        config: state as unknown as Json,
        status: dbStatus,
        round_number: dbRoundNumber ?? state.roundNumber,
        last_action_at: new Date().toISOString(),
      })
      .eq("id", gameSessionId);

    if (error) {
      console.error("Failed to persist party state:", error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Failed to persist party state:", err);
    return false;
  }
}

// ──────────────────────────────────────────────
// PARSE PARTY GAME STATE FROM DB
// ──────────────────────────────────────────────

/**
 * Parse a PartyGameState from the game_sessions config JSON.
 * Returns null if the config doesn't contain valid party game state.
 */
export function parsePartyState(
  config: Record<string, unknown>
): PartyGameState | null {
  if (!config || !config.gameSessionId) {
    return null;
  }

  try {
    return config as unknown as PartyGameState;
  } catch {
    return null;
  }
}
