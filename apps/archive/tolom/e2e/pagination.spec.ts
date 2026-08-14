import {
  customerFixture,
  serviceCatalogFixture,
  workOrderListItemFixture,
} from "./fixtures";
import { setEnglishLocale } from "./helpers";
import {
  mockCustomers,
  mockServices,
  mockSupabaseREST,
  mockWorkOrders,
} from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

test.describe("Pagination & Empty Tables (Mocked)", () => {
  test.describe("Services", () => {
    test.beforeEach(async ({ page }) => {
      await setEnglishLocale(page);
      await mockSupabaseREST(page);
    });

    test("services table shows pagination controls", async ({ page }) => {
      await mockServices(page, [
        serviceCatalogFixture({ name: "Oil Change" }),
        serviceCatalogFixture({
          id: "e2e-00000000-0000-0000-0000-000000000099",
          name: "Brake Service",
        }),
      ]);
      await page.goto("/dashboard/services");
      await expect(
        page.getByText(/page|rows per page|showing/i).first(),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("services table shows row count", async ({ page }) => {
      await mockServices(page, [
        serviceCatalogFixture({ name: "Oil Change" }),
        serviceCatalogFixture({
          id: "e2e-00000000-0000-0000-0000-000000000099",
          name: "Brake Service",
        }),
      ]);
      await page.goto("/dashboard/services");
      await expect(page.getByText(/\d+ service/i).first()).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe("Customers", () => {
    test.beforeEach(async ({ page }) => {
      await setEnglishLocale(page);
      await mockSupabaseREST(page);
    });

    test("customers table shows pagination controls", async ({ page }) => {
      await mockCustomers(page, [
        customerFixture({ full_name: "John Doe" }),
        customerFixture({
          id: "e2e-00000000-0000-0000-0000-000000000099",
          full_name: "Jane Smith",
        }),
      ]);
      await page.goto("/dashboard/customers");
      await expect(
        page.getByText(/page|rows per page|showing/i).first(),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("customers table shows row count", async ({ page }) => {
      await mockCustomers(page, [
        customerFixture({ full_name: "John Doe" }),
        customerFixture({
          id: "e2e-00000000-0000-0000-0000-000000000099",
          full_name: "Jane Smith",
        }),
      ]);
      await page.goto("/dashboard/customers");
      await expect(page.getByText(/\d+ customer/i).first()).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe("Work Orders", () => {
    test.beforeEach(async ({ page }) => {
      await setEnglishLocale(page);
      await mockSupabaseREST(page);
    });

    test("work orders table shows pagination controls", async ({ page }) => {
      await mockWorkOrders(page, [
        workOrderListItemFixture({ status: "in_progress" }),
        workOrderListItemFixture({
          id: "e2e-00000000-0000-0000-0000-000000000042",
          status: "waiting_for_parts",
        }),
      ]);
      await page.goto("/dashboard/work-orders");
      await expect(
        page.getByText(/page|rows per page|showing/i).first(),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("work orders table shows row count", async ({ page }) => {
      await mockWorkOrders(page, [
        workOrderListItemFixture({ status: "in_progress" }),
        workOrderListItemFixture({
          id: "e2e-00000000-0000-0000-0000-000000000042",
          status: "waiting_for_parts",
        }),
      ]);
      await page.goto("/dashboard/work-orders");
      await expect(page.getByText(/\d+ work.?order/i).first()).toBeVisible({
        timeout: 10_000,
      });
    });
  });
});
