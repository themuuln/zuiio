#!/usr/bin/env node
/**
 * SSO Provisioning Script
 *
 * Reconciles OAuth clients in zuiio-id and product_catalog rows.
 * Run from the monorepo root:
 *
 *   npx tsx scripts/sso/provision.ts [--apply]
 *
 * Without --apply: dry-run, shows what would change.
 * With --apply: writes changes to Supabase.
 *
 * Required env vars:
 *   ZUIIO_ID_URL              – zuiio-id Supabase URL
 *   ZUIIO_ID_SERVICE_ROLE_KEY – zuiio-id service role key
 *
 * Optional env vars (project refs for redirect URI construction):
 *   ZER_PROJECT_REF           – zer Supabase project ref
 *   TOLOM_PROJECT_REF         – tolom Supabase project ref
 */

import { createClient } from "@supabase/supabase-js";
import { SSO_PRODUCTS, type SsoProduct } from "../../config/sso-products";

const APPLY = process.argv.includes("--apply");

const ZUIIO_ID_URL = process.env.ZUIIO_ID_URL;
const ZUIIO_ID_KEY = process.env.ZUIIO_ID_SERVICE_ROLE_KEY;

if (!ZUIIO_ID_URL || !ZUIIO_ID_KEY) {
  console.error(
    "Missing env vars. Set ZUIIO_ID_URL and ZUIIO_ID_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

// Project refs for redirect URIs
const PROJECT_REFS: Record<string, string | undefined> = {
  zer: process.env.ZER_PROJECT_REF,
  tolom: process.env.TOLOM_PROJECT_REF,
};

interface OAuthClient {
  id: string;
  name: string;
  redirect_uris: string[];
  logo_uri: string;
  secret?: string;
}

// ─── GoTrue admin helpers ─────────────────────────────────────────

async function gotrueRequest(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<{ data: unknown; error: string | null }> {
  const res = await fetch(`${ZUIIO_ID_URL}/auth/v1${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ZUIIO_ID_KEY}`,
      apikey: ZUIIO_ID_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: unknown;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) return { data, error: `HTTP ${res.status}: ${String(text).slice(0, 200)}` };
  return { data, error: null };
}

// ─── Resolve redirect URI for a product ───────────────────────────

function resolveRedirectUri(product: SsoProduct): string {
  const ref = PROJECT_REFS[product.id];
  if (!ref) {
    // Fallback: derive from appRoots convention
    // Most products follow https://<project-ref>.supabase.co/auth/v1/callback
    console.warn(`  ⚠ No PROJECT_REF for ${product.id} — skipping redirect URI`);
    return "";
  }
  return `https://${ref}.supabase.co/auth/v1/callback`;
}

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔧 SSO Provisioning (${APPLY ? "apply" : "dry-run"})\n`);

  // 1. List existing OAuth clients in zuiio-id
  const { data: clientsData, error: listErr } = await gotrueRequest(
    "GET",
    "/oauth/clients",
  );
  if (listErr) {
    console.error(`Failed to list OAuth clients: ${listErr}`);
    process.exit(1);
  }
  const existingClients = (clientsData as OAuthClient[]) ?? [];
  console.log(`Found ${existingClients.length} existing OAuth client(s)\n`);

  // 2. List existing catalog rows
  const admin = createClient(ZUIIO_ID_URL, ZUIIO_ID_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: catalogRows } = await admin
    .from("product_catalog")
    .select("id, display_name, client_id, enabled, logo_url, continue_urls");

  const catalog = (catalogRows ?? []) as Array<Record<string, unknown>>;
  console.log(`Found ${catalog.length} product_catalog row(s)\n`);

  // 3. Process each SSO product
  const ssoProducts = SSO_PRODUCTS.filter((p) => p.authMode === "sso");
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const product of ssoProducts) {
    console.log(`── ${product.displayName} (${product.id}) ──`);

    const redirectUri = resolveRedirectUri(product);
    if (!redirectUri) {
      skipped++;
      continue;
    }

    // Match existing client by name (exact match)
    const existing = existingClients.find(
      (c) => c.name === product.displayName,
    );
    // Match catalog by product id
    const existingCatalog = catalog.find((r) => r.id === product.id);

    // ── OAuth client ──
    if (!existing) {
      // CREATE
      console.log(`  📦 Creating OAuth client: ${product.displayName}`);
      if (APPLY) {
        const { data, error } = await gotrueRequest("POST", "/oauth/clients", {
          name: product.displayName,
          redirect_uris: [redirectUri],
          scopes: ["openid", "profile", "email"],
          grant_types: ["authorization_code", "refresh_token"],
          logo_uri: product.logoUrl ?? "",
        });
        if (error) {
          console.error(`  ❌ Failed: ${error}`);
        } else {
          const client = data as { id: string; secret?: string };
          console.log(`  ✅ Created client ${client.id}`);
          if (client.secret) {
            console.log(`  🔑 Secret: ${client.secret}`);
            console.log(`  ⚠ Save this secret — it won't be shown again`);
          }
          created++;
        }
      } else {
        console.log(`  (dry-run) Would create client with redirect: ${redirectUri}`);
        created++;
      }
    } else {
      // CHECK for updates needed
      const needsUpdate =
        existing.redirect_uris?.[0] !== redirectUri ||
        existing.logo_uri !== (product.logoUrl ?? "");

      if (needsUpdate) {
        console.log(`  📦 Updating OAuth client: ${existing.id}`);
        if (APPLY) {
          const { error } = await gotrueRequest(
            "PUT",
            `/oauth/clients/${existing.id}`,
            {
              name: product.displayName,
              redirect_uris: [redirectUri],
              scopes: ["openid", "profile", "email"],
              grant_types: ["authorization_code", "refresh_token"],
              logo_uri: product.logoUrl ?? "",
            },
          );
          if (error) {
            console.error(`  ❌ Failed: ${error}`);
          } else {
            console.log(`  ✅ Updated client ${existing.id}`);
            updated++;
          }
        } else {
          console.log(`  (dry-run) Would update client ${existing.id}`);
          updated++;
        }
      } else {
        console.log(`  ✓ Client ${existing.id} is up to date`);
      }
    }

    // ── Catalog row ──
    const clientId = existing?.id ?? "PENDING";
    const catalogNeedsCreate = !existingCatalog;
    const catalogNeedsUpdate =
      existingCatalog &&
      (existingCatalog.client_id !== clientId ||
        existingCatalog.display_name !== product.displayName ||
        existingCatalog.logo_url !== (product.logoUrl ?? null));

    if (catalogNeedsCreate) {
      console.log(`  📋 Creating catalog row: ${product.id}`);
      if (APPLY) {
        const { error } = await admin.from("product_catalog").upsert({
          id: product.id,
          display_name: product.displayName,
          client_id: clientId,
          enabled: true,
          logo_url: product.logoUrl ?? null,
          continue_urls: [],
        }, { onConflict: "id" });
        if (error) {
          console.error(`  ❌ Failed: ${error.message}`);
        } else {
          console.log(`  ✅ Catalog row created`);
        }
      } else {
        console.log(`  (dry-run) Would create catalog row`);
      }
    } else if (catalogNeedsUpdate) {
      console.log(`  📋 Updating catalog row: ${product.id}`);
      if (APPLY) {
        const { error } = await admin
          .from("product_catalog")
          .update({
            display_name: product.displayName,
            client_id: clientId,
            logo_url: product.logoUrl ?? null,
          })
          .eq("id", product.id);
        if (error) {
          console.error(`  ❌ Failed: ${error.message}`);
        } else {
          console.log(`  ✅ Catalog row updated`);
        }
      } else {
        console.log(`  (dry-run) Would update catalog row`);
      }
    } else {
      console.log(`  ✓ Catalog row is up to date`);
    }

    console.log();
  }

  // Summary
  console.log("─── Summary ───");
  console.log(`  Created: ${created}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Mode: ${APPLY ? "APPLIED" : "dry-run (run with --apply to write)"}\n`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
