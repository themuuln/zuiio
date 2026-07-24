/**
 * Party Game Engine
 *
 * Barrel export for all party game engine modules.
 */

export {
  type ContentTier,
  type GamePhase,
  type PartyGameConfig,
  type PlayerResponse,
  type DrinkRecord,
  type PartyGameState,
  type TieRule,
  DEFAULT_PARTY_GAME_CONFIG,
} from "./types";

export {
  createContentQueue,
  getNextCard,
  createInitialState,
  advancePhase,
  tallyResponses,
  computeReveal,
  handleTimerExpiry,
  checkGameEnd,
  determineHotTakesDrinkers,
  determineMostLikelyToWinners,
  MAX_ROUNDS,
} from "./engine";

export type {
  ContentQueue,
  RevealBreakdown,
  RevealResult,
  GameEndCheck,
  HotTakesDrinkersResult,
  MostLikelyToResult,
} from "./engine";

export {
  createDrinkingState,
  applyDrinkAction,
  getDrinkCount,
  checkDrinkLimit,
  recordPass,
  resetRoundDrinks,
} from "./drinking";

export type {
  DrinkConfig,
  DrinkingState,
  DrinkActionResult,
  DrinkCount,
  LimitCheck,
} from "./drinking";

export {
  PARTY_EVENTS,
  getPartyChannelName,
  broadcastPartyGameEvent,
  broadcastWithLatency,
  broadcastToRoom,
} from "./realtime";

export type {
  PartyEventName,
  CardShowPayload,
  ResponsesTallyPayload,
  RevealPlayerEntry,
  RevealResultsPayload,
  DrinkingPromptPayload,
  PhaseChangePayload,
  GameEndPayload,
  PlayerLeftPayload,
  RoomExpiredPayload,
  PartyGameEventPayload,
} from "./realtime";
