/**
 * Core UNO game logic as pure functions.
 * All functions return new state — they never mutate inputs.
 */

import type {
  Card,
  CardColor,
  CardValue,
  GameState,
  GameConfig,
  PlayerState,
  PlayCardResult,
  DrawCardResult,
} from "./types";
import { SCORE_VALUES, DEFAULT_GAME_CONFIG } from "./types";
import { createDeck, shuffleDeck, dealCards, drawFromDeck } from "./deck";

// ──────────── Utility ────────────

/**
 * Deep-clone a GameState to keep functions pure.
 */
function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}

// ──────────── Initialization ────────────

/**
 * Create an initial game state.
 *
 * 1. Creates and shuffles a deck (108 cards)
 * 2. Deals 7 cards to each player
 * 3. Sets the first discard card (ensures it is a number card)
 * 4. Sets the first player as current
 */
export function createInitialGameState(
  config: Partial<GameConfig> = {},
  playerIds: string[]
): GameState {
  const mergedConfig: GameConfig = { ...DEFAULT_GAME_CONFIG, ...config };

  // Create and shuffle deck
  let deck = shuffleDeck(createDeck());
  const { hands, remainingDeck } = dealCards(deck, playerIds.length);
  deck = remainingDeck;

  // Place a number card as the starting discard
  const { drawnCards: firstDiscard, newDeck: deckAfterDiscard } =
    drawFirstDiscard(deck);

  const discardPile = firstDiscard.length > 0 ? firstDiscard : [];

  // Determine current color from the top discard
  const topDiscard = discardPile[discardPile.length - 1];
  const currentColor: CardColor = topDiscard.color ?? "red";

  const players: PlayerState[] = playerIds.map((id, i) => ({
    playerId: id,
    hand: hands[i],
    calledUno: false,
  }));

  return {
    deck: deckAfterDiscard,
    discardPile,
    players,
    currentPlayerIndex: 0,
    direction: 1,
    config: mergedConfig,
    status: "playing",
    currentColor,
    winnerId: undefined,
    pendingDrawCount: 0,
    turnStartTime: Date.now(),
    roundNumber: 1,
  };
}

/**
 * Draw cards from the top of the deck until we get a number card
 * to be the first discard. This is standard UNO — the game cannot
 * start with an action or wild card on top.
 */
function drawFirstDiscard(
  deck: Card[]
): { drawnCards: Card[]; newDeck: Card[] } {
  const drawn: Card[] = [];
  const remaining = [...deck];

  while (remaining.length > 0) {
    const card = remaining.shift()!;
    drawn.push(card);
    if (isNumberCard(card.value)) {
      return { drawnCards: drawn, newDeck: remaining };
    }
  }

  // Fallback: if we exhausted the deck, just use whatever we drew
  return { drawnCards: drawn, newDeck: remaining };
}

/**
 * Check if a card value is a number card.
 */
function isNumberCard(value: CardValue): boolean {
  return ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(value);
}

// ──────────── Validation ────────────

/**
 * Check whether a card can be played on the current top discard.
 *
 * Rules:
 *  - Wild cards (wild, wild4) can always be played
 *  - Card color matches the current color
 *  - Card value matches the top discard's value
 *  - Non-wild cards must match color OR value
 *
 * Wild Draw 4 has additional restrictions in official rules (can only
 * be played if you don't have the matching color), but we allow it
 * any time for simplicity in the standard validation.
 */
export function isValidPlay(
  card: Card,
  topDiscard: Card,
  currentColor: CardColor
): boolean {
  // Wild cards are always valid
  if (card.value === "wild" || card.value === "wild4") {
    return true;
  }

  // Color matches
  if (card.color === currentColor) {
    return true;
  }

  // Value matches the top discard
  if (card.value === topDiscard.value) {
    return true;
  }

  return false;
}

/**
 * Check if a player can play any card from their hand on the current discard.
 */
export function hasPlayableCard(
  hand: Card[],
  topDiscard: Card,
  currentColor: CardColor
): boolean {
  return hand.some((card) => isValidPlay(card, topDiscard, currentColor));
}

// ──────────── Turn Logic ────────────

/**
 * Calculate the next player index based on direction.
 * Does NOT account for skip effects — returns the immediate next player.
 */
export function getNextPlayerIndex(
  currentPlayerIndex: number,
  direction: 1 | -1,
  numPlayers: number
): number {
  const next = currentPlayerIndex + direction;
  if (next < 0) return numPlayers - 1;
  if (next >= numPlayers) return 0;
  return next;
}

