import { expenseWithCategoryFixture } from "./fixtures";
import { setEnglishLocale } from "./helpers";
import {
  mockCrudMutations,
  mockExpenseCategories,
  mockExpenses,
  mockExpensesStats,
  mockSupabaseREST,
} from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

test.describe("Expenses CRUD (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockExpensesStats(page);
    await mockExpenseCategories(page);
    await mockExpenses(page, [expenseWithCategoryFixture()]);
    await mockCrudMutations(page, "expenses");
    await page.goto("/dashboard/expenses");
  });

  test("loads expenses list", async ({ page }) => {
    await expect(
      page
        .getByRole("heading", { level: 1 })
        .or(page.getByText(/expense/i))
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows expenses content", async ({ page }) => {
    await expect(page.getByText(/expense|amount|total/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("add expense button triggers form", async ({ page }) => {
    const addBtn = page
      .locator("button")
      .filter({ hasText: /expense/i })
      .first();
    await addBtn.click();
    await expect(
      page
        .getByRole("dialog")
        .or(page.getByText(/amount|description|category/i))
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
