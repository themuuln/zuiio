import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToolParam } from "@zuiio/ai-agent";
import { capture } from "@zuiio/capture";

// ─── Channel Types ──────────────────────────────────────────────────────────

/** Supported messaging channels. */
export type ChannelType = "telegram" | "messenger" | "instagram" | "whatsapp";

/** Supported product types. */
export type ProductType = "tolom" | "zer" | "zatly";

/** A button in an inline keyboard / quick reply. */
export interface InlineButton {
	text: string;
	callbackData: string;
}

/** Options for sending a message. */
export interface SendMessageOptions {
	parseMode?: "HTML" | "Markdown";
	replyToMessageId?: number;
	/** Channel-specific: Messenger quick replies, Instagram quick replies */
	quickReplies?: InlineButton[];
}

/**
 * Generic channel adapter interface.
 *
 * Each messaging channel plugin (Telegram, Facebook, WhatsApp) implements
 * this interface to provide a uniform sending API to the gateway middleware.
 */
export interface Channel {
	/** Page credentials for Meta channels (Messenger/Instagram). Optional for Telegram. */
	pageId?: string;
	pageAccessToken?: string;

	/** Send a plain text message. */
	sendMessage(
		chatId: number | string,
		text: string,
		options?: SendMessageOptions,
	): Promise<void>;

	/** Send a message with inline keyboard buttons. */
	sendInlineKeyboard(
		chatId: number | string,
		text: string,
		buttons: InlineButton[][],
	): Promise<void>;

	/** Respond to a callback query (button tap). No-op for channels without callbacks. */
	answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void>;

	/** Edit a message's text. No-op for channels without editing. */
	editMessageText(
		chatId: number | string,
		messageId: number,
		text: string,
	): Promise<void>;

	/** Send a document/file. Optional — not all channels support it. */
	sendDocument?(
		chatId: number | string,
		fileBuffer: Buffer,
		filename: string,
		caption?: string,
	): Promise<void>;
}

/** Incoming message from any channel — normalized by the webhook handler. */
export interface IncomingMessage {
	/** Channel-specific ID: number for Telegram, string for FB/IG */
	chatId: number | string;
	/** Channel-specific user ID: number for Telegram, string for FB/IG */
	userId: number | string;
	/** The messaging channel */
	channel: ChannelType;
	text?: string;
	/** If this is a callback query response (button tap) — Telegram only */
	callbackQuery?: {
		id: string;
		data: string;
		messageId: number;
	};
	/** Voice file ID if the message contains voice */
	voiceFileId?: string;
	/** FB/IG: page ID that received the message */
	pageId?: string;
	/** FB/IG: page access token for sending replies */
	pageAccessToken?: string;
}

// ─── Gateway Context Types ──────────────────────────────────────────────────

/** Trusted audience classification — resolved from DB, never from LLM output. */
export type AgentAudience = "internal" | "customer";

/** Knowledge visibility — which audiences can retrieve this source. */
export type KnowledgeVisibility = "internal" | "customer" | "both";

/** Resolved context for a gateway request. */
export interface GatewayContext {
	orgId: string;
	/** Trusted audience — internal (staff) or customer (public). */
	audience: AgentAudience;
	userId: string;
	productType: ProductType;
	/** Generic channel fields (used by all channels). */
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
	/** Knowledge visibility for this source. */
	visibility?: KnowledgeVisibility;
	created_at: string;
	updated_at: string;
}

/** Result of resolving a chat/user to an org. */
export interface ResolutionResult {
	context: GatewayContext;
	connection: ChannelConnection;
}

// ─── Tool & Provider Types ──────────────────────────────────────────────────

/**
 * Context injected into every tool execution by the gateway layer.
 * orgId is resolved from the (chat_id, user_id) mapping — NEVER from LLM output.
 */
export interface ToolContext {
	orgId: string;
	userId: string;
	audience: AgentAudience;
	supabase: SupabaseClient;
}

/**
 * Enhanced tool for the gateway.
 * Same parameter format as @zuiio/ai-agent Tool, but execute() receives
 * context (orgId, userId, supabase) from the gateway layer.
 *
 * The tool MUST filter database queries by context.orgId.
 * The gateway guarantees this value is the resolved tenant.
 */
export interface GatewayTool {
	name: string;
	description: string;
	parameters: ToolParam[];
	execute: (
		args: Record<string, unknown>,
		context: ToolContext,
	) => Promise<unknown>;
}

/** Options for the LLM provider API call. */
export interface ProviderOptions {
	apiKey: string;
	baseUrl?: string;
	model?: string;
}

/**
 * AI Provider interface.
 * Each provider OWNS the multi-turn tool-calling loop.
 * The gateway is a thin dispatcher with fallback.
 */
export interface AiProvider {
	/**
	 * Multi-turn tool-calling conversation.
	 * Provider sends messages, parses tool calls, executes tools with context,
	 * appends results, repeats until no more tool calls or maxRounds reached.
	 */
	runWithTools(params: {
		system: string;
		userMessage: string;
		images?: string[];
		tools: GatewayTool[];
		context: ToolContext;
		maxRounds?: number;
		/** Called with each token chunk when streaming is enabled. */
		onToken?: (token: string) => void;
		conversationHistory?: Array<{
			role: "system" | "user" | "assistant" | "tool";
			content: string | null;
			tool_calls?: Array<{
				id: string;
				type: "function";
				function: { name: string; arguments: string };
			}>;
			tool_call_id?: string;
		}>;
	}): Promise<string>;
}

/**
 * Gateway-level dispatcher with fallback.
 * If primary provider fails, retries on fallback provider.
 */
export class AiGateway {
	constructor(
		private primary: AiProvider,
		private fallback?: AiProvider,
	) {}

	/**
	 * Detect rate-limit errors (HTTP 429) from providers.
	 * Returns a user-facing Mongolian message when the API quota is exhausted.
	 */
	private isRateLimitError(err: unknown): boolean {
		if (!(err instanceof Error)) return false;
		const msg = err.message;
		return /\b429\b/.test(msg) || /rate.?limit|usage.?limit|quota/i.test(msg);
	}

	async runWithTools(
		params: Parameters<AiProvider["runWithTools"]>[0],
	): Promise<string> {
		try {
			return await this.primary.runWithTools(params);
		} catch (err) {
			console.error(`[AiGateway] provider error:`, err);
			if (this.isRateLimitError(err)) {
				capture(err, { context: "agent-gateway: rate limit" });
				return "⚠️ Үйлчилгээний хэрэглээ хязгаарт хүрсэн байна. Түр хүлээгээд дахин оролдоно уу.";
			}
			if (this.fallback) {
				capture(err, { context: "agent-gateway: provider fallback" });
				return await this.fallback.runWithTools(params);
			}
			throw err;
		}
	}
}
