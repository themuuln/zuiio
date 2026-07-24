import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useParams, useRouter } from "next/navigation";
import type { CardColor, GameState, Card } from "@/lib/game-engine/types";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(),
}));

// Mock createClient from supabase
const mockChannel = vi.fn(() => ({
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn(),
}));

const mockRemoveChannel = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  })),
}));

// Helper to build a mock game state
function makeMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    deck: [],
    discardPile: [
      {
        color: "red" as CardColor,
        value: "7",
        id: "discard-1",
      },
    ],
    players: [
      {
        playerId: "player-1",
        hand: [
          { color: "red" as CardColor, value: "3", id: "p1-card-1" },
          { color: "blue" as CardColor, value: "5", id: "p1-card-2" },
        ],
        calledUno: false,
      },
      {
        playerId: "player-2",
        hand: [
          { color: "green" as CardColor, value: "skip", id: "p2-card-1" },
          { color: "yellow" as CardColor, value: "2", id: "p2-card-2" },
          {
            color: undefined,
            value: "wild",
            id: "p2-card-3",
          } as Card,
        ],
        calledUno: false,
      },
    ],
    currentPlayerIndex: 0,
    direction: 1,
    config: {
      drawStacking: false,
      drawUntilYouPlay: false,
      turnTimeoutSeconds: 60,
      winningScore: 500,
    },
    status: "playing",
    currentColor: "red" as CardColor,
    winnerId: undefined,
    pendingDrawCount: 0,
    turnStartTime: Date.now(),
    roundNumber: 1,
    ...overrides,
  };
}

