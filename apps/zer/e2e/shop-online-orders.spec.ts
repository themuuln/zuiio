import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Online (storefront) orders in the admin shop history.
 *
 * Flow:
 *  1. Skip when the committed seed (supabase/seed.sql, org slug
 *     `storefront-e2e-test`) is not applied to the local stack.
 *  2. Place an order via the PUBLIC `submit_shop_order` RPC against the
 *     seeded org (guest checkout, server-side pricing, is_online = true).
 *  3. Create a throwaway staff user in the seeded org, log in through the
 *     app, open the shop history drawer (/shop -> "Түүх").
 *  4. Assert the order row is flagged "Онлайн" and shows the buyer contact.
 *  5. Cleanup (service role): sale + items + movements + restored stock +
 *     created contact + profile + auth user.
 *
 * The seeded org has no staff profile, so the staff session is created
 * inside the test (idempotent-safe: unique email/phone per run).
 */

const SEEDED_SLUG = "storefront-e2e-test";
const SEEDED_PRODUCT_ID = "90000000-0000-4000-8000-000000000001";

/**
 * Local-stack-only helpers. .env.local points NEXT_PUBLIC_* at the REMOTE
 * project and sets SUPABASE_SERVICE_ROLE_KEY to the remote `sb_secret_…`
 * key — neither works against the local API. This spec is local-stack-only
 * by design (like the whole seeded suite), so the service-role key is the
 * local constant and only SUPABASE_URL / SUPABASE_ANON_KEY may override the
 * stack location. A runaway order must never hit production.
 */
function supabaseUrl(): string {
  return process.env.SUPABASE_URL ?? "http://127.0.0.1:54326";
}

function anonKey(): string {
  const env = process.env.SUPABASE_ANON_KEY;
  if (env && !env.includes("$$")) return env;
  return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
}

/** Local stack service-role JWT — do NOT read from env (remote key trap). */
function serviceRoleKey(): string {
  return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
}

const anon = () => createClient(supabaseUrl(), anonKey());

async function seedOrgHasCatalog(): Promise<boolean> {
  const { data, error } = await anon().rpc("get_public_products", {
    p_slug: SEEDED_SLUG,
    p_page: 1,
    p_page_size: 1,
  } as never);
  if (error) return false;
  const body = data as { total?: number } | null;
  return (body?.total ?? 0) > 0;
}

