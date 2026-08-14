import { expect, type Page, test } from "@playwright/test";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54326";
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/**
 * Resolve the staff session's org slug (shared storageState) so the points
 * route target exists — the seeded slug may not be present on every stack.
 */
async function resolveOrgSlug(page: Page): Promise<string | null> {
  const token = await page.evaluate(() => {
    for (const part of document.cookie.split(";")) {
      const [name, value] = part.trim().split("=");
      if (!name?.includes("auth-token") || !value) continue;
      try {
        const raw = decodeURIComponent(value);
        const json = raw.startsWith("base64-")
          ? atob(raw.slice("base64-".length))
          : raw;
        const parsed = JSON.parse(json) as { access_token?: string } | null;
        if (parsed?.access_token) return parsed.access_token;
      } catch {
        // try the next cookie
      }
    }
    return null;
  });
  if (!token) return null;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/organizations?select=slug&limit=1`,
    { headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{ slug: string } | null>;
  return rows[0]?.slug ?? null;
}

test.describe("storefront loyalty and hardware boundaries", () => {
  test("points page exposes the signed-in requirement to guests", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const slug = await resolveOrgSlug(page);
    test.skip(!slug, "no org slug resolvable");

    // The shared staff session never creates a store-buyer session, so the
    // points page must render its guest state.
    await page.goto(`/${slug}/account/points`, {
      waitUntil: "domcontentloaded",
    });

    await expect(
      page.getByRole("heading", { name: "Миний оноо" }),
    ).toBeVisible();
    await expect(
      page.getByText("Оноо харахын тулд нэвтэрнэ үү.").first(),
    ).toBeVisible();
  });

  test("terminal POS renders its dedicated staff surface", async ({ page }) => {
    await page.goto("/terminal/pos", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("link", { name: "Касс руу буцах" }),
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Бүтээгдэхүүн хайх" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Захиалга" })).toBeVisible();
  });

  test("hardware bridge rejects malformed commands before network access", async ({
    request,
  }) => {
    const response = await request.post("/api/hardware/escpos", {
      data: { command: "not-a-command" },
    });

    expect(response.status()).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: 'command must be "print" or "drawer"',
    });
  });
});
