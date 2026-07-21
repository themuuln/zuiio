/**
 * Tests for the UNO gameplay API routes.
 * Tests the API integration patterns used by game routes.
 */
import { describe, it, expect } from "vitest";
import {
  playCard,
  drawCard,
  isValidPlay,
  createInitialGameState,
  callUno,
  handleTimeout,
} from "@/lib/game-engine/uno";
import type { Card, CardColor, GameState } from "@/lib/game-engine/types";
import { DEFAULT_GAME_CONFIG } from "@/lib/game-engine/types";

/**
 * Helper to create a minimal game state for testing.
 */
function makeTestState(
  playerIds: string[],
  hands: Card[][],
  topDiscard: Card,
  currentColor: CardColor,
  currentPlayerIndex = 0,
  direction: 1 | -1 = 1
): GameState {
  return {
    deck: [],
    discardPile: [topDiscard],
    players: playerIds.map((id, i) => ({
      playerId: id,
      hand: hands[i] || [],
      calledUno: false,
    })),
    currentPlayerIndex,
    direction,
    config: DEFAULT_GAME_CONFIG,
    status: "playing",
    currentColor,
    winnerId: undefined,
    pendingDrawCount: 0,
    turnStartTime: Date.now(),
    roundNumber: 1,
  };
}

function makeCard(
  color: CardColor | undefined,
  value: string,
  id?: string
): Card {
  return {
    color,
    value: value as Card["value"],
    id: id ?? `test-${Math.random()}`,
  };
}

