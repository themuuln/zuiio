import { overviewDashboardFixture } from "./fixtures";
import { setEnglishLocale } from "./helpers";
import {
  mockOrganizations,
  mockOverviewDashboard,
  mockProfile,
  mockSupabaseREST,
} from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(15_000);

test.describe("Overview (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockProfile(page);
    await mockOrganizations(page);
    await mockOverviewDashboard(page);
    await page.goto("/dashboard");
  });

  test.describe("Page Structure", () => {
    test("loads with welcome heading", async ({ page }) => {
      await expect(
        page.getByRole("heading", {
          level: 2,
          name: /welcome to toLOM/i,
        }),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("shows KPI summary cards", async ({ page }) => {
      // All 4 KPI card labels should be visible
      await expect(
        page.getByRole("heading", { name: /total revenue/i }).first(),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /active work orders/i }).first(),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /total customers/i }).first(),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /avg repair order/i }).first(),
      ).toBeVisible();
    });
  });

  test.describe("Recent Work Orders", () => {
    test("shows work order table with data", async ({ page }) => {
      // Table header columns
      await expect(page.getByText("ID").first()).toBeVisible();
      await expect(page.getByText("Customer").first()).toBeVisible();
      await expect(page.getByText("Vehicle").first()).toBeVisible();
      await expect(page.getByText("Status").first()).toBeVisible();
    });

    test("shows section header for recent work orders", async ({ page }) => {
      await expect(page.getByText("Recent Work Orders").first()).toBeVisible();
      await expect(
        page.getByText("Latest 10 work orders").first(),
      ).toBeVisible();
    });

    test("shows empty state when no work orders", async ({ page }) => {
      // Re-mock with empty work orders
      await mockOverviewDashboard(
        page,
        overviewDashboardFixture({ recentWorkOrders: [] }),
      );
      await page.goto("/dashboard");

      await expect(page.getByText("No work orders yet").first()).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe("Charts Section", () => {
    test("shows insights and trends collapsible section", async ({ page }) => {
      await expect(page.getByText("Insights & Trends").first()).toBeVisible();
    });
  });

  test.describe("Sidebar Navigation", () => {
    test("has sidebar navigation visible", async ({ page }) => {
      await expect(page.getByRole("complementary")).toBeVisible({
        timeout: 10_000,
      });
    });
  });
});
