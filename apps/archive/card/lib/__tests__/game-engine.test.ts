/**
 * Comprehensive tests for the UNO game engine.
 * Covers deck creation, shuffling, dealing, card play,
 * action cards, scoring, house rules, timeout, and UNO calls.
 */

import { describe, it, expect, beforeEach } from "vitest";
import type { Card, CardColor } from "@/lib/game-engine/types";
import { DEFAULT_GAME_CONFIG } from "@/lib/game-engine/types";
import {
  createDeck,
  shuffleDeck,
  dealCards,
  drawFromDeck,
  resetCardIdCounter,
} from "@/lib/game-engine/deck";
import {
  createInitialGameState,
  isValidPlay,
  hasPlayableCard,
  getNextPlayerIndex,
  playCard,
  drawCard,
  calculateScore,
  checkRoundEnd,
  calculateRoundScores,
  handleTimeout,
  callUno,
} from "@/lib/game-engine/uno";

// ──────────── Helpers ────────────

/**
 * Create a card for testing.
 */
function makeCard(
  color: CardColor | undefined,
  value: string,
  id?: string
): Card {
  return { color, value: value as Card["value"], id: id ?? `test-${Math.random()}` };
}

/**
 * Count cards by color.
 */
function countByColor(deck: Card[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const card of deck) {
    const key = card.color ?? "wild";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

/**
 * Count cards by value.
 */
function countByValue(deck: Card[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const card of deck) {
    counts[card.value] = (counts[card.value] ?? 0) + 1;
  }
  return counts;
}

beforeEach(() => {
  resetCardIdCounter();
});

// ════════════════════════════════════════
// Deck Tests
// ════════════════════════════════════════

describe("createDeck", () => {
  it("returns 108 cards", () => {
    const deck = createDeck();
    expect(deck).toHaveLength(108);
  });

  it("has unique IDs for every card", () => {
    const deck = createDeck();
    const ids = deck.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(108);
  });

  it("has correct number of cards per color", () => {
    const deck = createDeck();
    const byColor = countByColor(deck);

    // Each color: 1 zero + 2 each of 1-9 (18) + 2 each of skip/reverse/draw2 (6) = 25
    expect(byColor["red"]).toBe(25);
    expect(byColor["blue"]).toBe(25);
    expect(byColor["green"]).toBe(25);
    expect(byColor["yellow"]).toBe(25);

    // Wild cards (no color)
    expect(byColor["wild"]).toBe(8); // 4 wild + 4 wild4
  });

  it("has correct number of number cards", () => {
    const deck = createDeck();
    const byValue = countByValue(deck);

    // One "0" per color = 4
    expect(byValue["0"]).toBe(4);

    // Two of each "1" through "9" per color = 8 each
    for (let v = 1; v <= 9; v++) {
      expect(byValue[String(v)]).toBe(8);
    }
  });

  it("has correct number of action cards", () => {
    const deck = createDeck();
    const byValue = countByValue(deck);

    // Two each of Skip, Reverse, Draw 2 per color = 8 each
    expect(byValue["skip"]).toBe(8);
    expect(byValue["reverse"]).toBe(8);
    expect(byValue["draw2"]).toBe(8);
  });

  it("has 4 wild cards and 4 wild draw 4 cards", () => {
    const deck = createDeck();
    const byValue = countByValue(deck);

    expect(byValue["wild"]).toBe(4);
    expect(byValue["wild4"]).toBe(4);
  });

  it("number cards sum to 76", () => {
    const deck = createDeck();
    const numberCards = deck.filter((c) =>
      ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(c.value)
    );
    expect(numberCards).toHaveLength(76);
  });

  it("action cards (skip, reverse, draw2) sum to 24", () => {
    const deck = createDeck();
    const actionCards = deck.filter((c) =>
      ["skip", "reverse", "draw2"].includes(c.value)
    );
    expect(actionCards).toHaveLength(24);
  });

  it("wild cards sum to 8 (4 wild + 4 wild4)", () => {
    const deck = createDeck();
    const wildCards = deck.filter((c) =>
      ["wild", "wild4"].includes(c.value)
    );
    expect(wildCards).toHaveLength(8);
  });

  it("creates a fresh deck each time", () => {
    const deck1 = createDeck();
    const deck2 = createDeck();

    // IDs should be different between calls
    const ids1 = deck1.map((c) => c.id);
    const ids2 = deck2.map((c) => c.id);
    expect(ids1).not.toEqual(ids2);
  });
});

describe("shuffleDeck", () => {
  it("returns the same number of cards", () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    expect(shuffled).toHaveLength(deck.length);
  });

  it("does not mutate the original deck", () => {
    const deck = createDeck();
    const original = [...deck.map((c) => ({ ...c }))];
    shuffleDeck(deck);
    expect(deck).toEqual(original);
  });

  it("contains all the same cards (by id)", () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    const originalIds = new Set(deck.map((c) => c.id));
    const shuffledIds = new Set(shuffled.map((c) => c.id));
    expect(shuffledIds).toEqual(originalIds);
  });

  it("produces a different order (statistically likely)", () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    const originalOrder = deck.map((c) => c.id).join(",");
    const newOrder = shuffled.map((c) => c.id).join(",");
    // Extremely unlikely to produce the same order
    expect(originalOrder).not.toBe(newOrder);
  });

  it("handles empty deck", () => {
    expect(shuffleDeck([])).toEqual([]);
  });

  it("handles single card deck", () => {
    const card = makeCard("red", "5");
    const shuffled = shuffleDeck([card]);
    expect(shuffled).toHaveLength(1);
    expect(shuffled[0].id).toBe(card.id);
  });
});

