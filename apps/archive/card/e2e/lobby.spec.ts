import { test, expect, type Page } from "@playwright/test";

/** Helpers */

const VALID_ROOM = {
  id: "room-1",
  code: "ABCD",
  game_state: "lobby",
  max_players: 8,
  host_session_id: "sess-1",
  created_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 86_400_000).toISOString(),
  current_game_id: null,
};

const HOST_PLAYER = {
  id: "player-1",
  display_name: "Alice",
  avatar_emoji: "🦊",
  is_host: true,
  is_spectator: false,
  joined_at: new Date().toISOString(),
};

const OTHER_PLAYER = {
  id: "player-2",
  display_name: "Bob",
  avatar_emoji: "🐼",
  is_host: false,
  is_spectator: false,
  joined_at: new Date().toISOString(),
};

async function mockRoomApi(page: Page, room = VALID_ROOM, status = 200) {
  await page.route("**/api/rooms/ABCD", async (route) => {
    if (status === 200) {
      await route.fulfill({ json: room });
    } else {
      await route.fulfill({ status, body: "{}" });
    }
  });
}

async function mockMeApi(page: Page, player: typeof HOST_PLAYER | null) {
  await page.route("**/api/rooms/ABCD/me", async (route) => {
    await route.fulfill({ json: { player } });
  });
}

async function mockPlayersApi(page: Page, players: typeof HOST_PLAYER[]) {
  await page.route("**/api/rooms/ABCD/players", async (route) => {
    await route.fulfill({ json: { players } });
  });
}

async function mockCreateRoom(page: Page, code = "ABCD") {
  await page.route("**/api/rooms", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({ json: { code } });
    } else {
      await route.continue();
    }
  });
}

async function mockJoinRoom(page: Page) {
  await page.route("**/api/rooms/ABCD/join", async (route) => {
    if (route.request().method() === "POST") {
      const body = JSON.parse(route.request().postData() || "{}");
      const displayName = body.displayName || "";
      if (displayName.length < 2) {
        await route.fulfill({
          status: 400,
          json: { error: "Display name must be at least 2 characters" },
        });
      } else {
        await route.fulfill({
          status: 200,
          json: { player: HOST_PLAYER },
        });
      }
    } else {
      await route.continue();
    }
  });
}

// Block Supabase Realtime connections since they won't work in test
async function blockSupabase(page: Page) {
  await page.route("**/*.supabase.co/**", async (route) => {
    await route.abort();
  });
}

test.describe("Lobby — Join flow", () => {
  test.beforeEach(async ({ page }) => {
    await blockSupabase(page);
    await mockRoomApi(page);
    await mockPlayersApi(page, [HOST_PLAYER]);
    await mockJoinRoom(page);
  });

  test("shows join form when user has no session", async ({ page }) => {
    await mockMeApi(page, null);
    await page.goto("/ABCD");

    await expect(page.getByText("Join Room")).toBeVisible();
    await expect(
      page.getByText(/Enter your name to join/)
    ).toBeVisible();
    await expect(page.getByPlaceholder("Your display name")).toBeVisible();
    await expect(page.getByRole("button", { name: "Join" })).toBeVisible();
  });

  test("shows validation error for empty display name", async ({ page }) => {
    await mockMeApi(page, null);
    await page.goto("/ABCD");

    await page.getByRole("button", { name: "Join" }).click();
    await expect(page.getByText("Display name is required")).toBeVisible();
  });

  test("shows validation error for too-short display name", async ({ page }) => {
    await mockMeApi(page, null);
    await page.goto("/ABCD");

    await page.getByPlaceholder("Your display name").fill("A");
    await page.getByRole("button", { name: "Join" }).click();
    await expect(
      page.getByText("Display name must be at least 2 characters")
    ).toBeVisible();
  });

  test("shows API error when join fails", async ({ page }) => {
    // Override the mock to reject
    await page.route("**/api/rooms/ABCD/join", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 400,
          json: { error: "Room is full" },
        });
      } else {
        await route.continue();
      }
    });

    await mockMeApi(page, null);
    await page.goto("/ABCD");

    await page.getByPlaceholder("Your display name").fill("Alice");
    await page.getByRole("button", { name: "Join" }).click();
    await expect(page.getByText("Room is full")).toBeVisible();
  });
});

