import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT ?? 3000;
const baseURL = `http://localhost:${PORT}`;

/**
 * Playwright E2E test configuration for TOLOM.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Single worker — login-in-every-file pattern needed this. With storageState
     global setup, parallel workers are safe. Bump if the server can handle it. */
  workers: 1,

  /* Run global setup (auth login) before all tests */
  globalSetup: "./e2e/global-setup.ts",

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [["html", { open: "never" }], ["github"]]
    : [["html", { open: "on-failure" }]],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    /* Reuse auth session saved by global-setup — eliminates per-file login */
    storageState: "e2e/.auth/user.json",
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
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

    // Uncomment to test on additional browsers:
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 13'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: `PORT=${PORT} node node_modules/next/dist/bin/next dev`,
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: true,
  },
});