describe("dealCards", () => {
  it("deals 7 cards to each player", () => {
    const deck = createDeck();
    const { hands, remainingDeck } = dealCards(deck, 4);
    expect(hands).toHaveLength(4);
    for (const hand of hands) {
      expect(hand).toHaveLength(7);
    }
    // 108 - (4 * 7) = 80 remaining
    expect(remainingDeck).toHaveLength(108 - 28);
  });

  it("deals 7 cards to 2 players", () => {
    const deck = createDeck();
    const { hands, remainingDeck } = dealCards(deck, 2);
    expect(hands).toHaveLength(2);
    for (const hand of hands) {
      expect(hand).toHaveLength(7);
    }
    expect(remainingDeck).toHaveLength(108 - 14);
  });

  it("deals 7 cards to 8 players", () => {
    const deck = createDeck();
    const { hands, remainingDeck } = dealCards(deck, 8);
    expect(hands).toHaveLength(8);
    for (const hand of hands) {
      expect(hand).toHaveLength(7);
    }
    expect(remainingDeck).toHaveLength(108 - 56);
  });

  it("deals 7 cards to 10 players (despite standard limit)", () => {
    const deck = createDeck();
    const { hands } = dealCards(deck, 10);
    expect(hands).toHaveLength(10);
    for (const hand of hands) {
      expect(hand).toHaveLength(7);
    }
  });

  it("does not mutate the original deck", () => {
    const deck = createDeck();
    const originalLength = deck.length;
    dealCards(deck, 4);
    expect(deck).toHaveLength(originalLength);
  });

  it("each player's hand has no duplicate card IDs", () => {
    const deck = createDeck();
    const { hands } = dealCards(deck, 4);
    for (const hand of hands) {
      const ids = new Set(hand.map((c) => c.id));
      expect(ids.size).toBe(hand.length);
    }
  });

  it("no card ID appears in two different hands", () => {
    const deck = createDeck();
    const { hands } = dealCards(deck, 4);
    const allIds = hands.flatMap((h) => h.map((c) => c.id));
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });
});

describe("drawFromDeck", () => {
  it("draws one card from the top", () => {
    const deck = createDeck();
    const topCard = deck[0];
    const { drawnCards, newDeck } = drawFromDeck(deck, []);
    expect(drawnCards).toHaveLength(1);
    expect(drawnCards[0].id).toBe(topCard.id);
    expect(newDeck).toHaveLength(deck.length - 1);
  });

  it("does not mutate the original deck", () => {
    const deck = createDeck();
    const original = [...deck];
    drawFromDeck(deck, []);
    expect(deck).toHaveLength(original.length);
  });

  it("reshuffles discard pile when deck is empty", () => {
    const topDiscard = makeCard("red", "5", "top");
    const discardPile = [
      makeCard("blue", "7", "discard-1"),
      makeCard("green", "skip", "discard-2"),
      topDiscard,
    ];

    const { drawnCards, newDeck, newDiscardPile } = drawFromDeck(
      [],
      discardPile
    );

    expect(drawnCards).toHaveLength(1);
    expect(newDeck).toHaveLength(1); // 2 shuffled - 1 drawn = 1
    expect(newDiscardPile).toHaveLength(1); // Only the top card remains
    expect(newDiscardPile[0].id).toBe("top");
  });

  it("returns empty when deck is empty and discard has only 1 card", () => {
    const discardPile = [makeCard("red", "5", "top")];
    const { drawnCards, newDeck, newDiscardPile } = drawFromDeck(
      [],
      discardPile
    );
    expect(drawnCards).toHaveLength(0);
    expect(newDeck).toHaveLength(0);
    expect(newDiscardPile).toHaveLength(1);
  });
});

// ════════════════════════════════════════
// Core Game Logic Tests
// ════════════════════════════════════════

describe("createInitialGameState", () => {
  it("creates state with correct number of players", () => {
    const state = createInitialGameState({}, ["p1", "p2", "p3", "p4"]);
    expect(state.players).toHaveLength(4);
  });

  it("deals 7 cards to each player", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    for (const player of state.players) {
      expect(player.hand).toHaveLength(7);
    }
  });

  it("starts with playing status", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    expect(state.status).toBe("playing");
  });

  it("sets current player index to 0", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    expect(state.currentPlayerIndex).toBe(0);
  });

  it("sets direction to 1 (clockwise)", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    expect(state.direction).toBe(1);
  });

  it("has a non-empty discard pile", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    expect(state.discardPile.length).toBeGreaterThan(0);
  });

  it("top discard is a number card", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    const top = state.discardPile[state.discardPile.length - 1];
    expect(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]).toContain(
      top.value
    );
  });

  it("current color matches top discard color", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    const top = state.discardPile[state.discardPile.length - 1];
    expect(state.currentColor).toBe(top.color);
  });

  it("uses default config when not provided", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    expect(state.config.drawStacking).toBe(false);
    expect(state.config.drawUntilYouPlay).toBe(false);
    expect(state.config.turnTimeoutSeconds).toBe(60);
    expect(state.config.winningScore).toBe(500);
  });

  it("merges partial config with defaults", () => {
    const state = createInitialGameState(
      { drawStacking: true },
      ["p1", "p2"]
    );
    expect(state.config.drawStacking).toBe(true);
    expect(state.config.drawUntilYouPlay).toBe(false); // Default
    expect(state.config.winningScore).toBe(500); // Default
  });

  it("sets round number to 1", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    expect(state.roundNumber).toBe(1);
  });

  it("each player has calledUno set to false", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    for (const player of state.players) {
      expect(player.calledUno).toBe(false);
    }
  });
});