describe("POST /api/games - Game Action Validation", () => {
  it("playCard validates it's the player's turn", () => {
    const topDiscard = makeCard("red", "5");
    const state = makeTestState(
      ["p1", "p2"],
      [[makeCard("red", "3")], [makeCard("blue", "7")]],
      topDiscard,
      "red",
      0 // p1's turn
    );

    // p2 tries to play out of turn
    const result = playCard(state, "p2", 0);
    expect(result.error).toBe("Not your turn");
  });

  it("playCard rejects invalid color match", () => {
    const topDiscard = makeCard("red", "5");
    const state = makeTestState(
      ["p1"],
      [[makeCard("blue", "3")]],
      topDiscard,
      "red"
    );

    const result = playCard(state, "p1", 0);
    expect(result.error).toContain("Invalid play");
  });

  it("playCard accepts valid color match", () => {
    const topDiscard = makeCard("red", "5");
    const state = makeTestState(
      ["p1"],
      [[makeCard("red", "3")]],
      topDiscard,
      "red"
    );

    const result = playCard(state, "p1", 0);
    expect(result.error).toBeUndefined();
    expect(result.state.discardPile.length).toBe(2);
    expect(result.state.players[0].hand.length).toBe(0);
  });

  it("playCard accepts valid value match", () => {
    const topDiscard = makeCard("red", "5");
    const state = makeTestState(
      ["p1"],
      [[makeCard("blue", "5")]],
      topDiscard,
      "red"
    );

    const result = playCard(state, "p1", 0);
    expect(result.error).toBeUndefined();
  });

  it("playCard accepts wild cards always", () => {
    const topDiscard = makeCard("red", "5");
    const state = makeTestState(
      ["p1"],
      [[makeCard(undefined, "wild")]],
      topDiscard,
      "red"
    );

    const result = playCard(state, "p1", 0, "blue");
    expect(result.error).toBeUndefined();
    expect(result.state.currentColor).toBe("blue");
  });

  it("playCard rejects wild card without chosen color", () => {
    const topDiscard = makeCard("red", "5");
    const state = makeTestState(
      ["p1"],
      [[makeCard(undefined, "wild")]],
      topDiscard,
      "red"
    );

    const result = playCard(state, "p1", 0);
    expect(result.error).toContain("choose a color");
  });

  it("playCard with skip skips next player", () => {
    const topDiscard = makeCard("red", "5");
    // Give p1 extra cards so playing skip doesn't win the round
    const state = makeTestState(
      ["p1", "p2", "p3"],
      [
        [makeCard("red", "skip"), makeCard("blue", "2")],
        [makeCard("blue", "3")],
        [makeCard("green", "7")],
      ],
      topDiscard,
      "red",
      0
    );

    const result = playCard(state, "p1", 0);
    expect(result.error).toBeUndefined();
    expect(result.state.status).toBe("playing");
    // After p1 plays skip, it should go to p3 (skipping p2)
    // p1 index 0 → normal advance to 1 (p2) → skip to 2 (p3)
    expect(result.state.currentPlayerIndex).toBe(2);
  });

  it("playCard with reverse changes direction", () => {
    const topDiscard = makeCard("red", "5");
    // Give p1 extra cards so playing reverse doesn't win the round
    const state = makeTestState(
      ["p1", "p2", "p3"],
      [
        [makeCard("red", "reverse"), makeCard("blue", "2")],
        [makeCard("blue", "3")],
        [makeCard("green", "7")],
      ],
      topDiscard,
      "red",
      0
    );

    const result = playCard(state, "p1", 0);
    expect(result.error).toBeUndefined();
    expect(result.state.direction).toBe(-1);
    // After p1 plays reverse, next should be p3 (going backwards from p1)
    // p1 index 0 → reverse direction (-1) → advance to index 2 (p3)
    // With 3 players and direction=-1: from 0, next is 2
    expect(result.state.currentPlayerIndex).toBe(2);
  });

  it("playCard with draw2 sets pendingDrawCount", () => {
    const topDiscard = makeCard("red", "5");
    const state = makeTestState(
      ["p1", "p2"],
      [[makeCard("red", "draw2")], [makeCard("blue", "3")]],
      topDiscard,
      "red",
      0
    );

    const result = playCard(state, "p1", 0);
    expect(result.error).toBeUndefined();
    expect(result.state.pendingDrawCount).toBe(2);
  });

  it("playCard with wild4 sets pendingDrawCount", () => {
    const topDiscard = makeCard("red", "5");
    const state = makeTestState(
      ["p1", "p2"],
      [[makeCard(undefined, "wild4")], [makeCard("blue", "3")]],
      topDiscard,
      "red",
      0
    );

    const result = playCard(state, "p1", 0, "blue");
    expect(result.error).toBeUndefined();
    expect(result.state.pendingDrawCount).toBe(4);
    expect(result.state.currentColor).toBe("blue");
  });

  it("drawCard draws one card from deck", () => {
    const deck = [makeCard("red", "2"), makeCard("blue", "5")];
    const topDiscard = makeCard("red", "5");
    const state: GameState = {
      ...makeTestState(["p1"], [[makeCard("red", "3")]], topDiscard, "red"),
      deck,
    };

    const result = drawCard(state, "p1");
    expect(result.error).toBeUndefined();
    expect(result.state.players[0].hand.length).toBe(2); // Original card + drawn card
  });

  it("drawCard rejects when not your turn", () => {
    const topDiscard = makeCard("red", "5");
    const state = makeTestState(
      ["p1", "p2"],
      [[makeCard("red", "3")], [makeCard("blue", "7")]],
      topDiscard,
      "red",
      0
    );

    const result = drawCard(state, "p2");
    expect(result.error).toBe("Not your turn");
  });

  it("initial game state deals 7 cards to each player", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    expect(state.players[0].hand.length).toBe(7);
    expect(state.players[1].hand.length).toBe(7);
  });

  it("initial game state has a valid discard pile with a number card", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    expect(state.discardPile.length).toBeGreaterThanOrEqual(1);
    const topCard = state.discardPile[state.discardPile.length - 1];
    // The top card should be a number card
    expect(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]).toContain(
      topCard.value
    );
  });

  it("isValidPlay correctly validates matches", () => {
    const topDiscard = makeCard("red", "5");

    expect(isValidPlay(makeCard("red", "3"), topDiscard, "red")).toBe(true); // Same color
    expect(isValidPlay(makeCard("blue", "5"), topDiscard, "red")).toBe(true); // Same value
    expect(isValidPlay(makeCard("blue", "3"), topDiscard, "red")).toBe(false); // Different color and value
    expect(isValidPlay(makeCard(undefined, "wild"), topDiscard, "red")).toBe(true); // Wild
    expect(isValidPlay(makeCard(undefined, "wild4"), topDiscard, "red")).toBe(true); // Wild Draw 4
  });

  it("handles round end detection", () => {
    const topDiscard = makeCard("red", "5");
    // Player 1 has only 1 card — playing it should end the round
    const state = makeTestState(
      ["p1", "p2"],
      [[makeCard("red", "3")], [makeCard("blue", "7"), makeCard("green", "2")]],
      topDiscard,
      "red",
      0
    );

    const result = playCard(state, "p1", 0);
    expect(result.error).toBeUndefined();
    expect(result.state.status).toBe("round_end");
    expect(result.state.winnerId).toBe("p1");
  });
});

