/**
 * Tests for Never Have I Ever game flow logic.
 *
 * Tests the NHIE-specific behaviors:
 * - NHIE response tallying (have/have-not)
 * - Edge cases: all have, none have
 * - Phase transitions for NHIE flow
 * - Two-step reveal logic (anonymized count → full reveal)
 *
 * These tests verify the pure logic that powers the NHIE game mode,
 * building on top of the shared party engine.
 */

import { describe, it, expect } from "vitest";
import type { PartyGameConfig, PartyGameState, PlayerResponse } from "@/lib/party-engine";
import {
  advancePhase,
  tallyResponses,
  computeReveal,
  handleTimerExpiry,
} from "@/lib/party-engine";
import type { GameContentEntry, ContentTier } from "@/lib/content";

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

const DEFAULT_CONFIG: PartyGameConfig = {
  vibeTier: "spicy",
  drinkingEnabled: true,
  maxDrinksPerRound: 3,
  passPenalty: 1,
  timerSeconds: 30,
  tieRule: "all-drink",
  allowSelfVote: false,
};

function makeNHIECard(id = "nhie-1"): GameContentEntry {
  return {
    id,
    gameType: "never-have-i-ever",
    category: "embarrassing",
    tier: "spicy",
    text: "Never have I ever sent a text to the wrong person.",
  };
}

function makeNHIEState(overrides: Partial<PartyGameState> = {}): PartyGameState {
  return {
    gameSessionId: "nhie-session-1",
    gameType: "never-have-i-ever",
    status: "responding",
    currentCard: makeNHIECard(),
    roundNumber: 1,
    responses: [],
    phase: "responding",
    timerSeconds: 30,
    config: DEFAULT_CONFIG,
    ...overrides,
  };
}

function makeResponse(
  playerId: string,
  playerName: string,
  value: "have" | "have-not"
): PlayerResponse {
  return {
    playerId,
    playerName,
    value,
    timestamp: Date.now(),
  };
}

// ──────────────────────────────────────────────
// NHIE RESPONSE TALLYING
// ──────────────────────────────────────────────

describe("NHIE response tallying", () => {
  it("tallies 'have' and 'have-not' responses correctly", () => {
    const responses = [
      makeResponse("p1", "Alice", "have"),
      makeResponse("p2", "Bob", "have-not"),
      makeResponse("p3", "Charlie", "have"),
      makeResponse("p4", "Diana", "have-not"),
      makeResponse("p5", "Eve", "have"),
    ];

    const counts = tallyResponses(responses);
    expect(counts).toEqual({ have: 3, "have-not": 2 });
  });

  it("returns empty counts for no responses", () => {
    const counts = tallyResponses([]);
    expect(counts).toEqual({});
  });

  it("handles single response", () => {
    const responses = [makeResponse("p1", "Alice", "have")];
    const counts = tallyResponses(responses);
    expect(counts).toEqual({ have: 1 });
  });

  it("handles all have", () => {
    const responses = [
      makeResponse("p1", "Alice", "have"),
      makeResponse("p2", "Bob", "have"),
      makeResponse("p3", "Charlie", "have"),
    ];

    const counts = tallyResponses(responses);
    expect(counts).toEqual({ have: 3 });
    expect(counts["have-not"]).toBeUndefined();
  });

  it("handles none have", () => {
    const responses = [
      makeResponse("p1", "Alice", "have-not"),
      makeResponse("p2", "Bob", "have-not"),
      makeResponse("p3", "Charlie", "have-not"),
    ];

    const counts = tallyResponses(responses);
    expect(counts["have"]).toBeUndefined();
    expect(counts["have-not"]).toBe(3);
  });
});

// ──────────────────────────────────────────────
// NHIE REVEAL COMPUTATION
// ──────────────────────────────────────────────