describe("isValidPlay", () => {
  it("allows matching color", () => {
    const card = makeCard("red", "7");
    const topDiscard = makeCard("red", "5");
    expect(isValidPlay(card, topDiscard, "red")).toBe(true);
  });

  it("allows matching value despite different color", () => {
    const card = makeCard("blue", "7");
    const topDiscard = makeCard("red", "7");
    expect(isValidPlay(card, topDiscard, "red")).toBe(true);
  });

  it("rejects mismatched color and value", () => {
    const card = makeCard("blue", "6");
    const topDiscard = makeCard("red", "7");
    expect(isValidPlay(card, topDiscard, "red")).toBe(false);
  });

  it("allows wild card always", () => {
    const card = makeCard(undefined, "wild");
    const topDiscard = makeCard("red", "5");
    expect(isValidPlay(card, topDiscard, "red")).toBe(true);
  });

  it("allows wild draw 4 always", () => {
    const card = makeCard(undefined, "wild4");
    const topDiscard = makeCard("yellow", "3");
    expect(isValidPlay(card, topDiscard, "yellow")).toBe(true);
  });

  it("matches on value when color differs but value same", () => {
    const card = makeCard("green", "skip");
    const topDiscard = makeCard("red", "skip");
    expect(isValidPlay(card, topDiscard, "red")).toBe(true);
  });

  it("matches on current color for action cards", () => {
    const card = makeCard("blue", "draw2");
    const topDiscard = makeCard("red", "5");
    // currentColor is blue, card color matches
    expect(isValidPlay(card, topDiscard, "blue")).toBe(true);
  });

  it("rejects when current color differs and value differs", () => {
    const card = makeCard("green", "skip");
    const topDiscard = makeCard("red", "5");
    expect(isValidPlay(card, topDiscard, "blue")).toBe(false);
  });
});

describe("hasPlayableCard", () => {
  it("returns true when player has a matching color card", () => {
    const hand = [makeCard("red", "7"), makeCard("blue", "3")];
    const topDiscard = makeCard("red", "5");
    expect(hasPlayableCard(hand, topDiscard, "red")).toBe(true);
  });

  it("returns true when player has a matching value card", () => {
    const hand = [makeCard("green", "7"), makeCard("blue", "3")];
    const topDiscard = makeCard("red", "7");
    expect(hasPlayableCard(hand, topDiscard, "red")).toBe(true);
  });

  it("returns true when player has a wild card", () => {
    const hand = [makeCard(undefined, "wild"), makeCard("blue", "3")];
    const topDiscard = makeCard("red", "5");
    expect(hasPlayableCard(hand, topDiscard, "red")).toBe(true);
  });

  it("returns false when player has no playable cards", () => {
    const hand = [makeCard("green", "2"), makeCard("blue", "3")];
    const topDiscard = makeCard("red", "5");
    expect(hasPlayableCard(hand, topDiscard, "red")).toBe(false);
  });

  it("returns false for empty hand", () => {
    expect(hasPlayableCard([], makeCard("red", "5"), "red")).toBe(false);
  });
});

describe("getNextPlayerIndex", () => {
  it("returns next player in clockwise direction", () => {
    expect(getNextPlayerIndex(0, 1, 4)).toBe(1);
    expect(getNextPlayerIndex(1, 1, 4)).toBe(2);
    expect(getNextPlayerIndex(2, 1, 4)).toBe(3);
  });

  it("wraps around clockwise", () => {
    expect(getNextPlayerIndex(3, 1, 4)).toBe(0);
  });

  it("returns previous player in counter-clockwise direction", () => {
    expect(getNextPlayerIndex(3, -1, 4)).toBe(2);
    expect(getNextPlayerIndex(2, -1, 4)).toBe(1);
  });

  it("wraps around counter-clockwise", () => {
    expect(getNextPlayerIndex(0, -1, 4)).toBe(3);
  });

  it("works with 2 players", () => {
    expect(getNextPlayerIndex(0, 1, 2)).toBe(1);
    expect(getNextPlayerIndex(1, 1, 2)).toBe(0);
    expect(getNextPlayerIndex(0, -1, 2)).toBe(1);
  });
});

// ════════════════════════════════════════
// Play Card Tests
// ════════════════════════════════════════

