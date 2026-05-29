import { test, expect } from "@playwright/test";

test.describe("Authentication Flows", () => {
  test.describe("Login Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/mn/auth/login");
    });

    test("renders the login form", async ({ page }) => {
      // Email input should be visible
      await expect(page.getByLabel(/email/i)).toBeVisible();

      // Password input should be visible
      await expect(page.getByLabel(/password/i)).toBeVisible();

      // Submit button should be visible
      await expect(
        page.getByRole("button", { name: /log in|нэвтрэх/i }),
      ).toBeVisible();
    });

    test("shows validation error on empty submit", async ({ page }) => {
      const submitButton = page.getByRole("button", {
        name: /log in|нэвтрэх/i,
      });
      await submitButton.click();

      // Should show some form of validation feedback
      // (either browser native or custom error messages)
      await expect(
        page
          .locator('[role="alert"], .text-destructive, [data-state="error"]')
          .first(),
      ).toBeVisible();
    });

    test("has a link to signup page", async ({ page }) => {
      const signUpLink = page.getByRole("link", {
        name: /sign up|бүртгүүлэх/i,
      });
      await expect(signUpLink).toBeVisible();
    });

    test("has a forgot password link", async ({ page }) => {
      const forgotLink = page.getByRole("link", { name: /forgot|мартсан/i });
      await expect(forgotLink).toBeVisible();
    });
  });

  test.describe("Signup Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/mn/auth/signup");
    });

    test("renders the signup form", async ({ page }) => {
      // Email input should be visible
      await expect(page.getByLabel(/email/i)).toBeVisible();

      // Password input should be visible
      await expect(page.getByLabel(/password/i)).toBeVisible();

      // Submit button should be visible
      await expect(
        page.getByRole("button", { name: /sign up|бүртгүүлэх/i }),
      ).toBeVisible();
    });

    test("has a link to login page", async ({ page }) => {
      const loginLink = page.getByRole("link", { name: /log in|нэвтрэх/i });
      await expect(loginLink).toBeVisible();
    });
  });

  test.describe("Protected Routes", () => {
    test("redirects unauthenticated users from dashboard to login", async ({
      page,
    }) => {
      await page.goto("/mn/dashboard");

      // Should be redirected to login or show auth-related page
      await expect(page).toHaveURL(/\/auth\/(login|select-organization)/);
    });
  });
});
