/**
 * Party Game Realtime Integration
 *
 * Standardized Supabase Realtime broadcast events and helpers for party games.
 *
 * Broadcast channels (event types):
 *   card:show         - Current card + phase displayed to all players
 *   responses:tally   - Live response tally during voting phase
 *   reveal:results    - Full reveal with counts + voter names
 *   drinking:prompt   - Drink action targeted to specific players
 *   phase:change      - State transitions between game phases
 *   game:end          - Game over signal terminating client sessions
 *
 * Channel naming: one channel per room → "room:{roomId}"
 * Cross-room isolation: guaranteed by separate channel names
 *
 * Server-side broadcast uses create → subscribe → send → cleanup pattern
 * (required for serverless/Next.js API routes).
 * Client-side maintains a persistent subscription per room.
 */

import { createClient } from "@/lib/supabase/server";
import type { GameContentEntry } from "@/lib/content";
import type { PartyGameState, GamePhase, PlayerResponse } from "./types";
import type { DrinkAction } from "@/lib/constants";

// ──────────────────────────────────────────────
// EVENT TYPE CONSTANTS
// ──────────────────────────────────────────────

/** Party game realtime broadcast event names. */
export const PARTY_EVENTS = {
  /** Current card/question displayed to all players with current phase */
  CARD_SHOW: "card:show",
  /** Live response tally during voting (optional live count) */
  RESPONSES_TALLY: "responses:tally",
  /** Full reveal results with counts + voter names */
  REVEAL_RESULTS: "reveal:results",
  /** Drinking prompt targeted to specific players */
  DRINKING_PROMPT: "drinking:prompt",
  /** Phase state transition */
  PHASE_CHANGE: "phase:change",
  /** Game over / session termination */
  GAME_END: "game:end",
  /** Play again (new session with same config) */
  PLAY_AGAIN: "play:again",
  /** Player left the room */
  PLAYER_LEFT: "player:left",
  /** Player removed from room */
  PLAYER_REMOVED: "player:removed",
  /** Room expired */
  ROOM_EXPIRED: "room:expired",
} as const;

export type PartyEventName = (typeof PARTY_EVENTS)[keyof typeof PARTY_EVENTS];

// ──────────────────────────────────────────────
// TYPED PAYLOAD INTERFACES
// ──────────────────────────────────────────────

/** Payload for card:show events */
export interface CardShowPayload {
  /** Game session ID */
  gameSessionId: string;
  /** Current card content shown to all players */
  card: GameContentEntry | null;
  /** Current game phase */
  phase: GamePhase;
  /** Current round number */
  roundNumber: number;
  /** Full game state snapshot for rehydration */
  state: PartyGameState;
}

/** Payload for responses:tally events */
export interface ResponsesTallyPayload {
  /** Game session ID */
  gameSessionId: string;
  /** Total number of responses received so far */
  responseCount: number;
  /** Total number of players who can respond */
  totalPlayers: number;
  /** The player who just submitted */
  respondentId: string;
  /** The respondent's display name */
  respondentName: string;
  /** Whether this was a duplicate/update */
  duplicate: boolean;
  /** Unix timestamp of the response */
  timestamp: number;
}

/** A single player's response for reveal breakdown */
export interface RevealPlayerEntry {
  playerId: string;
  playerName: string;
  value: string | number | boolean;
}

/** Payload for reveal:results events */
export interface RevealResultsPayload {
  /** Game session ID */
  gameSessionId: string;
  /** Count of responses per unique value */
  counts: Record<string, number>;
  /** Total number of responses received */
  totalResponses: number;
  /** Per-value breakdown with player lists */
  breakdown: Array<{
    value: string;
    count: number;
    players: RevealPlayerEntry[];
  }>;
  /** Complete list of all responses with player details */
  responses: RevealPlayerEntry[];
  /** Computed reveal result from engine */
  reveal: Record<string, unknown>;
  /** Updated game state snapshot */
  state: PartyGameState;
}

/** Payload for drinking:prompt events */
export interface DrinkingPromptPayload {
  /** Game session ID */
  gameSessionId: string;
  /** The player who performed the action */
  playerId: string;
  /** Type of drink action */
  action: DrinkAction;
  /** Target player (for assign actions), null otherwise */
  targetPlayerId: string | null;
  /** Current drink count for the player */
  drinkCount: {
    sips: number;
    shots: number;
    total: number;
  };
  /** Whether the drink limit was reached */
  limitReached: boolean;
  /** Unix timestamp */
  timestamp: number;
}

/** Payload for phase:change events */
export interface PhaseChangePayload {
  /** Game session ID */
  gameSessionId: string;
  /** Previous phase */
  fromPhase: GamePhase;
  /** New phase */
  toPhase: GamePhase;
  /** Current round number */
  roundNumber: number;
  /** Full game state snapshot */
  state: PartyGameState;
}

