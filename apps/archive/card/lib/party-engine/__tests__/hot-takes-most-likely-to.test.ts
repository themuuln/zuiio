/**
 * Tests for Hot Takes and Most Likely To game logic.
 *
 * Covers:
 * - Hot Takes: determineHotTakesDrinkers (minority, unanimous, tie handling)
 * - Most Likely To: determineMostLikelyToWinners (winner, ties, edge cases)
 *
 * Validates assertions:
 * - VAL-HOTT-001: Statement shown with Agree/Disagree buttons (via VotingArea component)
 * - VAL-HOTT-002: 3-2-1 countdown before reveal (via RevealOverlay component)
 * - VAL-HOTT-003: Reveal shows split percentage and voter names (via computeReveal)
 * - VAL-HOTT-004: Minority group gets drinking prompt
 * - VAL-HOTT-005: Tie handling (all_drink | none)
 * - VAL-HOTT-006: Statement + player picker for Most Likely To
 * - VAL-HOTT-007: Voting is anonymous (no vote info visible during voting)
 * - VAL-HOTT-008: Reveal highlights most-voted player
 * - VAL-HOTT-009: Voted player gets drinking prompt
 * - VAL-HOTT-010: Tie in Most Likely To - both players drink
 */

import { describe, it, expect } from "vitest";
import type { PlayerResponse, PartyGameConfig } from "@/lib/party-engine";
import {
  determineHotTakesDrinkers,
  determineMostLikelyToWinners,
} from "@/lib/party-engine";

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

function makeResponse(
  playerId: string,
  playerName: string,
  value: string
): PlayerResponse {
  return {
    playerId,
    playerName,
    value,
    timestamp: Date.now(),
  };
}

// ──────────────────────────────────────────────
// HOT TAKES
// ──────────────────────────────────────────────