/**
 * Advance the turn to the next active player.
 * If `skipCount` > 0, skips that many players (used for Skip cards, etc.).
 * Does NOT reset pendingDrawCount — that is handled separately
 * when the affected player draws cards.
 */
export function advanceTurn(state: GameState, skipCount = 0): GameState {
  const next = cloneState(state);
  const steps = 1 + Math.max(0, skipCount);

  for (let i = 0; i < steps; i++) {
    next.currentPlayerIndex = getNextPlayerIndex(
      next.currentPlayerIndex,
      next.direction,
      next.players.length
    );
  }

  next.turnStartTime = Date.now();

  return next;
}

// ──────────── Card Effects ────────────

/**
 * Apply the effects of an action card to the state.
 * Returns the modified state (skip count, direction change, draws, etc.).
 * The effects are applied BEFORE advancing the turn.
 */
export function applyCardEffects(
  state: GameState,
  card: Card,
  chosenColor?: CardColor
): { state: GameState; skipCount: number } {
  const next = cloneState(state);
  let skipCount = 0;

  switch (card.value) {
    case "skip": {
      // Next player loses their turn
      skipCount = 1;
      break;
    }

    case "reverse": {
      if (next.players.length === 2) {
        // In 2-player, Reverse acts as Skip
        skipCount = 1;
      } else {
        // Reverse direction
        next.direction = (next.direction === 1 ? -1 : 1) as 1 | -1;
      }
      break;
    }

    case "draw2": {
      if (next.config.drawStacking && next.pendingDrawCount > 0) {
        // Chain the Draw 2 on top of existing draws
        next.pendingDrawCount += 2;
      } else {
        next.pendingDrawCount = 2;
      }
      skipCount = 1;
      break;
    }

    case "wild4": {
      next.currentColor = chosenColor ?? "red";
      if (next.config.drawStacking && next.pendingDrawCount > 0) {
        // Chain the wild4 on top of existing draws
        next.pendingDrawCount += 4;
      } else {
        next.pendingDrawCount = 4;
      }
      skipCount = 1;
      break;
    }

    case "wild": {
      next.currentColor = chosenColor ?? "red";
      break;
    }

    default: {
      // Number cards have no special effects
      break;
    }
  }

  return { state: next, skipCount };
}

// ──────────── Play Card ────────────

/**
 * Play a card from a player's hand.
 *
 * Validates:
 *  - It's the player's turn
 *  - The card is in the player's hand
 *  - The play is valid (matches color/value, or wild)
 *
 * On success: removes card from hand, adds to discard pile,
 * applies card effects, advances turn, checks for win.
 */
export function playCard(
  state: GameState,
  playerId: string,
  cardIndex: number,
  chosenColor?: CardColor
): PlayCardResult {
  // Validate game is not paused
  if (state.status === "paused") {
    return { state, error: "Game is paused" };
  }

  const currentPlayer = state.players[state.currentPlayerIndex];

  // Validate it's the player's turn
  if (currentPlayer.playerId !== playerId) {
    return { state, error: "Not your turn" };
  }

  // Validate card index
  if (cardIndex < 0 || cardIndex >= currentPlayer.hand.length) {
    return { state, error: "Invalid card index" };
  }

  const card = currentPlayer.hand[cardIndex];

  // Wild cards need a chosen color
  if ((card.value === "wild" || card.value === "wild4") && !chosenColor) {
    return { state, error: "Must choose a color for wild cards" };
  }

  const topDiscard = state.discardPile[state.discardPile.length - 1];

  // Validate play
  if (!isValidPlay(card, topDiscard, state.currentColor)) {
    return { state, error: "Invalid play: card does not match color or value" };
  }

  // Check draw stacking — if pendingDrawCount > 0
  if (state.pendingDrawCount > 0) {
    if (!state.config.drawStacking) {
      // Without stacking, you must draw the penalty cards; no card can be played
      return {
        state,
        error: "Must draw cards to resolve pending draws before playing",
      };
    }
    // With stacking enabled, only Draw 2 or Wild Draw 4 can chain
    if (card.value !== "draw2" && card.value !== "wild4") {
      return {
        state,
        error:
          "Must play a Draw 2 or Wild Draw 4 when draws are pending (draw stacking)",
      };
    }
  }

  // Apply the action
  const next = cloneState(state);
  const player = next.players[next.currentPlayerIndex];

  // Remove card from hand
  const [playedCard] = player.hand.splice(cardIndex, 1);

  // If the card has a color, it becomes the current color (for non-wild cards)
  if (playedCard.color) {
    next.currentColor = playedCard.color;
  }

  // Add to discard pile
  next.discardPile.push(playedCard);

  // Apply card effects
  const { state: afterEffects, skipCount } = applyCardEffects(
    next,
    playedCard,
    chosenColor
  );

  // Check win (empty hand)
  const playerAfterPlay = afterEffects.players.find(
    (p) => p.playerId === playerId
  );
  if (playerAfterPlay && playerAfterPlay.hand.length === 0) {
    afterEffects.status = "round_end";
    afterEffects.winnerId = playerId;
    return { state: afterEffects };
  }

  // Check if the player called UNO (only matters if they have 1 card left)
  const playerAfter = afterEffects.players.find(
    (p) => p.playerId === playerId
  );
  if (playerAfter && playerAfter.hand.length === 1) {
    playerAfter.calledUno = false; // Reset — they need to call UNO
  }

  // Advance turn
  const finalState = advanceTurn(afterEffects, skipCount);
  return { state: finalState };
}

