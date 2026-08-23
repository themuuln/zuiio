import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { GatewayContext } from "@zuiio/gateway-core";

/** Resolve one custom Telegram bot to a credential-free tenant context. */
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
	if (error || !data) return null;

	const { data: connection } = await supabase
		.from("channel_connections")
		.select("audience")
		.eq("bot_key", botKey)
		.eq("is_active", true)
		.maybeSingle();
	const audience = (connection?.audience ?? "customer") as
		| "internal"
		| "customer";

	return {
		externalOrganizationId: data.organization_id,
		userId: data.organization_id,
		productType: data.product_type as "tolom" | "zer",
		audience,
		channel: "telegram",
		endpointId: botKey,
		conversationId: `legacy:telegram:${botKey}`,
		channelChatId: "0",
		channelUserId: "0",
		traceId: crypto.randomUUID(),
	};
}