describe("NHIE reveal computation", () => {
  // VAL-NHIE-003: Anonymized count shows 'X of Y have done this'
  // VAL-NHIE-004: Full reveal shows per-player responses
  it("computeReveal returns correct breakdown for NHIE responses (VAL-NHIE-003, VAL-NHIE-004)", () => {
    const state = makeNHIEState({
      responses: [
        makeResponse("p1", "Alice", "have"),
        makeResponse("p2", "Bob", "have-not"),
        makeResponse("p3", "Charlie", "have"),
        makeResponse("p4", "Diana", "have-not"),
        makeResponse("p5", "Eve", "have"),
      ],
    });

    const reveal = computeReveal(state);

    // Verify counts
    expect(reveal.counts).toEqual({ have: 3, "have-not": 2 });
    expect(reveal.totalResponses).toBe(5);

    // Verify breakdown has both groups
    expect(reveal.breakdown).toHaveLength(2);

    const haveBreakdown = reveal.breakdown.find((b) => b.value === "have");
    const haveNotBreakdown = reveal.breakdown.find((b) => b.value === "have-not");

    expect(haveBreakdown).toBeDefined();
    expect(haveNotBreakdown).toBeDefined();

    expect(haveBreakdown!.count).toBe(3);
    expect(haveBreakdown!.players).toHaveLength(3);
    expect(haveBreakdown!.players.map((p) => p.playerName)).toContain("Alice");
    expect(haveBreakdown!.players.map((p) => p.playerName)).toContain("Charlie");
    expect(haveBreakdown!.players.map((p) => p.playerName)).toContain("Eve");

    expect(haveNotBreakdown!.count).toBe(2);
    expect(haveNotBreakdown!.players).toHaveLength(2);
    expect(haveNotBreakdown!.players.map((p) => p.playerName)).toContain("Bob");
    expect(haveNotBreakdown!.players.map((p) => p.playerName)).toContain("Diana");
  });

  it("all have done: reveals N of N have done this (VAL-NHIE-003 edge case)", () => {
    const state = makeNHIEState({
      responses: [
        makeResponse("p1", "Alice", "have"),
        makeResponse("p2", "Bob", "have"),
        makeResponse("p3", "Charlie", "have"),
      ],
    });

    const reveal = computeReveal(state);
    expect(reveal.counts).toEqual({ have: 3 });
    expect(reveal.totalResponses).toBe(3);

    const haveBreakdown = reveal.breakdown.find((b) => b.value === "have");
    expect(haveBreakdown).toBeDefined();
    expect(haveBreakdown!.count).toBe(3);
    expect(haveBreakdown!.players).toHaveLength(3);
  });

  it("none have done: reveals 0 of N have done this (VAL-NHIE-003 edge case)", () => {
    const state = makeNHIEState({
      responses: [
        makeResponse("p1", "Alice", "have-not"),
        makeResponse("p2", "Bob", "have-not"),
        makeResponse("p3", "Charlie", "have-not"),
      ],
    });

    const reveal = computeReveal(state);
    expect(reveal.counts).toEqual({ "have-not": 3 });
    expect(reveal.totalResponses).toBe(3);

    const haveNotBreakdown = reveal.breakdown.find((b) => b.value === "have-not");
    expect(haveNotBreakdown).toBeDefined();
    expect(haveNotBreakdown!.count).toBe(3);
  });

  it("reveal breakdown correctly identifies anonymous vs named data", () => {
    const state = makeNHIEState({
      responses: [
        makeResponse("p1", "Alice", "have"),
        makeResponse("p2", "Bob", "have-not"),
      ],
    });

    const reveal = computeReveal(state);

    // The anonymized count is derived from counts (X of Y have done this)
    expect(reveal.counts["have"]).toBe(1);
    expect(reveal.totalResponses).toBe(2);

    // The full reveal data is in breakdown with player names
    const haveBreakdown = reveal.breakdown.find((b) => b.value === "have");
    expect(haveBreakdown!.players[0].playerName).toBe("Alice");

    const haveNotBreakdown = reveal.breakdown.find((b) => b.value === "have-not");
    expect(haveNotBreakdown!.players[0].playerName).toBe("Bob");
  });
});

// ──────────────────────────────────────────────
// NHIE PHASE TRANSITIONS
// ──────────────────────────────────────────────

