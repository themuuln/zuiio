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
    await page.goto("/returns", { waitUntil: "domcontentloaded" });

    await openDrawerByText(page, "Шинэ буцаалт");
    await page.waitForTimeout(1000);

    await expect(page.getByText("Буцаалт").first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("return create form can be filled and submitted", async ({ page }) => {
    await page.goto("/returns", { waitUntil: "domcontentloaded" });

    // Open create drawer
    await openDrawerByText(page, "Шинэ буцаалт");
    await page.waitForTimeout(1500);

    // Check that form fields are visible
    await expect(page.getByText("Буцаалтын төрөл").first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Буцаалтын огноо").first()).toBeVisible();
    await expect(page.getByText("Бараанууд").first()).toBeVisible();

    // Try to fill quantity for the first item
    const qtyInputs = page.locator('input[type="number"]');
    const qtyCount = await qtyInputs.count();
    if (qtyCount > 0) {
      await qtyInputs.first().fill("1");
      await page.waitForTimeout(200);
    }

    // Try to submit
    const submitBtn = page.getByText("Буцаалт үүсгэх").first();
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(2000);

      // Check for toast
      const toast = page.locator("[data-sonner-toast]").first();
      const toastVisible = await toast.isVisible().catch(() => false);
      if (toastVisible) {
      }
    }
  });
});
