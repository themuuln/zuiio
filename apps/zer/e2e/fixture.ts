import type { PlayWrightAiFixtureType } from "@midscene/web/playwright";
import { PlaywrightAiFixture } from "@midscene/web/playwright";
import {
  test as base,
  expect as baseExpect,
  type Page,
} from "@playwright/test";

// ── Custom fixtures ──────────────────────────────────────────────────────

type AppFixtures = {
  /** Page pre-navigated to baseURL with domcontentloaded. Use when you need a
   *  ready page without specifying a URL (e.g. sidebar tests, dashboard). */
  appPage: Page;
};

export const test = base
  .extend<PlayWrightAiFixtureType>(
    PlaywrightAiFixture({
      waitForNetworkIdleTimeout: 2000,
    }),
  )
  .extend<AppFixtures>({
    appPage: async ({ page, baseURL }, use) => {
      await page.goto(baseURL ?? "/", { waitUntil: "domcontentloaded" });
      await use(page);
    },
  });

// ── Typed expect with default timeout ────────────────────────────────────

export const expect = baseExpect.configure({ timeout: 10_000 });
