import { describe, it, expect } from "vitest";
import type { ContentTier, GameContentEntry } from "@/lib/content";
import {
  type GamePhase,
  type PartyGameConfig,
  type PlayerResponse,
  type DrinkRecord,
  type PartyGameState,
  type TieRule,
  DEFAULT_PARTY_GAME_CONFIG,
} from "@/lib/party-engine";

describe("PartyGameConfig", () => {
  it("has all required fields", () => {
    const config: PartyGameConfig = {
      vibeTier: "spicy",
      drinkingEnabled: true,
      maxDrinksPerRound: 3,
      passPenalty: 1,
      timerSeconds: 30,
      tieRule: "all-drink",
      allowSelfVote: false,
    };

    expect(config.vibeTier).toBe("spicy");
    expect(config.drinkingEnabled).toBe(true);
    expect(config.maxDrinksPerRound).toBe(3);
    expect(config.passPenalty).toBe(1);
    expect(config.timerSeconds).toBe(30);
    expect(config.tieRule).toBe("all-drink");
    expect(config.allowSelfVote).toBe(false);
  });

  it("supports all vibe tiers", () => {
    const tiers: ContentTier[] = ["spicy", "wild", "after-dark"];
    for (const tier of tiers) {
      const config: PartyGameConfig = {
        vibeTier: tier,
        drinkingEnabled: true,
        maxDrinksPerRound: 3,
        passPenalty: 1,
        timerSeconds: 30,
        tieRule: "all-drink",
        allowSelfVote: false,
      };
      expect(config.vibeTier).toBe(tier);
    }
  });

  it("supports all tie rules", () => {
    const tieRules: TieRule[] = [
      "all-drink",
      "vote-off",
      "everyone-wins",
      "nobody-wins",
    ];
    for (const rule of tieRules) {
      const config: PartyGameConfig = {
        vibeTier: "spicy",
        drinkingEnabled: true,
        maxDrinksPerRound: 3,
        passPenalty: 1,
        timerSeconds: 30,
        tieRule: rule,
        allowSelfVote: false,
      };
      expect(config.tieRule).toBe(rule);
    }
  });

  it("DEFAULT_PARTY_GAME_CONFIG has correct defaults", () => {
    expect(DEFAULT_PARTY_GAME_CONFIG.vibeTier).toBe("spicy");
    expect(DEFAULT_PARTY_GAME_CONFIG.drinkingEnabled).toBe(true);
    expect(DEFAULT_PARTY_GAME_CONFIG.maxDrinksPerRound).toBe(3);
    expect(DEFAULT_PARTY_GAME_CONFIG.passPenalty).toBe(1);
    expect(DEFAULT_PARTY_GAME_CONFIG.timerSeconds).toBe(30);
    expect(DEFAULT_PARTY_GAME_CONFIG.tieRule).toBe("all-drink");
    expect(DEFAULT_PARTY_GAME_CONFIG.allowSelfVote).toBe(false);
  });
});

describe("GamePhase", () => {
  it("supports all party game phases in correct loop order", () => {
    const phases: GamePhase[] = [
      "show-card",
      "responding",
      "revealing",
      "drinking",
      "next-round",
      "game-end",
    ];
    expect(phases).toHaveLength(6);
  });

  it("drinkingEnabled false disables drink features", () => {
    const config: PartyGameConfig = {
      vibeTier: "spicy",
      drinkingEnabled: false,
      maxDrinksPerRound: 0,
      passPenalty: 0,
      timerSeconds: 30,
      tieRule: "nobody-wins",
      allowSelfVote: true,
    };
    expect(config.drinkingEnabled).toBe(false);
    expect(config.maxDrinksPerRound).toBe(0);
  });
});