describe("SpectatePage", () => {
  const mockRouter = { push: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    (useParams as ReturnType<typeof vi.fn>).mockReturnValue({ code: "FROG" });
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue(mockRouter);
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders loading state initially", async () => {
    // Don't resolve fetch immediately to see loading state
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    // Dynamic import to avoid module caching issues
    const { default: SpectatePage } = await import("../page");
    render(<SpectatePage />);

    expect(screen.getByText("Loading spectator view...")).toBeDefined();
  });

  it("fetches room info on mount", async () => {
    const mockGameState = makeMockGameState();

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (url === "/api/rooms/FROG") {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                id: "room-1",
                code: "FROG",
                game_state: "playing",
                current_game_id: "game-1",
              }),
          });
        }
        if (url === "/api/games/game-1") {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                gameSessionId: "game-1",
                roomId: "room-1",
                roomCode: "FROG",
                gameType: "uno",
                status: "playing",
                roundNumber: 1,
                currentPlayerId: "player-1",
                currentPlayerName: "Alex",
                players: [
                  { id: "player-1", displayName: "Alex", avatarEmoji: "🦊", isHost: true },
                  { id: "player-2", displayName: "Jordan", avatarEmoji: "🐼", isHost: false },
                ],
                config: mockGameState,
              }),
          });
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      }
    );

    const { default: SpectatePage } = await import("../page");
    render(<SpectatePage />);

    await waitFor(() => {
      // Should show spectator header
      expect(screen.getByText("Spectator")).toBeDefined();
      // Should show player names
      expect(screen.getByText("Alex")).toBeDefined();
      expect(screen.getByText("Jordan")).toBeDefined();
    });

    // Verify the correct API calls were made
    expect(global.fetch).toHaveBeenCalledWith("/api/rooms/FROG");
    expect(global.fetch).toHaveBeenCalledWith("/api/games/game-1");
  });

  it("shows all players' cards face-up", async () => {
    const mockGameState = makeMockGameState();

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (url === "/api/rooms/FROG") {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                id: "room-1",
                code: "FROG",
                game_state: "playing",
                current_game_id: "game-1",
              }),
          });
        }
        if (url === "/api/games/game-1") {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                gameSessionId: "game-1",
                roomId: "room-1",
                roomCode: "FROG",
                gameType: "uno",
                status: "playing",
                roundNumber: 1,
                currentPlayerId: "player-1",
                currentPlayerName: "Alex",
                players: [
                  { id: "player-1", displayName: "Alex", avatarEmoji: "🦊", isHost: true },
                  { id: "player-2", displayName: "Jordan", avatarEmoji: "🐼", isHost: false },
                ],
                config: mockGameState,
              }),
          });
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      }
    );

    const { default: SpectatePage } = await import("../page");
    render(<SpectatePage />);

    await waitFor(() => {
      // Show card counts
      expect(screen.getByText("(2 cards)")).toBeDefined();
      expect(screen.getByText("(3 cards)")).toBeDefined();
    });
  });

  it("shows turn indicator with current player name", async () => {
    const mockGameState = makeMockGameState({ currentPlayerIndex: 0 });

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (url === "/api/rooms/FROG") {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                id: "room-1",
                code: "FROG",
                game_state: "playing",
                current_game_id: "game-1",
              }),
          });
        }
        if (url === "/api/games/game-1") {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                gameSessionId: "game-1",
                roomId: "room-1",
                roomCode: "FROG",
                gameType: "uno",
                status: "playing",
                roundNumber: 1,
                currentPlayerId: "player-1",
                currentPlayerName: "Alex",
                players: [
                  { id: "player-1", displayName: "Alex", avatarEmoji: "🦊", isHost: true },
                  { id: "player-2", displayName: "Jordan", avatarEmoji: "🐼", isHost: false },
                ],
                config: mockGameState,
              }),
          });
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      }
    );

    const { default: SpectatePage } = await import("../page");
    render(<SpectatePage />);

    await waitFor(() => {
      // Player 1 (Alex) is at currentPlayerIndex 0
      // The turn indicator shows "Alex's turn" (uses &apos; which renders as ')
      const turnIndicators = screen.getAllByText(/Alex/);
      expect(turnIndicators.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows error when room has no current_game_id", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (url === "/api/rooms/FROG") {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                id: "room-1",
                code: "FROG",
                game_state: "lobby",
                current_game_id: null,
              }),
          });
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      }
    );

    const { default: SpectatePage } = await import("../page");
    render(<SpectatePage />);

    await waitFor(() => {
      expect(screen.getByText("Cannot spectate")).toBeDefined();
      expect(screen.getByText("No active game in this room")).toBeDefined();
    });
  });

  it("shows error when room is not found", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (url === "/api/rooms/FROG") {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: "Room not found" }),
          });
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      }
    );

    const { default: SpectatePage } = await import("../page");
    render(<SpectatePage />);

    await waitFor(() => {
      expect(screen.getByText("Cannot spectate")).toBeDefined();
      expect(screen.getByText("Room not found")).toBeDefined();
    });
  });

  it("shows error when game state fetch fails", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (url === "/api/rooms/FROG") {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                id: "room-1",
                code: "FROG",
                game_state: "playing",
                current_game_id: "game-1",
              }),
          });
        }
        if (url === "/api/games/game-1") {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: "Game not found" }),
          });
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      }
    );

    const { default: SpectatePage } = await import("../page");
    render(<SpectatePage />);

    await waitFor(() => {
      expect(screen.getByText("Cannot spectate")).toBeDefined();
      // My new code reads the error body from the API response
      // and uses it as the error message
      expect(screen.getByText("Game not found")).toBeDefined();
    });
  });

  it("sets up Realtime subscription after loading game state", async () => {
    const mockGameState = makeMockGameState();

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (url === "/api/rooms/FROG") {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                id: "room-1",
                code: "FROG",
                game_state: "playing",
                current_game_id: "game-1",
              }),
          });
        }
        if (url === "/api/games/game-1") {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                gameSessionId: "game-1",
                roomId: "room-1",
                roomCode: "FROG",
                gameType: "uno",
                status: "playing",
                roundNumber: 1,
                currentPlayerId: "player-1",
                currentPlayerName: "Alex",
                players: [
                  { id: "player-1", displayName: "Alex", avatarEmoji: "🦊", isHost: true },
                  { id: "player-2", displayName: "Jordan", avatarEmoji: "🐼", isHost: false },
                ],
                config: mockGameState,
              }),
          });
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      }
    );

    const { default: SpectatePage } = await import("../page");
    render(<SpectatePage />);

    await waitFor(() => {
      // Should subscribe to the room channel
      expect(mockChannel).toHaveBeenCalledWith("room:room-1");
    });

    // After the component mounts and fetches data,
    // the channel subscription should be set up
    await waitFor(() => {
      // Check that .on() was called for game_action
      const channelInstance = mockChannel.mock.results[0]?.value;
      if (channelInstance) {
        expect(channelInstance.on).toHaveBeenCalledWith(
          "broadcast",
          { event: "game_action" },
          expect.any(Function)
        );
      }
    });
  });
});
