#!/usr/bin/env node
/**
 * Supabase admin API wrapper for SSO provisioning.
 *
 * Wraps GoTrue admin OAuth client management and Supabase REST API
 * for product_catalog DB operations. Uses service-role key auth.
 *
 * GoTrue admin endpoints: /auth/v1/admin/oauth/clients
 * Product provider config: uses Supabase Management API for custom providers
 */

import { createClient } from "@supabase/supabase-js";
import { SSO_PRODUCTS } from "../../config/sso-products";

// ─── Types ──────────────────────────────────────────────────────────

export interface GotrueOAuthClient {
  client_id: string;
  client_name?: string;
  client_secret?: string;
  redirect_uris: string[];
  grant_types: string[];
  logo_uri?: string;
  scopes?: string[];
  [key: string]: unknown;
}

export interface OAuthClientSpec {
  client_name: string;
  redirect_uris: string[];
  scopes: string[];
  grant_types: string[];
  logo_uri?: string;
}

export interface ProductCatalogRow {
  id: string;
  display_name: string;
  client_id: string | null;
  enabled: boolean;
  logo_url: string | null;
  continue_urls: string[];
}

export interface CustomProviderConfig {
  provider_type: string;
  identifier: string;
  name: string;
  client_id: string;
  client_secret: string;
  issuer: string;
  scopes: string[];
  pkce_enabled: boolean;
  enabled: boolean;
}

// ─── Identity project client (GoTrue admin API) ─────────────────────

export class IdentityAdminClient {
  private baseUrl: string;
  private serviceKey: string;

