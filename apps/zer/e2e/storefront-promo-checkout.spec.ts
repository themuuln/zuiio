import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

/**
 * Storefront coupon + gift card redemption E2E, backed by the committed
 * fixture (apps/zer/supabase/seed.sql — org slug `storefront-e2e-test`,
 * which has delivery/pickup disabled so the checkout stays simple).
 *
 * Fixture promo rows on the base org:
 *   - coupon `E2E10` — 10% percentage discount, no usage_limit, applies
 *     to the whole order ('all' scope).
 *   - gift card `E2EGIFT4000` — ₮4,000 balance (reset to ₮4,000 in
 *     beforeAll via the LOCAL service role so repeat runs without
 *     re-seeding stay deterministic).
 *
 * Covers: coupon success (Хямдрал line + reduced total), invalid coupon
 * (Mongolian error, cart intact, NO sale created — verified in the DB),
 * and gift card partial redemption (Бэлгийн карт line + balance
 * decremented — verified in the DB).
 *
 * Runs with an empty storage state (anonymous buyer). DB assertions use
 * the LOCAL service-role key (never the remote .env.local one). Cleanup
 * removes created rows and restores stock.
 */
const SEEDED_SLUG = "storefront-e2e-test";
const PRODUCT = "90000000-0000-4000-8000-000000000001"; // ₮1,000/ширхэг
const COUPON_CODE = "E2E10";
const GIFT_CARD_CODE = "E2EGIFT4000";
const GIFT_CARD_BALANCE = 4000;
const GIFT_CARD_ID = "b0000000-0000-4000-8000-000000000001";

test.use({ storageState: { cookies: [], origins: [] } });

function supabaseUrl(): string {
  return process.env.SUPABASE_URL ?? "http://127.0.0.1:54326";
}

/** Local stack anon key — the remote .env.local key is never read. */
function anonKey(): string {
  const env = process.env.SUPABASE_ANON_KEY;
  if (env && !env.includes("$$")) return env;
  return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
}

/** Local stack service-role JWT — do NOT read from env (remote key trap). */
function serviceRoleKey(): string {
  return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
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

async function seededOrgHasCatalog(): Promise<boolean> {
  try {
    const res = await fetch(
      `${supabaseUrl()}/rest/v1/rpc/get_public_products`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: anonKey() },
        body: JSON.stringify({
          p_slug: SEEDED_SLUG,
          p_page: 1,
          p_page_size: 1,
        }),
      },
    );
    if (!res.ok) return false;
    const data = (await res.json()) as { total?: number };
    return (data.total ?? 0) > 0;
  } catch {
    return false;
  }
}

/** Unique 8-digit phone — submit_shop_order flood-limits pending orders per contact phone (5/hour). */
function randomPhone(): string {
  return `99${String(Math.floor(Math.random() * 900000) + 100000)}`;
}

/**
 * Add a deterministic product to the cart through its dedicated detail
 * page (single add-to-cart button), then bump the quantity to `qty` in
 * the cart and return the expected subtotal.
 */
async function addProduct(page: Page, qty: number): Promise<number> {
  const unitPrice = 1000;
  await page.goto(`/${SEEDED_SLUG}/products/${PRODUCT}`, {
    waitUntil: "domcontentloaded",
  });
  const addButton = page.getByRole("button", {
    name: "Сагсанд нэмэх",
    exact: true,
  });
  // Poll-and-retry (helpers.ts pattern): the first click can land before
  // hydration and be swallowed; re-click only while the cart is empty so
  // a landed click is never double-added.
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
        if (cart?.includes(`"productId":"${PRODUCT}"`)) return true;
        if (!cart || cart.includes('"items":[]')) {
          await addButton.click({ timeout: 1_000 }).catch(() => {});
        }
        return false;
      },
      { timeout: 15_000, intervals: [100, 250, 500] },
    )
    .toBe(true);
  await page.goto(`/${SEEDED_SLUG}/cart`, { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Бүтээгдэхүүн 1").first()).toBeVisible({
    timeout: 15_000,
  });
  for (let i = 1; i < qty; i += 1) {
    await page.getByRole("button", { name: "Тоо хэмжээ нэмэх" }).click();
  }
  await expect(page.getByText(/Нийт/).first()).toBeVisible();
  return unitPrice * qty;
}

