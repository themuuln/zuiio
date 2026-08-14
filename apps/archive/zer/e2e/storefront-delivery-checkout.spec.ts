import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

/**
 * Delivery-enabled storefront checkout E2E, backed by the committed
 * fixture (apps/zer/supabase/seed.sql — org slug
 * `storefront-e2e-delivery`).
 *
 * The delivery org enables BOTH delivery and pickup with a flat ₮5,000
 * delivery fee below a ₮20,000 free-delivery threshold and two
 * deterministic products:
 *   - `90000000-…-31` "Хүргэлт Бага Захиалга" (₮1,000)  → fee applies
 *   - `90000000-…-32` "Хүргэлт Их Захиалга" (₮15,000, ×2 = ₮30,000)
 *     → above the threshold → free delivery
 *
 * Covers: the delivery/pickup radio toggle, address-required validation,
 * a fee-charged delivery order + the auto-created `deliveries` row
 * (verified via the LOCAL service-role key), and the free-delivery case
 * (Үнэгүй on the success screen + fee 0 in the DB row).
 *
 * Runs with an empty storage state (anonymous buyer). MUST run
 * unauthenticated: the main project's storage state is an org member.
 *
 * Local-stack only by design — DB assertions use the LOCAL service-role
 * key (never the remote one from .env.local; see shop-online-orders.spec).
 * Cleanup (service role) removes the created rows and restores stock so
 * repeated runs stay deterministic without re-seeding.
 */
const DELIVERY_SLUG = "storefront-e2e-delivery";
const PRODUCT_BELOW = "90000000-0000-4000-8000-000000000031"; // ₮1,000
const PRODUCT_ABOVE = "90000000-0000-4000-8000-000000000032"; // ₮15,000
const DELIVERY_FEE = 5000;

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

