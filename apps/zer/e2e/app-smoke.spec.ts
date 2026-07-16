import { expect, test } from "@playwright/test";

/**
 * Fast app smoke tests — uses `domcontentloaded` instead of `networkidle`
 * to avoid Supabase long-polling keeping the connection alive.
 *
 * Uses test.step() for structured HTML report output.
 * Captures console errors per page load.
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
  // Shop History opens a drawer, not a standalone page — skip in smoke tests
];

for (const [name, url, altText] of pages) {
  test(`${name} page loads`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await test.step(`Navigate to ${url}`, async () => {
      await page.goto(url, { waitUntil: "domcontentloaded" });
    });

    await test.step(`Verify ${name} renders`, async () => {
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

    // Fail if there were JS errors (excluding known benign warnings)
    const realErrors = errors.filter(
      (e) =>
        !e.includes("favicon") &&
        !e.includes("Midscene") &&
        !e.includes("downloadable font"),
    );
    expect(
      realErrors,
      `Console errors on ${name}: ${realErrors.join("; ")}`,
    ).toHaveLength(0);
  });
}
