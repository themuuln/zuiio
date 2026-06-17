import type { Page } from "@playwright/test";

/** Path where auth storage state is saved/loaded */
export const AUTH_FILE = ".auth/user.json";

/**
 * Wait for the app shell to be fully loaded after navigation.
 * Useful after login redirect or page transitions.
 */
export async function waitForApp(page: Page) {
  await page.waitForLoadState("networkidle");
  // Wait for the main layout to render (adjust selector to your app)
  await page.waitForTimeout(500);
}

/**
 * Reset storage state — clears any stale auth and returns to login.
 */
export async function resetAuth(page: Page) {
  await page.evaluate(() => localStorage.clear());
  await page.context().clearCookies();
}

/**
 * Fill a form field by its label text (Mongolian or English).
 */
export async function fillByLabel(
  page: Page,
  label: string | RegExp,
  value: string,
) {
  const input = page.getByRole("textbox", { name: label });
  if (typeof label === "string") {
    await input.or(page.locator(`input[name="${label}"]`)).fill(value);
  } else {
    await input.fill(value);
  }
}
