#!/usr/bin/env node

/**
 * SSO Provisioner — idempotent setup for Zuiio identity federation.
 *
 * Creates OAuth clients on the identity project, configures custom:zuiio
 * OIDC providers on each product project, and upserts the product_catalog.
 *
 * Usage:
 *   pnpm sso:plan  --environment development
 *   pnpm sso:apply --environment development
 *   pnpm sso:apply --environment development --rotate zer
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { SSO_PRODUCTS, type SsoProduct } from "../../config/sso-products";

// ── CLI args ──────────────────────────────────────────────────

const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const flag = `--${name}`;
  const idx = args.indexOf(flag);
  if (idx === -1) return undefined;
  return args[idx + 1];
}

const environment = getArg("environment") ?? "development";
const dryRun = args.includes("--dry-run");
const rotateProduct = getArg("rotate");

if (!["development", "staging", "production"].includes(environment)) {
  console.error(
    `Invalid environment: ${environment}. Must be development, staging, or production.`,
  );
  process.exit(1);
}

// ── Env validation ────────────────────────────────────────────

const EnvSchema = z.object({
  IDENTITY_SUPABASE_URL: z.string().url(),
  IDENTITY_SERVICE_ROLE_KEY: z.string().min(1),
  PRODUCT_SUPABASE_URLS: z.record(z.string(), z.string().url()),
  PRODUCT_SERVICE_ROLE_KEYS: z.record(z.string(), z.string().min(1)),
});

type EnvConfig = z.infer<typeof EnvSchema>;

function loadEnv(): EnvConfig {
  const productUrls: Record<string, string> = {};
  const productKeys: Record<string, string> = {};

  for (const product of SSO_PRODUCTS) {
    if (product.authMode === "none") continue;

    const urlKey = `${product.id.toUpperCase()}_SUPABASE_URL`;
    const keyKey = `${product.id.toUpperCase()}_SERVICE_ROLE_KEY`;

    const url = process.env[urlKey];
    const key = process.env[keyKey];

    if (url) productUrls[product.id] = url;
    if (key) productKeys[product.id] = key;
  }

  return EnvSchema.parse({
    IDENTITY_SUPABASE_URL: process.env.IDENTITY_SUPABASE_URL,
    IDENTITY_SERVICE_ROLE_KEY: process.env.IDENTITY_SERVICE_ROLE_KEY,
    PRODUCT_SUPABASE_URLS: productUrls,
    PRODUCT_SERVICE_ROLE_KEYS: productKeys,
  });
}

// ── Types ─────────────────────────────────────────────────────

interface OAuthClient {
  id: string;
  name: string;
  redirect_uris: string[];
  client_type: string;
  token_endpoint_auth_method: string;
  secret?: string;
}

interface PlanItem {
  product: SsoProduct;
  action: "create_client" | "configure_provider" | "upsert_catalog" | "skip";
  detail: string;
  existing?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────

function adminClient(url: string, key: string): SupabaseClient {
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ── Core logic ────────────────────────────────────────────────

async function planOrApply(
  env: EnvConfig,
  mode: "plan" | "apply",
): Promise<void> {
  const identity = adminClient(
    env.IDENTITY_SUPABASE_URL,
    env.IDENTITY_SERVICE_ROLE_KEY,
  );

  const plan: PlanItem[] = [];

  for (const product of SSO_PRODUCTS) {
    if (product.authMode === "none") {
      plan.push({
        product,
        action: "skip",
        detail: "authMode: none — no SSO provisioning needed",
      });
      continue;
    }

    const productUrl = env.PRODUCT_SUPABASE_URLS[product.id];
    const productKey = env.PRODUCT_SERVICE_ROLE_KEYS[product.id];

    if (!productUrl || !productKey) {
      plan.push({
        product,
        action: "skip",
        detail: `Missing ${product.id.toUpperCase()}_SUPABASE_URL or ${product.id.toUpperCase()}_SERVICE_ROLE_KEY`,
      });
      continue;
    }

    // 1. Check existing OAuth client
    const { data: existingClients } = await identity.auth.admin.listClients();
    const existingClient = existingClients?.find(
      (c: OAuthClient) =>
        c.name?.includes(product.displayName) &&
        c.name?.includes(environment),
    );

    if (!existingClient) {
      plan.push({
        product,
        action: "create_client",
        detail: `Create OAuth client: Zuiio ${product.displayName} (${environment})`,
      });
    } else {
      plan.push({
        product,
        action: "create_client",
        detail: `OAuth client already exists: ${existingClient.id}`,
        existing: true,
      });
    }

    // 2. Check product catalog row
    const { data: catalogRow } = await identity
      .from("product_catalog")
      .select("id")
      .eq("id", product.id)
      .single();

    if (!catalogRow) {
      plan.push({
        product,
        action: "upsert_catalog",
        detail: `Add product_catalog row for ${product.id}`,
      });
    } else {
      plan.push({
        product,
        action: "upsert_catalog",
        detail: `product_catalog row exists for ${product.id}`,
        existing: true,
      });
    }

    // 3. Check custom:zuiio provider on product project
    const productAdmin = adminClient(productUrl, productKey);
    const { data: providers } =
      await productAdmin.auth.admin.listProviders();
    const existingProvider = providers?.find(
      (p: { provider_type?: string; identifier?: string }) =>
        p.identifier === "custom:zuiio",
    );

    if (!existingProvider) {
      plan.push({
        product,
        action: "configure_provider",
        detail: `Configure custom:zuiio provider on ${product.id}`,
      });
    } else {
      plan.push({
        product,
        action: "configure_provider",
        detail: `custom:zuiio provider already configured on ${product.id}`,
        existing: true,
      });
    }
  }

  // ── Output ────────────────────────────────────────────────

  const actions = plan.filter((p) => p.action !== "skip" && !p.existing);

  console.log(`\n── SSO Plan (${environment}) ${mode === "plan" ? "— DRY RUN" : ""} ──\n`);

  for (const item of plan) {
    const icon =
      item.action === "skip"
        ? "○"
        : item.existing
          ? "✓"
          : mode === "plan"
            ? "+"
            : "•";
    console.log(`  ${icon} [${item.product.id}] ${item.detail}`);
  }

  console.log(
    `\n  ${actions.length} action(s) ${mode === "plan" ? "would be" : ""} needed.\n`,
  );

  if (mode === "plan") return;

  // ── Apply ─────────────────────────────────────────────────

  console.log("── Applying ──\n");

  for (const product of SSO_PRODUCTS) {
    if (product.authMode === "none") continue;

    const productUrl = env.PRODUCT_SUPABASE_URLS[product.id];
    const productKey = env.PRODUCT_SERVICE_ROLE_KEYS[product.id];

    if (!productUrl || !productKey) continue;

    const productItem = plan.find(
      (p) => p.product.id === product.id && p.action === "create_client",
    );

    // Create OAuth client if needed
    if (productItem && !productItem.existing) {
      const { data, error } = await identity.auth.admin.createClient({
        name: `Zuiio ${product.displayName} (${environment})`,
        redirect_uris: [`${productUrl}/auth/v1/callback`],
        client_type: "confidential",
        token_endpoint_auth_method: "client_secret_basic",
      });

      if (error) {
        console.error(
          `  ✗ Failed to create client for ${product.id}: ${error.message}`,
        );
        continue;
      }

      console.log(
        `  • Created OAuth client for ${product.id}: ${data.id}`,
      );
      if (data.secret) {
        console.log(
          `    Client secret: ${data.secret} (SAVE THIS — not shown again)`,
        );
      }

      // Upsert catalog
      const catalogItem = plan.find(
        (p) =>
          p.product.id === product.id && p.action === "upsert_catalog",
      );

      if (catalogItem && !catalogItem.existing) {
        const { error: catalogError } = await identity
          .from("product_catalog")
          .upsert({
            id: product.id,
            display_name: product.displayName,
            client_id: data.id,
            enabled: true,
            continue_urls: [
              ...product.appRoots.map(
                (root) => `http://localhost:3000${product.ssoStartPath}`,
              ),
              ...(product.mobileStartUrl
                ? [product.mobileStartUrl]
                : []),
            ],
          });

        if (catalogError) {
          console.error(
            `  ✗ Failed to upsert catalog for ${product.id}: ${catalogError.message}`,
          );
        } else {
          console.log(`  • Upserted product_catalog for ${product.id}`);
        }
      }
    }

    // Configure custom:zuiio provider if needed
    const providerItem = plan.find(
      (p) =>
        p.product.id === product.id &&
        p.action === "configure_provider",
    );

    if (providerItem && !providerItem.existing) {
      const productAdmin = adminClient(productUrl, productKey);

      // We need the identity client_id for this product
      const { data: clientData } = await identity.auth.admin.listClients();
      const client = clientData?.find(
        (c: OAuthClient) =>
          c.name?.includes(product.displayName) &&
          c.name?.includes(environment),
      );

      if (!client) {
        console.error(
          `  ✗ Cannot configure provider for ${product.id}: OAuth client not found`,
        );
        continue;
      }

      const { error: providerError } =
        await productAdmin.auth.admin.createProvider({
          provider_type: "oidc",
          identifier: "custom:zuiio",
          name: "Zuiio ID",
          client_id: client.id,
          client_secret: (client as OAuthClient & { secret?: string })
            .secret ?? "",
          issuer: `${env.IDENTITY_SUPABASE_URL}/auth/v1`,
          scopes: ["openid", "email", "profile"],
          email_optional: false,
          pkce_enabled: true,
        });

      if (providerError) {
        console.error(
          `  ✗ Failed to configure provider for ${product.id}: ${providerError.message}`,
        );
      } else {
        console.log(
          `  • Configured custom:zuiio provider on ${product.id}`,
        );
      }
    }
  }

  console.log("\n── Done ──\n");
}

// ── Entry point ───────────────────────────────────────────────

async function main() {
  try {
    const env = loadEnv();
    await planOrApply(env, dryRun ? "plan" : "apply");
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      console.error("Environment validation failed:");
      for (const issue of e.issues) {
        console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
      }
      process.exit(1);
    }
    throw e;
  }
}

main();
