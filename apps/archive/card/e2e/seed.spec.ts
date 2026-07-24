import { test } from "@playwright/test";

/**
 * Seed file for the Playwright test MCP planner.
 * This file exists as a reference point for the agent to discover
 * the e2e test directory, test structure, and conventions.
 *
 * When using the planner agent, it will look at this file to
 * understand how tests are organized and then create plans in specs/.
 */

test.describe("Seed — test infrastructure", () => {
  test("placeholder to establish e2e directory", async () => {
    // This test exists to ensure the e2e directory is recognized
    // by the Playwright test runner. Real tests are in other files.
  });
});
