import { createClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client with service_role key.
 * Used by db.ts for backend CRUD operations.
 * Safe to use in Route Handlers and Server Components.
 * DO NOT expose this client to the browser.
 */
export function createAdminClient() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
	return createClient(url, serviceKey);
}