describe("PlayerResponse", () => {
  it("accepts string values", () => {
    const response: PlayerResponse = {
      playerId: "p1",
      playerName: "Alice",
      value: "I'd rather skydive!",
      timestamp: 1700000000000,
    };
    expect(response.playerId).toBe("p1");
    expect(response.playerName).toBe("Alice");
    expect(response.value).toBe("I'd rather skydive!");
  });

  it("accepts numeric values", () => {
    const response: PlayerResponse = {
      playerId: "p2",
      playerName: "Bob",
      value: 42,
      timestamp: 1700000001000,
    };
    expect(typeof response.value).toBe("number");
  });

  it("accepts boolean values", () => {
    const response: PlayerResponse = {
      playerId: "p3",
      playerName: "Carol",
      value: true,
      timestamp: 1700000002000,
    };
    expect(response.value).toBe(true);
  });
});

describe("DrinkRecord", () => {
  it("supports sip action", () => {
    const record: DrinkRecord = {
      playerId: "p1",
      action: "sip",
      roundNumber: 1,
      timestamp: 1700000000000,
    };
    expect(record.action).toBe("sip");
  });

  it("supports assign action with target", () => {
    const record: DrinkRecord = {
      playerId: "p2",
      action: "assign",
      roundNumber: 2,
      timestamp: 1700000001000,
      targetPlayerId: "p1",
    };
    expect(record.action).toBe("assign");
    expect(record.targetPlayerId).toBe("p1");
  });

  it("supports all drink actions", () => {
    const actions: DrinkRecord["action"][] = [
      "sip",
      "shot",
      "assign",
      "waterfall",
      "group-shot",
    ];
    for (const action of actions) {
      const record: DrinkRecord = {
        playerId: "p1",
        action,
        roundNumber: 1,
        timestamp: 1700000000000,
      };
      expect(record.action).toBe(action);
    }
  });
});

describe("PartyGameState", () => {
  it("holds a complete game session state", () => {
    const state: PartyGameState = {
      gameSessionId: "session-1",
      gameType: "truth-or-dare",
      status: "responding",
      currentCard: null,
      roundNumber: 1,
      responses: [],
      phase: "responding",
      timerSeconds: 30,
      config: DEFAULT_PARTY_GAME_CONFIG,
    };
    expect(state.gameSessionId).toBe("session-1");
    expect(state.gameType).toBe("truth-or-dare");
    expect(state.status).toBe("responding");
    expect(state.phase).toBe(state.status);
    expect(state.responses).toHaveLength(0);
  });

  it("works with a current card", () => {
    const card: GameContentEntry = {
      id: "card-1",
      gameType: "truth-or-dare",
      category: "secrets",
      tier: "spicy",
      text: "What is your biggest guilty pleasure?",
    };
    const state: PartyGameState = {
      gameSessionId: "session-1",
      gameType: "truth-or-dare",
      status: "show-card",
      currentCard: card,
      roundNumber: 1,
      responses: [],
      phase: "show-card",
      timerSeconds: null,
      config: DEFAULT_PARTY_GAME_CONFIG,
    };
    expect(state.currentCard).toBeDefined();
    expect(state.currentCard!.text).toBe("What is your biggest guilty pleasure?");
    expect(state.currentCard!.tier).toBe("spicy");
  });

  it("supports all game phases", () => {
    const phases: GamePhase[] = [
      "show-card",
      "responding",
      "revealing",
      "drinking",
      "next-round",
      "game-end",
    ];

    for (const phase of phases) {
      const state: PartyGameState = {
        gameSessionId: "session-1",
        gameType: "truth-or-dare",
        status: phase,
        currentCard: null,
        roundNumber: 1,
        responses: [],
        phase,
        timerSeconds: null,
        config: DEFAULT_PARTY_GAME_CONFIG,
      };
      expect(state.status).toBe(phase);
    }
  });
});

describe("ContentTier", () => {
  it("matches the ContentTier from lib/content", () => {
    // ContentTier is re-exported from types; verify it works the same
    const tier: ContentTier = "spicy";
    expect(tier).toBe("spicy");

    const wild: ContentTier = "wild";
    expect(wild).toBe("wild");

    const dark: ContentTier = "after-dark";
    expect(dark).toBe("after-dark");
  });
});

// Need to import DrinkAction type for the test helper
type DrinkActionForTest = "sip" | "shot" | "assign" | "waterfall" | "group-shot";