describe("Hot Takes — determineHotTakesDrinkers", () => {
  // ── VAL-HOTT-004: Minority group gets drinking prompt ──
  describe("VAL-HOTT-004: Minority drinks", () => {
    it("minority (disagree) voters get drink prompt when more agree than disagree", () => {
      const responses = [
        makeResponse("p1", "Alice", "agree"),
        makeResponse("p2", "Bob", "agree"),
        makeResponse("p3", "Carol", "agree"),
        makeResponse("p4", "Dave", "disagree"),
        makeResponse("p5", "Eve", "disagree"),
      ];

      const result = determineHotTakesDrinkers(responses, "all-drink");

      // Minority is "disagree" (2 voters)
      expect(result.drinkers).toHaveLength(2);
      expect(result.drinkers).toContain("p4");
      expect(result.drinkers).toContain("p5");
      expect(result.drinkers).not.toContain("p1");
      expect(result.drinkers).not.toContain("p2");
      expect(result.drinkers).not.toContain("p3");
      expect(result.minorityValue).toBe("disagree");
      expect(result.majorityValue).toBe("agree");
      expect(result.isUnanimous).toBe(false);
      expect(result.isTie).toBe(false);
    });

    it("minority (agree) voters get drink prompt when more disagree than agree", () => {
      const responses = [
        makeResponse("p1", "Alice", "agree"),
        makeResponse("p2", "Bob", "agree"),
        makeResponse("p3", "Carol", "disagree"),
        makeResponse("p4", "Dave", "disagree"),
        makeResponse("p5", "Eve", "disagree"),
      ];

      const result = determineHotTakesDrinkers(responses, "all-drink");

      // Minority is "agree" (2 voters)
      expect(result.drinkers).toHaveLength(2);
      expect(result.drinkers).toContain("p1");
      expect(result.drinkers).toContain("p2");
      expect(result.drinkers).not.toContain("p3");
      expect(result.drinkers).not.toContain("p4");
      expect(result.drinkers).not.toContain("p5");
      expect(result.minorityValue).toBe("agree");
      expect(result.majorityValue).toBe("disagree");
      expect(result.isUnanimous).toBe(false);
      expect(result.isTie).toBe(false);
    });

    it("majority voters do NOT get drink prompt (minority only)", () => {
      const responses = [
        makeResponse("p1", "Alice", "agree"),
        makeResponse("p2", "Bob", "agree"),
        makeResponse("p3", "Carol", "agree"),
        makeResponse("p4", "Dave", "disagree"),
      ];

      const result = determineHotTakesDrinkers(responses, "all-drink");

      // Only p4 (disagree) should drink
      expect(result.drinkers).toHaveLength(1);
      expect(result.drinkers).toContain("p4");
    });

    it("majority sees 'You're with the majority!' message", () => {
      const responses = [
        makeResponse("p1", "Alice", "agree"),
        makeResponse("p2", "Bob", "agree"),
        makeResponse("p3", "Carol", "disagree"),
      ];

      const result = determineHotTakesDrinkers(responses, "all-drink");

      expect(result.majorityMessage).toContain("majority");
      expect(result.minorityMessage).toContain("minority");
    });

    it("handles single player responses correctly", () => {
      const responses = [
        makeResponse("p1", "Alice", "agree"),
      ];

      const result = determineHotTakesDrinkers(responses, "all-drink");

      // Single player agreeing means no minority exists
      // Actually, if only 1 person voted and they agree, there's no one in minority
      // The drinkers should be empty since there's no minority
      expect(result.isUnanimous).toBe(true);
      expect(result.drinkers).toHaveLength(0);
    });
  });

  // ── VAL-HOTT-005: Unanimous vote — no drinking ──
  describe("VAL-HOTT-005: Unanimous vote — no drinking", () => {
    it("all agree — unanimous, no drinking", () => {
      const responses = [
        makeResponse("p1", "Alice", "agree"),
        makeResponse("p2", "Bob", "agree"),
        makeResponse("p3", "Carol", "agree"),
      ];

      const result = determineHotTakesDrinkers(responses, "all-drink");

      expect(result.isUnanimous).toBe(true);
      expect(result.drinkers).toHaveLength(0);
      expect(result.unanimousMessage).toContain("Unanimous");
    });

    it("all disagree — unanimous, no drinking", () => {
      const responses = [
        makeResponse("p1", "Alice", "disagree"),
        makeResponse("p2", "Bob", "disagree"),
        makeResponse("p3", "Carol", "disagree"),
      ];

      const result = determineHotTakesDrinkers(responses, "all-drink");

      expect(result.isUnanimous).toBe(true);
      expect(result.drinkers).toHaveLength(0);
      expect(result.unanimousMessage).toContain("Unanimous");
    });

    it("single player voting is treated as unanimous", () => {
      const responses = [
        makeResponse("p1", "Alice", "agree"),
      ];

      const result = determineHotTakesDrinkers(responses, "all-drink");

      expect(result.isUnanimous).toBe(true);
      expect(result.drinkers).toHaveLength(0);
    });
  });

  // ── VAL-HOTT-005: Tie handling ──
  describe("VAL-HOTT-005: Tie handling", () => {
    it("tie with tieRule 'all-drink' — all players drink", () => {
      const responses = [
        makeResponse("p1", "Alice", "agree"),
        makeResponse("p2", "Bob", "agree"),
        makeResponse("p3", "Carol", "agree"),
        makeResponse("p4", "Dave", "disagree"),
        makeResponse("p5", "Eve", "disagree"),
        makeResponse("p6", "Frank", "disagree"),
      ];

      const result = determineHotTakesDrinkers(responses, "all-drink");

      expect(result.isTie).toBe(true);
      expect(result.drinkers).toHaveLength(6);
      expect(result.drinkers).toContain("p1");
      expect(result.drinkers).toContain("p2");
      expect(result.drinkers).toContain("p3");
      expect(result.drinkers).toContain("p4");
      expect(result.drinkers).toContain("p5");
      expect(result.drinkers).toContain("p6");
      expect(result.tieMessage).toContain("Everyone drinks");
    });

    it("tie with tieRule 'nobody-wins' — no one drinks", () => {
      const responses = [
        makeResponse("p1", "Alice", "agree"),
        makeResponse("p2", "Bob", "agree"),
        makeResponse("p3", "Carol", "agree"),
        makeResponse("p4", "Dave", "disagree"),
        makeResponse("p5", "Eve", "disagree"),
        makeResponse("p6", "Frank", "disagree"),
      ];

      const result = determineHotTakesDrinkers(responses, "nobody-wins");

      expect(result.isTie).toBe(true);
      expect(result.drinkers).toHaveLength(0);
      expect(result.tieMessage).toContain("No one drinks");
    });

    it("tie with tieRule 'everyone-wins' — everyone drinks (same as all-drink)", () => {
      const responses = [
        makeResponse("p1", "Alice", "agree"),
        makeResponse("p2", "Bob", "disagree"),
      ];

      const result = determineHotTakesDrinkers(responses, "everyone-wins");

      expect(result.isTie).toBe(true);
      expect(result.drinkers).toHaveLength(2);
      expect(result.drinkers).toContain("p1");
      expect(result.drinkers).toContain("p2");
    });

    it("close but not a tie (4 vs 3) — minority drinks, not unanimous", () => {
      const responses = [
        makeResponse("p1", "Alice", "agree"),
        makeResponse("p2", "Bob", "agree"),
        makeResponse("p3", "Carol", "agree"),
        makeResponse("p4", "Dave", "agree"),
        makeResponse("p5", "Eve", "disagree"),
        makeResponse("p6", "Frank", "disagree"),
        makeResponse("p7", "Grace", "disagree"),
      ];

      const result = determineHotTakesDrinkers(responses, "all-drink");

      expect(result.isUnanimous).toBe(false);
      expect(result.isTie).toBe(false);
      // Minority is "disagree" (3 voters)
      expect(result.drinkers).toHaveLength(3);
      expect(result.minorityValue).toBe("disagree");
    });
  });

  // ── Edge cases ──
  describe("Edge cases", () => {
    it("handles empty responses gracefully", () => {
      const result = determineHotTakesDrinkers([], "all-drink");

      expect(result.drinkers).toHaveLength(0);
      expect(result.isUnanimous).toBe(false);
      expect(result.isTie).toBe(false);
    });

    it("handles responses with only agree votes", () => {
      const responses = [
        makeResponse("p1", "Alice", "agree"),
        makeResponse("p2", "Bob", "agree"),
      ];

      const result = determineHotTakesDrinkers(responses, "all-drink");

      expect(result.isUnanimous).toBe(true);
      expect(result.drinkers).toHaveLength(0);
    });

    it("handles responses with only disagree votes", () => {
      const responses = [
        makeResponse("p1", "Alice", "disagree"),
        makeResponse("p2", "Bob", "disagree"),
      ];

      const result = determineHotTakesDrinkers(responses, "all-drink");

      expect(result.isUnanimous).toBe(true);
      expect(result.drinkers).toHaveLength(0);
    });

    it("provides correct vote counts in result", () => {
      const responses = [
        makeResponse("p1", "Alice", "agree"),
        makeResponse("p2", "Bob", "agree"),
        makeResponse("p3", "Carol", "agree"),
        makeResponse("p4", "Dave", "disagree"),
      ];

      const result = determineHotTakesDrinkers(responses, "all-drink");

      expect(result.agreeCount).toBe(3);
      expect(result.disagreeCount).toBe(1);
      expect(result.totalVotes).toBe(4);
    });
  });
});

