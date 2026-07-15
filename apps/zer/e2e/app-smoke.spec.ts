import { expect, test } from "@playwright/test";

/**
 * Fast app smoke tests — uses `domcontentloaded` instead of `networkidle`
 * to avoid Supabase long-polling keeping the connection alive.
 *
 * Run: pnpm run test:e2e
 */

const pages: [string, string, string?][] = [
  ["Dashboard", "/"],
  ["Products", "/products"],
  ["Sales", "/sales"],
  ["Invoices", "/invoices"],
  ["Inventory", "/inventory"],
  ["Inventory Categories", "/inventory/categories"],
  ["Inventory Warehouses", "/inventory/warehouses"],
  ["Inventory Movements", "/inventory/movements"],
  ["Expenses", "/expenses"],
  ["Customers", "/customers"],
  ["Suppliers", "/suppliers"],
  ["Reports", "/reports"],
  ["Purchases", "/purchases"],
  ["Returns", "/returns"],
  ["Quotations", "/quotations"],
  ["Cash Register", "/cash-register"],
  ["Settings Notifications", "/settings/notifications"],
  ["Settings Users", "/settings/users"],
  ["Settings Roles", "/settings/roles"],
  ["Settings SMTP", "/settings/smtp"],
  ["Settings Branding", "/settings/branding"],
  ["Accounting", "/accounting"],
  ["Discounts", "/discounts"],
  ["Commissions", "/commissions"],
  ["Shop", "/shop", "Дэлгүүр"],
  ["Shop Cart", "/shop/cart", "Сагс"],
  ["Shop History", "/shop/history"],
];

for (const [name, url, altText] of pages) {
  test(`${name} page loads`, async ({ page }) => {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    if (altText) {
      await expect(page.getByText(altText).first()).toBeVisible({
        timeout: 15000,
      });
    } else {
      await expect(page.locator("main").first()).toBeVisible({
        timeout: 15000,
      });
    }
  });
}
