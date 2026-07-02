import { expect, test } from "@playwright/test";

test.describe("Brand Presets settings", () => {
  test("page loads and shows brand presets", async ({ page }) => {
    await page.goto("/settings/presets", { waitUntil: "domcontentloaded" });

    // Page title should render
    await expect(page.getByText("Брэнд сан").first()).toBeVisible({
      timeout: 10000,
    });

    // Should show either brand cards or descriptive text
    const importedSection = page.getByText("Импортлосон брэндүүд");
    const selectSection = page.getByText("Импортлох брэндээ сонгох");
    const placeholder = page.getByText("тохирсон брэнд загварууд");

    await expect(
      importedSection.or(selectSection).or(placeholder).first(),
    ).toBeVisible({
      timeout: 10000,
    });
  });

  test("brand cards are interactive when presets exist", async ({ page }) => {
    await page.goto("/settings/presets", { waitUntil: "domcontentloaded" });

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Check if selectable brand cards exist (checkboxes with brand names)
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();

    if (checkboxCount > 0) {
      // Should be able to check a brand
      const firstCheckbox = checkboxes.first();
      await firstCheckbox.check();
      await page.waitForTimeout(500);

      // Import button should become active
      const importBtn = page.getByText("Сонгосоныг импортлох").first();
      await expect(importBtn).toBeVisible({ timeout: 5000 });

      // Uncheck
      await firstCheckbox.uncheck();
      await page.waitForTimeout(500);
    }
  });
});
