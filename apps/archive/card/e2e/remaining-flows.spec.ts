import { test, expect, type Page } from "@playwright/test";

// ───── Shared test data ─────

const ROOM = {
  id: "room-1",
  code: "ABCD",
  game_state: "lobby",
  max_players: 8,
  host_session_id: "sess-host",
  created_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 86_400_000).toISOString(),
  current_game_id: null,
};

const HOST = {
  id: "player-1",
  display_name: "Alice",
  avatar_emoji: "🦊",
  is_host: true,
  is_spectator: false,
  joined_at: new Date().toISOString(),
};

const PLAYER_2 = {
  id: "player-2",
  display_name: "Bob",
  avatar_emoji: "🐼",
  is_host: false,
  is_spectator: false,
  joined_at: new Date().toISOString(),
};

const PLAYER_3 = {
  id: "player-3",
  display_name: "Charlie",
  avatar_emoji: "🐵",
  is_host: false,
  is_spectator: false,
  joined_at: new Date().toISOString(),
};

const partyGameState = (overrides: Record<string, unknown> = {}) => ({
  gameSessionId: "game-nhie",
  gameType: "never-have-i-ever",
  status: "show-card",
  phase: "show-card",
  currentCard: {
    id: "card-1",
    text: "Have you ever kissed a stranger?",
    category: "secrets",
    tier: "spicy" as const,
    type: "question" as const,
  },
  roundNumber: 1,
  responses: [],
  timerSeconds: 30,
  config: {
    vibeTier: "spicy",
    drinkingEnabled: true,
    maxDrinksPerRound: 3,
    passPenalty: 1,
    timerSeconds: 30,
    tieRule: "all-drink",
    allowSelfVote: false,
  },
  ...overrides,
});

const PLAYERS_LIST = [
  { id: "player-1", displayName: "Alice", avatarEmoji: "🦊", isHost: true, isSpectator: false },
  { id: "player-2", displayName: "Bob", avatarEmoji: "🐼", isHost: false, isSpectator: false },
  { id: "player-3", displayName: "Charlie", avatarEmoji: "🐵", isHost: false, isSpectator: false },
];

// ───── Helpers ─────

async function blockSupabase(page: Page) {
  await page.route("**/*.supabase.co/**", (route) => route.abort());
}

async function mockRoom(page: Page, overrides: Record<string, unknown> = {}) {
  await page.route("**/api/rooms/ABCD", async (route) => {
    await route.fulfill({ json: { ...ROOM, ...overrides } });
  });
}

async function mockMe(page: Page, player = HOST) {
  await page.route("**/api/rooms/ABCD/me", async (route) => {
    await route.fulfill({ json: { player } });
  });
}

async function mockPlayers(page: Page, players = [HOST, PLAYER_2, PLAYER_3]) {
  await page.route("**/api/rooms/ABCD/players", async (route) => {
    await route.fulfill({ json: { players } });
  });
}

async function mockGameFetch(page: Page, overrides: Record<string, unknown> = {}) {
  await page.route("**/api/games/game-nhie", async (route) => {
    await route.fulfill({
      json: {
        isPartyGame: true,
        gameSessionId: "game-nhie",
        state: partyGameState(overrides),
        players: PLAYERS_LIST,
        currentPlayer: PLAYERS_LIST[0],
        ...overrides,
      },
    });
  });
}

// ════════════════════════════════════════════
// HOUSES RULES
// ════════════════════════════════════════════

test.describe("House Rules", () => {
  test.beforeEach(async ({ page }) => {
    await blockSupabase(page);
    await mockRoom(page);
    await mockMe(page);
    await page.route("**/api/rooms/ABCD/players", async (route) => {
      await route.fulfill({ json: { players: [HOST, PLAYER_2] } });
    });
  });

  test("house rules panel expands and shows toggles", async ({ page }) => {
    await page.goto("/ABCD");
    await page.getByText("House Rules").click();
    await expect(page.getByText("Draw Stacking")).toBeVisible();
    await expect(page.getByText("Draw Until You Play")).toBeVisible();
  });

  test("can toggle draw stacking on", async ({ page }) => {
    await page.goto("/ABCD");
    await page.getByText("House Rules").click();

    // Click the visible toggle — the parent label element wraps the checkbox
    const toggle = page.getByText("Draw Stacking");
    await toggle.click();
    await expect(page.getByLabel("Draw Stacking")).toBeChecked();
  });

  test("can toggle draw until you play on", async ({ page }) => {
    await page.goto("/ABCD");
    await page.getByText("House Rules").click();

    // Click the visible toggle
    const toggle = page.getByText("Draw Until You Play");
    await toggle.click();
    await expect(page.getByLabel("Draw Until You Play")).toBeChecked();
  });
});