  constructor(baseUrl: string, serviceKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.serviceKey = serviceKey;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      const url = `${this.baseUrl}/auth/v1${path}`;
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.serviceKey}`,
          apikey: this.serviceKey,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return {
          data: null,
          error: `HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`,
        };
      }
      const text = await res.text();
      let data: T;
      try {
        data = JSON.parse(text) as T;
      } catch {
        return { data: text as unknown as T, error: null };
      }
      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { data: null, error: `Network error: ${message}` };
    }
  }

  /** List all OAuth clients registered on the identity project. */
  async listOAuthClients(): Promise<{
    clients: GotrueOAuthClient[];
    error: string | null;
  }> {
    const { data, error } = await this.request<{
      clients: GotrueOAuthClient[];
    }>("GET", "/admin/oauth/clients");
    if (error) return { clients: [], error };
    return { clients: data?.clients ?? [], error: null };
  }

  /** Create a new OAuth client on the identity project. */
  async createOAuthClient(
    spec: OAuthClientSpec,
  ): Promise<{ client: GotrueOAuthClient | null; error: string | null }> {
    const { data, error } = await this.request<GotrueOAuthClient>(
      "POST",
      "/admin/oauth/clients",
      {
        client_name: spec.client_name,
        redirect_uris: spec.redirect_uris,
        scopes: spec.scopes,
        grant_types: spec.grant_types,
        logo_uri: spec.logo_uri ?? "",
      },
    );
    if (error) return { client: null, error };
    return { client: data, error: null };
  }

  /** Update an existing OAuth client. Returns the client_secret if rotated. */
  async updateOAuthClient(
    clientId: string,
    spec: Partial<OAuthClientSpec> & { rotate_secret?: boolean },
  ): Promise<{ client: GotrueOAuthClient | null; error: string | null }> {
    const body: Record<string, unknown> = { ...spec };
    if (spec.rotate_secret) {
      body.rotate_secret = true;
    }
    const { data, error } = await this.request<GotrueOAuthClient>(
      "PUT",
      `/admin/oauth/clients/${clientId}`,
      body,
    );
    if (error) return { client: null, error };
    return { client: data, error: null };
  }

  /** Delete an OAuth client. */
  async deleteOAuthClient(
    clientId: string,
  ): Promise<{ error: string | null }> {
    return this.request("DELETE", `/admin/oauth/clients/${clientId}`);
  }

  /** Supabase admin client for DB operations on the identity project. */
  getDbClient() {
    return createClient(this.baseUrl, this.serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
}

// ─── Product project client (custom provider management) ────────────

export class ProductAdminClient {
  private supabaseUrl: string;
  private serviceKey: string;
  private db: ReturnType<typeof createClient>;

  constructor(supabaseUrl: string, serviceKey: string) {
    this.supabaseUrl = supabaseUrl.replace(/\/$/, "");
    this.serviceKey = serviceKey;
    this.db = createClient(this.supabaseUrl, this.serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  /** Fetch current custom:zuiio provider config from the product project. */
  async getZuiioProvider(): Promise<{
    config: CustomProviderConfig | null;
    error: string | null;
  }> {
    // The custom provider config is stored in Supabase's auth.config or
    // accessible via the GoTrue admin API as /auth/v1/admin/custom_providers
    const { data, error } = await this.request<{
      providers?: Array<Record<string, unknown>>;
    }>("GET", "/admin/custom_providers");
    if (error) return { config: null, error };

    const providers = data?.providers ?? [];
    const zuiioProvider = providers.find(
      (p) =>
        String(p.identifier ?? "") === "custom:zuiio" ||
        String(p.provider_type ?? "") === "oidc",
    ) as unknown as CustomProviderConfig | undefined;

    return { config: zuiioProvider ?? null, error: null };
  }

  /** Create or update the custom:zuiio provider on the product project. */
  async upsertZuiioProvider(
    config: {
      client_id: string;
      client_secret: string;
      issuer: string;
      scopes?: string[];
    },
  ): Promise<{ error: string | null }> {
    const body = {
      provider_type: "oidc",
      identifier: "custom:zuiio",
      name: "Zuiio",
      client_id: config.client_id,
      client_secret: config.client_secret,
      issuer: config.issuer,
      scopes: config.scopes ?? ["openid", "profile", "email"],
      pkce_enabled: true,
      enabled: true,
    };

    // First try to update existing provider
    const existing = await this.getZuiioProvider();
    if (existing.config) {
      return this.request("PUT", `/admin/custom_providers/custom:zuiio`, body);
    }

    return this.request("POST", "/admin/custom_providers", body);
  }

  /** Fetch the auth config redirect URI allowlist. */
  async getUriAllowlist(): Promise<{
    uris: string[];
    error: string | null;
  }> {
    const { data, error } = await this.request<{
      uri_allow_list?: string[];
    }>("GET", "/config");
    if (error) return { uris: [], error };
    return { uris: data?.uri_allow_list ?? [], error: null };
  }

  // Internal request helper
  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      const url = `${this.supabaseUrl}/auth/v1${path}`;
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.serviceKey}`,
          apikey: this.serviceKey,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.status === 404) {
        // Endpoint not supported on this Supabase version
        return { data: null, error: null };
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return {
          data: null,
          error: `HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`,
        };
      }
      const text = await res.text();
      let data: T;
      try {
        data = JSON.parse(text) as T;
      } catch {
        return { data: text as unknown as T, error: null };
      }
      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { data: null, error: `Network error: ${message}` };
    }
  }
}

// ─── Resolution helpers ─────────────────────────────────────────────

/** Derive the Supabase auth callback URI for a product. */
export function resolveCallbackUri(supabaseUrl: string): string {
  const normalized = supabaseUrl.replace(/\/$/, "");
  return `${normalized}/auth/v1/callback`;
}

/** Extract the Supabase project ref from a project URL. */
export function extractProjectRef(supabaseUrl: string): string | null {
  const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? null;
}

/** Build the expected client config for a product. */
export function buildClientSpec(
  product: (typeof SSO_PRODUCTS)[number],
  callbackUri: string,
): OAuthClientSpec {
  return {
    client_name: product.displayName,
    redirect_uris: [callbackUri],
    scopes: ["openid", "profile", "email"],
    grant_types: ["authorization_code", "refresh_token"],
    logo_uri: product.logoUrl ?? "",
  };
}
