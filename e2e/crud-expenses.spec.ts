import { expect, test } from "@playwright/test";
import { openDrawerByText } from "./helpers";

test.describe("Expenses module", () => {
  test("create drawer opens and shows form", async ({ page }) => {
    await page.goto("/expenses", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await openDrawerByText(page, "Шинэ зарлага");
    await expect(page.locator('input[name="amount"]').first()).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.locator('input[name="description"]').first(),
    ).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("page loads and shows shell", async ({ page }) => {
    await page.goto("/expenses", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Зарлага").first()).toBeVisible({
      timeout: 15000,
    });
  });
});