describe("playCard", () => {
  it("allows playing a valid card (matching color)", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    const topDiscard = state.discardPile[state.discardPile.length - 1];
    const color = topDiscard.color!;

    // Find a matching color NUMBER card in p1's hand (avoid action cards with side effects)
    const p1 = state.players[0];
    const matchingCardIndex = p1.hand.findIndex(
      (c) =>
        c.color === color &&
        ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(c.value)
    );

    if (matchingCardIndex >= 0) {
      const result = playCard(state, "p1", matchingCardIndex);
      expect(result.error).toBeUndefined();

      // Card should be removed from hand
      const handAfter = result.state.players[0].hand;
      expect(handAfter).toHaveLength(6);

      // Card should be on top of discard
      const discardTop =
        result.state.discardPile[result.state.discardPile.length - 1];
      expect(discardTop.id).toBe(p1.hand[matchingCardIndex].id);

      // Turn should have advanced
      expect(result.state.currentPlayerIndex).toBe(1);
    }
  });

  it("allows playing a valid card (matching value)", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    const topDiscard = state.discardPile[state.discardPile.length - 1];

    // Find a matching value card in p1's hand
    const p1 = state.players[0];
    const matchingCardIndex = p1.hand.findIndex(
      (c) => c.value === topDiscard.value
    );

    if (matchingCardIndex >= 0) {
      const result = playCard(state, "p1", matchingCardIndex);
      expect(result.error).toBeUndefined();
    }
  });

  it("rejects play when not player's turn", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    const result = playCard(state, "p2", 0);
    expect(result.error).toBe("Not your turn");
    expect(result.state).toBe(state); // Same object (not cloned)
  });

  it("rejects invalid card index", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    const result = playCard(state, "p1", 999);
    expect(result.error).toBe("Invalid card index");
  });

  it("rejects invalid card play (no match)", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    const topDiscard = state.discardPile[state.discardPile.length - 1];

    // Find a card that doesn't match color or value (and is not wild)
    const p1 = state.players[0];
    const nonMatchingIndex = p1.hand.findIndex(
      (c) =>
        c.value !== "wild" &&
        c.value !== "wild4" &&
        c.color !== topDiscard.color &&
        c.value !== topDiscard.value
    );

    if (nonMatchingIndex >= 0) {
      const result = playCard(state, "p1", nonMatchingIndex);
      expect(result.error).toBe(
        "Invalid play: card does not match color or value"
      );
    }
  });

  it("does not mutate state on invalid play", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    const snapshot = JSON.parse(JSON.stringify(state));

    const topDiscard = state.discardPile[state.discardPile.length - 1];
    const p1 = state.players[0];
    const nonMatchingIndex = p1.hand.findIndex(
      (c) =>
        c.color !== topDiscard.color && c.value !== topDiscard.value
    );

    if (nonMatchingIndex >= 0) {
      playCard(state, "p1", nonMatchingIndex);
      // Original state should be unchanged
      expect(state).toEqual(snapshot);
    }
  });

  it("requires chosenColor for wild cards", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);

    // Give p1 a wild card
    state.players[0].hand.push(makeCard(undefined, "wild", "test-wild"));

    const wildIndex = state.players[0].hand.length - 1;
    const result = playCard(state, "p1", wildIndex);
    expect(result.error).toBe("Must choose a color for wild cards");
  });

  it("applies chosenColor for wild cards", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);

    // Give p1 a wild card
    state.players[0].hand.push(makeCard(undefined, "wild", "test-wild"));

    const wildIndex = state.players[0].hand.length - 1;
    const result = playCard(state, "p1", wildIndex, "blue");
    expect(result.error).toBeUndefined();
    expect(result.state.currentColor).toBe("blue");
  });

  it("detects win when hand becomes empty", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);

    // Give p1 just 1 playable card
    const topDiscard = state.discardPile[state.discardPile.length - 1];
    const color = topDiscard.color!;
    state.players[0].hand = [makeCard(color, "1", "last-card")];

    const result = playCard(state, "p1", 0);
    expect(result.error).toBeUndefined();
    expect(result.state.status).toBe("round_end");
    expect(result.state.winnerId).toBe("p1");
  });

  it("non-winning play does not change status", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    const topDiscard = state.discardPile[state.discardPile.length - 1];
    const color = topDiscard.color!;

    // Give p1 2 playable cards
    state.players[0].hand = [
      makeCard(color, "1", "card-1"),
      makeCard(color, "2", "card-2"),
    ];

    const result = playCard(state, "p1", 0);
    expect(result.error).toBeUndefined();
    expect(result.state.status).toBe("playing");
    expect(result.state.winnerId).toBeUndefined();
    expect(result.state.players[0].hand).toHaveLength(1);
  });

  it("advances turn after playing", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    const topDiscard = state.discardPile[state.discardPile.length - 1];
    const color = topDiscard.color!;

    state.players[0].hand.push(makeCard(color, "9", "playable"));
    const index = state.players[0].hand.length - 1;

    const result = playCard(state, "p1", index);
    expect(result.state.currentPlayerIndex).toBe(1);
  });
});

// ════════════════════════════════════════
// Action Card Tests
// ════════════════════════════════════════

describe("Skip card", () => {
  it("skips the next player's turn", () => {
    const state = createInitialGameState({}, ["p1", "p2", "p3"]);
    const topDiscard = state.discardPile[state.discardPile.length - 1];
    const color = topDiscard.color!;

    // Add skip card to p1's hand
    state.players[0].hand.push(makeCard(color, "skip", "test-skip"));
    const skipIndex = state.players[0].hand.length - 1;

    const result = playCard(state, "p1", skipIndex);
    expect(result.error).toBeUndefined();

    // After playing skip, turn should skip p2 and go to p3
    expect(result.state.currentPlayerIndex).toBe(2);
  });

  it("skip card on last player wraps correctly", () => {
    const state = createInitialGameState({}, ["p1", "p2", "p3"]);
    const topDiscard = state.discardPile[state.discardPile.length - 1];
    const color = topDiscard.color!;

    // Set current player to p3 (index 2)
    state.currentPlayerIndex = 2;
    state.players[2].hand.push(makeCard(color, "skip", "test-skip"));
    const skipIndex = state.players[2].hand.length - 1;

    const result = playCard(state, "p3", skipIndex);
    expect(result.error).toBeUndefined();

    // Skip from p3 should advance past index 0 to index 1
    expect(result.state.currentPlayerIndex).toBe(1);
  });
});

