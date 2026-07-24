import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Login page a11y", () => {
  test("login form has no critical or serious violations @a11y", async ({
    page,
  }) => {
    // Wait for the form to fully render
    await page.locator('input[name="email"]').waitFor({ state: "visible" });

    const results = await new AxeBuilder({ page })
      .include("main, form")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
