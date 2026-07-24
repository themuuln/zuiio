import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Creates a Supabase admin client using the service-role key.
 * Bypasses RLS — use ONLY in server-side admin pages / ops consoles.
 *
 * Local: reads SUPABASE_SERVICE_ROLE_KEY from .env.local
 * Production: auto-provisioned by Vercel Supabase integration
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL. " +
        "Run: supabase status -o env | grep SERVICE_ROLE_KEY",
    );
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
