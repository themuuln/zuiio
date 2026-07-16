import "server-only";
import { after } from "next/server";

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
	summarizeIfNeeded,
	type SessionMessage,
} from "@/state/session";
import {
	getWizardState,
	saveWizardState,
	clearWizardState,
} from "@/state/wizard";

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
		lang?: string,
	) => Promise<string>;
	/** Get tools for the product type and context. */
	getTools: (context: ToolContext) => GatewayTool[];
	/** Product-specific Supabase client. If omitted, uses the default Zer client. */
	dataClient?: ServiceClient;
	/** Called with each token chunk when streaming is enabled. */
	onToken?: (token: string) => void;
}

/**
 * Handle a text, voice, or photo message from any bot mode.
 * Requires a pre-resolved GatewayContext (orgId, userId, productType already known).
 */
export async function handleAgentMessage(
	ctx: GatewayContext,
	text: string,
	chatType: string,
	opts: AgentHandlerOptions,
	images?: string[],
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

	// Detect language: Cyrillic → Mongolian, Latin → English
	const isCyrillic = /[\u0400-\u04FF]/.test(sanitizedText);
	const detectedLang = isCyrillic ? "mn" : "en";

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
	let systemPrompt = await opts.getSystemPrompt(ctx.productType, ctx.orgId, chatType, detectedLang);
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
	// Check for active wizard state
	const wizardState = await getWizardState(sb, ctx.orgId, ctx.channelChatId, ctx.channelUserId, ctx.channel);
	if (wizardState) {
		systemPrompt += `\n\n## ACTIVE WIZARD\nYou are in the middle of a "${wizardState.type}" wizard (step ${wizardState.step}).\nThe user's next message is a response to your wizard question. Process it as step ${wizardState.step + 1} of the wizard.\nCollected data so far: ${JSON.stringify(wizardState.data)}\n\nWhen the wizard is complete (all steps done), respond with the result and include this marker at the end: [WIZARD_COMPLETE:${wizardState.type}]\nWhen the user wants to cancel the wizard, respond naturally and include: [WIZARD_CANCEL]`;
	}

const response = await gateway.runWithTools({
	system: systemPrompt,
	userMessage: sanitizedText,
	images,
	tools: safeTools,
	context,
	maxRounds: REQUEST_LIMITS.maxToolRounds,
	onToken: opts.onToken,
	conversationHistory:
		session.messages.length > 0 ? session.messages : undefined,
});
	debug("agent", "LLM call complete", { responseLen: response.length, preview: response.slice(0, 80) });
	// Check for wizard completion/cancel
	if (response.includes("[WIZARD_CANCEL]")) {
		await clearWizardState(sb, ctx.orgId, ctx.channelChatId, ctx.channelUserId, ctx.channel);
	} else if (response.includes("[WIZARD_COMPLETE:")) {
		await clearWizardState(sb, ctx.orgId, ctx.channelChatId, ctx.channelUserId, ctx.channel);
	}

	// Save session — summarize old messages, then trim by token budget
	// DeepSeek: ~16k context, GPT-4o-mini: ~128k — use conservative limit
	const CONTEXT_WINDOW_TOKENS = 12_000;
	const updatedMessages: SessionMessage[] = [
		...session.messages,
		{ role: "user" as const, content: sanitizedText },
		{ role: "assistant" as const, content: response ?? "" },
	];
	// Step 1: Try summarization if messages are getting long
	let finalMessages = await summarizeIfNeeded(updatedMessages) ?? updatedMessages;
	// Step 2: Hard trim by message count (safety net)
	if (finalMessages.length > MAX_SESSION_MESSAGES) {
		finalMessages = finalMessages.slice(finalMessages.length - MAX_SESSION_MESSAGES);
	}
	// Step 3: Trim by token budget — drop oldest non-system messages until under limit
	let totalTokens = finalMessages.reduce(
		(sum, m) => sum + Math.ceil((m.content?.length ?? 0) / 4),
		0,
	);
	while (finalMessages.length > 2 && totalTokens > CONTEXT_WINDOW_TOKENS) {
		// Never drop system messages (summaries)
		const idx = finalMessages.findIndex((m) => m.role !== "system");
		if (idx < 0) break;
		const dropped = finalMessages.splice(idx, 1)[0]!;
		totalTokens -= Math.ceil((dropped.content?.length ?? 0) / 4);
	}
	const estimatedTokens = totalTokens;
	// Persist session AFTER response is sent — after() extends serverless lifetime
	after(async () => {
		try {
			await Promise.all([
				saveSession(sb, ctx.orgId, ctx.channelChatId, ctx.channelUserId, finalMessages, estimatedTokens, ctx.channel),
				recordUsageAtomic(sb, ctx.orgId, Math.ceil((sanitizedText.length + response.length) / 4)),
			]);
		} catch (err) {
			console.error("[agent-handler] after() save/usage failed:", err);
		}
	});

	return response;
}
