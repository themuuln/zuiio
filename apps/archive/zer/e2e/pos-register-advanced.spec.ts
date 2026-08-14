import { expect, type Page, test } from "@playwright/test";

/**
 * Advanced POS register E2E — closes the gaps the main spec leaves open:
 * 1. barcode wedge scan (real keyboard-emulated scan → product added)
 * 2. variant flow through the real VariantPicker (option group → variant)
 * 3. layout probes: no horizontal overflow at desktop AND mobile, cart
 *    column right of the grid on desktop and below it on mobile
 *
 * Uses the shared auth.setup storage state (chromium project). Barcode and
 * variant tests seed their own org-scoped products via the local stack's
 * service role and clean them up afterward.
 */
const API_URL = "http://127.0.0.1:54326";
// Local stack only: pin the legacy demo service-role JWT. The modern
// sb_secret_ key injected by .env.local is NOT recognized as service_role
// by this stack's PostgREST (inserts hit RLS 42501), while the demo key
// bypasses it.
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const createdProductIds: string[] = [];

test.afterEach(async () => {
  for (const id of createdProductIds.splice(0)) {
    await fetch(`${API_URL}/rest/v1/products?id=eq.${id}`, {
      method: "DELETE",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });
  }
});

test.setTimeout(120_000);

/**
 * Open the register (session comes from the shared auth storage state).
 * Retries once on the dashboard-shell instant-validation 500 ("Алдаа
 * гарлаа") — a pre-existing Cache Components flake that can hit the first
 * cold request of any dashboard route.
 */
async function openPos(page: Page) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    await page.goto("/pos", { waitUntil: "domcontentloaded" });
    const heading = page.getByRole("heading", { name: "Касс" });
    const errorHeading = page.getByRole("heading", { name: "Алдаа гарлаа" });
    const [ok, errored] = await Promise.all([
      heading.isVisible().catch(() => false),
      errorHeading.isVisible().catch(() => false),
    ]);
    if (ok) return;
    if (errored) continue;
    await expect(heading).toBeVisible({ timeout: 45_000 });
    return;
  }
  throw new Error("POS page did not render after 2 attempts");
}

/** Access token JWT from the supabase session cookie. */
async function accessToken(page: Page): Promise<string | null> {
  const cookies = await page.context().cookies();
  const sb = cookies.find((c) => c.name.startsWith("sb-"));
  if (!sb) return null;
  try {
    // @supabase/ssr stores the session as base64(JSON) with either an
    // [access, refresh] array or an { access_token } object depending on
    // the version.
    const raw = sb.value.startsWith("base64-")
      ? Buffer.from(sb.value.slice("base64-".length), "base64").toString()
      : sb.value;
    const parsed = JSON.parse(decodeURIComponent(raw));
    return Array.isArray(parsed) ? parsed[0] : (parsed.access_token ?? null);
  } catch {
    return null;
  }
}

/** Org id of the logged-in user (via the session JWT sub). */
async function orgId(page: Page): Promise<string | null> {
  const token = await accessToken(page);
  if (!token) return null;
  const sub = JSON.parse(
    Buffer.from(token.split(".")[1], "base64url").toString(),
  ).sub as string | undefined;
  if (!sub) return null;
  const res = await fetch(
    `${API_URL}/rest/v1/profiles?select=organization_id&id=eq.${sub}&limit=1`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    },
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{ organization_id: string | null }>;
  return rows[0]?.organization_id ?? null;
}

