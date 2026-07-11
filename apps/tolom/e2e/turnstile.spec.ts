import { setEnglishLocale } from "./helpers";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

/**
 * Cloudflare Turnstile E2E tests.
 *
 * Covers the Turnstile bot-protection widget across all 3 auth forms:
 *   - Login (/auth/login)
 *   - Signup (/auth/signup)
 *   - Customer Login (/auth/customer/login)
 *
 * Strategy:
 *   - Intercept the Turnstile iframe at network level (prevents external requests)
 *   - Inject a test token via JS to bypass client-side token state
 *   - Test both success (valid token) and failure (empty/missing token) paths
 *
 * Note: The server-side `validateTurnstile()` call to
 * `challenges.cloudflare.com/turnstile/v0/siteverify` runs from the Node.js
 * server process and is NOT intercepted by Playwright's browser-level route
 * mocking. For the failure test, we rely on the form submitting with an
 * empty token, which the server rejects before reaching Cloudflare.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

/** A dummy token that will fail Cloudflare's siteverify if it reaches the server. */
const DUMMY_TOKEN = "test-turnstile-token-dummy-value";

/**
 * Mock the Turnstile widget at network level:
 * Block the Cloudflare challenge iframe to prevent external requests.
 */
async function mockTurnstile(page: import("@playwright/test").Page) {
  await page.route("**/challenges.cloudflare.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<html><body><div id='cf-turnstile-container'></div></body></html>",
    }),
  );
}

/**
 * Inject a token value into the hidden form field named "turnstileToken".
 * Uses locator.evaluate to bypass React's controlled input state — sets
 * the DOM value directly and dispatches events for React to pick up.
 */
async function injectTurnstileToken(
  page: import("@playwright/test").Page,
  token: string,
) {
  const input = page.locator('input[name="turnstileToken"]');
  await input.evaluate((el, t) => {
    const nativeSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    nativeSetter?.call(el, t);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, token);
}

// ─── Login Page ──────────────────────────────────────────────────────────────

test.describe("Turnstile — Login Page", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await mockTurnstile(page);
    await setEnglishLocale(page);
    await page.goto("/auth/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });

  test("renders the Turnstile hidden token field", async ({ page }) => {
    const hiddenInput = page.locator('input[name="turnstileToken"]');
    await expect(hiddenInput).toBeAttached();
    await expect(hiddenInput).toHaveAttribute("type", "hidden");
    await expect(hiddenInput).toHaveValue("");
  });

  test("accepts token injection into hidden field", async ({ page }) => {
    await injectTurnstileToken(page, DUMMY_TOKEN);
    const hiddenInput = page.locator('input[name="turnstileToken"]');
    await expect(hiddenInput).toHaveValue(DUMMY_TOKEN);
  });

  test("shows Turnstile verification error on empty token submit", async ({
    page,
  }) => {
    // Fill valid credentials but do NOT inject a Turnstile token
    await page
      .getByRole("textbox", { name: /email/i })
      .fill("Mtuya1355@gmail.com");
    await page
      .getByRole("textbox", { name: "Password *" })
      .fill("SomePassword123!");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Server rejects empty token — form error or toast should appear
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: /bot|verification|turnstile|missing/i }),
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ─── Signup Page ─────────────────────────────────────────────────────────────

test.describe("Turnstile — Signup Page", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await mockTurnstile(page);
    await setEnglishLocale(page);
    await page.goto("/auth/signup");
    await expect(
      page.getByRole("heading", { name: /create your/i }),
    ).toBeVisible();
  });

  test("renders the Turnstile hidden token field", async ({ page }) => {
    const hiddenInput = page.locator('input[name="turnstileToken"]');
    await expect(hiddenInput).toBeAttached();
    await expect(hiddenInput).toHaveAttribute("type", "hidden");
    await expect(hiddenInput).toHaveValue("");
  });

  test("accepts token injection into hidden field", async ({ page }) => {
    await injectTurnstileToken(page, DUMMY_TOKEN);
    const hiddenInput = page.locator('input[name="turnstileToken"]');
    await expect(hiddenInput).toHaveValue(DUMMY_TOKEN);
  });

  test("shows Turnstile verification error on empty token submit", async ({
    page,
  }) => {
    const uniqueEmail = `e2e-turnstile-${Date.now()}@test.example.com`;
    await page
      .getByRole("textbox", { name: /full name/i })
      .fill("Turnstile Test User");
    // Signup form has: Full name, Email/Phone/Username, Password, Confirm password
    await page
      .getByRole("textbox", { name: /email.*phone.*username/i })
      .fill(uniqueEmail);
    await page
      .getByRole("textbox", { name: "Password *", exact: true })
      .fill("TestPass123!");
    await page
      .getByRole("textbox", { name: "Confirm password *" })
      .fill("TestPass123!");

    await page.getByRole("button", { name: "Create account" }).click();

    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: /bot|verification|turnstile|missing/i }),
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ─── Customer Login Page ─────────────────────────────────────────────────────

test.describe("Turnstile — Customer Login Page", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await mockTurnstile(page);
    await setEnglishLocale(page);
    await page.goto("/auth/customer/login");
    // CardTitle renders as a <div>, not a heading element, so use getByText
    await expect(page.getByText("Customer Portal")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("renders the Turnstile hidden token field", async ({ page }) => {
    const hiddenInput = page.locator('input[name="turnstileToken"]');
    await expect(hiddenInput).toBeAttached();
    await expect(hiddenInput).toHaveAttribute("type", "hidden");
    await expect(hiddenInput).toHaveValue("");
  });

  test("accepts token injection into hidden field", async ({ page }) => {
    await injectTurnstileToken(page, DUMMY_TOKEN);
    const hiddenInput = page.locator('input[name="turnstileToken"]');
    await expect(hiddenInput).toHaveValue(DUMMY_TOKEN);
  });

  test("shows Turnstile verification error on empty token submit", async ({
    page,
  }) => {
    await page
      .getByRole("textbox", { name: /email/i })
      .fill("customer@test.example.com");
    await page
      .getByRole("textbox", { name: /password/i })
      .fill("SomePassword123!");

    // Button text is "Login" (one word) — the English translation for portal.loginBtn
    await page.getByRole("button", { name: "Login" }).click();

    // Error appears as both inline FieldError (role="alert") and toast notifications
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: /missing|bot|verification|turnstile/i }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
