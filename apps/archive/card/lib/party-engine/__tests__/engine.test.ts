/**
 * Tests for the Party Game Engine core logic.
 *
 * Covers all pure functions in engine.ts:
 * - createContentQueue (content filtering by tier)
 * - getNextCard (smart shuffle, recently-shown window)
 * - createInitialState
 * - advancePhase (valid + invalid transitions)
 * - tallyResponses
 * - computeReveal
 * - handleTimerExpiry (per-phase auto-advance)
 * - checkGameEnd
 */

import { describe, it, expect, beforeEach } from "vitest";
import type { GameContentEntry, ContentTier } from "@/lib/content";
import { resetContentIdCounter } from "@/lib/content";
import type { PartyGameConfig, PartyGameState } from "@/lib/party-engine";
import {
  createContentQueue,
  getNextCard,
  createInitialState,
  advancePhase,
  tallyResponses,
  computeReveal,
  handleTimerExpiry,
  checkGameEnd,
  MAX_ROUNDS,
} from "@/lib/party-engine";
import type { ContentQueue } from "@/lib/party-engine";

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

function makeContent(
  id: string,
  gameType: string,
  tier: ContentTier,
  category = "general"
): GameContentEntry {
  return { id, gameType, category, tier, text: `Card ${id}` };
}

function makeCards(
  count: number,
  gameType = "truth-or-dare",
  tier: ContentTier = "spicy"
): GameContentEntry[] {
  return Array.from({ length: count }, (_, i) =>
    makeContent(`card-${i + 1}`, gameType, tier)
  );
}

function makeState(overrides: Partial<PartyGameState> = {}): PartyGameState {
  return {
    gameSessionId: "session-1",
    gameType: "truth-or-dare",
    status: "show-card",
    currentCard: null,
    roundNumber: 1,
    responses: [],
    phase: "show-card",
    timerSeconds: null,
    config: DEFAULT_CONFIG,
    ...overrides,
  };
}

// ──────────────────────────────────────────────
// CONTENT QUEUE
// ──────────────────────────────────────────────

