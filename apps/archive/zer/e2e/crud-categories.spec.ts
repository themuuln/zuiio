import { expect, test } from "@playwright/test";

test.describe("Categories CRUD", () => {
  test("page loads and shows content", async ({ page }) => {
    await page.goto("/inventory/categories", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Ангилал").first()).toBeVisible({
      timeout: 15000,
    });
  });
});
