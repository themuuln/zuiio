import type { ToolParam } from "@zuiio/ai-agent";
import { capture } from "@zuiio/capture";

/** Supported messaging channels. */
export type ChannelType =
	| "telegram"
	| "messenger"
	| "instagram"
	| "whatsapp"
	| "webchat";

/** Supported product types. */
export type ProductType = "tolom" | "zer" | "zatly";

/** Trusted audience classification. */
export type AgentAudience = "internal" | "customer";

/** Knowledge visibility for stored sources. */
export type KnowledgeVisibility = "internal" | "customer" | "both";

/** A button in an inline keyboard or quick reply. */
export interface InlineButton {
	text: string;
	callbackData: string;
}

/** Options for sending a channel message. */
export interface SendMessageOptions {
	parseMode?: "HTML" | "Markdown";
	replyToMessageId?: number;
	quickReplies?: InlineButton[];
}

/** Credential-free messaging adapter. */
export interface Channel {
	sendMessage(
		chatId: number | string,
		text: string,
		options?: SendMessageOptions,
	): Promise<boolean>;
	sendInlineKeyboard(
		chatId: number | string,
		text: string,
		buttons: InlineButton[][],
	): Promise<void>;
	answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void>;
	editMessageText(
		chatId: number | string,
		messageId: number,
		text: string,
	): Promise<void>;
	sendDocument?(
		chatId: number | string,
		fileBuffer: Buffer,
		filename: string,
		caption?: string,
	): Promise<void>;
}

/** Incoming message normalized by a channel boundary. */
export interface IncomingMessage {
	chatId: number | string;
	userId: number | string;
	channel: ChannelType;
	text?: string;
	callbackQuery?: {
		id: string;
		data: string;
		messageId: number;
	};
	voiceFileId?: string;
	pageId?: string;
}

/** Credential-free, tenant-resolved request context. */
export interface GatewayContext {
	externalOrganizationId: string;
	userId: string;
	productType: ProductType;
	audience: AgentAudience;
	channel: ChannelType;
	endpointId: string;
	conversationId: string;
	channelChatId: string;
	channelUserId: string;
	traceId: string;
}

/** Credential-free context passed to product tools. */
export interface ToolContext {
	externalOrganizationId: string;
	userId: string;
	productType: ProductType;
	audience: AgentAudience;
	conversationId: string;
	traceId: string;
}

/** A message that is safe to persist and deliver later. */
export interface OutboundIntent {
	conversationId: string;
	kind: "text" | "quick_replies";
	text: string;
	quickReplies?: InlineButton[];
	sourceEventId: string | null;
	traceId: string;
}

/** Product-owned tool metadata. */
export interface ToolDescriptor {
	name: string;
	description: string;
	parameters: ToolParam[];
	effect: "read" | "write";
	approval: "none" | "required";
}

/** Product tool invocation sent across a signed service boundary. */
export interface ProductToolExecution {
	context: ToolContext;
	toolName: string;
	args: Record<string, unknown>;
	idempotencyKey: string | null;
}

/** Executable tool used by an AI provider. */
export interface GatewayTool extends ToolDescriptor {
	execute(
		args: Record<string, unknown>,
		context: ToolContext,
	): Promise<unknown>;
}

/** Versioned product-owned agent contract. */
export interface ProductAgentManifest {
	version: string;
	systemPrompt: string;
	tools: ToolDescriptor[];
}

/** Boundary between the gateway and one product. */
export interface ProductAdapter {
	getManifest(context: ToolContext): Promise<ProductAgentManifest>;
	executeTool(input: ProductToolExecution): Promise<unknown>;
}

/** Legacy channel connection record used by non-Meta channels. */
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
	visibility?: KnowledgeVisibility;
	created_at: string;
	updated_at: string;
}

/** Result of resolving a non-Meta channel identity. */
export interface ResolutionResult {
	context: GatewayContext;
	connection: ChannelConnection;
}

/** Legacy Telegram link record. */
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

/** Options for a provider API call. */
export interface ProviderOptions {
	apiKey: string;
	baseUrl?: string;
	model?: string;
}

/** AI provider contract. */
export interface AiProvider {
	runWithTools(params: {
		system: string;
		userMessage: string;
		images?: string[];
		tools: GatewayTool[];
		context: ToolContext;
		maxRounds?: number;
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

/** Provider dispatcher with one fallback. */
export class AiGateway {
	constructor(
		private primary: AiProvider,
		private fallback?: AiProvider,
	) {}

	private isRateLimitError(error: unknown): boolean {
		if (!(error instanceof Error)) return false;
		return /\b429\b/.test(error.message) ||
			/rate.?limit|usage.?limit|quota/i.test(error.message);
	}

	async runWithTools(
		params: Parameters<AiProvider["runWithTools"]>[0],
	): Promise<string> {
		try {
			return await this.primary.runWithTools(params);
		} catch (error) {
			if (this.isRateLimitError(error)) {
				capture(error, { context: "agent-gateway: rate limit" });
				return "⚠️ Үйлчилгээний хэрэглээ хязгаарт хүрсэн байна. Түр хүлээгээд дахин оролдоно уу.";
			}
			if (this.fallback) {
				capture(error, { context: "agent-gateway: provider fallback" });
				return await this.fallback.runWithTools(params);
			}
			throw error;
		}
	}
}
