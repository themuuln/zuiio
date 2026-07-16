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

/**
 * Server-only Supabase client with service_role privileges.
 * Used for admin operations: provisioning, user management, OAuth client setup.
 * NEVER import this in client components or API routes that handle user input.
 */
export async function createAdminClient() {
  const { createClient: createSupabaseClient } = await import(
    "@supabase/supabase-js"
  );
  const { url } = getSupabaseEnv();
  const { getServiceRoleKey } = await import("./env");

  return createSupabaseClient(url, getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
