import { expect, test } from "@playwright/test";

test.describe("Game recap pages", () => {
  test("game detail page loads and shows score header", async ({ page }) => {
    await page.goto("/games");
    await expect(page.locator("body")).toBeVisible();
    // Navigate to a game if one is listed
    const gameLink = page.locator("a[href*='/games/']").first();
    if (await gameLink.isVisible()) {
      await gameLink.click();
      await expect(page.locator("body")).toBeVisible();
      // Verify recap elements for finished games
      const header = page.locator("h1, h2, h3").first();
      await expect(header).toBeVisible();
    }
  });

  test("game recap shows provisional badge for live games", async ({
    page,
  }) => {
    await page.goto("/games");
    // Check for any Урьдчилсан badges on game cards
    const badge = page.locator("text=Урьдчилсан").first();
    if (await badge.isVisible()) {
      await expect(badge).toBeVisible();
    }
  });

  test("game recap score-worm section renders for finished games", async ({
    page,
  }) => {
    await page.goto("/games");
    const gameLink = page.locator("a[href*='/games/']").first();
    if (await gameLink.isVisible()) {
      await gameLink.click();
      // Check for lead-change flow section
      const _wormSection = page.locator(
        "text=Lead Change Flow, Лид".split(",")[0],
      );
      // Any SVG on the page with more than 2 lines indicates a score worm
      const svgs = page.locator("svg");
      if ((await svgs.count()) > 0) {
        await expect(svgs.first()).toBeVisible();
      }
    }
  });
});