describe("NHIE phase transitions", () => {
  it("starts in responding phase for NHIE show-card → responding", () => {
    const state = makeNHIEState({ phase: "show-card", status: "show-card", timerSeconds: null });
    const advanced = advancePhase(state, "responding");

    expect("error" in advanced).toBe(false);
    if (!("error" in advanced)) {
      expect(advanced.phase).toBe("responding");
      expect(advanced.timerSeconds).toBe(30);
    }
  });

  it("transitions responding → revealing correctly", () => {
    const state = makeNHIEState({
      responses: [
        makeResponse("p1", "Alice", "have"),
        makeResponse("p2", "Bob", "have-not"),
      ],
    });

    const advanced = advancePhase(state, "revealing");

    expect("error" in advanced).toBe(false);
    if (!("error" in advanced)) {
      expect(advanced.phase).toBe("revealing");
      expect(advanced.timerSeconds).toBeNull();
      // Responses should be preserved during revealing
      expect(advanced.responses).toHaveLength(2);
    }
  });

  it("transitions revealing → drinking correctly", () => {
    const revealingState = makeNHIEState({
      phase: "revealing",
      status: "revealing",
      timerSeconds: null,
      responses: [
        makeResponse("p1", "Alice", "have"),
        makeResponse("p2", "Bob", "have-not"),
      ],
    });

    const advanced = advancePhase(revealingState, "drinking");

    expect("error" in advanced).toBe(false);
    if (!("error" in advanced)) {
      expect(advanced.phase).toBe("drinking");
      expect(advanced.timerSeconds).toBeNull();
      // Responses still preserved for drinking prompt logic
      expect(advanced.responses).toHaveLength(2);
    }
  });

  it("transitions drinking → next-round and clears responses", () => {
    const drinkingState = makeNHIEState({
      phase: "drinking",
      status: "drinking",
      timerSeconds: null,
      responses: [
        makeResponse("p1", "Alice", "have"),
        makeResponse("p2", "Bob", "have-not"),
      ],
    });

    const advanced = advancePhase(drinkingState, "next-round");

    expect("error" in advanced).toBe(false);
    if (!("error" in advanced)) {
      expect(advanced.phase).toBe("next-round");
      expect(advanced.responses).toHaveLength(0); // Cleared for next round
    }
  });

  it("rejects invalid transitions (show-card → drinking directly)", () => {
    const state = makeNHIEState({ phase: "show-card", status: "show-card" });
    const result = advancePhase(state, "drinking");

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toContain("Cannot transition");
    }
  });

  it("rejects responding → show-card (backwards)", () => {
    const state = makeNHIEState({ phase: "responding" });
    const result = advancePhase(state, "show-card");

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toContain("Cannot transition");
    }
  });

  it("handles timer expiry from show-card → responding for NHIE", () => {
    const state = makeNHIEState({ phase: "show-card", status: "show-card", timerSeconds: null });
    // Simulate timer expiry
    const result = handleTimerExpiry(state);

    expect(result.phase).toBe("responding");
    expect(result.timerSeconds).toBe(30);
  });
});

// ──────────────────────────────────────────────
// NHIE FULL GAME FLOW — End-to-end transition chain
// ──────────────────────────────────────────────

describe("NHIE full game flow (VAL-NHIE-005)", () => {
  it("complete flow: responding → revealing → drinking → next-round (VAL-NHIE-005)", () => {
    // Start in responding phase with responses
    const startState = makeNHIEState({
      phase: "responding",
      status: "responding",
      responses: [
        makeResponse("p1", "Alice", "have"),
        makeResponse("p2", "Bob", "have-not"),
        makeResponse("p3", "Charlie", "have"),
      ],
    });

    // Compute reveal while still in responding
    const reveal = computeReveal(startState);
    expect(reveal.counts).toEqual({ have: 2, "have-not": 1 });
    expect(reveal.totalResponses).toBe(3);

    // 1. responding → revealing
    const revealing = advancePhase(startState, "revealing");
    expect("error" in revealing).toBe(false);
    if ("error" in revealing) return;
    expect(revealing.phase).toBe("revealing");
    expect(revealing.responses).toHaveLength(3);

    // 2. revealing → drinking
    const drinking = advancePhase(revealing, "drinking");
    expect("error" in drinking).toBe(false);
    if ("error" in drinking) return;
    expect(drinking.phase).toBe("drinking");
    // Responses preserved for drinking prompt logic
    expect(drinking.responses).toHaveLength(3);

    // Validate drinking prompt logic: "I HAVE" players should drink
    const havePlayers = drinking.responses
      .filter((r) => r.value === "have")
      .map((r) => r.playerId);
    expect(havePlayers).toEqual(["p1", "p3"]); // Alice and Charlie drink

    const haveNotPlayers = drinking.responses
      .filter((r) => r.value === "have-not")
      .map((r) => r.playerId);
    expect(haveNotPlayers).toEqual(["p2"]); // Bob is safe

    // 3. drinking → next-round
    const nextRound = advancePhase(drinking, "next-round");
    expect("error" in nextRound).toBe(false);
    if ("error" in nextRound) return;
    expect(nextRound.phase).toBe("next-round");
    expect(nextRound.responses).toHaveLength(0); // Cleared for next round
  });

  it("edge case: all players have done it — all drink (VAL-NHIE-005)", () => {
    const state = makeNHIEState({
      responses: [
        makeResponse("p1", "Alice", "have"),
        makeResponse("p2", "Bob", "have"),
        makeResponse("p3", "Charlie", "have"),
      ],
    });

    const reveal = computeReveal(state);
    expect(reveal.counts).toEqual({ have: 3 });
    expect(reveal.totalResponses).toBe(3);

    const revealing = advancePhase(state, "revealing");
    expect("error" in revealing).toBe(false);

    const drinking = advancePhase(revealing as PartyGameState, "drinking");
    expect("error" in drinking).toBe(false);
    if ("error" in drinking) return;

    // All players should drink
    const havePlayers = drinking.responses
      .filter((r) => r.value === "have")
      .map((r) => r.playerId);
    expect(havePlayers).toHaveLength(3);
  });

  it("edge case: no one has done it — no one drinks (VAL-NHIE-005)", () => {
    const state = makeNHIEState({
      responses: [
        makeResponse("p1", "Alice", "have-not"),
        makeResponse("p2", "Bob", "have-not"),
      ],
    });

    const reveal = computeReveal(state);
    expect(reveal.counts).toEqual({ "have-not": 2 });

    const revealing = advancePhase(state, "revealing");
    expect("error" in revealing).toBe(false);

    const drinking = advancePhase(revealing as PartyGameState, "drinking");
    expect("error" in drinking).toBe(false);
    if ("error" in drinking) return;

    // No players should drink
    const havePlayers = drinking.responses
      .filter((r) => r.value === "have")
      .map((r) => r.playerId);
    expect(havePlayers).toHaveLength(0);
  });

  it("timer expiry auto-advances from revealing to drinking (VAL-ENG-005)", () => {
    const revealingState = makeNHIEState({
      phase: "revealing",
      status: "revealing",
      timerSeconds: null,
      responses: [
        makeResponse("p1", "Alice", "have"),
        makeResponse("p2", "Bob", "have-not"),
      ],
    });

    const result = handleTimerExpiry(revealingState);
    expect(result.phase).toBe("drinking");
    // Responses should be preserved when transitioning from revealing
    expect(result.responses).toHaveLength(2);
  });
});

