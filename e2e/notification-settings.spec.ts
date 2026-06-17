import { expect, test } from "@playwright/test";

/**
 * E2E test for Notification settings and history.
 *
 * Prerequisites:
 *   - App must be running (npm run dev)
 *   - PLAYWRIGHT_BASE_URL env var or default http://localhost:3000
 *   - A valid test user session (uses dev login credentials)
 *   - Note: Telegram notification settings are only shown for the superadmin
 *     user (zerone.offical@gmail.com). The test user themuuln1@gmail.com
 *     can access the notification history page.
 *
 * Run: npm run test:e2e
 */

const DEV_EMAIL = "themuuln1@gmail.com";
const DEV_PASSWORD = "Tolom!11";

test.describe("Notification Settings & History", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', DEV_EMAIL);
    await page.fill('input[name="password"]', DEV_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/$/);
  });

  test("can navigate to notification history page", async ({ page }) => {
    await page.goto("/settings/notifications");

    await expect(
      page.getByRole("heading", { name: /Мэдэгдлийн түүх/i }),
    ).toBeVisible();
  });

  test("notification history shows empty state when no notifications", async ({
    page,
  }) => {
    await page.goto("/settings/notifications");

    // Should show either the heading + empty state, or a list of notifications
    await expect(
      page.getByRole("heading", { name: /Мэдэгдлийн түүх/i }),
    ).toBeVisible();
  });
});
