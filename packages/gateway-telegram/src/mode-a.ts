import type { SupabaseClient } from "@supabase/supabase-js";
import type {
	ChannelConnection,
	ResolutionResult,
} from "@zuiio/gateway-core";

export async function resolveOrgFromChatUser(
	supabase: SupabaseClient,
	chatId: number,
	userId: number,
): Promise<ResolutionResult> {
	const { data, error } = await supabase
		.from("telegram_links")
		.select("*")
		.eq("telegram_chat_id", chatId)
		.eq("telegram_user_id", userId)
		.eq("is_active", true)
		.order("last_active_at", { ascending: false })
		.limit(1)
		.single();
	if (error || !data) {
		throw new Error(
			"Таны Telegram холбогдоогүй байна. /start командыг ашиглана уу.",
		);
	}
	return {
		context: {
			externalOrganizationId: data.organization_id,
			userId: data.user_id ?? "",
			productType: data.product_type,
			audience: "internal",
			channel: "telegram",
			endpointId: String(data.id),
			conversationId: `legacy:telegram:${chatId}:${userId}`,
			channelChatId: String(data.telegram_chat_id),
			channelUserId: String(data.telegram_user_id),
			traceId: crypto.randomUUID(),
		},
		connection: data as unknown as ChannelConnection,
	};
}