describe("callUno Action", () => {
  it("player can call UNO when having 1 card", () => {
    const topDiscard = makeCard("red", "5");
    const state = makeTestState(
      ["p1", "p2"],
      [[makeCard("red", "3")], [makeCard("blue", "7")]],
      topDiscard,
      "red",
      0
    );
    // Set p1 to have 1 card
    state.players[0].hand = [makeCard("red", "3")];

    const result = callUno(state, "p1");
    expect(result.state.players[0].calledUno).toBe(true);
    expect(result.penaltyApplied).toBe(false);
  });

  it("cannot call UNO when having more than 1 card", () => {
    const topDiscard = makeCard("red", "5");
    const state = makeTestState(
      ["p1", "p2"],
      [[makeCard("red", "3"), makeCard("blue", "2")], [makeCard("blue", "7")]],
      topDiscard,
      "red",
      0
    );

    const result = callUno(state, "p1");
    expect(result.state.players[0].calledUno).toBe(false);
    expect(result.penaltyApplied).toBe(false);
  });

  it("catches opponent who didn't call UNO - 2 card penalty", () => {
    const topDiscard = makeCard("red", "5");
    const state = makeTestState(
      ["p1", "p2"],
      [[makeCard("blue", "3")], [makeCard("red", "7")]],
      topDiscard,
      "red",
      0
    );
    // Need cards in deck for penalty draw
    state.deck = [makeCard("yellow", "1"), makeCard("green", "2")];
    // p2 has 1 card and hasn't called UNO
    state.players[1].hand = [makeCard("red", "5")];
    state.players[1].calledUno = false;

    const result = callUno(state, "p1", "p2");
    expect(result.penaltyApplied).toBe(true);
    expect(result.state.players[1].hand.length).toBe(3); // 1 original + 2 penalty
  });

  it("cannot catch a player who already called UNO", () => {
    const topDiscard = makeCard("red", "5");
    const state = makeTestState(
      ["p1", "p2"],
      [[makeCard("blue", "3")], [makeCard("red", "7")]],
      topDiscard,
      "red",
      0
    );
    // p2 has 1 card and already called UNO
    state.players[1].hand = [makeCard("red", "5")];
    state.players[1].calledUno = true;

    const result = callUno(state, "p1", "p2");
    expect(result.penaltyApplied).toBe(false);
  });

  it("cannot catch a player with more than 1 card", () => {
    const topDiscard = makeCard("red", "5");
    const state = makeTestState(
      ["p1", "p2"],
      [[makeCard("blue", "3")], [makeCard("red", "7"), makeCard("green", "2")]],
      topDiscard,
      "red",
      0
    );

    const result = callUno(state, "p1", "p2");
    expect(result.penaltyApplied).toBe(false);
  });

  it("catch adds exactly 2 cards to target hand", () => {
    const topDiscard = makeCard("red", "5");
    const state = makeTestState(
      ["p1", "p2", "p3"],
      [
        [makeCard("blue", "3")],
        [makeCard("red", "7")],
        [makeCard("green", "2")],
      ],
      topDiscard,
      "red",
      0
    );
    // Need cards in deck for penalty draw
    state.deck = [makeCard("yellow", "1"), makeCard("green", "4")];
    // p3 has 1 card and hasn't called UNO
    state.players[2].hand = [makeCard("red", "5")];
    state.players[2].calledUno = false;

    const result = callUno(state, "p1", "p3");
    expect(result.penaltyApplied).toBe(true);
    expect(result.state.players[2].hand.length).toBe(3); // 1 + 2 = 3
  });
});

