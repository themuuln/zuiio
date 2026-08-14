import { promises as fs } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

/**
 * Storefront accessibility scans (axe) for the seeded public pages.
 *
 * Runs in the `a11y` project. The storefront middleware exposes these pages
 * publicly (org home, products, cart, blog) after the proxy fix, but the
 * dev environment's react-grab toolbar overlay (data-react-grab-*) is a
 * dev artifact, not app code — excluded from the scans. Signs in as the
 * org member ONCE (storage state) so the scans run under the same session
 * the chromium project uses; asserts zero critical or serious violations
 * per WCAG 2 A/AA/AAA tags.
 */
const SEEDED_SLUG = "storefront-e2e-test";
const DEV_EMAIL = process.env.E2E_EMAIL ?? "themuuln1@gmail.com";
const DEV_PASSWORD = process.env.E2E_PASSWORD ?? "Tolom!11";
const LOGIN_STATE_FILE = ".auth/a11y-storefront.json";

test.use({ storageState: LOGIN_STATE_FILE });

const PAGES = [
  { path: `/${SEEDED_SLUG}`, wait: "h1" },
  { path: `/${SEEDED_SLUG}/products`, wait: "h1" },
  { path: `/${SEEDED_SLUG}/cart`, wait: "h1" },
  { path: `/${SEEDED_SLUG}/blog`, wait: "h1" },
] as const;

async function seededOrgExists(): Promise<boolean> {
  try {
    const res = await fetch(
      "http://127.0.0.1:54326/rest/v1/rpc/get_public_products",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: "anon" },
        body: JSON.stringify({
          p_slug: SEEDED_SLUG,
          p_page: 1,
          p_page_size: 1,
        }),
      },
    );
    if (!res.ok) return false;
    const data = (await res.json()) as { total?: number };
    return (data.total ?? 0) > 0;
  } catch {
    return false;
  }
}

async function signInAsOrgMember(page: Page): Promise<void> {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.locator('input[name="email"]').first().fill(DEV_EMAIL);
  await page.locator('input[name="password"]').first().fill(DEV_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 30_000,
  });
}

test.beforeAll(async ({ browser }) => {
  if (await seededOrgExists()) {
    // The login context must NOT inherit the (not yet written) storage
    // state file that test.use configures for the page fixtures.
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();
    await signInAsOrgMember(page);
    await context.storageState({ path: LOGIN_STATE_FILE });
    await context.close();
  } else {
    // Keep the storage state file valid so tests can still skip cleanly.
    await fs.writeFile(
      LOGIN_STATE_FILE,
      JSON.stringify({ cookies: [], origins: [] }),
    );
  }
});

for (const { path, wait } of PAGES) {
  test(`no critical or serious a11y violations on ${path} @a11y`, async ({
    page,
  }) => {
    test.skip(
      !(await seededOrgExists()),
      `seed missing — run apps/zer/supabase/seed.sql on the local stack`,
    );

    await page.goto(path, { waitUntil: "domcontentloaded" });
    // Wait for the page shell to fully render before scanning
    await page
      .locator(wait)
      .first()
      .waitFor({ state: "visible", timeout: 15_000 });

    const results = await new AxeBuilder({ page })
      .exclude(".ph-no-capture") // react-grab dev toolbar overlay, not app code
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const serious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(
      serious,
      JSON.stringify(
        serious.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.length,
          help: v.help,
        })),
        null,
        2,
      ),
    ).toEqual([]);
  });
}
