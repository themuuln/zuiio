import { overviewDashboardFixture } from "./fixtures";
import { setEnglishLocale } from "./helpers";
import {
  mockOrganizations,
  mockOverviewDashboard,
  mockProfile,
  mockSupabaseREST,
} from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

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
      // All 4 KPI card labels should be visible (the insights list can repeat
      // a label like "Active Work Orders" — take the first, the KPI card)
      await expect(
        page.getByText("Total Revenue", { exact: true }).first(),
      ).toBeVisible();
      await expect(
        page.getByText("Active Work Orders", { exact: true }).first(),
      ).toBeVisible();
      await expect(
        page.getByText("Total Customers", { exact: true }).first(),
      ).toBeVisible();
      await expect(
        page.getByText("Avg Repair Order", { exact: true }).first(),
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
        page.getByText(/latest 10 (work )?orders/i).first(),
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
