import { expect, test } from "@playwright/test";

test.describe("Inventory Movements module", () => {
  test("movements list page loads correctly", async ({ page }) => {
    await page.goto("/inventory/movements", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("Барааны хөдөлгөөн").first()).toBeVisible({
      timeout: 10000,
    });

    // Should show either the table or empty state
    const tableTitle = page.getByText("Сүүлийн бүртгэлүүд");
    const emptyState = page.getByText("Хөдөлгөөн бүртгэгдээгүй");
    await expect(tableTitle.or(emptyState).first()).toBeVisible({
      timeout: 10000,
    });

    // Verify "Шинэ хөдөлгөөн" button exists
    const createBtn = page.getByText("Шинэ хөдөлгөөн").first();
    await expect(createBtn).toBeVisible({ timeout: 5000 });
  });

  test("create movement page shows form fields", async ({ page }) => {
    await page.goto("/inventory/movements/new", {
      waitUntil: "domcontentloaded",
    });

    // Form page should render
    await expect(
      page.getByText("Барааны хөдөлгөөн бүртгэх").first(),
    ).toBeVisible({ timeout: 10000 });

    // Form section card should render
    await expect(page.getByText("Хөдөлгөөний мэдээлэл")).toBeVisible({
      timeout: 5000,
    });

    // Product selector should exist
    await expect(page.locator("#product_id")).toBeVisible({ timeout: 5000 });

    // Movement type dropdown should exist
    await expect(page.locator("#type")).toBeVisible({ timeout: 5000 });

    // Quantity input should exist
    await expect(page.locator("#quantity")).toBeVisible({ timeout: 5000 });

    // Unit cost input should exist
    await expect(page.locator("#unit_cost")).toBeVisible({ timeout: 5000 });

    // Reference and notes fields
    await expect(page.locator("#reference")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#notes")).toBeVisible({ timeout: 5000 });

    // Submit button should exist
    const submitBtn = page.getByText("Хадгалах");
    await expect(submitBtn).toBeVisible({ timeout: 5000 });
  });

  test("create movement form has movement type dropdown", async ({ page }) => {
    await page.goto("/inventory/movements/new", {
      waitUntil: "domcontentloaded",
    });

    // Type dropdown should exist with both options
    const typeSelect = page.locator("#type");
    await expect(typeSelect).toBeVisible({ timeout: 5000 });

    // Should have the correct options
    const options = await typeSelect.locator("option").allTextContents();
    expect(options).toContain("Орлого");
    expect(options).toContain("Тохируулга");
  });
});
