import { createHmac } from "node:crypto";
import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

/**
 * Store buyer account flow E2E, backed by the committed fixture
 * (apps/zer/supabase/seed.sql — slug `storefront-e2e-test`).
 *
 * Creates a fresh buyer through the GoTrue admin API (service-role JWT —
 * same technique as src/__integration__/helpers.ts), then drives the UI:
 * sign in through the app login (the middleware redirects anonymous
 * visitors away from /[slug]/account), verify the profile renders, place
 * an order through the seeded catalog and assert it appears in order
 * history.
 *
 * MUST run unauthenticated: the main project's storage state is an org
 * member, who would be redirected away from buyer pages.
 */
const SEEDED_SLUG = "storefront-e2e-test";
const DELIVERY_SLUG = "storefront-e2e-delivery";
// Dedicated product (₮2,000) so the buyer-account spec never restores the
// same product's stock concurrently with storefront-delivery-checkout.
const DELIVERY_PRODUCT = "90000000-0000-4000-8000-000000000033";
const SUPABASE_URL = process.env.E2E_SUPABASE_URL ?? "http://127.0.0.1:54326";
const jwtSecret =
  process.env.SUPABASE_JWT_SECRET ??
  "super-secret-jwt-token-with-at-least-32-characters-long";

test.use({ storageState: { cookies: [], origins: [] } });

/** Local stack service-role JWT — do NOT read from env (remote key trap). */
function serviceRoleKey(): string {
  return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
}

/** Service-role PostgREST call (local stack) for DB assertions + cleanup. */
async function adminFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey(),
      Authorization: `Bearer ${serviceRoleKey()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

/** Sign a service-role / anon JWT for the local stack (helpers.ts style). */
function signJwt(role: "anon" | "service_role"): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: "supabase-demo",
      role,
      exp: Math.floor(Date.now() / 1000) + 86400,
    }),
  ).toString("base64url");
  const sig = createHmac("sha256", jwtSecret)
    .update(`${header}.${payload}`)
    .digest()
    .toString("base64url");
  return `${header}.${payload}.${sig}`;
}

async function seededOrgExists(slug: string = SEEDED_SLUG): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_public_products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: signJwt("anon"),
      },
      body: JSON.stringify({ p_slug: slug, p_page: 1, p_page_size: 1 }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { total?: number };
    return (data.total ?? 0) > 0;
  } catch {
    return false;
  }
}

type Buyer = { id: string; email: string; password: string };

async function createBuyer(): Promise<Buyer> {
  const email = `buyer-e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const password = "test-password-123";
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: signJwt("anon"),
      Authorization: `Bearer ${signJwt("service_role")}`,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        store_account: true,
        display_name: "E2E Худалдан авагч",
        phone: "99887766",
      },
    }),
  });
  if (!res.ok) {
    throw new Error(
      `admin create user failed: ${res.status} ${await res.text()}`,
    );
  }
  const user = (await res.json()) as { id: string };
  return { id: user.id, email, password };
}

async function deleteBuyer(id: string): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
      method: "DELETE",
      headers: {
        apikey: signJwt("anon"),
        Authorization: `Bearer ${signJwt("service_role")}`,
      },
    });
  } catch {
    // best-effort cleanup — the buyer row is fixture-scoped anyway
  }
}

/**
 * Sign the browser in as the created buyer through the app login page.
 * The middleware redirects anonymous /[slug]/account visits to /login,
 * so login is the only way onto the buyer pages.
 */
async function signInAsBuyer(
  page: Page,
  buyer: Buyer,
  slug: string = SEEDED_SLUG,
): Promise<void> {
  await page.goto(`/login?next=/${slug}/account`, {
    waitUntil: "domcontentloaded",
  });
  await page.locator('input[name="email"]').fill(buyer.email);
  await page.locator('input[name="password"]').fill(buyer.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 30_000,
  });
}

let buyer: Buyer | null = null;
let setupMessage: string | null = null;

test.beforeAll(async () => {
  if (!(await seededOrgExists())) {
    setupMessage = `seed missing — run apps/zer/supabase/seed.sql on the local stack`;
    return;
  }
  try {
    buyer = await createBuyer();
  } catch (err) {
    setupMessage = `buyer setup failed: ${
      err instanceof Error ? err.message : String(err)
    }`;
  }
});

test.afterAll(async () => {
  if (buyer) {
    await deleteBuyer(buyer.id);
  }
});

test.beforeEach(() => {
  test.skip(!!setupMessage, setupMessage ?? "buyer unavailable");
});