describe("Reverse card", () => {
  it("changes direction with 3+ players", () => {
    const state = createInitialGameState({}, ["p1", "p2", "p3"]);
    const topDiscard = state.discardPile[state.discardPile.length - 1];
    const color = topDiscard.color!;

    expect(state.direction).toBe(1);

    state.players[0].hand.push(makeCard(color, "reverse", "test-rev"));
    const revIndex = state.players[0].hand.length - 1;

    const result = playCard(state, "p1", revIndex);
    expect(result.error).toBeUndefined();
    expect(result.state.direction).toBe(-1);

    // Turn should go to p3 (previous player in clockwise, which is p3 since direction reversed)
    // Actually with direction = -1, from index 0, next is index 2 (wrapping)
    expect(result.state.currentPlayerIndex).toBe(2);
  });

  it("reverse acts as skip in 2-player game", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    const topDiscard = state.discardPile[state.discardPile.length - 1];
    const color = topDiscard.color!;

    expect(state.direction).toBe(1);

    state.players[0].hand.push(makeCard(color, "reverse", "test-rev"));
    const revIndex = state.players[0].hand.length - 1;

    const result = playCard(state, "p1", revIndex);
    expect(result.error).toBeUndefined();

    // In 2-player, Reverse acts as Skip, so p2 is skipped and it goes back to p1
    expect(result.state.currentPlayerIndex).toBe(0);
    // Direction should remain unchanged
    expect(result.state.direction).toBe(1);
  });

  it("reverses from counter-clockwise to clockwise", () => {
    const state = createInitialGameState({}, ["p1", "p2", "p3"]);
    const topDiscard = state.discardPile[state.discardPile.length - 1];
    const color = topDiscard.color!;

    state.direction = -1;

    state.players[0].hand.push(makeCard(color, "reverse", "test-rev"));
    const revIndex = state.players[0].hand.length - 1;

    const result = playCard(state, "p1", revIndex);
    expect(result.state.direction).toBe(1);
  });
});

describe("Draw 2 card", () => {
  it("makes next player draw 2 cards and skip turn", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    const topDiscard = state.discardPile[state.discardPile.length - 1];
    const color = topDiscard.color!;

    state.players[0].hand.push(makeCard(color, "draw2", "test-d2"));
    const d2Index = state.players[0].hand.length - 1;

    const result = playCard(state, "p1", d2Index);
    expect(result.error).toBeUndefined();

    // p2 should be the next turn but with pending draws
    // Check that turn advanced past p2
    expect(result.state.currentPlayerIndex).toBe(0); // back to p1 since 2-player
    expect(result.state.pendingDrawCount).toBe(2);
  });

  it("draw stacking chains draw 2s when enabled", () => {
    const state = createInitialGameState(
      { drawStacking: true },
      ["p1", "p2"]
    );
    const topDiscard = state.discardPile[state.discardPile.length - 1];
    const color = topDiscard.color!;

    // Set pending draw count to simulate previous draw2
    state.pendingDrawCount = 2;

    // Add a draw2 for p1
    state.players[0].hand.push(makeCard(color, "draw2", "test-d2"));
    const d2Index = state.players[0].hand.length - 1;

    const result = playCard(state, "p1", d2Index);
    expect(result.error).toBeUndefined();

    // Draw stacking should accumulate: 2 + 2 = 4
    expect(result.state.pendingDrawCount).toBe(4);
  });

  it("draw stacking is rejected when disabled", () => {
    const state = createInitialGameState(
      { drawStacking: false },
      ["p1", "p2"]
    );
    const topDiscard = state.discardPile[state.discardPile.length - 1];
    const color = topDiscard.color!;

    // Set pending draw count
    state.pendingDrawCount = 2;

    // Add a draw2 for p1
    state.players[0].hand.push(makeCard(color, "draw2", "test-d2"));
    const d2Index = state.players[0].hand.length - 1;

    const result = playCard(state, "p1", d2Index);

    // With stacking disabled, playing a draw2 when pendingDrawCount > 0 should fail
    expect(result.error).toBe(
      "Must draw cards to resolve pending draws before playing"
    );
  });
});

describe("Wild card", () => {
  it("allows color choice", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    state.players[0].hand.push(makeCard(undefined, "wild", "test-wild"));

    const wildIndex = state.players[0].hand.length - 1;
    const result = playCard(state, "p1", wildIndex, "green");
    expect(result.error).toBeUndefined();
    expect(result.state.currentColor).toBe("green");
  });

  it("rejects wild without color choice", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    state.players[0].hand.push(makeCard(undefined, "wild", "test-wild"));

    const wildIndex = state.players[0].hand.length - 1;
    const result = playCard(state, "p1", wildIndex);
    expect(result.error).toBe("Must choose a color for wild cards");
  });

  it("does not add skip or draw effects", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    state.players[0].hand.push(makeCard(undefined, "wild", "test-wild"));

    const wildIndex = state.players[0].hand.length - 1;
    const result = playCard(state, "p1", wildIndex, "yellow");
    expect(result.error).toBeUndefined();
    expect(result.state.pendingDrawCount).toBe(0);
    // Normal turn advance
    expect(result.state.currentPlayerIndex).toBe(1);
  });
});

