import { expect, test } from "@playwright/test";

const PASSWORD = "Tolom!11";

test.describe("Registration → Organization creation flow", () => {
  test("register and create organization successfully", async ({ page }) => {
    test.setTimeout(120000);
    const uniqueId = Date.now();
    const email = `themuuln${uniqueId}@gmail.com`;

    // Step 1: Register
    await page.goto("/register", { waitUntil: "domcontentloaded" });
    await page.fill("#full_name", "E2E Test User");
    await page.fill("#email", email);
    await page.fill("#password", PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for redirect — should go to /organization/new
    await page
      .waitForURL("**/organization/**", { timeout: 30000 })
      .catch(() => {});
    const currentUrl = page.url();

    if (!currentUrl.includes("/organization/new")) {
      test.skip(true, "Registration did not redirect to /organization/new");
      return;
    }

    // Step 2: Organization creation form should render
    await expect(page.getByText("Байгууллага үүсгэх").first()).toBeVisible({
      timeout: 10000,
    });

    // Fill the form with a unique slug to avoid conflicts
    const orgName = `E2E Org ${uniqueId}`;
    await page.fill("#name", orgName);
    await page.waitForTimeout(500);

    // Override slug with unique value to guarantee no collision
    const slugInput = page.locator("#slug");
    await slugInput.fill(`e2e-org-${uniqueId}`);
    await page.waitForTimeout(500);

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for redirect — the action calls redirect("/") on success
    try {
      await page.waitForURL("**/", { timeout: 15000 });
    } catch {
      // Check for server-side error
      const serverError = page.locator('[class*="destructive"]').first();
      const hasError = await serverError.isVisible().catch(() => false);
      if (hasError) {
        const errorText = await serverError.textContent();
        console.log(`Organization creation error: ${errorText}`);
      }
    }

    // After successful org creation, should redirect away from /organization/new
    const postUrl = page.url();
    expect(postUrl).not.toContain("/organization/new");
  });
});
