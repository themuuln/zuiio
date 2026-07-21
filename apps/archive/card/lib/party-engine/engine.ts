/**
 * Party Game Engine — Core Game Logic
 *
 * Pure functions for the party game state machine:
 *   show-card → responding → revealing → drinking → next-round → show-card ...
 *
 * This engine is game-type agnostic — it powers Truth or Dare, Never Have I Ever,
 * Hot Takes, Most Likely To, and any future party game.
 *
 * All functions are pure: they take state in and return new state out,
 * with no side effects or mutations.
 */

import type { GameContentEntry } from "@/lib/content";
import { shuffleContent } from "@/lib/content";
import type {
  GamePhase,
  PartyGameConfig,
  PartyGameState,
  PlayerResponse,
} from "./types";

// ──────────────────────────────────────────────
// CONTENT QUEUE MANAGEMENT
// ──────────────────────────────────────────────

/**
 * Tracks the card queue with smart-shuffle support.
 *
 * - `remaining`: Cards not yet shown this cycle, in draw order
 * - `recentlyShown`: Cards shown in the last N rounds (newest first)
 * - `windowSize`: Maximum entries in recentlyShown. When exceeded,
 *   the oldest entries are shuffled back into `remaining`.
 *
 * The default windowSize of 10 ensures no card repeats within a
 * 10-round window, satisfying VAL-ENG-004.
 */
export interface ContentQueue {
  remaining: GameContentEntry[];
  recentlyShown: GameContentEntry[];
  windowSize: number;
}

/**
 * Create a fresh ContentQueue by filtering content for the given game type
 * and vibe tier, then shuffling.
 *
 * Tier inclusion rules:
 * - "spicy": only spicy entries
 * - "wild": spicy + wild entries
 * - "after-dark": all three tiers
 */
export function createContentQueue(
  gameType: string,
  allContent: GameContentEntry[],
  tier: PartyGameConfig["vibeTier"],
  windowSize = 10
): ContentQueue {
  const tierOrder = ["spicy", "wild", "after-dark"] as const;
  const maxTierIndex = tierOrder.indexOf(tier);

  const validTiers = tierOrder.slice(0, maxTierIndex + 1);

  const filtered = allContent.filter(
    (c) => c.gameType === gameType && validTiers.includes(c.tier as typeof tierOrder[number])
  );

  return {
    remaining: shuffleContent(filtered),
    recentlyShown: [],
    windowSize,
  };
}

/**
 * Get the next card from the queue using smart shuffle.
 *
 * The algorithm:
 * 1. Takes the first card from `remaining`
 * 2. Adds it to `recentlyShown` (newest first)
 * 3. If recentlyShown exceeds windowSize, shuffle the oldest entries
 *    back into remaining so they become available again
 * 4. Returns the card and updated queue
 *
 * Returns `{ card: null, queue }` when remaining is empty.
 */
export function getNextCard(
  queue: ContentQueue
): { card: GameContentEntry | null; queue: ContentQueue } {
  const { remaining, recentlyShown, windowSize } = queue;

  if (remaining.length === 0) {
    return { card: null, queue };
  }

  // Take the first card from remaining
  const [card, ...remainingRest] = remaining;

  // Add it to recentlyShown (newest first)
  const newRecentlyShown = [card, ...recentlyShown];

  let recycled: GameContentEntry[] = [];
  let finalRecentlyShown = newRecentlyShown;

  // If we've exceeded the window, recycle the oldest entries
  if (newRecentlyShown.length > windowSize) {
    recycled = newRecentlyShown.slice(windowSize);
    finalRecentlyShown = newRecentlyShown.slice(0, windowSize);
  }

  // Shuffle recycled entries and append to remaining
  const shuffledRecycled = recycled.length > 0 ? shuffleContent(recycled) : [];
  const finalRemaining = [...remainingRest, ...shuffledRecycled];

  return {
    card,
    queue: {
      remaining: finalRemaining,
      recentlyShown: finalRecentlyShown,
      windowSize,
    },
  };
}

// ──────────────────────────────────────────────
// GAME STATE CREATION
// ──────────────────────────────────────────────

