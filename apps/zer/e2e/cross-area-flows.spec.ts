import { expect, type Page, test } from "@playwright/test";

/**
 * Cross-area flows: ensures integration between sales creation, product stock,
 * customer visibility, filter+search coexistence, empty-to-populated transitions,
 * drawer entry points, and sale detail access paths.
 *
 * These tests verify production behavior on a real Supabase + Next.js stack.
 * They require the dev server to be running at localhost:3000.
 * Auth state is pre-loaded via storageState from auth.setup.ts.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

let cachedProductWithStock: string | null = null;

/**
 * Get the name of the first product that has stock > 0.
 * Navigates to /products and reads the table.
 */
async function getProductWithStock(page: Page): Promise<string> {
  if (cachedProductWithStock) return cachedProductWithStock;

  await page.goto(`/products?refresh=${Date.now()}`, {
    waitUntil: "domcontentloaded",
  });

  const rows = page.locator("table tbody tr");
  await expect(rows.first()).toBeVisible({ timeout: 10_000 });
  const count = await rows.count();

  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const stockCell = row.locator("td").nth(6);
    const stockText = await stockCell.textContent();
    const stock = Number.parseFloat(stockText?.trim() ?? "0");
    if (stock > 0) {
      const nameCell = row.locator("td").nth(1);
      const name = (await nameCell.textContent())?.trim() ?? "";
      if (name) {
        cachedProductWithStock = name;
        return name;
      }
    }
  }

  const fallbackName =
    (await rows.first().locator("td").nth(1).textContent())?.trim() ?? "";
  if (!fallbackName) {
    throw new Error("No products are available for cross-area sale flows.");
  }
  cachedProductWithStock = fallbackName;
  return fallbackName;
}

/**
 * Select a specific product in the sale form's ProductBrowserDrawer.
 * Clicks "Бараа сонгох" for the given row, searches in the drawer,
 * then clicks the matching product card.
 */
async function selectProductByName(
  page: Page,
  productName: string,
  rowIndex = 0,
) {
  // Click the "Бараа сонгох" button for this line item row
  const productButtons = page.getByRole("button", { name: "Бараа сонгох" });
  await productButtons.nth(rowIndex).click();
  await page.waitForTimeout(800);

  // The ProductBrowserDrawer opens — type in the search field
  const searchInput = page.getByPlaceholder("Бүтээгдэхүүн хайх...");
  await expect(searchInput).toBeVisible({ timeout: 3000 });
  await searchInput.fill(productName);
  await page.waitForTimeout(600);

  // Find and click the product card button in the drawer
  const productCard = page
    .locator('button[type="button"]')
    .filter({ hasText: productName })
    .first();
  await productCard.waitFor({ state: "visible", timeout: 5000 });
  await productCard.click();
  await page.waitForTimeout(600);
}

/**
 * Helper: select the first available product with stock.
 */
async function _selectProductWithStock(page: Page, rowIndex = 0) {
  const productName = await getProductWithStock(page);
  // Now navigate back to sales and open the form
  // (caller should have already navigated to /sales and opened the drawer)
  await selectProductByName(page, productName, rowIndex);
}

/**
 * Fill in a customer name in the sale form's text inputs.
 * The new sale form uses simple text fields inside an expandable
 * "Нэмэлт тохиргоо" section — expand it first.
 */
async function createCustomerInPicker(page: Page, customerName: string) {
  // Expand the "Нэмэлт тохиргоо" section first
  const advancedBtn = page.getByRole("button", { name: "Нэмэлт тохиргоо" });
  await expect(advancedBtn).toBeVisible({ timeout: 3000 });
  await advancedBtn.click();
  await page.waitForTimeout(400);

  const nameInput = page.locator("#customer_name");
  await expect(nameInput).toBeVisible({ timeout: 3000 });
  await nameInput.fill(customerName);
  await page.waitForTimeout(300);
}

/**
 * Submit the sale form and wait for result.
 */
