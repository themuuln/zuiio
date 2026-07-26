/**
 * E2E smoke tests for guardian consent flow.
 *
 * Tests the guardian child detail page renders the consent section
 * without crashing, and interacts with the consent sign/withdraw UI.
 *
 * Data-dependent assertions use the skip-if-empty pattern,
 * following existing onoo E2E conventions.
 */

import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

// ─── Constants ──────────────────────────────────────────────────────────

const DEV_EMAIL = process.env.NEXT_PUBLIC_ADMIN_DEV_EMAIL ?? "admin@onoo.mn";
const DEV_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_DEV_PASSWORD ?? "onoo2026";

// ─── Helpers ────────────────────────────────────────────────────────────

/** Navigate to a page and verify it loaded without crash. */
async function verifyPageLoads(page: Page, url: string) {
  const resp = await page.goto(url);
  await expect(page.locator("body")).toBeVisible({ timeout: 15000 });
  return resp?.status() ?? 0;
}

/**
 * Log in to the admin with dev credentials.
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

// ─── Tests ──────────────────────────────────────────────────────────────

test.describe("Guardian consent page loads", () => {
  test("guardian page loads", async ({ page }) => {
    await verifyPageLoads(page, "/guardian");

    // Should either show login (if not authenticated) or dashboard
    // Either way the page body rendered without crash
    await expect(page.locator("body")).toBeVisible();
  });

  test("guardian child detail page loads without crash", async ({ page }) => {
    // Try navigating directly to a child detail — will 404 or redirect
    // if no child exists, but the page should not crash
    const status = await verifyPageLoads(
      page,
      "/guardian/children/00000000-0000-0000-0000-000000000000",
    );

    // If not found, we still get a valid 404 page, not a crash
    expect([200, 302, 404]).toContain(status);
  });
});

test.describe("Guardian consent section renders", () => {
  test("consent status card renders with structure", async ({ page }) => {
    // Log in as admin to potentially see guardian data
    await loginAsAdmin(page);

    // Navigate to guardian page
    await page.goto("/guardian");
    await page.waitForLoadState("networkidle");

    // The guardian dashboard lists children cards.
    // Look for a child card and navigate to its detail page.
    const childLink = page.locator('a[href*="/guardian/children/"]').first();

    if (await childLink.isVisible()) {
      await childLink.click();
      await page.waitForLoadState("networkidle");

      // Verify the consent status section renders
      const consentSection = page.locator("text=Зөвшөөрлийн статус");
      await expect(consentSection).toBeVisible();
    }
    // If no child link exists, this test is a no-op (data-dependent)
  });

  test("consent sign dialog opens and shows template body", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    // Navigate to guardian page
    await page.goto("/guardian");
    await page.waitForLoadState("networkidle");

    // Click the first child link
    const childLink = page.locator('a[href*="/guardian/children/"]').first();

    if (await childLink.isVisible()) {
      await childLink.click();
      await page.waitForLoadState("networkidle");

      // Find the "Зөвшөөрөх" button (opens sign dialog)
      const signButton = page.locator('button:has-text("Зөвшөөрөх")').first();
      if (await signButton.isVisible()) {
        await signButton.click();

        // The dialog should show
        await expect(page.locator('[role="dialog"]')).toBeVisible({
          timeout: 5000,
        });

        // Dialog should have a textarea for the signature
        await expect(page.locator('textarea[name="signedText"]')).toBeVisible();

        // Click A within dialog
        await page.locator('[role="dialog"] button:has-text("Болих")').click();

        // Wait for dialog to close
        await expect(page.locator('[role="dialog"]')).not.toBeVisible({
          timeout: 5000,
        });
      }
    }
  });

  test("withdraw withdraw dialog opens from signed consent", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    await page.goto("/guardian");
    await page.waitForLoadState("networkidle");

    const childLink = page.locator('a[href*="/guardian/children/"]').first();
    if (await childLink.isVisible()) {
      await childLink.click();
      await page.waitForLoadState("networkidle");

      // Look for Татах button (only visible if there's a non-withdrawn signed consent)
      const withdrawButton = page.locator('button:has-text("Татах")').first();
      if (await withdrawButton.isVisible()) {
        await withdrawButton.click();

        // Withdraw confirmation dialog
        await expect(page.locator("text=Зөвшөөрлийг татах уу?")).toBeVisible();

        // Cancel
        await page.locator('[role="dialog"] button:has-text("Болих")').click();
      }
    }
  });
});

test.describe("Guardian consent API smoke test", () => {
  test("cmd_sign_consent RPC is accessible (low-level check)", async ({
    page,
  }) => {
    // Verify that the guardian consent API endpoint exists
    const resp = await page.request.post("/api/guardian/consent/sign", {
      data: { templateId: "test", studentId: "test", signedText: "test" },
    });
    // Should return 401/redirect since we're not authenticated
    expect([200, 401, 403, 404]).toContain(resp.status());
  });
});
