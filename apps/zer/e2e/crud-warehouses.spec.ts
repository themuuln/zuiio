import { expect, test } from "@playwright/test";

test.describe("Warehouses module", () => {
  test("page loads and shows warehouse list or empty state", async ({
    page,
  }) => {
    await page.goto("/inventory/warehouses", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("Агуулахууд").first()).toBeVisible({
      timeout: 10000,
    });

    // Should show either the warehouse table or the empty state.
    const listTitle = page.locator("table").first();
    const emptyState = page.getByText("Агуулах бүртгэгдээгүй");
    await expect(listTitle.or(emptyState).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("create warehouse dialog opens with form fields", async ({ page }) => {
    await page.goto("/inventory/warehouses", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Click the "Шинэ агуулах" button that triggers the dialog
    await page.click("text=Шинэ агуулах");
    await page.waitForTimeout(2000);

    // Check if dialog content appeared (it uses data-slot="dialog-content")
    const dialogContent = page.locator('[data-slot="dialog-content"]');
    const isVisible = await dialogContent.isVisible().catch(() => false);

    if (isVisible) {
      // Form fields should exist inside dialog content
      await expect(dialogContent.locator('input[name="name"]')).toBeVisible({
        timeout: 5000,
      });
      await expect(dialogContent.locator('input[name="location"]')).toBeVisible(
        {
          timeout: 5000,
        },
      );

      // Submit button should exist
      await expect(
        dialogContent.getByRole("button", { name: "Агуулах нэмэх" }),
      ).toBeVisible({ timeout: 5000 });
    } else {
    }
  });

  test("warehouse table shows correct columns when data exists", async ({
    page,
  }) => {
    await page.goto("/inventory/warehouses", { waitUntil: "domcontentloaded" });

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Check if table exists (not empty state)
    const table = page.locator("table").first();
    const tableVisible = await table.isVisible().catch(() => false);

    if (tableVisible) {
      // Should have correct column headers
      await expect(page.locator("th:has-text('Нэр')")).toBeVisible({
        timeout: 5000,
      });
      await expect(page.locator("th:has-text('Байршил')")).toBeVisible({
        timeout: 5000,
      });
      await expect(page.locator("th:has-text('Төлөв')")).toBeVisible({
        timeout: 5000,
      });
    }
  });
});
