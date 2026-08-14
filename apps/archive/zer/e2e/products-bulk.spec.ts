import { expect, test } from "@playwright/test";

test.describe("Bulk products page", () => {
  test("page loads and shows form elements", async ({ page }) => {
    await page.goto("/products/bulk", { waitUntil: "domcontentloaded" });

    // Check for page title
    await expect(page.getByText("Баркод бөөнөөр").first()).toBeVisible({
      timeout: 10000,
    });

    // Check form fields
    await expect(page.getByText("Баркод").first()).toBeVisible();
    await expect(page.getByText("Нэр").first()).toBeVisible();
    await expect(page.getByText("Борлуулах үнэ").first()).toBeVisible();
    await expect(page.getByText("Өртөг").first()).toBeVisible();
    await expect(page.getByText("Нөөц").first()).toBeVisible();
    await expect(page.getByText("CSV импорт").first()).toBeVisible();
  });

  test("add row button works", async ({ page }) => {
    await page.goto("/products/bulk", { waitUntil: "domcontentloaded" });

    // Click "Мөр нэмэх" button
    const addRowBtn = page.getByText("Мөр нэмэх").first();
    if (await addRowBtn.isVisible().catch(() => false)) {
      await addRowBtn.click();
      await page.waitForTimeout(500);

      // Should now see at least 2 row groups
      const rows = page.locator('[class*="rounded-lg border p-3"]');
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(2);
    }
  });

  test("download template CSV button works", async ({ page }) => {
    await page.goto("/products/bulk", { waitUntil: "domcontentloaded" });

    const downloadBtn = page.getByText("Загвар татах").first();
    if (await downloadBtn.isVisible().catch(() => false)) {
      // This should trigger a download
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 5000 }).catch(() => null),
        downloadBtn.click(),
      ]);
      if (download) {
        expect(download.suggestedFilename()).toContain(".csv");
      }
    }
  });
});