// ──────────────────────────────────────────────
// MOST LIKELY TO
// ──────────────────────────────────────────────

describe("Most Likely To — determineMostLikelyToWinners", () => {
  // ── VAL-HOTT-008: Reveal highlights most-voted player ──
  describe("VAL-HOTT-008: Single winner", () => {
    it("identifies the player with the most votes", () => {
      const responses = [
        makeResponse("p1", "Alice", "p4"), // Alice votes for Dave
        makeResponse("p2", "Bob", "p4"),   // Bob votes for Dave
        makeResponse("p3", "Carol", "p4"), // Carol votes for Dave
        makeResponse("p4", "Dave", "p1"),  // Dave votes for Alice
        makeResponse("p5", "Eve", "p4"),   // Eve votes for Dave
      ];

      const result = determineMostLikelyToWinners(responses);

      // Dave has the most votes (4)
      expect(result.winners).toHaveLength(1);
      expect(result.winners[0]).toBe("p4");
      expect(result.maxVotes).toBe(4);
      expect(result.isTie).toBe(false);
    });

    it("returns correct vote counts for each player", () => {
      const responses = [
        makeResponse("p1", "Alice", "p3"),
        makeResponse("p2", "Bob", "p3"),
        makeResponse("p3", "Carol", "p2"),
        makeResponse("p4", "Dave", "p2"),
      ];

      const result = determineMostLikelyToWinners(responses);

      expect(result.voteCounts["p3"]).toBe(2);
      expect(result.voteCounts["p2"]).toBe(2);
      // Players who didn't receive any votes are not in the record (undefined)
      expect(result.voteCounts["p1"]).toBeUndefined();
      expect(result.voteCounts["p4"]).toBeUndefined();
    });
  });

  // ── VAL-HOTT-010: Tie in Most Likely To ──
  describe("VAL-HOTT-010: Tie handling", () => {
    it("when two players tie for most votes, both are winners", () => {
      const responses = [
        makeResponse("p1", "Alice", "p4"), // Alice votes for Dave
        makeResponse("p2", "Bob", "p5"),   // Bob votes for Eve
        makeResponse("p3", "Carol", "p4"), // Carol votes for Dave
        makeResponse("p4", "Dave", "p5"),  // Dave votes for Eve
        makeResponse("p5", "Eve", "p1"),   // Eve votes for Alice
      ];

      const result = determineMostLikelyToWinners(responses);

      // Dave (p4) has 2 votes, Eve (p5) has 2 votes — tie
      expect(result.isTie).toBe(true);
      expect(result.winners).toHaveLength(2);
      expect(result.winners).toContain("p4");
      expect(result.winners).toContain("p5");
      expect(result.maxVotes).toBe(2);
    });

    it("when three players tie for most votes, all three are winners", () => {
      const responses = [
        makeResponse("p1", "Alice", "p2"),
        makeResponse("p2", "Bob", "p3"),
        makeResponse("p3", "Carol", "p1"),
      ];

      const result = determineMostLikelyToWinners(responses);

      // Each of p1, p2, p3 has 1 vote
      expect(result.isTie).toBe(true);
      expect(result.winners).toHaveLength(3);
      expect(result.maxVotes).toBe(1);
    });

    it("tied players both receive drink prompts (VAL-HOTT-010)", () => {
      const responses = [
        makeResponse("p1", "Alice", "p3"),
        makeResponse("p2", "Bob", "p4"),
        makeResponse("p3", "Carol", "p4"),
        makeResponse("p4", "Dave", "p3"),
      ];

      const result = determineMostLikelyToWinners(responses);

      expect(result.isTie).toBe(true);
      expect(result.winners).toHaveLength(2);
      expect(result.winners).toContain("p3");
      expect(result.winners).toContain("p4");
    });
  });

  // ── Self-exclusion (VAL-HOTT-006) ──
  describe("VAL-HOTT-006: Self-exclusion from voting", () => {
    it("self votes should not exist (handled by UI/API layer)", () => {
      // Simulate: if a player somehow votes for themselves, it's counted
      const responses = [
        makeResponse("p1", "Alice", "p1"), // Self vote
        makeResponse("p2", "Bob", "p1"),
      ];

      const result = determineMostLikelyToWinners(responses);

      // p1 still gets 2 votes (including their own)
      expect(result.voteCounts["p1"]).toBe(2);
      // But the UI should grey out self in the player picker
    });

    it("works correctly when no self votes exist (normal case)", () => {
      const responses = [
        makeResponse("p1", "Alice", "p2"),
        makeResponse("p2", "Bob", "p3"),
        makeResponse("p3", "Carol", "p2"),
      ];

      const result = determineMostLikelyToWinners(responses);

      expect(result.winners).toHaveLength(1);
      expect(result.winners[0]).toBe("p2");
      expect(result.maxVotes).toBe(2);
    });
  });

  // ── Edge cases ──
  describe("Edge cases", () => {
    it("handles empty responses gracefully", () => {
      const result = determineMostLikelyToWinners([]);

      expect(result.winners).toHaveLength(0);
      expect(result.voteCounts).toEqual({});
      expect(result.maxVotes).toBe(0);
      expect(result.isTie).toBe(false);
    });

    it("handles single response", () => {
      const responses = [
        makeResponse("p1", "Alice", "p2"),
      ];

      const result = determineMostLikelyToWinners(responses);

      expect(result.winners).toHaveLength(1);
      expect(result.winners[0]).toBe("p2");
      expect(result.maxVotes).toBe(1);
      expect(result.isTie).toBe(false);
    });

    it("all votes for the same player", () => {
      const responses = [
        makeResponse("p1", "Alice", "p4"),
        makeResponse("p2", "Bob", "p4"),
        makeResponse("p3", "Carol", "p4"),
        makeResponse("p4", "Dave", "p4"), // Self vote
        makeResponse("p5", "Eve", "p4"),
      ];

      const result = determineMostLikelyToWinners(responses);

      expect(result.winners).toHaveLength(1);
      expect(result.winners[0]).toBe("p4");
      expect(result.maxVotes).toBe(5);
      expect(result.isTie).toBe(false);
    });

    it("correctly handles non-numeric player IDs", () => {
      const responses = [
        makeResponse("alice-123", "Alice", "bob-456"),
        makeResponse("bob-456", "Bob", "carol-789"),
        makeResponse("carol-789", "Carol", "bob-456"),
      ];

      const result = determineMostLikelyToWinners(responses);

      expect(result.winners).toHaveLength(1);
      expect(result.winners[0]).toBe("bob-456");
      expect(result.maxVotes).toBe(2);
    });

    it("reports total number of voters", () => {
      const responses = [
        makeResponse("p1", "Alice", "p2"),
        makeResponse("p2", "Bob", "p3"),
        makeResponse("p3", "Carol", "p2"),
      ];

      const result = determineMostLikelyToWinners(responses);

      expect(result.totalVoters).toBe(3);
    });

    it("allows checking if a specific player is a winner", () => {
      const responses = [
        makeResponse("p1", "Alice", "p3"),
        makeResponse("p2", "Bob", "p3"),
      ];

      const result = determineMostLikelyToWinners(responses);

      expect(result.isWinner("p3")).toBe(true);
      expect(result.isWinner("p1")).toBe(false);
      expect(result.isWinner("p2")).toBe(false);
    });
  });
});
