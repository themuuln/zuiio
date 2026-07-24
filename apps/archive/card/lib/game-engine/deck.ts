/**
 * Deck creation, shuffling, and dealing functions for UNO.
 * All functions are pure — they create new arrays, never mutate inputs.
 */

import type { Card, CardColor, CardValue } from "./types";

const COLORS: CardColor[] = ["red", "blue", "green", "yellow"];

let cardIdCounter = 0;

/**
 * Generate a unique card ID for tracking duplicate cards.
 */
function nextCardId(): string {
  return `card-${++cardIdCounter}`;
}

/**
 * Reset the card ID counter (useful for testing).
 */
export function resetCardIdCounter(): void {
  cardIdCounter = 0;
}

/**
 * Create a card with a unique ID.
 */
function makeCard(color: CardColor | undefined, value: CardValue): Card {
  return { color, value, id: nextCardId() };
}

/**
 * Create a standard 108-card UNO deck.
 *
 * Distribution:
 *   - Number cards: one 0 per color (4), two each of 1-9 per color (72) = 76
 *   - Action cards: two each of Skip, Reverse, Draw 2 per color (24) = 24
 *   - Wild cards: 4
 *   - Wild Draw 4 cards: 4
 *   Total: 108
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const color of COLORS) {
    // One "0" per color
    deck.push(makeCard(color, "0"));

    // Two each of "1" through "9"
    for (let v = 1; v <= 9; v++) {
      const value = String(v) as CardValue;
      deck.push(makeCard(color, value));
      deck.push(makeCard(color, value));
    }

    // Two each of Skip, Reverse, Draw 2
    for (const action of ["skip", "reverse", "draw2"] as CardValue[]) {
      deck.push(makeCard(color, action));
      deck.push(makeCard(color, action));
    }
  }

  // Four Wild cards
  for (let i = 0; i < 4; i++) {
    deck.push(makeCard(undefined, "wild"));
  }

  // Four Wild Draw 4 cards
  for (let i = 0; i < 4; i++) {
    deck.push(makeCard(undefined, "wild4"));
  }

  return deck;
}

/**
 * Shuffle a deck using the Fisher-Yates algorithm.
 * Returns a new shuffled array without mutating the input.
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Deal cards from the deck to the specified number of players.
 * Each player receives 7 cards dealt one at a time (as in real UNO).
 *
 * Returns the hands and the remaining deck.
 */
export function dealCards(
  deck: Card[],
  numPlayers: number
): { hands: Card[][]; remainingDeck: Card[] } {
  const hands: Card[][] = Array.from({ length: numPlayers }, () => []);
  const remaining = [...deck];
  const cardsPerPlayer = 7;

  // Deal one card at a time to each player
  for (let round = 0; round < cardsPerPlayer; round++) {
    for (let p = 0; p < numPlayers; p++) {
      const card = remaining.shift();
      if (!card) break;
      hands[p].push(card);
    }
  }

  return { hands, remainingDeck: remaining };
}

/**
 * Draw a single card from the deck.
 * If the deck is empty, reshuffle the discard pile into the deck
 * (leaving the top card of the discard pile as the current top).
 *
 * Returns [[the drawn card(s)], new deck, new discard pile].
 */
export function drawFromDeck(
  deck: Card[],
  discardPile: Card[]
): { drawnCards: Card[]; newDeck: Card[]; newDiscardPile: Card[] } {
  if (deck.length > 0) {
    const drawn = [deck[0]];
    return { drawnCards: drawn, newDeck: deck.slice(1), newDiscardPile: discardPile };
  }

  // Deck is empty — reshuffle discard pile into deck, keeping top card
  if (discardPile.length <= 1) {
    // Only the top card remains — cannot reshuffle
    return { drawnCards: [], newDeck: [], newDiscardPile: discardPile };
  }

  const topCard = discardPile[discardPile.length - 1];
  const cardsToReshuffle = discardPile.slice(0, -1);
  const reshuffled = shuffleDeck(cardsToReshuffle);
  const drawn = [reshuffled[0]];

  return {
    drawnCards: drawn,
    newDeck: reshuffled.slice(1),
    newDiscardPile: [topCard],
  };
}
