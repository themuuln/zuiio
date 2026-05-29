import { test, expect } from "@playwright/test";

test.describe("Authentication Flows", () => {
  test.describe("Login Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/mn/auth/login");
      // Wait for the login form to be fully rendered
      await expect(
        page.getByRole("heading", { name: /sign in/i }),
      ).toBeVisible();
    });

    test("renders the login form with email and password", async ({ page }) => {
      await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
      await expect(
        page.getByRole("textbox", { name: "Password *" }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    });

    test("shows validation error on empty submit", async ({ page }) => {
      // The form has required attributes — clicking submit with empty fields
      // triggers browser native validation. We verify the form doesn't navigate away.
      const url = page.url();
      await page.getByRole("button", { name: "Sign in" }).click();
      // Page should still be on login (form blocked by required validation)
      await expect(page).toHaveURL(url);
    });

    test("has a link to signup page", async ({ page }) => {
      await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
    });

    test("has a forgot password link", async ({ page }) => {
      await expect(
        page.getByRole("link", { name: /forgot password/i }),
      ).toBeVisible();
    });
  });

  test.describe("Signup Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/mn/auth/signup");
      await expect(
        page.getByRole("heading", { name: /create your/i }),
      ).toBeVisible();
    });

    test("renders the signup form with all fields", async ({ page }) => {
      await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
      // Use exact match to avoid matching "Confirm password *"
      await expect(
        page.getByRole("textbox", { name: "Password *", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("textbox", { name: "Confirm password *" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Create account" }),
      ).toBeVisible();
    });

    test("has a link to login page", async ({ page }) => {
      await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
    });
  });

  test.describe("Protected Routes", () => {
    test("redirects unauthenticated users from dashboard to login", async ({
      page,
    }) => {
      await page.goto("/mn/dashboard");
      await expect(page).toHaveURL(/\/auth\/(login|select-organization)/);
    });
  });
});
