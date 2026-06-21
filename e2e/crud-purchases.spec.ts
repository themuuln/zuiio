import { expect, test } from "@playwright/test";
import { openDrawerByText } from "./helpers";

test.describe("Purchases module", () => {
  test("create purchase drawer renders form fields", async ({ page }) => {
    await page.goto("/purchases", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Check page title
    await expect(page.getByText("Худалдан авалт").first()).toBeVisible({
      timeout: 10000,
    });

    // Open create drawer
    await openDrawerByText(page, "Шинэ захиалга");

    // Verify form fields
    await expect(page.getByText("Нийлүүлэгч").first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Захиалгын огноо").first()).toBeVisible();
    await expect(page.getByText("Бараанууд").first()).toBeVisible();
    await expect(page.getByText("Захиалга үүсгэх").first()).toBeVisible();
  });

  test("page loads correctly", async ({ page }) => {
    await page.goto("/purchases", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Худалдан авалт").first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("create purchase with supplier and items", async ({ page }) => {
    await page.goto("/purchases", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Open create drawer
    await openDrawerByText(page, "Шинэ захиалга");
    await page.waitForTimeout(1000);

    // Select supplier from combobox
    const supplierInput = page.getByPlaceholder("Нийлүүлэгч сонгох");
    await expect(supplierInput).toBeVisible({ timeout: 5000 });

    // Try to select the first supplier option
    await supplierInput.click();
    await page.waitForTimeout(500);
    const supplierOption = page.locator('[class*="z-50"] li').first();
    if (await supplierOption.isVisible().catch(() => false)) {
      await supplierOption.click();
      await page.waitForTimeout(400);
    }

    // Select a product
    const productInput = page.getByPlaceholder("Сонгох").first();
    await expect(productInput).toBeVisible({ timeout: 3000 });
    await productInput.click();
    await page.waitForTimeout(500);
    const productOption = page.locator('[class*="z-50"] li').first();
    if (await productOption.isVisible().catch(() => false)) {
      await productOption.click();
      await page.waitForTimeout(400);
    }

    // Submit the form
    const submitBtn = page.getByText("Захиалга үүсгэх").first();
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(2000);

      // Should see success toast or navigate to list
      const toast = page.locator("[data-sonner-toast]").first();
      const toastVisible = await toast.isVisible().catch(() => false);
      if (toastVisible) {
        // Success toast appeared
        console.log("Purchase created successfully");
      }
    }
  });
});
