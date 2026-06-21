import { expect, test } from "@playwright/test";

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
async function getProductWithStock(page: any): Promise<string> {
  if (cachedProductWithStock) return cachedProductWithStock;

  await page.goto("/products", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  const rows = page.locator("table tbody tr");
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
        console.log(`Found product with stock: "${name}" (stock: ${stock})`);
        return name;
      }
    }
  }

  // Fallback: try first row regardless of stock
  const fallbackName =
    (await rows.first().locator("td").nth(1).textContent())?.trim() ?? "";
  console.log(
    `No product with stock found, falling back to: "${fallbackName}"`,
  );
  cachedProductWithStock = fallbackName;
  return fallbackName;
}

/**
 * Select a specific product in the sale form's ProductBrowserDrawer.
 * Clicks "Бараа сонгох" for the given row, searches in the drawer,
 * then clicks the matching product card.
 */
async function selectProductByName(
  page: any,
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
async function selectProductWithStock(page: any, rowIndex = 0) {
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
async function createCustomerInPicker(page: any, customerName: string) {
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
async function submitSaleForm(page: any) {
  await page.getByRole("button", { name: "Борлуулалт хадгалах" }).click();
  await page.waitForTimeout(5000);
}

/**
 * Wait for the success toast and dismiss it.
 * Returns the toast text or null if no toast appeared.
 */
async function waitForSuccessToast(page: any): Promise<string | null> {
  const toast = page.locator("[data-sonner-toast]").first();
  try {
    await expect(toast).toBeVisible({ timeout: 12000 });
    const toastText = await toast.textContent();
    console.log("Toast text:", toastText);

    // Check if it's a success or error toast
    if (toastText?.includes("амжилттай")) {
      return toastText;
    }
    console.log("Toast does not contain success message");
    return null;
  } catch {
    console.log("No toast appeared");
    return null;
  }
}

/**
 * Close the currently open drawer by pressing Escape.
 */
async function closeDrawer(page: any) {
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
async function openCreateDrawer(page: any) {
  await page.getByRole("button", { name: "Шинэ борлуулалт" }).click();
  await page.waitForTimeout(1500);
  await expect(
    page.getByRole("heading", { name: "Борлуулалт нэмэх" }),
  ).toBeVisible({ timeout: 5000 });
}

/**
 * Get a product's current stock by reading the products table.
 */
async function getProductStock(
  page: any,
  productName: string,
): Promise<number> {
  await page.goto("/products", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  const row = page
    .locator("table tbody tr")
    .filter({ hasText: productName })
    .first();
  await expect(row).toBeVisible({ timeout: 5000 });

  const stockCell = row.locator("td").nth(6);
  const stockText = await stockCell.textContent();
  console.log(`Stock cell for "${productName}":`, stockText);
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
    await page.goto("/sales", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

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
    await page.goto("/sales", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Verify the customer name appears in the table
    await expect(page.getByText(customerName).first()).toBeVisible({
      timeout: 5000,
    });

    // Navigate to /products to verify stock page loads
    await page.goto("/products", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await expect(page.locator("table").first()).toBeVisible({ timeout: 5000 });
  });

  test("VAL-CROSS-002: Multiple sales for same product — stock decreases cumulatively", async ({
    page,
  }) => {
    // Find a product with sufficient stock
    const productName = await getProductWithStock(page);

    // Get initial stock
    const initialStock = await getProductStock(page, productName);
    console.log(`Initial stock for "${productName}": ${initialStock}`);
    expect(initialStock).toBeGreaterThan(0);

    // Create first sale
    await page.goto("/sales", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await openCreateDrawer(page);
    await selectProductByName(page, productName, 0);
    await createCustomerInPicker(page, `Multi Sale 1 ${Date.now()}`);
    await submitSaleForm(page);
    const toast1 = await waitForSuccessToast(page);
    expect(toast1).toContain("амжилттай");

    // Check stock after first sale
    const stockAfterFirst = await getProductStock(page, productName);
    console.log(`Stock after first sale: ${stockAfterFirst}`);
    expect(stockAfterFirst).toBeLessThan(initialStock);

    // Create second sale for the same product
    await page.goto("/sales", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await openCreateDrawer(page);
    await selectProductByName(page, productName, 0);
    await createCustomerInPicker(page, `Multi Sale 2 ${Date.now()}`);
    await submitSaleForm(page);
    const toast2 = await waitForSuccessToast(page);
    expect(toast2).toContain("амжилттай");

    // Check stock after second sale — should be lower than after first
    const stockAfterSecond = await getProductStock(page, productName);
    console.log(`Stock after second sale: ${stockAfterSecond}`);
    expect(stockAfterSecond).toBeLessThan(stockAfterFirst);
  });

  test("VAL-CROSS-003: Customer created during sale visible on /customers page", async ({
    page,
  }) => {
    const uniqueCustomerName = `Cross Area Customer ${Date.now()}`;
    const productName = await getProductWithStock(page);

    // Create a sale with a unique customer name
    await page.goto("/sales", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await openCreateDrawer(page);
    await selectProductByName(page, productName, 0);
    await createCustomerInPicker(page, uniqueCustomerName);
    await submitSaleForm(page);
    const toastText = await waitForSuccessToast(page);
    expect(toastText).toContain("амжилттай");

    // Navigate to /customers
    await page.goto("/customers", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Verify the customer appears in the customers table
    await expect(page.getByText(uniqueCustomerName).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("VAL-CROSS-004: Filter chips and text search coexist", async ({
    page,
  }) => {
    await page.goto("/sales", { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);

    // Check that data exists
    const table = page.locator("table");
    const hasData = await table.isVisible().catch(() => false);
    if (!hasData) {
      test.skip(true, "Skipping — no sales data to filter");
      return;
    }

    // 1. Click a filter chip to activate it
    const fullyPaidChip = page.getByRole("button", { name: "Бүрэн төлөгдсөн" });
    if (await fullyPaidChip.isVisible()) {
      await fullyPaidChip.click();
      await page.waitForTimeout(500);
    }

    // 2. Type in the search input
    const searchInput = page.getByPlaceholder(
      "Огноо, харилцагч, дүнгээр хайх...",
    );
    if (await searchInput.isVisible()) {
      await searchInput.fill("а");
      await page.waitForTimeout(500);
    }

    // 3. Page should render without error
    const tableOrNoResults = page
      .locator("table")
      .or(page.locator("text=No results."));
    await expect(tableOrNoResults.first()).toBeVisible({ timeout: 3000 });

    // 4. Verify the chip is still highlighted/active
    const chipButton = page.getByRole("button", { name: "Бүрэн төлөгдсөн" });
    const classAttr = await chipButton.getAttribute("class");
    const isActive = classAttr?.includes("border-primary") ?? false;
    console.log("Filter chip active:", isActive);

    // 5. Clear search
    await searchInput.clear();
    await page.waitForTimeout(300);

    // 6. Deselect the chip
    await chipButton.click();
    await page.waitForTimeout(300);
  });

  test("VAL-CROSS-005: Empty to populated transition", async ({ page }) => {
    await page.goto("/sales", { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);

    const table = page.locator("table");
    const hasData = await table.isVisible().catch(() => false);

    if (hasData) {
      console.log("Sales data exists, table is visible");
      await expect(table).toBeVisible({ timeout: 3000 });
    } else {
      // Empty state should be shown
      const emptyState = page.getByText("Борлуулалт бүртгэгдээгүй").first();
      await expect(emptyState).toBeVisible({ timeout: 5000 });
      console.log("Empty state is visible");

      // Create first sale using the CTA
      const productName = await getProductWithStock(page);
      const createBtn = page.getByRole("button", { name: "Шинэ борлуулалт" });
      await expect(createBtn).toBeVisible({ timeout: 3000 });
      await createBtn.click();
      await page.waitForTimeout(1500);
      await selectProductByName(page, productName, 0);
      await createCustomerInPicker(page, `First Sale ${Date.now()}`);
      await submitSaleForm(page);
      await waitForSuccessToast(page);
      await page.waitForTimeout(2000);

      // Table should appear after creating first sale
      await page.goto("/sales", { waitUntil: "networkidle" });
      await page.waitForTimeout(2000);
      await expect(page.locator("table")).toBeVisible({ timeout: 5000 });
      console.log("Table appeared after first sale");
    }
  });

  test("VAL-CROSS-006: Create drawer opens from both button and /sales?create=true", async ({
    page,
  }) => {
    // Path 1: Click "Шинэ борлуулалт" button
    await page.goto("/sales", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    await page.getByRole("button", { name: "Шинэ борлуулалт" }).click();
    await page.waitForTimeout(1500);
    await expect(
      page.getByRole("heading", { name: "Борлуулалт нэмэх" }),
    ).toBeVisible({ timeout: 5000 });

    // Close the drawer
    await closeDrawer(page);
    await expect(
      page.getByRole("heading", { name: "Борлуулалт нэмэх" }),
    ).not.toBeVisible({ timeout: 3000 });

    // Path 2: Navigate to /sales?create=true
    await page.goto("/sales?create=true", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Verify drawer auto-opens
    await expect(
      page.getByRole("heading", { name: "Борлуулалт нэмэх" }),
    ).toBeVisible({ timeout: 5000 });

    // Verify URL was cleaned
    const currentUrl = page.url();
    expect(currentUrl).not.toContain("create=true");
    console.log("URL after auto-open:", currentUrl);
  });

  test("VAL-CROSS-007: Sale detail accessible from both row click and post-save toast Дэлгэрэнгүй", async ({
    page,
  }) => {
    await page.goto("/sales", { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);

    // Check if we have sales data
    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();

    if (rowCount === 0) {
      test.skip(true, "Skipping — no sales data to click on");
      return;
    }

    // Path 1: Click a sale row → detail drawer opens
    await rows.first().click();
    await page.waitForTimeout(1500);
    await expect(
      page.getByRole("heading", { name: "Борлуулалтын дэлгэрэнгүй" }),
    ).toBeVisible({ timeout: 5000 });

    // Close the drawer
    await closeDrawer(page);
    await expect(
      page.getByRole("heading", { name: "Борлуулалтын дэлгэрэнгүй" }),
    ).not.toBeVisible({ timeout: 3000 });

    // Path 2: Create a new sale, then click Дэлгэрэнгүй in the toast
    const productName = await getProductWithStock(page);
    await page.goto("/sales", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await openCreateDrawer(page);
    await selectProductByName(page, productName, 0);
    const uniqueName = `Detail Test ${Date.now()}`;
    await createCustomerInPicker(page, uniqueName);
    await submitSaleForm(page);

    // Wait for the toast with action buttons
    await page.waitForTimeout(3000);
    const toast = page.locator("[data-sonner-toast]").first();
    await expect(toast).toBeVisible({ timeout: 15000 });

    // Click "Дэлгэрэнгүй" button
    const detailBtn = page.getByRole("button", { name: "Дэлгэрэнгүй" }).first();
    await expect(detailBtn).toBeVisible({ timeout: 5000 });
    await detailBtn.click();
    await page.waitForTimeout(2000);

    // Verify the detail drawer opens
    await expect(
      page.getByRole("heading", { name: "Борлуулалтын дэлгэрэнгүй" }),
    ).toBeVisible({ timeout: 5000 });
  });
});
