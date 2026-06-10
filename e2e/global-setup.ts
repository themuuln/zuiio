import { chromium } from "@playwright/test";
import type { FullConfig } from "@playwright/test";
import { loginAndSaveState } from "./helpers";

const PORT = process.env.PORT ?? 3000;
const BASE_URL = `http://localhost:${PORT}`;

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

  await loginAndSaveState(context, page);
  await browser.close();
}
