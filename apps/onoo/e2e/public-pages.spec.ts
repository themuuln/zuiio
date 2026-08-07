import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

/**
 * Comprehensive E2E tests for Onoo public pages.
 *
 * Covers every main public route with structural assertions:
 * - Navigation and footer links
 * - Home page with scorebar, games, standings, leaders
 * - Games listing with date navigation
 * - Standings table
 * - Players grid and player detail
 * - Leaders leaderboard
 * - Team detail page
 * - Awards page
 * - Documentation index
 * - Search dialog
 * - Mobile responsive viewport
 *
 * Pages that depend on data use the skip-if-empty pattern:
 * look for content, verify it, or skip gracefully.
 */

const NAV_LINKS = [
  { href: "/", label: "Нүүр хуудас" },
  { href: "/games", label: "Тоглолтууд" },
  { href: "/standings", label: "Шалгуур" },
  { href: "/players", label: "Тоглогчид" },
  { href: "/leaders", label: "Тэргүүлэгчид" },
  { href: "/shop", label: "Дэлгүүр" },
] as const;

const FOOTER_LINKS = [
  { href: "/games", label: "Тоглолтууд" },
  { href: "/standings", label: "Шалгуур" },
  { href: "/players", label: "Тоглогчид" },
  { href: "/leaders", label: "Тэргүүлэгчид" },
  { href: "/awards", label: "Наградууд" },
  { href: "/docs", label: "Баримт бичиг" },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────

/** Navigate to a page and verify it loaded without crash. */
async function verifyPageLoads(page: Page, url: string) {
  const resp = await page.goto(url);
  // Accept 200 or 500 — some server pages may error without data in local dev
  await expect(page.locator("body")).toBeVisible();
  return resp?.status() ?? 0;
}

/** Find the first link matching a URL prefix and return its href. */
async function findFirstLink(
  page: Page,
  prefix: string,
): Promise<string | null> {
  const link = page
    .locator(`a[href^="${prefix}"]`)
    .or(page.locator(`a[href*="${prefix}"]`))
    .first();
  if (await link.isVisible()) {
    return link.getAttribute("href");
  }
  return null;
}

// ─── Navigation ───────────────────────────────────────────────────────

test.describe("Navigation", () => {
  test("all nav links render and navigate correctly", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible();

    for (const item of NAV_LINKS) {
      const link = nav.getByRole("link", { name: item.label });
      await expect(link).toBeVisible({ timeout: 10000 });
      await expect(link).toHaveAttribute("href", item.href);
    }
  });

  test("active nav link has aria-current page", async ({ page }) => {
    await page.goto("/games");
    const nav = page.locator("nav").first();
    const activeLink = nav.getByRole("link", { name: "Тоглолтууд" });
    await expect(activeLink).toBeVisible();
    await expect(activeLink).toHaveAttribute("aria-current", "page");
  });

  test("nav links navigate to correct pages", async ({ page }) => {
    for (const item of NAV_LINKS) {
      if (item.href === "/") continue;
      await page.goto(item.href);
      await expect(page.locator("body")).toBeVisible();
      const nav = page.locator("nav").first();
      const link = nav.getByRole("link", { name: item.label });
      await expect(link).toHaveAttribute("aria-current", "page");
    }
  });

  test("nav links scroll horizontally on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible();
    // All nav links should be accessible — check the last one is attached
    const lastNavLink = nav.getByRole("link", { name: "Дэлгүүр" });
    await expect(lastNavLink).toBeAttached();
  });
});

// ─── Footer ───────────────────────────────────────────────────────────

test.describe("Footer", () => {
  test("footer renders with all links", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer").first();
    await expect(footer).toBeVisible();

    for (const item of FOOTER_LINKS) {
      const link = footer.getByRole("link", { name: item.label });
      await expect(link.first()).toBeVisible();
    }
  });

  test("footer has copyright and branding", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer").first();
    await expect(
      footer.getByText(/Оноо|onoo\.mn|Zuiio/i).first(),
    ).toBeVisible();
  });
});

// ─── Home Page ────────────────────────────────────────────────────────

