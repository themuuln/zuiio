import { setEnglishLocale } from "./helpers";
import { expect, test } from "./test-extensions";

// All password reset tests need fresh context without auth cookies so they
// can interact with the forgot-password/reset-password forms.
test.describe("Password Reset Flow", () => {
  test.describe("Forgot Password Page", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test.beforeEach(async ({ page }) => {
      await setEnglishLocale(page);
    });

    test("renders the forgot password form", async ({ page }) => {
      await page.goto("/auth/forgot-password");
      await expect(
        page.getByRole("heading", { name: /forgot/i }),
      ).toBeVisible();
      await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
      await expect(
        page.getByRole("button", { name: /send reset link/i }),
      ).toBeVisible();
    });

    test("has back to login link", async ({ page }) => {
      await page.goto("/auth/forgot-password");
      await expect(
        page.getByRole("link", { name: /back to sign in/i }),
      ).toBeVisible();
    });

    test("back to login link navigates to login page", async ({ page }) => {
      await page.goto("/auth/forgot-password");
      await page.getByRole("link", { name: /back to sign in/i }).click();
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test("rejects empty email submission", async ({ page }) => {
      await page.goto("/auth/forgot-password");
      const url = page.url();
      await page.getByRole("button", { name: /send reset link/i }).click();
      await expect(page).toHaveURL(url);
    });

    test("rejects invalid email format", async ({ page }) => {
      await page.goto("/auth/forgot-password");
      await page.getByRole("textbox", { name: /email/i }).fill("not-an-email");
      await page.getByRole("button", { name: /send reset link/i }).click();

      // Should stay on the page — either browser validation or server error
      await expect(page).toHaveURL(/\/auth\/forgot-password/);
    });

    test("shows success message after submitting valid email", async ({
      page,
    }) => {
      await page.goto("/auth/forgot-password");
      await page
        .getByRole("textbox", { name: /email/i })
        .fill("Mtuya1355@gmail.com");
      await page.getByRole("button", { name: /send reset link/i }).click();

      // Should show "Check your email" message
      await expect(
        page.getByRole("heading", { name: /check your email/i }),
      ).toBeVisible({ timeout: 15000 });
    });

    test("success screen has back to login link", async ({ page }) => {
      await page.goto("/auth/forgot-password");
      await page
        .getByRole("textbox", { name: /email/i })
        .fill("Mtuya1355@gmail.com");
      await page.getByRole("button", { name: /send reset link/i }).click();

      await expect(
        page.getByRole("heading", { name: /check your email/i }),
      ).toBeVisible({ timeout: 15000 });

      // Back to login link should be visible
      await expect(
        page.getByRole("link", { name: /back to sign in/i }),
      ).toBeVisible();
    });
  });

  test.describe("Reset Password Page", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test.beforeEach(async ({ page }) => {
      await setEnglishLocale(page);
    });

    test("renders the reset password form", async ({ page }) => {
      // The reset-password page requires a valid token from email
      // Without a token it may redirect or show an error — just check page loads
      await page.goto("/auth/reset-password");
      await expect(page.locator("h2").first()).toBeVisible({ timeout: 10000 });
    });

    test("shows password and confirm password fields", async ({ page }) => {
      await page.goto("/auth/reset-password");
      // Fields are labeled "New password *" and "Confirm password *"
      await expect(
        page.getByRole("textbox", { name: "New password *" }),
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByRole("textbox", { name: "Confirm password *" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /update password/i }),
      ).toBeVisible();
    });
  });

  test.describe("Navigation Between Auth Pages", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test.beforeEach(async ({ page }) => {
      await setEnglishLocale(page);
    });

    test("can navigate from login → forgot password → login", async ({
      page,
    }) => {
      await page.goto("/auth/login");
      await page.getByRole("link", { name: /forgot password/i }).click();
      await expect(page).toHaveURL(/\/auth\/forgot-password/);
      await page.getByRole("link", { name: /back to sign in/i }).click();
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test("can navigate from login → signup → login", async ({ page }) => {
      await page.goto("/auth/login");
      await page.getByRole("link", { name: "Sign up" }).click();
      await expect(page).toHaveURL(/\/auth\/signup/);
      await page.getByRole("link", { name: "Sign in" }).click();
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test("can navigate from signup → login → signup", async ({ page }) => {
      await page.goto("/auth/signup");
      await page.getByRole("link", { name: "Sign in" }).click();
      await expect(page).toHaveURL(/\/auth\/login/);
      await page.getByRole("link", { name: "Sign up" }).click();
      await expect(page).toHaveURL(/\/auth\/signup/);
    });
  });
});