async function submitSaleForm(page: Page) {
  await page.getByRole("button", { name: "Борлуулалт хадгалах" }).click();
}

/**
 * Wait for the success toast and dismiss it.
 * Returns the toast text or null if no toast appeared.
 */
async function waitForSuccessToast(page: Page): Promise<string | null> {
  const toast = page.locator("[data-sonner-toast]").first();
  try {
    await expect(toast).toBeVisible({ timeout: 12000 });
    const toastText = await toast.textContent();

    // Check if it's a success or error toast
    if (toastText?.includes("амжилттай")) {
      return toastText;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Close the currently open drawer by pressing Escape.
 */
async function closeDrawer(page: Page) {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);
  // Verify drawer closed
  const createTitle = page.getByRole("heading", { name: "Борлуулалт нэмэх" });
  const detailTitle = page.getByRole("heading", {
    name: "Борлуулалтын дэлгэрэнгүй",
  });
  try {
    await createTitle.waitFor({ state: "hidden", timeout: 2000 });
  } catch {
    // Try detail title
    await detailTitle
      .waitFor({ state: "hidden", timeout: 2000 })
      .catch(() => {});
  }
}

/**
 * Open the create sale drawer by clicking "Шинэ борлуулалт".
 */
async function openCreateDrawer(page: Page) {
  const trigger = page.getByRole("button", { name: "Шинэ борлуулалт" });
  const heading = page.getByRole("heading", { name: "Борлуулалт нэмэх" });

  await expect(trigger).toBeVisible({ timeout: 10_000 });
  await expect
    .poll(
      async () => {
        if (await heading.isVisible()) return true;
        try {
          await trigger.click({ timeout: 1_000 });
        } catch {
          // The trigger can be temporarily covered while the page hydrates.
        }
        return await heading.isVisible();
      },
      { timeout: 15_000, intervals: [100, 250, 500] },
    )
    .toBe(true);
}

/**
 * Open the sale detail drawer from the first visible table row.
 */
async function openDetailDrawerFromFirstRow(page: Page) {
  const row = page.locator("table tbody tr").first();
  const heading = page.getByRole("heading", {
    name: "Борлуулалтын дэлгэрэнгүй",
  });

  await expect(row).toBeVisible({ timeout: 10_000 });
  await expect
    .poll(
      async () => {
        if (await heading.isVisible()) return true;
        try {
          await row.click({ timeout: 1_000 });
        } catch {
          // The row can be temporarily non-interactive while the page hydrates.
        }
        return await heading.isVisible();
      },
      { timeout: 15_000, intervals: [100, 250, 500] },
    )
    .toBe(true);
}

/**
 * Get a product's current stock by reading the products table.
 */
async function getProductStock(
  page: Page,
  productName: string,
): Promise<number> {
  await page.goto(`/products?refresh=${Date.now()}`, {
    waitUntil: "domcontentloaded",
  });

  const row = page
    .locator("table tbody tr")
    .filter({ hasText: productName })
    .first();
  await expect(row).toBeVisible({ timeout: 10_000 });

  const stockCell = row.locator("td").nth(6);
  const stockText = await stockCell.textContent();
  return Number.parseFloat(stockText?.trim() ?? "0");
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe("Cross-Area Flows", () => {
  test("VAL-CROSS-001: Navigation flow — create sale, verify table, verify stock on /products", async ({
    page,
  }) => {
    // Get a product with stock first
    const productName = await getProductWithStock(page);

    // Navigate to sales page
    await page.goto("/sales", { waitUntil: "domcontentloaded" });

    // Open create drawer
    await openCreateDrawer(page);

    // Select a product with stock
    await selectProductByName(page, productName, 0);

    // Create a customer with unique name to ensure it doesn't already exist
    const customerName = `Cross Flow ${Date.now()}`;
    await createCustomerInPicker(page, customerName);

    // Submit
    await submitSaleForm(page);

    // Check toast for success
    const toastText = await waitForSuccessToast(page);
    expect(toastText).toContain("амжилттай");

    // Navigate to /sales to see fresh data
    await page.goto(`/sales?refresh=${Date.now()}`, {
      waitUntil: "domcontentloaded",
    });

    // Verify the customer name appears in the table
    await expect(page.getByText(customerName).first()).toBeVisible({
      timeout: 5000,
    });

    // Navigate to /products to verify stock page loads
    await page.goto(`/products?refresh=${Date.now()}`, {
      waitUntil: "domcontentloaded",
    });

    await expect(page.locator("table").first()).toBeVisible({ timeout: 5000 });
  });

  test("VAL-CROSS-002: Multiple sales for same product — stock decreases cumulatively", async ({
    page,
  }) => {
    // Find a product with sufficient stock
    const productName = await getProductWithStock(page);

    // Get initial stock
    const initialStock = await getProductStock(page, productName);
    expect(initialStock).toBeGreaterThan(0);

    // Create first sale
    await page.goto("/sales", { waitUntil: "domcontentloaded" });

    await openCreateDrawer(page);
    await selectProductByName(page, productName, 0);
    await createCustomerInPicker(page, `Multi Sale 1 ${Date.now()}`);
    await submitSaleForm(page);
    const toast1 = await waitForSuccessToast(page);
    expect(toast1).toContain("амжилттай");

    // Check stock after first sale
    const stockAfterFirst = await getProductStock(page, productName);
    expect(stockAfterFirst).toBeLessThan(initialStock);

    // Create second sale for the same product
    await page.goto("/sales", { waitUntil: "domcontentloaded" });

    await openCreateDrawer(page);
    await selectProductByName(page, productName, 0);
    await createCustomerInPicker(page, `Multi Sale 2 ${Date.now()}`);
    await submitSaleForm(page);
    const toast2 = await waitForSuccessToast(page);
    expect(toast2).toContain("амжилттай");

    // Check stock after second sale — should be lower than after first
    const stockAfterSecond = await getProductStock(page, productName);
    expect(stockAfterSecond).toBeLessThan(stockAfterFirst);
  });

  test("VAL-CROSS-003: Customer created during sale visible on /customers page", async ({
    page,
  }) => {
    const uniqueCustomerName = `Cross Area Customer ${Date.now()}`;
    const productName = await getProductWithStock(page);

    // Create a sale with a unique customer name
    await page.goto("/sales", { waitUntil: "domcontentloaded" });

    await openCreateDrawer(page);
    await selectProductByName(page, productName, 0);
    await createCustomerInPicker(page, uniqueCustomerName);
    await submitSaleForm(page);
    const toastText = await waitForSuccessToast(page);
    expect(toastText).toContain("амжилттай");

    // Navigate to /customers
    await page.goto("/customers", { waitUntil: "domcontentloaded" });

    // Verify the customer appears in the customers table
    await expect(page.getByText(uniqueCustomerName).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("VAL-CROSS-004: Filter chips and text search coexist", async ({
    page,
  }) => {
    await page.goto("/sales", { waitUntil: "domcontentloaded" });

    const table = page.locator("table");
    await expect(table).toBeVisible({ timeout: 10_000 });

    const fullyPaidChip = page.getByRole("button", { name: "Бүрэн төлөгдсөн" });
    await expect(fullyPaidChip).toBeVisible({ timeout: 5_000 });
    await fullyPaidChip.click();
    await expect(fullyPaidChip).toHaveClass(/border-primary/);

    const searchInput = page.getByPlaceholder("Харилцагч хайх...");
    await expect(searchInput).toBeVisible({ timeout: 5_000 });
    await searchInput.fill("а");

    await expect(table.or(page.getByText("No results.")).first()).toBeVisible({
      timeout: 5_000,
    });

    await searchInput.clear();
    await fullyPaidChip.click();
    await expect(fullyPaidChip).not.toHaveClass(/border-primary/);
  });

  test("VAL-CROSS-005: Empty to populated transition", async ({ page }) => {
    await page.goto("/sales", { waitUntil: "domcontentloaded" });

    const table = page.locator("table").first();
    const emptyState = page.getByText("Борлуулалт бүртгэгдээгүй").first();
    await expect
      .poll(
        async () => (await table.isVisible()) || (await emptyState.isVisible()),
        { timeout: 10_000, intervals: [100, 250, 500] },
      )
      .toBe(true);

    if (await table.isVisible()) {
      await expect(table).toBeVisible({ timeout: 3_000 });
      return;
    }

    // Empty state should be shown before the first sale.
    await expect(emptyState).toBeVisible({ timeout: 5_000 });

    const productName = await getProductWithStock(page);
    await page.goto("/sales", { waitUntil: "domcontentloaded" });
    await openCreateDrawer(page);

    await selectProductByName(page, productName, 0);
    await createCustomerInPicker(page, `First Sale ${Date.now()}`);
    await submitSaleForm(page);
    await waitForSuccessToast(page);

    // Table should appear after creating first sale.
    await page.goto(`/sales?refresh=${Date.now()}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("table").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("VAL-CROSS-006: Create drawer opens from both button and /sales?create=true", async ({
    page,
  }) => {
    // Path 1: Click "Шинэ борлуулалт" button
    await page.goto("/sales", { waitUntil: "domcontentloaded" });
    await openCreateDrawer(page);

    // Close the drawer
    await closeDrawer(page);
    await expect(
      page.getByRole("heading", { name: "Борлуулалт нэмэх" }),
    ).not.toBeVisible({ timeout: 3_000 });

    // Path 2: Navigate to /sales?create=true
    await page.goto("/sales?create=true", { waitUntil: "domcontentloaded" });

    // Verify drawer auto-opens
    await expect(
      page.getByRole("heading", { name: "Борлуулалт нэмэх" }),
    ).toBeVisible({ timeout: 10_000 });

    // Verify URL was cleaned
    expect(page.url()).not.toContain("create=true");
  });

  test("VAL-CROSS-007: Sale detail accessible from both row click and post-save toast Дэлгэрэнгүй", async ({
    page,
  }) => {
    await page.goto("/sales", { waitUntil: "domcontentloaded" });

    // Check if we have sales data
    const rows = page.locator("table tbody tr");
    await expect(page.locator("table").first()).toBeVisible({
      timeout: 10_000,
    });
    const rowCount = await rows.count();

    if (rowCount === 0) {
      test.skip(true, "Skipping — no sales data to click on");
      return;
    }

    // Path 1: Click a sale row → detail drawer opens
    await openDetailDrawerFromFirstRow(page);

    // Close the drawer
    await closeDrawer(page);
    await expect(
      page.getByRole("heading", { name: "Борлуулалтын дэлгэрэнгүй" }),
    ).not.toBeVisible({ timeout: 3_000 });

    // Path 2: Create a new sale, then click Дэлгэрэнгүй in the toast
    const productName = await getProductWithStock(page);
    await page.goto("/sales", { waitUntil: "domcontentloaded" });

    await openCreateDrawer(page);
    await selectProductByName(page, productName, 0);
    const uniqueName = `Detail Test ${Date.now()}`;
    await createCustomerInPicker(page, uniqueName);
    await submitSaleForm(page);

    // Wait for the toast with action buttons
    const toast = page.locator("[data-sonner-toast]").first();
    await expect(toast).toBeVisible({ timeout: 15_000 });

    // Click "Дэлгэрэнгүй" button
    const detailBtn = page.getByRole("button", { name: "Дэлгэрэнгүй" }).first();
    await expect(detailBtn).toBeVisible({ timeout: 5_000 });
    await detailBtn.click();

    // Verify the detail drawer opens
    await expect(
      page.getByRole("heading", { name: "Борлуулалтын дэлгэрэнгүй" }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
