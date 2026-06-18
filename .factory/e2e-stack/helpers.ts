// e2e-stack v1 — last improved: 2026-06-15
// Propagate improvements: .factory/e2e-stack/helpers.ts → run /setup-e2e projects

import { type BrowserContext, expect, type Page } from "@playwright/test";

const TEST_EMAIL = process.env.E2E_EMAIL ?? "";
const TEST_PASSWORD = process.env.E2E_PASSWORD ?? "";
const TEST_PIN = process.env.E2E_PIN ?? "";

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
 * Log in via the login page and complete organization selection.
 *
 * Handles two flows:
 * 1. Dev auto-login (DEV_EMAIL/DEV_PASSWORD/DEV_PIN env vars) — page
 *    auto-submits and redirects through all steps without interaction.
 * 2. Manual login — fills form fields using CSS selectors (locale-agnostic).
 *
 * @example
 * ```ts
 * // In global-setup.ts
 * import { chromium } from "@playwright/test";
 * import { loginAndSaveState } from "./helpers";
 *
 * export default async function globalSetup() {
 *   const browser = await chromium.launch();
 *   const context = await browser.newContext({ baseURL: "http://localhost:3000" });
 *   const page = await context.newPage();
 *   await loginAndSaveState(context, page);
 *   await browser.close();
 * }
 * ```
 */
export async function loginViaUI(page: Page) {
  const loginPath = process.env.E2E_LOGIN_PATH ?? "/auth/login";
  await page.goto(loginPath);

  // Wait for any dev auto-submit chain to settle
  await page.waitForTimeout(3000);

  // If dev auto-login already completed, we're on the dashboard
  if (page.url().includes("/dashboard")) return;

  // If dev auto-submit landed us at select-organization, handle PIN
  if (page.url().includes("/auth/select-organization")) {
    await completeSelectOrganization(page);
    return;
  }

  // Otherwise, fill the form manually using CSS selectors
  await page.locator("#identifier").fill(TEST_EMAIL);
  await page.locator("#password").fill(TEST_PASSWORD);
  await page.locator('button[type="submit"]').click();

  await waitForUrlNotMatching(page, ["/auth/login"]);

  if (page.url().includes("/auth/select-organization")) {
    await completeSelectOrganization(page);
  }
}

async function completeSelectOrganization(page: Page) {
  await page.waitForTimeout(1500);
  if (page.url().includes("/dashboard")) return;

  const pinInput = page.locator("#pin");
  if (await pinInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await pinInput.fill(TEST_PIN);
  }

  await page.waitForTimeout(1000);

  if (!page.url().includes("/dashboard")) {
    const submitBtn = page.locator('button[type="submit"]:not([disabled])');
    await submitBtn.waitFor({
      state: "visible",
      timeout: 5000,
    });
    await submitBtn.click();
  }

  await waitForUrlNotMatching(page, ["/auth/select-organization"]);
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
