import { expect, test } from "@playwright/test";
import { loginViaUI } from "./helpers";

// All form tests use /en/ locale for stable English text selectors

test.describe("Form Consistency", () => {
  test.describe("Expense Form", () => {
    test.beforeEach(async ({ page }) => {
      await loginViaUI(page);
      await page.goto("/en/dashboard/expenses");
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
      await page.goto("/en/dashboard/settings");
      await page
        .getByRole("heading", { name: /settings/i })
        .waitFor({ timeout: 15000 });
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

      // Branch form fields — inputs rendered via register() have placeholders
      await expect(dialog.getByPlaceholder(/branch name/i)).toBeVisible();
      await expect(dialog.getByPlaceholder(/address/i)).toBeVisible();
      await expect(dialog.getByPlaceholder(/phone/i)).toBeVisible();
      await expect(dialog.getByPlaceholder(/email/i)).toBeVisible();
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
      await page.goto("/en/dashboard/services");
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
      await page.goto("/en/dashboard/work-orders");
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
