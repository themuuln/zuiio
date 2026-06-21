import { expect, test } from "@playwright/test";
import { openDrawerByText } from "./helpers";

test.describe("Restock feature", () => {
  test("quick restock drawer opens from low-stock inventory", async ({
    page,
  }) => {
    await page.goto("/inventory", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Check the page loaded
    await expect(page.getByText("Агуулах").first()).toBeVisible({
      timeout: 10000,
    });

    // If there are low-stock products, the "Захиалах" button should be present
    const restockBtn = page.locator("button:has-text('Захиалах')").first();
    const hasRestockBtn = (await restockBtn.count()) > 0;

    if (hasRestockBtn) {
      await restockBtn.click();
      await page.waitForTimeout(1500);

      // The restock drawer should open with title "Дахин захиалах"
      await expect(page.getByText("Дахин захиалах").first()).toBeVisible({
        timeout: 5000,
      });

      // Supplier should be pre-selected (default first supplier)
      // Verify the form has the required fields
      await expect(page.getByText("Тоо хэмжээ").first()).toBeVisible();
      await expect(page.getByText("Өртөг").first()).toBeVisible();
    }
  });

  test("restock page loads and shows product table", async ({ page }) => {
    await page.goto("/inventory/restock", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // The page should have loaded - title present
    await expect(page.getByText("Дахин захиалах").first()).toBeVisible({
      timeout: 10000,
    });

    // Either empty state or product table
    const emptyState = page.getByText("Захиалах зүйл байхгүй");
    const productTable = page.locator("table").first();

    if (await emptyState.isVisible().catch(() => false)) {
      await expect(emptyState).toBeVisible();
    } else {
      await expect(productTable).toBeVisible({ timeout: 5000 });
      // Select-all checkbox should be present
      const checkbox = page.locator('input[type="checkbox"]').first();
      await expect(checkbox).toBeVisible();
    }
  });
});

test.describe("Batch stock adjustments", () => {
  test("adjustments page loads", async ({ page }) => {
    await page.goto("/inventory/adjustments", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    await expect(page.getByText("Барааны тохируулга").first()).toBeVisible({
      timeout: 10000,
    });

    // Should have a "Шинэ тохируулга" button
    await expect(
      page
        .locator(
          "a:has-text('Шинэ тохируулга'), button:has-text('Шинэ тохируулга')",
        )
        .first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test("new adjustment form loads with product selector", async ({ page }) => {
    await page.goto("/inventory/adjustments/new", {
      waitUntil: "networkidle",
    });
    await page.waitForTimeout(2000);

    await expect(page.getByText("Бөөнөөр тохируулга").first()).toBeVisible({
      timeout: 10000,
    });

    // Product search combobox should be present
    await expect(page.getByPlaceholder("Бараа хайх...").first()).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe("Product bundles", () => {
  test("bundles page loads", async ({ page }) => {
    await page.goto("/products/bundles", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    await expect(page.getByText("Багц бүтээгдэхүүн").first()).toBeVisible({
      timeout: 10000,
    });

    // Either empty state or a table with bundles
    const emptyState = page.getByText("Багц бүртгэгдээгүй");
    const table = page.locator("table").first();

    if (await emptyState.isVisible().catch(() => false)) {
      await expect(emptyState).toBeVisible();
    } else {
      await expect(table).toBeVisible({ timeout: 5000 });
    }
  });

  test("bundle create drawer opens", async ({ page }) => {
    await page.goto("/products/bundles", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Click "Шинэ багц" button
    await openDrawerByText(page, "Шинэ багц");

    // Drawer should show form fields
    await expect(page.getByText("Багцын нэр").first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Багцын бараанууд").first()).toBeVisible();
  });
});

test.describe("Sidebar navigation", () => {
  test("sidebar has links to new pages", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);

    // Look for the sidebar navigation links by href
    await expect(page.locator('a[href="/inventory/adjustments"]')).toBeVisible({
      timeout: 15000,
    });

    await expect(page.locator('a[href="/inventory/restock"]')).toBeVisible({
      timeout: 5000,
    });

    await expect(page.locator('a[href="/products/bundles"]')).toBeVisible({
      timeout: 5000,
    });
  });
});
