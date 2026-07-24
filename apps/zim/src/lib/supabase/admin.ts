import { createClient } from "@supabase/supabase-js";

/**
 * Admin client with the service_role key — bypasses RLS.
 * Server-only: Route Handlers, Server Components, server actions.
 * DO NOT expose to the browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } },
  );
}