async function insertRow(
  table: string,
  body: Record<string, unknown>,
): Promise<string | null> {
  const res = await fetch(`${API_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{ id: string }>;
  return rows[0]?.id ?? null;
}

test("barcode wedge scan adds the product", async ({ page }) => {
  await openPos(page);

  // Seed a scannable product in the register's org.
  const organizationId = await orgId(page);
  test.skip(!organizationId, "cannot resolve the org of the E2E user");
  const ts = Date.now();
  const barcode = `8801${String(ts).slice(-10)}`;
  const productId = await insertRow("products", {
    organization_id: organizationId,
    name: `E2E Barcode ${ts}`,
    barcode,
    sku: `E2E-BAR-${ts}`,
    unit: "ш",
    sale_price: 1500,
    current_stock: 7,
    has_variants: false,
  });
  if (!productId) {
    test.skip(true, "could not seed a barcode product");
    return;
  }
  createdProductIds.push(productId);
  const productName = `E2E Barcode ${ts}`;

  // Reload the register so the seeded product is in the catalog, then scan
  // with the keyboard wedge (characters + Enter, focus outside inputs).
  await openPos(page);
  await page.getByRole("heading", { name: "Касс" }).click();
  await page.keyboard.type(barcode);
  await page.keyboard.press("Enter");

  await expect(page.getByText(productName).first()).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByRole("button", { name: "Төлбөр авах" })).toBeEnabled();
});

test("variant product sells through the real VariantPicker", async ({
  page,
}) => {
  await openPos(page);

  const organizationId = await orgId(page);
  test.skip(!organizationId, "cannot resolve the org of the E2E user");
  const ts = Date.now();
  const productName = `E2E Variant ${ts}`;

  // Seed: product → variant group → option → variant → assignment.
  const productId = await insertRow("products", {
    organization_id: organizationId,
    name: productName,
    sku: `E2E-VAR-${ts}`,
    unit: "ш",
    sale_price: 2500,
    current_stock: 5,
    has_variants: true,
  });
  if (!productId) {
    test.skip(true, "could not seed a variant product");
    return;
  }
  createdProductIds.push(productId);

  const groupId = await insertRow("product_variant_groups", {
    product_id: productId,
    name: "Хэмжээ",
  });
  const optionId = groupId
    ? await insertRow("product_variant_options", {
        group_id: groupId,
        value: "S",
      })
    : null;
  const variantId = await insertRow("product_variants", {
    product_id: productId,
    sku: `E2E-VAR-${ts}-S`,
    sale_price: 2500,
    current_stock: 5,
    is_active: true,
  });
  if (optionId && variantId) {
    await insertRow("product_variant_assignments", {
      variant_id: variantId,
      option_id: optionId,
    });
  }
  test.skip(!(groupId && optionId && variantId), "variant seed incomplete");

  // Open the variant dialog from the catalog tile.
  await openPos(page);
  await page.getByRole("button", { name: new RegExp(productName) }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 10_000 });

  // Click the option chip; a full selection auto-adds the variant.
  // The chip's accessible name includes the stock ("S 5 ш").
  await dialog.getByRole("button", { name: /S/ }).first().click();

  // The variant line lands in the cart (label + variant price).
  await expect(page.getByText(productName).first()).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText("₮ 2,500").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Төлбөр авах" })).toBeEnabled();
});

test("layout: no overflow, cart column right on desktop", async ({ page }) => {
  await openPos(page);

  // Products stream in after the PPR skeleton — wait for a real tile.
  const tile = page.getByRole("button", { name: /Нөөц:/ }).first();
  await tile.waitFor({ state: "visible", timeout: 20_000 });

  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const search = document.querySelector(
      'input[aria-label="Бүтээгдэхүүн хайх"]',
    );
    const charge = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Төлбөр авах"),
    );
    const gridTiles = Array.from(document.querySelectorAll("button")).filter(
      (b) => b.className.includes("group") && /₮/.test(b.textContent ?? ""),
    );
    return {
      overflow: doc.scrollWidth - doc.clientWidth,
      searchX: search?.getBoundingClientRect().x ?? 0,
      chargeX: charge?.getBoundingClientRect().x ?? 0,
      tileCount: gridTiles.length,
      tileXPositions: gridTiles
        .slice(0, 6)
        .map((t) => Math.round(t.getBoundingClientRect().x)),
    };
  });

  expect(metrics.overflow).toBeLessThanOrEqual(1);
  expect(metrics.tileCount).toBeGreaterThan(0);
  // Cart (charge button) sits right of the search/grid column on desktop.
  expect(metrics.chargeX).toBeGreaterThan(metrics.searchX);
  // Grid has more than one column (distinct tile x positions).
  expect(new Set(metrics.tileXPositions).size).toBeGreaterThan(1);
});

test("layout: cart stacks below the grid on mobile, no overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPos(page);

  const tile = page.getByRole("button", { name: /Нөөц:/ }).first();
  await tile.waitFor({ state: "visible", timeout: 20_000 });

  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const search = document.querySelector(
      'input[aria-label="Бүтээгдэхүүн хайх"]',
    );
    const charge = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Төлбөр авах"),
    );
    return {
      overflow: doc.scrollWidth - doc.clientWidth,
      searchY: search?.getBoundingClientRect().y ?? 0,
      chargeY: charge?.getBoundingClientRect().y ?? 0,
    };
  });

  expect(metrics.overflow).toBeLessThanOrEqual(1);
  // Cart (charge button) is below the search bar on mobile.
  expect(metrics.chargeY).toBeGreaterThan(metrics.searchY);
});
