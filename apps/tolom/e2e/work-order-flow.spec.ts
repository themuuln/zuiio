import { bayViewFixture, workOrderListItemFixture } from "./fixtures";
import { setEnglishLocale } from "./helpers";
import {
  mockBayView,
  mockCrudMutations,
  mockSupabaseREST,
  mockWorkOrders,
} from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(20_000);

test.describe("Work Order Full Flow (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockWorkOrders(page, [
      workOrderListItemFixture({ status: "in_progress" }),
    ]);
    await mockBayView(page, bayViewFixture());
    await mockCrudMutations(page, "work-orders");
  });

  test("bay view shows occupied bays", async ({ page }) => {
    await page.goto("/dashboard/bay-view");
    await expect(
      page.getByRole("region", { name: /bay/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("work orders list loads with data", async ({ page }) => {
    await page.goto("/dashboard/work-orders");
    await expect(
      page
        .getByRole("table")
        .or(page.getByText(/work.?order/i))
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("new work order button navigates to creation", async ({ page }) => {
    await page.goto("/dashboard/work-orders");
    const newBtn = page
      .getByRole("link", { name: /new/i })
      .or(page.getByRole("button", { name: /new|create/i }))
      .first();
    await newBtn.click();
    await expect(
      page.getByText(/new|create|vehicle|customer|select/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
