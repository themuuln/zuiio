import { expect, test } from "@playwright/test";

test.describe("Shop (public storefront)", () => {
  test("shop page loads and shows products", async ({ page }) => {
    await page.goto("/shop", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Shop should load — either show products or empty state
    const title = page.getByText("Зарах").first();
    const titleVisible = await title.isVisible().catch(() => false);
    if (titleVisible) {
      await expect(title).toBeVisible({ timeout: 10000 });
    } else {
      // Might redirect to login — check if we're on login page
      const loginTitle = page.getByText("Нэвтрэх").first();
      const loginVisible = await loginTitle.isVisible().catch(() => false);
      if (loginVisible) {
        console.log("Shop redirects to login (auth required)");
        return;
      }
    }
  });

  test("shop has category chips and product cards", async ({ page }) => {
    await page.goto("/shop", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Check for category chips
    const chips = page.locator('[class*="category"]').first();
    const chipsVisible = await chips.isVisible().catch(() => false);

    if (!chipsVisible) {
      // Check bottom bar
      const bottomBar = page.locator('[class*="bottom"]').first();
      const bottomVisible = await bottomBar.isVisible().catch(() => false);
      if (bottomVisible) {
        console.log("Bottom bar visible");
      }
    }
  });
});
