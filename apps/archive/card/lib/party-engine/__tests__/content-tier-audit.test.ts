/**
 * Content Tier Audit Tests
 *
 * Verifies that game content has proper tier diversity:
 *   - Tier distribution matches expected counts (spicy: ~200, wild: ~150, after-dark: ~100)
 *   - Each content entry belongs to exactly one tier (no overlap)
 *   - createContentQueue returns different card sets for different tiers
 *   - VAL-TOD-005: All content is reachable with after-dark tier
 *
 * These tests validate that the CONTENT_POOL has proper tier assignments
 * so that vibe tier filtering produces meaningful results.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  CONTENT_POOL,
  getContentByTier,
  getContentForGameAndTier,
  resetContentIdCounter,
} from "@/lib/content";
import { createContentQueue } from "@/lib/party-engine";

// ──────────────────────────────────────────────
// PREAMBLE INFORMATION
// ──────────────────────────────────────────────

// Expected tier distribution (approximate):
//   spicy:      ~200  (actual: 216)
//   wild:       ~150  (actual: 140)
//   after-dark: ~100  (actual:  95)
//   total:      451
//
// These tests use the actual CONTENT_POOL data so any future changes
// to the content pool will cause test failures, alerting the developer
// to update tier assignments accordingly.

// ──────────────────────────────────────────────
// CONTENT POOL TIER DISTRIBUTION
// ──────────────────────────────────────────────

describe("CONTENT_POOL tier distribution", () => {
  it("has 451 total entries", () => {
    expect(CONTENT_POOL).toHaveLength(451);
  });

  it("has ~200 spicy entries (within 15% tolerance)", () => {
    const spicy = getContentByTier("spicy");
    expect(spicy.length).toBeGreaterThanOrEqual(180);
    expect(spicy.length).toBeLessThanOrEqual(250);
    // Exact expected: 216
  });

  it("has ~150 wild entries (within 15% tolerance)", () => {
    const wild = getContentByTier("wild");
    expect(wild.length).toBeGreaterThanOrEqual(120);
    expect(wild.length).toBeLessThanOrEqual(170);
    // Exact expected: 140
  });

  it("has ~100 after-dark entries (within 15% tolerance)", () => {
    const afterDark = getContentByTier("after-dark");
    expect(afterDark.length).toBeGreaterThanOrEqual(80);
    expect(afterDark.length).toBeLessThanOrEqual(115);
    // Exact expected: 95
  });

  it("has all three tiers present in the pool", () => {
    const tiers = new Set(CONTENT_POOL.map((e) => e.tier));
    expect(tiers.has("spicy")).toBe(true);
    expect(tiers.has("wild")).toBe(true);
    expect(tiers.has("after-dark")).toBe(true);
  });

  it("has unique IDs across all entries", () => {
    const ids = CONTENT_POOL.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ──────────────────────────────────────────────
// TIER UNIQUENESS (no overlap between tiers)
// ──────────────────────────────────────────────

describe("Tier uniqueness (no overlap)", () => {
  it("spicy and wild tiers have no overlapping entries", () => {
    const spicyIds = new Set(getContentByTier("spicy").map((e) => e.id));
    const wildIds = new Set(getContentByTier("wild").map((e) => e.id));

    const overlap = [...spicyIds].filter((id) => wildIds.has(id));
    expect(overlap).toHaveLength(0);
  });

  it("spicy and after-dark tiers have no overlapping entries", () => {
    const spicyIds = new Set(getContentByTier("spicy").map((e) => e.id));
    const afterDarkIds = new Set(getContentByTier("after-dark").map((e) => e.id));

    const overlap = [...spicyIds].filter((id) => afterDarkIds.has(id));
    expect(overlap).toHaveLength(0);
  });

  it("wild and after-dark tiers have no overlapping entries", () => {
    const wildIds = new Set(getContentByTier("wild").map((e) => e.id));
    const afterDarkIds = new Set(getContentByTier("after-dark").map((e) => e.id));

    const overlap = [...wildIds].filter((id) => afterDarkIds.has(id));
    expect(overlap).toHaveLength(0);
  });

  it("each entry belongs to exactly one tier", () => {
    const tierCount = CONTENT_POOL.length;
    const spicyCount = getContentByTier("spicy").length;
    const wildCount = getContentByTier("wild").length;
    const afterDarkCount = getContentByTier("after-dark").length;

    // Sum of per-tier counts should equal total (no overlap)
    expect(spicyCount + wildCount + afterDarkCount).toBe(tierCount);
  });
});

// ──────────────────────────────────────────────
// createContentQueue TIER FILTERING
// ──────────────────────────────────────────────

describe("createContentQueue tier filtering with CONTENT_POOL", () => {
  beforeEach(() => {
    resetContentIdCounter();
  });

  it("spicy tier returns only spicy cards", () => {
    const queue = createContentQueue("truth-or-dare", CONTENT_POOL, "spicy");

    expect(queue.remaining.length).toBeGreaterThan(0);
    for (const card of queue.remaining) {
      expect(card.tier).toBe("spicy");
    }
  });

  it("wild tier returns spicy and wild cards (no after-dark)", () => {
    const queue = createContentQueue("truth-or-dare", CONTENT_POOL, "wild");

    expect(queue.remaining.length).toBeGreaterThan(0);
    for (const card of queue.remaining) {
      expect(["spicy", "wild"]).toContain(card.tier);
    }
    // Verify we have BOTH spicy and wild cards
    const tiers = new Set(queue.remaining.map((c) => c.tier));
    expect(tiers.has("spicy")).toBe(true);
    expect(tiers.has("wild")).toBe(true);
    expect(tiers.has("after-dark")).toBe(false);
  });

  it("after-dark tier returns all tiers (spicy + wild + after-dark)", () => {
    const queue = createContentQueue("truth-or-dare", CONTENT_POOL, "after-dark");

    expect(queue.remaining.length).toBeGreaterThan(0);
    // Verify we have ALL three tiers
    const tiers = new Set(queue.remaining.map((c) => c.tier));
    expect(tiers.has("spicy")).toBe(true);
    expect(tiers.has("wild")).toBe(true);
    expect(tiers.has("after-dark")).toBe(true);
  });

  it("spicy and wild tiers return DIFFERENT card sets", () => {
    const spicyQueue = createContentQueue("truth-or-dare", CONTENT_POOL, "spicy");
    const wildQueue = createContentQueue("truth-or-dare", CONTENT_POOL, "wild");

    // Wild should have more cards than spicy (spicy + wild)
    expect(wildQueue.remaining.length).toBeGreaterThan(spicyQueue.remaining.length);
  });

  it("wild and after-dark tiers return DIFFERENT card sets", () => {
    const wildQueue = createContentQueue("truth-or-dare", CONTENT_POOL, "wild");
    const afterDarkQueue = createContentQueue("truth-or-dare", CONTENT_POOL, "after-dark");

    // After-dark should have more cards than wild (all tiers)
    expect(afterDarkQueue.remaining.length).toBeGreaterThan(wildQueue.remaining.length);
  });

  it("spicy and after-dark tiers return DIFFERENT card sets", () => {
    const spicyQueue = createContentQueue("truth-or-dare", CONTENT_POOL, "spicy");
    const afterDarkQueue = createContentQueue("truth-or-dare", CONTENT_POOL, "after-dark");

    // After-dark should have more cards than spicy (all tiers vs only spicy)
    expect(afterDarkQueue.remaining.length).toBeGreaterThan(spicyQueue.remaining.length);
  });

  it("returns meaningful card counts for each tier (not just 1-2 cards)", () => {
    // Each tier should return a significant number of cards for truth-or-dare
    const spicyCount = createContentQueue("truth-or-dare", CONTENT_POOL, "spicy").remaining.length;
    const wildCount = createContentQueue("truth-or-dare", CONTENT_POOL, "wild").remaining.length;
    const afterDarkCount = createContentQueue("truth-or-dare", CONTENT_POOL, "after-dark").remaining.length;

    expect(spicyCount).toBeGreaterThanOrEqual(50);  // ~70 spicy TOD
    expect(wildCount).toBeGreaterThanOrEqual(100);   // ~130 spicy + wild TOD
    expect(afterDarkCount).toBeGreaterThanOrEqual(150); // ~190 all tiers TOD
  });
});

// ──────────────────────────────────────────────
// VAL-TOD-005: ALL CONTENT REACHABLE IN AFTER-DARK
// ──────────────────────────────────────────────

describe("VAL-TOD-005: All content reachable in after-dark tier", () => {
  beforeEach(() => {
    resetContentIdCounter();
  });

  it("with after-dark tier, all Truth or Dare content is reachable", () => {
    // With after-dark, the content queue should include ALL truth-or-dare entries
    const allTodContent = CONTENT_POOL.filter(
      (c) => c.gameType === "truth-or-dare"
    );
    const queue = createContentQueue("truth-or-dare", CONTENT_POOL, "after-dark");

    // All TOD content should be in the queue
    expect(queue.remaining.length).toBe(allTodContent.length);
  });

  it("no Truth or Dare card is filtered out due to tier rules with after-dark", () => {
    const allTodIds = new Set(
      CONTENT_POOL.filter((c) => c.gameType === "truth-or-dare").map((c) => c.id)
    );
    const queueIds = new Set(
      createContentQueue("truth-or-dare", CONTENT_POOL, "after-dark").remaining.map(
        (c) => c.id
      )
    );

    // Every TOD card should be present in the after-dark queue
    for (const id of allTodIds) {
      expect(queueIds.has(id)).toBe(true);
    }
  });

  it("all game types have content in multiple tiers", () => {
    // Each game type should have entries in at least 2 different tiers
    const gameTypes = [...new Set(CONTENT_POOL.map((c) => c.gameType))];

    for (const gameType of gameTypes) {
      const tiers = new Set(
        CONTENT_POOL.filter((c) => c.gameType === gameType).map((c) => c.tier)
      );
      expect(tiers.size).toBeGreaterThanOrEqual(2);
    }
  });
});

// ──────────────────────────────────────────────
// GAME TYPE TIER DISTRIBUTION
// ──────────────────────────────────────────────

describe("Game type tier distribution", () => {
  it("truth-or-dare has all three tiers", () => {
    const tiers = new Set(
      getContentForGameAndTier("truth-or-dare", "spicy").length > 0 ? ["spicy"] : []
    );
    if (getContentForGameAndTier("truth-or-dare", "wild").length > 0) tiers.add("wild");
    if (getContentForGameAndTier("truth-or-dare", "after-dark").length > 0) tiers.add("after-dark");

    expect(getContentForGameAndTier("truth-or-dare", "spicy").length).toBeGreaterThan(0);
    expect(getContentForGameAndTier("truth-or-dare", "wild").length).toBeGreaterThan(0);
    expect(getContentForGameAndTier("truth-or-dare", "after-dark").length).toBeGreaterThan(0);
  });

  it("never-have-i-ever has all three tiers", () => {
    expect(getContentForGameAndTier("never-have-i-ever", "spicy").length).toBeGreaterThan(0);
    expect(getContentForGameAndTier("never-have-i-ever", "wild").length).toBeGreaterThan(0);
    expect(getContentForGameAndTier("never-have-i-ever", "after-dark").length).toBeGreaterThan(0);
  });

  it("hot-takes has spicy and wild (no after-dark)", () => {
    expect(getContentForGameAndTier("hot-takes", "spicy").length).toBeGreaterThan(0);
    expect(getContentForGameAndTier("hot-takes", "wild").length).toBeGreaterThan(0);
    expect(getContentForGameAndTier("hot-takes", "after-dark").length).toBe(0);
  });

  it("most-likely-to has spicy and wild (no after-dark)", () => {
    expect(getContentForGameAndTier("most-likely-to", "spicy").length).toBeGreaterThan(0);
    expect(getContentForGameAndTier("most-likely-to", "wild").length).toBeGreaterThan(0);
    expect(getContentForGameAndTier("most-likely-to", "after-dark").length).toBe(0);
  });

  it("would-you-rather has all three tiers", () => {
    expect(getContentForGameAndTier("would-you-rather", "spicy").length).toBeGreaterThan(0);
    expect(getContentForGameAndTier("would-you-rather", "wild").length).toBeGreaterThan(0);
    expect(getContentForGameAndTier("would-you-rather", "after-dark").length).toBeGreaterThan(0);
  });
});
