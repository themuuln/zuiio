/**
 * Shared types for the party game engine.
 *
 * Includes state, config, responses, drink records, and phase definitions.
 * ContentTier and GameContentEntry are imported from lib/content to
 * ensure type consistency across the codebase.
 */

import type { ContentTier, GameContentEntry } from "@/lib/content";
import type { DrinkAction } from "@/lib/constants";

// Re-export to ensure a single source of truth for tier types
export type { ContentTier };

/**
 * Party game phases representing each stage of a round.
 *
 * The core loop is:
 *   show-card → responding → revealing → drinking → next-round → show-card ...
 *
 * - show-card: The current card/question is displayed to all players
 * - responding: Players are submitting their responses
 * - revealing: Results are being shown (vote counts, per-player breakdowns)
 * - drinking: Drinking prompts are shown to relevant players
 * - next-round: Transitioning between rounds (advances to show-card)
 * - game-end: Game over, final results displayed
 */
export type GamePhase =
  | "show-card"
  | "responding"
  | "revealing"
  | "drinking"
  | "next-round"
  | "game-end";

/**
 * Configuration for a party game session.
 *
 * These settings control game behavior including content filtering,
 * drinking rules, timers, and tie-breaking.
 */
export interface PartyGameConfig {
  /** Content filtering tier (spicy | wild | after-dark) */
  vibeTier: ContentTier;
  /** Whether drink actions are enabled */
  drinkingEnabled: boolean;
  /** Maximum drinks a player can receive in a single round */
  maxDrinksPerRound: number;
  /** Penalty (in drinks) for passing on a turn */
  passPenalty: number;
  /** Timer duration in seconds for response/voting phases */
  timerSeconds: number;
  /** How ties are resolved during voting */
  tieRule: TieRule;
  /** Whether players can vote for themselves */
  allowSelfVote: boolean;
  /**
   * Internal: Content queue with smart shuffling.
   * Stored in the config JSON but managed by the engine.
   * Items are { id, category } objects to support truth/dare filtering.
   */
  _contentQueue?: {
    remaining: Array<{ id: string; category: string }>;
    recentlyShown: Array<{ id: string; category: string }>;
    windowSize: number;
  };

  /** Current active player ID for turn-based games (truth-or-dare) */
  activePlayerId?: string;
  /** Ordered array of player IDs for turn rotation (truth-or-dare) */
  turnOrder?: string[];
  /**
   * Internal: Drinking state tracker.
   * Stored in the config JSON but managed by the drinking engine.
   */
  _drinkingState?: {
    roundRecords: DrinkRecord[];
    cumulativeRecords: DrinkRecord[];
    penaltyPoints: Record<string, number>;
    roundNumber: number;
    passes: string[];
  };
}

/**
 * How ties are resolved during voting rounds.
 *
 * - all-drink: All tied players drink
 * - vote-off: Random runoff between tied options
 * - everyone-wins: Everyone gets a point (drinking game equivalent: everyone drinks)
 * - nobody-wins: No one gets a point (nobody drinks)
 */
export type TieRule =
  | "all-drink"
  | "vote-off"
  | "everyone-wins"
  | "nobody-wins";

/**
 * A single player's response to a card/question.
 *
 * The value field is flexible — it may be a text answer, a numeric rating,
 * or a boolean (yes/no) depending on the game type.
 */
export interface PlayerResponse {
  /** Unique player identifier */
  playerId: string;
  /** Display name of the player (for UI rendering) */
  playerName: string;
  /** The player's response (text, number, or boolean) */
  value: string | number | boolean;
  /** Unix timestamp (ms) when the response was submitted */
  timestamp: number;
}

/**
 * A record of a drink action assigned during gameplay.
 *
 * Actions match the DrinkAction type from lib/constants:
 * - sip: Take a sip of your drink
 * - shot: Take a shot (finish your drink)
 * - assign: Assign drinks to another player (requires targetPlayerId)
 * - waterfall: Start a waterfall (everyone drinks, then stops when you stop)
 * - group-shot: Everyone takes a shot simultaneously
 */
export interface DrinkRecord {
  /** Player who must drink */
  playerId: string;
  /** Type of drink action */
  action: DrinkAction;
  /** Which round this drink was assigned in */
  roundNumber: number;
  /** Unix timestamp (ms) when the drink was assigned */
  timestamp: number;
  /** Target player for "assign" actions */
  targetPlayerId?: string;
}

/**
 * Full state representation of an active party game session.
 *
 * Used for real-time sync between players and persisted to the database
 * as the game_sessions.config JSON field.
 */
export interface PartyGameState {
  /** Supabase game_sessions row ID */
  gameSessionId: string;
  /** The game type identifier (e.g., "truth-or-dare") */
  gameType: string;
  /** Current phase of the game */
  status: GamePhase;
  /** The current card/question being played, or null if no active card */
  currentCard: GameContentEntry | null;
  /** Current round number (1-indexed) */
  roundNumber: number;
  /** All player responses for the current round */
  responses: PlayerResponse[];
  /** Alias for status — reflects current phase */
  phase: GamePhase;
  /** Timer countdown in seconds, or null if timer is not running */
  timerSeconds: number | null;
  /** Game configuration for this session */
  config: PartyGameConfig;
}

export const DEFAULT_PARTY_GAME_CONFIG: PartyGameConfig = {
  vibeTier: "spicy",
  drinkingEnabled: true,
  maxDrinksPerRound: 3,
  passPenalty: 1,
  timerSeconds: 30,
  tieRule: "all-drink",
  allowSelfVote: false,
};
