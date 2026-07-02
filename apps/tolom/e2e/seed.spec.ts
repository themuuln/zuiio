import { test } from "@playwright/test";

test.describe("Seed", () => {
  test("navigate to bay view", async ({ page }) => {
    await page.goto("/dashboard/bay-view");
  });
});
