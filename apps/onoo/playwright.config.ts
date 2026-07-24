import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT ?? 3000;
const baseURL = `http://localhost:${PORT}`;

/**
 * Playwright E2E test configuration for Onoo.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  /* Global timeout — 60s for dev mode (pages compile on first visit) */
  timeout: 60_000,
  expect: { timeout: 15_000 },
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Parallel workers — 4 on CI, 2 local */
  workers: process.env.CI ? 4 : 2,

  /* Run global setup (auth login) before all tests */
  globalSetup: "./e2e/global-setup.ts",

  /* Reporter */
  reporter: process.env.CI
    ? [["html", { open: "never" }], ["github"]]
    : [["html", { open: "on-failure" }]],

  /* Shared settings */
  use: {
    baseURL,
    /* Reuse auth session saved by global-setup */
    storageState: "e2e/.auth/user.json",
    /* Collect trace when retrying the failed test */
    trace: "on-first-retry",
    /* Take screenshot on failure */
    screenshot: "only-on-failure",
    /* Record video on failure */
    video: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
