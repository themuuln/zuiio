import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResolutionResult } from "./types";

/**
 * Resolves a (chatId, userId) pair to an org context (Mode A — shared bot).
 * Queries telegram_links table for Telegram links.
 * Only returns active connections. Supports exactly one active connection per (chat, user) pair.
 * Throws a user-friendly Mongolian error if no active connection exists.
 */
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
			orgId: data.organization_id,
			userId: data.user_id ?? "",
			productType: data.product_type,
			chatId: Number(data.telegram_chat_id),
			telegramUserId: Number(data.telegram_user_id),
			channel: "telegram",
			channelChatId: String(data.telegram_chat_id),
			channelUserId: String(data.telegram_user_id),
		},
		connection: data as unknown as import("./types").ChannelConnection,
	};
}
