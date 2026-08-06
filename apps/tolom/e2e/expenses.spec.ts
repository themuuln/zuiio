import { setEnglishLocale } from "./helpers";
import { mockExpenseCategories, mockExpenses, mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

test.describe("Expenses (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockExpenses(page);
    await mockExpenseCategories(page);
    await page.goto("/dashboard/expenses");
  });

  test.describe("Page Structure", () => {
    test("loads the expenses page with heading", async ({ page }) => {
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: 10_000,
      });
    });

    test("shows the Add Expense button", async ({ page }) => {
      const btn = page
        .getByRole("button", {
          name: /add expense|new expense|create expense/i,
        })
        .first();
      await expect(btn).toBeVisible();
    });
  });

  test.describe("Data Display", () => {
    test("shows expense content area when loaded", async ({ page }) => {
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe("Empty State", () => {
    test("handles empty expenses list", async ({ page }) => {
      await page.unrouteAll();
      await mockSupabaseREST(page);
      await mockExpenses(page, []);
      await mockExpenseCategories(page);
      await page.goto("/dashboard/expenses");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe("Sidebar Navigation", () => {
    test("has Expenses link in sidebar", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: /^expenses$/i }).first(),
      ).toBeVisible();
    });
  });
});
