import { expect, test } from "@playwright/test";

test.describe("SMTP settings", () => {
  test("page loads and shows SMTP configuration", async ({ page }) => {
    await page.goto("/settings/smtp", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("SMTP тохиргоо").first()).toBeVisible({
      timeout: 10000,
    });

    // Should show SMTP table or empty state
    const tableTitle = page.getByText("SMTP бүртгэлүүд");
    await expect(tableTitle).toBeVisible({ timeout: 10000 });
  });

  test("add SMTP form renders with all fields", async ({ page }) => {
    await page.goto("/settings/smtp", { waitUntil: "domcontentloaded" });

    // Form section should exist
    await expect(page.getByText("Шинэ SMTP бүртгэл нэмэх")).toBeVisible({
      timeout: 10000,
    });

    // All form fields should be present
    await expect(page.locator("#from_email")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#from_name")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#username")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#password")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#host")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#port")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#priority")).toBeVisible({ timeout: 5000 });

    // Submit button should exist
    const submitBtn = page.getByRole("button", { name: "Нэмэх" });
    await expect(submitBtn).toBeVisible({ timeout: 5000 });
  });

  test("SMTP table shows correct columns", async ({ page }) => {
    await page.goto("/settings/smtp", { waitUntil: "domcontentloaded" });

    // Table should have correct column headers
    const table = page.locator("table").first();
    const tableVisible = await table.isVisible().catch(() => false);

    if (tableVisible) {
      await expect(page.locator("th:has-text('Имэйл')")).toBeVisible({
        timeout: 5000,
      });
      await expect(page.locator("th:has-text('Төлөв')")).toBeVisible({
        timeout: 5000,
      });
      await expect(page.locator("th:has-text('Өдрийн тоо')")).toBeVisible({
        timeout: 5000,
      });
      await expect(page.locator("th:has-text('Тэргүүлэх')")).toBeVisible({
        timeout: 5000,
      });
    }
  });
});
