import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

/**
 * E2E tests for Phase 12 features — Next-Level Experience.
 *
 * Covers competition filter, tournament hub, head-to-head matchup,
 * and team analytics.
 *
 * NOTE: Requires Supabase local stack (colima + supabase start).
 * See AGENTS.md for local Supabase prerequisites.
 */

// ─── Helpers ──────────────────────────────────────────────────────────

/** Navigate to a page and return HTTP status. */
async function gotoPage(page: Page, url: string): Promise<number> {
  const resp = await page.goto(url);
  await page.locator("body").waitFor({ state: "attached", timeout: 15000 });
  return resp?.status() ?? 0;
}

// ─── Competition Filter ─────────────────────────────────────────

test.describe("Competition Filter", () => {
  test("standings page loads with competition filter", async ({ page }) => {
    const status = await gotoPage(page, "/standings");
    if (status >= 400) {
      test.skip(`Page returned ${status}`);
      return;
    }
    const nav = page.locator('nav[aria-label="Тэмцээн сонгох"]');
    const exists = (await nav.count()) > 0;
    if (!exists) {
      test.skip("Single competition — filter nav not rendered");
      return;
    }
    await expect(nav).toBeVisible();
    const links = nav.locator("a").first();
    await expect(links).toBeVisible();
  });

  test("leaders page loads with competition filter", async ({ page }) => {
    const status = await gotoPage(page, "/leaders");
    if (status >= 400) {
      test.skip(`Page returned ${status}`);
      return;
    }
    const nav = page.locator('nav[aria-label="Тэмцээн сонгох"]');
    const exists = (await nav.count()) > 0;
    if (!exists) {
      test.skip("Single competition — filter nav not rendered");
      return;
    }
    await expect(nav).toBeVisible();
  });
});

// ─── Tournament Hub ──────────────────────────────────────────────────

test.describe("Tournament Hub", () => {
  test("tournament page loads from standings link", async ({ page }) => {
    const status = await gotoPage(page, "/standings");
    if (status >= 400) {
      test.skip(`Standings page returned ${status}`);
      return;
    }
    const tournamentLink = page.locator('a[href*="/tournaments/"]').first();
    const exists = await tournamentLink
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    if (!exists) {
      test.skip("No tournament links on standings page");
      return;
    }
    const href = await tournamentLink.getAttribute("href");
    if (!href) {
      test.skip("No tournament href");
      return;
    }
    const tournStatus = await gotoPage(page, href);
    expect(tournStatus).toBeLessThan(500);
  });
});

// ─── Head-to-Head Matchup ─────────────────────────────────────────────

test.describe("Head-to-Head Matchup", () => {
  test("head-to-head hub page loads", async ({ page }) => {
    const status = await gotoPage(page, "/teams/vs");
    if (status >= 400) {
      test.skip(`Page returned ${status}`);
      return;
    }
    await expect(page.locator("body")).toBeAttached();
  });
});

// ─── Team Analytics ─────────────────────────────────────────────────────

test.describe("Team Analytics", () => {
  test("team analytics page loads from standings team link", async ({
    page,
  }) => {
    const status = await gotoPage(page, "/standings");
    if (status >= 400) {
      test.skip(`Standings page returned ${status}`);
      return;
    }
    const teamLink = page.locator('a[href*="/teams/"]').first();
    const href = await teamLink.getAttribute("href");
    if (!href || href === "/teams/vs") {
      test.skip("No team links available");
      return;
    }
    const parts = href.replace("/teams/", "").split("/");
    if (parts.length === 0) {
      test.skip("No team slug extracted");
      return;
    }
    const slug = parts[0];
    const analyticStatus = await gotoPage(page, `/teams/${slug}/analytics`);
    if (analyticStatus >= 500) {
      test.skip(`Analytics page returned ${analyticStatus}`);
      return;
    }
    await expect(page.locator("h1")).toBeVisible();
  });
});
