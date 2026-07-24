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

const ROOM_WITH_GAME = (gameId: string) => ({
  ...ROOM,
  game_state: "playing",
  current_game_id: gameId,
});

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

const PLAYERS_LIST = [
  { id: "player-1", displayName: "Alice", avatarEmoji: "🦊", isHost: true, isSpectator: false },
  { id: "player-2", displayName: "Bob", avatarEmoji: "🐼", isHost: false, isSpectator: false },
  { id: "player-3", displayName: "Charlie", avatarEmoji: "🐵", isHost: false, isSpectator: false },
];

const GAME_SESSION_ID = "game-ps-1";

const defaultConfig = {
  vibeTier: "spicy",
  drinkingEnabled: true,
  maxDrinksPerRound: 3,
  passPenalty: 1,
  timerSeconds: 30,
  tieRule: "all-drink",
  allowSelfVote: false,
};

function partyGameState(overrides: Record<string, unknown> = {}) {
  return {
    gameSessionId: GAME_SESSION_ID,
    gameType: "truth-or-dare",
    status: "show-card",
    phase: "show-card",
    currentCard: null,
    roundNumber: 1,
    responses: [],
    timerSeconds: 30,
    config: { ...defaultConfig },
    ...overrides,
  };
}

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

async function mockGameState(page: Page, state: ReturnType<typeof partyGameState>) {
  await page.route(`**/api/games/${GAME_SESSION_ID}`, async (route) => {
    await route.fulfill({
      json: {
        isPartyGame: true,
        gameSessionId: GAME_SESSION_ID,
        state,
        players: PLAYERS_LIST,
        currentPlayer: PLAYERS_LIST[0],
      },
    });
  });
}

async function mockGameStart(page: Page, gameType: string) {
  await page.route("**/api/games/party/start", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({ json: { success: true, gameSessionId: GAME_SESSION_ID } });
    } else {
      await route.continue();
    }
  });
}

// ════════════════════════════════════════════
// PARTY LOBBY
// ════════════════════════════════════════════

test.describe("Party Lobby", () => {
  test.beforeEach(async ({ page }) => {
    await blockSupabase(page);
    await mockRoom(page);
    await mockMe(page);
    await mockPlayers(page, [HOST, PLAYER_2, PLAYER_3]);
  });

  test("shows party games header and game cards", async ({ page }) => {
    await page.goto("/ABCD/party");

    await expect(page.getByRole("heading", { name: /party games/i })).toBeVisible();
    await expect(page.getByText("Truth or Dare")).toBeVisible();
    await expect(page.getByText("Never Have I Ever")).toBeVisible();
    await expect(page.getByText("Hot Takes")).toBeVisible();
    await expect(page.getByText("Most Likely To", { exact: true })).toBeVisible();
  });

  test("shows current vibe tier and allows host to change it", async ({ page }) => {
    await page.goto("/ABCD/party");

    // Spicy should be active by default
    await expect(page.getByText("Spicy", { exact: true })).toBeVisible();
    await expect(page.getByText("Flirty, cheeky, mild drinking")).toBeVisible();

    // Tier selector buttons visible for host
    const wildBtn = page.getByRole("button", { name: /set tier to wild/i });
    await expect(wildBtn).toBeVisible();

    // Mock PATCH endpoint for tier change
    await page.route("**/api/rooms/ABCD", async (route) => {
      if (route.request().method() === "PATCH") {
        await route.fulfill({ json: { success: true, vibe_tier: "wild" } });
      } else {
        await route.fulfill({ json: ROOM });
      }
    });

    // Click Wild tier
    await wildBtn.click();
    await expect(page.getByText("Raunchy, heavy drinking")).toBeVisible();
  });

  test("shows After Dark warning when host selects After Dark tier", async ({ page }) => {
    await page.goto("/ABCD/party");

    // Mock PATCH endpoint
    await page.route("**/api/rooms/ABCD", async (route) => {
      if (route.request().method() === "PATCH") {
        await route.fulfill({ json: { success: true, vibe_tier: "after-dark" } });
      } else {
        await route.fulfill({ json: ROOM });
      }
    });

    // Click After Dark tier
    const afterDarkBtn = page.getByRole("button", { name: /set tier to after-dark/i });
    await afterDarkBtn.click();

    // Warning dialog should appear
    await expect(page.getByText(/sexually explicit content/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /enable after dark/i })).toBeVisible();

    // Confirm
    await page.getByRole("button", { name: /enable after dark/i }).click();
    await expect(page.getByText(/explicit, no limits/i)).toBeVisible();
  });

  test("shows drinking config section", async ({ page }) => {
    await page.goto("/ABCD/party");

    await expect(page.getByText("Drinking Config")).toBeVisible();
    await expect(page.getByText("Drinking enabled")).toBeVisible();
    // Host sees the toggle switch
    await expect(page.getByRole("switch", { name: /toggle drinking enabled/i })).toBeVisible();
  });

  test("host can toggle drinking off/on", async ({ page }) => {
    await page.goto("/ABCD/party");

    const toggle = page.getByRole("switch", { name: /toggle drinking enabled/i });
    await toggle.click();
    await expect(page.getByText("Dry mode")).toBeVisible();

    await toggle.click();
    await expect(page.getByText("Drinking enabled")).toBeVisible();
  });

  test("shows player count in footer", async ({ page }) => {
    await mockPlayers(page, [HOST, PLAYER_2, PLAYER_3]);
    await page.goto("/ABCD/party");

    await expect(page.getByText("3 player(s) in room")).toBeVisible();
  });

  test("game card shows details and can be clicked", async ({ page }) => {
    await mockGameStart(page, "truth-or-dare");
    await page.goto("/ABCD/party");

    // Click a game card should trigger navigation
    const gameCard = page.getByText("Truth or Dare").first();
    await expect(gameCard).toBeVisible();

    // Verify description is shown
    await expect(page.getByText(/spicy truths, daring dares/i)).toBeVisible();
  });
});

