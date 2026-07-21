/**
 * Type definitions for the UNO game engine.
 * All types are shared across pure game functions.
 */

export type CardColor = "red" | "blue" | "green" | "yellow";

export type CardValue =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "skip"
  | "reverse"
  | "draw2"
  | "wild"
  | "wild4";

export interface Card {
  /** The card's color. Undefined for Wild and Wild Draw 4 cards. */
  color?: CardColor;
  /** The card's value/rank. */
  value: CardValue;
  /** Unique ID for tracking specific card instances (for decks that have duplicates). */
  id: string;
}

export interface PlayerState {
  playerId: string;
  hand: Card[];
  calledUno: boolean;
}

export type GameStatus = "playing" | "paused" | "round_end" | "game_end";

export interface GameConfig {
  /** If true, players can chain Draw 2 and Wild Draw 4 cards. */
  drawStacking: boolean;
  /** If true, after drawing a card, player can play it immediately if valid. */
  drawUntilYouPlay: boolean;
  /** Turn timeout in seconds before auto-draw triggers. */
  turnTimeoutSeconds: number;
  /** Target score to win the game (default 500). */
  winningScore: number;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  drawStacking: false,
  drawUntilYouPlay: false,
  turnTimeoutSeconds: 60,
  winningScore: 500,
};

export interface GameState {
  deck: Card[];
  discardPile: Card[];
  players: PlayerState[];
  /** Index into the players array for whose turn it is. */
  currentPlayerIndex: number;
  /** 1 = clockwise, -1 = counter-clockwise. */
  direction: 1 | -1;
  config: GameConfig;
  status: GameStatus;
  /** The active color (set by the top of discard pile, or chosen on Wild). */
  currentColor: CardColor;
  /** Player ID who won the current round. */
  winnerId?: string;
  /** Number of cards the next player must draw (accumulated by Draw 2/Wild Draw 4). */
  pendingDrawCount: number;
  /** Timestamp when the current turn started (for timeout detection). */
  turnStartTime: number;
  /** Current round number. */
  roundNumber: number;
}

/**
 * Result of a playCard action.
 */
export interface PlayCardResult {
  state: GameState;
  error?: string;
}

/**
 * Result of a drawCard action.
 */
export interface DrawCardResult {
  state: GameState;
  card?: Card;
  error?: string;
}

/**
 * Standard UNO card scoring values.
 */
export const SCORE_VALUES: Record<string, number> = {
  "0": 0,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  skip: 20,
  reverse: 20,
  draw2: 20,
  wild: 50,
  wild4: 50,
};
