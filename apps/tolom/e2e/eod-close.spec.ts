import { setEnglishLocale } from "./helpers";
import { mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(15_000);

test.describe("EOD Close (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await page.goto("/dashboard/eod-close");
  });

  test("loads eod close page", async ({ page }) => {
    await expect(
      page
        .getByRole("heading", { level: 1 })
        .or(page.getByText(/eod|end.?of.?day|close/i))
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows eod content", async ({ page }) => {
    await expect(
      page.getByText(/close|summary|daily|revenue|cash/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
