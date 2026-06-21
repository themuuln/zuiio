import { expect, test } from "@playwright/test";
import { openDrawerByText } from "./helpers";

test.describe("Invoices module", () => {
  test("page loads correctly", async ({ page }) => {
    await page.goto("/invoices", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Нэхэмжлэл").first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("invoice create drawer opens", async ({ page }) => {
    await page.goto("/invoices", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    await openDrawerByText(page, "Шинэ нэхэмжлэл");
    await page.waitForTimeout(1000);

    await expect(page.getByText("Шинэ нэхэмжлэл").first()).toBeVisible({
      timeout: 5000,
    });
  });
});
