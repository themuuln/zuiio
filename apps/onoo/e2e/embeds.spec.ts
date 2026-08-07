import { expect, test } from "@playwright/test";

test.describe("Embed widgets", () => {
  test("embed game page loads without nav", async ({ page }) => {
    await page.goto("/games");
    // Find a game link and construct embed URL
    const gameLink = page.locator("a[href*='/games/']").first();
    if (await gameLink.isVisible()) {
      const href = await gameLink.getAttribute("href");
      const gameId = href?.split("/").pop();
      await page.goto(`/embed/game/${gameId}`);
      await expect(page.locator("body")).toBeVisible();
      // Embed should NOT have site nav
      await expect(page.locator("nav")).toHaveCount(0);
      // Should have the onoo.mn attribution link
      await expect(page.locator("a[href*='onoo.mn']")).toBeVisible();
    }
  });

  test("embed player page loads without nav", async ({ page }) => {
    await page.goto("/players");
    const playerLink = page.locator("a[href*='/players/']").first();
    if (await playerLink.isVisible()) {
      const href = await playerLink.getAttribute("href");
      const playerId = href?.split("/").pop();
      await page.goto(`/embed/player/${playerId}`);
      await expect(page.locator("body")).toBeVisible();
      await expect(page.locator("nav")).toHaveCount(0);
      await expect(page.locator("a[href*='onoo.mn']")).toBeVisible();
    }
  });
});