test.describe("Store buyer account (seeded org)", () => {
  test("buyer signs in and sees their profile", async ({ page }) => {
    if (!buyer) throw new Error("buyer setup failed");
    await signInAsBuyer(page, buyer);

    await page.goto(`/${SEEDED_SLUG}/account`, {
      waitUntil: "domcontentloaded",
    });

    // Profile card: welcome message with display name + email + orders link
    await expect(page.getByText("Сайн уу, E2E Худалдан авагч!")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(buyer.email)).toBeVisible();
    await expect(page.getByText("99887766")).toBeVisible();
    // Button asChild renders an anchor exposed with role="button"
    await expect(
      page.getByRole("button", { name: "Захиалгын түүх" }),
    ).toHaveAttribute("href", `/${SEEDED_SLUG}/account/orders`);
  });

  test("buyer places an order and sees it in order history", async ({
    page,
  }) => {
    if (!buyer) throw new Error("buyer setup failed");
    await signInAsBuyer(page, buyer);

    // Add a product to the cart from the catalog
    await page.goto(`/${SEEDED_SLUG}/products`, {
      waitUntil: "domcontentloaded",
    });
    await page
      .locator("main")
      .getByRole("button", { name: "Сагсанд нэмэх", exact: true })
      .first()
      .click();
    await expect(page.getByText("Сагсанд нэмэгдлээ")).toBeVisible({
      timeout: 10_000,
    });

    // Checkout
    await page.goto(`/${SEEDED_SLUG}/cart`, { waitUntil: "domcontentloaded" });
    await page.locator('input[autocomplete="name"]').fill("E2E Худалдан авагч");
    // Unique phone per run — see guest-checkout spec for the flood-limit note
    const phone = `99${String(Math.floor(Math.random() * 900000) + 100000)}`;
    await page.locator('input[autocomplete="tel"]').fill(phone);
    await page.getByRole("button", { name: "Худалдан авалт" }).click();

    await expect(page.getByText("Захиалга амжилттай үүслээ")).toBeVisible({
      timeout: 30_000,
    });
    const orderLine = await page.getByText(/Захиалгын дугаар:/).textContent();
    const orderIdPrefix = (orderLine?.split(":")[1] ?? "").trim().slice(0, 8);
    expect(orderIdPrefix).toMatch(/^[0-9a-f]{8}$/);

    // Order history: the sale shows with a pending status and id prefix
    await page.goto(`/${SEEDED_SLUG}/account/orders`, {
      waitUntil: "domcontentloaded",
    });
    await expect(
      page.getByRole("heading", { name: "Захиалгын түүх" }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(orderIdPrefix, { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Хүлээгдэж буй")).toBeVisible();
  });

  test("buyer opens a delivery order detail with timeline, delivery info and tracking id", async ({
    page,
  }) => {
    if (!buyer) throw new Error("buyer setup failed");
    test.skip(
      !(await seededOrgExists(DELIVERY_SLUG)),
      `delivery seed missing — run apps/zer/supabase/seed.sql on the local stack`,
    );

    const phone = `99${String(Math.floor(Math.random() * 900000) + 100000)}`;
    const address = "УБ, Хан-Уул дүүрэг, 12-р хороо, 4-р байр, 8 тоот";
    const addressNote = "2-р орц";
    // Snapshot stock BEFORE the order so cleanup can restore it exactly.
    const initialStockRes = await adminFetch(
      `/rest/v1/products?id=eq.${DELIVERY_PRODUCT}&select=current_stock`,
    );
    const initialStockRows = initialStockRes.ok
      ? ((await initialStockRes.json()) as Array<{ current_stock: number }>)
      : [];
    const initialStock = initialStockRows[0]?.current_stock ?? 20;
    let saleId = "";

    const cleanupOrder = async () => {
      const scopedDelete = (path: string) =>
        adminFetch(path, {
          method: "DELETE",
          headers: { Prefer: "return=minimal" },
        });
      await scopedDelete(`/rest/v1/sale_items?sale_id=eq.${saleId}`);
      await scopedDelete(
        `/rest/v1/stock_movements?reference=eq.sale%3A${saleId}`,
      );
      await scopedDelete(`/rest/v1/deliveries?sale_id=eq.${saleId}`);
      await scopedDelete(`/rest/v1/sales?id=eq.${saleId}`);
      await scopedDelete(
        `/rest/v1/contacts?phone=eq.${phone}&type=eq.customer`,
      );
      // Restore the stock the order consumed (repeated runs must not drain
      // the delivery-org seed product).
      await fetch(
        `${SUPABASE_URL}/rest/v1/products?id=eq.${DELIVERY_PRODUCT}`,
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
    };

    try {
      await signInAsBuyer(page, buyer, DELIVERY_SLUG);

      // Visit the account page FIRST so useStoreSession upserts the
      // store_accounts row — submit_shop_order links the sale to the
      // account via auth.uid(), and get_public_order only serves the
      // buyer's own orders.
      await page.goto(`/${DELIVERY_SLUG}/account`, {
        waitUntil: "domcontentloaded",
      });
      await expect(page.getByText("Сайн уу, E2E Худалдан авагч!")).toBeVisible({
        timeout: 15_000,
      });

      // Place a delivery order below the free-delivery threshold
      // (₮2,000 subtotal → ₮5,000 fee → ₮7,000 total).
      await page.goto(`/${DELIVERY_SLUG}/products/${DELIVERY_PRODUCT}`, {
        waitUntil: "domcontentloaded",
      });
      const addButton = page.getByRole("button", {
        name: "Сагсанд нэмэх",
        exact: true,
      });
      // Poll-and-retry (helpers.ts pattern): the first click can land
      // before hydration and be swallowed; re-click only while the cart is
      // empty so a landed click is never double-added.
      await expect
        .poll(
          async () => {
            if (
              await page
                .getByText("Сагсанд нэмэгдлээ")
                .isVisible()
                .catch(() => false)
            ) {
              return true;
            }
            const cart = await page.evaluate(() =>
              localStorage.getItem("zer-storefront-cart"),
            );
            if (cart?.includes(`"productId":"${DELIVERY_PRODUCT}"`)) {
              return true;
            }
            if (!cart || cart.includes('"items":[]')) {
              await addButton.click({ timeout: 1_000 }).catch(() => {});
            }
            return false;
          },
          { timeout: 15_000, intervals: [100, 250, 500] },
        )
        .toBe(true);
      await page.goto(`/${DELIVERY_SLUG}/cart`, {
        waitUntil: "domcontentloaded",
      });
      await expect(
        page.getByText("Хүргэлт Дансны Захиалга").first(),
      ).toBeVisible({ timeout: 15_000 });
      await page.getByText("Хүргүүлэх", { exact: true }).click();
      await page.locator("#checkout-address").fill(address);
      await page.locator("#checkout-address-note").fill(addressNote);
      await page
        .locator('input[autocomplete="name"]')
        .fill("E2E Худалдан авагч");
      await page.locator('input[autocomplete="tel"]').fill(phone);
      await page.getByRole("button", { name: "Худалдан авалт" }).click();
      await expect(page.getByText("Захиалга амжилттай үүслээ")).toBeVisible({
        timeout: 30_000,
      });
      const orderLine = await page.getByText(/Захиалгын дугаар:/).textContent();
      saleId = (orderLine?.split(":")[1] ?? "").trim();
      expect(saleId).toMatch(/^[0-9a-f]{8}-[0-9a-f-]+$/);

      // Order list → the delivery order renders with a Дэлгэрэнгүй link.
      await page.goto(`/${DELIVERY_SLUG}/account/orders`, {
        waitUntil: "domcontentloaded",
      });
      await expect(
        page.getByRole("heading", { name: "Захиалгын түүх" }),
      ).toBeVisible({ timeout: 15_000 });
      const detailLink = page.locator(
        `a[href="/${DELIVERY_SLUG}/account/orders/${saleId}"]`,
      );
      await expect(detailLink).toBeVisible({ timeout: 15_000 });
      await detailLink.click();

      // Detail: header, status timeline, delivery info card, totals.
      await expect(
        page.getByRole("heading", { name: saleId.slice(0, 8) }),
      ).toBeVisible({ timeout: 15_000 });
      for (const step of [
        "Захиалга үүссэн",
        "Баталгаажсан",
        "Хүргэлтэнд гарсан",
        "Хүргэгдсэн",
      ]) {
        await expect(page.getByText(step, { exact: true })).toBeVisible();
      }
      await expect(
        page.getByText("Хүргэлтийн мэдээлэл", { exact: true }),
      ).toBeVisible();
      await expect(page.getByText(address, { exact: true })).toBeVisible();
      await expect(page.getByText(/Төлөв: Хүлээгдэж буй/)).toBeVisible();
      await expect(
        page.getByText("Хүргэлтийн төлбөр", { exact: true }),
      ).toBeVisible();
      // Нийт дүн only exists in the Төлбөр card (the orders-list row below
      // can linger in the DOM during soft navigation), so scope through it.
      await expect(
        page
          .getByText("Нийт дүн", { exact: true })
          .locator("..")
          .getByText(/₮ 7,000/),
      ).toBeVisible();

      // Advance the delivery to in_transit + assign a tracking id (service
      // role) and reload — the detail page reflects both.
      const patch = await adminFetch(
        `/rest/v1/deliveries?sale_id=eq.${saleId}`,
        {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            status: "in_transit",
            external_tracking_id: "E2E-TRK-777",
          }),
        },
      );
      expect(patch.ok).toBe(true);

      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(
        page.getByText("Хүргэлтэнд", { exact: true }).first(),
      ).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(/Төлөв: Хүргэлтэнд/)).toBeVisible();
      await expect(page.getByText("Ангид: E2E-TRK-777")).toBeVisible();
    } finally {
      if (saleId) await cleanupOrder();
    }
  });
});
