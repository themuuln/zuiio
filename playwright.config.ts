import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Midscene model config — set these env vars to point at your AI model
if (
  !process.env.MIDSCENE_MODEL_BASE_URL &&
  !process.env.MIDSCENE_MODEL_API_KEY
) {
  console.log(
    "\n  Midscene: Set MIDSCENE_MODEL_BASE_URL, MIDSCENE_MODEL_API_KEY, MIDSCENE_MODEL_NAME, and MIDSCENE_MODEL_FAMILY in your environment.\n" +
      "  See https://midscenejs.com/model-strategy.html\n",
  );
}

const AUTH_FILE = ".auth/user.json";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["**/codeceptjs/**"],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 3,
  timeout: 90 * 1000,
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["@midscene/web/playwright-reporter", { type: "merged" }],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    headless: !process.env.SHOW_BROWSER,
    trace: "retain-on-failure",
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
      testIgnore: /auth\.setup\.ts|codeceptjs/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: AUTH_FILE,
      },
      dependencies: ["setup"],
    },
  ],
});