test.describe("Lobby — Ready state", () => {
  test.beforeEach(async ({ page }) => {
    await blockSupabase(page);
    await mockRoomApi(page);
    await mockMeApi(page, HOST_PLAYER);
    await mockPlayersApi(page, [HOST_PLAYER]);
  });

  test("shows lobby UI for authenticated player", async ({ page }) => {
    await page.goto("/ABCD");

    // Room code display
    await expect(page.getByLabel("Copy room code")).toBeVisible();
    await expect(page.getByText("ABCD")).toBeVisible();

    // Player list shows the host
    await expect(page.getByText("Alice")).toBeVisible();
    await expect(page.getByText("Host")).toBeVisible();

    // Share button
    await expect(page.getByRole("button", { name: /share/i })).toBeVisible();

    // Not enough players for "Pick a Game" (only 1)
    await expect(page.getByRole("button", { name: /pick a game/i })).not.toBeVisible();
  });

  test("shows Pick a Game when host has 2+ players", async ({ page }) => {
    await mockPlayersApi(page, [HOST_PLAYER, OTHER_PLAYER]);
    await page.goto("/ABCD");

    await expect(page.getByText("Alice")).toBeVisible();
    await expect(page.getByText("Bob")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /pick a game/i })
    ).toBeVisible();
  });

  test("allows host to transfer host role to another player", async ({ page }) => {
    await mockPlayersApi(page, [HOST_PLAYER, OTHER_PLAYER]);

    // Mock transfer endpoint
    await page.route("**/api/rooms/ABCD/transfer-host", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto("/ABCD");

    // Click "Make Host" button
    await page.getByTitle("Transfer host role").click();
    await expect(page.getByRole("button", { name: "Confirm" })).toBeVisible();

    // Click Confirm
    await page.getByRole("button", { name: "Confirm" }).click();
    // Should not show error
    await expect(page.getByText("Failed to transfer")).not.toBeVisible();
    // The confirm buttons should be replaced by the original "Make Host" button
    await expect(page.getByTitle("Transfer host role")).toBeVisible();
  });

  test("allows host to remove a player", async ({ page }) => {
    await mockPlayersApi(page, [HOST_PLAYER, OTHER_PLAYER]);

    // Mock remove endpoint
    await page.route("**/api/rooms/ABCD/players/**", async (route) => {
      if (route.request().method() === "DELETE") {
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto("/ABCD");

    // Click "Remove" button
    await page.getByTitle("Remove player").click();
    await expect(
      page.getByRole("button", { name: "Confirm" })
    ).toBeVisible();

    // Click Confirm
    await page.getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByText("Failed to remove")).not.toBeVisible();
    // After confirmation, the "Remove" button should reappear
    await expect(page.getByTitle("Remove player")).toBeVisible();
  });
});

test.describe("Lobby — Error states", () => {
  test("shows not found for 404 rooms", async ({ page }) => {
    await blockSupabase(page);
    await mockRoomApi(page, VALID_ROOM, 404);
    await page.goto("/ABCD");

    await expect(page.getByText("Room not found")).toBeVisible();
    await expect(
      page.getByText(/The code may be incorrect/)
    ).toBeVisible();
  });

  test("shows expired for 410 rooms", async ({ page }) => {
    await blockSupabase(page);
    await mockRoomApi(page, VALID_ROOM, 410);
    await page.goto("/ABCD");

    await expect(
      page.getByRole("heading", { name: "Room has expired" })
    ).toBeVisible();
  });

  test("shows generic error for API failures", async ({ page }) => {
    await blockSupabase(page);
    await mockRoomApi(page, VALID_ROOM, 500);
    await page.goto("/ABCD");

    await expect(
      page.getByRole("heading", { name: "Something went wrong" })
    ).toBeVisible();
  });
});

test.describe("Home → Create room flow", () => {
  test("create room button navigates to new room", async ({ page }) => {
    await blockSupabase(page);
    await mockCreateRoom(page);

    await page.goto("/");

    // Click Create Room
    await page.getByRole("button", { name: /create room/i }).click();

    // Should navigate to the new room's lobby
    await expect(page).toHaveURL(/\/ABCD/);
  });
});
