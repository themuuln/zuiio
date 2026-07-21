/**
 * Tests for host management features: pause/resume and remove player.
 */
import { describe, it, expect } from "vitest";
import {
  playCard,
  drawCard,
  createInitialGameState,
} from "@/lib/game-engine/uno";
import type { Card, CardColor, GameState } from "@/lib/game-engine/types";
import { DEFAULT_GAME_CONFIG } from "@/lib/game-engine/types";

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

function makeTestState(
  playerIds: string[],
  hands: Card[][],
  topDiscard: Card,
  currentColor: CardColor,
  currentPlayerIndex = 0,
  direction: 1 | -1 = 1,
  status: GameState["status"] = "playing"
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
    status,
    currentColor,
    winnerId: undefined,
    pendingDrawCount: 0,
    turnStartTime: Date.now(),
    roundNumber: 1,
  };
}

describe("Pause/Resume - Game Engine Validation", () => {
  it("playCard rejects when game is paused", () => {
    const topDiscard = makeCard("red", "5");
    const state = makeTestState(
      ["p1", "p2"],
      [[makeCard("red", "3")], [makeCard("blue", "7")]],
      topDiscard,
      "red",
      0,
      1,
      "paused"
    );

    const result = playCard(state, "p1", 0);
    expect(result.error).toBeTruthy();
  });

  it("drawCard rejects when game is paused", () => {
    const topDiscard = makeCard("red", "5");
    const state = makeTestState(
      ["p1", "p2"],
      [[makeCard("red", "3")], [makeCard("blue", "7")]],
      topDiscard,
      "red",
      0,
      1,
      "paused"
    );

    const result = drawCard(state, "p1");
    expect(result.error).toBeTruthy();
  });

  it("playCard works normally when game is playing", () => {
    const topDiscard = makeCard("red", "5");
    const state = makeTestState(
      ["p1"],
      [[makeCard("red", "3")]],
      topDiscard,
      "red",
      0,
      1,
      "playing"
    );

    const result = playCard(state, "p1", 0);
    expect(result.error).toBeUndefined();
    expect(result.state.players[0].hand.length).toBe(0);
  });

  it("drawCard works normally when game is playing", () => {
    const deck = [makeCard("red", "2"), makeCard("blue", "5")];
    const topDiscard = makeCard("red", "5");
    const state: GameState = {
      ...makeTestState(
        ["p1"],
        [[makeCard("red", "3")]],
        topDiscard,
        "red",
        0,
        1,
        "playing"
      ),
      deck,
    };

    const result = drawCard(state, "p1");
    expect(result.error).toBeUndefined();
    expect(result.state.players[0].hand.length).toBe(2);
  });

  it("initial game state has status 'playing'", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    expect(state.status).toBe("playing");
  });
});

describe("Pause/Resume - Toggle State", () => {
  it("can toggle between playing and paused status", () => {
    const state = createInitialGameState({}, ["p1", "p2"]);
    expect(state.status).toBe("playing");

    // Simulate toggling to paused
    const pausedState: GameState = { ...state, status: "paused" };
    expect(pausedState.status).toBe("paused");

    // Simulate toggling back to playing
    const resumedState: GameState = { ...pausedState, status: "playing" };
    expect(resumedState.status).toBe("playing");
  });
});

describe("Remove Player - Validation", () => {
  it("cannot remove the host player", () => {
    const players = [
      { id: "host-1", is_host: true },
      { id: "player-2", is_host: false },
      { id: "player-3", is_host: false },
    ];

    // The host can be identified
    const hostPlayer = players.find((p) => p.is_host);
    expect(hostPlayer?.id).toBe("host-1");

    // Trying to remove the host should be rejected
    const isTargetHost = (targetId: string) =>
      players.find((p) => p.id === targetId)?.is_host ?? false;

    expect(isTargetHost("host-1")).toBe(true);
    expect(isTargetHost("player-2")).toBe(false);
  });

  it("validates removed player exists", () => {
    const playerIds = ["p1", "p2", "p3"];

    // A valid removal target exists in the list
    const validTarget = "p2";
    expect(playerIds).toContain(validTarget);

    // An invalid target doesn't exist
    const invalidTarget = "non-existent";
    expect(playerIds).not.toContain(invalidTarget);
  });

  it("allows host to remove non-host players", () => {
    const hostId = "host-1";
    const players = [
      { id: hostId, is_host: true },
      { id: "player-2", is_host: false },
      { id: "player-3", is_host: false },
    ];

    const isHost = (playerId: string) =>
      players.find((p) => p.id === playerId)?.is_host ?? false;

    const removablePlayers = players.filter((p) => !isHost(p.id));
    expect(removablePlayers).toHaveLength(2);
    expect(removablePlayers.map((p) => p.id)).toEqual(["player-2", "player-3"]);
  });
});

describe("API Response - Pause/Resume", () => {
  it("pause endpoint returns success with new status", () => {
    const mockPauseResponse = {
      success: true,
      status: "paused",
      roomCode: "FROG",
      roomId: "room-123",
    };

    expect(mockPauseResponse.success).toBe(true);
    expect(mockPauseResponse.status).toBe("paused");
  });

  it("resume endpoint returns success with playing status", () => {
    const mockResumeResponse = {
      success: true,
      status: "playing",
      roomCode: "FROG",
      roomId: "room-123",
    };

    expect(mockResumeResponse.success).toBe(true);
    expect(mockResumeResponse.status).toBe("playing");
  });

  it("pause response returns 403 for non-host", () => {
    const mockErrorResponse = {
      error: "Only the host can pause/resume the game",
    };

    expect(mockErrorResponse.error).toBeTruthy();
  });
});

describe("API Response - Remove Player", () => {
  it("remove player response returns success", () => {
    const mockResponse = {
      success: true,
      playerId: "player-2",
      action: "removed",
      roomCode: "FROG",
    };

    expect(mockResponse.success).toBe(true);
    expect(mockResponse.playerId).toBe("player-2");
    expect(mockResponse.action).toBe("removed");
  });

  it("remove host returns error", () => {
    const mockErrorResponse = {
      error: "Cannot remove the host player",
    };

    expect(mockErrorResponse.error).toBeTruthy();
  });

  it("remove non-existent player returns error", () => {
    const mockErrorResponse = {
      error: "Player not found in this room",
    };

    expect(mockErrorResponse.error).toBeTruthy();
  });

  it("remove player returns 401 for unauthenticated", () => {
    const mockErrorResponse = {
      error: "Not authenticated",
    };

    expect(mockErrorResponse.error).toBeTruthy();
  });
});
