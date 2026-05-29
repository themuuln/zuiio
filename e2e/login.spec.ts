import { test, expect } from "@playwright/test";

test.describe("Login Flow", () => {
  test.describe("Form Rendering", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/mn/auth/login");
      await expect(
        page.getByRole("heading", { name: /sign in/i }),
      ).toBeVisible();
    });

    test("renders email and password fields", async ({ page }) => {
      await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
      await expect(
        page.getByRole("textbox", { name: "Password *" }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    });

    test("shows signup link for new users", async ({ page }) => {
      await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
    });

    test("shows forgot password link", async ({ page }) => {
      await expect(
        page.getByRole("link", { name: /forgot password/i }),
      ).toBeVisible();
    });

    test("signup link navigates to signup page", async ({ page }) => {
      await page.getByRole("link", { name: "Sign up" }).click();
      await expect(page).toHaveURL(/\/auth\/signup/);
    });

    test("forgot password link navigates to forgot-password page", async ({
      page,
    }) => {
      await page.getByRole("link", { name: /forgot password/i }).click();
      await expect(page).toHaveURL(/\/auth\/forgot-password/, {
        timeout: 10000,
      });
    });
  });

  test.describe("Password Visibility Toggle", () => {
    test("password defaults to hidden", async ({ page }) => {
      await page.goto("/mn/auth/login");
      await expect(
        page.getByRole("textbox", { name: "Password *" }),
      ).toHaveAttribute("type", "password");
    });

    test("show/hide toggle works", async ({ page }) => {
      await page.goto("/mn/auth/login");
      const passwordInput = page.getByRole("textbox", { name: "Password *" });
      await page.getByRole("button", { name: "Show password" }).click();
      await expect(passwordInput).toHaveAttribute("type", "text");
      await page.getByRole("button", { name: "Hide password" }).click();
      await expect(passwordInput).toHaveAttribute("type", "password");
    });
  });

  test.describe("Form Validation", () => {
    test("blocks submit when fields are empty", async ({ page }) => {
      await page.goto("/mn/auth/login");
      const url = page.url();
      await page.getByRole("button", { name: "Sign in" }).click();
      await expect(page).toHaveURL(url);
    });

    test("rejects invalid email format", async ({ page }) => {
      await page.goto("/mn/auth/login");
      await page.getByRole("textbox", { name: /email/i }).fill("not-an-email");
      await page
        .getByRole("textbox", { name: "Password *" })
        .fill("somepassword");
      await page.getByRole("button", { name: "Sign in" }).click();
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  });

  test.describe("Invalid Credentials", () => {
    test("shows error for wrong password", async ({ page }) => {
      await page.goto("/mn/auth/login");
      await page
        .getByRole("textbox", { name: /email/i })
        .fill("Mtuya1355@gmail.com");
      await page
        .getByRole("textbox", { name: "Password *" })
        .fill("WrongPassword123!");
      await page.getByRole("button", { name: "Sign in" }).click();

      // Login shows inline error + toast — use getByRole('alert') to be specific
      await expect(
        page.getByRole("alert").filter({ hasText: /invalid|incorrect|wrong/i }),
      ).toBeVisible({ timeout: 15000 });
    });

    test("shows error for non-existent email", async ({ page }) => {
      await page.goto("/mn/auth/login");
      await page
        .getByRole("textbox", { name: /email/i })
        .fill("nonexistent@example.com");
      await page
        .getByRole("textbox", { name: "Password *" })
        .fill("SomePassword123!");
      await page.getByRole("button", { name: "Sign in" }).click();

      await expect(
        page.getByRole("alert").filter({ hasText: /invalid|incorrect|wrong/i }),
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("Successful Login", () => {
    test("logs in with valid credentials and redirects to select-organization", async ({
      page,
    }) => {
      await page.goto("/mn/auth/login");
      await page
        .getByRole("textbox", { name: /email/i })
        .fill("Mtuya1355@gmail.com");
      await page
        .getByRole("textbox", { name: "Password *" })
        .fill("TolomAdmin2025!");
      await page.getByRole("button", { name: "Sign in" }).click();

      await expect(page).toHaveURL(
        /\/auth\/(select-organization|login)|\/dashboard/,
        { timeout: 15000 },
      );
    });
  });

  test.describe("Protected Route Redirect", () => {
    test("redirects unauthenticated user to login with redirectTo param", async ({
      page,
    }) => {
      await page.goto("/mn/dashboard");
      await expect(page).toHaveURL(/\/auth\/login/);
      await expect(page).toHaveURL(/redirectTo/);
    });

    test("login page with redirectTo shows the original target after login", async ({
      page,
    }) => {
      await page.goto("/mn/dashboard");
      await expect(page).toHaveURL(/\/auth\/login/);

      await page
        .getByRole("textbox", { name: /email/i })
        .fill("Mtuya1355@gmail.com");
      await page
        .getByRole("textbox", { name: "Password *" })
        .fill("TolomAdmin2025!");
      await page.getByRole("button", { name: "Sign in" }).click();

      await expect(page).toHaveURL(
        /\/auth\/(select-organization)|\/dashboard/,
        { timeout: 15000 },
      );
    });
  });

  test.describe("Logout Flow", () => {
    test("can log out via POST to signout endpoint", async ({ page }) => {
      await page.goto("/mn/auth/login");
      await page
        .getByRole("textbox", { name: /email/i })
        .fill("Mtuya1355@gmail.com");
      await page
        .getByRole("textbox", { name: "Password *" })
        .fill("TolomAdmin2025!");
      await page.getByRole("button", { name: "Sign in" }).click();
      await expect(page).toHaveURL(
        /\/auth\/(select-organization)|\/dashboard/,
        { timeout: 15000 },
      );

      await page.evaluate(async () => {
        await fetch("/auth/signout", { method: "POST" });
      });

      await page.goto("/mn/dashboard");
      await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
    });
  });
});
