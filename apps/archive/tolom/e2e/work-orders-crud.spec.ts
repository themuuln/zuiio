import { workOrderListItemFixture } from "./fixtures";
import { setEnglishLocale } from "./helpers";
import { mockCrudMutations, mockSupabaseREST, mockWorkOrders } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

test.describe("Work Orders CRUD (Mocked)", () => {
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
    await mockCrudMutations(page, "work-orders");
    await page.goto("/dashboard/work-orders");
  });

  test("loads work orders list", async ({ page }) => {
    await expect(
      page
        .getByRole("heading", { level: 1 })
        .or(page.getByText(/work.?order/i))
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows work order table", async ({ page }) => {
    await expect(
      page.getByRole("table").or(page.getByRole("row")).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("new work order button triggers navigation", async ({ page }) => {
    const newBtn = page
      .getByRole("link", { name: /new/i })
      .or(page.getByRole("button", { name: /new|create|add/i }))
      .first();
    await newBtn.click();
    await expect(
      page.getByText(/new|create|vehicle|customer|select/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
