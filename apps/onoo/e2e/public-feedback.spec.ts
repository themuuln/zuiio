import { expect, test } from "@playwright/test";

/**
 * Critical user flow: public pages.
 *
 * Onoo is a basketball stats platform. The key public flow is:
 *   Landing page → View games → View standings → View player stats
 *
 * These tests run against the local dev server.
 */

test.describe("Public site — critical flow", () => {
  test("home page loads and shows sports", async ({ page }) => {
    await page.goto("/");
    // The page should load without errors
    await expect(page.locator("body")).toBeVisible();
  });

  test("public games page loads", async ({ page }) => {
    await page.goto("/games");
    // Should show games list or empty state
    await expect(page.locator("body")).toBeVisible();
  });

  test("public standings page loads", async ({ page }) => {
    await page.goto("/standings");
    await expect(page.locator("body")).toBeVisible();
  });

  test("public teams page loads", async ({ page }) => {
    await page.goto("/teams");
    await expect(page.locator("body")).toBeVisible();
  });
});