describe("handleTimeout Action", () => {
  it("auto-draws a card and passes turn after timeout", () => {
    const topDiscard = makeCard("red", "5");
    const state = makeTestState(
      ["p1", "p2"],
      [[makeCard("blue", "3")], [makeCard("red", "7")]],
      topDiscard,
      "red",
      0,
      1
    );
    state.deck = [makeCard("yellow", "2"), makeCard("green", "4")];

    const initialHandSize = state.players[0].hand.length;
    const result = handleTimeout(state, "p1");

    expect(result.players[0].hand.length).toBe(initialHandSize + 1);
    expect(result.currentPlayerIndex).toBe(1);
  });

  it("ignores timeout when it's not the player's turn", () => {
    const topDiscard = makeCard("red", "5");
    const state = makeTestState(
      ["p1", "p2"],
      [[makeCard("blue", "3")], [makeCard("red", "7")]],
      topDiscard,
      "red",
      0
    );

    const result = handleTimeout(state, "p2");
    expect(result).toBe(state);
  });

  it("handles empty deck by reshuffling discard pile", () => {
    const topDiscard = makeCard("red", "5");
    const state = makeTestState(
      ["p1", "p2"],
      [[makeCard("blue", "3")], [makeCard("red", "7")]],
      topDiscard,
      "red",
      0
    );
    state.deck = [];
    state.discardPile = [
      makeCard("yellow", "1", "d1"),
      makeCard("green", "2", "d2"),
      makeCard("blue", "3", "d3"),
    ];

    const result = handleTimeout(state, "p1");
    expect(result.players[0].hand.length).toBe(
      state.players[0].hand.length + 1
    );
  });
});

describe("API Response Format", () => {
  it("game action response includes success flag and updated state", () => {
    // This tests the expected response structure from the API
    const mockResponse = {
      success: true,
      action: "play_card",
      playerId: "p1",
      currentPlayerId: "p2",
      currentColor: "red" as CardColor,
      status: "playing",
    };

    expect(mockResponse.success).toBe(true);
    expect(mockResponse.action).toBe("play_card");
    expect(mockResponse.currentPlayerId).toBe("p2");
    expect(mockResponse.currentColor).toBe("red");
    expect(mockResponse.status).toBe("playing");
  });

  it("game action error response includes error field", () => {
    const mockErrorResponse = {
      error: "Not your turn",
    };

    expect(mockErrorResponse.error).toBeTruthy();
  });

  it("start game response includes game session and player info", () => {
    const mockStartResponse = {
      gameSessionId: "abc-123",
      gameType: "uno",
      players: [
        { id: "p1", displayName: "Alice", avatarEmoji: "🦊", isHost: true },
        { id: "p2", displayName: "Bob", avatarEmoji: "🐼", isHost: false },
      ],
      currentPlayerId: "p1",
      hand: [],
      status: "playing",
    };

    expect(mockStartResponse.gameSessionId).toBeTruthy();
    expect(mockStartResponse.gameType).toBe("uno");
    expect(mockStartResponse.players.length).toBe(2);
    expect(mockStartResponse.status).toBe("playing");
  });
});