/** Payload for game:end events */
export interface GameEndPayload {
  /** Game session ID */
  gameSessionId: string;
  /** Reason for game ending */
  reason: "host_ended" | "content_exhausted" | "room_expired" | "player_left";
  /** Unix timestamp */
  timestamp: number;
}

/** Payload for player:left events */
export interface PlayerLeftPayload {
  playerId: string;
  playerName: string;
}

/** Payload for room:expired events */
export interface RoomExpiredPayload {
  roomId: string;
}

/**
 * Union type of all party game event payloads keyed by event name.
 */
export type PartyGameEventPayload = {
  [PARTY_EVENTS.CARD_SHOW]: CardShowPayload;
  [PARTY_EVENTS.RESPONSES_TALLY]: ResponsesTallyPayload;
  [PARTY_EVENTS.REVEAL_RESULTS]: RevealResultsPayload;
  [PARTY_EVENTS.DRINKING_PROMPT]: DrinkingPromptPayload;
  [PARTY_EVENTS.PHASE_CHANGE]: PhaseChangePayload;
  [PARTY_EVENTS.GAME_END]: GameEndPayload;
  [PARTY_EVENTS.PLAYER_LEFT]: PlayerLeftPayload;
  [PARTY_EVENTS.ROOM_EXPIRED]: RoomExpiredPayload;
};

// ──────────────────────────────────────────────
// CHANNEL NAME
// ──────────────────────────────────────────────

/**
 * Get the Realtime channel name for a given room.
 *
 * All party game events for a single room share one channel.
 * Events are distinguished by event name (e.g., "card:show").
 */
export function getPartyChannelName(roomId: string): string {
  return `room:${roomId}`;
}

// ──────────────────────────────────────────────
// SERVER-SIDE BROADCAST
// ──────────────────────────────────────────────

/**
 * Broadcast a typed party game event to the room's Realtime channel.
 *
 * Uses the server Supabase client (with service_role key) to create a
 * temporary channel subscription and send the broadcast. The channel
 * is cleaned up automatically when the serverless function terminates.
 *
 * Performance: < 200ms P95 expected within the same Supabase datacenter
 * region. The WebSocket connection is established per-call since
 * Next.js API routes are serverless/stateless.
 */
export async function broadcastPartyGameEvent(
  roomId: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  const channelName = getPartyChannelName(roomId);

  try {
    const supabase = await createClient();
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Broadcast timeout for ${event}`));
      }, 5000); // 5s safety timeout

      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          try {
            await channel.send({
              type: "broadcast",
              event,
              payload: {
                ...(payload as Record<string, unknown>),
                timestamp: Date.now(),
              },
            });
            clearTimeout(timeout);
            resolve();
          } catch (sendError) {
            clearTimeout(timeout);
            reject(sendError);
          }
        } else if (status === "CHANNEL_ERROR") {
          clearTimeout(timeout);
          reject(new Error(`Failed to subscribe to channel ${channelName}`));
        }
      });
    });
  } catch (error) {
    console.error(`[Realtime] Failed to broadcast ${event} to ${channelName}:`, error);
    // Non-fatal — game state is persisted via API responses
  }
}

// ──────────────────────────────────────────────
// BROADCAST HELPER — Latency tracking wrapper
// ──────────────────────────────────────────────

/**
 * Broadcast with optional latency measurement.
 *
 * Use in tests and monitoring to verify sync latency requirements
 * (VAL-CROSS-016: P95 < 200ms, no event > 500ms).
 */
export async function broadcastWithLatency(
  roomId: string,
  event: string,
  payload: Record<string, unknown>
): Promise<{ latencyMs: number }> {
  const start = performance.now();
  await broadcastPartyGameEvent(roomId, event, payload);
  const latencyMs = performance.now() - start;
  return { latencyMs };
}

// ──────────────────────────────────────────────
// BROADCAST TO ROOM — Lightweight helper for picker routes
// ──────────────────────────────────────────────

/**
 * Broadcast an event to a room's Realtime channel.
 *
 * Accepts a Supabase client instance so the caller controls lifecycle.
 * Resolves only after the channel subscription handshake completes and
 * the message is sent. The channel is cleaned up after a 500ms buffer.
 *
 * Rejects if the channel closes or encounters an error during subscription.
 *
 * This is the fix for the game picker fire-and-forget bug: by returning a
 * Promise that resolves only after the SUBSCRIBED callback fires, we ensure
 * the broadcast actually completes before the serverless function terminates.
 */
export async function broadcastToRoom(
  supabase: Awaited<ReturnType<typeof createClient>>,
  roomId: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const channel = supabase.channel(`room:${roomId}`, {
      config: { broadcast: { self: false } },
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.send({ type: "broadcast", event, payload });
        setTimeout(() => {
          supabase.removeChannel(channel);
          resolve();
        }, 500);
      }
      if (status === "CLOSED" || status === "CHANNEL_ERROR") {
        reject(new Error(`Broadcast failed: ${status}`));
      }
    });
  });
}