async function fillCheckoutContact(page: Page, phone: string) {
  await page.locator('input[autocomplete="name"]').fill("Купон Хэрэглэгч");
  await page.locator('input[autocomplete="tel"]').fill(phone);
}

/** Submit and wait for the order success card; returns the order id. */
async function submitOrder(page: Page): Promise<string> {
  await page.getByRole("button", { name: "Худалдан авалт" }).click();
  await expect(page.getByText("Захиалга амжилттай үүслээ")).toBeVisible({
    timeout: 30_000,
  });
  const orderLine = await page.getByText(/Захиалгын дугаар:/).textContent();
  const orderId = (orderLine?.split(":")[1] ?? "").trim();
  expect(orderId).toMatch(/^[0-9a-f]{8}-[0-9a-f-]+$/);
  return orderId;
}

type CreatedOrder = {
  saleId: string;
  phone: string;
  initialStock: number;
};

const createdOrders: CreatedOrder[] = [];

test.beforeAll(async () => {
  // Reset the gift card balance for deterministic repeat runs (the seed
  // also resets it, but specs must not depend on re-seeding).
  await adminFetch(`/rest/v1/gift_cards?id=eq.${GIFT_CARD_ID}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ current_balance: GIFT_CARD_BALANCE }),
  });
});

test.afterAll(async () => {
  for (const order of createdOrders) {
    const scopedDelete = (path: string) =>
      adminFetch(path, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" },
      });
    await scopedDelete(`/rest/v1/sale_items?sale_id=eq.${order.saleId}`);
    await scopedDelete(
      `/rest/v1/stock_movements?reference=eq.sale%3A${order.saleId}`,
    );
    await scopedDelete(`/rest/v1/sales?id=eq.${order.saleId}`);
    await scopedDelete(
      `/rest/v1/contacts?phone=eq.${order.phone}&type=eq.customer`,
    );
    // Restore the stock the order consumed.
    await fetch(`${supabaseUrl()}/rest/v1/products?id=eq.${PRODUCT}`, {
      method: "PATCH",
      headers: {
        apikey: serviceRoleKey(),
        Authorization: `Bearer ${serviceRoleKey()}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ current_stock: order.initialStock }),
    });
  }
});

