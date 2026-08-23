import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type GatewayControlClient = SupabaseClient<any, any, "gateway", any>;

/** Service-role client for the isolated gateway control-plane project. */
export function createGatewayControlClient(): GatewayControlClient {
	const url = process.env.GATEWAY_SUPABASE_URL;
	const key = process.env.GATEWAY_SUPABASE_SECRET_KEY;
	if (!url || !key) {
		throw new Error(
			"GATEWAY_SUPABASE_URL and GATEWAY_SUPABASE_SECRET_KEY are required",
		);
	}
	return createClient(url, key, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
			detectSessionInUrl: false,
		},
		db: { schema: "gateway" },
		global: { headers: { "x-zuiio-control-plane": "gateway" } },
	});
}
