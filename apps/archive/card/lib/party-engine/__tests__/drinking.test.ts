/**
 * Tests for the Party Game Drinking Engine.
 *
 * Covers all functions in drinking.ts:
 * - createDrinkingState (initial state creation)
 * - applyDrinkAction (sip, shot, assign, waterfall, group-shot)
 * - getDrinkCount (cumulative sips, shots, total)
 * - checkDrinkLimit (maxDrinksPerRound enforcement)
 * - recordPass (pass option)
 * - resetRoundDrinks (per-round reset)
 *
 * Asserts VAL-DRINK-001 through VAL-DRINK-009.
 */

import { describe, it, expect, beforeEach } from "vitest";
import type { DrinkAction } from "@/lib/constants";
import type { DrinkRecord } from "@/lib/party-engine";
import {
  createDrinkingState,
  applyDrinkAction,
  getDrinkCount,
  checkDrinkLimit,
  recordPass,
  resetRoundDrinks,
} from "@/lib/party-engine/drinking";
import type { DrinkConfig, DrinkingState } from "@/lib/party-engine/drinking";

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

const DEFAULT_CONFIG: DrinkConfig = {
  maxDrinksPerRound: 3,
  drinkingEnabled: true,
};

const DRY_CONFIG: DrinkConfig = {
  maxDrinksPerRound: 3,
  drinkingEnabled: false,
};

const UNLIMITED_CONFIG: DrinkConfig = {
  maxDrinksPerRound: 0, // 0 means unlimited
  drinkingEnabled: true,
};

// Helper to get the last record of a specific type for a player
function getRecord(
  state: DrinkingState,
  playerId: string
): DrinkRecord | undefined {
  return [...state.cumulativeRecords]
    .reverse()
    .find((r) => r.playerId === playerId);
}

// ──────────────────────────────────────────────
// CREATE DRINKING STATE
// ──────────────────────────────────────────────