test.describe("Storefront promo checkout (seeded org, anonymous)", () => {
  test("coupon applies a percentage discount and reduces the total", async ({
    page,
  }) => {
    test.skip(
      !(await seededOrgHasCatalog()),
      `seed missing — run apps/zer/supabase/seed.sql on the local stack`,
    );

    const phone = randomPhone();
    // Snapshot stock BEFORE the order so cleanup can restore it exactly.
    const initialStock = 20;
    let saleId = "";
    try {
      // Subtotal ₮5,000 (5 × ₮1,000); E2E10 = 10% → ₮500 discount.
      await addProduct(page, 5);
      await fillCheckoutContact(page, phone);
      await page.locator("#checkout-coupon").fill(COUPON_CODE);
      saleId = await submitOrder(page);

      await expect(page.getByText("Хямдрал", { exact: true })).toBeVisible();
      await expect(page.getByText(/−₮ 500/)).toBeVisible();
      await expect(page.getByText(/₮ 4,500/)).toBeVisible();

      // Server-side pricing is authoritative: discount_amount on the sale.
      const res = await adminFetch(
        `/rest/v1/sales?id=eq.${saleId}&select=total_amount,original_amount,discount_amount,coupon_id`,
      );
      expect(res.ok).toBe(true);
      const rows = (await res.json()) as Array<{
        total_amount: number;
        original_amount: number;
        discount_amount: number;
        coupon_id: string | null;
      }>;
      expect(rows).toHaveLength(1);
      expect(Number(rows[0].original_amount)).toBe(5000);
      expect(Number(rows[0].discount_amount)).toBe(500);
      expect(Number(rows[0].total_amount)).toBe(4500);
      expect(rows[0].coupon_id).toBeTruthy();
    } finally {
      if (saleId) createdOrders.push({ saleId, phone, initialStock });
    }
  });

  test("invalid coupon shows an error, keeps the cart and creates no order", async ({
    page,
  }) => {
    test.skip(
      !(await seededOrgHasCatalog()),
      `seed missing — run apps/zer/supabase/seed.sql on the local stack`,
    );

    const phone = randomPhone();
    const orgId = "10000000-0000-4000-8000-000000000001";
    const orgSales = async () =>
      (await (
        await adminFetch(`/rest/v1/sales?select=id&organization_id=eq.${orgId}`)
      ).json()) as Array<{ id: string }>;
    const salesBefore = await orgSales();

    await addProduct(page, 2);
    await fillCheckoutContact(page, phone);
    await page.locator("#checkout-coupon").fill("INVALID-CODE-123");
    await page.getByRole("button", { name: "Худалдан авалт" }).click();

    // The RPC rejects the coupon; the checkout surfaces the server's
    // specific message ("Купон олдсонгүй" — surfaced verbatim since
    // da00d58d) and never reaches the success screen.
    await expect(
      page.getByRole("alert").getByText(/Купон олдсонгүй/),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Захиалга амжилттай үүслээ")).toHaveCount(0);
    // Cart intact — the line is still there and the submit button is live.
    await expect(page.getByText("Бүтээгдэхүүн 1").first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Худалдан авалт" }),
    ).toBeEnabled();

    // The failed RPC raised before inserting anything, so the org gained
    // no sale and no contact was left behind for this phone (the whole
    // transaction rolled back).
    const salesAfter = await orgSales();
    expect(salesAfter).toHaveLength(salesBefore.length);
    const contactRes = await adminFetch(
      `/rest/v1/contacts?phone=eq.${phone}&type=eq.customer&select=id`,
    );
    expect(contactRes.ok).toBe(true);
    const contactRows = (await contactRes.json()) as Array<{ id: string }>;
    expect(contactRows).toHaveLength(0);
  });

  test("gift card partially redeems the order and decrements the balance", async ({
    page,
  }) => {
    test.skip(
      !(await seededOrgHasCatalog()),
      `seed missing — run apps/zer/supabase/seed.sql on the local stack`,
    );

    const phone = randomPhone();
    let saleId = "";
    try {
      // Subtotal ₮5,000; gift card balance ₮4,000 < payable → partial
      // redemption of ₮4,000; the remaining ₮1,000 is paid by the method.
      await addProduct(page, 5);
      await fillCheckoutContact(page, phone);
      await page.locator("#checkout-gift-card").fill(GIFT_CARD_CODE);
      saleId = await submitOrder(page);

      await expect(
        page.getByText("Бэлгийн карт", { exact: true }),
      ).toBeVisible();
      await expect(page.getByText(/−₮ 4,000/)).toBeVisible();
      // Total stays the merchandise total — the card is a payment split.
      await expect(page.getByText(/₮ 5,000/).first()).toBeVisible();

      // Balance decremented 4,000 → 0 and the sale records the split.
      const balanceRes = await adminFetch(
        `/rest/v1/gift_cards?id=eq.${GIFT_CARD_ID}&select=current_balance`,
      );
      expect(balanceRes.ok).toBe(true);
      const balanceRows = (await balanceRes.json()) as Array<{
        current_balance: number;
      }>;
      expect(Number(balanceRows[0]?.current_balance)).toBe(0);

      const saleRes = await adminFetch(
        `/rest/v1/sales?id=eq.${saleId}&select=gift_card_amount,gift_card_id`,
      );
      const saleRows = (await saleRes.json()) as Array<{
        gift_card_amount: number;
        gift_card_id: string | null;
      }>;
      expect(saleRows).toHaveLength(1);
      expect(Number(saleRows[0].gift_card_amount)).toBe(4000);
      expect(saleRows[0].gift_card_id).toBe(GIFT_CARD_ID);
    } finally {
      if (saleId) createdOrders.push({ saleId, phone, initialStock: 20 });
    }
  });
});
