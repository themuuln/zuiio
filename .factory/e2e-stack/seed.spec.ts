// e2e-stack v1 — last improved: 2026-06-15
// Propagate improvements: .factory/e2e-stack/seed.spec.ts → run /setup-e2e projects

import { test } from "@playwright/test";

/**
 * Seed file for the Playwright test MCP planner.
 * The planner uses this to navigate to the app and explore it.
 * Customize the route to match your app's main authenticated page.
 *
 * @see https://playwright.dev/docs/ai
 */
test.describe("Seed", () => {
  test("navigate to the app", async ({ page }) => {
    await page.goto("/dashboard");
  });
});
