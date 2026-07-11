import { setEnglishLocale } from "./helpers";
import { mockFinanceOverview, mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

test.describe("Finance (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockFinanceOverview(page);
    await page.goto("/dashboard/finance");
  });

  test.describe("Page Structure", () => {
    test("loads the finance page with heading", async ({ page }) => {
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe("Tab Navigation", () => {
    test("shows overview tab", async ({ page }) => {
      await expect(
        page.getByRole("tab", { name: /overview/i }).first(),
      ).toBeVisible();
    });

    test("shows transactions tab", async ({ page }) => {
      await expect(
        page.getByRole("tab", { name: /transaction/i }).first(),
      ).toBeVisible();
    });

    test("shows invoices tab", async ({ page }) => {
      await expect(
        page.getByRole("tab", { name: /invoice/i }).first(),
      ).toBeVisible();
    });

    test("shows expenses tab", async ({ page }) => {
      await expect(
        page.getByRole("tab", { name: /expense/i }).first(),
      ).toBeVisible();
    });

    test("shows refunds tab", async ({ page }) => {
      await expect(
        page.getByRole("tab", { name: /refund/i }).first(),
      ).toBeVisible();
    });

    test("switching tabs does not crash", async ({ page }) => {
      const transactionsTab = page
        .getByRole("tab", { name: /transaction/i })
        .first();
      await expect(transactionsTab).toBeVisible();
      await transactionsTab.click();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });

    test("switching to invoices tab does not crash", async ({ page }) => {
      const invoicesTab = page.getByRole("tab", { name: /invoice/i }).first();
      await expect(invoicesTab).toBeVisible();
      await invoicesTab.click();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });

    test("switching to expenses tab does not crash", async ({ page }) => {
      const expensesTab = page.getByRole("tab", { name: /expense/i }).first();
      await expect(expensesTab).toBeVisible();
      await expensesTab.click();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  });

  test.describe("Sidebar Navigation", () => {
    test("has Finance link in sidebar", async ({ page }) => {
      await expect(
        page.getByRole("link", { name: /finance/i }).first(),
      ).toBeVisible();
    });
  });
});