// ──────────────────────────────────────────────
// NHIE DRINKING LOGIC
// ──────────────────────────────────────────────

describe("NHIE drinking logic", () => {
  // VAL-NHIE-005: 'I HAVE' players get drink prompt, 'I HAVEN'T' players see 'You're safe!'
  it("identifies 'have' and 'have-not' players correctly", () => {
    const responses = [
      makeResponse("p1", "Alice", "have"),
      makeResponse("p2", "Bob", "have-not"),
      makeResponse("p3", "Charlie", "have"),
    ];

    const havePlayers = responses
      .filter((r) => r.value === "have")
      .map((r) => r.playerId);

    const haveNotPlayers = responses
      .filter((r) => r.value === "have-not")
      .map((r) => r.playerId);

    expect(havePlayers).toEqual(["p1", "p3"]);
    expect(haveNotPlayers).toEqual(["p2"]);
  });

  it("when all have: all players are 'have' players (edge case)", () => {
    const responses = [
      makeResponse("p1", "Alice", "have"),
      makeResponse("p2", "Bob", "have"),
      makeResponse("p3", "Charlie", "have"),
    ];

    const havePlayers = responses.filter((r) => r.value === "have");
    const haveNotPlayers = responses.filter((r) => r.value === "have-not");

    expect(havePlayers).toHaveLength(3);
    expect(haveNotPlayers).toHaveLength(0);
  });

  it("when none have: all players are 'have-not' players (edge case)", () => {
    const responses = [
      makeResponse("p1", "Alice", "have-not"),
      makeResponse("p2", "Bob", "have-not"),
      makeResponse("p3", "Charlie", "have-not"),
    ];

    const havePlayers = responses.filter((r) => r.value === "have");
    const haveNotPlayers = responses.filter((r) => r.value === "have-not");

    expect(havePlayers).toHaveLength(0);
    expect(haveNotPlayers).toHaveLength(3);
  });

  it("drinking prompt applies to 'have' players only", () => {
    const responses = [
      makeResponse("p1", "Alice", "have"),
      makeResponse("p2", "Bob", "have-not"),
      makeResponse("p3", "Charlie", "have"),
    ];

    const havePlayerIds = new Set(
      responses.filter((r) => r.value === "have").map((r) => r.playerId)
    );

    // Alice and Charlie should drink
    expect(havePlayerIds.has("p1")).toBe(true);
    expect(havePlayerIds.has("p3")).toBe(true);

    // Bob should NOT drink
    expect(havePlayerIds.has("p2")).toBe(false);
  });

  it("safe message for 'have-not' players", () => {
    const responses = [
      makeResponse("p1", "Alice", "have"),
      makeResponse("p2", "Bob", "have-not"),
    ];

    const haveNotPlayerIds = new Set(
      responses.filter((r) => r.value === "have-not").map((r) => r.playerId)
    );

    // Bob is the 'have-not' player
    expect(haveNotPlayerIds.has("p2")).toBe(true);
    expect(haveNotPlayerIds.has("p1")).toBe(false);
  });
});
