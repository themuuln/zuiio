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
 * Required env vars (one of each pair):
 *   ZUIIO_ID_URL + ZUIIO_ID_SERVICE_ROLE_KEY
 *   or NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional: ZER_PROJECT_REF, TOLOM_PROJECT_REF (for redirect URIs)
 */

import { createClient } from "@supabase/supabase-js";
import { SSO_PRODUCTS, type SsoProduct } from "../../config/sso-products";

const APPLY = process.argv.includes("--apply");

const ZUIIO_ID_URL =
  process.env.ZUIIO_ID_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const ZUIIO_ID_KEY =
  process.env.ZUIIO_ID_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!ZUIIO_ID_URL || !ZUIIO_ID_KEY) {
  console.error(
    "Missing env vars. Set ZUIIO_ID_URL + ZUIIO_ID_SERVICE_ROLE_KEY,\n" +
      "or NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

// Project refs for redirect URI construction
const PROJECT_REFS: Record<string, string | undefined> = {
  zer: process.env.ZER_PROJECT_REF,
  tolom: process.env.TOLOM_PROJECT_REF,
};

// ─── GoTrue admin API helpers ─────────────────────────────────────
// Endpoint: /auth/v1/admin/oauth/clients
// Auth: service role key via Authorization header

interface GotrueClient {
  client_id: string;
  client_name?: string;
  redirect_uris: string[];
  grant_types: string[];
  logo_uri?: string;
  [key: string]: unknown;
}

async function gotrueGet(
  path: string,
): Promise<{ data: unknown; error: string | null }> {
  const res = await fetch(`${ZUIIO_ID_URL}/auth/v1${path}`, {
    headers: {
      Authorization: `Bearer ${ZUIIO_ID_KEY}`,
      apikey: ZUIIO_ID_KEY,
    },
  });
  const text = await res.text();
  let data: unknown;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) return { data, error: `HTTP ${res.status}: ${String(text).slice(0, 200)}` };
  return { data, error: null };
}

async function gotruePost(
  path: string,
  body: Record<string, unknown>,
): Promise<{ data: unknown; error: string | null }> {
  const res = await fetch(`${ZUIIO_ID_URL}/auth/v1${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ZUIIO_ID_KEY}`,
      apikey: ZUIIO_ID_KEY,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: unknown;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) return { data, error: `HTTP ${res.status}: ${String(text).slice(0, 200)}` };
  return { data, error: null };
}

async function gotruePut(
  path: string,
  body: Record<string, unknown>,
): Promise<{ error: string | null }> {
  const res = await fetch(`${ZUIIO_ID_URL}/auth/v1${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ZUIIO_ID_KEY}`,
      apikey: ZUIIO_ID_KEY,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    return { error: `HTTP ${res.status}: ${String(text).slice(0, 200)}` };
  }
  return { error: null };
}

// ─── Resolve redirect URI for a product ───────────────────────────

function resolveRedirectUri(product: SsoProduct): string {
  const ref = PROJECT_REFS[product.id];
  if (!ref) {
    console.warn(`  ⚠ No PROJECT_REF for ${product.id} — skipping`);
    return "";
  }
  return `https://${ref}.supabase.co/auth/v1/callback`;
}

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔧 SSO Provisioning (${APPLY ? "apply" : "dry-run"})\n`);

  // 1. List existing OAuth clients
  const { data: clientsResp, error: listErr } = await gotrueGet(
    "/admin/oauth/clients",
  );
  if (listErr) {
    console.error(`Failed to list OAuth clients: ${listErr}`);
    process.exit(1);
  }
  const existingClients =
    (clientsResp as { clients?: GotrueClient[] })?.clients ?? [];
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

    // Match existing client by name
    const existing = existingClients.find(
      (c) => c.client_name === product.displayName,
    );
    // Match catalog by product id
    const existingCatalog = catalog.find((r) => r.id === product.id);

    // ── OAuth client ──
    if (!existing) {
      console.log(`  📦 Creating OAuth client: ${product.displayName}`);
      if (APPLY) {
        const { data, error } = await gotruePost("/admin/oauth/clients", {
          client_name: product.displayName,
          redirect_uris: [redirectUri],
          scopes: ["openid", "profile", "email"],
          grant_types: ["authorization_code", "refresh_token"],
          logo_uri: product.logoUrl ?? "",
        });
        if (error) {
          console.error(`  ❌ Failed: ${error}`);
        } else {
          const client = data as GotrueClient;
          console.log(`  ✅ Created client ${client.client_id}`);
          created++;
        }
      } else {
        console.log(`  (dry-run) Would create client → ${redirectUri}`);
        created++;
      }
    } else {
      // Check if update needed
      const uriChanged = existing.redirect_uris?.[0] !== redirectUri;
      const logoChanged =
        (existing.logo_uri ?? "") !== (product.logoUrl ?? "");

      if (uriChanged || logoChanged) {
        console.log(`  📦 Updating OAuth client: ${existing.client_id}`);
        if (APPLY) {
          const { error } = await gotruePut(
            `/admin/oauth/clients/${existing.client_id}`,
            {
              client_name: product.displayName,
              redirect_uris: [redirectUri],
              scopes: ["openid", "profile", "email"],
              grant_types: ["authorization_code", "refresh_token"],
              logo_uri: product.logoUrl ?? "",
            },
          );
          if (error) {
            console.error(`  ❌ Failed: ${error}`);
          } else {
            console.log(`  ✅ Updated`);
            updated++;
          }
        } else {
          console.log(`  (dry-run) Would update client ${existing.client_id}`);
          updated++;
        }
      } else {
        console.log(`  ✓ Client ${existing.client_id} up to date`);
      }
    }

    // ── Catalog row ──
    const clientId = existing?.client_id ?? "PENDING";
    const catalogNeedsCreate = !existingCatalog;
    const catalogNeedsUpdate =
      existingCatalog &&
      (existingCatalog.client_id !== clientId ||
        existingCatalog.display_name !== product.displayName ||
        existingCatalog.logo_url !== (product.logoUrl ?? null));

    if (catalogNeedsCreate) {
      console.log(`  📋 Creating catalog row: ${product.id}`);
      if (APPLY) {
        const { error } = await admin.from("product_catalog").upsert(
          {
            id: product.id,
            display_name: product.displayName,
            client_id: clientId,
            enabled: true,
            logo_url: product.logoUrl ?? null,
            continue_urls: [],
          },
          { onConflict: "id" },
        );
        if (error) {
          console.error(`  ❌ Failed: ${error.message}`);
        } else {
          console.log(`  ✅ Created`);
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
          console.log(`  ✅ Updated`);
        }
      } else {
        console.log(`  (dry-run) Would update catalog row`);
      }
    } else {
      console.log(`  ✓ Catalog row up to date`);
    }

    console.log();
  }

  // Summary
  console.log("─── Summary ───");
  console.log(`  Created: ${created}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(
    `  Mode: ${APPLY ? "APPLIED ✓" : "dry-run (run with --apply to write)"}\n`,
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