/**
 * Create the initial PartyGameState for a new game session.
 *
 * The state starts in the "show-card" phase with the first card
 * pre-loaded (or null if the content queue is empty).
 *
 * @param params.gameSessionId - The game_sessions row ID
 * @param params.gameType - The type of party game
 * @param params.config - The game configuration
 * @param params.firstCard - The first card to show (from getNextCard), or null
 */
export function createInitialState(params: {
  gameSessionId: string;
  gameType: string;
  config: PartyGameConfig;
  firstCard: GameContentEntry | null;
}): PartyGameState {
  const { gameSessionId, gameType, config, firstCard } = params;

  return {
    gameSessionId,
    gameType,
    status: "show-card",
    currentCard: firstCard,
    roundNumber: 1,
    responses: [],
    phase: "show-card",
    timerSeconds: null,
    config,
  };
}

// ──────────────────────────────────────────────
// PHASE TRANSITIONS
// ──────────────────────────────────────────────

/**
 * Valid phase transitions in the party game state machine.
 *
 * The core loop is:
 *   show-card → responding → revealing → drinking → next-round → show-card ...
 *
 * game-end is a terminal state with no outgoing transitions.
 */
const VALID_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  "show-card": ["responding"],
  responding: ["revealing"],
  revealing: ["drinking"],
  drinking: ["next-round"],
  "next-round": ["show-card", "game-end"],
  "game-end": [],
};

/**
 * Attempt to advance the game to the next phase.
 *
 * If the transition is valid, returns the new state with the phase updated
 * and timerSeconds reset as appropriate.
 *
 * If the transition is invalid, returns `{ ok: false, error }`.
 *
 * @param state - The current game state
 * @param targetPhase - Optional explicit target phase. If omitted and there's
 *   only one valid transition, that one is used automatically.
 */
export function advancePhase(
  state: PartyGameState,
  targetPhase?: GamePhase
): PartyGameState | { ok: false; error: string } {
  const allowed = VALID_TRANSITIONS[state.phase];

  if (!allowed || allowed.length === 0) {
    return { ok: false, error: `No transitions allowed from phase "${state.phase}"` };
  }

  const nextPhase = targetPhase ?? allowed[0];

  if (!allowed.includes(nextPhase)) {
    return {
      ok: false,
      error: `Cannot transition from "${state.phase}" to "${nextPhase}". Allowed: ${allowed.join(", ")}`,
    };
  }

  // Compute timer for the new phase
  let timerSeconds: number | null = null;
  if (nextPhase === "responding") {
    timerSeconds = state.config.timerSeconds;
  }

  // When transitioning to next-round, clear the round's responses
  const responses = nextPhase === "next-round" ? [] : state.responses;

  return {
    ...state,
    status: nextPhase,
    phase: nextPhase,
    timerSeconds,
    responses,
  };
}

// ──────────────────────────────────────────────
// RESPONSE TALLYING
// ──────────────────────────────────────────────

/**
 * Tally player responses, grouped by response value.
 *
 * For Truth or Dare: counts of "truth", "dare", "pass"
 * For Never Have I Ever: counts of "have", "have-not"
 * For Hot Takes: counts of "agree", "disagree"
 * For Most Likely To: counts per targeted player ID
 *
 * @returns A record mapping response values to their counts.
 */
