import type { SupabaseClient } from "@supabase/supabase-js";

/** Supported messaging channels. */
export type ChannelType = "telegram" | "messenger" | "instagram" | "whatsapp";

/** Supported product types. */
export type ProductType = "tolom" | "zer";

/** Resolved context for a gateway request. */
export interface GatewayContext {
	orgId: string;
	userId: string;
	productType: ProductType;
	// Legacy Telegram fields (used by mode-a, mode-b, agent-handler, webhook)
	chatId: number;
	telegramUserId: number;
	// New generic channel fields (used by Facebook/whatsapp integration)
	channel: ChannelType;
	channelChatId: string;
	channelUserId: string;
	pageId?: string;
	pageAccessToken?: string;
}

/** A channel connection record from channel_connections table. */
export interface ChannelConnection {
	id: string;
	organization_id: string;
	channel: ChannelType;
	channel_user_id: string;
	channel_chat_id: string;
	page_id?: string;
	page_name?: string;
	page_access_token?: string;
	token_expires_at?: string;
	product_type: ProductType;
	user_id?: string;
	bot_key?: string;
	is_active: boolean;
	webhook_subscribed_at?: string;
	last_user_message_at?: string;
	metadata?: Record<string, unknown>;
	created_at: string;
	updated_at: string;
}

/** Result of resolving a chat/user to an org. */
export interface ResolutionResult {
	context: GatewayContext;
	connection: ChannelConnection;
}

/** Legacy link record from telegram_links table (deprecated, use ChannelConnection). */
export interface LinkRecord {
	id: string;
	organization_id: string;
	user_id: string;
	telegram_chat_id: number;
	telegram_user_id: number;
	telegram_username?: string;
	first_name?: string;
	last_name?: string;
	notification_preferences?: Record<string, unknown>;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}
