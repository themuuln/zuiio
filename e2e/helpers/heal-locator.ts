/**
 * Free self-healing selector utility for Playwright.
 *
 * Tries multiple selector strategies in order when the primary one fails.
 * No AI, no Docker, no paid licenses needed.
 *
 * Usage:
 *   import { healer } from "./helpers/heal-locator";
 *   await healer.click(page, "button#submit");
 *   await healer.fill(page, "input#email", "test@example.com");
 */

import type { Locator, Page } from "@playwright/test";

type SelectorStrategy = {
  name: string;
  toSelector: (original: string) => string;
};

const strategies: SelectorStrategy[] = [
  { name: "exact", toSelector: (s) => s },
  { name: "css", toSelector: (s) => s },
  {
    name: "text",
    toSelector: (s) => {
      // If original looks like an ID or CSS, try finding by text as fallback
      const clean = s.replace(/^[#.]/, "").replace(/[-#_]/g, " ");
      return `text=${clean}`;
    },
  },
  {
    name: "aria-label",
    toSelector: (s) => {
      const clean = s.replace(/^[#.]/, "").replace(/[-#_]/g, " ");
      return `[aria-label="${clean}"]`;
    },
  },
  {
    name: "placeholder",
    toSelector: (s) =>
      `[placeholder*="${s.replace(/^[#.]/, "").replace(/["']/g, "")}"]`,
  },
  {
    name: "role-any",
    toSelector: (s) =>
      `role=button[name=/${s.replace(/^[#.]/, "").replace(/[-#_]/g, ".*")}/i]`,
  },
];

async function trySelector(
  page: Page,
  selector: string,
  timeout = 2000,
): Promise<Locator | null> {
  try {
    const locator = page.locator(selector);
    const visible = await locator.first().isVisible({ timeout });
    if (visible) return locator;
  } catch (err) {
    console.error(`[heal-locator] Selector "${selector}" failed:`, err);
  }
  return null;
}

export const healer = {
  /**
   * Click an element, falling back to alternative selectors if the first fails.
   */
  async click(page: Page, selector: string, timeout = 5000): Promise<void> {
    for (const strategy of strategies) {
      const locator = await trySelector(
        page,
        strategy.toSelector(selector),
        1000,
      );
      if (locator) {
        await locator.first().click({ timeout });
        return;
      }
    }
    // Last resort: try the original selector with full timeout
    await page.locator(selector).first().click({ timeout });
  },

  /**
   * Fill an input field with fallback strategies.
   */
  async fill(
    page: Page,
    selector: string,
    value: string,
    timeout = 5000,
  ): Promise<void> {
    for (const strategy of strategies) {
      const locator = await trySelector(
        page,
        strategy.toSelector(selector),
        1000,
      );
      if (locator) {
        await locator.first().fill(value, { timeout });
        return;
      }
    }
    await page.locator(selector).first().fill(value, { timeout });
  },
};
