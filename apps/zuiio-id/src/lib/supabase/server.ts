import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

export async function createClient() {
  const cookieStore = await cookies();
  const { anonKey, url } = getSupabaseEnv();

  // Production cookies are host-only — each Supabase project keeps its own session.
  // SSO seamlessness comes from redirect-based flows, not shared cookies.

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        try {
          return cookieStore.getAll();
        } catch {
          return [];
        }
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from Server Component — ignore
        }
      },
    },
  });
}

let _adminClient: SupabaseClient | null = null;

/**
 * Server-only Supabase client with service_role privileges.
 * Used for admin operations: provisioning, user management, OAuth client setup.
 * NEVER import this in client components or API routes that handle user input.
 *
 * Uses module-level singleton — safe in Node.js, avoids creating thousands of
 * client instances per minute under load.
 */
export function createAdminClient(): SupabaseClient {
  if (_adminClient) return _adminClient;

  const { createClient } = require("@supabase/supabase-js") as typeof import("@supabase/supabase-js");
  const { url } = getSupabaseEnv();
  const { getServiceRoleKey } = require("./env") as typeof import("./env");

  _adminClient = createClient(url, getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return _adminClient;
}
