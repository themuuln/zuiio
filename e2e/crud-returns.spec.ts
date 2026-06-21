import { expect, test } from "@playwright/test";
import { openDrawerByText } from "./helpers";

test.describe("Returns module", () => {
  test("page loads correctly", async ({ page }) => {
    await page.goto("/returns", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Буцаалт").first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("return create drawer opens", async ({ page }) => {
    await page.goto("/returns", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    await openDrawerByText(page, "Шинэ буцаалт");
    await page.waitForTimeout(1000);

    await expect(page.getByText("Буцаалт").first()).toBeVisible({
      timeout: 5000,
    });
  });
});