async function adminFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`${supabaseUrl()}${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey(),
      Authorization: `Bearer ${serviceRoleKey()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

test.describe("Online orders in the admin shop history", () => {
  test("storefront order shows the Онлайн flag and buyer contact", async ({
    page,
  }) => {
    test.skip(
      !(await seedOrgHasCatalog()),
      `seed missing — run apps/zer/supabase/seed.sql on the local stack`,
    );

    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const email = `staff-${suffix}@example.mn`;
    const password = "E2E-online-order-123";
    const phone = `99${suffix.replace(/\D/g, "").slice(0, 6).padStart(6, "0")}`;
    const buyerName = "Онлайн Хэрэглэгч E2E";

    let saleId = "";
    let userId = "";
    let roleId = "";
    let profileCreated = false;
    let contactId: string | null = null;
    let initialStock = 20;

    try {
      // Capture the seed product's stock so cleanup can restore it exactly.
      const stockRes = await adminFetch(
        `/rest/v1/products?id=eq.${SEEDED_PRODUCT_ID}&select=current_stock`,
      );
      if (stockRes.ok) {
        const rows = (await stockRes.json()) as Array<{
          current_stock: number;
        }>;
        if (rows[0]?.current_stock !== undefined) {
          initialStock = rows[0].current_stock;
        }
      }

      // ── 1. Place the order via the public RPC (guest checkout) ──
      const { data: orderData, error: orderError } = await anon().rpc(
        "submit_shop_order",
        {
          p_org_slug: SEEDED_SLUG,
          p_items: [
            { product_id: SEEDED_PRODUCT_ID, quantity: 1, variant_id: "" },
          ],
          p_payment_method: "cash",
          p_contact_name: buyerName,
          p_contact_phone: phone,
          p_idempotency_key: `online-e2e-${suffix}`,
        } as never,
      );
      expect(orderError).toBeNull();
      const orderRow = Array.isArray(orderData)
        ? (orderData[0] as { order_id: string } | undefined)
        : undefined;
      saleId = orderRow?.order_id ?? "";
      expect(saleId).toBeTruthy();

      // Find the contact the RPC created (for cleanup + buyer assertion).
      const { data: saleRow } = (await anon()
        .from("sales" as never)
        .select("contact_id" as never)
        .eq("id" as never, saleId)
        .single()) as unknown as { data: { contact_id: string | null } | null };
      contactId = saleRow?.contact_id ?? null;

      // ── 2. Create a throwaway staff user in the seeded org ──
      // GoTrue admin API (service role) with email_confirm: true — the local
      // stack runs without the mail service, so anon signUp would fail on
      // "Error sending confirmation email".
      const createRes = await adminFetch("/auth/v1/admin/users", {
        method: "POST",
        body: JSON.stringify({ email, password, email_confirm: true }),
      });
      expect(createRes.ok).toBe(true);
      const createdUser = (await createRes.json()) as { id?: string };
      userId = createdUser.id ?? "";
      expect(userId).toBeTruthy();

      // Staff profile row so the dashboard resolves the seeded org. The
      // seeded org's RLS SELECT policies require the sales.read /
      // products.read permissions, so also create a role with them.
      const roleRes = await adminFetch("/rest/v1/roles", {
        method: "POST",
        body: JSON.stringify({
          organization_id: "10000000-0000-4000-8000-000000000001",
          name: `E2E Staff ${suffix}`,
        }),
        headers: { Prefer: "return=representation" },
      });
      expect(roleRes.ok).toBe(true);
      const roleRows = (await roleRes.json()) as Array<{ id: string }>;
      roleId = roleRows[0]?.id ?? "";
      expect(roleId).toBeTruthy();

      // The drawer embeds contacts(name) — RLS on contacts requires
      // contacts.read for the join to come through.
      for (const permission of [
        "sales.read",
        "products.read",
        "contacts.read",
      ]) {
        const permRes = await adminFetch("/rest/v1/role_permissions", {
          method: "POST",
          body: JSON.stringify({ role_id: roleId, permission }),
          headers: { Prefer: "return=minimal" },
        });
        expect(permRes.ok).toBe(true);
      }

      const profileRes = await adminFetch("/rest/v1/profiles", {
        method: "POST",
        body: JSON.stringify({
          id: userId,
          organization_id: "10000000-0000-4000-8000-000000000001",
          role_id: roleId,
          full_name: "E2E Staff",
        }),
        headers: { Prefer: "return=minimal" },
      });
      expect(profileRes.ok).toBe(true);
      profileCreated = true;

      // ── 3. Log in through the app and open the shop history drawer ──
      // The chromium project ships the dev user's session — sign out first so
      // /login renders the form for the throwaway staff user.
      await page.context().clearCookies();
      await page.goto("/login", { waitUntil: "domcontentloaded" });
      await page.evaluate(() => localStorage.clear());
      await page.goto("/login", { waitUntil: "domcontentloaded" });
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await Promise.all([
        page.waitForURL((url) => !url.pathname.startsWith("/login"), {
          timeout: 30_000,
        }),
        page.click('button[type="submit"]'),
      ]);

      await page.goto("/shop", { waitUntil: "domcontentloaded" });
      // Desktop header nav "Түүх" opens the history drawer (the mobile
      // bottom-bar button is a hidden duplicate at desktop width).
      await page
        .locator('nav[aria-label="Дэлгүүрийн навигац"]')
        .getByRole("button", { name: "Түүх" })
        .click();

      // Drawer opens with the order list.
      await expect(page.getByText("Борлуулалтын түүх").first()).toBeVisible({
        timeout: 15_000,
      });

      // ── 4. Assertions: Онлайн badge + buyer contact ──
      await expect(
        page.getByText("Онлайн", { exact: true }).first(),
      ).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText(buyerName).first()).toBeVisible();

      // The Онлайн захиалга filter keeps the flagged order visible.
      await page.getByRole("button", { name: "Онлайн захиалга" }).click();
      await expect(
        page.getByText("Онлайн", { exact: true }).first(),
      ).toBeVisible();
      await expect(page.getByText(buyerName).first()).toBeVisible();
    } finally {
      // ── 5. Cleanup (service role) — restore stock, remove order/user ──
      // PostgREST filters DELETE/PATCH via query params, NOT the JSON body.
      const scopedDelete = async (path: string) => {
        const res = await adminFetch(path, {
          method: "DELETE",
          headers: { Prefer: "return=minimal" },
        });
        return res;
      };

      if (saleId) {
        await scopedDelete(`/rest/v1/sale_items?sale_id=eq.${saleId}`);
        await scopedDelete(
          `/rest/v1/stock_movements?reference=eq.sale%3A${saleId}`,
        );
        await scopedDelete(`/rest/v1/sales?id=eq.${saleId}`);
        // Restore the stock the order consumed (seed is idempotent but
        // repeated runs must not drain the seeded product).
        await fetch(
          `${supabaseUrl()}/rest/v1/products?id=eq.${SEEDED_PRODUCT_ID}`,
          {
            method: "PATCH",
            headers: {
              apikey: serviceRoleKey(),
              Authorization: `Bearer ${serviceRoleKey()}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify({ current_stock: initialStock }),
          },
        );
      }
      if (contactId) {
        await scopedDelete(`/rest/v1/contacts?id=eq.${contactId}`);
      }
      if (profileCreated) {
        await scopedDelete(`/rest/v1/profiles?id=eq.${userId}`);
      }
      if (roleId) {
        await scopedDelete(`/rest/v1/role_permissions?role_id=eq.${roleId}`);
        await scopedDelete(`/rest/v1/roles?id=eq.${roleId}`);
      }
      if (userId) {
        await adminFetch(`/auth/v1/admin/users/${userId}`, {
          method: "DELETE",
        });
      }
    }
  });
});
