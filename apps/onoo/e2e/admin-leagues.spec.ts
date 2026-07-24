/**
 * E2E tests for the admin leagues page.
 *
 * The leagues page shows a CRUD table with:
 * - List of leagues (name, sport, created_at)
 * - Create dialog (name, slug, sport select)
 * - Edit dialog (same fields, pre-filled)
 * - Delete button with confirmation
 */

import { mockLeaguesAll, mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";
import { leagueFixture, type LeagueFixture } from "./fixtures";

test.setTimeout(60_000);

test.describe("Admin Leagues", () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabaseREST(page);
    await mockLeaguesAll(page);
    await page.goto("/admin/leagues");
  });

  test.describe("Page Structure", () => {
    test("shows leagues page heading", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Лигууд" }),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("shows add button", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: "Нэмэх" }),
      ).toBeVisible();
    });

    test("shows league table with columns", async ({ page }) => {
      const table = page.getByRole("table");
      await expect(table).toBeVisible({ timeout: 10_000 });

      const headers = table.getByRole("columnheader");
      await expect(headers).toHaveCount(4); // Нэр, Спорт, Үүсгэсэн, Үйлдэл
    });
  });

  test.describe("League List", () => {
    test("displays league data in table rows", async ({ page }) => {
      const rows = page.getByRole("row");
      // Header + 2 league rows
      await expect(rows).toHaveCount(3);
    });

    test("shows league name and sport", async ({ page }) => {
      await expect(
        page.getByRole("cell", { name: "Монголын Үндэсний Лиг" }),
      ).toBeVisible();
      await expect(
        page.getByRole("cell", { name: "Basketball" }),
      ).toBeVisible();
    });

    test("shows edit and delete buttons per row", async ({ page }) => {
      // Each row should have Засах and Устгах buttons
      const editButtons = page.getByRole("button", { name: "Засах" });
      const deleteButtons = page.getByRole("button", { name: "Устгах" });

      await expect(editButtons.first()).toBeVisible();
      await expect(deleteButtons.first()).toBeVisible();
    });

    test("shows empty state when no leagues", async ({ page }) => {
      await page.route("**/admin/api/leagues", (route) => {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      });

      await page.reload();
      await page.waitForTimeout(1000);

      await expect(
        page.getByText("Лиг байхгүй байна"),
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Create League", () => {
    test("opens create dialog on add button click", async ({ page }) => {
      await page.getByRole("button", { name: "Нэмэх" }).click();
      await expect(
        page.getByRole("dialog"),
      ).toBeVisible();

      await expect(
        page.getByRole("heading", { name: "Лиг нэмэх" }),
      ).toBeVisible();
    });

    test("displays form fields in create dialog", async ({ page }) => {
      await page.getByRole("button", { name: "Нэмэх" }).click();

      await expect(page.getByLabel("Нэр")).toBeVisible();
      await expect(page.getByLabel("Slug")).toBeVisible();
      await expect(page.getByLabel("Спорт")).toBeVisible();
    });

    test("creates league on form submit", async ({ page }) => {
      await page.getByRole("button", { name: "Нэмэх" }).click();
      await page.waitForTimeout(500);

      // Fill in fields
      await page.getByLabel("Нэр").fill("Шинэ Лиг");
      await page.getByLabel("Slug").fill("shine-lig");

      // Open sport select and pick an option
      await page.getByLabel("Спорт").click();
      await page.waitForTimeout(300);

      const sportOption = page.getByRole("option", { name: "Basketball" });
      await sportOption.click();

      // Submit
      await page.getByRole("button", { name: "Үүсгэх" }).click();

      // Should show success toast
      await expect(
        page.getByText("амжилттай үүсгэлээ"),
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Edit League", () => {
    test("opens edit dialog with pre-filled data", async ({ page }) => {
      await page.getByRole("button", { name: "Засах" }).first().click();
      await page.waitForTimeout(500);

      await expect(
        page.getByRole("heading", { name: "Лиг засах" }),
      ).toBeVisible();
    });

    test("edits league on form submit", async ({ page }) => {
      await page.getByRole("button", { name: "Засах" }).first().click();
      await page.waitForTimeout(500);

      // Modify Name
      const nameInput = page.getByLabel("Нэр");
      await nameInput.clear();
      await nameInput.fill("Шинэчилсэн Лиг");

      // Submit
      await page.getByRole("button", { name: "Шинэчлэх" }).click();

      await expect(
        page.getByText("амжилттай шинэчлэлээ"),
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Delete League", () => {
    test("shows confirmation dialog on delete", async ({ page }) => {
      // Mock window.confirm to accept
      page.on("dialog", (dialog) => dialog.accept());

      await page.getByRole("button", { name: "Устгах" }).first().click();

      await expect(
        page.getByText("устгагдлаа"),
      ).toBeVisible({ timeout: 10_000 });
    });
  });
});
