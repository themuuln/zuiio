import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

/**
 * Supabase client using the service_role key.
 * Uses createClient (NOT @supabase/ssr) to avoid cookie-based auth
 * interference. The SSR createServerClient reads sb-*-auth-token cookies
 * and sends user JWT as Authorization header, which forces RLS to apply
 * as that user — defeating the purpose of the service_role key.
 *
 * Bypasses RLS — use ONLY in server-side contexts where the caller
 * is already authorized (e.g., signup bootstrap, admin operations).
 */
export async function createServiceRoleClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(env("NEXT_PUBLIC_SUPABASE_URL"), serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
