import { expect, test } from "@playwright/test";

/**
 * Fast app smoke tests — uses `domcontentloaded` instead of `networkidle`
 * to avoid Supabase long-polling keeping the connection alive.
 *
 * Run: pnpm run test:e2e
 */

const pages: [string, string][] = [
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
  ["Settings", "/settings"],
  ["Settings Notifications", "/settings/notifications"],
  ["Settings Users", "/settings/users"],
  ["Settings Roles", "/settings/roles"],
  ["Settings SMTP", "/settings/smtp"],
  ["Settings Branding", "/settings/branding"],
  ["Accounting", "/accounting"],
  ["Discounts", "/discounts"],
  ["Commissions", "/commissions"],
  ["Shop", "/shop"],
  ["Shop Cart", "/shop/cart"],
  ["Shop History", "/shop/history"],
];

for (const [name, url] of pages) {
  test(`${name} page loads`, async ({ page }) => {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    // The dashboard shell has sidebar + main region
    // For the dashboard ("/"), the server redirects or renders KPIs
    await expect(page.locator("main")).toBeVisible({ timeout: 15000 });
  });
}
