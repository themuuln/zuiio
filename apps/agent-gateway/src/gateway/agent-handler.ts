import "server-only";

import type { GatewayContext } from "@/gateway/types";
import { openCodeGoConfig, openAiConfig, validateConfig } from "@/lib/env";
import { sanitizeUserInput, truncateResult } from "@/lib/sanitize";
import { createServiceClient, type ServiceClient } from "@/lib/supabase";
import { debug } from "@/lib/debug";
import { OpenCodeGoProvider } from "@/providers/opencode-go";
import { GptMiniProvider } from "@/providers/gpt-mini";
import {
	AiGateway,
	type GatewayTool,
	type ToolContext,
} from "@/providers/types";
import { checkHandoffTriggers } from "@/state/handoff";
import { formatKnowledgeContext, searchKnowledge } from "@/state/knowledge";
import { withAudit } from "@/state/audit";
import {
	checkDailyBudget,
	REQUEST_LIMITS,
	recordUsageAtomic,
} from "@/state/budget";
import { checkRateLimit, RATE_LIMITS } from "@/state/rate-limit";
import {
	loadSession,
	MAX_SESSION_MESSAGES,
	saveSession,
} from "@/state/session";

/** Shared gateway instance (lazy singleton). */
let _gateway: AiGateway | null = null;
function getGateway(): AiGateway {
	if (!_gateway) {
		validateConfig();
		const primary = new OpenCodeGoProvider(openCodeGoConfig());
		const fallbackCfg = openAiConfig();
		_gateway = fallbackCfg
			? new AiGateway(primary, new GptMiniProvider(fallbackCfg))
			: new AiGateway(primary);
	}
	return _gateway;
}

let _sb: ServiceClient | null = null;
function getSb() {
	if (!_sb) _sb = createServiceClient();
	return _sb;
}

export interface AgentHandlerOptions {
	/** Get system prompt for the product type and chat type. */
	getSystemPrompt: (
		productType: string,
		orgId: string,
		chatType: string,
	) => Promise<string>;
	/** Get tools for the product type and context. */
	getTools: (context: ToolContext) => GatewayTool[];
	/** Product-specific Supabase client. If omitted, uses the default Zer client. */
	dataClient?: ServiceClient;
	/** Called with each token chunk when streaming is enabled. */
	onToken?: (token: string) => void;
}

/**
 * Handle a text or voice-transcribed message from any bot mode.
 * Requires a pre-resolved GatewayContext (orgId, userId, productType already known).
 */
export async function handleAgentMessage(
	ctx: GatewayContext,
	text: string,
	chatType: string,
	opts: AgentHandlerOptions,
	): Promise<string> {
	console.log(`[agent-handler] START org=${ctx.orgId} chat=${ctx.channelChatId} user=${ctx.channelUserId} channel=${ctx.channel} textLen=${text.length}`);
	const sb = getSb();
	const gateway = getGateway();
	const context: ToolContext = {
		orgId: ctx.orgId,
		userId: ctx.userId,
		supabase: opts.dataClient ?? sb,
	};

	// Check budget
	const budget = await checkDailyBudget(sb, ctx.orgId);
	if (!budget.allowed) return budget.reason!;

	// Rate limiting
	const rateLimit = checkRateLimit(ctx.orgId, RATE_LIMITS.messagesPerMinute);
	if (!rateLimit.allowed) {
		return `⏳ Хэт олон хүсэлт илгээсэн байна. ${Math.ceil(rateLimit.resetInMs / 1000)} секундын дараа дахин оролдоно уу.`;
	}

	const sanitizedText = sanitizeUserInput(text);

	// Check handoff triggers — if user wants a human, escalate immediately
	const handoff = checkHandoffTriggers(sanitizedText, {
		sentimentEnabled: true,
	});
	if (handoff.triggered) {
		return `🔄 Таны хүсэлтийг хүлээн авлаа. Ойрын хугацаанд манай ажилтан тантай холбогдох болно.\n\nШалтгаан: ${handoff.reason}`;
	}

	// Select tools
	const rawTools = opts.getTools(context);
	const tools = rawTools.map((t) =>
		withAudit(t, ctx.channel, ctx.channelChatId, ctx.channelUserId),
	);
	// Wrap tools with result truncation to prevent context window overflow
	const safeTools = tools.map((t) => ({
		...t,
		execute: async (
			args: Record<string, unknown>,
			tctx: ToolContext,
		): Promise<unknown> => {
			const result = await t.execute(args, tctx);
			if (typeof result === "string") return truncateResult(result);
			return result;
		},
	}));

	// Load conversation history
	const session = await loadSession(sb, ctx.orgId, ctx.channelChatId, ctx.channelUserId, ctx.channel);
	debug("agent", "session loaded", { messageCount: session.messages.length, tokenCount: session.tokenCount });

	// Search knowledge base for relevant context
	let systemPrompt = await opts.getSystemPrompt(ctx.productType, ctx.orgId, chatType);
	try {
		const knowledgeChunks = await searchKnowledge(context.supabase, ctx.orgId, sanitizedText, {
			limit: 3,
		});
		if (knowledgeChunks.length > 0) {
			systemPrompt += formatKnowledgeContext(knowledgeChunks);
		}
	} catch {
		// Knowledge search is non-critical — continue without it
	}

	const response = await gateway.runWithTools({
		system: systemPrompt,
		userMessage: sanitizedText,
		tools: safeTools,
		context,
		maxRounds: REQUEST_LIMITS.maxToolRounds,
		onToken: opts.onToken,
	conversationHistory:
			session.messages.length > 0 ? session.messages : undefined,
	});
	debug("agent", "LLM call complete", { responseLen: response.length, preview: response.slice(0, 80) });

	// Save session — prune by both message count AND token budget
	// DeepSeek: ~16k context, GPT-4o-mini: ~128k — use conservative limit
	const CONTEXT_WINDOW_TOKENS = 12_000;
	const updatedMessages = [
		...session.messages,
		{ role: "user" as const, content: sanitizedText },
		{ role: "assistant" as const, content: response },
	];
	// First: trim by message count
	let trimmed =
		updatedMessages.length > MAX_SESSION_MESSAGES
			? updatedMessages.slice(updatedMessages.length - MAX_SESSION_MESSAGES)
			: updatedMessages;
	// Then: trim by token budget — drop oldest messages until under limit
	let totalTokens = trimmed.reduce(
		(sum, m) => sum + Math.ceil((m.content?.length ?? 0) / 4),
		0,
	);
	while (trimmed.length > 2 && totalTokens > CONTEXT_WINDOW_TOKENS) {
		const dropped = trimmed.shift()!;
		totalTokens -= Math.ceil((dropped.content?.length ?? 0) / 4);
	}
	const estimatedTokens = totalTokens;
	// Fire and forget — don't block the response
	Promise.all([
		saveSession(sb, ctx.orgId, ctx.channelChatId, ctx.channelUserId, trimmed, estimatedTokens, ctx.channel),
		recordUsageAtomic(sb, ctx.orgId, Math.ceil((sanitizedText.length + response.length) / 4)),
	]).catch((err) => {
		console.error("[agent-handler] background save/usage failed:", err);
	});

	return response;
}
