#!/usr/bin/env node
/**
 * SSO provisioning reconciler.
 *
 * Computes the diff between the desired state (from sso-products.ts + env)
 * and the actual state (from GoTrue admin API + DB). Can generate a plan
 * or apply changes.
 */

import { SSO_PRODUCTS } from "../../config/sso-products";
import type { IdentityAdminClient, ProductAdminClient } from "./supabase-admin";
import {
  buildClientSpec,
  extractProjectRef,
  resolveCallbackUri,
} from "./supabase-admin";
import type { ProductConfig } from "./environment";

// ─── Types ──────────────────────────────────────────────────────────

export interface PlanAction {
  type: "create_client" | "update_client" | "delete_client" | "create_catalog" | "update_catalog" | "create_provider" | "update_provider" | "add_callback_uri" | "ok";
  productId: string;
  displayName: string;
  detail: string;
}

export interface ProvisionPlan {
  actions: PlanAction[];
  errors: string[];
  summary: {
    create: number;
    update: number;
    delete: number;
    ok: number;
    errors: number;
  };
}

export interface ApplyResult {
  action: PlanAction;
  success: boolean;
  error?: string;
}

// ─── Plan builder ───────────────────────────────────────────────────

export async function buildProvisionPlan(
  identityClient: IdentityAdminClient,
  productClients: Map<string, ProductAdminClient>,
  products: ProductConfig[],
): Promise<ProvisionPlan> {
  const actions: PlanAction[] = [];
  const errors: string[] = [];

  // 1. Fetch current state
  const { clients: existingClients, error: listErr } =
    await identityClient.listOAuthClients();

  if (listErr) {
    errors.push(`Failed to list OAuth clients: ${listErr}`);
    return { actions, errors, summary: { create: 0, update: 0, delete: 0, ok: 0, errors: 1 } };
  }

  const db = identityClient.getDbClient();
  const { data: catalogRows } = await db
    .from("product_catalog")
    .select("id, display_name, client_id, enabled, logo_url, continue_urls");

  const catalog = (catalogRows ?? []) as Array<{
    id: string;
    display_name: string;
    client_id: string | null;
    enabled: boolean;
    logo_url: string | null;
    continue_urls: string[];
  }>;

  // 2. Process each product
  for (const product of products) {
    const ssoProduct = SSO_PRODUCTS.find((p) => p.id === product.id);
    if (!ssoProduct || ssoProduct.authMode !== "sso") continue;

    if (!product.supabaseUrl) {
      actions.push({
        type: "ok",
        productId: product.id,
        displayName: product.displayName,
        detail: "⏭ No Supabase URL configured — skipping (set env vars)",
      });
      continue;
    }

    const callbackUri = resolveCallbackUri(product.supabaseUrl);
    const desiredSpec = buildClientSpec(ssoProduct, callbackUri);

    // Find existing OAuth client: prefer by catalog client_id, fallback by name
    const catalogRow = catalog.find((r) => r.id === product.id);
    let existingClient = catalogRow?.client_id
      ? existingClients.find((c) => c.client_id === catalogRow!.client_id)
      : undefined;

    // Fallback: match by client_name if no catalog row
    if (!existingClient) {
      existingClient = existingClients.find(
        (c) => c.client_name === desiredSpec.client_name,
      );
    }

    // ── OAuth client reconciliation ──
    if (!existingClient) {
      actions.push({
        type: "create_client",
        productId: product.id,
        displayName: product.displayName,
        detail: `OAuth client "${desiredSpec.client_name}" → ${callbackUri}`,
      });
    } else {
      const uriChanged =
        existingClient.redirect_uris?.[0] !== desiredSpec.redirect_uris[0];
      const logoChanged =
        (existingClient.logo_uri ?? "") !== (desiredSpec.logo_uri ?? "");

      if (uriChanged || logoChanged) {
        const changes: string[] = [];
        if (uriChanged) changes.push(`redirect_uri: ${desiredSpec.redirect_uris[0]}`);
        if (logoChanged) changes.push("logo");
        actions.push({
          type: "update_client",
          productId: product.id,
          displayName: product.displayName,
          detail: `OAuth client ${existingClient.client_id} — ${changes.join(", ")}`,
        });
      }
    }

    // ── Catalog row reconciliation ──
    const resolvedClientId = existingClient?.client_id ?? "pending-creation";
    if (!catalogRow) {
      actions.push({
        type: "create_catalog",
        productId: product.id,
        displayName: product.displayName,
        detail: `Catalog entry for ${product.id} (client_id: ${resolvedClientId})`,
      });
    } else {
      const needsUpdate =
        catalogRow.display_name !== product.displayName ||
        catalogRow.client_id !== resolvedClientId ||
        catalogRow.logo_url !== (ssoProduct.logoUrl ?? null);

      if (needsUpdate) {
        actions.push({
          type: "update_catalog",
          productId: product.id,
          displayName: product.displayName,
          detail: `Catalog ${product.id} — sync display_name/logo/client_id`,
        });
      }
    }

    // ── Product-side provider reconciliation ──
    const productClient = productClients.get(product.id);
    if (productClient && existingClient) {
      const { config: providerConfig, error: providerErr } =
        await productClient.getZuiioProvider();
      if (providerErr) {
        actions.push({
          type: "ok",
          productId: product.id,
          displayName: product.displayName,
          detail: `⚠ Cannot check provider config: ${providerErr}`,
        });
      } else if (!providerConfig) {
        actions.push({
          type: "create_provider",
          productId: product.id,
          displayName: product.displayName,
          detail: `custom:zuiio provider not configured — needs client_id ${existingClient.client_id}`,
        });
      } else {
        const needsUpdate =
          providerConfig.client_id !== existingClient.client_id ||
          !providerConfig.pkce_enabled ||
          !providerConfig.enabled;

        if (needsUpdate) {
          actions.push({
            type: "update_provider",
            productId: product.id,
            displayName: product.displayName,
            detail: `Update custom:zuiio provider — sync client_id/enabled/PKCE`,
          });
        }
      }
    }

    // ── If everything is up to date ──
    if (
      existingClient &&
      catalogRow &&
      actions.find(
        (a) =>
          a.productId === product.id &&
          (a.type === "create_client" ||
            a.type === "update_client" ||
            a.type === "create_catalog" ||
            a.type === "update_catalog" ||
            a.type === "create_provider" ||
            a.type === "update_provider"),
      ) === undefined
    ) {
      actions.push({
        type: "ok",
        productId: product.id,
        displayName: product.displayName,
        detail: `✓ All up to date`,
      });
    }
  }

  // Compute summary
  const summary = {
    create: actions.filter((a) => a.type.startsWith("create")).length,
    update: actions.filter((a) => a.type.startsWith("update")).length,
    delete: actions.filter((a) => a.type === "delete_client").length,
    ok: actions.filter((a) => a.type === "ok").length,
    errors: errors.length,
  };

  return { actions, errors, summary };
}

