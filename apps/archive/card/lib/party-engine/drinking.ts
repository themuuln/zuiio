/**
 * Party Game Drinking Engine
 *
 * Cross-game drinking system that powers all party game drinking actions.
 *
 * Actions: sip, shot, assign (target another player), waterfall, group-shot
 *
 * Safety features:
 * - maxDrinksPerRound (per-round reset): limits total drinks per player per round
 * - Pass option: players can always pass without recording a drink
 * - Dry mode: penalty points instead of drinks when drinking is disabled
 *
 * All functions are pure: they take state in and return new state out,
 * with no side effects or mutations.
 *
 * @module drinking
 */

import type { DrinkAction } from "@/lib/constants";
import type { DrinkRecord } from "./types";

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

/**
 * Drinking-specific configuration.
 *
 * Derived from PartyGameConfig but focused on drinking behavior.
 */
export interface DrinkConfig {
  /** Maximum drinks (or penalties in dry mode) per player per round.
   *  0 means unlimited. */
  maxDrinksPerRound: number;
  /** Whether drinking is enabled. When false, penalty points replace drinks. */
  drinkingEnabled: boolean;
}

/**
 * Tracks the complete drinking state for a game session.
 *
 * Drinking state is split into two tiers:
 * - `roundRecords`: Per-round records, reset each round for limit enforcement
 * - `cumulativeRecords`: All-time records, persists across rounds for total counting
 * - `penaltyPoints`: Per-player penalty count when in dry mode
 * - `roundNumber`: Current round for record-keeping
 * - `passes`: Player IDs who passed this round (no drink recorded)
 */
export interface DrinkingState {
  /** Drink records for the current round only (reset between rounds) */
  roundRecords: DrinkRecord[];
  /** Drink records across all rounds (never reset, used for cumulative totals) */
  cumulativeRecords: DrinkRecord[];
  /** Penalty points per player in dry mode (persists across rounds) */
  penaltyPoints: Record<string, number>;
  /** Current round number */
  roundNumber: number;
  /** Player IDs who passed on a drinking prompt this round */
  passes: string[];
}

/**
 * Result of applying a drink action.
 */
export interface DrinkActionResult {
  /** Whether the action was successfully applied */
  success: boolean;
  /** The updated drinking state */
  state: DrinkingState;
  /** The created drink record (undefined in dry mode or on failure) */
  record?: DrinkRecord;
  /** Whether the player has reached their per-round limit */
  limitReached?: boolean;
  /** Error message if the action failed */
  error?: string;
}

/**
 * Cumulative drink counts for a player.
 */
export interface DrinkCount {
  /** Total sip actions (includes assign sips) */
  sips: number;
  /** Total shot actions (includes assign shots) */
  shots: number;
  /** Total of all drink actions combined */
  total: number;
}

/**
 * Result of checking a player's drink limit.
 */
export interface LimitCheck {
  /** Whether the player is allowed to take another drink */
  allowed: boolean;
  /** Current number of drinks (or penalties) this round */
  current: number;
  /** Maximum allowed per round (0 = unlimited) */
  max: number;
}

// ──────────────────────────────────────────────
// STATE CREATION
// ──────────────────────────────────────────────

/**
 * Create an empty drinking state for a given round.
 *
 * @param roundNumber - The round to start tracking from
 * @returns A fresh DrinkingState with no records
 */
export function createDrinkingState(roundNumber: number): DrinkingState {
  return {
    roundRecords: [],
    cumulativeRecords: [],
    penaltyPoints: {},
    roundNumber,
    passes: [],
  };
}

// ──────────────────────────────────────────────
// CORE: APPLY DRINK ACTION
// ──────────────────────────────────────────────

/**
 * Check if an action type is a valid DrinkAction.
 */
const VALID_ACTIONS: ReadonlySet<string> = new Set([
  "sip",
  "shot",
  "assign",
  "waterfall",
  "group-shot",
]);

/**
 * Apply a drink action for a player, recording it if within limits.
 *
 * Dry mode behavior:
 * - When `drinkingEnabled = false`, penalty points are recorded instead of drinks.
 * - No DrinkRecord is created in dry mode.
 * - The maxDrinksPerRound limit still applies (counting penalty points).
 *
 * Assign action behavior:
 * - Requires a `targetPlayerId` to be provided.
 * - The record is created with `playerId` = the assigner and
 *   `targetPlayerId` = the targeted player.
 * - The drink counts toward the assigner's per-round limit.
 *
 * @param state - Current drinking state
 * @param config - Drinking configuration
 * @param action - Type of drink action
 * @param playerId - The player performing the action
 * @param targetPlayerId - Required for "assign" actions
 * @returns The action result with updated state
 */
