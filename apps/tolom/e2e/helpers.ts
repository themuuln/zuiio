import { type BrowserContext, expect, type Page } from "@playwright/test";

const TEST_EMAIL = process.env.E2E_EMAIL ?? "themuuln4@gmail.com";
const TEST_PASSWORD = process.env.E2E_PASSWORD ?? "Tolom!11";
const TEST_PIN = process.env.E2E_PIN ?? "1234";

/**
 * Set the locale to English by adding the NEXT_LOCALE cookie.
 * With localePrefix: "never", URLs have no locale segment;
 * locale is determined by the NEXT_LOCALE cookie instead.
 */
export async function setEnglishLocale(page: Page): Promise<void> {
  await page.context().addCookies([
    {
      name: "NEXT_LOCALE",
      value: "en",
      path: "/",
      domain: "localhost",
    },
  ]);
}

/**
 * Wait for the page URL to stop matching any of the given patterns.
 * Uses polling instead of waitForURL to avoid load-event timeouts on
 * pages with SSE/polling connections.
 */
async function waitForUrlNotMatching(
  page: Page,
  patterns: string[],
  timeoutMs = 30000,
) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const current = page.url();
    if (!patterns.some((p) => current.includes(p))) return;
    await page.waitForTimeout(200);
  }
  throw new Error(
    `Timed out after ${timeoutMs}ms waiting for URL to leave [${patterns.join(", ")}]. Current: ${page.url()}`,
  );
}

/**
 * Log in via the login page form and complete organization selection.
 * Navigates to /auth/login, fills credentials, submits, handles
 * the select-organization PIN entry, and waits for redirect to dashboard.
 *
 * Handles two flows:
 * 1. Dev auto-login (DEV_EMAIL/DEV_PASSWORD/DEV_PIN env vars) — page
 *    auto-submits and redirects through all steps without interaction.
 * 2. Manual login — fills form fields using CSS selectors (locale-agnostic).
 *
 * NOTE: With localePrefix: "never", locale is determined by the NEXT_LOCALE
 * cookie. This function does not set the cookie, so the default locale (mn)
 * applies. Tests needing English text should call setEnglishLocale(page) first.
 */
export async function loginViaUI(page: Page) {
  await page.goto("/auth/login");

  // Wait for any dev auto-submit chain to settle
  // (login → select-organization → dashboard, each fires after ~300ms)
  await page.waitForTimeout(3000);

  // If dev auto-login already completed, we're on the dashboard
  if (page.url().includes("/dashboard")) return;

  // If dev auto-submit landed us at select-organization, handle PIN
  if (page.url().includes("/auth/select-organization")) {
    await completeSelectOrganization(page);
    return;
  }

  // Otherwise, we're still on login
  // Check if auto-login already filled the form (dev mode)
  const identValue = await page.locator("#identifier").inputValue();
  if (identValue) {
    // Auto-login filled the form — wait for it to submit or button to enable
    await page.waitForTimeout(1000);
    if (!page.url().includes("/dashboard")) {
      const submitBtn = page.locator('button[type="submit"]');
      await submitBtn.waitFor({ state: "visible", timeout: 10_000 });
      // If the button is disabled, the form might be submitting via auto-login
      if (await submitBtn.isEnabled({ timeout: 10_000 }).catch(() => false)) {
        await submitBtn.click();
      } else {
        // Auto-login is submitting — wait for redirect
        await page.waitForTimeout(3000);
      }
    }
  } else {
    // Manual fill
    await page.locator("#identifier").fill(TEST_EMAIL);
    await page.locator("#password").fill(TEST_PASSWORD);
    const submitBtn = page.locator('button[type="submit"]:not([disabled])');
    await submitBtn.waitFor({ state: "visible", timeout: 10_000 });
    await submitBtn.click();
  }

  // Wait for redirect away from login
  await waitForUrlNotMatching(page, ["/auth/login"]);

  // Handle select-organization if we land there
  if (page.url().includes("/auth/select-organization")) {
    await completeSelectOrganization(page);
  }
}

/**
 * Complete the select-organization step by entering the PIN and submitting.
 * Also handles dev auto-submit (DEV_PIN env var) where the form submits on its own.
 */
async function completeSelectOrganization(page: Page) {
  // Wait for form to render
  await page.waitForTimeout(1500);

  // If dev auto-submit already redirected us, skip
  if (page.url().includes("/dashboard")) return;

  // Fill PIN if the field is present
  const pinInput = page.locator("#pin");
  if (await pinInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await pinInput.fill(TEST_PIN);
  }

  // Wait for auto-submit (300ms) or submit manually.
  // Check repeatedly for redirect because the auto-submit may fire during
  // our wait period and navigate away from this page.
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(200);
    if (page.url().includes("/dashboard")) return;
    if (page.url().includes("/auth/select-organization")) {
      // Still on select-org — try clicking submit if the button is enabled
      const btn = page.locator('button[type="submit"]:not([disabled])');
      if (await btn.isVisible({ timeout: 200 }).catch(() => false)) {
        await btn.click();
        // Give it time to redirect
        await page.waitForTimeout(1000);
        if (page.url().includes("/dashboard")) return;
      }
    }
  }

  throw new Error(
    "Timed out waiting for redirect after select-organization. Check that the PIN is correct and the dev auto-login environment variables are set.",
  );
}

/**
 * Log in and save storageState for reuse in other tests.
 * Use this in a global setup or project-level fixture.
 */
export async function loginAndSaveState(context: BrowserContext, page: Page) {
  await loginViaUI(page);
  await context.storageState({ path: "e2e/.auth/user.json" });
}

/**
 * Assert that the page shows a heading (h1 or h2) matching the pattern.
 */
export async function expectHeading(page: Page, pattern: string | RegExp) {
  const heading = page
    .getByRole("heading", { level: 1 })
    .or(page.getByRole("heading", { level: 2 }));
  await expect(heading.filter({ hasText: pattern })).toBeVisible();
}
