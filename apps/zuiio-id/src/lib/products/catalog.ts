/**
 * Product catalog — async DB-driven lookup for SSO product configuration.
 *
 * Replaces the static `getSsoProduct()` from `@config/sso-products` with
 * queries against the `product_catalog` database table. This allows new
 * products to be provisioned without redeploying Zuiio ID.
 *
 * Uses the service-role admin client because `product_catalog` is
 * service-role only (revoked for anon, authenticated).
 */

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/server";

// ─── Types ──────────────────────────────────────────────────────────

export type IntegrationType = "supabase_federation" | "direct_oidc";
export type ConsentPolicy = "explicit" | "trusted_first_party";

export interface ProductCatalogRecord {
  id: string;
  displayName: string;
  clientId: string | null;
  enabled: boolean;
  logoUrl: string | null;
  continueUrls: string[];
  integrationType: IntegrationType;
  consentPolicy: ConsentPolicy;
  allowedScopes: string[];
  scimToken: string | null;
}

// ─── Row mapper ─────────────────────────────────────────────────────

function mapRow(row: {
  id: string;
  display_name: string;
  client_id: string | null;
  enabled: boolean;
  logo_url: string | null;
  continue_urls: string[];
  integration_type: string | null;
  consent_policy: string | null;
  allowed_scopes: string[] | null;
  scim_token: string | null;
}): ProductCatalogRecord {
  return {
    id: row.id,
    displayName: row.display_name,
    clientId: row.client_id,
    enabled: row.enabled,
    logoUrl: row.logo_url,
    continueUrls: row.continue_urls ?? [],
    integrationType: (row.integration_type ??
      "supabase_federation") as IntegrationType,
    consentPolicy: (row.consent_policy ?? "explicit") as ConsentPolicy,
    allowedScopes: row.allowed_scopes ?? ["openid", "profile", "email"],
    scimToken: row.scim_token,
  };
}

// ─── Queries ────────────────────────────────────────────────────────

/**
 * Fetch an enabled product by its ID.
 * Uses React's `cache()` for deduplication within a single request.
 */
export const getEnabledProductById = cache(
  async (id: string): Promise<ProductCatalogRecord | null> => {
    const admin = await createAdminClient();

    const { data } = await admin
      .from("product_catalog")
      .select(
        "id, display_name, client_id, enabled, logo_url, continue_urls, integration_type, consent_policy, allowed_scopes, scim_token",
      )
      .eq("id", id)
      .eq("enabled", true)
      .maybeSingle();

    if (!data) return null;

    return mapRow(data as Parameters<typeof mapRow>[0]);
  },
);

/**
 * Fetch an enabled product by its OAuth client_id.
 * Used by the consent flow to determine how to handle a client.
 */
export const getEnabledProductByClientId = cache(
  async (clientId: string): Promise<ProductCatalogRecord | null> => {
    const admin = await createAdminClient();

    const { data } = await admin
      .from("product_catalog")
      .select(
        "id, display_name, client_id, enabled, logo_url, continue_urls, integration_type, consent_policy, allowed_scopes, scim_token",
      )
      .eq("client_id", clientId)
      .eq("enabled", true)
      .maybeSingle();

    if (!data) return null;

    return mapRow(data as Parameters<typeof mapRow>[0]);
  },
);

/**
 * List all enabled products.
 * Used by admin pages and provisioning tooling.
 */
export const listEnabledProducts = cache(
  async (): Promise<ProductCatalogRecord[]> => {
    const admin = await createAdminClient();

    const { data } = await admin
      .from("product_catalog")
      .select(
        "id, display_name, client_id, enabled, logo_url, continue_urls, integration_type, consent_policy, allowed_scopes, scim_token",
      )
      .eq("enabled", true)
      .order("display_name");

    return (data ?? []).map((row) =>
      mapRow(row as Parameters<typeof mapRow>[0]),
    );
  },
);

/**
 * Verify a SCIM bearer token against the product_catalog.
 */
/**
 * Hash a token with SHA-256 for storage.
 */
function hashToken(token: string): string {
  const { createHash } = require("node:crypto") as typeof import("node:crypto");
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Verify a SCIM bearer token against the product_catalog.
 * Tokens are stored as SHA-256 hashes; incoming token is hashed before comparison.
 */
export async function verifyScimToken(
  token: string,
): Promise<{ productId: string } | null> {
  const admin = createAdminClient();
  const hashedToken = hashToken(token);

  const { data } = await admin
    .from("product_catalog")
    .select("id")
    .eq("scim_token", hashedToken)
    .eq("enabled", true)
    .maybeSingle();

  if (!data) return null;
  return { productId: data.id };
}

/**
 * Hash a SCIM token for storage (used when creating/updating tokens).
 */
export function hashScimToken(token: string): string {
  return hashToken(token);
}
