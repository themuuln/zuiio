import { bayViewFixture } from "./fixtures";
import { setEnglishLocale } from "./helpers";
import { mockBayView, mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(20_000);

test.describe("Responsive Layouts (Mocked)", () => {
  test("bay view loads on desktop", async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockBayView(page, bayViewFixture());
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/dashboard/bay-view");
    await expect(
      page.getByRole("region", { name: /bay/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("bay view loads on tablet", async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockBayView(page, bayViewFixture());
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/dashboard/bay-view");
    await expect(
      page
        .getByRole("region", { name: /bay/i })
        .or(page.getByText(/bay|loading/i))
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("bay view loads on mobile", async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockBayView(page, bayViewFixture());
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dashboard/bay-view");
    // Bay cards have "BAY 01", "BAY 02" etc. — use that instead of breadcrumb
    await expect(page.getByText(/bay 0[1-6]/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("services loads on desktop", async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/dashboard/services");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("services loads on mobile", async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dashboard/services");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
