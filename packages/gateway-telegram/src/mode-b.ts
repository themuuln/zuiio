import type { SupabaseClient } from "@supabase/supabase-js";
import type { GatewayContext } from "@zuiio/gateway-core";

/**
 * Mode B resolver — custom bot per organization.
 *
 * Custom bots are pre-mapped to an org via the custom_bots table.
 * No QR linking needed — the bot IS the organization.
 *
 * Resolution by `botKey` (opaque UUID that maps to custom_bots.id).
 */
export async function resolveOrgFromBotKey(
	supabase: SupabaseClient,
	botKey: string,
): Promise<GatewayContext | null> {
	const { data, error } = await supabase
		.from("custom_bots")
		.select("organization_id, product_type")
		.eq("id", botKey)
		.eq("is_active", true)
		.single();

	if (error || !data) {
		return null;
	}

	// Resolve audience from channel_connections (default "customer")
	const { data: conn } = await supabase
		.from("channel_connections")
		.select("audience")
		.eq("bot_key", botKey)
		.eq("is_active", true)
		.maybeSingle();

	const audience = (conn?.audience ?? "customer") as "internal" | "customer";

	return {
		orgId: data.organization_id,
		userId: data.organization_id,
		productType: data.product_type as "tolom" | "zer",
		audience,
		channel: "telegram",
		channelChatId: "0",
		channelUserId: "0",
	};
}