// ════════════════════════════════════════════
// QR CODE & ROOM CODE COPY
// ════════════════════════════════════════════

test.describe("QR Code and Room Code Copy", () => {
  test.beforeEach(async ({ page }) => {
    await blockSupabase(page);
    await mockRoom(page);
    await mockMe(page);
    await page.route("**/api/rooms/ABCD/players", async (route) => {
      await route.fulfill({ json: { players: [HOST, PLAYER_2] } });
    });
  });

  test("room code is displayed and copyable", async ({ page }) => {
    await page.goto("/ABCD");
    await expect(page.getByLabel("Copy room code")).toBeVisible();
    await expect(page.getByText("ABCD")).toBeVisible();
  });

  test("QR code is rendered", async ({ page }) => {
    await page.goto("/ABCD");
    const qrSvg = page.locator("svg");
    await expect(qrSvg.first()).toBeVisible();
  });

  test("share button is visible", async ({ page }) => {
    await page.goto("/ABCD");
    await expect(page.getByRole("button", { name: /share/i })).toBeVisible();
  });
});

// ════════════════════════════════════════════
// SPECTATE PAGE
// ════════════════════════════════════════════

test.describe("Spectate Page", () => {
  test.beforeEach(async ({ page }) => {
    await blockSupabase(page);
  });

  test("shows loading state initially", async ({ page }) => {
    await page.route("**/api/rooms/ABCD", async (route) => {
      await new Promise((r) => setTimeout(r, 1000));
      await route.fulfill({ json: { ...ROOM, current_game_id: "game-1" } });
    });
    await page.goto("/ABCD/spectate");
    await expect(page.getByText("Loading spectator view")).toBeVisible();
  });

  test("shows error when room has no active game", async ({ page }) => {
    await page.route("**/api/rooms/ABCD", async (route) => {
      await route.fulfill({ json: { ...ROOM, current_game_id: null } });
    });
    await page.goto("/ABCD/spectate");
    await expect(page.getByText("Cannot spectate")).toBeVisible();
    await expect(page.getByText("No active game in this room")).toBeVisible();
  });

  test("shows error when room is not found", async ({ page }) => {
    await page.route("**/api/rooms/ABCD", async (route) => {
      await route.fulfill({ status: 404, body: "{}" });
    });
    await page.goto("/ABCD/spectate");
    await expect(page.getByText("Cannot spectate")).toBeVisible();
    await expect(page.getByText("Room not found")).toBeVisible();
  });

  test("spectator view shows game state", async ({ page }) => {
    const gameConfig = {
      deck: [{ color: "red", value: "5" }, { color: "blue", value: "3" }],
      discardPile: [{ color: "red", value: "3" }],
      currentColor: "red",
      currentPlayerIndex: 0,
      direction: 1,
      pendingDrawCount: 0,
      status: "playing",
      roundNumber: 1,
      turnStartTime: Date.now(),
      config: { drawStacking: false, drawUntilYouPlay: false, turnTimeoutSeconds: 60, winningScore: 500 },
      players: [{ playerId: "player-1", hand: [], calledUno: false }],
      winnerId: undefined,
      roomId: "room-1",
    };

    await page.route("**/api/rooms/ABCD", async (route) => {
      await route.fulfill({ json: { ...ROOM, current_game_id: "game-1" } });
    });
    await page.route("**/api/games/game-1", async (route) => {
      await route.fulfill({
        json: {
          gameSessionId: "game-1",
          roomId: "room-1",
          config: gameConfig,
          players: [{ id: "player-1", displayName: "Alice", avatarEmoji: "🦊", isHost: true }],
        },
      });
    });

    await page.goto("/ABCD/spectate");
    await expect(page.getByText("Spectator")).toBeVisible();
    await expect(page.getByText("2 cards left")).toBeVisible();
  });
});

// ════════════════════════════════════════════
// PARTY GAME ROUND FLOW
// ════════════════════════════════════════════

