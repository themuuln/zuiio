import { expect, test } from "@playwright/test";
import { setFormField, submitDrawerForm } from "./helpers";

const PRODUCT_NAME = `E2E-URL-${Date.now()}`;

test.describe("Product create drawer via URL", () => {
  test("/products/new opens drawer with form fields", async ({ page }) => {
    await page.goto("/products/new", { waitUntil: "domcontentloaded" });

    // Drawer should open automatically — wait for the heading
    await expect(
      page.getByRole("heading", { name: "Шинэ бүтээгдэхүүн" }),
    ).toBeVisible({ timeout: 10000 });

    // Form fields should be visible inside the drawer
    await expect(page.locator("#name")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#sku")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#cost_price")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#sale_price")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#current_stock")).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId("create-product-submit")).toBeVisible({
      timeout: 5000,
    });
  });

  test("closing drawer navigates to /products", async ({ page }) => {
    await page.goto("/products/new", { waitUntil: "domcontentloaded" });

    // Wait for drawer to open
    await expect(
      page.getByRole("heading", { name: "Шинэ бүтээгдэхүүн" }),
    ).toBeVisible({ timeout: 10000 });

    // Press Escape to close the drawer
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1000);

    // Should navigate to /products
    await expect(page).toHaveURL(/\/products$/, { timeout: 5000 });
  });

  test("creating a product via URL drawer lands on product list", async ({
    page,
  }) => {
    await page.goto("/products/new", { waitUntil: "domcontentloaded" });

    // Wait for drawer to open
    await expect(
      page.getByRole("heading", { name: "Шинэ бүтээгдэхүүн" }),
    ).toBeVisible({ timeout: 10000 });

    // Fill the form
    await setFormField(page, "name", PRODUCT_NAME);
    await setFormField(page, "sku", `SKU-${Date.now()}`);
    await setFormField(page, "sale_price", "1000");
    await setFormField(page, "cost_price", "500");
    await setFormField(page, "current_stock", "10");

    // Submit via the helper (dispatches native submit event)
    await submitDrawerForm(page, "product-form");

    // Should redirect to /products after successful creation
    await expect(page).toHaveURL(/\/products$/, { timeout: 15000 });

    // The new product should appear in the list
    await expect(page.getByText(PRODUCT_NAME).first()).toBeVisible({
      timeout: 10000,
    });
  });
});
