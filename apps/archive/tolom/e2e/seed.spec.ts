import { test } from "./test-extensions";

test.describe("Seed", () => {
  test("navigate to bay view", async ({ page }) => {
    await page.goto("/dashboard/bay-view");
  });
});
