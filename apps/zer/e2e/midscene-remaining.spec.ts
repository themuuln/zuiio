import type { SupabaseClient } from "@supabase/supabase-js";
import { expect, test } from "./fixture";

const hasModelConfig = !!(
  process.env.MIDSCENE_MODEL_NAME || process.env.MIDSCENE_MODEL_API_KEY
);

const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

async function getAdmin() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function getOrgSlug(supabase: SupabaseClient) {
  const { data: org } = await supabase
    .from("organizations")
    .select("slug")
    .limit(1)
    .single();
  return org?.slug as string | null;
}

async function getFirstProduct(
  supabase: SupabaseClient,
  orgId?: string,
): Promise<{ id: string; name: string; sale_price: number | null } | null> {
  let query = supabase
    .from("products")
    .select("id, name, sale_price")
    .is("deleted_at", null)
    .order("name", { ascending: true })
    .limit(1);
  if (orgId) {
    query = query.eq("organization_id", orgId);
  }
  const { data } = await query;
  return (data?.[0] ?? null) as {
    id: string;
    name: string;
    sale_price: number | null;
  } | null;
}

async function getOrgId(supabase: SupabaseClient) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .maybeSingle();
  return (
    (profile as { organization_id: string } | null)?.organization_id ?? null
  );
}

// ─── LANDING PAGE ───────────────────────────────────────────────

test.describe("Landing page", () => {
  test("landing page renders all sections", async ({ page, aiAssert }) => {
    test.skip(
      !hasModelConfig,
      "Set MIDSCENE_MODEL_NAME env var to run AI tests",
    );
    await page.goto("/landing", { waitUntil: "domcontentloaded" });

    await aiAssert("The page has a hero section with a large heading or title");
    await aiAssert(
      "There is a features or benefits section with multiple cards or items",
    );
    await aiAssert("There is a pricing section that shows different plans");
    await aiAssert("There is an FAQ or questions section");
    await aiAssert("There is a call-to-action section with a button");
  });
});

// ─── ONBOARDING WIZARD ──────────────────────────────────────────

test.describe("Onboarding wizard", () => {
  test("onboarding wizard shows when org has onboarding_completed=false", async ({
    page,
    aiAssert,
  }) => {
    test.skip(
      !hasModelConfig,
      "Set MIDSCENE_MODEL_NAME env var to run AI tests",
    );
    test.skip(!hasServiceKey, "Set SUPABASE_SERVICE_ROLE_KEY env var");

    const supabase = await getAdmin();

    // Get the test user's org
    const orgId = await getOrgId(supabase);
    test.skip(!orgId, "No organization found for test user");

    // Save current state and set onboarding_completed=false
    const { data: org } = await supabase
      .from("organizations")
      .select("onboarding_completed")
      .eq("id", orgId)
      .single();

    const wasCompleted =
      (org as { onboarding_completed: boolean } | null)?.onboarding_completed ??
      false;
    if (!wasCompleted) {
      // Already not completed — skip to avoid messing up state
      test.skip(true, "Onboarding is already incomplete");
    }

    await supabase
      .from("organizations")
      .update({ onboarding_completed: false })
      .eq("id", orgId);

    await page.goto("/onboarding", { waitUntil: "domcontentloaded" });

    // Midscene should see the wizard UI
    await aiAssert(
      "The onboarding wizard or setup page is visible with options to configure the store",
    );

    // Revert
    await supabase
      .from("organizations")
      .update({ onboarding_completed: wasCompleted })
      .eq("id", orgId);
  });
});

// ─── PUBLIC SHOP PRODUCTS ───────────────────────────────────────

