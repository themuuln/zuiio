import { expect, test } from "@playwright/test";

const PASSWORD = "Tolom!11";

// /forgot-password and /reset-password now render their own forms
// (no longer redirect to /login?next=... when not authenticated)

test.describe("Auth pages render correctly", () => {
  test("login page shows form fields", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Нэвтрэх").first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByLabel("Имэйл")).toBeVisible();
    await expect(page.getByLabel("Нууц үг")).toBeVisible();
    await expect(page.getByText("Бүртгэлгүй юу?")).toBeVisible();
  });

  test("register page shows form fields", async ({ page }) => {
    await page.goto("/register", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Бүртгүүлэх").first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByLabel("Нэр")).toBeVisible();
    await expect(page.getByLabel("Имэйл")).toBeVisible();
    await expect(page.getByLabel("Нууц үг")).toBeVisible();
  });

  test("forgot-password page renders reset form", async ({ page }) => {
    await page.goto("/forgot-password", { waitUntil: "domcontentloaded" });
    // Forgot password page renders its own form (no longer redirects to login)
    await expect(page.getByText("Нууц үг сэргээх").first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByLabel("Имэйл")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /холбоос илгээх/i }),
    ).toBeVisible();
  });
});

test.describe("Register flow", () => {
  test("register with new email succeeds", async ({ page }) => {
    const email = `themuuln${Date.now()}@gmail.com`;
    await page.goto("/register", { waitUntil: "domcontentloaded" });
    await page.fill("#full_name", "E2E Test User");
    await page.fill("#email", email);
    await page.fill("#password", PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    if (currentUrl.includes("/organization/new")) {
      await expect(page.getByText("Байгууллага үүсгэх").first()).toBeVisible({
        timeout: 10000,
      });
    } else {
      const success = page.locator("text=Бүртгэл үүслээ");
      await expect(success).toBeVisible({ timeout: 10000 });
    }
  });

  test("register with empty fields shows validation", async ({ page }) => {
    await page.goto("/register", { waitUntil: "domcontentloaded" });
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    const errorBanner = page.locator('[class*="destructive"]').first();
    const emailInput = page.locator("#email");
    const isValid = await emailInput
      .evaluate((el) => (el as HTMLInputElement).checkValidity())
      .catch(() => true);
    if (isValid) {
      await expect(errorBanner).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe("Login flow", () => {
  test("login with wrong credentials shows error", async ({ page }) => {
    test.setTimeout(120000); // Supabase free tier can be slow on auth
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.fill('input[name="email"]', "wrong@example.com");
    await page.fill('input[name="password"]', "WrongPass1");
    await page.click('button[type="submit"]');

    // Wait for the form to submit and server to respond
    await page.waitForTimeout(5000);

    expect(page.url()).toContain("/login");
    const errorBanner = page.locator('[class*="destructive"]').first();
    await expect(errorBanner).toBeVisible({ timeout: 60000 });
  });
});
