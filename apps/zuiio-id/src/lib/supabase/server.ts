import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

export async function createClient() {
 const cookieStore = await cookies();
 const { anonKey, url } = getSupabaseEnv();

// In production, share cookies across all zuiiotech.com subdomains
// so that zer.zuiiotech.com, tolom.zuiiotech.com, id.zuiiotech.com
// all recognize the user's session.
const isProduction = process.env.NODE_ENV === "production";
const cookieDomain = isProduction ? ".zuiiotech.com" : undefined;

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
           cookieStore.set(name, value, {
             ...options,
             domain: cookieDomain ?? options.domain,
           });
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