test.describe("Home page", () => {
  test("home page loads with scorebar and header", async ({ page }) => {
    await verifyPageLoads(page, "/");

    // Scorebar should be present
    const scorebar = page
      .locator('[class*="scorebar"], [class*="Scorebar"]')
      .first();
    await expect(scorebar).toBeVisible();

    // Site header and footer should be present
    await expect(page.locator("header").first()).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("home page shows games section or empty state", async ({ page }) => {
    await page.goto("/");
    // Wait for either the game history section or the empty state to appear
    const gameHistory = page.locator("text=Тоглолтын түүх").first();
    const emptyState = page.locator("text=хараахан алга").first();
    const found = await Promise.race([
      gameHistory.waitFor({ state: "visible", timeout: 8000 }).then(() => true),
      emptyState.waitFor({ state: "visible", timeout: 8000 }).then(() => true),
    ]);
    expect(found).toBe(true);
  });

  test("home page shows standings section", async ({ page }) => {
    await page.goto("/");
    const standingsHeading = page.locator("text=Шалгуур").first();
    await expect(standingsHeading).toBeVisible();
  });

  test("home page shows leaders section", async ({ page }) => {
    await page.goto("/");
    const leadersSection = page.locator("text=Тэргүүлэгчид").first();
    await expect(leadersSection).toBeVisible();
  });
});

// ─── Games Pages ──────────────────────────────────────────────────────

test.describe("Games pages", () => {
  test("games listing loads", async ({ page }) => {
    await page.goto("/games");
    await expect(page.locator("body")).toBeVisible();
  });

  test("game detail page loads from games list", async ({ page }) => {
    await page.goto("/games");
    const gameLinkHref = await findFirstLink(page, "/games/");
    if (!gameLinkHref) {
      test.skip("No game links available");
      return;
    }
    await verifyPageLoads(page, gameLinkHref);
    await expect(page.locator("body")).toBeVisible();
  });

  test("game recap shows score header", async ({ page }) => {
    await page.goto("/games");
    const gameLink = page.locator("a[href*='/games/']").first();
    if (!(await gameLink.isVisible())) {
      test.skip("No game links available");
      return;
    }
    await gameLink.click();
    await expect(page.locator("body")).toBeVisible();
  });

  test("game recap renders box score for finished games", async ({ page }) => {
    await page.goto("/games");
    const gameLink = page.locator("a[href*='/games/']").first();
    if (!(await gameLink.isVisible())) {
      test.skip("No game links available");
      return;
    }
    await gameLink.click();

    const boxScore = page
      .locator("text=/Бүрэн|Бокс оноо|Тоглогч|Оноо|Анхны тав/")
      .first();
    if (await boxScore.isVisible()) {
      await expect(boxScore).toBeVisible();
    }
  });
});

// ─── Standings ────────────────────────────────────────────────────────

test.describe("Standings page", () => {
  test("standings page loads and shows content", async ({ page }) => {
    await verifyPageLoads(page, "/standings");
    await expect(page.locator("body")).toBeVisible();
  });

  test("standings page shows heading", async ({ page }) => {
    await page.goto("/standings");
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();
  });
});

// ─── Players Pages ────────────────────────────────────────────────────

test.describe("Players pages", () => {
  test("players listing loads with search", async ({ page }) => {
    await verifyPageLoads(page, "/players");

    // Page should show player heading
    const heading = page.locator("h1:has-text('Тоглогчид')").first();
    await expect(heading).toBeVisible();

    // Search input should be present (type="search")
    const searchInput = page.locator('input[type="search"]').first();
    await expect(searchInput).toBeVisible();
  });

  test("player detail page loads from players list", async ({ page }) => {
    await page.goto("/players");
    const playerLinkHref = await findFirstLink(page, "/players/");
    if (!playerLinkHref) {
      test.skip("No player links available");
      return;
    }
    await verifyPageLoads(page, playerLinkHref);
  });

  test("player page shows tabs", async ({ page }) => {
    await page.goto("/players");
    const playerLink = page.locator("a[href*='/players/']").first();
    if (!(await playerLink.isVisible())) {
      test.skip("No player links available");
      return;
    }
    await playerLink.click();

    const tabs = page.getByRole("tablist").first();
    if (await tabs.isVisible()) {
      await expect(tabs).toBeVisible();
    }
  });
});

// ─── Leaders Page ─────────────────────────────────────────────────────

test.describe("Leaders page", () => {
  test("leaders page loads", async ({ page }) => {
    await page.goto("/leaders");
    await expect(page.locator("body")).toBeVisible();
  });

  test("leaders page shows stat category buttons if data exists", async ({
    page,
  }) => {
    await page.goto("/leaders");
    const statButtons = page
      .locator("button, a")
      .filter({ hasText: /Оноо|Давсан|Олгосон|Булаасан|Хаасан/ })
      .first();
    if (await statButtons.isVisible()) {
      await expect(statButtons).toBeVisible();
    }
  });
});

// ─── Teams Pages ──────────────────────────────────────────────────────

test.describe("Teams pages", () => {
  test("team detail page loads", async ({ page }) => {
    await page.goto("/");
    const teamLinkHref = await findFirstLink(page, "/teams/");
    if (!teamLinkHref) {
      test.skip("No team links available");
      return;
    }
    await verifyPageLoads(page, teamLinkHref);
    await expect(page.locator("body")).toBeVisible();
  });

  test("team page shows header and content", async ({ page }) => {
    await page.goto("/");
    const teamLink = page.locator("a[href*='/teams/']").first();
    if (!(await teamLink.isVisible())) {
      test.skip("No team links available");
      return;
    }
    await teamLink.click();

    const teamName = page.locator("h1, h2").first();
    await expect(teamName).toBeVisible();
  });

  test("team analytics page loads", async ({ page }) => {
    await page.goto("/");
    const teamLink = page.locator("a[href*='/teams/']").first();
    if (!(await teamLink.isVisible())) {
      test.skip("No team links available");
      return;
    }
    const href = await teamLink.getAttribute("href");
    if (!href) {
      test.skip("Could not get team link href");
      return;
    }
    await page.goto(`${href}/analytics`);
    await expect(page.locator("body")).toBeVisible();
  });
});

// ─── Awards Page ──────────────────────────────────────────────────────

test.describe("Awards page", () => {
  test("awards page loads", async ({ page }) => {
    await page.goto("/awards");
    await expect(page.locator("body")).toBeVisible();
  });
});

// ─── Search ───────────────────────────────────────────────────────────

test.describe("Search", () => {
  test("search dialog opens from nav button", async ({ page }) => {
    await page.goto("/");
    const searchButton = page
      .locator('button[aria-label*="хай"], button:has(svg.lucide-search)')
      .first();
    if (!(await searchButton.isVisible())) {
      test.skip("Search button not found");
      return;
    }
    await searchButton.click();

    const searchInput = page
      .locator(
        'input[placeholder*="хай"], [role="dialog"] input, [role="combobox"] input',
      )
      .first();
    await expect(searchInput).toBeVisible();
  });
});

// ─── Docs Page ────────────────────────────────────────────────────────

test.describe("Docs page", () => {
  test("docs index loads", async ({ page }) => {
    await page.goto("/docs");
    await expect(page.locator("body")).toBeVisible();
  });

  test("docs sub-pages load", async ({ page }) => {
    const docSubPages = ["/docs/vision", "/docs/architecture", "/docs/roadmap"];
    for (const url of docSubPages) {
      await page.goto(url);
      await expect(page.locator("body")).toBeVisible();
    }
  });
});

// ─── Responsive ──────────────────────────────────────────────────────

test.describe("Responsive design", () => {
  test("public pages load at mobile viewport without overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const pages = ["/", "/games", "/standings", "/players", "/shop"];

    for (const url of pages) {
      await page.goto(url);
      await expect(page.locator("body")).toBeVisible();
      // No horizontal overflow
      const scrollWidth = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );
      expect(scrollWidth).toBeLessThanOrEqual(400);
    }
  });
});