describe("createDrinkingState", () => {
  it("creates an empty drinking state for round 1", () => {
    const state = createDrinkingState(1);

    expect(state.roundNumber).toBe(1);
    expect(state.roundRecords).toHaveLength(0);
    expect(state.cumulativeRecords).toHaveLength(0);
    expect(state.penaltyPoints).toEqual({});
    expect(state.passes).toHaveLength(0);
  });

  it("creates an empty drinking state for a later round", () => {
    const state = createDrinkingState(5);

    expect(state.roundNumber).toBe(5);
    expect(state.roundRecords).toHaveLength(0);
    expect(state.cumulativeRecords).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────
// APPLY DRINK ACTION
// ──────────────────────────────────────────────

describe("applyDrinkAction", () => {
  let state: DrinkingState;

  beforeEach(() => {
    state = createDrinkingState(1);
  });

  // VAL-DRINK-001: Sip action records and displays correctly
  describe("VAL-DRINK-001: Sip action", () => {
    it("records a sip for the player", () => {
      const result = applyDrinkAction(state, DEFAULT_CONFIG, "sip", "player-1");

      expect(result.success).toBe(true);
      expect(result.record).toBeDefined();
      expect(result.record!.action).toBe("sip");
      expect(result.record!.playerId).toBe("player-1");
      expect(result.record!.roundNumber).toBe(1);
      expect(result.record!.timestamp).toBeGreaterThan(0);
      expect(result.record!.targetPlayerId).toBeUndefined();
    });

    it("adds the record to both roundRecords and cumulativeRecords", () => {
      const result = applyDrinkAction(state, DEFAULT_CONFIG, "sip", "player-1");

      expect(result.state.roundRecords).toHaveLength(1);
      expect(result.state.cumulativeRecords).toHaveLength(1);
      expect(result.state.roundRecords[0].action).toBe("sip");
      expect(result.state.cumulativeRecords[0].action).toBe("sip");
    });
  });

  // VAL-DRINK-002: Shot action records correctly
  describe("VAL-DRINK-002: Shot action", () => {
    it("records a shot for the player", () => {
      const result = applyDrinkAction(state, DEFAULT_CONFIG, "shot", "player-1");

      expect(result.success).toBe(true);
      expect(result.record).toBeDefined();
      expect(result.record!.action).toBe("shot");
      expect(result.record!.playerId).toBe("player-1");
      expect(result.record!.roundNumber).toBe(1);
    });

    it("shot records are separate from sip records", () => {
      let s = applyDrinkAction(state, DEFAULT_CONFIG, "sip", "player-1").state;
      s = applyDrinkAction(s, DEFAULT_CONFIG, "shot", "player-1").state;

      const sipRecords = s.cumulativeRecords.filter((r) => r.action === "sip");
      const shotRecords = s.cumulativeRecords.filter((r) => r.action === "shot");

      expect(sipRecords).toHaveLength(1);
      expect(shotRecords).toHaveLength(1);
    });
  });

  // VAL-DRINK-003: Assign action allows targeting another player
  describe("VAL-DRINK-003: Assign action", () => {
    it("records an assign action with a target player", () => {
      const result = applyDrinkAction(
        state,
        DEFAULT_CONFIG,
        "assign",
        "player-1",
        "player-2"
      );

      expect(result.success).toBe(true);
      expect(result.record).toBeDefined();
      expect(result.record!.action).toBe("assign");
      expect(result.record!.playerId).toBe("player-1");
      expect(result.record!.targetPlayerId).toBe("player-2");
    });

    it("routes the drink record to the targeted player", () => {
      const result = applyDrinkAction(
        state,
        DEFAULT_CONFIG,
        "assign",
        "player-1",
        "player-2"
      );

      // The record's playerId is the assigner, but the drink
      // should be counted for the target in terms of limits
      expect(result.record!.playerId).toBe("player-1");
      expect(result.record!.targetPlayerId).toBe("player-2");
    });

    it("rejects assign without a targetPlayerId", () => {
      const result = applyDrinkAction(
        state,
        DEFAULT_CONFIG,
        "assign",
        "player-1"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("targetPlayerId");
    });
  });

  // VAL-DRINK-004: Waterfall flow works across all players
  describe("VAL-DRINK-004: Waterfall action", () => {
    it("records a waterfall for the initiating player", () => {
      const result = applyDrinkAction(
        state,
        DEFAULT_CONFIG,
        "waterfall",
        "player-1"
      );

      expect(result.success).toBe(true);
      expect(result.record).toBeDefined();
      expect(result.record!.action).toBe("waterfall");
      expect(result.record!.playerId).toBe("player-1");
    });
  });

  // VAL-DRINK-005: Group-shot prompts all players to take a shot
  describe("VAL-DRINK-005: Group-shot action", () => {
    it("records a group-shot for the initiating player", () => {
      const result = applyDrinkAction(
        state,
        DEFAULT_CONFIG,
        "group-shot",
        "player-1"
      );

      expect(result.success).toBe(true);
      expect(result.record).toBeDefined();
      expect(result.record!.action).toBe("group-shot");
      expect(result.record!.playerId).toBe("player-1");
    });
  });

  // VAL-DRINK-006: Configurable max drinks per round enforced
  describe("VAL-DRINK-006: Max drinks per round enforced", () => {
    it("allows drinks up to the limit", () => {
      let s = state;

      // Record 3 sips (maxDrinksPerRound = 3)
      for (let i = 0; i < 3; i++) {
        const result = applyDrinkAction(s, DEFAULT_CONFIG, "sip", "player-1");
        expect(result.success).toBe(true);
        s = result.state;
      }

      expect(s.roundRecords).toHaveLength(3);
    });

    it("rejects drinks beyond the limit", () => {
      let s = state;

      // Record 3 sips
      for (let i = 0; i < 3; i++) {
        s = applyDrinkAction(s, DEFAULT_CONFIG, "sip", "player-1").state;
      }

      // 4th sip should be rejected
      const result = applyDrinkAction(s, DEFAULT_CONFIG, "sip", "player-1");

      expect(result.success).toBe(false);
      expect(result.limitReached).toBe(true);
      expect(result.error).toContain("limit");
      expect(s.cumulativeRecords).toHaveLength(3);
    });

    it("enforces limit across all action types", () => {
      let s = state;

      // Mix different action types up to the limit
      s = applyDrinkAction(s, DEFAULT_CONFIG, "sip", "player-1").state;
      s = applyDrinkAction(s, DEFAULT_CONFIG, "shot", "player-1").state;
      s = applyDrinkAction(s, DEFAULT_CONFIG, "waterfall", "player-1").state;

      // 4th action (different type) should be rejected
      const result = applyDrinkAction(s, DEFAULT_CONFIG, "group-shot", "player-1");
      expect(result.success).toBe(false);
      expect(result.limitReached).toBe(true);
    });

    it("enforces limit per player independently", () => {
      let s = state;

      // Player 1 reaches limit
      for (let i = 0; i < 3; i++) {
        s = applyDrinkAction(s, DEFAULT_CONFIG, "sip", "player-1").state;
      }

      // Player 2 should still be able to drink
      const result = applyDrinkAction(s, DEFAULT_CONFIG, "sip", "player-2");
      expect(result.success).toBe(true);

      // Verify counts — use result.state for updated player-2 count
      expect(getDrinkCount(s, "player-1").total).toBe(3);
      expect(getDrinkCount(result.state, "player-2").total).toBe(1);
    });

    it("maxDrinksPerRound = 0 means unlimited", () => {
      let s = state;

      // Record 10 sips with unlimited config
      for (let i = 0; i < 10; i++) {
        const result = applyDrinkAction(s, UNLIMITED_CONFIG, "sip", "player-1");
        expect(result.success).toBe(true);
        s = result.state;
      }

      expect(s.roundRecords).toHaveLength(10);
      expect(s.cumulativeRecords).toHaveLength(10);
    });
  });

  // VAL-DRINK-009: Penalty points replace drinks in dry mode
  describe("VAL-DRINK-009: Dry mode (penalty points)", () => {
    it("records penalty points instead of drinks when drinking is disabled", () => {
      const result = applyDrinkAction(state, DRY_CONFIG, "sip", "player-1");

      expect(result.success).toBe(true);
      expect(result.record).toBeUndefined();
      expect(result.state.penaltyPoints["player-1"]).toBe(1);
      expect(result.state.roundRecords).toHaveLength(0);
      expect(result.state.cumulativeRecords).toHaveLength(0);
    });

    it("increments penalty points for each skipped drink action", () => {
      let s = state;

      s = applyDrinkAction(s, DRY_CONFIG, "sip", "player-1").state;
      s = applyDrinkAction(s, DRY_CONFIG, "shot", "player-1").state;
      s = applyDrinkAction(s, DRY_CONFIG, "waterfall", "player-1").state;

      expect(s.penaltyPoints["player-1"]).toBe(3);
    });

    it("enforces maxDrinksPerRound in dry mode using penalty count", () => {
      let s = state;

      s = applyDrinkAction(s, DRY_CONFIG, "sip", "player-1").state;
      s = applyDrinkAction(s, DRY_CONFIG, "shot", "player-1").state;
      s = applyDrinkAction(s, DRY_CONFIG, "waterfall", "player-1").state;

      // 4th penalty should be rejected (maxDrinksPerRound = 3)
      const result = applyDrinkAction(s, DRY_CONFIG, "group-shot", "player-1");
      expect(result.success).toBe(false);
      expect(result.limitReached).toBe(true);
      expect(s.penaltyPoints["player-1"]).toBe(3);
    });

    it("tracks penalty points per player independently", () => {
      let s = state;

      s = applyDrinkAction(s, DRY_CONFIG, "sip", "player-1").state;
      s = applyDrinkAction(s, DRY_CONFIG, "sip", "player-1").state;
      s = applyDrinkAction(s, DRY_CONFIG, "sip", "player-2").state;

      expect(s.penaltyPoints["player-1"]).toBe(2);
      expect(s.penaltyPoints["player-2"]).toBe(1);
    });
  });

  describe("Timestamp generation", () => {
    it("generates a timestamp on each action", () => {
      const result = applyDrinkAction(state, DEFAULT_CONFIG, "sip", "player-1");

      expect(result.record!.timestamp).toBeGreaterThan(0);
      expect(result.record!.timestamp).toBeLessThanOrEqual(Date.now());
    });
  });
});

// ──────────────────────────────────────────────
// GET DRINK COUNT
// ──────────────────────────────────────────────

// VAL-DRINK-008: Honor-system drink counter is accurate
describe("getDrinkCount", () => {
  it("returns zeros for a player with no drinks", () => {
    const state = createDrinkingState(1);
    const count = getDrinkCount(state, "player-1");

    expect(count.sips).toBe(0);
    expect(count.shots).toBe(0);
    expect(count.total).toBe(0);
  });

  it("counts sips correctly", () => {
    let state = createDrinkingState(1);

    state = applyDrinkAction(state, DEFAULT_CONFIG, "sip", "player-1").state;
    state = applyDrinkAction(state, DEFAULT_CONFIG, "sip", "player-1").state;

    const count = getDrinkCount(state, "player-1");
    expect(count.sips).toBe(2);
    expect(count.shots).toBe(0);
    expect(count.total).toBe(2);
  });

  it("counts shots correctly", () => {
    let state = createDrinkingState(1);

    state = applyDrinkAction(state, DEFAULT_CONFIG, "shot", "player-1").state;
    state = applyDrinkAction(state, DEFAULT_CONFIG, "shot", "player-1").state;

    const count = getDrinkCount(state, "player-1");
    expect(count.sips).toBe(0);
    expect(count.shots).toBe(2);
    expect(count.total).toBe(2);
  });

  it("counts total including all action types", () => {
    let state = createDrinkingState(1);

    // Use unlimited config to avoid hitting the per-round limit (4 actions)
    state = applyDrinkAction(state, UNLIMITED_CONFIG, "sip", "player-1").state;
    state = applyDrinkAction(state, UNLIMITED_CONFIG, "shot", "player-1").state;
    state = applyDrinkAction(state, UNLIMITED_CONFIG, "waterfall", "player-1").state;
    state = applyDrinkAction(state, UNLIMITED_CONFIG, "group-shot", "player-1").state;

    const count = getDrinkCount(state, "player-1");
    expect(count.sips).toBe(1);
    expect(count.shots).toBe(1);
    expect(count.total).toBe(4); // All actions count toward total
  });

  it("only counts the requested player", () => {
    let state = createDrinkingState(1);

    state = applyDrinkAction(state, DEFAULT_CONFIG, "sip", "player-1").state;
    state = applyDrinkAction(state, DEFAULT_CONFIG, "sip", "player-2").state;
    state = applyDrinkAction(state, DEFAULT_CONFIG, "sip", "player-1").state;

    const count1 = getDrinkCount(state, "player-1");
    const count2 = getDrinkCount(state, "player-2");

    expect(count1.total).toBe(2);
    expect(count2.total).toBe(1);
  });

  it("includes assign actions in total count", () => {
    let state = createDrinkingState(1);

    state = applyDrinkAction(state, DEFAULT_CONFIG, "assign", "player-1", "player-2").state;

    const count = getDrinkCount(state, "player-1");
    expect(count.total).toBe(1);
  });

  // VAL-DRINK-008: Cumulative tracking across rounds
  it("accurately tracks cumulative drinks across multiple rounds", () => {
    let state = createDrinkingState(1);

    // Round 1: Player A takes 1 sip
    state = applyDrinkAction(state, DEFAULT_CONFIG, "sip", "player-1").state;

    // Round 2: Reset round and record 2 sips
    state = resetRoundDrinks(state, 2);
    state = applyDrinkAction(state, DEFAULT_CONFIG, "sip", "player-1").state;
    state = applyDrinkAction(state, DEFAULT_CONFIG, "sip", "player-1").state;

    // Round 3: Player A skips (no drinks)

    // Round 4: 1 shot
    state = resetRoundDrinks(state, 4);
    state = applyDrinkAction(state, DEFAULT_CONFIG, "shot", "player-1").state;

    // Round 5: 1 sip
    state = resetRoundDrinks(state, 5);
    state = applyDrinkAction(state, DEFAULT_CONFIG, "sip", "player-1").state;

    // Expected: sips = 4, shots = 1, total = 5
    const count = getDrinkCount(state, "player-1");
    expect(count.sips).toBe(4);
    expect(count.shots).toBe(1);
    expect(count.total).toBe(5);
  });
});

// ──────────────────────────────────────────────
// CHECK DRINK LIMIT
// ──────────────────────────────────────────────

describe("checkDrinkLimit", () => {
  it("returns allowed=true when under the limit", () => {
    const state = createDrinkingState(1);
    const limit = checkDrinkLimit(state, DEFAULT_CONFIG, "player-1");

    expect(limit.allowed).toBe(true);
    expect(limit.current).toBe(0);
    expect(limit.max).toBe(3);
  });

  it("returns allowed=true when at 2 of 3", () => {
    let state = createDrinkingState(1);

    state = applyDrinkAction(state, DEFAULT_CONFIG, "sip", "player-1").state;
    state = applyDrinkAction(state, DEFAULT_CONFIG, "sip", "player-1").state;

    const limit = checkDrinkLimit(state, DEFAULT_CONFIG, "player-1");
    expect(limit.allowed).toBe(true);
    expect(limit.current).toBe(2);
    expect(limit.max).toBe(3);
  });

  it("returns allowed=false at the limit", () => {
    let state = createDrinkingState(1);

    for (let i = 0; i < 3; i++) {
      state = applyDrinkAction(state, DEFAULT_CONFIG, "sip", "player-1").state;
    }

    const limit = checkDrinkLimit(state, DEFAULT_CONFIG, "player-1");
    expect(limit.allowed).toBe(false);
    expect(limit.current).toBe(3);
    expect(limit.max).toBe(3);
  });

  it("returns allowed=true for maxDrinksPerRound = 0 (unlimited)", () => {
    const state = createDrinkingState(1);
    const limit = checkDrinkLimit(state, UNLIMITED_CONFIG, "player-1");

    expect(limit.allowed).toBe(true);
    expect(limit.max).toBe(0);
  });
});

// ──────────────────────────────────────────────
// RECORD PASS
// ──────────────────────────────────────────────

// VAL-DRINK-007: Always ok to pass
describe("recordPass", () => {
  it("records a pass for the player", () => {
    const state = createDrinkingState(1);
    const result = recordPass(state, "player-1");

    expect(result.passes).toContain("player-1");
    expect(result.roundRecords).toHaveLength(0);
    expect(result.cumulativeRecords).toHaveLength(0);
  });

  it("does not count passes toward drink totals", () => {
    let state = createDrinkingState(1);

    state = recordPass(state, "player-1");
    state = recordPass(state, "player-1");

    const count = getDrinkCount(state, "player-1");
    expect(count.total).toBe(0);
    expect(count.sips).toBe(0);
    expect(count.shots).toBe(0);
  });

  it("does not affect limit checking", () => {
    let state = createDrinkingState(1);

    state = recordPass(state, "player-1");
    state = recordPass(state, "player-1");

    const limit = checkDrinkLimit(state, DEFAULT_CONFIG, "player-1");
    expect(limit.allowed).toBe(true);
    expect(limit.current).toBe(0);
  });

  it("does not create drink records or penalty points", () => {
    const state = createDrinkingState(1);
    const result = recordPass(state, "player-1");

    expect(result.roundRecords).toHaveLength(0);
    expect(result.cumulativeRecords).toHaveLength(0);
    expect(Object.keys(result.penaltyPoints)).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────
// RESET ROUND DRINKS
// ──────────────────────────────────────────────

describe("resetRoundDrinks", () => {
  it("clears round records but preserves cumulative records", () => {
    let state = createDrinkingState(1);

    state = applyDrinkAction(state, DEFAULT_CONFIG, "sip", "player-1").state;
    state = applyDrinkAction(state, DEFAULT_CONFIG, "shot", "player-1").state;

    expect(state.roundRecords).toHaveLength(2);
    expect(state.cumulativeRecords).toHaveLength(2);

    state = resetRoundDrinks(state, 2);

    expect(state.roundRecords).toHaveLength(0);
    expect(state.cumulativeRecords).toHaveLength(2);
    expect(state.roundNumber).toBe(2);
  });

  it("preserves penalty points across rounds", () => {
    let state = createDrinkingState(1);
    state = applyDrinkAction(state, DRY_CONFIG, "sip", "player-1").state;

    expect(state.penaltyPoints["player-1"]).toBe(1);

    state = resetRoundDrinks(state, 2);

    expect(state.penaltyPoints["player-1"]).toBe(1);
    expect(state.roundNumber).toBe(2);
  });

  it("clears passes for the new round", () => {
    let state = createDrinkingState(1);
    state = recordPass(state, "player-1");

    expect(state.passes).toHaveLength(1);

    state = resetRoundDrinks(state, 2);

    expect(state.passes).toHaveLength(0);
  });

  it("advances the round number", () => {
    let state = createDrinkingState(1);
    state = resetRoundDrinks(state, 2);

    expect(state.roundNumber).toBe(2);
  });
});
