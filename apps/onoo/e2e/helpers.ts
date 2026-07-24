import { type BrowserContext, expect, type Page } from "@playwright/test";

const TEST_EMAIL = process.env.E2E_EMAIL ?? "admin@onoo.mn";
const TEST_PASSWORD = process.env.E2E_PASSWORD ?? "admin123";

/**
 * Wait for the page URL to stop matching any of the given patterns.
 * Uses polling instead of waitForURL to avoid load-event timeouts.
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
 * Log in via the admin login page.
 * Navigates to /admin/login, fills credentials, submits, and waits for redirect.
 */
export async function loginViaUI(page: Page) {
  await page.goto("/admin/login");

  // Wait for form to render
  await page.waitForTimeout(1000);

  // Check if already on admin (auto-login from dev mode)
  if (page.url().includes("/admin") && !page.url().includes("/login")) return;

  // Fill form
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');

  await emailInput.waitFor({ state: "visible", timeout: 10_000 });
  await emailInput.fill(TEST_EMAIL);
  await passwordInput.fill(TEST_PASSWORD);

  const submitBtn = page.locator('button[type="submit"]');
  await submitBtn.click();

  // Wait for redirect away from login
  await waitForUrlNotMatching(page, ["/admin/login"]);
}

/**
 * Log in and save storageState for reuse in other tests.
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

/**
 * Assert that a table with the given role is visible and has rows.
 */
export async function expectTableToHaveRows(page: Page, minRows = 1) {
  const table = page.getByRole("table");
  await expect(table).toBeVisible();
  const rows = table.getByRole("row");
  await expect(rows).toHaveCount(minRows + 1); // +1 for header row
}

/**
 * Open a dialog by clicking a button with the given name.
 */
export async function openDialog(page: Page, buttonName: string | RegExp) {
  const btn = page.getByRole("button", { name: buttonName });
  await btn.click();
  // Wait for dialog to appear
  await page.waitForTimeout(500);
}

/**
 * Fill a form field by its label text.
 */
export async function fillByLabel(page: Page, label: string, value: string) {
  const field = page.getByLabel(label);
  await field.fill(value);
}

/**
 * Select an option in a Select component by its label and option text.
 * Opens the select, then clicks the option.
 */
export async function selectByLabel(
  page: Page,
  label: string,
  optionText: string,
) {
  // Open the select trigger
  const trigger = page
    .getByLabel(label)
    .or(page.locator(`text="${label}"`).locator(".."))
    .first();
  await trigger.click();
  await page.waitForTimeout(300);

  // Click the option
  const option = page.getByRole("option", { name: optionText });
  await option.click();
}
