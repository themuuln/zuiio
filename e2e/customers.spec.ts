import { expect, test } from "@playwright/test";
import { loginViaUI } from "./helpers";

// All customer tests use /en/ locale for stable English text selectors

test.describe("Customer Management", () => {
  test.describe("Customer List Page", () => {
    test.beforeEach(async ({ page }) => {
      await loginViaUI(page);
      await page.goto("/en/dashboard/customers");
      await page
        .locator('h1, [data-slot="empty"]')
        .first()
        .waitFor({ timeout: 15000 });
    });

    test("renders the customers page heading", async ({ page }) => {
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });

    test("shows the Add Customer button", async ({ page }) => {
      const addButton = page.getByRole("button", { name: /add customer/i });
      await expect(addButton).toBeVisible();
    });

    test("shows My Customers and Shared tabs", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: /my customers/i }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: /shared/i })).toBeVisible();
    });

    test("My Customers tab is active by default", async ({ page }) => {
      const myTab = page.getByRole("button", { name: /my customers/i });
      await expect(myTab).toHaveClass(/bg-primary/);
    });

    test("shows search input", async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      await expect(searchInput).toBeVisible();
    });

    test("switching to Shared tab changes the view", async ({ page }) => {
      const sharedTab = page.getByRole("button", { name: /shared/i });
      await sharedTab.click();
      await expect(sharedTab).toHaveClass(/bg-primary/);
    });
  });

  test.describe("Customer Creation Sheet", () => {
    test.beforeEach(async ({ page }) => {
      await loginViaUI(page);
      await page.goto("/en/dashboard/customers");
      await page
        .locator('h1, [data-slot="empty"]')
        .first()
        .waitFor({ timeout: 15000 });
    });

    test("Add Customer button opens creation sheet", async ({ page }) => {
      const addButton = page.getByRole("button", { name: /add customer/i });
      await addButton.click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
    });

    test("customer form shows Quick and Full Details tabs", async ({
      page,
    }) => {
      await page.getByRole("button", { name: /add customer/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });

      await expect(page.getByRole("tab", { name: /quick/i })).toBeVisible();
      await expect(
        page.getByRole("tab", { name: /create customer/i }),
      ).toBeVisible();
    });

    test("Quick mode shows first name and phone fields", async ({ page }) => {
      await page.getByRole("button", { name: /add customer/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });

      await expect(page.getByPlaceholder(/bat/i)).toBeVisible();
      await expect(page.getByPlaceholder(/9911/i)).toBeVisible();
    });

    test("Full Details mode shows all fields", async ({ page }) => {
      await page.getByRole("button", { name: /add customer/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });

      await page.getByRole("tab", { name: /create customer/i }).click();

      await expect(page.getByPlaceholder(/bat/i)).toBeVisible();
      await expect(page.getByPlaceholder(/erdene/i)).toBeVisible();
      await expect(page.getByPlaceholder(/name@example/i)).toBeVisible();
      await expect(page.getByPlaceholder(/ulaanbaatar/i)).toBeVisible();
    });

    test("switching to Company type shows company fields", async ({ page }) => {
      await page.getByRole("button", { name: /add customer/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });

      await page.getByRole("tab", { name: /create customer/i }).click();

      const typeSelect = page.getByRole("combobox", { name: /customer type/i });
      await typeSelect.click();
      await page.getByRole("option", { name: /company/i }).click();

      await expect(page.getByPlaceholder(/fleet/i)).toBeVisible();
      await expect(page.getByPlaceholder(/batbold/i)).toBeVisible();
    });

    test("Cancel button closes the sheet", async ({ page }) => {
      await page.getByRole("button", { name: /add customer/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });

      const cancelButton = page
        .getByRole("dialog")
        .getByRole("button", { name: /cancel/i });
      await cancelButton.click();

      await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Customer List Search", () => {
    test.beforeEach(async ({ page }) => {
      await loginViaUI(page);
      await page.goto("/en/dashboard/customers");
      await page
        .locator('h1, [data-slot="empty"]')
        .first()
        .waitFor({ timeout: 15000 });
    });

    test("search input accepts text", async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.fill("test");
      await expect(searchInput).toHaveValue("test");
    });

    test("clearing search restores full list", async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.fill("test");
      await page.waitForTimeout(500);
      await searchInput.clear();
      await expect(searchInput).toHaveValue("");
    });
  });

  test.describe("Customer List Navigation", () => {
    test("can navigate from dashboard to customers", async ({ page }) => {
      await loginViaUI(page);
      await page.goto("/en/dashboard");
      // Wait for the sidebar link to appear (dashboard is a bay-view page)
      const customersLink = page.getByRole("link", { name: /customers/i });
      await expect(customersLink).toBeVisible({ timeout: 15000 });
      await customersLink.click();

      await expect(page).toHaveURL(/\/dashboard\/customers/, {
        timeout: 10000,
      });
    });
  });
});
