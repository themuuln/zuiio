/**
 * E2E tests for the admin dashboard page.
 *
 * The dashboard shows:
 * - A heading "Хянах цэс"
 * - A badge with scheduled game count
 * - A "Баталгаажуулах тоглолтууд" (pending review) card with a table
 * - Games with status "final_pending_review" appear in the table
 */

import { mockAdminAll, mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";
import { gameFixture, gameListFixture } from "./fixtures";

test.setTimeout(60_000);

test.describe("Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabaseREST(page);
    await mockAdminAll(page);
    await page.goto("/admin");
  });

  test.describe("Page Structure", () => {
    test("shows dashboard heading", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Хянах цэс" }),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("shows scheduled games badge when there are scheduled games", async ({ page }) => {
      // By default, mock data has 1 scheduled game
      const badge = page.getByText("товлосон тоглолт");
      await expect(badge).toBeVisible({ timeout: 10_000 });
    });

    test("shows pending review section title", async ({ page }) => {
      await expect(
        page.getByText("Баталгаажуулах тоглолтууд"),
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Pending Games Table", () => {
    test("shows games table with columns", async ({ page }) => {
      const table = page.getByRole("table");
      await expect(table).toBeVisible({ timeout: 10_000 });

      // Check header columns
      const headers = table.getByRole("columnheader");
      await expect(headers).toHaveCount(3);
    });

    test("shows pending review games in table", async ({ page }) => {
      // With fixture data, there's 1 final_pending_review game
      // The table should show team names and status
      const table = page.getByRole("table");
      await expect(table).toBeVisible();

      // Verify status badge for pending review game
      const pendingBadge = page.getByText("final_pending_review");
      await expect(pendingBadge).toBeVisible();
    });

    test("each game row links to game detail page", async ({ page }) => {
      const table = page.getByRole("table");
      await expect(table).toBeVisible();

      // Click the first game link (team names are clickable links)
      const gameLink = table.getByRole("link").first();
      await expect(gameLink).toBeVisible();
      await gameLink.click();

      // Should navigate to game detail
      await page.waitForURL("**/admin/games/**");
    });
  });

  test.describe("Empty State", () => {
    test("shows empty message when no games are pending review", async ({ page }) => {
      // Override to return no games
      await page.route("**/admin/api/games", (route) => {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            gameFixture({ status: "scheduled" }),
            gameFixture({ status: "official" }),
          ]),
        });
      });

      await page.reload();
      await page.waitForTimeout(1000);

      await expect(
        page.getByText("Баталгаажуулах тоглолт алга байна"),
      ).toBeVisible({ timeout: 10_000 });
    });
  });
});
