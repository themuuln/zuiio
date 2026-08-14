import { loginViaUI, setEnglishLocale } from "./helpers";
import { mockPrewarm, mockSettingsOrg } from "./mocks";
import { expect, test } from "./test-extensions";

// All form tests use English locale for stable English text selectors

test.describe("Form Consistency", () => {
  test.describe("Expense Form", () => {
    test.beforeEach(async ({ page }) => {
      await loginViaUI(page);
      await setEnglishLocale(page);
      await page.goto("/dashboard/expenses");
      await page.getByRole("heading", { level: 1 }).waitFor({ timeout: 15000 });
    });

    test("add expense button opens creation sheet", async ({ page }) => {
      const addButton = page.getByRole("button", { name: /add expense/i });
      await expect(addButton).toBeVisible();
      await addButton.click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
    });

    test("expense form shows description and amount fields", async ({
      page,
    }) => {
      await page.getByRole("button", { name: /add expense/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });

      // Description has id="expense-description"
      const descriptionInput = page.locator("#expense-description");
      await expect(descriptionInput).toBeVisible();
      await descriptionInput.fill("Test expense");
      await expect(descriptionInput).toHaveValue("Test expense");

      // Amount has id="expense-amount" (type=number, so spinbutton role)
      const amountInput = page.locator("#expense-amount");
      await expect(amountInput).toBeVisible();
    });

    test("expense form renders category select", async ({ page }) => {
      await page.getByRole("button", { name: /add expense/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });

      await expect(
        page.getByRole("combobox", { name: /category/i }),
      ).toBeVisible();
    });

    test("expense form shows cancel and submit buttons", async ({ page }) => {
      await page.getByRole("button", { name: /add expense/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });

      await expect(
        page.getByRole("dialog").getByRole("button", { name: /cancel/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("dialog").getByRole("button", { name: /add expense/i }),
      ).toBeVisible();
    });

    test("expense form close via cancel", async ({ page }) => {
      await page.getByRole("button", { name: /add expense/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });

      await page
        .getByRole("dialog")
        .getByRole("button", { name: /cancel/i })
        .click();

      await expect(page.getByRole("dialog")).not.toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe("Branch Form", () => {
    test.beforeEach(async ({ page }) => {
      await loginViaUI(page);
      await setEnglishLocale(page);
      // The settings page prefetches ~19 org-scoped lists; mocking them makes
      // the page render in seconds instead of waiting on prod under load.
      await mockSettingsOrg(page);
      await page.goto("/dashboard/settings");
      // Settings title renders as Typography.Text, not a heading
      await page
        .getByText(/^settings$/i)
        .first()
        .waitFor({ timeout: 15000 });
      // The branches section must be present before scrolling into view
      await page
        .locator("section#settings-section-branches")
        .waitFor({ state: "visible", timeout: 15000 });
    });

    test("branch section has add branch button", async ({ page }) => {
      const branchesSection = page.locator("section#settings-section-branches");
      await branchesSection.scrollIntoViewIfNeeded();

      const addBranchButton = branchesSection.getByRole("button", {
        name: /add branch/i,
      });
      await expect(addBranchButton).toBeVisible();
    });

    test("add branch opens creation form with all fields", async ({ page }) => {
      const branchesSection = page.locator("section#settings-section-branches");
      await branchesSection.scrollIntoViewIfNeeded();

      await branchesSection
        .getByRole("button", { name: /add branch/i })
        .click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 10000 });

      // Branch form fields — inputs are labeled via placeholders (labels are
      // sibling text, not htmlFor-associated)
      await expect(dialog.getByPlaceholder(/downtown shop/i)).toBeVisible();
      await expect(dialog.getByPlaceholder(/main st/i)).toBeVisible();
      await expect(dialog.getByPlaceholder(/\+976/i)).toBeVisible();
      await expect(dialog.getByPlaceholder(/branch@example/i)).toBeVisible();
    });

    test("branch form has save and cancel buttons", async ({ page }) => {
      const branchesSection = page.locator("section#settings-section-branches");
      await branchesSection.scrollIntoViewIfNeeded();

      await branchesSection
        .getByRole("button", { name: /add branch/i })
        .click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 10000 });

      await expect(
        dialog.getByRole("button", { name: /save|create/i }),
      ).toBeVisible();
      await expect(
        dialog.getByRole("button", { name: /cancel/i }),
      ).toBeVisible();
    });
  });

  test.describe("Service Page", () => {
    test.beforeEach(async ({ page }) => {
      await loginViaUI(page);
      await setEnglishLocale(page);
      await page.goto("/dashboard/services");
      await page.getByRole("heading", { level: 1 }).waitFor({ timeout: 15000 });
    });

    test("services page renders heading and table", async ({ page }) => {
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(
        page.getByRole("columnheader", { name: /name/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("columnheader", { name: /price/i }),
      ).toBeVisible();
    });

    test("service row click opens edit sheet", async ({ page }) => {
      // Wait for data rows
      const dataRows = page
        .getByRole("row")
        .filter({ hasNot: page.getByRole("columnheader") });
      await dataRows.first().waitFor({ timeout: 15000 });

      if ((await dataRows.count()) > 0) {
        await dataRows.first().click();
        await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe("Work Order Page", () => {
    test.beforeEach(async ({ page }) => {
      await loginViaUI(page);
      await setEnglishLocale(page);
      // The layout prewarms 6 heavy org queries on every page — mock them so
      // the page renders fast even under parallel load (the suite asserts
      // against the real work-orders data, which stays live).
      await mockPrewarm(page);
      await page.goto("/dashboard/work-orders");
      await page.getByRole("heading", { level: 1 }).waitFor({ timeout: 15000 });
    });

    test("work orders page renders heading and button", async ({ page }) => {
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(
        page.getByRole("button", { name: /new work order/i }),
      ).toBeVisible();
    });
  });
});