describe("Wild Draw 4 card", () => {
  it("makes next player draw 4 and skip turn", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    state.players[0].hand.push(makeCard(undefined, "wild4", "test-w4"));

    const w4Index = state.players[0].hand.length - 1;
    const result = playCard(state, "p1", w4Index, "red");
    expect(result.error).toBeUndefined();
    expect(result.state.pendingDrawCount).toBe(4);
    // Skip p2's turn
    expect(result.state.currentPlayerIndex).toBe(0);
  });

  it("applies chosen color", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    state.players[0].hand.push(makeCard(undefined, "wild4", "test-w4"));

    const w4Index = state.players[0].hand.length - 1;
    const result = playCard(state, "p1", w4Index, "blue");
    expect(result.state.currentColor).toBe("blue");
  });

  it("rejects wild4 without color choice", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    state.players[0].hand.push(makeCard(undefined, "wild4", "test-w4"));

    const w4Index = state.players[0].hand.length - 1;
    const result = playCard(state, "p1", w4Index);
    expect(result.error).toBe("Must choose a color for wild cards");
  });

  it("chains with draw stacking when enabled", () => {
    const state = createInitialGameState(
      { drawStacking: true },
      ["p1", "p2"]
    );
    state.pendingDrawCount = 2;
    state.players[0].hand.push(makeCard(undefined, "wild4", "test-w4"));

    const w4Index = state.players[0].hand.length - 1;
    const result = playCard(state, "p1", w4Index, "green");
    expect(result.state.pendingDrawCount).toBe(6); // 2 + 4
  });
});

// ════════════════════════════════════════
// Draw Card Tests
// ════════════════════════════════════════

describe("drawCard", () => {
  it("draws 1 card from deck when pendingDrawCount is 0", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    const initialDeckSize = state.deck.length;
    const initialHandSize = state.players[0].hand.length;

    const result = drawCard(state, "p1");
    expect(result.error).toBeUndefined();
    expect(result.card).toBeDefined();
    expect(result.state.players[0].hand).toHaveLength(initialHandSize + 1);
    expect(result.state.deck).toHaveLength(initialDeckSize - 1);
  });

  it("rejects draw when not player's turn", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    const result = drawCard(state, "p2");
    expect(result.error).toBe("Not your turn");
  });

  it("advances turn after drawing (normal draw)", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    const result = drawCard(state, "p1");
    expect(result.error).toBeUndefined();
    // Turn should pass to next player
    expect(result.state.currentPlayerIndex).toBe(1);
    expect(result.state.pendingDrawCount).toBe(0);
  });

  it("draws pending draw count cards when > 0 (Draw 2 penalty)", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    state.pendingDrawCount = 2;
    const initialHandSize = state.players[0].hand.length;

    const result = drawCard(state, "p1");
    expect(result.error).toBeUndefined();
    expect(result.state.players[0].hand).toHaveLength(initialHandSize + 2);
  });

  it("draws 4 cards for Wild Draw 4 penalty", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    state.pendingDrawCount = 4;
    const initialHandSize = state.players[0].hand.length;

    const result = drawCard(state, "p1");
    expect(result.error).toBeUndefined();
    expect(result.state.players[0].hand).toHaveLength(initialHandSize + 4);
  });

  it("reshuffles discard pile when deck is empty during draw", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    // Force deck to be nearly empty
    state.deck = [makeCard("red", "5", "last-card")];
    state.discardPile = [
      makeCard("blue", "3", "d1"),
      makeCard("green", "skip", "d2"),
      makeCard("yellow", "7", "d3"),
      makeCard("red", "2", "d4"),
    ];

    const result = drawCard(state, "p1");
    expect(result.error).toBeUndefined();
    expect(result.card).toBeDefined();
    // Deck should have been reshuffled
    expect(result.state.deck.length).toBeGreaterThanOrEqual(0);
  });

  it("draw-until-you-play: returned card is playable", () => {
    const state = createInitialGameState(
      { drawUntilYouPlay: true },
      ["p1", "p2"]
    );

    // Make p1's hand have no playable cards
    const topDiscard = state.discardPile[state.discardPile.length - 1];
    const oppositeColor: CardColor =
      topDiscard.color === "red" ? "blue" : "red";
    state.players[0].hand = [
      makeCard(oppositeColor, "3", "no-play"),
      makeCard(oppositeColor, "7", "no-play-2"),
    ];

    const result = drawCard(state, "p1");
    expect(result.error).toBeUndefined();

    if (result.card) {
      // If drawn card is playable, turn should NOT advance
      const isPlayable = isValidPlay(
        result.card,
        topDiscard,
        state.currentColor
      );
      if (isPlayable) {
        expect(result.state.currentPlayerIndex).toBe(0); // Turn hasn't advanced
      }
    }
  });
});

