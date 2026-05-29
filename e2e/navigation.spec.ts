import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("redirects root to default locale", async ({ page }) => {
    await page.goto("/");
    // Should redirect to /mn (Mongolian default)
    await expect(page).toHaveURL(/\/mn/);
  });

  test("navigates to login page", async ({ page }) => {
    await page.goto("/mn");

    // Find and click the login link
    const loginLink = page.getByRole("link", { name: /log in|нэвтрэх/i });
    await loginLink.first().click();

    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("navigates to signup page", async ({ page }) => {
    await page.goto("/mn");

    const signUpLink = page.getByRole("link", { name: /sign up|бүртгүүлэх/i });
    await signUpLink.first().click();

    await expect(page).toHaveURL(/\/auth\/signup/);
  });

  test("navigates to pricing page", async ({ page }) => {
    await page.goto("/mn");

    const pricingLink = page
      .getByRole("link", { name: /pricing|үнэ/i })
      .first();
    await pricingLink.click();

    await expect(page).toHaveURL(/\/pricing/);
  });

  test("navigates to FAQ page", async ({ page }) => {
    await page.goto("/mn");

    // FAQ is in the footer
    const footer = page.locator("footer");
    await footer.scrollIntoViewIfNeeded();

    const faqLink = page.getByRole("link", { name: /FAQ/i });
    await faqLink.click();

    await expect(page).toHaveURL(/\/faq/);
  });
});
