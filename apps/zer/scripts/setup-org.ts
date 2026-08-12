/**
 * One-command org provisioning: org → branch → warehouse → chart of accounts
 * → roles/permissions → categories → brands → products → storefront profile.
 *
 * Usage:
 *   pnpm tsx scripts/setup-org.ts <name>
 *
 * `<name>` selects `scripts/org-data/<name>.ts` (default export `OrgSetup`).
 * Idempotent: every step upserts by its unique key, so re-running refreshes
 * names/prices instead of duplicating rows. This complements the in-app
 * onboarding flow (`create_organization` RPC) for bulk data setup.
 *
 * Requires `.env.local` with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import type { OrgSetup } from "./org-data/types";

// ── Env ───────────────────────────────────────────────────────
const envPath = resolve(import.meta.dirname, "../.env.local");
for (const line of readFileSync(envPath, "utf-8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  process.env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── Permission baseline ───────────────────────────────────────
// Canonical labels of `public.app_permission` (fetched from the live DB,
// 2026-08-10). Keep in sync with `create_organization()` in
// supabase/migrations/20260801123000_fix_chart_seed_and_org_creation.sql.
const APP_PERMISSIONS = [
  "products.create",
  "products.read",
  "products.update",
  "products.delete",
  "categories.create",
  "categories.read",
  "categories.update",
  "categories.delete",
  "brands.create",
  "brands.read",
  "brands.update",
  "brands.delete",
  "contacts.create",
  "contacts.read",
  "contacts.update",
  "contacts.delete",
  "sales.create",
  "sales.read",
  "sales.update",
  "sales.delete",
  "expenses.create",
  "expenses.read",
  "expenses.update",
  "expenses.delete",
  "invoices.create",
  "invoices.read",
  "invoices.update",
  "invoices.delete",
  "warehouses.create",
  "warehouses.read",
  "warehouses.update",
  "warehouses.delete",
  "stock_movements.create",
  "stock_movements.read",
  "stock_movements.update",
  "stock_movements.delete",
  "uom_conversions.create",
  "uom_conversions.read",
  "uom_conversions.update",
  "uom_conversions.delete",
  "members.read",
  "members.invite",
  "members.remove",
  "members.manage_role",
  "roles.manage",
  "settings.manage",
  "reports.manage",
  "notifications.manage",
  "audit_log.read",
  "purchases.create",
  "purchases.read",
  "purchases.update",
  "purchases.delete",
  "quotations.create",
  "quotations.read",
  "quotations.update",
  "quotations.delete",
  "returns.create",
  "returns.read",
  "returns.update",
  "returns.delete",
  "accounting.manage",
  "discounts.create",
  "discounts.read",
  "discounts.update",
  "discounts.delete",
  "emails.manage",
  "boms.create",
  "boms.read",
  "boms.update",
  "boms.delete",
  "production_orders.create",
  "production_orders.read",
  "production_orders.update",
  "production_orders.delete",
  "production_costs.read",
  "quality_checks.create",
  "quality_checks.read",
  "coupons.create",
  "coupons.read",
  "coupons.update",
  "coupons.delete",
  "gift_cards.create",
  "gift_cards.read",
  "gift_cards.update",
  "gift_cards.delete",
  "promotions.create",
  "promotions.read",
  "promotions.update",
  "promotions.delete",
  "reviews.create",
  "reviews.read",
  "reviews.update",
  "reviews.delete",
  "blog.create",
  "blog.read",
  "blog.update",
  "blog.delete",
  "webhooks.create",
  "webhooks.read",
  "webhooks.update",
  "webhooks.delete",
] as const;

const STAFF_PERMISSIONS = [
  "products.read",
  "categories.read",
  "brands.read",
  "contacts.read",
  "contacts.create",
  "sales.create",
  "sales.read",
  "sales.update",
  "expenses.create",
  "expenses.read",
  "invoices.create",
  "invoices.read",
  "warehouses.read",
  "stock_movements.read",
  "uom_conversions.read",
  "members.read",
  "reports.manage",
  "notifications.manage",
  "audit_log.read",
] as const;

/** Boolean org columns that may appear in `OrgSetup.org.flags`. */
const ORG_FLAG_COLUMNS = [
  "report_email_enabled",
  "onboarding_completed",
  "has_suppliers",
  "has_inventory",
  "has_customer_credit",
  "has_multi_branch",
  "has_variants",
  "has_uom",
  "has_brands",
  "has_categories",
  "has_email_reports",
  "has_audit_log",
  "has_checkout_customer",
  "has_checkout_quick_amounts",
  "has_receipt_drawer",
  "has_buddhist_presets",
  "has_track_stock",
  "has_delivery_tracking",
  "has_coupons",
  "has_gift_cards",
  "has_promotions",
] as const;

