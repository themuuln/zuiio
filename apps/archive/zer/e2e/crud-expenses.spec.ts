import { expect, test } from "@playwright/test";
import { openDrawerByText } from "./helpers";

test.describe("Expenses module", () => {
  test("create drawer opens and shows form", async ({ page }) => {
    await page.goto("/expenses", { waitUntil: "domcontentloaded" });

    await openDrawerByText(page, "Шинэ зарлага");

    // CurrencyInput renders input[inputmode="decimal"] without a name attribute
    await expect(
      page.locator('input[inputmode="decimal"]').first(),
    ).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('input[name="description"]').first()).toBeVisible(
      { timeout: 5000 },
    );
    await page.keyboard.press("Escape");
  });

  test("page loads and shows shell", async ({ page }) => {
    await page.goto("/expenses", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Зарлага").first()).toBeVisible({
      timeout: 15000,
    });
  });
});
