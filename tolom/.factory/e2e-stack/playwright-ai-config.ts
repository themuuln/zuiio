// e2e-stack v1 — last improved: 2026-06-15
// Propagate improvements: .factory/e2e-stack/playwright-ai-config.ts → run /setup-e2e projects

import type { PlaywrightTestConfig } from "@playwright/test";

/**
 * AI-augmented Playwright config snippet.
 *
 * Merge this into your playwright.config.ts to enable:
 * - Built-in test MCP server for AI agent integration
 * - Longer timeouts for AI-driven test generation
 * - Percy visual regression (if PERCY_TOKEN is set)
 *
 * @example
 * ```ts
 * import { defineConfig, devices } from "@playwright/test";
 * import { aiConfig } from "./.factory/e2e-stack/playwright-ai-config";
 *
 * export default defineConfig({
 *   ...aiConfig,
 *   // Your existing config...
 * });
 * ```
 */
export const aiConfig: Partial<PlaywrightTestConfig> = {
  /* AI agent testing helpers — generous timeouts for data-heavy pages */
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },

  /* Reporters: add Percy if token is set */
  ...(process.env.PERCY_TOKEN
    ? {
        reporter: [
          ["list"],
          [
            "@percy/playwright",
            { snapshot: { widths: [1280, 375] } },
          ] as any,
        ],
      }
    : {}),

  /* Retry on CI for flaky test resilience */
  retries: process.env.CI ? 2 : 0,
};