// ──────────── Draw Card ────────────

/**
 * Draw a card from the deck for the current player.
 *
 * If pendingDrawCount > 0 (from Draw 2 / Wild Draw 4), draws that many cards
 * and skips the player's turn.
 *
 * If deck is empty, reshuffles the discard pile into the deck.
 *
 * If draw-until-you-play is enabled and the drawn card is playable,
 * the player can play it (returned in the result).
 */
export function drawCard(
  state: GameState,
  playerId: string
): DrawCardResult {
  // Validate game is not paused
  if (state.status === "paused") {
    return { state, error: "Game is paused" };
  }

  const currentPlayer = state.players[state.currentPlayerIndex];

  // Validate it's the player's turn
  if (currentPlayer.playerId !== playerId) {
    return { state, error: "Not your turn" };
  }

  const next = cloneState(state);
  const player = next.players[next.currentPlayerIndex];

  // Determine how many cards to draw
  const drawCount =
    next.pendingDrawCount > 0 ? next.pendingDrawCount : 1;

  const drawnCards: Card[] = [];
  let currentDeck = [...next.deck];
  let currentDiscard = [...next.discardPile];

  for (let i = 0; i < drawCount; i++) {
    const result = drawFromDeck(currentDeck, currentDiscard);
    if (result.drawnCards.length === 0) {
      // Cannot draw — deck is empty and discard has only 1 card
      break;
    }
    drawnCards.push(...result.drawnCards);
    currentDeck = result.newDeck;
    currentDiscard = result.newDiscardPile;
  }

  // Add drawn cards to hand
  player.hand.push(...drawnCards);

  // Update state
  next.deck = currentDeck;
  next.discardPile = currentDiscard;

  // Check if drawn card is playable (draw-until-you-play)
  const topDiscard = next.discardPile[next.discardPile.length - 1];
  const playableDrawn = drawnCards.filter((c) =>
    isValidPlay(c, topDiscard, next.currentColor)
  );

  if (next.config.drawUntilYouPlay && playableDrawn.length > 0) {
    // Return the state with the drawn card still in hand,
    // and indicate which drawn card is playable
    return {
      state: next,
      card: drawnCards[0],
    };
  }

  // Reset pending draws and advance turn
  next.pendingDrawCount = 0;
  next.turnStartTime = Date.now();

  // Advance to next player
  next.currentPlayerIndex = getNextPlayerIndex(
    next.currentPlayerIndex,
    next.direction,
    next.players.length
  );

  return { state: next, card: drawnCards.length > 0 ? drawnCards[0] : undefined };
}

// ──────────── Scoring ────────────

/**
 * Calculate the score for a single hand (collection of cards).
 * Used at the end of a round.
 *
 * Scoring:
 *  - Number cards (0-9): face value
 *  - Skip, Reverse, Draw 2: 20 points each
 *  - Wild, Wild Draw 4: 50 points each
 */
export function calculateScore(hand: Card[]): number {
  return hand.reduce((total, card) => {
    return total + (SCORE_VALUES[card.value] ?? 0);
  }, 0);
}

/**
 * Check if a round has ended (a player has no cards).
 * Returns the winner's player ID, or undefined if no winner.
 */
export function checkRoundEnd(state: GameState): string | undefined {
  for (const player of state.players) {
    if (player.hand.length === 0) {
      return player.playerId;
    }
  }
  return undefined;
}

/**
 * Calculate scores for all players at the end of a round.
 * Returns a map of playerId -> score for this round.
 * The winner gets the sum of all opponents' card values.
 */
