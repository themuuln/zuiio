import { expect, test } from "@playwright/test";

test.describe("Open Graph images", () => {
  test("player OG image returns PNG", async ({ page }) => {
    await page.goto("/players");
    const playerLink = page.locator("a[href*='/players/']").first();
    if (await playerLink.isVisible()) {
      const href = await playerLink.getAttribute("href");
      const playerId = href?.split("/").pop();
      const response = await page.goto(`/players/${playerId}/opengraph-image`);
      expect(response?.status()).toBe(200);
      expect(response?.headers()["content-type"]).toBe("image/png");
    }
  });

  test("team OG image returns PNG", async ({ page }) => {
    await page.goto("/teams");
    const teamLink = page.locator("a[href*='/teams/']").first();
    if (await teamLink.isVisible()) {
      const href = await teamLink.getAttribute("href");
      const slug = href?.split("/").pop();
      const response = await page.goto(`/teams/${slug}/opengraph-image`);
      expect(response?.status()).toBe(200);
      expect(response?.headers()["content-type"]).toBe("image/png");
    }
  });

  test("game OG image returns PNG", async ({ page }) => {
    await page.goto("/games");
    const gameLink = page.locator("a[href*='/games/']").first();
    if (await gameLink.isVisible()) {
      const href = await gameLink.getAttribute("href");
      const gameId = href?.split("/").pop();
      const response = await page.goto(`/games/${gameId}/opengraph-image`);
      expect(response?.status()).toBe(200);
      expect(response?.headers()["content-type"]).toBe("image/png");
    }
  });

  test("meta tag contains og:image on player page", async ({ page }) => {
    await page.goto("/players");
    const playerLink = page.locator("a[href*='/players/']").first();
    if (await playerLink.isVisible()) {
      const href = await playerLink.getAttribute("href");
      await page.goto(href!);
      const ogImage = page.locator('meta[property="og:image"]');
      await expect(ogImage).toBeVisible();
      const content = await ogImage.getAttribute("content");
      expect(content).toContain("opengraph-image");
    }
  });
});
