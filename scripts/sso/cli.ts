#!/usr/bin/env node
/**
 * SSO provisioning CLI.
 *
 * Usage:
 *   pnpm sso:plan                 # Dry-run: show what would change
 *   pnpm sso:plan --product zer   # Plan for a specific product
 *   pnpm sso:apply                # Apply changes
 *   pnpm sso:doctor               # Health-check all SSO configurations
 */

import { SSO_PRODUCTS, type ProductId } from "../../config/sso-products";
import { loadEnvironment } from "./environment";
import { IdentityAdminClient, ProductAdminClient, extractProjectRef } from "./supabase-admin";
import { buildProvisionPlan, applyProvisionPlan } from "./provision";

// ─── Parse CLI args ──────────────────────────────────────────────────

const args = process.argv.slice(2);
const command = args[0];
const productFilterArg = args.find((a) => a.startsWith("--product="));
const productFilter: ProductId[] | undefined = productFilterArg
  ? (productFilterArg.split("=")[1]?.split(",") as ProductId[])
  : undefined;

const isApply = command === "apply";
const isDoctor = command === "doctor";

// ─── Print header ────────────────────────────────────────────────────

function printHeader(title: string) {
  console.log(`\n🔧 Zuiio SSO — ${title}\n`);
}

// ─── Doctor command ──────────────────────────────────────────────────

