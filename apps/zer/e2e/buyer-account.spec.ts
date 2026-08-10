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
const SUPABASE_URL = process.env.E2E_SUPABASE_URL ?? "http://127.0.0.1:54326";
const jwtSecret =
  process.env.SUPABASE_JWT_SECRET ??
  "super-secret-jwt-token-with-at-least-32-characters-long";

test.use({ storageState: { cookies: [], origins: [] } });

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

async function seededOrgExists(): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_public_products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: signJwt("anon"),
      },
      body: JSON.stringify({ p_slug: SEEDED_SLUG, p_page: 1, p_page_size: 1 }),
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
async function signInAsBuyer(page: Page, buyer: Buyer): Promise<void> {
  await page.goto(`/login?next=/${SEEDED_SLUG}/account`, {
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
});
