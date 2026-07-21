import { describe, it, expect } from "vitest";
import {
  AVAILABLE_GAMES,
  getGamesForPlayerCount,
  findMutualMatch,
  findMostVotedGame,
  getGameById,
  GAME_PICKER_TIMEOUT_SECONDS,
} from "@/lib/games";

describe("AVAILABLE_GAMES", () => {
  it("has at least UNO", () => {
    expect(AVAILABLE_GAMES.length).toBeGreaterThanOrEqual(1);
  });

  it("UNO is defined correctly", () => {
    const uno = AVAILABLE_GAMES.find((g) => g.id === "uno");
    expect(uno).toBeDefined();
    expect(uno!.name).toBe("UNO");
    expect(uno!.emoji).toBe("🃏");
    expect(uno!.minPlayers).toBe(2);
    expect(uno!.maxPlayers).toBe(10);
    expect(uno!.estimatedTime).toBe("15-30 min");
  });

  it("all games have required fields", () => {
    for (const game of AVAILABLE_GAMES) {
      expect(game.id).toBeTruthy();
      expect(game.name).toBeTruthy();
      expect(game.emoji).toBeTruthy();
      expect(typeof game.minPlayers).toBe("number");
      expect(typeof game.maxPlayers).toBe("number");
      expect(game.estimatedTime).toBeTruthy();
      expect(game.minPlayers).toBeGreaterThanOrEqual(1);
      expect(game.maxPlayers).toBeGreaterThanOrEqual(game.minPlayers);
    }
  });
});

describe("getGamesForPlayerCount", () => {
  it("returns multiple party games for 2-8 players", () => {
    for (let count = 2; count <= 8; count++) {
      const games = getGamesForPlayerCount(count);
      expect(games.length).toBeGreaterThanOrEqual(4); // multiple games available
      expect(games.some((g) => g.id === "uno")).toBe(true);
      expect(games.some((g) => g.id === "truth-or-dare")).toBe(true);
    }
  });

  it("returns no games for 1 player", () => {
    const games = getGamesForPlayerCount(1);
    expect(games.length).toBe(0);
  });

  it("returns games for large groups (9-20 players)", () => {
    const games = getGamesForPlayerCount(15);
    expect(games.length).toBeGreaterThanOrEqual(4); // party games support high player counts
    expect(games.every((g) => g.minPlayers <= 15 && g.maxPlayers >= 15)).toBe(true);
    // UNO should NOT be available (max is 10)
    expect(games.some((g) => g.id === "uno")).toBe(false);
  });

  it("does not return games below minPlayers", () => {
    const games = getGamesForPlayerCount(1);
    expect(games.length).toBe(0);
    expect(games.every((g) => g.minPlayers <= 1)).toBe(true); // empty array, vacuously true
  });

  it("does not return games above maxPlayers", () => {
    const games = getGamesForPlayerCount(21); // Above all maxPlayers
    expect(games.length).toBe(0);
    expect(games.every((g) => g.maxPlayers >= 21)).toBe(true); // empty array, vacuously true
  });
});

describe("findMutualMatch", () => {
  const playerIds = ["p1", "p2", "p3"];

  it("returns null when no votes exist", () => {
    const result = findMutualMatch(playerIds, []);
    expect(result).toBeNull();
  });

  it("returns null when not all players voted yes on same game", () => {
    const votes = [
      { player_id: "p1", game_type: "uno", vote: "yes" },
      { player_id: "p2", game_type: "uno", vote: "yes" },
      { player_id: "p3", game_type: "uno", vote: "no" },
    ];
    const result = findMutualMatch(playerIds, votes);
    expect(result).toBeNull();
  });

  it("returns game type when all players voted yes on same game", () => {
    const votes = [
      { player_id: "p1", game_type: "uno", vote: "yes" },
      { player_id: "p2", game_type: "uno", vote: "yes" },
      { player_id: "p3", game_type: "uno", vote: "yes" },
    ];
    const result = findMutualMatch(playerIds, votes);
    expect(result).toBe("uno");
  });

  it("returns null when players vote yes on different games", () => {
    const votes = [
      { player_id: "p1", game_type: "uno", vote: "yes" },
      { player_id: "p2", game_type: "uno", vote: "no" },
      { player_id: "p3", game_type: "other", vote: "yes" },
    ];
    const result = findMutualMatch(playerIds, votes);
    expect(result).toBeNull();
  });

  it("handles extra votes beyond player count", () => {
    const votes = [
      { player_id: "p1", game_type: "uno", vote: "yes" },
      { player_id: "p2", game_type: "uno", vote: "yes" },
      { player_id: "p3", game_type: "uno", vote: "yes" },
      { player_id: "p4", game_type: "uno", vote: "yes" }, // extra player not in playerIds
    ];
    const result = findMutualMatch(playerIds, votes);
    expect(result).toBe("uno");
  });

  it("returns null when players are fewer than votes (missing some votes)", () => {
    const votes = [
      { player_id: "p1", game_type: "uno", vote: "yes" },
      // p2 hasn't voted
      // p3 hasn't voted
    ];
    const result = findMutualMatch(playerIds, votes);
    expect(result).toBeNull();
  });
});

describe("findMostVotedGame", () => {
  it("returns null when no votes exist", () => {
    const result = findMostVotedGame([]);
    expect(result).toBeNull();
  });

  it("returns game with most yes votes", () => {
    const votes = [
      { player_id: "p1", game_type: "uno", vote: "yes" },
      { player_id: "p2", game_type: "uno", vote: "yes" },
      { player_id: "p3", game_type: "other", vote: "yes" },
    ];
    const result = findMostVotedGame(votes);
    expect(result).toBe("uno");
  });

  it("ignores 'no' votes and counts only 'yes' votes", () => {
    const votes = [
      { player_id: "p1", game_type: "uno", vote: "yes" },
      { player_id: "p2", game_type: "uno", vote: "yes" },
      { player_id: "p3", game_type: "uno", vote: "no" },
      { player_id: "p4", game_type: "other", vote: "yes" },
    ];
    // uno has 2 yes votes, other has 1 yes vote
    const result = findMostVotedGame(votes);
    expect(result).toBe("uno");
  });

  it("returns first game in case of tie", () => {
    const votes = [
      { player_id: "p1", game_type: "uno", vote: "yes" },
      { player_id: "p2", game_type: "other", vote: "yes" },
    ];
    const result = findMostVotedGame(votes);
    expect(result).toBe("uno"); // first alphabetically because it appears first in the votes array
  });
});

describe("getGameById", () => {
  it("returns game definition for existing game", () => {
    const game = getGameById("uno");
    expect(game).toBeDefined();
    expect(game!.id).toBe("uno");
    expect(game!.name).toBe("UNO");
  });

  it("returns undefined for non-existent game", () => {
    const game = getGameById("nonexistent");
    expect(game).toBeUndefined();
  });
});

describe("GAME_PICKER_TIMEOUT_SECONDS", () => {
  it("is 30 seconds", () => {
    expect(GAME_PICKER_TIMEOUT_SECONDS).toBe(30);
  });
});