async function doctor(
  identityClient: IdentityAdminClient,
  productClients: Map<string, ProductAdminClient>,
  products: ReturnType<typeof loadEnvironment>["products"],
) {
  printHeader("Health Check");

  // 1. Check identity project connectivity
  console.log("── Identity Project ──");
  const { clients, error: clientsErr } = await identityClient.listOAuthClients();
  if (clientsErr) {
    console.log(`  ❌ Cannot reach identity project: ${clientsErr}`);
    return;
  }
  console.log(`  ✓ Connected (${clients.length} OAuth clients)\n`);

  // 2. Check each product
  console.log("── SSO Products ──");

  let allHealthy = true;

  for (const product of products) {
    const ssoProduct = SSO_PRODUCTS.find((p) => p.id === product.id);
    if (!ssoProduct) continue;

    const status: string[] = [];
    let unhealthy = false;

    // Check env vars
    if (!product.supabaseUrl) {
      status.push("❌ No SUPABASE_URL configured");
      unhealthy = true;
    }
    if (!product.serviceRoleKey) {
      status.push("❌ No SERVICE_ROLE_KEY configured");
      unhealthy = true;
    }

    // Check OAuth client exists
    const client = clients.find((c) => c.client_name === product.displayName);
    if (client) {
      status.push(`✓ OAuth client ${client.client_id}`);
    } else {
      status.push("❌ No OAuth client found");
      unhealthy = true;
    }

    // Check product_catalog row
    const db = identityClient.getDbClient();
    const { data: catalogRow } = await db
      .from("product_catalog")
      .select("id, client_id")
      .eq("id", product.id)
      .maybeSingle();

    if (catalogRow) {
      status.push(`✓ Catalog row (client_id: ${catalogRow.client_id ?? "null"})`);
    } else {
      status.push("❌ No catalog row");
      unhealthy = true;
    }

    // Check product-side provider (if we have credentials)
    const prodClient = productClients.get(product.id);
    if (prodClient) {
      const { config, error } = await prodClient.getZuiioProvider();
      if (error) {
        status.push(`⚠ Cannot check provider: ${error}`);
      } else if (config) {
        status.push(`✓ custom:zuiio provider ${config.enabled ? "(enabled)" : "(disabled)"}`);
      } else {
        status.push("❌ custom:zuiio provider not found");
        unhealthy = true;
      }
    } else {
      status.push("⏭ Provider check skipped (no credentials)");
    }

    // Check mobile callback URIs (if product has them)
    if (prodClient && (ssoProduct?.mobileCallbackUrl || ssoProduct?.mobileStartUrl)) {
      const { uris, error: uriErr } = await prodClient.getUriAllowlist();
      if (uriErr) {
        status.push(`⚠ Cannot check URI allowlist: ${uriErr}`);
      } else {
        const expectedUris = [
          ssoProduct?.mobileCallbackUrl,
          ssoProduct?.mobileStartUrl,
        ].filter(Boolean) as string[];
        const missing = expectedUris.filter((uri) => !uris.includes(uri));
        if (missing.length === 0) {
          status.push(`✓ Mobile redirect URIs configured`);
        } else {
          status.push(`⚠ Missing redirect URIs: ${missing.join(", ")}`);
          status.push(`  → Configure in Supabase Dashboard > Auth > URL Configuration`);
          unhealthy = true;
        }
      }
    } else if (ssoProduct?.mobileCallbackUrl) {
      status.push(`⏭ Mobile redirect check skipped (no product Supabase credentials)`);
    }

    const icon = unhealthy ? "❌" : "✓";
    console.log(`  ${icon} ${product.displayName} (${product.id})`);
    for (const s of status) {
      console.log(`    ${s}`);
    }
    console.log();

    if (unhealthy) allHealthy = false;
  }

  console.log(`─── Summary ───`);
  console.log(allHealthy ? "  ✓ All SSO products healthy\n" : "  ❌ Some products need attention\n");
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const env = loadEnvironment(productFilter);

  // Build identity client
  const identityClient = new IdentityAdminClient(
    env.identity.supabaseUrl,
    env.identity.serviceRoleKey,
  );

  // Build product clients (only for products with credentials)
  const productClients = new Map<string, ProductAdminClient>();
  for (const product of env.products) {
    if (product.supabaseUrl && product.serviceRoleKey) {
      productClients.set(
        product.id,
        new ProductAdminClient(product.supabaseUrl, product.serviceRoleKey),
      );
    }
  }

  if (isDoctor) {
    await doctor(identityClient, productClients, env.products);
    return;
  }

  // ── Plan / Apply ──
  const mode = isApply ? "apply" : "dry-run";
  console.log(`\n🔧 SSO Provisioning (${mode})\n`);

  const plan = await buildProvisionPlan(
    identityClient,
    productClients,
    env.products,
  );

  // Print plan
  for (const action of plan.actions) {
    const icon =
      action.type === "ok"
        ? "✓"
        : action.type.startsWith("create")
          ? "📦"
          : action.type.startsWith("update")
            ? "📋"
            : "❓";
    console.log(`  ${icon} [${action.productId}] ${action.detail}`);
  }

  // Print errors
  for (const err of plan.errors) {
    console.log(`  ❌ ${err}`);
  }

  // Summary
  console.log(`\n─── Summary ───`);
  console.log(`  Created: ${plan.summary.create}`);
  console.log(`  Updated: ${plan.summary.update}`);
  console.log(`  OK:      ${plan.summary.ok}`);
  console.log(`  Errors:  ${plan.summary.errors}`);
  console.log(`  Mode:    ${mode}`);

  // If this is a dry-run, show how to apply
  if (!isApply) {
    console.log(`\n  Run \`pnpm sso:apply${productFilterArg ? ` ${productFilterArg}` : ""}\` to apply changes.\n`);
    return;
  }

  // ── Execute ──
  if (plan.actions.filter((a) => a.type !== "ok").length === 0) {
    console.log("\n  Nothing to do — all products are up to date.\n");
    return;
  }

  console.log(`\n  Applying ${plan.actions.filter((a) => a.type !== "ok").length} change(s)...\n`);

  const results = await applyProvisionPlan(
    plan,
    identityClient,
    productClients,
    env.products,
    process.env.ZUIIO_OIDC_ISSUER ??
      `${env.identity.supabaseUrl.replace(/\/$/, "")}/auth/v1`,
  );

  let successCount = 0;
  let failCount = 0;

  for (const result of results) {
    if (result.success) {
      successCount++;
    } else {
      failCount++;
      console.log(`  ❌ [${result.action.productId}] ${result.error ?? "Unknown error"}`);
    }
  }

  console.log(`\n─── Result ───`);
  console.log(`  Succeeded: ${successCount}`);
  console.log(`  Failed:    ${failCount}`);
  console.log(`\n`);
}

main().catch((err) => {
  console.error("\n❌ Fatal:", err);
  process.exit(1);
});
