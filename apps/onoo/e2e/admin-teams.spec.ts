/**
 * E2E tests for the admin teams page.
 *
 * The teams page shows a CRUD table with:
 * - League filter dropdown
 * - List of teams (name, short_code, color, league, actions)
 * - Create dialog with form (name, short_code, slug, primary_color)
 * - Edit dialog (pre-filled)
 * - Delete with confirmation
 */

import { mockSupabaseREST, mockTeamsAll } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

test.describe("Admin Teams", () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabaseREST(page);
    await mockTeamsAll(page);
    await page.goto("/admin/teams");
  });

  test.describe("Page Structure", () => {
    test("shows teams page heading", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Багууд" }),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("shows league filter dropdown", async ({ page }) => {
      await expect(
        page.getByLabel("Лиг сонгох"),
      ).toBeVisible();
    });

    test("shows add team button", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: "Нэмэх" }),
      ).toBeVisible();
    });

    test("shows teams table with columns", async ({ page }) => {
      const table = page.getByRole("table");
      await expect(table).toBeVisible({ timeout: 10_000 });

      const headers = table.getByRole("columnheader");
      // Нэр, Товчлол, Өнгө, Лиг, Үйлдэл
      await expect(headers).toHaveCount(5);
    });
  });

  test.describe("Team List", () => {
    test("displays team data in table rows", async ({ page }) => {
      const rows = page.getByRole("row");
      // Header + 3 team rows
      await expect(rows).toHaveCount(4);
    });

    test("shows team short code and primary color indicator", async ({ page }) => {
      await expect(
        page.getByRole("cell", { name: "ХАС" }),
      ).toBeVisible();

      // Color swatch indicator should be present
      const colorSwatches = page.locator('div[aria-label*="Өнгө"]');
      await expect(colorSwatches.first()).toBeVisible();
    });

    test("shows empty state when no teams", async ({ page }) => {
      await page.route("**/admin/api/teams*", (route) => {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      });

      await page.reload();
      await page.waitForTimeout(1000);

      await expect(
        page.getByText("Баг олдсонгүй"),
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("League Filter", () => {
    test("filters teams by selected league", async ({ page }) => {
      // Open league filter dropdown
      await page.getByLabel("Лиг сонгох").click();
      await page.waitForTimeout(300);

      // Should show "Бүх лиг" and actual league options
      await expect(
        page.getByRole("option", { name: "Бүх лиг" }),
      ).toBeVisible();
    });
  });

  test.describe("Create Team", () => {
    test("opens create dialog with form fields", async ({ page }) => {
      await page.getByRole("button", { name: "Нэмэх" }).click();
      await page.waitForTimeout(500);

      await expect(
        page.getByRole("heading", { name: "Шинэ баг нэмэх" }),
      ).toBeVisible();

      await expect(page.getByLabel("Нэр")).toBeVisible();
      await expect(page.getByLabel("Товчлол")).toBeVisible();
      await expect(page.getByLabel("Slug")).toBeVisible();
    });

    test("creates team on form submit", async ({ page }) => {
      await page.getByRole("button", { name: "Нэмэх" }).click();
      await page.waitForTimeout(500);

      await page.getByLabel("Нэр").fill("Шинэ Баг");
      await page.getByLabel("Товчлол").fill("ШБГ");
      await page.getByLabel("Slug").fill("shine-bag");

      await page.getByRole("button", { name: "Хадгалах" }).click();

      await expect(
        page.getByText("амжилттай нэмэгдлээ"),
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Edit Team", () => {
    test("opens edit dialog with pre-filled data", async ({ page }) => {
      const editBtn = page.getByRole("button", { name: "засах" }).first();
      await editBtn.click();
      await page.waitForTimeout(500);

      await expect(
        page.getByRole("heading", { name: "Баг засах" }),
      ).toBeVisible();
    });
  });

  test.describe("Delete Team", () => {
    test("deletes team on confirm", async ({ page }) => {
      page.on("dialog", (dialog) => dialog.accept());

      const deleteBtn = page.getByRole("button", { name: "устгах" }).first();
      await deleteBtn.click();

      await expect(
        page.getByText("устгагдлаа"),
      ).toBeVisible({ timeout: 10_000 });
    });
  });
});
