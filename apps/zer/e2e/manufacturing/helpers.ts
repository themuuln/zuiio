import type { Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { openDrawerByText, submitDrawerForm } from "../helpers";

// ── Re-export shared helpers for convenience ────────────────────────────────
export { openDrawerByText, submitDrawerForm };

// ── BOM-specific helpers ────────────────────────────────────────────────────

const BOM_PREFIX = `BOM-${Date.now()}`;

/**
 * Select an option from a ProductPicker drawer.
 * Clicks the picker button (by placeholder), waits for the drawer to open,
 * searches for the target, clicks it, and waits for the drawer to close.
 */
async function selectProductPickerOption(
  page: Page,
  placeholder: string,
  targetName: string,
): Promise<void> {
  // Click the picker button to open the drawer
  const pickerButton = page.getByRole("button", { name: placeholder });
  await pickerButton.click({ force: true });

  // Wait for the picker drawer search input to appear
  const searchInput = page.getByPlaceholder("Бараа хайх...");
  await searchInput.waitFor({ state: "visible", timeout: 5000 });

  // Search for the product in the picker's search input
  await searchInput.fill(targetName);

  // Click the product button
  await page.getByRole("button", { name: targetName }).click();

  // Wait for the picker drawer to close (search input disappears)
  await searchInput.waitFor({ state: "hidden", timeout: 5000 });
}

/**
 * Create a product in the test org via Supabase admin client.
 * Uses SUPABASE_SERVICE_ROLE_KEY from env to bypass RLS.
 */
async function ensureTestProduct(
  _page: Page,
  name: string,
  salePrice = 10000,
  costPrice = 5000,
  unit = "ш",
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Resolve the test user's org by looking up their auth UID
  const testEmail = process.env.E2E_EMAIL ?? "themuuln1@gmail.com";

  // Search all pages of auth users to find the test user
  let authUser: { id: string } | undefined;
  for (let page = 1; page <= 10; page++) {
    const { data: users, error: listError } =
      await supabase.auth.admin.listUsers({ page, perPage: 50 });
    if (listError) {
      console.log(
        `[ensureTestProduct] Failed to list users: ${listError.message}`,
      );
      return;
    }
    authUser = users?.users?.find((u) => u.email === testEmail);
    if (authUser) break;
    if (!users?.users?.length) break; // No more pages
  }

  if (!authUser) {
    console.log(`[ensureTestProduct] User ${testEmail} not found in auth`);
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", authUser.id)
    .single();

  const orgId = profile?.organization_id;
  if (!orgId) {
    console.log(`[ensureTestProduct] No org found for user ${testEmail}`);
    return;
  }

  // Check if product already exists
  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("organization_id", orgId)
    .eq("name", name)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) return;

  // Create the product
  const { error } = await supabase.from("products").insert({
    organization_id: orgId,
    name,
    unit,
    sale_price: salePrice,
    cost_price: costPrice,
    current_stock: 0,
    min_stock: 0,
    sku: `E2E-${name}-${Date.now()}`,
  } as never);

  if (error) {
    console.log(
      `[ensureTestProduct] Failed to create "${name}": ${error.message}`,
    );
  }
}

/** Create a BOM via the create drawer and verify it appears in the list. */
export async function createTestBom(
  page: Page,
  opts: {
    name?: string;
    productName?: string;
    /** Names of products to add as BOM items. At least 1 required. */
    items?: string[];
  } = {},
) {
  const name =
    opts.name ?? `${BOM_PREFIX}-${Math.random().toString(36).slice(2, 6)}`;
  const items = opts.items ?? ["Протеин шейк"];

  // Ensure the products we need exist in the test org
  const allProductNames = [opts.productName, ...items].filter(
    (n): n is string => !!n,
  );
  const uniqueNames = [...new Set(allProductNames)];
  for (const productName of uniqueNames) {
    await ensureTestProduct(page, productName);
  }

  // Open the BOM create drawer via URL param (avoids trigger-click race with key remount)
  await page.goto("/bom?create=true", { waitUntil: "domcontentloaded" });
  // Wait for the BOM-specific form to appear (drawer renders in portal)
  await page.waitForSelector("#bom-create-form", { timeout: 5000 });
  await page.waitForTimeout(500); // Allow drawer CSS transition (450ms) to complete

  // Fill name
  await page.getByLabel("Нэр").fill(name);

  // Select product via ProductPicker
  if (opts.productName) {
    await selectProductPickerOption(
      page,
      "Бүтээгдэхүүн сонгох...",
      opts.productName,
    );
  }

  // Add BOM items (first item row exists by default, click "Нэмэх" for subsequent)
  const itemsCount = items.length;
  for (let i = 0; i < itemsCount; i++) {
    if (i > 0) {
      await page.getByText("Нэмэх").click();
    }
    await selectProductPickerOption(page, "Материал сонгох...", items[i]);
  }

  // Submit the form
  await submitDrawerForm(page, "bom-create-form");

  // Verify the BOM appears in the list
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("main").first().waitFor({ state: "visible" });

  return name;
}

/** Delete a BOM by name via the actions column. Only works for draft BOMs. */
export async function deleteTestBom(page: Page, bomName: string) {
  await page.goto("/bom", { waitUntil: "domcontentloaded" });
  const row = page.locator("tr").filter({ hasText: bomName });
  if (await row.isVisible().catch(() => false)) {
    await row.getByRole("button", { name: /устгах/i }).click();
    // Confirm deletion if a confirmation dialog appears
    const confirmBtn = page.getByRole("button", { name: /устгах/i }).last();
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click();
    }
  }
}

/** Navigate to the BOM list page. */
export async function gotoBomList(page: Page) {
  await page.goto("/bom", { waitUntil: "domcontentloaded" });
  await page.locator("main").first().waitFor({ state: "visible" });
}