export function calculateRoundScores(
  state: GameState
): Record<string, number> {
  const winner = state.players.find((p) => p.hand.length === 0);
  if (!winner) {
    // No winner yet — no scores
    const scores: Record<string, number> = {};
    for (const player of state.players) {
      scores[player.playerId] = 0;
    }
    return scores;
  }

  // Winner gets sum of all opponents' hand values
  const opponentTotal = state.players
    .filter((p) => p.playerId !== winner.playerId)
    .reduce((total, p) => total + calculateScore(p.hand), 0);

  const scores: Record<string, number> = {};
  for (const player of state.players) {
    scores[player.playerId] =
      player.playerId === winner.playerId ? opponentTotal : 0;
  }

  return scores;
}

// ──────────── Timeout ────────────

/**
 * Handle a turn timeout for the given player.
 * Auto-draws a card and passes the turn.
 *
 * Returns the new state with the timeout action applied.
 */
export function handleTimeout(state: GameState, playerId: string): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex];

  if (currentPlayer.playerId !== playerId) {
    return state; // Not this player's turn, ignore
  }

  // Auto-draw a card
  const result = drawFromDeck(state.deck, state.discardPile);
  const next = cloneState(state);

  if (result.drawnCards.length > 0) {
    const player = next.players[next.currentPlayerIndex];
    player.hand.push(result.drawnCards[0]);
    next.deck = result.newDeck;
    next.discardPile = result.newDiscardPile;
  }

  // Advance the turn
  next.pendingDrawCount = 0;
  next.currentPlayerIndex = getNextPlayerIndex(
    next.currentPlayerIndex,
    next.direction,
    next.players.length
  );
  next.turnStartTime = Date.now();

  return next;
}

// ──────────── UNO Call Detection ────────────

/**
 * A player calls "UNO" when they have 1 card remaining.
 * If a player plays their second-to-last card and doesn't call UNO,
 * another player can catch them (callUno on their behalf), resulting in a penalty.
 *
 * @param state Current game state
 * @param callerId The player ID making the UNO call
 * @param targetId Optional target player ID. If provided, this is a "catch" call
 *                 where the caller is accusing the target of not calling UNO.
 * @returns Updated game state
 */
export function callUno(
  state: GameState,
  callerId: string,
  targetId?: string
): { state: GameState; penaltyApplied: boolean } {
  const next = cloneState(state);

  if (targetId) {
    // Someone is catching another player for not calling UNO
    const target = next.players.find((p) => p.playerId === targetId);
    if (!target) {
      return { state, penaltyApplied: false };
    }

    // Check if target has 1 card and hasn't called UNO
    if (target.hand.length === 1 && !target.calledUno) {
      // Penalty: draw 2 cards using drawFromDeckPatch which handles reshuffling
      const { drawnCards, newDeck, newDiscardPile } = drawFromDeckPatch(
        next.deck,
        next.discardPile,
        2
      );

      if (drawnCards.length > 0) {
        target.hand.push(...drawnCards);
        next.deck = newDeck;
        next.discardPile = newDiscardPile;
      }

      target.calledUno = true; // Mark as having received penalty
      return { state: next, penaltyApplied: true };
    }

    return { state, penaltyApplied: false };
  }

  // Player is calling UNO for themselves
  const caller = next.players.find((p) => p.playerId === callerId);
  if (!caller) {
    return { state, penaltyApplied: false };
  }

  // Can only call UNO when you have 1 card
  if (caller.hand.length === 1) {
    caller.calledUno = true;
    return { state: next, penaltyApplied: false };
  }

  return { state, penaltyApplied: false };
}

/**
 * Helper to draw N cards from the deck, handling reshuffling.
 */
function drawFromDeckPatch(
  deck: Card[],
  discardPile: Card[],
  count: number
): { drawnCards: Card[]; newDeck: Card[]; newDiscardPile: Card[] } {
  let currentDeck = [...deck];
  let currentDiscard = [...discardPile];
  const drawn: Card[] = [];

  for (let i = 0; i < count; i++) {
    const result = drawFromDeck(currentDeck, currentDiscard);
    if (result.drawnCards.length === 0) break;
    drawn.push(...result.drawnCards);
    currentDeck = result.newDeck;
    currentDiscard = result.newDiscardPile;
  }

  return { drawnCards: drawn, newDeck: currentDeck, newDiscardPile: currentDiscard };
}

// ──────────── Exports ────────────

export { getNextPlayerIndex as getNextPlayer };
