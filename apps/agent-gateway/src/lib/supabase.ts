import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Service-role Supabase client type — used across the gateway. */
export type ServiceClient = SupabaseClient;

/**
 * Creates a Supabase client with service_role privileges.
 * Used by curated tools for direct DB access.
 * Bypasses RLS — tools MUST filter by orgId.
 */
export function createServiceClient() {
	const url = process.env.SUPABASE_URL;
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!url || !key) {
		throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
	}

	return createClient(url, key, {
		auth: { persistSession: false },
	});
}

/**
 * Creates a Supabase client with agent_reader privileges.
 * Used by the runSQL tool only.
 * RLS is enforced. Cannot write.
 */
export function createReaderClient() {
	const url = process.env.SUPABASE_URL;
	const password = process.env.AGENT_READER_PASSWORD;

	if (!url || !password) {
		throw new Error("SUPABASE_URL and AGENT_READER_PASSWORD are required");
	}

	// Connect as agent_reader role via connection string
	const parsedUrl = new URL(url);
	parsedUrl.username = "agent_reader";
	parsedUrl.password = encodeURIComponent(password);

	return createClient(parsedUrl.toString(), "", {
		auth: { persistSession: false },
	});
}

/**
 * Creates a Supabase client with service_role privileges for Tolom's project.
 * Tolom has a separate Supabase project from Zer/agent-gateway.
 */
export function createTolomServiceClient() {
	const url = process.env.TOLOM_SUPABASE_URL;
	const key = process.env.TOLOM_SUPABASE_SERVICE_ROLE_KEY;

	if (!url || !key) {
		throw new Error(
			"TOLOM_SUPABASE_URL and TOLOM_SUPABASE_SERVICE_ROLE_KEY are required for Tolom queries",
		);
	}

	return createClient(url, key, {
		auth: { persistSession: false },
	});
}

let _tolomClient: ServiceClient | null = null;

/**
 * Returns the correct Supabase admin client for a given product type.
 * Zer and the gateway share one project; Tolom has its own.
 * Tolom client is lazily cached to avoid creating a new client per request.
 */
export function getSupabaseForProduct(productType: string): ServiceClient {
	if (productType === "tolom") {
		if (!_tolomClient) _tolomClient = createTolomServiceClient();
		return _tolomClient;
	}
	return createServiceClient();
}
