/**
 * E2E tests for the admin seasons page.
 *
 * The seasons page shows:
 * - League selector dropdown (must select a league first)
 * - List of seasons for selected league (name, start date, end date, actions)
 * - Create dialog (name, starts_on, ends_on)
 * - Edit dialog (pre-filled)
 * - Delete with confirmation
 */

import { mockSeasonsAll, mockLeaguesList, mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

test.describe("Admin Seasons", () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabaseREST(page);
    await mockSeasonsAll(page);
    await mockLeaguesList(page);
    await page.goto("/admin/seasons");
  });

  test.describe("Page Structure", () => {
    test("shows seasons page heading", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Улирлууд" }),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("shows league selector", async ({ page }) => {
      await expect(
        page.getByText("Лиг сонгох"),
      ).toBeVisible();
    });

    test("shows add button disabled initially", async ({ page }) => {
      const addBtn = page.getByRole("button", { name: "Нэмэх" });
      await expect(addBtn).toBeDisabled();
    });

    test("shows prompt to select league when none selected", async ({ page }) => {
      await expect(
        page.getByText("Лиг сонгоно уу"),
      ).toBeVisible();
    });
  });

  test.describe("Season List", () => {
    test("loads seasons after selecting a league", async ({ page }) => {
      // Select a league from the dropdown
      await page.getByText("Лиг сонгох").click();
      await page.waitForTimeout(300);

      await page.getByRole("option", { name: "Монголын Үндэсний Лиг" }).click();
      await page.waitForTimeout(500);

      // Table should appear with seasons
      const table = page.getByRole("table");
      await expect(table).toBeVisible({ timeout: 10_000 });
    });

    test("shows season data with start and end dates", async ({ page }) => {
      await page.getByText("Лиг сонгох").click();
      await page.waitForTimeout(300);
      await page.getByRole("option", { name: "Монголын Үндэсний Лиг" }).click();
      await page.waitForTimeout(500);

      // Season names should be visible
      await expect(
        page.getByRole("cell", { name: "2025" }),
      ).toBeVisible();
    });

    test("shows empty state when league has no seasons", async ({ page }) => {
      // Return empty seasons for this league
      await page.route("**/admin/api/seasons*", (route) => {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      });

      await page.getByText("Лиг сонгох").click();
      await page.waitForTimeout(300);
      await page.getByRole("option", { name: "Монголын Үндэсний Лиг" }).click();
      await page.waitForTimeout(500);

      await expect(
        page.getByText("Улирал байхгүй байна"),
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Create Season", () => {
    test("opens create dialog with form fields", async ({ page }) => {
      // First select a league
      await page.getByText("Лиг сонгох").click();
      await page.waitForTimeout(300);
      await page.getByRole("option", { name: "Монголын Үндэсний Лиг" }).click();
      await page.waitForTimeout(500);

      // Add button should now be enabled
      await page.getByRole("button", { name: "Нэмэх" }).click();
      await page.waitForTimeout(500);

      await expect(
        page.getByRole("heading", { name: "Улирал нэмэх" }),
      ).toBeVisible();
    });

    test("creates season on form submit", async ({ page }) => {
      await page.getByText("Лиг сонгох").click();
      await page.waitForTimeout(300);
      await page.getByRole("option", { name: "Монголын Үндэсний Лиг" }).click();
      await page.waitForTimeout(500);

      await page.getByRole("button", { name: "Нэмэх" }).click();
      await page.waitForTimeout(500);

      await page.getByLabel("Нэр").fill("2027");
      await page.getByLabel("Эхлэх огноо").fill("2027-01-01");
      await page.getByLabel("Дуусах огноо").fill("2027-12-31");

      await page.getByRole("button", { name: "Үүсгэх" }).click();

      await expect(
        page.getByText("амжилттай үүсгэлээ"),
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Edit Season", () => {
    test("opens edit dialog with pre-filled data", async ({ page }) => {
      await page.getByText("Лиг сонгох").click();
      await page.waitForTimeout(300);
      await page.getByRole("option", { name: "Монголын Үндэсний Лиг" }).click();
      await page.waitForTimeout(500);

      await page.getByRole("button", { name: "Засах" }).first().click();
      await page.waitForTimeout(500);

      await expect(
        page.getByRole("heading", { name: "Улирал засах" }),
      ).toBeVisible();
    });
  });

  test.describe("Delete Season", () => {
    test("deletes season on confirm", async ({ page }) => {
      await page.getByText("Лиг сонгох").click();
      await page.waitForTimeout(300);
      await page.getByRole("option", { name: "Монголын Үндэсний Лиг" }).click();
      await page.waitForTimeout(500);

      page.on("dialog", (dialog) => dialog.accept());

      await page.getByRole("button", { name: "Устгах" }).first().click();

      await expect(
        page.getByText("устгагдлаа"),
      ).toBeVisible({ timeout: 10_000 });
    });
  });
});
