import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Midscene model config — set these env vars to point at your AI model
if (
  !process.env.MIDSCENE_MODEL_BASE_URL &&
  !process.env.MIDSCENE_MODEL_API_KEY
) {
}

const AUTH_FILE = ".auth/user.json";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: [
    "**/codeceptjs/**",
    "**/fixture.ts",
    "**/seed.spec.ts",
    "**/midscene_run/**",
  ],
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  timeout: 90 * 1000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["@midscene/web/playwright-reporter", { type: "merged" }],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "on-first-retry",
  },
  projects: [
    // Setup project: login once, save storage state
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    // Main test project: reuses saved auth state
    {
      name: "chromium",
      testIgnore:
        /auth\.setup\.ts|auth-flows\.spec\.ts|auth-org-flow\.spec\.ts|codeceptjs|a11y\//,
      use: {
        ...devices["Desktop Chrome"],
        storageState: AUTH_FILE,
      },
      dependencies: ["setup"],
    },
    // Auth tests: start logged out, no storageState
    {
      name: "auth-test",
      testMatch: /auth-flows\.spec\.ts|auth-org-flow\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    // A11y tests for public pages (no auth needed)
    {
      name: "a11y",
      testMatch: /e2e\/a11y\//,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    // Visual regression tests (screenshots)
    {
      name: "visual",
      testMatch: /e2e\/visual\//,
      use: {
        ...devices["Desktop Chrome"],
        storageState: AUTH_FILE,
      },
      dependencies: ["setup"],
    },
  ],
});
