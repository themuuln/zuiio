/**
 * Extended Playwright `test` with resource blocking built in.
 *
 * Every test gets a `page` that automatically blocks:
 * - Images, fonts, media (visual assertion tests can opt out)
 * - Analytics, tracking, telemetry scripts
 *
 * This is safe for purely functional E2E tests. If you need
 * screenshots or visual assertions, import from "@playwright/test" directly.
 */

import { test as base } from "@playwright/test";

const BLOCKED_RESOURCES = [
  // Fonts
  /\.woff2?(\?|$)/,
  /\.ttf(\?|$)/,
  /\.otf(\?|$)/,
  // Images
  /\.png(\?|$)/,
  /\.jpg(\?|$)/,
  /\.jpeg(\?|$)/,
  /\.webp(\?|$)/,
  /\.svg(\?|$)/,
  /\.gif(\?|$)/,
  // Analytics & telemetry
  /\/analytics\//,
  /\/gtag\//,
  /\/plausible\//,
  /google-analytics\.com/,
  /vercel-insights\.com/,
];

export const test = base.extend({
  page: async ({ page }, use) => {
    // Block non-essential resources on every page load — ~25-40% faster
    await page.route("**/*", (route) => {
      const url = route.request().url();
      if (BLOCKED_RESOURCES.some((pattern) => pattern.test(url))) {
        return route.abort();
      }
      return route.continue();
    });
    await use(page);
  },
});

export type { Page } from "@playwright/test";
export { expect } from "@playwright/test";