async function seededOrgHasCatalog(slug: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${supabaseUrl()}/rest/v1/rpc/get_public_products`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: anonKey() },
        body: JSON.stringify({ p_slug: slug, p_page: 1, p_page_size: 1 }),
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
 * page (single add-to-cart button, no catalog ordering ambiguity).
 *
 * Mirrors the helpers.ts poll pattern: the first click can land before
 * React hydrates and get swallowed (no toast, no cart write). Re-click
 * only while the cart is provably empty so a landed click is never
 * double-added.
 */
async function addProductToCart(page: Page, slug: string, productId: string) {
  await page.goto(`/${slug}/products/${productId}`, {
    waitUntil: "domcontentloaded",
  });
  const addButton = page
    .getByRole("button", { name: "Сагсанд нэмэх", exact: true })
    .first();
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
        if (cart?.includes(`"productId":"${productId}"`)) return true;
        if (!cart || cart.includes('"items":[]')) {
          await addButton.click({ timeout: 1_000 }).catch(() => {});
        }
        return false;
      },
      { timeout: 15_000, intervals: [100, 250, 500] },
    )
    .toBe(true);
}

async function fillCheckoutContact(page: Page, name: string, phone: string) {
  await page.locator('input[autocomplete="name"]').fill(name);
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
  productId: string;
  initialStock: number;
};

const createdOrders: CreatedOrder[] = [];

async function initialStockOf(productId: string): Promise<number> {
  const res = await adminFetch(
    `/rest/v1/products?id=eq.${productId}&select=current_stock`,
  );
  if (!res.ok) return 20;
  const rows = (await res.json()) as Array<{ current_stock: number }>;
  return rows[0]?.current_stock ?? 20;
}

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
    await scopedDelete(`/rest/v1/deliveries?sale_id=eq.${order.saleId}`);
    await scopedDelete(`/rest/v1/sales?id=eq.${order.saleId}`);
    await scopedDelete(
      `/rest/v1/contacts?phone=eq.${order.phone}&type=eq.customer`,
    );
    // Restore the stock the order consumed (seed is idempotent but
    // repeated runs must not drain the delivery-org products).
    await fetch(`${supabaseUrl()}/rest/v1/products?id=eq.${order.productId}`, {
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

test.describe("Delivery-enabled checkout (seeded delivery org, anonymous)", () => {
  test("delivery order charges the fee, validates address and creates a deliveries row", async ({
    page,
  }) => {
    test.skip(
      !(await seededOrgHasCatalog(DELIVERY_SLUG)),
      `seed missing — run apps/zer/supabase/seed.sql on the local stack`,
    );

    const phone = randomPhone();
    const address = "УБ, Баянгол дүүрэг, 4-р хороо, 12-р байр, 24 тоот";
    const addressNote = "2-р орц, 5-р давхар";
    // Snapshot stock BEFORE the order so cleanup can restore it exactly.
    const initialStock = await initialStockOf(PRODUCT_BELOW);
    let saleId = "";

    try {
      await addProductToCart(page, DELIVERY_SLUG, PRODUCT_BELOW);
      await page.goto(`/${DELIVERY_SLUG}/cart`, {
        waitUntil: "domcontentloaded",
      });
      await expect(page.getByText("Хүргэлт Бага Захиалга").first()).toBeVisible(
        { timeout: 15_000 },
      );

      // Delivery/pickup choice renders; pickup is the default when both
      // are enabled — switch to delivery.
      await expect(
        page.getByText("Хүлээн авах арга", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("radio", { name: "Дэлгүүрээс авах" }),
      ).toBeChecked();
      await page.getByText("Хүргүүлэх", { exact: true }).click();
      await expect(
        page.getByRole("radio", { name: "Хүргүүлэх" }),
      ).toBeChecked();

      // Address is required for delivery — client-side validation error,
      // cart stays intact, no RPC is fired.
      await fillCheckoutContact(page, "Хүргэлтийн Хэрэглэгч", phone);
      await page.getByRole("button", { name: "Худалдан авалт" }).click();
      await expect(
        page.getByRole("alert").getByText("Хүргэлтийн хаягаа оруулна уу."),
      ).toBeVisible({ timeout: 10_000 });
      await expect(
        page.getByText("Хүргэлт Бага Захиалга").first(),
      ).toBeVisible();

      // Fill the address + note and place the order.
      await page.locator("#checkout-address").fill(address);
      await page.locator("#checkout-address-note").fill(addressNote);
      saleId = await submitOrder(page);

      // Success screen: Хүргэлт fee line + server-side total (subtotal
      // ₮1,000 below the ₮20,000 threshold → ₮5,000 fee).
      await expect(page.getByText("Хүргэлт", { exact: true })).toBeVisible();
      await expect(page.getByText(/₮ 5,000/)).toBeVisible();
      await expect(page.getByText(/₮ 6,000/)).toBeVisible();

      // The sale auto-created a `deliveries` row with the buyer's address.
      const res = await adminFetch(
        `/rest/v1/deliveries?sale_id=eq.${saleId}&select=address,address_note,contact_name,contact_phone,delivery_fee,status`,
      );
      expect(res.ok).toBe(true);
      const rows = (await res.json()) as Array<{
        address: string;
        address_note: string | null;
        contact_name: string;
        contact_phone: string;
        delivery_fee: number;
        status: string;
      }>;
      expect(rows).toHaveLength(1);
      expect(rows[0].address).toBe(address);
      expect(rows[0].address_note).toBe(addressNote);
      expect(rows[0].contact_name).toBe("Хүргэлтийн Хэрэглэгч");
      expect(rows[0].contact_phone).toBe(phone);
      expect(Number(rows[0].delivery_fee)).toBe(DELIVERY_FEE);
      expect(rows[0].status).toBe("pending");
    } finally {
      if (saleId) {
        createdOrders.push({
          saleId,
          phone,
          productId: PRODUCT_BELOW,
          initialStock,
        });
      }
    }
  });

  test("delivery above the free-delivery threshold is free (Үнэгүй + fee 0 in DB)", async ({
    page,
  }) => {
    test.skip(
      !(await seededOrgHasCatalog(DELIVERY_SLUG)),
      `seed missing — run apps/zer/supabase/seed.sql on the local stack`,
    );

    const phone = randomPhone();
    const address = "УБ, Сүхбаатар дүүрэг, 1-р хороо, 3-р байр";
    // Snapshot stock BEFORE the order so cleanup can restore it exactly.
    const initialStock = await initialStockOf(PRODUCT_ABOVE);
    let saleId = "";

    try {
      // ₮15,000 × 2 = ₮30,000 ≥ ₮20,000 free-delivery threshold.
      await addProductToCart(page, DELIVERY_SLUG, PRODUCT_ABOVE);
      await page.goto(`/${DELIVERY_SLUG}/cart`, {
        waitUntil: "domcontentloaded",
      });
      await expect(page.getByText("Хүргэлт Их Захиалга").first()).toBeVisible({
        timeout: 15_000,
      });
      await page.getByRole("button", { name: "Тоо хэмжээ нэмэх" }).click();
      await expect(page.getByText(/₮ 30,000/).first()).toBeVisible();

      await page.getByText("Хүргүүлэх", { exact: true }).click();
      await expect(
        page.getByRole("radio", { name: "Хүргүүлэх" }),
      ).toBeChecked();
      await page.locator("#checkout-address").fill(address);
      await fillCheckoutContact(page, "Хүргэлтийн Хэрэглэгч", phone);
      saleId = await submitOrder(page);

      // Success screen shows Үнэгүй instead of a fee line.
      await expect(page.getByText("Хүргэлт", { exact: true })).toBeVisible();
      await expect(page.getByText("Үнэгүй", { exact: true })).toBeVisible();
      await expect(page.getByText(/₮ 30,000/).first()).toBeVisible();

      // The deliveries row exists with fee 0.
      const res = await adminFetch(
        `/rest/v1/deliveries?sale_id=eq.${saleId}&select=address,delivery_fee,status`,
      );
      expect(res.ok).toBe(true);
      const rows = (await res.json()) as Array<{
        address: string;
        delivery_fee: number;
        status: string;
      }>;
      expect(rows).toHaveLength(1);
      expect(rows[0].address).toBe(address);
      expect(Number(rows[0].delivery_fee)).toBe(0);
      expect(rows[0].status).toBe("pending");
    } finally {
      if (saleId) {
        createdOrders.push({
          saleId,
          phone,
          productId: PRODUCT_ABOVE,
          initialStock,
        });
      }
    }
  });
});