export function applyDrinkAction(
  state: DrinkingState,
  config: DrinkConfig,
  action: DrinkAction,
  playerId: string,
  targetPlayerId?: string
): DrinkActionResult {
  // Validate action type
  if (!VALID_ACTIONS.has(action)) {
    return {
      success: false,
      state,
      error: `Invalid drink action: "${action}". Valid: sip, shot, assign, waterfall, group-shot`,
    };
  }

  // Validate assign has a target
  if (action === "assign" && !targetPlayerId) {
    return {
      success: false,
      state,
      error: "Assign action requires a targetPlayerId",
    };
  }

  // Check limit
  const limit = checkDrinkLimit(state, config, playerId);
  if (!limit.allowed) {
    return {
      success: false,
      state,
      limitReached: true,
      error: `Player "${playerId}" has reached their per-round drink limit (${limit.max})`,
    };
  }

  // In dry mode, record penalty points instead of drinks
  if (!config.drinkingEnabled) {
    const newPenaltyPoints = {
      ...state.penaltyPoints,
      [playerId]: (state.penaltyPoints[playerId] ?? 0) + 1,
    };

    return {
      success: true,
      state: {
        ...state,
        penaltyPoints: newPenaltyPoints,
      },
      // No record created in dry mode
    };
  }

  // Create the drink record
  const timestamp = Date.now();
  const record: DrinkRecord = {
    playerId,
    action,
    roundNumber: state.roundNumber,
    timestamp,
  };

  if (targetPlayerId) {
    record.targetPlayerId = targetPlayerId;
  }

  return {
    success: true,
    state: {
      ...state,
      roundRecords: [...state.roundRecords, record],
      cumulativeRecords: [...state.cumulativeRecords, record],
    },
    record,
  };
}

// ──────────────────────────────────────────────
// GET DRINK COUNT
// ──────────────────────────────────────────────

/**
 * Get cumulative drink counts for a specific player.
 *
 * Counts are computed from cumulativeRecords (all rounds).
 * Dry mode penalty points are NOT included in sip/shot/total counts.
 *
 * Action type mapping for counting:
 * - sips: "sip" actions
 * - shots: "shot" actions
 * - total: all actions (sip, shot, assign, waterfall, group-shot)
 *
 * @param state - Current drinking state
 * @param playerId - The player to get counts for
 * @returns Drink counts (sips, shots, total)
 */
export function getDrinkCount(
  state: DrinkingState,
  playerId: string
): DrinkCount {
  const playerRecords = state.cumulativeRecords.filter(
    (r) => r.playerId === playerId
  );

  const sips = playerRecords.filter((r) => r.action === "sip").length;
  const shots = playerRecords.filter((r) => r.action === "shot").length;
  const total = playerRecords.length;

  return { sips, shots, total };
}

// ──────────────────────────────────────────────
// CHECK DRINK LIMIT
// ──────────────────────────────────────────────

/**
 * Check whether a player has reached their per-round drink limit.
 *
 * In drinking mode, the limit counts roundRecords for the player.
 * In dry mode, the limit counts penaltyPoints for the player.
 *
 * A maxDrinksPerRound of 0 means unlimited.
 *
 * @param state - Current drinking state
 * @param config - Drinking configuration
 * @param playerId - The player to check
 * @returns Limit check result
 */
export function checkDrinkLimit(
  state: DrinkingState,
  config: DrinkConfig,
  playerId: string
): LimitCheck {
  const max = config.maxDrinksPerRound;

  // 0 means unlimited
  if (max === 0) {
    return { allowed: true, current: 0, max: 0 };
  }

  let current: number;

  if (config.drinkingEnabled) {
    // In drinking mode, count round records
    current = state.roundRecords.filter((r) => r.playerId === playerId).length;
  } else {
    // In dry mode, count penalty points
    current = state.penaltyPoints[playerId] ?? 0;
  }

  return {
    allowed: current < max,
    current,
    max,
  };
}

// ──────────────────────────────────────────────
// RECORD PASS
// ──────────────────────────────────────────────

/**
 * Record that a player passed on a drinking prompt.
 *
 * A pass does NOT create a drink record or penalty point.
 * It is tracked separately in the `passes` array.
 * Passes do NOT count toward the per-round drink limit.
 *
 * @param state - Current drinking state
 * @param playerId - The player who passed
 * @returns Updated drinking state with pass recorded
 */
export function recordPass(
  state: DrinkingState,
  playerId: string
): DrinkingState {
  return {
    ...state,
    passes: [...state.passes, playerId],
  };
}

// ──────────────────────────────────────────────
// RESET ROUND DRINKS
// ──────────────────────────────────────────────

/**
 * Reset the per-round drink tracking for a new round.
 *
 * This clears:
 * - roundRecords (for fresh limit enforcement)
 * - passes (for fresh pass tracking)
 *
 * This preserves:
 * - cumulativeRecords (for cumulative counting across rounds)
 * - penaltyPoints (cumulative penalty tracking in dry mode)
 *
 * @param state - Current drinking state
 * @param newRoundNumber - The new round number
 * @returns Updated drinking state for the new round
 */
export function resetRoundDrinks(
  state: DrinkingState,
  newRoundNumber: number
): DrinkingState {
  return {
    ...state,
    roundRecords: [],
    passes: [],
    roundNumber: newRoundNumber,
  };
}
