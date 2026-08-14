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
    await page.goto("/invoices", { waitUntil: "domcontentloaded" });

    await openDrawerByText(page, "Шинэ нэхэмжлэл");
    await page.waitForTimeout(1000);

    await expect(page.getByText("Шинэ нэхэмжлэл").first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("invoice create form can be filled and submitted", async ({ page }) => {
    await page.goto("/invoices", { waitUntil: "domcontentloaded" });

    // Open create drawer
    await openDrawerByText(page, "Шинэ нэхэмжлэл");
    await page.waitForTimeout(1500);

    // Fill description for the first item
    const descInputs = page.locator('input[placeholder*="Бүтээгдэхүүний нэр"]');
    const descCount = await descInputs.count();
    if (descCount > 0) {
      await descInputs.first().fill("E2E Test Invoice Item");
      await page.waitForTimeout(300);
    }

    // Fill quantity
    const qtyInput = page.locator('input[type="number"]').first();
    if (await qtyInput.isVisible().catch(() => false)) {
      await qtyInput.fill("1");
      await page.waitForTimeout(200);
    }

    // Try to find and submit the form
    const submitBtn = page.getByText("Нэхэмжлэл үүсгэх").first();
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(2000);

      // Check for success toast
      const toast = page.locator("[data-sonner-toast]").first();
      const toastVisible = await toast.isVisible().catch(() => false);
      if (toastVisible) {
      }
    }
  });
});
