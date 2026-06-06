import { chromium } from "@playwright/test";
import type { FullConfig } from "@playwright/test";

const PORT = process.env.PORT ?? 3000;
const BASE_URL = `http://localhost:${PORT}`;
const TEST_EMAIL = process.env.E2E_EMAIL ?? "themuuln4@gmail.com";
const TEST_PASSWORD = process.env.E2E_PASSWORD ?? "Tolom!11";
const TEST_PIN = process.env.E2E_PIN ?? "1234";

/**
 * Wait for the page URL to stop matching any of the given patterns.
 * Uses polling instead of waitForURL to avoid load-event timeouts on
 * pages with SSE/polling connections.
 */
async function waitForUrlNotMatching(
  page: import("@playwright/test").Page,
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
 * Global setup — logs in once and saves storage state so all test files
 * reuse the authenticated session instead of calling loginViaUI individually.
 *
 * The webServer starts before this runs (defined in playwright.config.ts).
 */
export default async function globalSetup(_config: FullConfig) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();

  await page.goto("/mn/auth/login");
  await page.getByRole("textbox", { name: /email/i }).fill(TEST_EMAIL);
  await page.getByRole("textbox", { name: "Password *" }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await waitForUrlNotMatching(page, ["/auth/login"]);

  if (page.url().includes("/auth/select-organization")) {
    const pinInput = page.getByRole("textbox", { name: /pin/i });
    await pinInput.waitFor({ state: "visible", timeout: 10000 });
    await pinInput.fill(TEST_PIN);
    await page.getByRole("button", { name: /verify|continue/i }).click();
    await waitForUrlNotMatching(page, ["/auth/select-organization"]);
  }

  await context.storageState({ path: "e2e/.auth/user.json" });
  await browser.close();
}