export function tallyResponses(responses: PlayerResponse[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const response of responses) {
    const key = String(response.value);
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return counts;
}

// ──────────────────────────────────────────────
// REVEAL COMPUTATION
// ──────────────────────────────────────────────

/**
 * Breakdown of which players chose each response value.
 */
export interface RevealBreakdown {
  value: string;
  players: Array<{ playerId: string; playerName: string }>;
  count: number;
}

/**
 * The computed reveal result for a game round.
 */
export interface RevealResult {
  /** Count of responses per value */
  counts: Record<string, number>;
  /** Per-value breakdown of which players chose which */
  breakdown: RevealBreakdown[];
  /** Total number of responses received */
  totalResponses: number;
}

/**
 * Compute the reveal result from the current game state.
 *
 * Groups responses by value and returns both counts and
 * per-player breakdowns for the reveal UI.
 */
export function computeReveal(state: PartyGameState): RevealResult {
  const counts = tallyResponses(state.responses);

  // Group player IDs by response value
  const playersByValue = new Map<string, Array<{ playerId: string; playerName: string }>>();

  for (const response of state.responses) {
    const key = String(response.value);
    if (!playersByValue.has(key)) {
      playersByValue.set(key, []);
    }
    playersByValue.get(key)!.push({
      playerId: response.playerId,
      playerName: response.playerName,
    });
  }

  const breakdown: RevealBreakdown[] = Array.from(playersByValue.entries()).map(
    ([value, players]) => ({
      value,
      players,
      count: players.length,
    })
  );

  return {
    counts,
    breakdown,
    totalResponses: state.responses.length,
  };
}

// ──────────────────────────────────────────────
// TIMER HANDLING
// ──────────────────────────────────────────────

/**
 * Handle timer expiry for the current game phase.
 *
 * Behaves as follows per phase:
 * - "show-card": advance to "responding" (auto-start response timer)
 * - "responding": advance to "revealing" (end response period)
 * - "revealing": advance to "drinking" (auto-advance reveal)
 * - "drinking": advance to "next-round" (auto-advance drinking)
 * - "next-round": stays in "next-round" (wait for host to advance)
 * - "game-end": stays in "game-end" (terminal)
 *
 * @returns The updated state, or the same state if no auto-advance is possible.
 */
export function handleTimerExpiry(state: PartyGameState): PartyGameState {
  const { phase } = state;

  switch (phase) {
    case "show-card":
      return safeAdvance(state, "responding");
    case "responding":
      return safeAdvance(state, "revealing");
    case "revealing":
      return safeAdvance(state, "drinking");
    case "drinking":
      return safeAdvance(state, "next-round");
    case "next-round":
    case "game-end":
      return { ...state, timerSeconds: null };
  }
}

/**
 * Internal helper: advance phase, returning the state on success or
 * the original state on failure (graceful fallback).
 */
function safeAdvance(state: PartyGameState, target: GamePhase): PartyGameState {
  const result = advancePhase(state, target);
  if ("ok" in result && !result.ok) {
    return { ...state, timerSeconds: null };
  }
  return result as PartyGameState;
}

// ──────────────────────────────────────────────
// GAME END CHECK
// ──────────────────────────────────────────────

/**
 * Check whether the game should end.
 */
export interface GameEndCheck {
  isEnded: boolean;
  reason?: "content_exhausted" | "max_rounds_reached";
}

/**
 * Maximum number of rounds before the game automatically ends.
 * This prevents infinite games and provides an upper bound.
 */
export const MAX_ROUNDS = 50;

/**
 * Check if the game should end based on the current queue state.
 *
 * - If the content queue is empty and we're about to need a new card,
 *   the game ends with reason "content_exhausted".
 * - If the round number exceeds MAX_ROUNDS, the game ends.
 */
export function checkGameEnd(
  queue: ContentQueue,
  roundNumber: number
): GameEndCheck {
  if (queue.remaining.length === 0) {
    return { isEnded: true, reason: "content_exhausted" };
  }

  if (roundNumber > MAX_ROUNDS) {
    return { isEnded: true, reason: "max_rounds_reached" };
  }

  return { isEnded: false };
}

// ──────────────────────────────────────────────
// HOT TAKES — Drinker Determination
// ──────────────────────────────────────────────

/**
 * Result of determining who drinks in a Hot Takes round.
 */
export interface HotTakesDrinkersResult {
  /** Player IDs who should drink */
  drinkers: string[];
  /** The response value that is in the minority */
  minorityValue: string | null;
  /** The response value that is in the majority */
  majorityValue: string | null;
  /** Whether the vote was unanimous */
  isUnanimous: boolean;
  /** Message to show when unanimous */
  unanimousMessage: string | null;
  /** Whether the vote was a tie */
  isTie: boolean;
  /** Message to show when tied */
  tieMessage: string | null;
  /** Message for the minority group */
  minorityMessage: string | null;
  /** Message for the majority group */
  majorityMessage: string | null;
  /** Number of agree votes */
  agreeCount: number;
  /** Number of disagree votes */
  disagreeCount: number;
  /** Total number of votes cast */
  totalVotes: number;
}

/**
 * Determine which players should drink based on Hot Takes responses.
 *
 * Rules:
 * - Unanimous (all agree or all disagree): no one drinks
 * - Tie (equal agree/disagree): depends on tieRule
 *   - "all-drink" / "everyone-wins": everyone drinks
 *   - "nobody-wins" / "none": no one drinks
 *   - "vote-off": treated as tie, no one drinks by default
 * - Normal: minority group drinks
 */
export function determineHotTakesDrinkers(
  responses: PlayerResponse[],
  tieRule: PartyGameConfig["tieRule"]
): HotTakesDrinkersResult {
  const agreeCount = responses.filter((r) => r.value === "agree").length;
  const disagreeCount = responses.filter((r) => r.value === "disagree").length;
  const totalVotes = responses.length;

  const defaultResult: Omit<HotTakesDrinkersResult, "drinkers"> = {
    minorityValue: null,
    majorityValue: null,
    isUnanimous: false,
    unanimousMessage: null,
    isTie: false,
    tieMessage: null,
    minorityMessage: null,
    majorityMessage: null,
    agreeCount,
    disagreeCount,
    totalVotes,
  };

  // Empty responses
  if (totalVotes === 0) {
    return { ...defaultResult, drinkers: [] };
  }

  // Unanimous: all agree or all disagree
  if (agreeCount === 0 || disagreeCount === 0) {
    const value = agreeCount > 0 ? "agree" : "disagree";
    return {
      ...defaultResult,
      drinkers: [],
      isUnanimous: true,
      unanimousMessage: `Unanimous! Everyone ${value === "agree" ? "agreed" : "disagreed"}.`,
      majorityValue: value,
    };
  }

  // Tie
  if (agreeCount === disagreeCount) {
    const allDrink = tieRule === "all-drink" || tieRule === "everyone-wins";
    const drinkers = allDrink ? responses.map((r) => r.playerId) : [];
    return {
      ...defaultResult,
      drinkers,
      isTie: true,
      tieMessage: allDrink ? "It's a tie! Everyone drinks!" : "It's a tie! No one drinks.",
      majorityValue: "agree",
      minorityValue: "disagree",
    };
  }

  // Normal: minority drinks
  const isAgreeMinority = agreeCount < disagreeCount;
  const minorityValue = isAgreeMinority ? "agree" : "disagree";
  const majorityValue = isAgreeMinority ? "disagree" : "agree";

  const drinkers = responses
    .filter((r) => r.value === minorityValue)
    .map((r) => r.playerId);

  return {
    ...defaultResult,
    drinkers,
    minorityValue,
    majorityValue,
    isUnanimous: false,
    isTie: false,
    minorityMessage: `You're in the minority — take a sip!`,
    majorityMessage: "You're with the majority!",
  };
}

// ──────────────────────────────────────────────
// MOST LIKELY TO — Winner Determination
// ──────────────────────────────────────────────

/**
 * Result of determining the winner(s) of a Most Likely To round.
 */
export interface MostLikelyToResult {
  /** Player ID(s) of the winner(s) — may be multiple in case of tie */
  winners: string[];
  /** Vote counts per targeted player ID */
  voteCounts: Record<string, number>;
  /** Maximum number of votes received by any player */
  maxVotes: number;
  /** Whether there's a tie for first place */
  isTie: boolean;
  /** Total number of voters */
  totalVoters: number;
  /** Convenience function to check if a player is a winner */
  isWinner: (playerId: string) => boolean;
}

/**
 * Determine the winner(s) of a Most Likely To round.
 *
 * Counts votes per targeted player and returns the player(s)
 * with the most votes. Handles ties by returning multiple winners.
 */
export function determineMostLikelyToWinners(
  responses: PlayerResponse[]
): MostLikelyToResult {
  // Count votes per target player
  const voteCounts: Record<string, number> = {};

  for (const response of responses) {
    const targetId = String(response.value);
    voteCounts[targetId] = (voteCounts[targetId] ?? 0) + 1;
  }

  const totalVoters = responses.length;

  // Find max votes
  const counts = Object.values(voteCounts);
  const maxVotes = counts.length > 0 ? Math.max(...counts) : 0;

  // Find all players with max votes
  const winners = Object.entries(voteCounts)
    .filter(([, count]) => count === maxVotes)
    .map(([playerId]) => playerId);

  const isTie = winners.length > 1;

  return {
    winners,
    voteCounts,
    maxVotes,
    isTie,
    totalVoters,
    isWinner: (playerId: string) => winners.includes(playerId),
  };
}
