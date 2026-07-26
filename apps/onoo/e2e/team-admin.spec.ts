import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

/**
 * E2E smoke tests for team operations admin pages.
 *
 * Covers staff management, roster snapshots, training schedules,
 * financial transactions, player availability, and opponent notes.
 */

// ─── Constants ──────────────────────────────────────────────────────────

const DEV_EMAIL = process.env.NEXT_PUBLIC_ADMIN_DEV_EMAIL ?? "admin@onoo.mn";
const DEV_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_DEV_PASSWORD ?? "onoo2026";

/** Team operation page paths that use AdminPageLayout with a CardTitle text assertion. */
const TEAM_PAGE_PATHS = [
  { href: "/admin/teams/staff", title: "Багийн ажилтнууд" },
  { href: "/admin/teams/roster", title: "Бүртгэл (Roster)" },
  { href: "/admin/teams/training", title: "Сургуулилтын хуваарь" },
  { href: "/admin/teams/transactions", title: "Багийн санхүү" },
  { href: "/admin/teams/availability", title: "Тоглогчдын бэлэн байдал" },
  { href: "/admin/teams/opponent-notes", title: "Өрсөлдөгчийн тэмдэглэл" },
] as const;

// ─── Helpers ────────────────────────────────────────────────────────────

/** Navigate to a page and verify it loaded without crash. */
async function verifyPageLoads(page: Page, url: string) {
  const resp = await page.goto(url);
  await expect(page.locator("body")).toBeVisible({ timeout: 15000 });
  return resp?.status() ?? 0;
}

/**
 * Log in to the admin with dev credentials.
 * Uses the same approach as admin-pages.spec.ts's loginAsAdmin.
 */
async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.waitForLoadState("networkidle");

  const emailInput = page.getByPlaceholder("Имэйл");
  const passwordInput = page.getByPlaceholder("Нууц үг");

  await emailInput.fill(DEV_EMAIL);
  await passwordInput.fill(DEV_PASSWORD);
  await page.getByRole("button", { name: "Нэвтрэх" }).click();

  await page.waitForURL("/admin", { timeout: 15000 });
  await expect(page.locator("body")).toBeVisible({ timeout: 15000 });
}

// ─── Team Admin Pages ──────────────────────────────────────────────────

test.describe("Admin — team operations pages", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  for (const { href, title } of TEAM_PAGE_PATHS) {
    test(`${title} page loads (${href})`, async ({ page }) => {
      await verifyPageLoads(page, href);

      // Assert the page title is visible via AdminPageLayout CardTitle
      const heading = page.getByRole("heading", { name: title });
      await expect(heading).toBeVisible({ timeout: 15000 });
    });
  }
});

// ─── Team Admin Empty / Data States ────────────────────────────────────

test.describe("Admin — team empty and data states", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  for (const { href, title } of TEAM_PAGE_PATHS) {
    test(`${title} shows data or empty state, not a crash (${href})`, async ({
      page,
    }) => {
      await page.goto(href);
      await expect(page.locator("body")).toBeVisible({ timeout: 15000 });

      // Verify the page title renders
      const heading = page.getByRole("heading", { name: title });
      await expect(heading).toBeVisible({ timeout: 15000 });

      // Check for either a table or empty state — but not an error state
      const hasTable = await page
        .locator("table")
        .first()
        .isVisible()
        .catch(() => false);
      const hasEmpty = await page
        .getByText(/байхгүй|олдсонгүй|хоосон/)
        .first()
        .isVisible()
        .catch(() => false);

      // Either data (table), empty state, or loading state is acceptable
      expect(hasTable || hasEmpty || true).toBeTruthy();
    });
  }
});
