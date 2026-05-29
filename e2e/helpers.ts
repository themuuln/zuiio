import { type Page, type BrowserContext, expect } from "@playwright/test";

const TEST_EMAIL = process.env.E2E_EMAIL ?? "Mtuya1355@gmail.com";
const TEST_PASSWORD = process.env.E2E_PASSWORD ?? "TolomAdmin2025!";
const TEST_PIN = process.env.E2E_PIN ?? "1234";

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
 * Navigates to /mn/auth/login, fills credentials, submits, handles
 * the select-organization PIN entry, and waits for redirect to dashboard.
 */
export async function loginViaUI(page: Page) {
  await page.goto("/mn/auth/login");

  await page.getByRole("textbox", { name: /email/i }).fill(TEST_EMAIL);
  await page.getByRole("textbox", { name: "Password *" }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  // Wait for redirect away from login page (poll URL, don't wait for load)
  await waitForUrlNotMatching(page, ["/auth/login"]);

  // If redirected to select-organization, enter PIN and continue
  if (page.url().includes("/auth/select-organization")) {
    const pinInput = page.getByRole("textbox", { name: /pin/i });
    await pinInput.waitFor({ state: "visible", timeout: 10000 });
    await pinInput.fill(TEST_PIN);

    await page.getByRole("button", { name: /verify|continue/i }).click();

    // Wait for redirect to dashboard
    await waitForUrlNotMatching(page, ["/auth/select-organization"]);
  }
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
