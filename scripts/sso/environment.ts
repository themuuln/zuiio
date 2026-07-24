#!/usr/bin/env node
/**
 * Environment resolution for SSO provisioning.
 *
 * Loads identity and product Supabase credentials from environment variables.
 * Supports filtering products by ID for targeted provisioning.
 */

import { SSO_PRODUCTS, type ProductId } from "../../config/sso-products";

// ─── Types ──────────────────────────────────────────────────────────

export interface IdentityConfig {
  /** Identity Supabase project URL (e.g. http://127.0.0.1:54321) */
  supabaseUrl: string;
  /** Service-role key for the identity project */
  serviceRoleKey: string;
}

export interface ProductConfig {
  id: ProductId;
  displayName: string;
  /** Product Supabase project URL */
  supabaseUrl: string | null;
  /** Product service-role key (null if not configured) */
  serviceRoleKey: string | null;
}

export interface Environment {
  identity: IdentityConfig;
  products: ProductConfig[];
}

// ─── Env var key helpers ────────────────────────────────────────────

function productEnvKey(id: string, suffix: "SUPABASE_URL" | "SERVICE_ROLE_KEY"): string {
  return `${id.toUpperCase().replace(/-/g, "_")}_${suffix}`;
}

// ─── Loader ─────────────────────────────────────────────────────────

/**
 * Load environment configuration from process.env.
 *
 * @param productFilter - Optional list of product IDs to include.
 *                       If omitted, all SSO products are included.
 */
export function loadEnvironment(productFilter?: ProductId[]): Environment {
  const identitySupabaseUrl =
    process.env.IDENTITY_SUPABASE_URL ??
    process.env.ZUIIO_ID_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const identityServiceRoleKey =
    process.env.IDENTITY_SERVICE_ROLE_KEY ??
    process.env.ZUIIO_ID_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!identitySupabaseUrl || !identityServiceRoleKey) {
    console.error(
      "Missing identity project credentials. Set IDENTITY_SUPABASE_URL\n" +
        "and IDENTITY_SERVICE_ROLE_KEY (or the ZUIIO_ID_* / NEXT_PUBLIC_* fallbacks).",
    );
    process.exit(1);
  }

  const identity: IdentityConfig = {
    supabaseUrl: identitySupabaseUrl,
    serviceRoleKey: identityServiceRoleKey,
  };

  // Load product configs
  const ssoProducts = SSO_PRODUCTS.filter((p) => p.authMode === "sso");

  const products: ProductConfig[] = ssoProducts
    .filter((p) => !productFilter || productFilter.includes(p.id))
    .map((p) => ({
      id: p.id,
      displayName: p.displayName,
      supabaseUrl: process.env[productEnvKey(p.id, "SUPABASE_URL")] ?? null,
      serviceRoleKey:
        process.env[productEnvKey(p.id, "SERVICE_ROLE_KEY")] ?? null,
    }));

  return { identity, products };
}