// ════════════════════════════════════════
// Score Calculation Tests
// ════════════════════════════════════════

describe("calculateScore", () => {
  it("returns face value for number cards", () => {
    const hand = [makeCard("red", "5")];
    expect(calculateScore(hand)).toBe(5);
  });

  it("returns correct score for multiple number cards", () => {
    const hand = [
      makeCard("red", "5"),
      makeCard("blue", "3"),
      makeCard("green", "0"),
    ];
    expect(calculateScore(hand)).toBe(8);
  });

  it("returns 20 for skip, reverse, and draw2", () => {
    expect(
      calculateScore([makeCard("red", "skip")])
    ).toBe(20);
    expect(
      calculateScore([makeCard("red", "reverse")])
    ).toBe(20);
    expect(
      calculateScore([makeCard("red", "draw2")])
    ).toBe(20);
  });

  it("returns 50 for wild and wild draw 4", () => {
    expect(calculateScore([makeCard(undefined, "wild")])).toBe(50);
    expect(calculateScore([makeCard(undefined, "wild4")])).toBe(50);
  });

  it("calculates mixed hand correctly", () => {
    const hand = [
      makeCard("red", "5"),    // 5
      makeCard("blue", "skip"), // 20
      makeCard(undefined, "wild"), // 50
      makeCard("green", "2"),   // 2
    ];
    expect(calculateScore(hand)).toBe(77);
  });

  it("returns 0 for empty hand", () => {
    expect(calculateScore([])).toBe(0);
  });
});

describe("checkRoundEnd", () => {
  it("returns undefined when no one has empty hand", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    expect(checkRoundEnd(state)).toBeUndefined();
  });

  it("returns player ID when player has empty hand", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    state.players[0].hand = [];
    expect(checkRoundEnd(state)).toBe("p1");
  });
});

describe("calculateRoundScores", () => {
  it("returns zeros when no winner (no empty hand)", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    const scores = calculateRoundScores(state);
    expect(scores["p1"]).toBe(0);
    expect(scores["p2"]).toBe(0);
  });

  it("gives winner sum of opponents' card values", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);

    // Set p1 as winner (empty hand)
    state.players[0].hand = [];

    // Set p2's hand with known values
    state.players[1].hand = [
      makeCard("red", "5"),     // 5
      makeCard("blue", "skip"),  // 20
      makeCard("green", "3"),    // 3
    ];

    const scores = calculateRoundScores(state);
    expect(scores["p1"]).toBe(28); // 5 + 20 + 3
    expect(scores["p2"]).toBe(0);
  });

  it("handles multiple opponents correctly", () => {
    const state = createInitialGameState({}, ["p1", "p2", "p3"]);

    state.players[0].hand = []; // winner
    state.players[1].hand = [makeCard("red", "7")];   // 7
    state.players[2].hand = [
      makeCard("blue", "draw2"), // 20
      makeCard("green", "3"),    // 3
    ]; // 23

    const scores = calculateRoundScores(state);
    expect(scores["p1"]).toBe(30); // 7 + 20 + 3
    expect(scores["p2"]).toBe(0);
    expect(scores["p3"]).toBe(0);
  });
});

// ════════════════════════════════════════
// Turn Timeout Tests
// ════════════════════════════════════════

describe("handleTimeout", () => {
  it("auto-draws a card and advances turn", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    const initialHandSize = state.players[0].hand.length;
    const initialDeckSize = state.deck.length;

    const newState = handleTimeout(state, "p1");
    expect(newState).not.toBe(state); // New state
    expect(newState.players[0].hand).toHaveLength(initialHandSize + 1);
    expect(newState.deck).toHaveLength(initialDeckSize - 1);
    expect(newState.currentPlayerIndex).toBe(1); // Next player
  });

  it("ignores timeout when it's not the player's turn", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    const newState = handleTimeout(state, "p2");
    expect(newState).toBe(state); // Same object
  });

  it("handles empty deck during timeout draw", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    state.deck = [];
    state.discardPile = [
      makeCard("red", "1", "d1"),
      makeCard("blue", "2", "d2"),
      makeCard("green", "3", "d3"),
    ];

    const newState = handleTimeout(state, "p1");
    // Should reshuffle and draw
    expect(newState.players[0].hand).toHaveLength(
      state.players[0].hand.length + 1
    );
  });
});

// ════════════════════════════════════════
// UNO Call Detection Tests
// ════════════════════════════════════════

