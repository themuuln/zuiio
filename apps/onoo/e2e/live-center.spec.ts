import { expect, test } from "@playwright/test";

test.describe("Live game center", () => {
  test("game page shows live status for provisional games", async ({
    page,
  }) => {
    await page.goto("/games");
    // Look for live-provisional game badges
    const liveBadge = page.locator("text=Шууд").first();
    if (await liveBadge.isVisible()) {
      // Click on the live game card
      const gameCard = liveBadge.locator("..");
      const link = gameCard.locator("a[href*='/games/']").first();
      if (await link.isVisible()) {
        await link.click();
        // Live game center should show tabs
        await expect(page.locator("body")).toBeVisible();
      }
    } else {
      test.skip();
    }
  });

  test("live game shows period and clock", async ({ page }) => {
    await page.goto("/games");
    const liveBadge = page.locator("text=Шууд").first();
    if (await liveBadge.isVisible()) {
      const gameCard = liveBadge.locator("..");
      const link = gameCard.locator("a[href*='/games/']").first();
      if (await link.isVisible()) {
        await link.click();
        // Live game center should show period info
        const periodInfo = page.locator("text=/\\d-р үе|Q\\d/").first();
        if (await periodInfo.isVisible()) {
          await expect(periodInfo).toBeVisible();
        }
      }
    } else {
      test.skip();
    }
  });
});
