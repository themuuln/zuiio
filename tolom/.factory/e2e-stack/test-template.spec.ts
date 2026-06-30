// e2e-stack v1 — last improved: 2026-06-15
// Propagate improvements: .factory/e2e-stack/test-template.spec.ts → run /setup-e2e projects

import { expect, test } from "@playwright/test";

/**
 * Template for AI-generated or hand-written E2E tests.
 *
 * Conventions:
 * - Use ARIA roles for selectors (getByRole, getByLabel) — never CSS classes
 * - Use locale-agnostic selectors where possible (#id, [data-testid])
 * - Wrap async element checks in .catch(() => false) for conditional logic
 * - Use test.describe for suites, test() for individual cases
 * - Set generous timeouts for data-fetching pages (30-60s)
 *
 * @see https://playwright.dev/docs/best-practices
 */
test.describe("Feature Name", () => {
  // Adjust timeout for data-heavy pages
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("renders the page title", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: /expected title/i }),
    ).toBeVisible({ timeout: 15000 });
  });

  test("interacts with a form element", async ({ page }) => {
    const input = page.locator("#field-id");
    await expect(input).toBeVisible({ timeout: 10000 });
    await input.fill("test value");
    await expect(input).toHaveValue("test value");
  });

  test("opens a dialog on button click", async ({ page }) => {
    await page.getByRole("button", { name: /action/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
  });
});
