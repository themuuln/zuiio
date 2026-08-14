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

test.describe("Search & Filter (Mocked)", () => {
  test.describe("Services", () => {
    test.beforeEach(async ({ page }) => {
      await setEnglishLocale(page);
      await mockSupabaseREST(page);
      await mockServices(page, [
        serviceCatalogFixture({ name: "Oil Change" }),
        serviceCatalogFixture({
          id: "e2e-00000000-0000-0000-0000-000000000099",
          name: "Brake Service",
        }),
      ]);
      await page.goto("/dashboard/services");
    });

    test("search input is visible", async ({ page }) => {
      await expect(page.getByRole("textbox").first()).toBeVisible({
        timeout: 10_000,
      });
    });

    test("search input is interactive", async ({ page }) => {
      const searchInput = page.getByRole("textbox").first();
      await searchInput.fill("Oil");
      expect(await searchInput.inputValue()).toBe("Oil");
    });
  });

  test.describe("Customers", () => {
    test.beforeEach(async ({ page }) => {
      await setEnglishLocale(page);
      await mockSupabaseREST(page);
      await mockCustomers(page, [
        customerFixture({ full_name: "John Doe" }),
        customerFixture({
          id: "e2e-00000000-0000-0000-0000-000000000099",
          full_name: "Jane Smith",
        }),
      ]);
      await page.goto("/dashboard/customers");
    });

    test("search input is visible", async ({ page }) => {
      await expect(page.getByRole("textbox").first()).toBeVisible({
        timeout: 10_000,
      });
    });

    test("search input is interactive", async ({ page }) => {
      const searchInput = page.getByRole("textbox").first();
      await searchInput.fill("John");
      expect(await searchInput.inputValue()).toBe("John");
    });
  });

  test.describe("Work Orders", () => {
    test.beforeEach(async ({ page }) => {
      await setEnglishLocale(page);
      await mockSupabaseREST(page);
      await mockWorkOrders(page, [
        workOrderListItemFixture({ status: "in_progress" }),
        workOrderListItemFixture({
          id: "e2e-00000000-0000-0000-0000-000000000042",
          status: "waiting_for_parts",
        }),
      ]);
      await page.goto("/dashboard/work-orders");
    });

    test("search input is visible", async ({ page }) => {
      await expect(page.getByRole("textbox").first()).toBeVisible({
        timeout: 10_000,
      });
    });

    test("search input is interactive", async ({ page }) => {
      const searchInput = page.getByRole("textbox").first();
      await searchInput.fill("test");
      expect(await searchInput.inputValue()).toBe("test");
    });
  });
});