// ── Helpers ───────────────────────────────────────────────────
function fail(message: string): never {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

// ── Provisioning steps ────────────────────────────────────────
async function ensureOrg(data: OrgSetup): Promise<string> {
  const flags: Record<string, boolean> = {};
  for (const key of ORG_FLAG_COLUMNS) {
    const value = data.org.flags?.[key];
    if (typeof value === "boolean") flags[key] = value;
  }
  const row = {
    name: data.org.name,
    slug: data.org.slug,
    currency: data.org.currency ?? "MNT",
    company_type: data.org.company_type ?? "retail",
    onboarding_completed: data.org.onboarding_completed ?? true,
    ...flags,
  };
  const { data: upserted, error } = await supabase
    .from("organizations")
    .upsert(row, { onConflict: "slug" })
    .select("id")
    .single();
  if (error) fail(`org upsert failed: ${error.message}`);
  console.log(`✔ org: ${data.org.name} (${data.org.slug}) — ${upserted.id}`);
  return upserted.id;
}

async function ensureBranch(orgId: string, data: OrgSetup): Promise<string> {
  const existing = await supabase
    .from("branches")
    .select("id")
    .eq("organization_id", orgId)
    .eq("slug", data.branch.slug)
    .maybeSingle();
  if (existing.error) fail(`branch lookup failed: ${existing.error.message}`);

  let id = existing.data?.id ?? null;
  if (!id) {
    const { data: inserted, error } = await supabase
      .from("branches")
      .insert({
        organization_id: orgId,
        name: data.branch.name,
        slug: data.branch.slug,
        address: data.branch.address ?? null,
        phone: data.branch.phone ?? null,
        email: data.branch.email ?? null,
        is_default: true,
      })
      .select("id")
      .single();
    if (error) fail(`branch insert failed: ${error.message}`);
    id = inserted.id;
  } else {
    const { error } = await supabase
      .from("branches")
      .update({
        name: data.branch.name,
        address: data.branch.address ?? null,
        phone: data.branch.phone ?? null,
        email: data.branch.email ?? null,
        is_default: true,
      })
      .eq("id", id);
    if (error) fail(`branch update failed: ${error.message}`);
  }
  console.log(`✔ branch: ${data.branch.name} — ${id}`);
  return id;
}

async function ensureWarehouse(
  orgId: string,
  branchId: string,
  branchName: string,
  branchAddress: string | null | undefined,
): Promise<void> {
  const existing = await supabase
    .from("warehouses")
    .select("id")
    .eq("organization_id", orgId)
    .eq("branch_id", branchId)
    .maybeSingle();
  if (existing.error)
    fail(`warehouse lookup failed: ${existing.error.message}`);
  if (existing.data) {
    console.log(`✔ warehouse exists — ${existing.data.id}`);
    return;
  }
  const { data: inserted, error } = await supabase
    .from("warehouses")
    .insert({
      organization_id: orgId,
      name: `${branchName} - Үндсэн агуулах`,
      location: branchAddress ?? null,
      is_default: true,
      branch_id: branchId,
    })
    .select("id")
    .single();
  if (error) fail(`warehouse insert failed: ${error.message}`);
  console.log(`✔ warehouse: ${inserted.id}`);
}

// Standard accounting baseline: group + child accounts per branch.
// Mirrors seed_default_chart_of_accounts() from
// supabase/migrations/20260801123000_fix_chart_seed_and_org_creation.sql.
const CHART_BASELINE: Array<{
  code: string;
  name: string;
  type: string;
  parent?: string;
}> = [
  { code: "1000", name: "Хөрөнгө", type: "asset" },
  { code: "1100", name: "Бэлэн мөнгө", type: "asset", parent: "1000" },
  { code: "1200", name: "Банкны данс", type: "asset", parent: "1000" },
  { code: "1300", name: "Авлага", type: "asset", parent: "1000" },
  { code: "1400", name: "Бараа материал", type: "asset", parent: "1000" },
  { code: "2000", name: "Өр төлбөр", type: "liability" },
  { code: "2100", name: "Өглөг", type: "liability", parent: "2000" },
  { code: "2200", name: "Татвар", type: "liability", parent: "2000" },
  { code: "3000", name: "Өмч", type: "equity" },
  { code: "3100", name: "Анхны хөрөнгө", type: "equity", parent: "3000" },
  { code: "3200", name: "Хуримтлагдсан ашиг", type: "equity", parent: "3000" },
  { code: "4000", name: "Орлого", type: "income" },
  { code: "4100", name: "Борлуулалтын орлого", type: "income", parent: "4000" },
  { code: "4200", name: "Бусад орлого", type: "income", parent: "4000" },
  { code: "5000", name: "Зарлага", type: "expense" },
  {
    code: "5100",
    name: "Борлуулсан бүтээгдэхүүний өртөг",
    type: "expense",
    parent: "5000",
  },
  {
    code: "5200",
    name: "Үйл ажиллагааны зарлага",
    type: "expense",
    parent: "5000",
  },
  {
    code: "5300",
    name: "Тарифаас бусад зарлага",
    type: "expense",
    parent: "5000",
  },
];

async function ensureChartOfAccounts(
  orgId: string,
  branchId: string,
): Promise<void> {
  const { error } = await supabase.rpc("seed_default_chart_of_accounts", {
    p_organization_id: orgId,
  });
  if (!error) {
    console.log("✔ chart of accounts seeded (rpc)");
    return;
  }
  // Fallback: some environments run an older function without branch scoping.
  // Seed the baseline directly so the org is never left without accounts.
  const { data: rows, error: lookupError } = await supabase
    .from("chart_of_accounts")
    .select("code, id")
    .eq("organization_id", orgId)
    .eq("branch_id", branchId);
  if (lookupError)
    fail(`chart_of_accounts lookup failed: ${lookupError.message}`);
  const existing = new Map<string, string>(
    (rows ?? []).map((r) => [r.code, r.id]),
  );

  let created = 0;
  for (const account of CHART_BASELINE) {
    const parentId = account.parent
      ? (existing.get(account.parent) ?? null)
      : null;
    if (existing.has(account.code)) {
      const { error: updateError } = await supabase
        .from("chart_of_accounts")
        .update({
          name: account.name,
          type: account.type,
          parent_id: parentId,
          is_active: true,
        })
        .eq("id", existing.get(account.code)!);
      if (updateError)
        fail(`chart_of_accounts update failed: ${updateError.message}`);
      continue;
    }
    const { data: inserted, error: insertError } = await supabase
      .from("chart_of_accounts")
      .insert({
        organization_id: orgId,
        branch_id: branchId,
        code: account.code,
        name: account.name,
        type: account.type,
        parent_id: parentId,
        is_active: true,
      })
      .select("id")
      .single();
    if (insertError)
      fail(`chart_of_accounts insert failed: ${insertError.message}`);
    existing.set(account.code, inserted.id);
    created++;
  }
  console.log(`✔ chart of accounts seeded (fallback): ${created} created`);
}

const ROLE_DEFS = [
  {
    name: "owner",
    description: "Байгууллагын эзэмшигч - бүх эрхтэй",
    level: 0,
  },
  { name: "admin", description: "Админ - ихэнх эрхтэй", level: 1 },
  { name: "staff", description: "Ажилтан - үндсэн эрхтэй", level: 2 },
] as const;

async function ensureRoles(orgId: string): Promise<void> {
  for (const def of ROLE_DEFS) {
    const existing = await supabase
      .from("roles")
      .select("id")
      .eq("organization_id", orgId)
      .eq("name", def.name)
      .maybeSingle();
    if (existing.error) fail(`role lookup failed: ${existing.error.message}`);

    let roleId = existing.data?.id ?? null;
    if (!roleId) {
      const { data: inserted, error } = await supabase
        .from("roles")
        .insert({
          organization_id: orgId,
          name: def.name,
          description: def.description,
          hierarchy_level: def.level,
          is_system_role: true,
        })
        .select("id")
        .single();
      if (error) fail(`role insert failed: ${error.message}`);
      roleId = inserted.id;
    }

    const desired = new Set<string>(
      def.name === "owner"
        ? APP_PERMISSIONS
        : def.name === "admin"
          ? APP_PERMISSIONS.filter((p) => p !== "roles.manage")
          : STAFF_PERMISSIONS,
    );
    const { data: existingPerms, error: permError } = await supabase
      .from("role_permissions")
      .select("permission")
      .eq("role_id", roleId);
    if (permError) fail(`role_permissions lookup failed: ${permError.message}`);
    for (const row of existingPerms ?? []) desired.delete(row.permission);

    if (desired.size > 0) {
      const { error } = await supabase
        .from("role_permissions")
        .insert(
          [...desired].map((permission) => ({ role_id: roleId, permission })),
        );
      if (error) fail(`role_permissions insert failed: ${error.message}`);
    }
    console.log(
      `✔ role: ${def.name} (${roleId}) — +${desired.size} permissions`,
    );
  }
}

async function ensureCategories(
  orgId: string,
  data: OrgSetup,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const { data: existing, error } = await supabase
    .from("categories")
    .select("id, slug")
    .eq("organization_id", orgId);
  if (error) fail(`categories lookup failed: ${error.message}`);
  for (const row of existing ?? []) map.set(row.slug, row.id);

  let created = 0;
  for (const cat of data.categories) {
    if (map.has(cat.slug)) continue;
    const { data: inserted, error: insertError } = await supabase
      .from("categories")
      .insert({ organization_id: orgId, name: cat.name, slug: cat.slug })
      .select("id")
      .single();
    if (insertError) fail(`category insert failed: ${insertError.message}`);
    map.set(cat.slug, inserted.id);
    created++;
  }
  console.log(`✔ categories: ${data.categories.length} (${created} created)`);
  return map;
}

async function ensureBrands(
  orgId: string,
  data: OrgSetup,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const { data: existing, error } = await supabase
    .from("brands")
    .select("id, name")
    .eq("organization_id", orgId);
  if (error) fail(`brands lookup failed: ${error.message}`);
  for (const row of existing ?? []) map.set(row.name, row.id);

  let created = 0;
  for (const brand of data.brands) {
    if (map.has(brand.name)) continue;
    const { data: inserted, error: insertError } = await supabase
      .from("brands")
      .insert({ organization_id: orgId, name: brand.name })
      .select("id")
      .single();
    if (insertError) fail(`brand insert failed: ${insertError.message}`);
    map.set(brand.name, inserted.id);
    created++;
  }
  console.log(`✔ brands: ${data.brands.length} (${created} created)`);
  return map;
}

async function ensureProducts(
  orgId: string,
  data: OrgSetup,
  categories: Map<string, string>,
  brands: Map<string, string>,
): Promise<void> {
  const { data: existing, error } = await supabase
    .from("products")
    .select("id, name")
    .eq("organization_id", orgId);
  if (error) fail(`products lookup failed: ${error.message}`);
  const byName = new Map<string, string>(
    (existing ?? []).map((p) => [p.name, p.id]),
  );

  let created = 0;
  let updated = 0;
  for (const product of data.products) {
    const categoryId = product.category
      ? (categories.get(product.category) ?? null)
      : null;
    const brandId = product.brand ? (brands.get(product.brand) ?? null) : null;
    const row = {
      organization_id: orgId,
      name: product.name,
      sku: product.sku ?? null,
      barcode: product.barcode ?? null,
      unit: product.unit ?? "ширхэг",
      category_id: categoryId,
      brand_id: brandId,
      sale_price: product.sale_price ?? 0,
      cost_price: product.cost_price ?? 0,
      current_stock: product.current_stock ?? 0,
      min_stock: product.min_stock ?? 0,
      description: product.description ?? null,
      additional_info: product.source_url ?? null,
      is_public: product.is_public ?? false,
      published_at: product.is_public ? new Date().toISOString() : null,
    };
    const existingId = byName.get(product.name);
    if (existingId) {
      const { error: updateError } = await supabase
        .from("products")
        .update(row)
        .eq("id", existingId);
      if (updateError) fail(`product update failed: ${updateError.message}`);
      updated++;
    } else {
      const { error: insertError } = await supabase
        .from("products")
        .insert(row);
      if (insertError) fail(`product insert failed: ${insertError.message}`);
      created++;
    }
  }
  console.log(
    `✔ products: ${data.products.length} (${created} created, ${updated} updated)`,
  );
}

async function ensurePublicProfile(
  orgId: string,
  data: OrgSetup,
): Promise<void> {
  const profile = data.publicProfile;
  if (!profile) return;
  const { error } = await supabase.from("organization_public_profiles").upsert(
    {
      organization_id: orgId,
      catalog_enabled: profile.catalog_enabled ?? true,
      display_name: profile.display_name ?? data.org.name,
      description: profile.description ?? null,
      contact_email: profile.contact_email ?? null,
      contact_phone: profile.contact_phone ?? null,
      address: profile.address ?? null,
      website_url: profile.website_url ?? null,
      logo_url: profile.logo_url ?? null,
      business_hours: profile.business_hours
        ? (profile.business_hours as Record<string, string>)
        : null,
    },
    { onConflict: "organization_id" },
  );
  if (error) fail(`public profile upsert failed: ${error.message}`);
  console.log("✔ storefront profile upserted");
}

async function ensureUsers(
  orgId: string,
  branchId: string,
  data: OrgSetup,
): Promise<void> {
  const users = data.users;
  if (!users?.length) return;

  const { data: roles, error: rolesError } = await supabase
    .from("roles")
    .select("id, name")
    .eq("organization_id", orgId);
  if (rolesError) fail(`roles lookup failed: ${rolesError.message}`);
  const roleByKey = new Map<string, string>(
    (roles ?? []).map((r) => [r.name, r.id]),
  );

  const { data: authUsers, error: listError } =
    await supabase.auth.admin.listUsers();
  if (listError) fail(`auth user list failed: ${listError.message}`);
  const existingByEmail = new Map<string, string>(
    (authUsers?.users ?? []).map((u) => [u.email ?? "", u.id]),
  );

  let created = 0;
  for (const user of users) {
    const email = user.email.trim().toLowerCase();
    const roleId = roleByKey.get(user.role);
    if (!roleId) fail(`role '${user.role}' not found for org`);

    let userId = existingByEmail.get(email) ?? null;
    if (!userId) {
      // Passwords must NOT be committed in org-data files. Provide them via
      // the SETUP_ORG_USER_PASSWORD env var (or the per-user field for
      // ad-hoc data files that are never committed).
      const password = user.password ?? process.env.SETUP_ORG_USER_PASSWORD;
      if (!password) {
        fail(
          `user ${email}: password required — set user.password or the SETUP_ORG_USER_PASSWORD env var`,
        );
      }
      const { data: createdUser, error: createError } =
        await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
      if (createError)
        fail(`auth user create failed for ${email}: ${createError.message}`);
      userId = createdUser?.user?.id ?? null;
      if (!userId) fail(`auth user create returned no id for ${email}`);
      created++;
    }

    // Link (or update) the profile membership for this org.
    const profileRow = {
      organization_id: orgId,
      role: user.role,
      role_id: roleId,
      branch_id: branchId,
      full_name: user.full_name ?? null,
    };
    const { data: profile, error: profileLookup } = await supabase
      .from("profiles")
      .select("id, organization_id")
      .eq("id", userId)
      .maybeSingle();
    if (profileLookup) fail(`profile lookup failed: ${profileLookup.message}`);
    const { error: profileError } = profile
      ? await supabase.from("profiles").update(profileRow).eq("id", userId)
      : await supabase.from("profiles").insert({ id: userId, ...profileRow });
    if (profileError)
      fail(`profile wiring failed for ${email}: ${profileError.message}`);
    console.log(
      `✔ user: ${email} (${user.role})${profile ? " — updated" : ""}`,
    );
  }
  if (created === 0) {
    console.log(`✔ users: ${users.length} (all existed, profiles refreshed)`);
  } else {
    console.log(`✔ users: ${users.length} (${created} created)`);
  }
}

// ── Main ──────────────────────────────────────────────────────
async function main(): Promise<void> {
  const name = process.argv[2];
  if (!name) {
    console.error(
      "Usage: pnpm tsx scripts/setup-org.ts <name>  (scripts/org-data/<name>.ts)",
    );
    process.exit(1);
  }
  // The data module is selected by argv at runtime (scripts/org-data/<name>.ts),
  // so it cannot be a static import.
  const data = (await import(
    pathToFileURL(resolve(import.meta.dirname, `org-data/${name}.ts`)).href
  ).then((mod) => mod.default)) as OrgSetup;

  console.log(`\nProvisioning org data: ${data.org.name}\n`);
  const orgId = await ensureOrg(data);
  const branchId = await ensureBranch(orgId, data);
  await ensureWarehouse(orgId, branchId, data.branch.name, data.branch.address);
  await ensureChartOfAccounts(orgId, branchId);
  await ensureRoles(orgId);
  const categories = await ensureCategories(orgId, data);
  const brands = await ensureBrands(orgId, data);
  await ensureProducts(orgId, data, categories, brands);
  await ensurePublicProfile(orgId, data);
  await ensureUsers(orgId, branchId, data);
  console.log("\nDone. Org ready for use in the app.\n");
}

main().catch((error: unknown) => {
  fail(error instanceof Error ? error.message : String(error));
});