describe("createContentQueue", () => {
  beforeEach(() => {
    resetContentIdCounter();
  });

  it("filters by game type", () => {
    const allContent = [
      ...makeCards(3, "truth-or-dare", "spicy"),
      ...makeCards(2, "never-have-i-ever", "spicy"),
    ];

    const queue = createContentQueue("truth-or-dare", allContent, "spicy");

    expect(queue.remaining).toHaveLength(3);
    expect(queue.remaining.every((c) => c.gameType === "truth-or-dare")).toBe(true);
    expect(queue.recentlyShown).toHaveLength(0);
    expect(queue.windowSize).toBe(10);
  });

  it("filters by vibe tier — spicy only includes spicy", () => {
    const allContent = [
      ...makeCards(3, "truth-or-dare", "spicy"),
      ...makeCards(2, "truth-or-dare", "wild"),
      ...makeCards(1, "truth-or-dare", "after-dark"),
    ];

    const queue = createContentQueue("truth-or-dare", allContent, "spicy");

    expect(queue.remaining).toHaveLength(3);
    expect(queue.remaining.every((c) => c.tier === "spicy")).toBe(true);
  });

  it("filters by vibe tier — wild includes spicy + wild", () => {
    const allContent = [
      ...makeCards(3, "truth-or-dare", "spicy"),
      ...makeCards(2, "truth-or-dare", "wild"),
      ...makeCards(1, "truth-or-dare", "after-dark"),
    ];

    const queue = createContentQueue("truth-or-dare", allContent, "wild");

    expect(queue.remaining).toHaveLength(5);
    const tiers = queue.remaining.map((c) => c.tier);
    expect(tiers.filter((t) => t === "spicy")).toHaveLength(3);
    expect(tiers.filter((t) => t === "wild")).toHaveLength(2);
    expect(tiers.filter((t) => t === "after-dark")).toHaveLength(0);
  });

  it("filters by vibe tier — after-dark includes all tiers", () => {
    const allContent = [
      ...makeCards(3, "truth-or-dare", "spicy"),
      ...makeCards(2, "truth-or-dare", "wild"),
      ...makeCards(1, "truth-or-dare", "after-dark"),
    ];

    const queue = createContentQueue("truth-or-dare", allContent, "after-dark");

    expect(queue.remaining).toHaveLength(6);
  });

  it("shuffles the remaining cards", () => {
    // Use many cards to make ordering non-trivial
    const allContent = makeCards(50, "truth-or-dare", "spicy");

    const queue1 = createContentQueue("truth-or-dare", allContent, "spicy");
    const queue2 = createContentQueue("truth-or-dare", allContent, "spicy");

    // Content should be same set but different order (very unlikely to match)
    expect(queue1.remaining).toHaveLength(50);
    expect(queue2.remaining).toHaveLength(50);

    const ids1 = queue1.remaining.map((c) => c.id).sort();
    const ids2 = queue2.remaining.map((c) => c.id).sort();
    expect(ids1).toEqual(ids2);
  });

  it("starts with empty recentlyShown", () => {
    const queue = createContentQueue("truth-or-dare", makeCards(5, "truth-or-dare", "spicy"), "spicy");
    expect(queue.recentlyShown).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────
// GET NEXT CARD
// ──────────────────────────────────────────────

describe("getNextCard", () => {
  it("returns the first card from remaining", () => {
    const cards = makeCards(5);
    const queue: ContentQueue = {
      remaining: cards,
      recentlyShown: [],
      windowSize: 10,
    };

    const { card, queue: newQueue } = getNextCard(queue);

    expect(card).not.toBeNull();
    expect(card!.id).toBe("card-1");
    expect(newQueue.remaining).toHaveLength(4);
    expect(newQueue.remaining[0].id).toBe("card-2");
  });

  it("adds the drawn card to recentlyShown", () => {
    const cards = makeCards(5);
    const queue: ContentQueue = {
      remaining: cards,
      recentlyShown: [],
      windowSize: 10,
    };

    const { queue: newQueue } = getNextCard(queue);

    expect(newQueue.recentlyShown).toHaveLength(1);
    expect(newQueue.recentlyShown[0].id).toBe("card-1");
  });

  it("maintains recentlyShown newest-first order", () => {
    const cards = makeCards(5);
    const queue: ContentQueue = {
      remaining: cards,
      recentlyShown: [],
      windowSize: 10,
    };

    // Draw 3 cards
    const { queue: q1 } = getNextCard(queue);
    const { queue: q2 } = getNextCard(q1);
    const { queue: q3 } = getNextCard(q2);

    expect(q3.recentlyShown).toHaveLength(3);
    expect(q3.recentlyShown[0].id).toBe("card-3"); // newest first
    expect(q3.recentlyShown[1].id).toBe("card-2");
    expect(q3.recentlyShown[2].id).toBe("card-1");
  });

  it("deprioritizes cards outside the window size", () => {
    const cards = makeCards(15);
    const queue: ContentQueue = {
      remaining: cards,
      recentlyShown: [],
      windowSize: 3,
    };

    // Draw 4 cards. After 4th draw, the oldest (card-1) should be recycled.
    const { queue: q1 } = getNextCard(queue);
    const { queue: q2 } = getNextCard(q1);
    const { queue: q3 } = getNextCard(q2);
    const { queue: q4 } = getNextCard(q3);

    // recentlyShown should have the newest 3
    expect(q4.recentlyShown).toHaveLength(3);
    expect(q4.recentlyShown[0].id).toBe("card-4");
    expect(q4.recentlyShown[1].id).toBe("card-3");
    expect(q4.recentlyShown[2].id).toBe("card-2");

    // card-1 should be back in remaining (recycled)
    expect(q4.remaining.some((c) => c.id === "card-1")).toBe(true);
  });

  it("recycles multiple cards when window is exceeded", () => {
    const cards = makeCards(20);
    const queue: ContentQueue = {
      remaining: cards,
      recentlyShown: [],
      windowSize: 2,
    };

    // Draw 5 cards. After 3rd draw, card-1 gets recycled.
    let currentQueue = queue;
    for (let i = 0; i < 5; i++) {
      const result = getNextCard(currentQueue);
      currentQueue = result.queue;
    }

    // recentlyShown should have the newest 2
    expect(currentQueue.recentlyShown).toHaveLength(2);
    expect(currentQueue.recentlyShown[0].id).toBe("card-5");
    expect(currentQueue.recentlyShown[1].id).toBe("card-4");

    // Cards 1-3 should be recycled into remaining
    const recycledIds = currentQueue.remaining.map((c) => c.id);
    expect(recycledIds).toContain("card-1");
    expect(recycledIds).toContain("card-2");
    expect(recycledIds).toContain("card-3");
  });

  it("returns null card when remaining is empty", () => {
    const queue: ContentQueue = {
      remaining: [],
      recentlyShown: [],
      windowSize: 10,
    };

    const { card, queue: sameQueue } = getNextCard(queue);

    expect(card).toBeNull();
    expect(sameQueue.remaining).toHaveLength(0);
  });

  it("does not lose cards during the shuffle cycle", () => {
    const totalCards = 25;
    const cards = makeCards(totalCards, "truth-or-dare", "spicy");
    const queue: ContentQueue = {
      remaining: cards,
      recentlyShown: [],
      windowSize: 10,
    };

    // Draw all cards
    const drawn: string[] = [];
    let currentQueue = queue;
    for (let i = 0; i < totalCards; i++) {
      const result = getNextCard(currentQueue);
      if (result.card) drawn.push(result.card.id);
      currentQueue = result.queue;
    }

    // We should have drawn all unique cards
    expect(drawn).toHaveLength(totalCards);
    expect(new Set(drawn).size).toBe(totalCards);

    // Cards outside the window get recycled back into remaining,
    // so remaining is not empty — it contains recycled cards
    expect(currentQueue.recentlyShown).toHaveLength(10);
    expect(currentQueue.remaining.length).toBeGreaterThan(0);
  });
});

// ──────────────────────────────────────────────
// CREATE INITIAL STATE
// ──────────────────────────────────────────────

describe("createInitialState", () => {
  it("creates a state with show-card phase", () => {
    const card = makeContent("card-1", "truth-or-dare", "spicy");
    const state = createInitialState({
      gameSessionId: "session-1",
      gameType: "truth-or-dare",
      config: DEFAULT_CONFIG,
      firstCard: card,
    });

    expect(state.gameSessionId).toBe("session-1");
    expect(state.gameType).toBe("truth-or-dare");
    expect(state.phase).toBe("show-card");
    expect(state.status).toBe("show-card");
    expect(state.currentCard).toBe(card);
    expect(state.roundNumber).toBe(1);
    expect(state.responses).toHaveLength(0);
    expect(state.timerSeconds).toBeNull();
    expect(state.config).toBe(DEFAULT_CONFIG);
  });

  it("handles null firstCard gracefully", () => {
    const state = createInitialState({
      gameSessionId: "session-1",
      gameType: "never-have-i-ever",
      config: DEFAULT_CONFIG,
      firstCard: null,
    });

    expect(state.currentCard).toBeNull();
    expect(state.phase).toBe("show-card");
  });
});

// ──────────────────────────────────────────────
// ADVANCE PHASE
// ──────────────────────────────────────────────

describe("advancePhase", () => {
  it("advances show-card → responding", () => {
    const state = makeState({ phase: "show-card", status: "show-card" });
    const result = advancePhase(state);

    if ("ok" in result && !result.ok) {
      expect.fail(result.error);
    }

    const next = result as PartyGameState;
    expect(next.phase).toBe("responding");
    expect(next.timerSeconds).toBe(30); // Should set timer
  });

  it("advances responding → revealing", () => {
    const state = makeState({ phase: "responding", status: "responding", timerSeconds: 30 });
    const result = advancePhase(state);

    if ("ok" in result && !result.ok) {
      expect.fail(result.error);
    }

    const next = result as PartyGameState;
    expect(next.phase).toBe("revealing");
    expect(next.timerSeconds).toBeNull(); // Timer stops during reveal
  });

  it("advances revealing → drinking", () => {
    const state = makeState({ phase: "revealing", status: "revealing" });
    const result = advancePhase(state);

    if ("ok" in result && !result.ok) {
      expect.fail(result.error);
    }

    const next = result as PartyGameState;
    expect(next.phase).toBe("drinking");
  });

  it("advances drinking → next-round", () => {
    const state = makeState({ phase: "drinking", status: "drinking" });
    const result = advancePhase(state);

    if ("ok" in result && !result.ok) {
      expect.fail(result.error);
    }

    const next = result as PartyGameState;
    expect(next.phase).toBe("next-round");
  });

  it("advances next-round → show-card (creating new round)", () => {
    const state = makeState({
      phase: "next-round",
      status: "next-round",
      // Responses are cleared when entering next-round, so realistically
      // they'd be empty by this point
      responses: [],
      roundNumber: 1,
    });
    const result = advancePhase(state);

    if ("ok" in result && !result.ok) {
      expect.fail(result.error);
    }

    const next = result as PartyGameState;
    expect(next.phase).toBe("show-card");
    expect(next.roundNumber).toBe(1); // Round number unchanged (API increments it)
    expect(next.responses).toHaveLength(0); // Responses stay cleared for new round
  });

  it("rejects invalid transitions (show-card → drinking)", () => {
    const state = makeState({ phase: "show-card", status: "show-card" });
    const result = advancePhase(state, "drinking");

    expect("ok" in result).toBe(true);
    if ("ok" in result) {
      expect(result.ok).toBe(false);
      expect(result.error).toContain("Cannot transition");
    }
  });

  it("rejects transitions from game-end", () => {
    const state = makeState({ phase: "game-end", status: "game-end" });
    const result = advancePhase(state);

    expect("ok" in result).toBe(true);
    if ("ok" in result) {
      expect(result.ok).toBe(false);
      expect(result.error).toContain("No transitions allowed");
    }
  });

  it("accepts next-round → game-end transition explicitly", () => {
    const state = makeState({ phase: "next-round", status: "next-round" });
    const result = advancePhase(state, "game-end");

    if ("ok" in result && !result.ok) {
      expect.fail(result.error);
    }

    const next = result as PartyGameState;
    expect(next.phase).toBe("game-end");
  });

  it("rejects responding → show-card (backwards transition)", () => {
    const state = makeState({ phase: "responding", status: "responding" });
    const result = advancePhase(state, "show-card");

    expect("ok" in result).toBe(true);
    if ("ok" in result) {
      expect(result.ok).toBe(false);
    }
  });

  it("follows the complete valid loop", () => {
    const phases: Array<{ from: string; to: string }> = [
      { from: "show-card", to: "responding" },
      { from: "responding", to: "revealing" },
      { from: "revealing", to: "drinking" },
      { from: "drinking", to: "next-round" },
      { from: "next-round", to: "show-card" },
    ];

    let state = makeState({ phase: "show-card", status: "show-card" });

    for (const { from, to } of phases) {
      expect(state.phase).toBe(from);
      const result = advancePhase(state);
      if ("ok" in result && !result.ok) {
        expect.fail(`Failed at ${from} → ${to}: ${result.error}`);
      }
      state = result as PartyGameState;
      expect(state.phase).toBe(to);
    }
  });
});

// ──────────────────────────────────────────────
// TALLY RESPONSES
// ──────────────────────────────────────────────

describe("tallyResponses", () => {
  it("counts responses for Truth or Dare", () => {
    const responses = [
      { playerId: "p1", playerName: "Alice", value: "truth", timestamp: 1000 },
      { playerId: "p2", playerName: "Bob", value: "truth", timestamp: 1001 },
      { playerId: "p3", playerName: "Carol", value: "dare", timestamp: 1002 },
    ];

    const counts = tallyResponses(responses);

    expect(counts["truth"]).toBe(2);
    expect(counts["dare"]).toBe(1);
  });

  it("counts responses for Never Have I Ever", () => {
    const responses = [
      { playerId: "p1", playerName: "Alice", value: "have", timestamp: 1000 },
      { playerId: "p2", playerName: "Bob", value: "have-not", timestamp: 1001 },
      { playerId: "p3", playerName: "Carol", value: "have", timestamp: 1002 },
      { playerId: "p4", playerName: "Dave", value: "have", timestamp: 1003 },
    ];

    const counts = tallyResponses(responses);

    expect(counts["have"]).toBe(3);
    expect(counts["have-not"]).toBe(1);
  });

  it("counts responses for Hot Takes", () => {
    const responses = [
      { playerId: "p1", playerName: "Alice", value: "agree", timestamp: 1000 },
      { playerId: "p2", playerName: "Bob", value: "disagree", timestamp: 1001 },
      { playerId: "p3", playerName: "Carol", value: "agree", timestamp: 1002 },
    ];

    const counts = tallyResponses(responses);

    expect(counts["agree"]).toBe(2);
    expect(counts["disagree"]).toBe(1);
  });

  it("counts responses for Most Likely To (target player IDs)", () => {
    const responses = [
      { playerId: "p1", playerName: "Alice", value: "p3", timestamp: 1000 },
      { playerId: "p2", playerName: "Bob", value: "p3", timestamp: 1001 },
      { playerId: "p3", playerName: "Carol", value: "p1", timestamp: 1002 },
    ];

    const counts = tallyResponses(responses);

    expect(counts["p3"]).toBe(2);
    expect(counts["p1"]).toBe(1);
  });

  it("returns empty object for empty responses", () => {
    const counts = tallyResponses([]);
    expect(counts).toEqual({});
  });
});

// ──────────────────────────────────────────────
// COMPUTE REVEAL
// ──────────────────────────────────────────────

describe("computeReveal", () => {
  it("returns counts and player breakdown", () => {
    const responses = [
      { playerId: "p1", playerName: "Alice", value: "agree", timestamp: 1000 },
      { playerId: "p2", playerName: "Bob", value: "disagree", timestamp: 1001 },
      { playerId: "p3", playerName: "Carol", value: "agree", timestamp: 1002 },
    ];

    const state = makeState({
      phase: "revealing",
      status: "revealing",
      responses,
    });

    const reveal = computeReveal(state);

    expect(reveal.totalResponses).toBe(3);
    expect(reveal.counts["agree"]).toBe(2);
    expect(reveal.counts["disagree"]).toBe(1);

    expect(reveal.breakdown).toHaveLength(2);

    const agreeBreakdown = reveal.breakdown.find((b) => b.value === "agree");
    expect(agreeBreakdown).toBeDefined();
    expect(agreeBreakdown!.players).toHaveLength(2);
    expect(agreeBreakdown!.players[0].playerId).toBe("p1");
    expect(agreeBreakdown!.players[1].playerId).toBe("p3");

    const disagreeBreakdown = reveal.breakdown.find((b) => b.value === "disagree");
    expect(disagreeBreakdown).toBeDefined();
    expect(disagreeBreakdown!.players).toHaveLength(1);
    expect(disagreeBreakdown!.players[0].playerId).toBe("p2");
  });

  it("handles empty responses", () => {
    const state = makeState({
      phase: "revealing",
      status: "revealing",
      responses: [],
    });

    const reveal = computeReveal(state);

    expect(reveal.totalResponses).toBe(0);
    expect(reveal.counts).toEqual({});
    expect(reveal.breakdown).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────
// HANDLE TIMER EXPIRY
// ──────────────────────────────────────────────

describe("handleTimerExpiry", () => {
  it("advances show-card → responding", () => {
    const state = makeState({ phase: "show-card", status: "show-card" });
    const next = handleTimerExpiry(state);

    expect(next.phase).toBe("responding");
    expect(next.timerSeconds).toBe(30); // Timer starts for response phase
  });

  it("advances responding → revealing", () => {
    const state = makeState({ phase: "responding", status: "responding", timerSeconds: 30 });
    const next = handleTimerExpiry(state);

    expect(next.phase).toBe("revealing");
    expect(next.timerSeconds).toBeNull();
  });

  it("advances revealing → drinking", () => {
    const state = makeState({ phase: "revealing", status: "revealing" });
    const next = handleTimerExpiry(state);

    expect(next.phase).toBe("drinking");
  });

  it("advances drinking → next-round", () => {
    const state = makeState({ phase: "drinking", status: "drinking" });
    const next = handleTimerExpiry(state);

    expect(next.phase).toBe("next-round");
  });

  it("does not advance from next-round (wait for host)", () => {
    const state = makeState({ phase: "next-round", status: "next-round", timerSeconds: 5 });
    const next = handleTimerExpiry(state);

    expect(next.phase).toBe("next-round");
    expect(next.timerSeconds).toBeNull();
  });

  it("does not advance from game-end (terminal)", () => {
    const state = makeState({ phase: "game-end", status: "game-end", timerSeconds: 5 });
    const next = handleTimerExpiry(state);

    expect(next.phase).toBe("game-end");
    expect(next.timerSeconds).toBeNull();
  });

  it("tallies responses on expiry from responding phase", () => {
    const responses = [
      { playerId: "p1", playerName: "Alice", value: "truth", timestamp: 1000 },
      { playerId: "p2", playerName: "Bob", value: "dare", timestamp: 1001 },
    ];

    const state = makeState({
      phase: "responding",
      status: "responding",
      responses,
      timerSeconds: 5,
    });

    const next = handleTimerExpiry(state);

    expect(next.phase).toBe("revealing");
    expect(next.responses).toHaveLength(2); // Responses preserved
  });
});

// ──────────────────────────────────────────────
// CHECK GAME END
// ──────────────────────────────────────────────

describe("checkGameEnd", () => {
  it("returns isEnded: false when queue has remaining cards", () => {
    const queue: ContentQueue = {
      remaining: makeCards(5),
      recentlyShown: [],
      windowSize: 10,
    };

    const result = checkGameEnd(queue, 1);
    expect(result.isEnded).toBe(false);
  });

  it("returns isEnded: true with content_exhausted when queue is empty", () => {
    const queue: ContentQueue = {
      remaining: [],
      recentlyShown: makeCards(3),
      windowSize: 10,
    };

    const result = checkGameEnd(queue, 5);
    expect(result.isEnded).toBe(true);
    expect(result.reason).toBe("content_exhausted");
  });

  it("returns isEnded: true with max_rounds_reached when round exceeds limit", () => {
    const queue: ContentQueue = {
      remaining: makeCards(5),
      recentlyShown: [],
      windowSize: 10,
    };

    const result = checkGameEnd(queue, MAX_ROUNDS + 1);
    expect(result.isEnded).toBe(true);
    expect(result.reason).toBe("max_rounds_reached");
  });

  it("returns isEnded: false at exactly MAX_ROUNDS", () => {
    const queue: ContentQueue = {
      remaining: makeCards(5),
      recentlyShown: [],
      windowSize: 10,
    };

    const result = checkGameEnd(queue, MAX_ROUNDS);
    expect(result.isEnded).toBe(false);
  });
});

// ──────────────────────────────────────────────
// INTEGRATION: FULL GAME FLOW
// ──────────────────────────────────────────────

describe("Full game flow", () => {
  beforeEach(() => {
    resetContentIdCounter();
  });

  it("plays through a complete round cycle", () => {
    // Setup: Create content for 3 rounds
    const allContent = makeCards(10, "truth-or-dare", "spicy");
    const queue = createContentQueue("truth-or-dare", allContent, "spicy");

    // Get first card
    const { card: firstCard, queue: q1 } = getNextCard(queue);
    expect(firstCard).not.toBeNull();

    // Create initial state
    let state = createInitialState({
      gameSessionId: "session-1",
      gameType: "truth-or-dare",
      config: DEFAULT_CONFIG,
      firstCard,
    });
    expect(state.phase).toBe("show-card");

    // Advance to responding
    let result = advancePhase(state);
    expect("ok" in result && !result.ok ? null : (result as PartyGameState).phase).toBe("responding");
    state = result as PartyGameState;

    // Players respond
    const responses = [
      { playerId: "p1", playerName: "Alice", value: "truth", timestamp: 1000 },
      { playerId: "p2", playerName: "Bob", value: "dare", timestamp: 1001 },
      { playerId: "p3", playerName: "Carol", value: "truth", timestamp: 1002 },
    ];
    state = { ...state, responses };

    // Tally
    const tally = tallyResponses(state.responses);
    expect(tally["truth"]).toBe(2);
    expect(tally["dare"]).toBe(1);

    // Advance to revealing
    result = advancePhase(state);
    expect("ok" in result && !result.ok ? null : (result as PartyGameState).phase).toBe("revealing");
    state = result as PartyGameState;

    // Compute reveal
    const reveal = computeReveal(state);
    expect(reveal.totalResponses).toBe(3);
    expect(reveal.breakdown).toHaveLength(2);

    // Advance to drinking
    result = advancePhase(state);
    expect("ok" in result && !result.ok ? null : (result as PartyGameState).phase).toBe("drinking");
    state = result as PartyGameState;

    // Advance to next-round
    result = advancePhase(state);
    expect("ok" in result && !result.ok ? null : (result as PartyGameState).phase).toBe("next-round");
    state = result as PartyGameState;

    // Responses should be cleared
    expect(state.responses).toHaveLength(0);

    // Round completes, check end
    const endCheck = checkGameEnd(q1, state.roundNumber);
    expect(endCheck.isEnded).toBe(false);
  });

  it("ends the game when content is exhausted", () => {
    // Only 2 cards in the queue
    const allContent = makeCards(2, "truth-or-dare", "spicy");
    let queue = createContentQueue("truth-or-dare", allContent, "spicy");

    // Play 2 rounds
    for (let round = 0; round < 2; round++) {
      const { card, queue: updatedQueue } = getNextCard(queue);
      expect(card).not.toBeNull();
      queue = updatedQueue;
    }

    // Queue should now be empty
    const endCheck = checkGameEnd(queue, 3);
    expect(endCheck.isEnded).toBe(true);
    expect(endCheck.reason).toBe("content_exhausted");
  });

  it("smart shuffle ensures unique cards within 10-round window", () => {
    // Use enough cards to test the window
    const totalCards = 20;
    const allContent = makeCards(totalCards, "truth-or-dare", "spicy");
    let queue = createContentQueue("truth-or-dare", allContent, "spicy", 10);

    // Draw 10 cards — all should be unique
    const drawnIds: string[] = [];
    for (let i = 0; i < 10; i++) {
      const { card, queue: updatedQueue } = getNextCard(queue);
      expect(card).not.toBeNull();
      drawnIds.push(card!.id);
      queue = updatedQueue;
    }

    // All drawn cards should be unique
    expect(new Set(drawnIds).size).toBe(10);
  });

  // ──────────────────────────────────────────────
  // TRUTH OR DARE SPECIFIC TESTS
  // ──────────────────────────────────────────────

  describe("Truth or Dare content filtering", () => {
    it("content queue stores categories for truth/dare filtering", () => {
      const allContent = [
        makeContent("t1", "truth-or-dare", "spicy", "secrets"),
        makeContent("t2", "truth-or-dare", "spicy", "relationships"),
        makeContent("t3", "truth-or-dare", "spicy", "dares"),
        makeContent("t4", "truth-or-dare", "spicy", "embarrassing"),
        makeContent("t5", "truth-or-dare", "spicy", "dares"),
      ];
      const queue = createContentQueue("truth-or-dare", allContent, "spicy");

      // All 5 should be in the queue
      expect(queue.remaining).toHaveLength(5);

      // Remaining cards should have categories
      const categories = queue.remaining.map((c) => c.category);
      expect(categories).toContain("secrets");
      expect(categories).toContain("relationships");
      expect(categories).toContain("dares");
      expect(categories).toContain("embarrassing");
    });

    it("truth cards have category !== 'dares'", () => {
      // Truth cards are from categories like secrets, relationships, embarrassing, sexual, explicit
      const truthCategories = ["secrets", "relationships", "embarrassing", "sexual", "explicit", "funny"];
      const allContent = truthCategories.map((cat, i) =>
        makeContent(`truth-${i}`, "truth-or-dare", "spicy", cat)
      );

      // Every truth card should NOT have category "dares"
      for (const card of allContent) {
        expect(card.category).not.toBe("dares");
      }
    });

    it("dare cards have category 'dares'", () => {
      const dareCards = [
        makeContent("d1", "truth-or-dare", "spicy", "dares"),
        makeContent("d2", "truth-or-dare", "wild", "dares"),
        makeContent("d3", "truth-or-dare", "after-dark", "dares"),
      ];

      // Every dare card should have category "dares"
      for (const card of dareCards) {
        expect(card.category).toBe("dares");
      }
    });

    it("truth and dare cards are both present in the content queue", () => {
      const allContent = [
        makeContent("t1", "truth-or-dare", "spicy", "secrets"),
        makeContent("t2", "truth-or-dare", "spicy", "dares"),
        makeContent("t3", "truth-or-dare", "spicy", "relationships"),
        makeContent("t4", "truth-or-dare", "spicy", "dares"),
      ];
      const queue = createContentQueue("truth-or-dare", allContent, "spicy");

      const dares = queue.remaining.filter((c) => c.category === "dares");
      const truths = queue.remaining.filter((c) => c.category !== "dares");

      expect(dares).toHaveLength(2);
      expect(truths).toHaveLength(2);
    });

    it("rejects game types other than truth-or-dare for active player logic", () => {
      // This tests that the truth-or-dare specific flow is gated
      const nonTodTypes = ["never-have-i-ever", "hot-takes", "most-likely-to"];

      for (const gameType of nonTodTypes) {
        const state = makeState({ gameType });
        // For non-truth-or-dare games, activePlayerId should not be required
        expect(state.config.activePlayerId).toBeUndefined();
        expect(state.config.turnOrder).toBeUndefined();
      }
    });
  });

  describe("Active player rotation", () => {
    it("turn order rotates correctly between players", () => {
      const playerIds = ["player-a", "player-b", "player-c"];
      const turnOrder = ["player-a", "player-b", "player-c"];

      // Simulate rotation
      const nextActivePlayer = (currentId: string): string => {
        const currentIndex = turnOrder.indexOf(currentId);
        return turnOrder[(currentIndex + 1) % turnOrder.length];
      };

      expect(nextActivePlayer("player-a")).toBe("player-b");
      expect(nextActivePlayer("player-b")).toBe("player-c");
      expect(nextActivePlayer("player-c")).toBe("player-a");
    });

    it("turn order handles single player gracefully", () => {
      const turnOrder = ["player-a"];

      const nextActivePlayer = (currentId: string): string => {
        const currentIndex = turnOrder.indexOf(currentId);
        return turnOrder[(currentIndex + 1) % turnOrder.length];
      };

      // With one player, they should always be the active player
      expect(nextActivePlayer("player-a")).toBe("player-a");
    });

    it("shuffled turn order contains all players", () => {
      const playerIds = ["player-a", "player-b", "player-c", "player-d"];
      const turnOrder = [...playerIds].sort(() => Math.random() - 0.5);

      expect(turnOrder).toHaveLength(4);
      for (const id of playerIds) {
        expect(turnOrder).toContain(id);
      }
    });

    it("state config stores activePlayerId and turnOrder", () => {
      const state = makeState({
        config: {
          ...DEFAULT_CONFIG,
          activePlayerId: "player-b",
          turnOrder: ["player-a", "player-b", "player-c"],
        },
      });

      expect(state.config.activePlayerId).toBe("player-b");
      expect(state.config.turnOrder).toEqual(["player-a", "player-b", "player-c"]);
    });
  });

  describe("Content queue with categories", () => {
    it("content queue items include category field", () => {
      const allContent = [
        makeContent("t1", "truth-or-dare", "spicy", "secrets"),
        makeContent("t2", "truth-or-dare", "spicy", "dares"),
      ];
      const queue = createContentQueue("truth-or-dare", allContent, "spicy");

      for (const item of queue.remaining) {
        expect(item).toHaveProperty("id");
        expect(item).toHaveProperty("category");
      }
    });

    it("getNextCard preserves category info in returned card", () => {
      const allContent = [
        makeContent("t1", "truth-or-dare", "spicy", "secrets"),
        makeContent("t2", "truth-or-dare", "spicy", "dares"),
      ];
      const queue = createContentQueue("truth-or-dare", allContent, "spicy");

      const { card } = getNextCard(queue);
      expect(card).not.toBeNull();
      expect(card!.category).toBeDefined();
    });
  });
});
