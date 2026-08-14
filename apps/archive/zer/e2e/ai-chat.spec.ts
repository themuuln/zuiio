import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

/**
 * Storefront AI chat widget E2E (seeded org).
 *
 * The widget's backend (/api/ai/chat) needs a live model key, so the chat
 * endpoint is intercepted at the network layer and answered with a
 * streamed markdown reply. This proves the real widget → page wiring:
 * launcher opens the dialog, sending a message consumes the SSE stream,
 * and the markdown reply renders formatted (bold, list, link — no raw
 * syntax). Requires the committed seed fixture (apps/zer/supabase/seed.sql,
 * slug `storefront-e2e-test`); skips otherwise.
 */

const SEEDED_SLUG = "storefront-e2e-test";
const PRODUCT_URL = "https://bujin.mn/bujin-beauty/products/p-1";

/** True when the seeded org publishes at least one product. */
async function seededOrgHasCatalog(page: Page): Promise<boolean> {
  return page.evaluate(async (slug) => {
    const url =
      (window as unknown as Record<string, string | undefined>)
        .NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54326";
    const anonKey =
      (window as unknown as Record<string, string | undefined>)
        .NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    const res = await fetch(`${url}/rest/v1/rpc/get_public_products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anonKey },
      body: JSON.stringify({ p_slug: slug, p_page: 1, p_page_size: 1 }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as {
      products: unknown[];
      total?: number;
    };
    return (data.total ?? 0) > 0;
  }, SEEDED_SLUG);
}

test.describe("Storefront AI chat widget (seeded org)", () => {
  test("opens the chat, streams a markdown reply, and renders it formatted", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    test.skip(
      !(await seededOrgHasCatalog(page)),
      `seed missing — run apps/zer/supabase/seed.sql on the local stack`,
    );

    const reply =
      "**Шампунь**\n1. **Kerasys Шампунь** – Тодорхойлолт\n   Дэлгэрэнгүй: " +
      PRODUCT_URL +
      "\n\nТа ямар төрлийн бүтээгдэхүүн сонирхож байна вэ?\n- Үсний арчилгаа уу?";

    await page.route("**/api/ai/chat", (route) => {
      const body = [
        `data: ${JSON.stringify({ token: reply })}\n\n`,
        `data: ${JSON.stringify({ done: true, reply })}\n\n`,
      ].join("");
      void route.fulfill({
        status: 200,
        headers: { "content-type": "text/event-stream" },
        body,
      });
    });

    await page.goto(`/${SEEDED_SLUG}`, { waitUntil: "domcontentloaded" });

    await page.getByRole("button", { name: "AI туслах чат нээх" }).click();
    await expect(page.getByRole("dialog", { name: "AI туслах" })).toBeVisible();

    await page.getByLabel("Мессеж").fill("Шампунь санал болго");
    await page.getByRole("button", { name: "Илгээх" }).click();

    const dialog = page.getByRole("dialog", { name: "AI туслах" });

    // Streamed markdown renders: bold product name, list item, clickable link.
    await expect(dialog.getByText("Kerasys Шампунь")).toBeVisible({
      timeout: 15_000,
    });
    await expect(dialog.locator("li").first()).toBeVisible();
    await expect(dialog.locator("a").first()).toHaveAttribute(
      "href",
      PRODUCT_URL,
    );
    // No raw markdown syntax leaked into the bubble.
    await expect(dialog).not.toContainText("**");
  });
});
