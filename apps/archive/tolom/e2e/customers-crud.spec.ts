import { customerFixture } from "./fixtures";
import { setEnglishLocale } from "./helpers";
import { mockCrudMutations, mockCustomers, mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

test.describe("Customers CRUD (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockCustomers(page, [customerFixture()]);
    await mockCrudMutations(page, "customers");
    await page.goto("/dashboard/customers");
  });

  test("loads customer list", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("shows customer data", async ({ page }) => {
    await expect(
      page.getByRole("table").or(page.getByRole("row")).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("add customer button triggers form", async ({ page }) => {
    const addBtn = page
      .locator("button")
      .filter({ hasText: /customer/i })
      .first();
    await addBtn.click();
    await expect(
      page.getByRole("dialog").or(page.getByRole("textbox")).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
