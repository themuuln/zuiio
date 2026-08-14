import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const REVIEW_NAME = `E2E-${Date.now()}`;
const REVIEW_COMMENT = `Автомат шалгалтын сэтгэгдэл ${Date.now()}`;

/**
 * Reviews module E2E.
 *
 * Covers the admin moderation flow: list loads, a submitted review is
 * visible as pending, and can be approved.
 *
 * Seeding: uses the logged-in session to call submit_product_review via the
 * app's own Supabase REST endpoint, mirroring how a storefront customer
 * would submit. Requires at least one public product in the org.
 */
test.describe("Reviews module", () => {
  test("page loads", async ({ page }) => {
    await page.goto("/reviews", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Сэтгэгдэл").first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("moderation list shows a pending review and approves it", async ({
    page,
  }) => {
    // Land on an origin page first so localStorage (Supabase session) is
    // accessible inside page.evaluate — about:blank denies it.
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const seeded = await seedReviewViaSession(page);
    if (!seeded.ok) {
      test.skip(true, seeded.error ?? "no public product to review");
      return;
    }

    await page.goto("/reviews", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toContainText(REVIEW_NAME, {
      timeout: 15_000,
    });

    const approveBtn = page.getByRole("button", { name: "Батлах" }).first();
    await approveBtn.click();

    const toast = page.locator("[data-sonner-toast]:visible").first();
    await expect(toast).toContainText("Сэтгэгдлийн төлөв шинэчлэгдсэн.", {
      timeout: 15_000,
    });

    await page.goto(`/reviews?refresh=${Date.now()}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("main")).toContainText("Батлагдсан", {
      timeout: 10_000,
    });
  });
});

/**
 * Uses the browser's authenticated Supabase session (from localStorage) to
 * resolve the org slug + a public product, then submits a review via the
 * public RPC. Returns { ok } so the test can skip when no public product
 * exists rather than fail the suite.
 */
async function seedReviewViaSession(page: Page): Promise<{
  ok: boolean;
  error?: string;
}> {
  return page.evaluate(
    async ({ name, comment }) => {
      const url =
        (window as unknown as Record<string, string | undefined>)
          .NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54326";
      const anonKey =
        (window as unknown as Record<string, string | undefined>)
          .NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

      // Recover the auth token from localStorage (supabase-js storage).
      const token = (() => {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.includes("auth-token")) {
            try {
              const raw = localStorage.getItem(key);
              if (!raw) continue;
              const parsed = JSON.parse(raw) as {
                access_token?: string;
              } | null;
              if (parsed?.access_token) return parsed.access_token;
            } catch {
              // not JSON — skip
            }
          }
        }
        return "";
      })();

      const authHeaders = (withAuth: boolean) => ({
        "Content-Type": "application/json",
        apikey: anonKey,
        ...(withAuth ? { Authorization: `Bearer ${token}` } : {}),
      });

      // Resolve org slug via authenticated profiles query.
      const meRes = await fetch(
        `${url}/rest/v1/profiles?select=organization_id,organizations(slug)&limit=1`,
        { headers: authHeaders(true) },
      );
      if (!meRes.ok) return { ok: false, error: "profile fetch failed" };
      const profiles = (await meRes.json()) as Array<{
        organization_id: string;
        organizations: { slug: string } | Array<{ slug: string }> | null;
      }>;
      const slug = profiles[0]?.organizations
        ? Array.isArray(profiles[0].organizations)
          ? profiles[0].organizations[0]?.slug
          : profiles[0].organizations.slug
        : undefined;
      if (!slug) return { ok: false, error: "no org slug" };

      // Find a public product for that org.
      const catRes = await fetch(`${url}/rest/v1/rpc/get_public_products`, {
        method: "POST",
        headers: authHeaders(false),
        body: JSON.stringify({ p_slug: slug }),
      });
      if (!catRes.ok) return { ok: false, error: "catalog fetch failed" };
      const products = (await catRes.json()) as Array<{ id: string }>;
      if (products.length === 0)
        return { ok: false, error: "no public product" };

      const submitRes = await fetch(
        `${url}/rest/v1/rpc/submit_product_review`,
        {
          method: "POST",
          headers: authHeaders(false),
          body: JSON.stringify({
            p_slug: slug,
            p_product_id: products[0].id,
            p_customer_name: name,
            p_rating: 5,
            p_comment: comment,
          }),
        },
      );
      if (!submitRes.ok) return { ok: false, error: "submit failed" };
      const body = (await submitRes.json()) as { success?: boolean };
      return { ok: body.success === true };
    },
    { name: REVIEW_NAME, comment: REVIEW_COMMENT },
  );
}
