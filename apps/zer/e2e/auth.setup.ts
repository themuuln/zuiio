import { expect, test as setup } from "@playwright/test";

const AUTH_FILE = ".auth/user.json";

const DEV_EMAIL = process.env.E2E_EMAIL ?? "themuuln1@gmail.com";
const DEV_PASSWORD = process.env.E2E_PASSWORD ?? "Tolom!11";

setup("authenticate via login form", async ({ page }) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', DEV_EMAIL);
  await page.fill('input[name="password"]', DEV_PASSWORD);

  // Click submit and wait for redirect away from /login
  await Promise.all([
    page.waitForURL("**/", { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);

  // Verify we are authenticated
  expect(page.url()).not.toContain("/login");

  // Save the authenticated storage state
  await page.context().storageState({ path: AUTH_FILE });
});