// ─── Plan executor ───────────────────────────────────────────────────

export async function applyProvisionPlan(
  plan: ProvisionPlan,
  identityClient: IdentityAdminClient,
  productClients: Map<string, ProductAdminClient>,
  products: ProductConfig[],
  identityIssuer: string,
): Promise<ApplyResult[]> {
  const results: ApplyResult[] = [];

  for (const action of plan.actions) {
    if (action.type === "ok") {
      results.push({ action, success: true });
      continue;
    }

    try {
      const result = await executeAction(
        action,
        identityClient,
        productClients,
        products,
        identityIssuer,
      );
      results.push(result);
    } catch (err) {
      results.push({
        action,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}

async function executeAction(
  action: PlanAction,
  identityClient: IdentityAdminClient,
  productClients: Map<string, ProductAdminClient>,
  products: ProductConfig[],
  identityIssuer: string,
): Promise<ApplyResult> {
  const product = products.find((p) => p.id === action.productId);
  const ssoProduct = SSO_PRODUCTS.find((p) => p.id === action.productId);

  if (!product || !ssoProduct) {
    return {
      action,
      success: false,
      error: `Product ${action.productId} not found`,
    };
  }

  const callbackUri = product.supabaseUrl
    ? resolveCallbackUri(product.supabaseUrl)
    : "";
  const desiredSpec = buildClientSpec(ssoProduct, callbackUri);

  switch (action.type) {
    case "create_client": {
      const { client, error } =
        await identityClient.createOAuthClient(desiredSpec);
      if (error) return { action, success: false, error };
      console.log(`  ✅ Created OAuth client ${client!.client_id}`);

      // After creating the client, update the catalog with the real client_id
      const db = identityClient.getDbClient();
      const { error: catalogErr } = await db.from("product_catalog").upsert(
        {
          id: product.id,
          display_name: ssoProduct.displayName,
          client_id: client!.client_id,
          enabled: true,
          logo_url: ssoProduct.logoUrl ?? null,
          continue_urls: [],
        },
        { onConflict: "id" },
      );
      if (catalogErr) {
        console.error(`  ⚠ Created client but catalog upsert failed: ${catalogErr.message}`);
        console.log(`  → Manually: update product_catalog set client_id = '${client!.client_id}' where id = '${product.id}'`);
      } else {
        console.log(`  ✅ Catalog row updated with client_id`);
      }

      // If we have the product client, configure the provider
      const productClientForCreate = productClients.get(product.id);
      if (productClientForCreate && product.supabaseUrl) {
        const issuer = process.env.ZUIIO_OIDC_ISSUER ?? identityIssuer;
        const { error: providerErr } =
          await productClientForCreate.upsertZuiioProvider({
            client_id: client!.client_id,
            client_secret: client!.client_secret ?? "",
            issuer,
          });
        if (providerErr) {
          console.error(`  ⚠ Provider config failed: ${providerErr}`);
        } else {
          console.log(`  ✅ custom:zuiio provider configured on ${product.displayName}`);
        }
      }
      return { action, success: true };
    }

    case "update_client": {
      const { client, error } =
        await identityClient.updateOAuthClient(
          // Need to resolve the client_id — scan existing clients
          await resolveClientId(identityClient, ssoProduct),
          {
            redirect_uris: desiredSpec.redirect_uris,
            client_name: desiredSpec.client_name,
            scopes: desiredSpec.scopes,
            grant_types: desiredSpec.grant_types,
            logo_uri: desiredSpec.logo_uri,
          },
        );
      if (error) return { action, success: false, error };
      console.log(`  ✅ Updated OAuth client ${client!.client_id}`);
      return { action, success: true };
    }

    case "create_catalog": {
      const db = identityClient.getDbClient();
      const clientId = await resolveClientId(identityClient, ssoProduct);
      const { error } = await db.from("product_catalog").upsert(
        {
          id: product.id,
          display_name: ssoProduct.displayName,
          client_id: clientId ?? "00000000-0000-0000-0000-000000000000",
          enabled: true,
          logo_url: ssoProduct.logoUrl ?? null,
          continue_urls: [],
        },
        { onConflict: "id" },
      );
      if (error) return { action, success: false, error: error.message };
      console.log(`  ✅ Created catalog entry for ${product.id}`);
      return { action, success: true };
    }

    case "update_catalog": {
      const db = identityClient.getDbClient();
      const clientId = await resolveClientId(identityClient, ssoProduct);
      const { error } = await db
        .from("product_catalog")
        .update({
          display_name: ssoProduct.displayName,
          client_id: clientId ?? "00000000-0000-0000-0000-000000000000",
          logo_url: ssoProduct.logoUrl ?? null,
        })
        .eq("id", product.id);
      if (error) return { action, success: false, error: error.message };
      console.log(`  ✅ Updated catalog entry for ${product.id}`);
      return { action, success: true };
    }

    case "create_provider":
    case "update_provider": {
      const productClient = productClients.get(product.id);
      if (!productClient) {
        return {
          action,
          success: false,
          error: "No product client configured (missing service role key)",
        };
      }
      const clientId = await resolveClientId(identityClient, ssoProduct);
      if (!clientId) {
        return {
          action,
          success: false,
          error: "Cannot resolve client_id — has the OAuth client been created?",
        };
      }
      const issuer = process.env.ZUIIO_OIDC_ISSUER ?? identityIssuer;
      const { error } = await productClient.upsertZuiioProvider({
        client_id: clientId,
        client_secret: "",
        issuer,
      });
      if (error) return { action, success: false, error };
      console.log(`  ✅ custom:zuiio provider configured on ${product.displayName}`);
      return { action, success: true };
    }

    default:
      return { action, success: false, error: `Unknown action type: ${action.type}` };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

/** Resolve the client_id for a product by checking catalog first, then name match. */
async function resolveClientId(
  identityClient: IdentityAdminClient,
  product: (typeof SSO_PRODUCTS)[number],
): Promise<string | null> {
  const db = identityClient.getDbClient();
  const { data: catalogRow } = await db
    .from("product_catalog")
    .select("client_id")
    .eq("id", product.id)
    .maybeSingle();

  if (catalogRow?.client_id) return catalogRow.client_id;

  const { clients } = await identityClient.listOAuthClients();
  const match = clients.find((c) => c.client_name === product.displayName);
  return match?.client_id ?? null;
}

export { resolveClientId };
