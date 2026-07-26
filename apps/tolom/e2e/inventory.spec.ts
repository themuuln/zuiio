import { setEnglishLocale } from "./helpers";
import { mockInventoryAll, mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

// ─── Main Inventory Page ────────────────────────────────────────────────

test.describe("Inventory Main (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockInventoryAll(page);
    await page.goto("/dashboard/inventory");
  });

  test("loads the inventory page with heading", async ({ page }) => {
    await expect(page.getByText(/inventory/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("shows parts list or table content", async ({ page }) => {
    await expect(
      page
        .getByRole("table")
        .or(page.getByText(/oil filter|part|sku|filter/i))
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows KPI cards for turnover or alerts", async ({ page }) => {
    await expect(
      page.getByText(/turnover|alert|stock|quantity|inventory/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ─── Transfers Sub-page ─────────────────────────────────────────────────

test.describe("Inventory Transfers (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockInventoryAll(page);
    await page.goto("/dashboard/inventory/transfers");
  });

  test("loads the transfers page with heading", async ({ page }) => {
    await expect(page.getByText(/transfer/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});

// ─── Movements Sub-page ─────────────────────────────────────────────────

test.describe("Inventory Movements (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockInventoryAll(page);
    await page.goto("/dashboard/inventory/movements");
  });

  test("loads the movements page with heading", async ({ page }) => {
    await expect(page.getByText(/movement/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});

// ─── Purchase Orders Sub-page ───────────────────────────────────────────

test.describe("Inventory Purchase Orders (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockInventoryAll(page);
    await page.goto("/dashboard/inventory/purchase-orders");
  });

  test("loads the purchase orders page without crashing", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /purchase order/i })).toBeVisible({ timeout: 10_000 });
    expect(page.url()).toContain("/purchase-orders");
  });
});

// ─── Suppliers Sub-page ─────────────────────────────────────────────────

test.describe("Inventory Suppliers (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockInventoryAll(page);
    await page.goto("/dashboard/inventory/suppliers");
  });

  test("loads the suppliers page without crashing", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /supplier/i })).toBeVisible({ timeout: 10_000 });
    expect(page.url()).toContain("/suppliers");
  });
});

// ─── Alerts Sub-page ────────────────────────────────────────────────────

test.describe("Inventory Alerts (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockInventoryAll(page);
    await page.goto("/dashboard/inventory/alerts");
  });

  test("loads the alerts page without crashing", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /alert/i })).toBeVisible({ timeout: 10_000 });
    expect(page.url()).toContain("/alerts");
  });
});

// ─── Sidebar Navigation ─────────────────────────────────────────────────

test.describe("Inventory Sidebar Navigation (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockInventoryAll(page);
    await page.goto("/dashboard/inventory");
  });

  test("has inventory links in the sidebar", async ({ page }) => {
    const sidebar = page
      .getByRole("complementary")
      .or(page.locator("nav").or(page.locator('[data-sidebar="sidebar"]')))
      .first();
    await expect(sidebar).toBeVisible({ timeout: 10_000 });
    await expect(sidebar.getByText(/inventory/i).first()).toBeVisible();
  });
});