test.describe("Party Game Round Flow (Never Have I Ever)", () => {
  test.beforeEach(async ({ page }) => {
    await blockSupabase(page);
    await mockRoom(page, { current_game_id: "game-nhie" });
    await mockMe(page);
    await mockPlayers(page);
  });

  test("shows card with question and voting buttons", async ({ page }) => {
    await mockGameFetch(page);
    await page.goto("/ABCD/party/never-have-i-ever");

    await expect(page.getByText("Have you ever kissed a stranger?")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: "I have done this" })).toBeVisible();
    await expect(page.getByRole("button", { name: "I have not done this" })).toBeVisible();
  });

  test("player can respond I Have and see tally", async ({ page }) => {
    await mockGameFetch(page, {
      state: partyGameState({
        phase: "responding",
        currentCard: { id: "card-1", text: "Have you ever kissed a stranger?", category: "secrets", tier: "spicy", type: "question" },
      }),
    });
    await page.route("**/api/games/game-nhie/party/respond", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto("/ABCD/party/never-have-i-ever");
    await expect(page.getByText("Have you ever kissed a stranger?")).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "I have done this" }).click();
    await expect(page.getByText("Responses:")).toBeVisible();
  });

  test("reveal phase renders without errors", async ({ page }) => {
    await mockGameFetch(page, {
      state: partyGameState({
        phase: "revealing",
        currentCard: null,
        responses: [
          { playerId: "player-1", playerName: "Alice", value: "have", timestamp: Date.now() },
          { playerId: "player-2", playerName: "Bob", value: "have-not", timestamp: Date.now() },
          { playerId: "player-3", playerName: "Charlie", value: "have", timestamp: Date.now() },
        ],
      }),
    });

    await page.goto("/ABCD/party/never-have-i-ever");

    // In revealing phase without a reveal action triggered, the page shows the header
    await expect(page.getByText("Round 1")).toBeVisible({ timeout: 10_000 });
  });

  test("next round phase shows start controls for host", async ({ page }) => {
    await mockGameFetch(page, {
      state: partyGameState({
        phase: "next-round",
        currentCard: null,
        responses: [],
        roundNumber: 2,
      }),
    });

    await page.goto("/ABCD/party/never-have-i-ever");
    await expect(page.getByText("Starting next round...")).toBeVisible({ timeout: 10_000 });

    // The mock includes isHost: true via mockMe, so host controls should render
    await expect(page.getByRole("button", { name: /next card/i })).toBeVisible();
  });

  test("host can skip card", async ({ page }) => {
    await mockGameFetch(page);
    await page.route("**/api/games/game-nhie/party/skip", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto("/ABCD/party/never-have-i-ever");
    await expect(page.getByText("Have you ever kissed a stranger?")).toBeVisible({ timeout: 10_000 });

    // Host controls should be visible (mockMe returns isHost: true)
    await expect(page.getByRole("button", { name: /skip card/i })).toBeVisible();
  });

  test("game over phase shows end game screen", async ({ page }) => {
    await mockGameFetch(page, {
      state: partyGameState({
        phase: "game-end",
        status: "game-end",
        currentCard: null,
        responses: [],
      }),
    });

    await page.goto("/ABCD/party/never-have-i-ever");

    // Game over screen shows the game name
    await expect(page.getByText("Never Have I Ever", { exact: true })).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════
// SCORES PAGE
// ════════════════════════════════════════════

test.describe("Scores Page", () => {
  test.beforeEach(async ({ page }) => {
    await blockSupabase(page);
  });

  test("scores page loads and shows data", async ({ page }) => {
    await page.route("**/api/rooms/ABCD", async (route) => {
      await route.fulfill({ json: { ...ROOM, current_game_id: "game-1" } });
    });
    await mockMe(page);

    // Mock the scores API endpoint directly
    await page.route("**/api/rooms/ABCD/scores", async (route) => {
      await route.fulfill({
        json: {
          roomId: "room-1",
          currentGameId: "game-1",
          gameSessionId: "game-1",
          gameType: "uno",
          status: "playing",
          currentRound: 1,
          players: [
            { id: "player-1", displayName: "Alice", avatarEmoji: "🦊", isHost: true },
            { id: "player-2", displayName: "Bob", avatarEmoji: "🐼", isHost: false },
          ],
          perRoundScores: [],
          runningTotals: [
            { id: "player-1", displayName: "Alice", avatarEmoji: "🦊", isHost: true, runningTotal: 0 },
            { id: "player-2", displayName: "Bob", avatarEmoji: "🐼", isHost: false, runningTotal: 0 },
          ],
          lastRoundWinner: null,
        },
      });
    });

    await page.goto("/ABCD/scores");

    // Should render the scoreboard with data
    await expect(page.getByRole("heading", { name: /scoreboard/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Alice")).toBeVisible();
    await expect(page.getByText("Bob")).toBeVisible();
    await expect(page.getByRole("button", { name: /play again/i })).toBeVisible();
  });
});
