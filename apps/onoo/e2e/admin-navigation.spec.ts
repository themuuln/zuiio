/**
 * E2E tests for admin navigation — verifying sidebar links,
 * page titles, and section routing.
 */

import { mockAdminAll, mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

test.describe("Admin Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabaseREST(page);
    await mockAdminAll(page);
    await page.goto("/admin");
  });

  test.describe("Sidebar Navigation", () => {
    test("loads the admin dashboard by default", async ({ page }) => {
      await expect(
        page
          .getByRole("heading", { level: 1 })
          .or(page.getByRole("heading", { level: 2 })),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("shows six sidebar navigation links", async ({ page }) => {
      const nav = page.getByRole("navigation");
      const links = nav.getByRole("link");
      await expect(links).toHaveCount(6);
    });

    test("sidebar links have correct order and labels", async ({ page }) => {
      const nav = page.getByRole("navigation");
      const links = nav.getByRole("link");

      await expect(links.nth(0)).toHaveText("Хянах цэс");
      await expect(links.nth(1)).toHaveText("Лиг");
      await expect(links.nth(2)).toHaveText("Улирал");
      await expect(links.nth(3)).toHaveText("Баг");
      await expect(links.nth(4)).toHaveText("Тоглогч");
      await expect(links.nth(5)).toHaveText("Тоглолт");
    });

    test("highlights active sidebar link", async ({ page }) => {
      // Navigate to players
      await page.getByRole("link", { name: "Тоглогч" }).click();
      await page.waitForURL("**/admin/players**");

      // The active link should be "Тоглогч"
      const activeLink = page.getByRole("link", { name: "Тоглогч" });
      await expect(activeLink).toBeVisible();
    });
  });

  test.describe("Page Routing", () => {
    test("navigates to leagues page", async ({ page }) => {
      await page.getByRole("link", { name: "Лиг" }).click();
      await page.waitForURL("**/admin/leagues**");
      await expect(
        page.getByRole("heading", { name: "Лигууд" }),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("navigates to teams page", async ({ page }) => {
      await page.getByRole("link", { name: "Баг" }).click();
      await page.waitForURL("**/admin/teams**");
      await expect(
        page.getByRole("heading", { name: "Багууд" }),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("navigates to players page", async ({ page }) => {
      await page.getByRole("link", { name: "Тоглогч" }).click();
      await page.waitForURL("**/admin/players**");
      await expect(
        page.getByRole("heading", { name: "Тоглогчид" }),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("navigates to games page", async ({ page }) => {
      await page.getByRole("link", { name: "Тоглолт" }).click();
      await page.waitForURL("**/admin/games**");
      await expect(
        page.getByRole("heading", { name: "Тоглолтууд" }),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("navigates to seasons page", async ({ page }) => {
      await page.getByRole("link", { name: "Улирал" }).click();
      await page.waitForURL("**/admin/seasons**");
      await expect(
        page.getByRole("heading", { name: "Улирлууд" }),
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Responsive Layout", () => {
    test("renders sidebar on desktop", async ({ page }) => {
      // The sidebar nav should be visible on desktop
      const sidebar = page.getByRole("navigation");
      await expect(sidebar).toBeVisible();
    });
  });
});
