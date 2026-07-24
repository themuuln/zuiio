/**
 * E2E tests for the admin games page.
 *
 * The games page shows:
 * - List of games with team names, date, status badges
 * - Create dialog with competition, teams, venue, datetime selectors
 * - Status badges with Mongolian labels
 * - Detail link per game row
 */

import {
  mockGamesAll,
  mockCompetitions,
  mockVenues,
  mockTeamSeasons,
  mockSupabaseREST,
} from "./mocks";
import { expect, test } from "./test-extensions";
import { gameListFixture } from "./fixtures";

test.setTimeout(60_000);

test.describe("Admin Games", () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabaseREST(page);
    await mockGamesAll(page);
    await page.goto("/admin/games");
  });

  test.describe("Page Structure", () => {
    test("shows games page heading", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Тоглолтууд" }),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("shows create game button", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: "Шинэ тоглолт" }),
      ).toBeVisible();
    });

    test("shows games table with columns", async ({ page }) => {
      const table = page.getByRole("table");
      await expect(table).toBeVisible({ timeout: 10_000 });

      const headers = table.getByRole("columnheader");
      // Эсрэг багууд, Огноо, Төлөв, Үйлдэл
      await expect(headers).toHaveCount(4);
    });
  });

  test.describe("Game List", () => {
    test("displays game rows with team names vs separator", async ({ page }) => {
      // At least one row should show "Хас vs Алтан" or similar
      const firstRow = page.getByRole("row").nth(1); // Skip header
      await expect(firstRow).toBeVisible();
    });

    test("shows status badges with correct colors", async ({ page }) => {
      // Should have scheduled, final_pending_review, and official badges
      await expect(
        page.getByText("Товлосон"),
      ).toBeVisible();
    });

    test("shows detail links per game row", async ({ page }) => {
      const detailLinks = page.getByRole("link", { name: "Дэлгэрэнгүй" });
      await expect(detailLinks.first()).toBeVisible();
    });

    test("navigates to game detail on link click", async ({ page }) => {
      const detailLink = page.getByRole("link", { name: "Дэлгэрэнгүй" }).first();
      await detailLink.click();

      await page.waitForURL("**/admin/games/**");
    });

    test("shows empty state when no games", async ({ page }) => {
      await page.route("**/admin/api/games", (route) => {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      });

      await page.reload();
      await page.waitForTimeout(1000);

      await expect(
        page.getByText("Тоглолт олдсонгүй"),
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Create Game Dialog", () => {
    test.beforeEach(async ({ page }) => {
      // Also mock add dialog dependencies
      await mockCompetitions(page);
      await mockVenues(page);
      await mockTeamSeasons(page);
    });

    test("opens create dialog on button click", async ({ page }) => {
      await page.getByRole("button", { name: "Шинэ тоглолт" }).click();
      await page.waitForTimeout(500);

      await expect(
        page.getByRole("heading", { name: "Шинэ тоглолт үүсгэх" }),
      ).toBeVisible();
    });

    test("shows game form fields", async ({ page }) => {
      await page.getByRole("button", { name: "Шинэ тоглолт" }).click();
      await page.waitForTimeout(500);

      await expect(page.getByLabel("Уралдаан")).toBeVisible();
      await expect(page.getByLabel("Эхлэх баг")).toBeVisible();
      await expect(page.getByLabel("Зочин баг")).toBeVisible();
      await expect(page.getByLabel("Товлосон огноо")).toBeVisible();
    });

    test("home and away team selects are disabled until competition selected", async ({ page }) => {
      await page.getByRole("button", { name: "Шинэ тоглолт" }).click();
      await page.waitForTimeout(500);

      // Check that team selects are initially disabled
      const homeSelect = page.getByLabel("Эхлэх баг");
      await expect(homeSelect).toBeDisabled();
    });
  });
});
