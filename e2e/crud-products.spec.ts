import { expect, test } from "@playwright/test";
import { openDrawerByText } from "./helpers";

test.describe("Products module", () => {
  test("create drawer renders all form fields", async ({ page }) => {
    await page.goto("/products", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await openDrawerByText(page, "Шинэ бүтээгдэхүүн");
    await expect(page.locator("#name")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#sku")).toBeVisible();
    await expect(page.locator("#cost_price")).toBeVisible();
    await expect(page.locator("#sale_price")).toBeVisible();
    await expect(page.locator("#current_stock")).toBeVisible();
    await expect(page.locator("#min_stock")).toBeVisible();
    await expect(page.getByTestId("create-product-submit")).toBeVisible();
  });

  test("page loads correctly", async ({ page }) => {
    await page.goto("/products", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Бүтээгдэхүүн").first()).toBeVisible({
      timeout: 15000,
    });
  });
});
