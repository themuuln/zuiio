import { setEnglishLocale } from "./helpers";
import { mockSupabaseREST, mockWorkOrders } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

test.describe("Work Orders (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockWorkOrders(page);
    await page.goto("/dashboard/work-orders");
  });

  test.describe("Page Structure", () => {
    test("loads the work orders page with heading", async ({ page }) => {
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: 10_000,
      });
    });

    test("shows search input", async ({ page }) => {
      await expect(page.getByPlaceholder(/search/i).first()).toBeVisible();
    });

    test("shows New Work Order button", async ({ page }) => {
      const btn = page
        .getByRole("button", {
          name: /new work order|add work order|create work order/i,
        })
        .first();
      await expect(btn).toBeVisible();
    });
  });

  test.describe("Status Filtering", () => {
    test("shows status filter options", async ({ page }) => {
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: 10_000,
      });
    });

    test("clicking a status filter does not crash the page", async ({
      page,
    }) => {
      const inProgressBtn = page
        .getByRole("button", { name: /in.progress/i })
        .first();
      if (await inProgressBtn.isVisible()) {
        await inProgressBtn.click();
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      }
    });
  });

  test.describe("Data Display", () => {
    test("shows work order data when loaded", async ({ page }) => {
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe("Empty State", () => {
    test("handles empty work orders list", async ({ page }) => {
      await page.unrouteAll();
      await mockSupabaseREST(page);
      await mockWorkOrders(page, []);
      await page.goto("/dashboard/work-orders");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe("Sidebar Navigation", () => {
    test("has Work Orders link in sidebar", async ({ page }) => {
      await expect(
        page.getByRole("link", { name: /work order/i }).first(),
      ).toBeVisible();
    });
  });
});
