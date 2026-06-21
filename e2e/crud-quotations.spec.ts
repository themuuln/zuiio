import { expect, test } from "@playwright/test";
import { openDrawerByText } from "./helpers";

test.describe("Quotations module", () => {
  test("page loads correctly", async ({ page }) => {
    await page.goto("/quotations", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Үнийн санал").first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("quotation create drawer opens", async ({ page }) => {
    await page.goto("/quotations", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    await openDrawerByText(page, "Шинэ санал");
    await page.waitForTimeout(1000);

    await expect(page.getByText("Үнийн санал").first()).toBeVisible({
      timeout: 5000,
    });
  });
});
