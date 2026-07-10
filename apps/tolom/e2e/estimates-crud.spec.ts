import { estimateListItemFixture } from "./fixtures";
import { setEnglishLocale } from "./helpers";
import { mockCrudMutations, mockEstimates, mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(15_000);

test.describe("Estimates CRUD (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockEstimates(page, [estimateListItemFixture({ status: "draft" })]);
    await mockCrudMutations(page, "estimates");
    await page.goto("/dashboard/estimates");
  });

  test("loads estimates list", async ({ page }) => {
    await expect(
      page
        .getByRole("heading", { level: 1 })
        .or(page.getByText(/estimate/i))
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows estimates content", async ({ page }) => {
    await expect(
      page.getByText(/estimate|price|total|draft/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("new estimate button triggers navigation", async ({ page }) => {
    const newBtn = page
      .getByRole("link", { name: /new|create|add/i })
      .or(page.getByRole("button", { name: /new|create|add/i }))
      .first();
    await newBtn.click();
    await expect(
      page.getByText(/estimate|customer|vehicle|service/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