test.describe("Public shop products", () => {
  test("public products page shows product catalog", async ({
    page,
    aiAssert,
  }) => {
    test.skip(
      !hasModelConfig,
      "Set MIDSCENE_MODEL_NAME env var to run AI tests",
    );
    test.skip(!hasServiceKey, "Set SUPABASE_SERVICE_ROLE_KEY env var");

    const supabase = await getAdmin();
    const slug = await getOrgSlug(supabase);
    test.skip(!slug, "No organization slug found");

    await page.goto(`/${slug}/products`, { waitUntil: "domcontentloaded" });

    await aiAssert("The page shows a list or grid of products with names");
    await aiAssert("The organization name or header is visible");
  });

  test("public product detail page shows product info", async ({
    page,
    aiAssert,
  }) => {
    test.skip(
      !hasModelConfig,
      "Set MIDSCENE_MODEL_NAME env var to run AI tests",
    );
    test.skip(!hasServiceKey, "Set SUPABASE_SERVICE_ROLE_KEY env var");

    const supabase = await getAdmin();
    const slug = await getOrgSlug(supabase);
    test.skip(!slug, "No organization slug found");

    const product = await getFirstProduct(supabase);
    test.skip(!product, "No products found");

    await page.goto(`/${slug}/products/${product!.id}`, {
      waitUntil: "domcontentloaded",
    });

    await aiAssert(
      `The page shows a product detail view for "${product!.name}"`,
    );

    await aiAssert("The price and stock information are displayed");
  });
});

// ─── AUTH PAGES: PASSWORD RESET ─────────────────────────────────

test.describe("Reset password page", () => {
  test("reset-password page renders the password form", async ({ page }) => {
    await page.goto("/reset-password", { waitUntil: "domcontentloaded" });

    // The page should show the password reset form regardless of auth state
    await expect(page.getByText("Шинэ нууц үг").first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("#password")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#confirm_password")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Нууц үг шинэчлэх")).toBeVisible({
      timeout: 5000,
    });
  });

  test("update-password page loads and shows expected content", async ({
    page,
  }) => {
    await page.goto("/update-password", { waitUntil: "domcontentloaded" });

    // Wait for the session check to complete
    await page.waitForTimeout(5000);

    // The page shows one of three states:
    // 1. Password form (Шинэ нууц үг) — when authenticated
    // 2. Invalid link (Хүчингүй холбоос) — when logged out without token
    // 3. Loading (Түр хүлээнэ үү) — while checking session
    const formVisible = await page
      .getByText("Шинэ нууц үг")
      .first()
      .isVisible()
      .catch(() => false);
    const invalidVisible = await page
      .getByText("Хүчингүй холбоос")
      .first()
      .isVisible()
      .catch(() => false);
    const loadingVisible = await page
      .getByText("Түр хүлээнэ үү")
      .first()
      .isVisible()
      .catch(() => false);

    // At least one state should be visible
    expect(formVisible || invalidVisible || loadingVisible).toBeTruthy();

    if (formVisible) {
      // Authenticated: form fields should be present
      await expect(page.locator("#password")).toBeVisible({ timeout: 5000 });
      await expect(page.locator("#confirm_password")).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("update-password form shows with valid recovery token", async ({
    page,
  }) => {
    test.skip(!hasServiceKey, "Set SUPABASE_SERVICE_ROLE_KEY env var");

    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get the test user's email
    const email = process.env.E2E_EMAIL ?? "themuuln1@gmail.com";

    // Generate a recovery link via Supabase admin API
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
    });

    test.skip(
      !!error || !data?.properties?.action_link,
      `Could not generate recovery link: ${error?.message ?? "unknown"}`,
    );

    // Extract the token from the action_link
    const actionLink = data?.properties?.action_link;
    if (!actionLink) {
      test.skip(true, "Could not extract action_link from recovery link");
      return;
    }
    const url = new URL(actionLink);
    const hash = url.hash.slice(1); // remove leading #
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");

    test.skip(
      !accessToken,
      "Could not extract access_token from recovery link",
    );

    // Navigate to update-password with the recovery token in hash
    await page.goto(
      `/update-password#access_token=${accessToken}&type=recovery&refresh_token=${params.get("refresh_token") ?? ""}`,
      { waitUntil: "domcontentloaded" },
    );

    // The page should now show the password form (not the invalid link state)
    await expect(page.getByText("Шинэ нууц үг").first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator("#password")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#confirm_password")).toBeVisible({
      timeout: 5000,
    });
  });
});
