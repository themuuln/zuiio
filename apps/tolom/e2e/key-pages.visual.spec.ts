import { expect, test } from "@playwright/test";

test.describe("Visual — key pages", () => {
  test("home page renders @visual", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("home.png", {
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
    });
  });

  test("dashboard page renders @visual", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("dashboard.png", {
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
    });
  });
});
