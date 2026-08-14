import { expect, test } from "@playwright/test";

/**
 * Manufacturing navigation group visibility.
 *
 * The "Үйлдвэрлэл" group should appear for manufacturing-org users
 * and be hidden for non-manufacturing orgs.  The auth.setup.ts user
 * determines which org is active — adjust E2E_MANUFACTURING_ORG if
 * needed.
 */

const MFG_GROUP = "Үйлдвэрлэл";

const MFG_ITEMS = ["BOM", "Үйлдвэрлэлийн захиалга", "Чанарын хяналт"];

test.describe("Manufacturing navigation group", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
  });

  test("shows Үйлдвэрлэл group with all items", async ({ page }) => {
    // The sidebar nav group label
    const groupLabel = page.getByText(MFG_GROUP, { exact: true });
    await expect(groupLabel).toBeVisible({ timeout: 10_000 });

    // Each nav item under the group
    for (const item of MFG_ITEMS) {
      await expect(page.getByRole("link", { name: item })).toBeVisible();
    }
  });

  test("each manufacturing nav item navigates to correct route", async ({
    page,
  }) => {
    const routes: Record<string, string> = {
      BOM: "/bom",
      "Үйлдвэрлэлийн захиалга": "/production",
      "Чанарын хяналт": "/quality",
    };

    for (const [label, href] of Object.entries(routes)) {
      await page.getByRole("link", { name: label }).click();
      await page.waitForURL(`**${href}`, { timeout: 10_000 });
      expect(page.url()).toContain(href);
      // Go back to dashboard for next iteration
      await page.goto("/", { waitUntil: "domcontentloaded" });
    }
  });
});

/**
 * Non-manufacturing org visibility test.
 *
 * Skipped by default because it requires a separate auth state for
 * a non-manufacturing org.  Uncomment and set E2E_NON_MFG_EMAIL /
 * E2E_NON_MFG_PASSWORD env vars to run.
 */
test.skip("hides Үйлдвэрлэл group for non-manufacturing org", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByText(MFG_GROUP, { exact: true })).not.toBeVisible();
});
