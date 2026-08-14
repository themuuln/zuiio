import { expect, test } from "@playwright/test";

/**
 * Visual regression tests using Playwright's built-in toHaveScreenshot().
 *
 * Run: npx playwright test --project=visual
 * Update baselines: npx playwright test --project=visual --update-snapshots
 *
 * Baselines are stored in __screenshots__/ directories next to this file.
 * Commit them to git. On intentional UI changes, update with --update-snapshots.
 */

test.describe("Visual — key pages", () => {
  test("dashboard page renders correctly @visual", async ({ page }) => {
    await page.goto("/dashboard");
    // Wait for lazy-loaded content to settle
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500); // let animations finish
    await expect(page).toHaveScreenshot("dashboard.png", {
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
    });
  });

  test("products list renders correctly @visual", async ({ page }) => {
    await page.goto("/products");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("products-list.png", {
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
    });
  });
});