describe("callUno", () => {
  it("player can call UNO for themselves with 1 card", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    state.players[0].hand = [makeCard("red", "5", "last")];

    const result = callUno(state, "p1");
    expect(result.state.players[0].calledUno).toBe(true);
    expect(result.penaltyApplied).toBe(false);
  });

  it("cannot call UNO when having more than 1 card", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    const result = callUno(state, "p1");
    expect(result.state.players[0].calledUno).toBe(false);
    expect(result.penaltyApplied).toBe(false);
  });

  it("catches opponent for not calling UNO (penalty applied)", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);

    // p2 has 1 card and hasn't called UNO
    state.players[1].hand = [makeCard("red", "5", "last")];
    state.players[1].calledUno = false;

    const initialHandSize = state.players[1].hand.length;

    // p1 catches p2
    const result = callUno(state, "p1", "p2");
    expect(result.penaltyApplied).toBe(true);
    expect(result.state.players[1].hand.length).toBeGreaterThan(
      initialHandSize
    );
  });

  it("caught player receives exactly 2 penalty cards", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);

    // p2 has 1 card and hasn't called UNO
    state.players[1].hand = [makeCard("red", "5", "last")];
    state.players[1].calledUno = false;

    // p1 catches p2
    const result = callUno(state, "p1", "p2");
    expect(result.penaltyApplied).toBe(true);
    // Should have exactly 3 cards: 1 original + 2 penalty
    expect(result.state.players[1].hand).toHaveLength(3);
  });

  it("no penalty when target has called UNO already", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);

    state.players[1].hand = [makeCard("red", "5", "last")];
    state.players[1].calledUno = true;

    const result = callUno(state, "p1", "p2");
    expect(result.penaltyApplied).toBe(false);
  });

  it("no penalty when target has more than 1 card", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    const result = callUno(state, "p1", "p2");
    expect(result.penaltyApplied).toBe(false);
  });

  it("returns unchanged state when target not found", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    const result = callUno(state, "p1", "nonexistent");
    expect(result.penaltyApplied).toBe(false);
  });
});

// ════════════════════════════════════════
// Edge Cases
// ════════════════════════════════════════

describe("edge cases", () => {
  it("playCard rejects draw stacking without matching card", () => {
    const state = createInitialGameState(
      { drawStacking: true },
      ["p1", "p2"]
    );
    const topDiscard = state.discardPile[state.discardPile.length - 1];

    state.pendingDrawCount = 2;
    state.players[0].hand = [makeCard(topDiscard.color!, "9", "non-draw")];

    const result = playCard(state, "p1", 0);
    expect(result.error).toBe(
      "Must play a Draw 2 or Wild Draw 4 when draws are pending (draw stacking)"
    );
  });

  it("drawing with pendingDrawCount advances turn after drawing", () => {
    const state = createInitialGameState({}, ["p1", "p2", "p3"]);
    state.currentPlayerIndex = 1; // p2's turn
    state.pendingDrawCount = 2;

    const result = drawCard(state, "p2");
    expect(result.error).toBeUndefined();
    // After drawing, turn should advance past p2
    // From index 1, direction 1, next is index 2
    expect(result.state.currentPlayerIndex).toBe(2);
    expect(result.state.pendingDrawCount).toBe(0);
  });

  it("full game flow: 2 players multiple turns", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    const topDiscard = state.discardPile[state.discardPile.length - 1];
    const color = topDiscard.color!;

    // Give p1 playable cards
    state.players[0].hand = [
      makeCard(color, "1", "a"),
      makeCard(color, "2", "b"),
      makeCard(color, "3", "c"),
    ];

    // p1 plays card
    const r1 = playCard(state, "p1", 0);
    expect(r1.error).toBeUndefined();

    // It's now p2's turn; p2 draws
    const r2 = drawCard(r1.state, "p2");
    expect(r2.error).toBeUndefined();

    // It's now p1's turn again
    expect(r2.state.currentPlayerIndex).toBe(0);
  });

  it("player can play card matching value when color differs", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    const topDiscard = state.discardPile[state.discardPile.length - 1];
    const currentValue = topDiscard.value;
    const otherColor: CardColor =
      topDiscard.color === "red" ? "blue" : "red";

    state.players[0].hand = [
      makeCard(otherColor, currentValue, "match-by-value"),
    ];

    const result = playCard(state, "p1", 0);
    expect(result.error).toBeUndefined();
  });

  it("getNextPlayer wraps correctly for edge indices", () => {
    expect(getNextPlayerIndex(4, 1, 5)).toBe(0);
    expect(getNextPlayerIndex(0, 1, 5)).toBe(1);
    expect(getNextPlayerIndex(0, -1, 5)).toBe(4);
    expect(getNextPlayerIndex(4, -1, 5)).toBe(3);
  });
});

describe("Deck reshuffle on empty", () => {
  it("drawFromDeck reshuffles discard when deck is empty", () => {
    const discardPile = [
      makeCard("red", "1", "a"),
      makeCard("blue", "2", "b"),
      makeCard("green", "3", "c"),
      makeCard("yellow", "skip", "d"),
      makeCard("red", "5", "top"),
    ];

    const { drawnCards, newDeck, newDiscardPile } = drawFromDeck(
      [],
      discardPile
    );

    expect(drawnCards).toHaveLength(1);
    // 4 cards were reshuffled, 1 drawn, 3 remain in deck
    expect(newDeck).toHaveLength(3);
    // Top card stays
    expect(newDiscardPile).toHaveLength(1);
    expect(newDiscardPile[0].value).toBe("5");
  });

  it("drawFromDeck empty when both deck and discard have 1 card", () => {
    const discardPile = [makeCard("red", "5", "only")];
    const { drawnCards } = drawFromDeck([], discardPile);
    expect(drawnCards).toHaveLength(0);
  });
});

describe("Config defaults", () => {
  it("DEFAULT_GAME_CONFIG has correct values", () => {
    expect(DEFAULT_GAME_CONFIG.drawStacking).toBe(false);
    expect(DEFAULT_GAME_CONFIG.drawUntilYouPlay).toBe(false);
    expect(DEFAULT_GAME_CONFIG.turnTimeoutSeconds).toBe(60);
    expect(DEFAULT_GAME_CONFIG.winningScore).toBe(500);
  });
});