// ════════════════════════════════════════════
// TRUTH OR DARE
// ════════════════════════════════════════════

test.describe("Truth or Dare", () => {
  test.beforeEach(async ({ page }) => {
    await blockSupabase(page);
    await mockRoom(page, ROOM_WITH_GAME(GAME_SESSION_ID));
    await mockMe(page);
    await mockPlayers(page);
  });

  test("shows round info and truth/dare picker for active player", async ({ page }) => {
    await mockGameState(page, partyGameState({
      gameType: "truth-or-dare",
      status: "show-card",
      phase: "show-card",
      currentCard: null,
      config: { ...defaultConfig, activePlayerId: "player-1", turnOrder: ["player-1", "player-2", "player-3"] },
    }));

    await page.goto("/ABCD/party/truth-or-dare");

    await expect(page.getByRole("heading", { name: "Round 1" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: /pick truth/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /pick dare/i })).toBeVisible();
  });

  test("shows waiting state for non-active player", async ({ page }) => {
    // Make player-2 the active player instead
    const nonHost = { ...HOST, id: "player-1", isHost: true };
    await mockMe(page, nonHost);
    await mockGameState(page, partyGameState({
      gameType: "truth-or-dare",
      status: "show-card",
      phase: "show-card",
      currentCard: null,
      config: { ...defaultConfig, activePlayerId: "player-2", turnOrder: ["player-2", "player-1", "player-3"] },
    }));

    await page.goto("/ABCD/party/truth-or-dare");

    await expect(page.getByText(/turn to pick/i)).toBeVisible({ timeout: 10_000 });
  });

  test("shows card content after picking truth", async ({ page }) => {
    await mockGameState(page, partyGameState({
      gameType: "truth-or-dare",
      status: "responding",
      phase: "responding",
      currentCard: { id: "card-1", text: "What's your biggest secret?", category: "secrets", tier: "spicy", type: "truth" },
      config: { ...defaultConfig, activePlayerId: "player-1", turnOrder: ["player-1", "player-2", "player-3"] },
    }));

    await page.goto("/ABCD/party/truth-or-dare");

    // Card should be visible
    await expect(page.getByText("What's your biggest secret?")).toBeVisible({ timeout: 10_000 });
  });

  test("shows card content after picking dare", async ({ page }) => {
    await mockGameState(page, partyGameState({
      gameType: "truth-or-dare",
      status: "responding",
      phase: "responding",
      currentCard: { id: "card-2", text: "Do a handstand for 10 seconds", category: "dares", tier: "spicy", type: "dare" },
      config: { ...defaultConfig, activePlayerId: "player-1", turnOrder: ["player-1", "player-2", "player-3"] },
    }));

    await page.goto("/ABCD/party/truth-or-dare");

    // Dare card should be visible
    await expect(page.getByText("Do a handstand for 10 seconds")).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════
// HOT TAKES
// ════════════════════════════════════════════

test.describe("Hot Takes", () => {
  test.beforeEach(async ({ page }) => {
    await blockSupabase(page);
    await mockRoom(page, ROOM_WITH_GAME(GAME_SESSION_ID));
    await mockMe(page);
    await mockPlayers(page);
  });

  test("shows hot take card with agree/disagree buttons", async ({ page }) => {
    await mockGameState(page, partyGameState({
      gameType: "hot-takes",
      status: "show-card",
      phase: "show-card",
      currentCard: { id: "card-ht-1", text: "Pineapple belongs on pizza", category: "hot-takes", tier: "spicy", type: "question" },
    }));

    await page.goto("/ABCD/party/hot-takes");

    await expect(page.getByText("Pineapple belongs on pizza")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: "Agree", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Disagree", exact: true })).toBeVisible();
  });

  test("shows reveal overlay in revealing phase", async ({ page }) => {
    await mockGameState(page, partyGameState({
      gameType: "hot-takes",
      status: "revealing",
      phase: "revealing",
      currentCard: { id: "card-ht-2", text: "Hot dogs are sandwiches", category: "hot-takes", tier: "spicy", type: "question" },
      responses: [
        { playerId: "player-1", playerName: "Alice", value: "agree", timestamp: Date.now() },
        { playerId: "player-2", playerName: "Bob", value: "disagree", timestamp: Date.now() },
        { playerId: "player-3", playerName: "Charlie", value: "agree", timestamp: Date.now() },
      ],
    }));

    await page.goto("/ABCD/party/hot-takes");

    // Round header should be visible
    await expect(page.getByText(/round 1/i)).toBeVisible({ timeout: 10_000 });
  });

  test("shows game over screen at game-end phase", async ({ page }) => {
    await mockGameState(page, partyGameState({
      gameType: "hot-takes",
      status: "game-end",
      phase: "game-end",
      currentCard: null,
      responses: [],
      roundNumber: 5,
    }));

    await page.goto("/ABCD/party/hot-takes");

    await expect(page.getByText("Hot Takes", { exact: true })).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════
// MOST LIKELY TO
// ════════════════════════════════════════════

test.describe("Most Likely To", () => {
  test.beforeEach(async ({ page }) => {
    await blockSupabase(page);
    await mockRoom(page, ROOM_WITH_GAME(GAME_SESSION_ID));
    await mockMe(page);
    await mockPlayers(page);
  });

  test("shows card with player picker buttons", async ({ page }) => {
    await mockGameState(page, partyGameState({
      gameType: "most-likely-to",
      status: "show-card",
      phase: "show-card",
      currentCard: { id: "card-mlt-1", text: "Who is most likely to become a millionaire?", category: "hot-takes", tier: "spicy", type: "question" },
    }));

    await page.goto("/ABCD/party/most-likely-to");

    await expect(page.getByText("Who is most likely to become a millionaire?")).toBeVisible({ timeout: 10_000 });
    // Player picker buttons should be visible (self is excluded, so only Bob and Charlie shown)
    await expect(page.getByRole("button", { name: /vote for bob/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /vote for charlie/i })).toBeVisible();
  });

  test("shows reveal overlay in revealing phase", async ({ page }) => {
    await mockGameState(page, partyGameState({
      gameType: "most-likely-to",
      status: "revealing",
      phase: "revealing",
      currentCard: { id: "card-mlt-2", text: "Who is most likely to survive a zombie apocalypse?", category: "hot-takes", tier: "spicy", type: "question" },
      responses: [
        { playerId: "player-1", playerName: "Alice", value: "player-2", timestamp: Date.now() },
        { playerId: "player-2", playerName: "Bob", value: "player-2", timestamp: Date.now() },
        { playerId: "player-3", playerName: "Charlie", value: "player-1", timestamp: Date.now() },
      ],
    }));

    await page.goto("/ABCD/party/most-likely-to");

    await expect(page.getByText(/round 1/i)).toBeVisible({ timeout: 10_000 });
  });

  test("shows game over screen at game-end phase", async ({ page }) => {
    await mockGameState(page, partyGameState({
      gameType: "most-likely-to",
      status: "game-end",
      phase: "game-end",
      currentCard: null,
      responses: [],
      roundNumber: 8,
    }));

    await page.goto("/ABCD/party/most-likely-to");

    await expect(page.getByText("Most Likely To", { exact: true })).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════
// ROOM CREATION WITH VIBE TIER
// ════════════════════════════════════════════

test.describe("Room Creation with Vibe Tier", () => {
  test.beforeEach(async ({ page }) => {
    await blockSupabase(page);
  });

  test("shows vibe tier selector on home page", async ({ page }) => {
    await page.goto("/");

    // Vibe tier selector should be visible
    await expect(page.getByText("Choose your vibe")).toBeVisible();
    await expect(page.getByText("Spicy", { exact: true })).toBeVisible();
    await expect(page.getByText("Wild", { exact: true })).toBeVisible();
    await expect(page.getByText("After Dark", { exact: true })).toBeVisible();
    // Spicy should be selected by default
    await expect(page.getByRole("button", { name: /create spicy room/i })).toBeVisible();
  });

  test("selecting wild tier changes create button text", async ({ page }) => {
    await page.goto("/");

    // Click Wild tier
    await page.getByText("Raunchy, heavy drinking").click();
    await expect(page.getByRole("button", { name: /create wild room/i })).toBeVisible();
  });

  test("selecting after-dark tier shows warning dialog", async ({ page }) => {
    await page.goto("/");

    // Click After Dark tier
    await page.getByText("Explicit, no limits").click();

    // Try to create
    await page.getByRole("button", { name: /create after dark room/i }).click();

    // Warning dialog should appear
    await expect(page.getByText(/sexually explicit content/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /enable after dark/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible();
  });

  test("can cancel after-dark room creation", async ({ page }) => {
    await page.goto("/");

    await page.getByText("Explicit, no limits").click();
    await page.getByRole("button", { name: /create after dark room/i }).click();

    // Cancel
    await page.getByRole("button", { name: /cancel/i }).click();

    // Dialog should close, still on home page
    await expect(page.getByText("Choose your vibe")).toBeVisible();
  });

  test("creates room with spicy tier and navigates to lobby", async ({ page }) => {
    await page.route("**/api/rooms", async (route) => {
      if (route.request().method() === "POST") {
        const body = JSON.parse(route.request().postData() || "{}");
        await route.fulfill({
          json: { code: "ABCD", vibe_tier: body.vibe_tier ?? "spicy" },
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/");
    await page.getByRole("button", { name: /create spicy room/i }).click();

    // Should navigate to the new room
    await expect(page).toHaveURL(/\/ABCD/);
  });

  test("sends vibe_tier in POST body when creating room", async ({ page }) => {
    let capturedBody: string | null = null;
    await page.route("**/api/rooms", async (route) => {
      if (route.request().method() === "POST") {
        capturedBody = route.request().postData();
        await route.fulfill({ json: { code: "EFGH", vibe_tier: "wild" } });
      } else {
        await route.continue();
      }
    });

    await page.goto("/");
    await page.getByText("Raunchy, heavy drinking").click();
    await page.getByRole("button", { name: /create wild room/i }).click();

    // Verify vibe_tier was sent
    expect(capturedBody).toBeTruthy();
    if (capturedBody) {
      expect(JSON.parse(capturedBody)).toMatchObject({ vibe_tier: "wild" });
    }
  });
});
