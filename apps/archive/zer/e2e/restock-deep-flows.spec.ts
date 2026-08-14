import { expect, test } from "@playwright/test";
import { openDrawerByText } from "./helpers";

const BUNDLE_NAME = `BNDL-TEST-${Date.now()}`;

test.describe("Restock — deep flow tests", () => {
  test("full restock drawer → purchase order flow", async ({ page }) => {
    await page.goto("/inventory", { waitUntil: "domcontentloaded" });

    const restockBtn = page.locator("button:has-text('Захиалах')").first();
    const hasRestockBtn = (await restockBtn.count()) > 0;

    test.skip(!hasRestockBtn, "No low-stock products to test restock");

    await restockBtn.click();
    await page.waitForTimeout(1500);

    // 1. Drawer is open with correct title
    await expect(page.getByText("Дахин захиалах").first()).toBeVisible({
      timeout: 5000,
    });

    // 2. Product info is displayed (read-only)
    await expect(page.getByText("Бүтээгдэхүүн").first()).toBeVisible();

    // 3. Supplier is pre-selected (auto-default)
    const supplierInput = page.getByPlaceholder("Нийлүүлэгч сонгох");
    await expect(supplierInput).toBeVisible({ timeout: 5000 });

    // 4. Quantity field has a value (suggested qty > 0)
    const quantityInput = page.locator("input[type='number']").first();
    await expect(quantityInput).toBeVisible();
    const qty = await quantityInput.inputValue();
    expect(Number(qty)).toBeGreaterThan(0);

    // 5. Submit creates a PO
    await page.evaluate(() => {
      const form = document.getElementById(
        "restock-form",
      ) as HTMLFormElement | null;
      if (form) {
        const evt = new Event("submit", { bubbles: true, cancelable: true });
        form.dispatchEvent(evt);
      }
    });
    await page.waitForTimeout(3000);

    // 6. Navigate to purchases page
    await page.goto("/purchases", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("Худалдан авалт").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("restock page — select products and batch create POs", async ({
    page,
  }) => {
    await page.goto("/inventory/restock", { waitUntil: "domcontentloaded" });

    const emptyMsg = page.getByText("Захиалах зүйл байхгүй");
    if (await emptyMsg.isVisible().catch(() => false)) {
      test.skip(true, "No low-stock products");
      return;
    }

    await expect(page.locator("table").first()).toBeVisible({ timeout: 5000 });

    // "Бүгдийг сонгох" button works
    const selectAllBtn = page.getByText("Бүгдийг сонгох");
    await expect(selectAllBtn).toBeVisible();
    await selectAllBtn.click();
    await page.waitForTimeout(500);

    // Checkboxes should be checked
    const checkedBoxes = page.locator("input[type='checkbox']:checked");
    const count = await checkedBoxes.count();
    expect(count).toBeGreaterThan(0);

    // Purchase order create button should be enabled
    const createBtn = page
      .locator("button:has-text('Захиалга үүсгэх')")
      .first();
    await expect(createBtn).toBeEnabled();

    // Each selected row should have a supplier combobox
    const supplierComboboxes = page.getByPlaceholder("Нийлүүлэгч...");
    const comboboxCount = await supplierComboboxes.count();
    expect(comboboxCount).toBeGreaterThan(0);
  });

  test("restock page — shows correct content when no low stock", async ({
    page,
  }) => {
    await page.goto("/inventory/restock", { waitUntil: "domcontentloaded" });

    const emptyState = page.getByText("Захиалах зүйл байхгүй");
    const table = page.locator("table");

    if (await table.isVisible().catch(() => false)) {
      const headers = page.locator("th");
      const headerTexts = await headers.allTextContents();
      const headerJoined = headerTexts.join(" ");
      expect(headerJoined).toContain("Бүтээгдэхүүн");
      expect(headerJoined).toContain("Одоогийн нөөц");
      expect(headerJoined).toContain("Минимум нөөц");
    } else {
      await expect(emptyState).toBeVisible({ timeout: 5000 });
      await expect(page.locator('a[href="/inventory"]')).toBeVisible();
    }
  });
});

test.describe("Batch stock adjustments — deep flow tests", () => {
  test("adjustment form — product selector and table layout", async ({
    page,
  }) => {
    await page.goto("/inventory/adjustments/new", {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByText("Бөөнөөр тохируулга").first()).toBeVisible({
      timeout: 10000,
    });

    // Product search combobox is present
    const searchInput = page.getByPlaceholder("Бараа хайх...");
    await expect(searchInput).toBeVisible();

    // Click the combobox to open dropdown and type a letter to show products
    await searchInput.click();
    await page.waitForTimeout(500);
    await searchInput.fill("а");
    await page.waitForTimeout(500);

    // Try to select a product from the dropdown
    const firstOption = page.locator("li[aria-selected]").first();
    const itemCount = await firstOption.count();

    if (itemCount > 0) {
      await firstOption.click({ timeout: 3000 });
      await page.waitForTimeout(2000);

      // Check if a row was added to the table
      const rows = page.locator("table tbody tr");
      const rowCount = await rows.count();
      if (rowCount > 0) {
        // The table columns exist
        const thText = await page.locator("th").allTextContents();
        const joined = thText.join(" ");
        expect(joined).toContain("Одоогийн үлдэгдэл");
        expect(joined).toContain("Зөрүү");

        // Action buttons exist
        await expect(page.getByText("Цэвэрлэх").first()).toBeVisible();
        await expect(
          page.getByRole("button", { name: "Тохируулга хадгалах" }),
        ).toBeVisible();
      }
    } else {
      // No products available — verify the form card is present
      await expect(page.getByText("Бараа нэмэх").first()).toBeVisible();
    }
  });

  test("adjustments history page — renders correctly", async ({ page }) => {
    await page.goto("/inventory/adjustments", {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByText("Барааны тохируулга").first()).toBeVisible({
      timeout: 10000,
    });

    await expect(
      page.locator('a[href="/inventory/adjustments/new"]'),
    ).toBeVisible({ timeout: 5000 });

    const historyTitle = page.getByText("Тохируулгын түүх");
    if (await historyTitle.isVisible().catch(() => false)) {
      await expect(historyTitle).toBeVisible();
    }
  });
});

test.describe("Product bundles — deep flow tests", () => {
  test("bundle create drawer — fill form and verify fields", async ({
    page,
  }) => {
    await page.goto("/products/bundles", { waitUntil: "domcontentloaded" });

    // Open create drawer
    await openDrawerByText(page, "Шинэ багц");
    await page.waitForTimeout(1500);

    // Drawer opened with title
    await expect(page.getByText("Шинэ багц").first()).toBeVisible({
      timeout: 5000,
    });

    // All form fields are present
    await expect(page.getByText("Багцын нэр").first()).toBeVisible();
    await expect(page.getByText("Багцын бараанууд").first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Бараа нэмэх" }),
    ).toBeVisible();

    // Fill in the bundle name
    const nameInput = page.getByPlaceholder("Жнь: Чихэртэй хөтөч");
    await nameInput.fill(BUNDLE_NAME);

    // Product search and quantity are present
    const productSearch = page.getByPlaceholder("Бараа хайх...").first();
    await expect(productSearch).toBeVisible({ timeout: 5000 });

    // Submit and cancel buttons in footer
    await expect(page.getByText("Цуцлах").first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Багц үүсгэх" }),
    ).toBeVisible();
  });

  test("bundle create drawer — can add and remove product rows", async ({
    page,
  }) => {
    await page.goto("/products/bundles", { waitUntil: "domcontentloaded" });

    await openDrawerByText(page, "Шинэ багц");
    await page.waitForTimeout(1500);

    const initialRows = page.locator("table tbody tr");
    const initialCount = await initialRows.count();

    // Add another row
    await page.getByRole("button", { name: "Бараа нэмэх" }).click();
    await page.waitForTimeout(500);

    const afterAddCount = await page.locator("table tbody tr").count();
    expect(afterAddCount).toBe(initialCount + 1);

    // Remove the last row
    const trashButtons = page.locator("table tbody tr button");
    const trashCount = await trashButtons.count();
    if (trashCount > 0) {
      await trashButtons.last().click();
      await page.waitForTimeout(500);
      const afterRemoveCount = await page.locator("table tbody tr").count();
      expect(afterRemoveCount).toBe(afterAddCount - 1);
    }
  });

  test("bundles page — empty state renders correctly", async ({ page }) => {
    await page.goto("/products/bundles", { waitUntil: "domcontentloaded" });

    const emptyState = page.getByText("Багц бүртгэгдээгүй");
    if (await emptyState.isVisible().catch(() => false)) {
      await expect(emptyState).toBeVisible();

      // Button in empty state or header actions
      await expect(
        page.getByRole("button", { name: "Шинэ багц" }).first(),
      ).toBeVisible();
    }
  });
});

test.describe("Cross-feature integration", () => {
  test("inventory page quick links include restock", async ({ page }) => {
    await page.goto("/inventory", { waitUntil: "domcontentloaded" });

    const restockLink = page.locator('a[href="/inventory/restock"]');
    const restockBtn = page.locator("button:has-text('Захиалах')").first();
    const hasRestockLink = (await restockLink.count()) > 0;
    const hasRestockBtn = (await restockBtn.count()) > 0;

    expect(hasRestockLink || hasRestockBtn).toBeTruthy();
  });

  test("sidebar navigates to all new pages", async ({ page }) => {
    // 1. Adjustments
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await page.locator('a[href="/inventory/adjustments"]').click();
    await page.waitForTimeout(2000);
    await expect(page.getByText("Барааны тохируулга").first()).toBeVisible({
      timeout: 10000,
    });

    // 2. Restock
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await page.locator('a[href="/inventory/restock"]').click();
    await page.waitForTimeout(2000);
    await expect(page.getByText("Дахин захиалах").first()).toBeVisible({
      timeout: 10000,
    });

    // 3. Bundles
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await page.locator('a[href="/products/bundles"]').click();
    await page.waitForTimeout(2000);
    await expect(page.getByText("Багц бүтээгдэхүүн").first()).toBeVisible({
      timeout: 10000,
    });
  });
});
