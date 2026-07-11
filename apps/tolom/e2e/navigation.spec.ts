import { mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

// With mocked APIs, tests are fast — 10s is generous.
test.setTimeout(60_000);

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabaseREST(page);
  });

  test("loads the landing page at root", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /operating system for auto service/i,
      }),
    ).toBeVisible();
  });

  test("navigates to login via nav button", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("banner")
      .getByRole("button", { name: "Sign in" })
      .click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("navigates to signup via nav button", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("banner")
      .getByRole("button", { name: "Get Started" })
      .click();
    await expect(page).toHaveURL(/\/auth\/signup/);
  });

  test("navigates to pricing page via link", async ({ page }) => {
    await page.goto("/");
    // Pricing is a direct link in the nav (not inside a dropdown)
    await page.getByRole("link", { name: "Pricing" }).first().click();
    await expect(page).toHaveURL(/\/pricing/);
  });

  test("navigates to FAQ via footer link", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
    const faqLink = footer.getByRole("link", { name: "FAQ" });
    await expect(faqLink).toBeVisible();
    await faqLink.click();
    await expect(page).toHaveURL(/\/faq/, { timeout: 5000 });
  });
});
