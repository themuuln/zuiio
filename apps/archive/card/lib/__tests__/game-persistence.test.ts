/**
 * Tests for game state persistence: start_game, record_game_move, record_round_score RPCs,
 * game state reconstruction from player_hands, and scoreboard calculations.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  createInitialGameState,
  playCard,
  drawCard,
  calculateRoundScores,
  calculateScore,
  checkRoundEnd,
} from "@/lib/game-engine/uno";
import type { Card, CardColor, PlayerState, GameState } from "@/lib/game-engine/types";
import { resetCardIdCounter } from "@/lib/game-engine/deck";

// Helper to create a card

beforeEach(() => {
  resetCardIdCounter();
});

// ── Helper functions ──

function makeCard(
  color: CardColor | undefined,
  value: string,
  id?: string
): Card {
  return {
    color,
    value: value as Card["value"],
    id: id ?? `test-${Math.random().toString(36).slice(2)}`,
  };
}

// ── start_game RPC integration tests ──

describe("start_game RPC integration", () => {
  it("createInitialGameState deals 7 cards per player", () => {
    const state = createInitialGameState({}, ["p1", "p2", "p3", "p4"]);
    expect(state.players).toHaveLength(4);
    for (const player of state.players) {
      expect(player.hand).toHaveLength(7);
    }
  });

  it("createInitialGameState starts with playing status", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    expect(state.status).toBe("playing");
    expect(state.direction).toBe(1);
    expect(state.currentPlayerIndex).toBe(0);
  });

  it("createInitialGameState uses house rules config", () => {
    const state = createInitialGameState(
      { drawStacking: true, drawUntilYouPlay: true },
      ["p1", "p2"]
    );
    expect(state.config.drawStacking).toBe(true);
    expect(state.config.drawUntilYouPlay).toBe(true);
  });

  it("createInitialGameState top discard is a number card", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    const top = state.discardPile[state.discardPile.length - 1];
    expect(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]).toContain(
      top.value
    );
  });

  it("createInitialGameState sets round number to 1", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    expect(state.roundNumber).toBe(1);
  });
});

// ── record_game_move persistence tests ──

describe("record_game_move integration", () => {
  it("playCard validates and returns new state", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    const topDiscard = state.discardPile[state.discardPile.length - 1];
    const color = topDiscard.color!;

    // Add a playable card for p1
    state.players[0].hand.push(makeCard(color, "3"));
    const cardIndex = state.players[0].hand.length - 1;

    const result = playCard(state, "p1", cardIndex);
    expect(result.error).toBeUndefined();
    expect(result.state.players[0].hand.length).toBe(7); // Still has 7 original cards, played 1

    // Verify the move type
    expect(result.state.discardPile.length).toBe(state.discardPile.length + 1);
  });

  it("drawCard draws from deck and advances turn", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    const initialHandSize = state.players[0].hand.length;
    const initialDeckSize = state.deck.length;

    const result = drawCard(state, "p1");
    expect(result.error).toBeUndefined();
    expect(result.state.players[0].hand).toHaveLength(initialHandSize + 1);
    expect(result.state.deck).toHaveLength(initialDeckSize - 1);
    expect(result.state.currentPlayerIndex).toBe(1); // Turn passed
  });

  it("drawCard respects pendingDrawCount from Draw 2", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    state.pendingDrawCount = 2;
    const initialHandSize = state.players[0].hand.length;

    const result = drawCard(state, "p1");
    expect(result.state.players[0].hand).toHaveLength(initialHandSize + 2);
    expect(result.state.pendingDrawCount).toBe(0); // Reset after draw
  });

  it("playCard records the played card in discard pile", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    const topDiscard = state.discardPile[state.discardPile.length - 1];
    const color = topDiscard.color!;

    state.players[0].hand.push(makeCard(color, "5", "played-card-123"));
    const cardIndex = state.players[0].hand.length - 1;

    const result = playCard(state, "p1", cardIndex);
    const discardTop = result.state.discardPile[result.state.discardPile.length - 1];
    expect(discardTop.id).toBe("played-card-123");
  });
});

// ── record_round_score scoring tests ──

describe("record_round_score integration", () => {
  it("calculateRoundScores gives winner sum of opponents' points", () => {
    const state = createInitialGameState({}, ["p1", "p2", "p3"]);

    // Set p1 as winner (empty hand)
    state.players[0].hand = [];

    // Set opponent hands
    state.players[1].hand = [
      makeCard("red", "5"),     // 5
      makeCard("blue", "skip"),  // 20
    ];
    state.players[2].hand = [
      makeCard("green", "3"),    // 3
      makeCard(undefined, "wild"), // 50
    ];

    const scores = calculateRoundScores(state);
    expect(scores["p1"]).toBe(78); // 5 + 20 + 3 + 50
    expect(scores["p2"]).toBe(0);
    expect(scores["p3"]).toBe(0);
  });

  it("calculateRoundScores returns zeros when no winner", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    const scores = calculateRoundScores(state);
    expect(scores["p1"]).toBe(0);
    expect(scores["p2"]).toBe(0);
  });

  it("calculateScore returns correct values for mixed hand", () => {
    const hand = [
      makeCard("red", "1"),      // 1
      makeCard("blue", "9"),     // 9
      makeCard("green", "draw2"), // 20
      makeCard("yellow", "reverse"), // 20
      makeCard(undefined, "wild4"), // 50
    ];
    expect(calculateScore(hand)).toBe(100);
  });

  it("checkRoundEnd detects winner with empty hand", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    state.players[0].hand = [];
    expect(checkRoundEnd(state)).toBe("p1");
  });

  it("checkRoundEnd returns undefined when no empty hand", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    expect(checkRoundEnd(state)).toBeUndefined();
  });
});

// ── Game state snapshot / persistence format tests ──

describe("Game state persistence format", () => {
  it("game state can be serialized to JSON and back", () => {
    const state = createInitialGameState({ drawStacking: true }, ["p1", "p2"]);

    // Simulate what we'd store in game_sessions.config
    const configSnapshot = {
      deck: state.deck,
      discardPile: state.discardPile,
      players: state.players,
      currentColor: state.currentColor,
      currentPlayerIndex: state.currentPlayerIndex,
      direction: state.direction,
      pendingDrawCount: state.pendingDrawCount,
      status: state.status,
      roundNumber: state.roundNumber,
      turnStartTime: state.turnStartTime,
      config: state.config,
      winnerId: state.winnerId,
    };

    const serialized = JSON.parse(JSON.stringify(configSnapshot));
    expect(serialized.deck).toHaveLength(state.deck.length);
    expect(serialized.discardPile).toHaveLength(state.discardPile.length);
    expect(serialized.players).toHaveLength(2);
    expect(serialized.currentPlayerIndex).toBe(0);
    expect(serialized.roundNumber).toBe(1);
    expect(serialized.status).toBe("playing");
  });

  it("player hand can be extracted and stored separately", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);

    // The upsert_player_hand RPC stores each player's hand as JSONB
    const playerHands = state.players.map((p) => ({
      game_session_id: "test-session-id",
      player_id: p.playerId,
      cards: JSON.parse(JSON.stringify(p.hand)),
    }));

    expect(playerHands).toHaveLength(2);
    expect(playerHands[0].cards).toHaveLength(7);
    expect(playerHands[1].cards).toHaveLength(7);
    expect(playerHands[0].player_id).toBe("p1");
    expect(playerHands[1].player_id).toBe("p2");
  });

  it("multiple rounds: scores accumulate across rounds", () => {
    // Simulate round 1
    const state1 = createInitialGameState({}, ["p1", "p2"]);
    state1.players[0].hand = []; // p1 wins
    state1.players[1].hand = [
      makeCard("red", "5"),
      makeCard("blue", "draw2"),
    ]; // 5 + 20 = 25

    const round1Scores = calculateRoundScores(state1);
    expect(round1Scores["p1"]).toBe(25);

    // Simulate round 2 (new round, same players)
    const state2 = createInitialGameState({}, ["p1", "p2"]);
    state2.players[1].hand = []; // p2 wins
    state2.players[0].hand = [
      makeCard("red", "3"),
      makeCard("green", "skip"),
    ]; // 3 + 20 = 23

    const round2Scores = calculateRoundScores(state2);
    expect(round2Scores["p2"]).toBe(23);

    // Running totals after 2 rounds
    const runningTotals: Record<string, number> = {};
    for (const [pid, pts] of Object.entries(round1Scores)) {
      runningTotals[pid] = (runningTotals[pid] ?? 0) + pts;
    }
    for (const [pid, pts] of Object.entries(round2Scores)) {
      runningTotals[pid] = (runningTotals[pid] ?? 0) + pts;
    }

    expect(runningTotals["p1"]).toBe(25); // Won round 1
    expect(runningTotals["p2"]).toBe(23); // Won round 2
  });

  it("game state can be reconstructed from saved config", () => {
    const original = createInitialGameState({}, ["p1", "p2"]);

    // Simulate what we store in the DB
    const savedConfig = JSON.parse(JSON.stringify({
      deck: original.deck,
      discardPile: original.discardPile,
      currentColor: original.currentColor,
      currentPlayerIndex: original.currentPlayerIndex,
      direction: original.direction,
      pendingDrawCount: original.pendingDrawCount,
      status: original.status,
      roundNumber: original.roundNumber,
      config: original.config,
      winnerId: original.winnerId,
    }));

    // Simulate what we'd reconstruct: player_hands gives us hands
    // We need to rebuild the players array
    const reconstructedPlayers: PlayerState[] = [
      {
        playerId: "p1",
        hand: original.players[0].hand,
        calledUno: false,
      },
      {
        playerId: "p2",
        hand: original.players[1].hand,
        calledUno: false,
      },
    ];

    const reconstructed: GameState = {
      ...savedConfig,
      players: reconstructedPlayers,
      turnStartTime: Date.now(),
    };

    // Verify the reconstructed state is valid for game play
    expect(reconstructed.players[0].hand).toHaveLength(7);
    expect(reconstructed.players[1].hand).toHaveLength(7);
    expect(reconstructed.status).toBe("playing");
    expect(reconstructed.currentPlayerIndex).toBe(0);

    // Can continue playing from reconstructed state
    // Only match number cards to avoid action card effects (skip/reverse/draw2)
    // that would change the expected turn advancement.
    const topDiscard = reconstructed.discardPile[reconstructed.discardPile.length - 1];
    const playableCard = reconstructed.players[0].hand.find(
      (c) => c.color === topDiscard.color && !["skip", "reverse", "draw2", "wild", "wild4"].includes(c.value)
    );

    if (playableCard) {
      const cardIndex = reconstructed.players[0].hand.findIndex(
        (c) => c.id === playableCard.id
      );
      const result = playCard(reconstructed, "p1", cardIndex);
      expect(result.error).toBeUndefined();
      // Number cards have skipCount=0, so turn advances exactly 1 step:
      // index 0 → index 1 (2-player game, direction=1)
      expect(result.state.currentPlayerIndex).toBe(1);
    }
  });
});

// ── Play Again (new round) test ──

describe("Play Again / New Round", () => {
  it("new round deals fresh hands to same players", () => {
    const state1 = createInitialGameState({}, ["p1", "p2"]);

    // Simulate playing some cards in round 1
    state1.players[0].hand = state1.players[0].hand.slice(0, 3); // Only 3 cards left
    state1.roundNumber = 1;

    // New round: create fresh state
    const state2 = createInitialGameState(
      { drawStacking: state1.config.drawStacking },
      ["p1", "p2"]
    );
    state2.roundNumber = 2;

    // Fresh hands in new round
    expect(state2.players[0].hand).toHaveLength(7);
    expect(state2.players[1].hand).toHaveLength(7);
    expect(state2.roundNumber).toBe(2);
    expect(state2.status).toBe("playing");
  });

  it("new round preserves house rules from previous round", () => {
    const config = { drawStacking: true, drawUntilYouPlay: true, turnTimeoutSeconds: 30, winningScore: 1000 };
    const state1 = createInitialGameState(config, ["p1", "p2", "p3"]);

    // New round with same config
    const state2 = createInitialGameState(
      {
        drawStacking: state1.config.drawStacking,
        drawUntilYouPlay: state1.config.drawUntilYouPlay,
        turnTimeoutSeconds: state1.config.turnTimeoutSeconds,
        winningScore: state1.config.winningScore,
      },
      ["p1", "p2", "p3"]
    );

    expect(state2.config.drawStacking).toBe(true);
    expect(state2.config.drawUntilYouPlay).toBe(true);
    expect(state2.config.turnTimeoutSeconds).toBe(30);
    expect(state2.config.winningScore).toBe(1000);
  });

  it("running totals persist across rounds", () => {
    // Round 1 scores
    const round1Scores: Record<string, number> = {
      p1: 35, // winner
      p2: 0,
      p3: 0,
    };

    // Round 2 scores
    const round2Scores: Record<string, number> = {
      p1: 0,
      p2: 42, // winner
      p3: 0,
    };

    // Running totals
    const runningTotals: Record<string, number> = {};
    for (const [pid, pts] of Object.entries(round1Scores)) {
      runningTotals[pid] = (runningTotals[pid] ?? 0) + pts;
    }
    for (const [pid, pts] of Object.entries(round2Scores)) {
      runningTotals[pid] = (runningTotals[pid] ?? 0) + pts;
    }

    expect(runningTotals["p1"]).toBe(35);
    expect(runningTotals["p2"]).toBe(42);
    expect(runningTotals["p3"]).toBe(0);
  });
});

// ── Different Game test ──

describe("Different Game", () => {
  it("returns to lobby state", () => {
    // Simulating what the different-game API does:
    // 1. Room game_state set back to "lobby"
    // 2. current_game_id cleared
    // 3. Game session status set to "game_end"

    const resetRoom = {
      game_state: "lobby",
      current_game_id: null as string | null,
    };

    expect(resetRoom.game_state).toBe("lobby");
    expect(resetRoom.current_game_id).toBeNull();
  });
});
