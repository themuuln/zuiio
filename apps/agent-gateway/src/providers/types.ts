import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToolParam } from "@zuiio/ai-agent";
import { capture } from "@zuiio/capture";
import type { AgentAudience } from "@/gateway/types";

/**
 * Context injected into every tool execution by the gateway layer.
 * orgId is resolved from the (chat_id, user_id) mapping — NEVER from LLM output.
 */
export interface ToolContext {
	orgId: string;
	userId: string;
	supabase: SupabaseClient;
	/** Trusted product identity for durable tool replay. */
	productType?: string;
	/** Trusted audience — undefined means internal (backward compat). */
	audience?: AgentAudience;
	/** Channel identity for confirmation-gated writes (optional — legacy/test paths). */
	channel?: string;
	channelChatId?: string;
	channelUserId?: string;
	pageId?: string;
	pageAccessToken?: string;
	/** Trace identifier for durable payment correlation (optional). */
	traceId?: string;
	/** Skip staging when a persisted action is being replayed. */
	replaying?: boolean;
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
	/** Explicitly marks tools that mutate durable state. */
	write?: boolean;
	execute: (
		args: Record<string, unknown>,
		context: ToolContext,
	) => Promise<unknown>;
}

/**
 * Options for the LLM provider API call.
 */
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
