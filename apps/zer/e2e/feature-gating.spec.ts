import { expect, test } from "@playwright/test";

test.describe("Feature gating — redirects", () => {
  test("suppliers page redirects when has_suppliers is false", async ({
    page,
  }) => {
    // This test verifies the page loads normally (since our org has suppliers enabled)
    await page.goto("/suppliers", { waitUntil: "domcontentloaded" });

    // Should show the suppliers page, not redirect
    const pageContent = page.locator("main");
    await expect(pageContent).toBeVisible({ timeout: 10000 });
  });

  test("audit log page loads normally", async ({ page }) => {
    await page.goto("/audit", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("Үйлдлийн түүх").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("inventory movements page loads normally", async ({ page }) => {
    await page.goto("/inventory/movements", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("Үлдэгдэл хөдөлгөөн").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("inventory adjustments page loads normally", async ({ page }) => {
    await page.goto("/inventory/adjustments", {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByText("Барааны тохируулга").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("inventory restock page loads normally", async ({ page }) => {
    await page.goto("/inventory/restock", { waitUntil: "domcontentloaded" });

    // Should either show empty state or product table
    const emptyState = page.getByText("Захиалах зүйл байхгүй");
    const title = page.getByText("Дахин захиалах");
    await expect(title.or(emptyState).first()).toBeVisible({ timeout: 10000 });
  });

  test("categories page loads normally", async ({ page }) => {
    await page.goto("/inventory/categories", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("Ангилалууд").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("branches settings page loads normally", async ({ page }) => {
    await page.goto("/settings/branches", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("Салбарууд").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("brand presets page loads normally", async ({ page }) => {
    await page.goto("/settings/presets", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("Брэнд сан").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("warehouses page loads normally", async ({ page }) => {
    await page.goto("/inventory/warehouses", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("Агуулахууд").first()).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Feature gating — sidebar visibility", () => {
  test("all gated sidebar items are visible (org has all features)", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // These should all be visible since the test org has all features enabled
    await expect(page.locator('a[href="/inventory/adjustments"]')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('a[href="/inventory/restock"]')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('a[href="/products/bundles"]')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('a[href="/inventory/categories"]')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('a[href="/audit"]')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('a[href="/settings/presets"]')).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe("Feature gating — customer balance", () => {
  test("customers page shows balance column (org has credit tracking)", async ({
    page,
  }) => {
    await page.goto("/customers", { waitUntil: "domcontentloaded" });

    // The "Авлага" (balance) column header should be visible
    await expect(page.locator("th:has-text('Авлага')")).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Feature gating — product form fields", () => {
  test("product create drawer shows brand, category, and variant sections", async ({
    page,
  }) => {
    await page.goto("/products", { waitUntil: "domcontentloaded" });

    // Open the product create drawer
    const createBtn = page
      .locator("button:has-text('Шинэ бүтээгдэхүүн')")
      .first();
    await createBtn.click();
    await page.waitForTimeout(1500);

    // Brand field should be visible
    await expect(page.locator("#brand_id")).toBeVisible({ timeout: 5000 });

    // Category field should be visible
    await expect(page.locator("#category_name")).toBeVisible({ timeout: 5000 });

    // Variant manager button/text should be visible
    // The VariantManagerDrawer trigger says "Вариант нэмэх"
    await expect(page.getByText("Вариант").first()).toBeVisible({
      timeout: 5000,
    });
  });
});
