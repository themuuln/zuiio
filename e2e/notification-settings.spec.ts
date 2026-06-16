import { expect, test } from "@playwright/test";

/**
 * E2E test for Telegram notification settings.
 *
 * Prerequisites:
 *   - App must be running (npm run dev)
 *   - PLAYWRIGHT_BASE_URL env var or default http://localhost:3000
 *   - A valid test user session (uses dev login credentials)
 *
 * Run: npm run test:e2e
 */

const DEV_EMAIL = "themuuln1@gmail.com";
const DEV_PASSWORD = "Tolom!11";

test.describe("Telegram Notification Settings", () => {
  test.beforeEach(async ({ page }) => {
    // Login as dev user before each test
    await page.goto("/login");
    await page.fill('input[name="email"]', DEV_EMAIL);
    await page.fill('input[name="password"]', DEV_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/$/);
  });

  test("renders notification settings card on settings page", async ({
    page,
  }) => {
    await page.goto("/settings");

    // Should see Telegram notification card
    await expect(
      page.getByRole("heading", { name: /Telegram мэдэгдэхүүн/i }),
    ).toBeVisible();

    // Should see the enable/disable switch
    await expect(page.getByText(/Мэдэгдэхүүн идэвхжүүлэх/i)).toBeVisible();

    // Should see Bot Token and Chat ID fields
    await expect(page.getByLabel("Bot Token")).toBeVisible();
    await expect(page.getByLabel("Chat ID")).toBeVisible();

    // Should see event type checkboxes
    await expect(page.getByText(/Бага нөөц/i)).toBeVisible();
    await expect(page.getByText(/Шинэ борлуулалт/i)).toBeVisible();
    await expect(page.getByText(/Өдрийн тойм/i)).toBeVisible();

    // Should have Save button
    await expect(page.getByRole("button", { name: /Хадгалах/i })).toBeVisible();
  });

  test("can toggle notification enabled switch", async ({ page }) => {
    await page.goto("/settings");

    const switchButton = page.locator('button[role="switch"]');
    await switchButton.click();

    // Toggle back again
    await switchButton.click();
  });

  test("can toggle event type checkboxes", async ({ page }) => {
    await page.goto("/settings");

    // Uncheck "Шинэ борлуулалт" checkbox
    const newSaleCheckbox = page.getByLabel("Шинэ борлуулалт");
    await newSaleCheckbox.click();

    // Should still be interactive
    await newSaleCheckbox.click();
  });

  test("has link to notification history", async ({ page }) => {
    await page.goto("/settings");

    const historyLink = page.getByRole("link", { name: /Мэдэгдлийн түүх/i });
    await expect(historyLink).toBeVisible();
    await expect(historyLink).toHaveAttribute(
      "href",
      "/settings/notifications",
    );
  });

  test("can navigate to notification history page", async ({ page }) => {
    await page.goto("/settings/notifications");

    await expect(
      page.getByRole("heading", { name: /Мэдэгдлийн түүх/i }),
    ).toBeVisible();
  });
});
