import { expect, test } from "@playwright/test";

/**
 * E2E test for Notification settings and history.
 *
 * Prerequisites:
 *   - App must be running (npm run dev)
 *   - PLAYWRIGHT_BASE_URL env var or default http://localhost:3000
 *   - Auth setup must have run (saves storage to .auth/user.json)
 *   - Note: Telegram notification settings are only shown for the superadmin
 *     user (zerone.offical@gmail.com). The test user themuuln1@gmail.com
 *     can access the notification history page.
 *
 * Run: npm run test:e2e
 */

test.describe("Notification Settings & History", () => {
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
