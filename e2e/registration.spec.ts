import { test, expect } from "@playwright/test";

const TEST_EMAIL = `e2e-signup-${Date.now()}@test.example.com`;
const TEST_PASSWORD = "TestPass123!";
const TEST_NAME = "E2E Test User";
const TEST_ORG = "E2E Auto Shop";

test.describe("Registration Flow", () => {
  test.describe("Form Rendering", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/mn/auth/signup");
      await expect(
        page.getByRole("heading", { name: /create your/i }),
      ).toBeVisible();
    });

    test("renders all 5 form fields and submit button", async ({ page }) => {
      await expect(
        page.getByRole("textbox", { name: /full name/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("textbox", { name: /shop.*business name/i }),
      ).toBeVisible();
      await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
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

    test("shows login link for existing users", async ({ page }) => {
      await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
    });

    test("login link navigates to login page", async ({ page }) => {
      await page.getByRole("link", { name: "Sign in" }).click();
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  });

  test.describe("Password Visibility Toggle", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/mn/auth/signup");
      await expect(
        page.getByRole("heading", { name: /create your/i }),
      ).toBeVisible();
    });

    test("password field defaults to hidden", async ({ page }) => {
      const passwordInput = page.getByRole("textbox", {
        name: "Password *",
        exact: true,
      });
      await expect(passwordInput).toHaveAttribute("type", "password");
    });

    test("clicking show password reveals password text", async ({ page }) => {
      const passwordInput = page.getByRole("textbox", {
        name: "Password *",
        exact: true,
      });
      // There are two "Show password" buttons — first one is for the password field
      const showButtons = page.getByRole("button", { name: "Show password" });
      await showButtons.first().click();
      await expect(passwordInput).toHaveAttribute("type", "text");
    });

    test("clicking hide password conceals password text", async ({ page }) => {
      const passwordInput = page.getByRole("textbox", {
        name: "Password *",
        exact: true,
      });
      const showButtons = page.getByRole("button", { name: "Show password" });
      await showButtons.first().click();
      await expect(passwordInput).toHaveAttribute("type", "text");
      await page.getByRole("button", { name: "Hide password" }).first().click();
      await expect(passwordInput).toHaveAttribute("type", "password");
    });

    test("confirm password has its own show/hide toggle", async ({ page }) => {
      const confirmInput = page.getByRole("textbox", {
        name: "Confirm password *",
      });
      await expect(confirmInput).toHaveAttribute("type", "password");
      // Second "Show password" button is for confirm password
      const showButtons = page.getByRole("button", { name: "Show password" });
      await showButtons.nth(1).click();
      await expect(confirmInput).toHaveAttribute("type", "text");
    });
  });

  test.describe("Form Validation", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/mn/auth/signup");
      await expect(
        page.getByRole("heading", { name: /create your/i }),
      ).toBeVisible();
    });

    test("blocks submit when all required fields are empty", async ({
      page,
    }) => {
      const url = page.url();
      await page.getByRole("button", { name: "Create account" }).click();
      // Browser native required validation prevents submission
      await expect(page).toHaveURL(url);
    });

    test("rejects short password (< 8 characters)", async ({ page }) => {
      await page.getByRole("textbox", { name: /full name/i }).fill(TEST_NAME);
      await page
        .getByRole("textbox", { name: /shop.*business name/i })
        .fill(TEST_ORG);
      await page.getByRole("textbox", { name: /email/i }).fill(TEST_EMAIL);
      await page
        .getByRole("textbox", { name: "Password *", exact: true })
        .fill("short");
      await page
        .getByRole("textbox", { name: "Confirm password *" })
        .fill("short");
      await page.getByRole("button", { name: "Create account" }).click();

      // Server-side validation should return an error
      await expect(
        page.locator('[role="alert"], .text-destructive').first(),
      ).toBeVisible({ timeout: 10000 });
    });

    test("rejects mismatched passwords", async ({ page }) => {
      await page.getByRole("textbox", { name: /full name/i }).fill(TEST_NAME);
      await page
        .getByRole("textbox", { name: /shop.*business name/i })
        .fill(TEST_ORG);
      await page.getByRole("textbox", { name: /email/i }).fill(TEST_EMAIL);
      await page
        .getByRole("textbox", { name: "Password *", exact: true })
        .fill(TEST_PASSWORD);
      await page
        .getByRole("textbox", { name: "Confirm password *" })
        .fill("DifferentPass1!");
      await page.getByRole("button", { name: "Create account" }).click();

      await expect(
        page.locator('[role="alert"], .text-destructive').first(),
      ).toBeVisible({ timeout: 10000 });
    });

    test("rejects invalid email format", async ({ page }) => {
      await page.getByRole("textbox", { name: /full name/i }).fill(TEST_NAME);
      await page
        .getByRole("textbox", { name: /shop.*business name/i })
        .fill(TEST_ORG);
      await page.getByRole("textbox", { name: /email/i }).fill("not-an-email");
      await page
        .getByRole("textbox", { name: "Password *", exact: true })
        .fill(TEST_PASSWORD);
      await page
        .getByRole("textbox", { name: "Confirm password *" })
        .fill(TEST_PASSWORD);
      await page.getByRole("button", { name: "Create account" }).click();

      await expect(
        page.locator('[role="alert"], .text-destructive').first(),
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Successful Registration", () => {
    test("registers a new user and redirects to confirm-email or select-organization", async ({
      page,
    }) => {
      await page.goto("/mn/auth/signup");
      await expect(
        page.getByRole("heading", { name: /create your/i }),
      ).toBeVisible();

      // Fill all fields with unique email
      const uniqueEmail = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.example.com`;
      await page
        .getByRole("textbox", { name: /full name/i })
        .fill("E2E Test User");
      await page
        .getByRole("textbox", { name: /shop.*business name/i })
        .fill("E2E Auto Shop");
      await page.getByRole("textbox", { name: /email/i }).fill(uniqueEmail);
      await page
        .getByRole("textbox", { name: "Password *", exact: true })
        .fill("TestPass123!");
      await page
        .getByRole("textbox", { name: "Confirm password *" })
        .fill("TestPass123!");

      await page.getByRole("button", { name: "Create account" }).click();

      // Should redirect to confirm-email (if email confirmation enabled)
      // or select-organization (if immediate session)
      await expect(page).toHaveURL(
        /\/auth\/(confirm-email|select-organization)/,
        { timeout: 15000 },
      );
    });
  });

  test.describe("Duplicate Email Handling", () => {
    test("shows error when registering with already registered email", async ({
      page,
    }) => {
      await page.goto("/mn/auth/signup");
      await expect(
        page.getByRole("heading", { name: /create your/i }),
      ).toBeVisible();

      // Use the known test account email
      await page.getByRole("textbox", { name: /full name/i }).fill("Test User");
      await page
        .getByRole("textbox", { name: /shop.*business name/i })
        .fill("Test Shop");
      await page
        .getByRole("textbox", { name: /email/i })
        .fill("Mtuya1355@gmail.com");
      await page
        .getByRole("textbox", { name: "Password *", exact: true })
        .fill("TestPass123!");
      await page
        .getByRole("textbox", { name: "Confirm password *" })
        .fill("TestPass123!");

      await page.getByRole("button", { name: "Create account" }).click();

      // Should show error about already registered email (inline error)
      await expect(
        page
          .getByRole("alert")
          .filter({ hasText: /already registered|already exists/i }),
      ).toBeVisible({ timeout: 15000 });
    });
  });
});
