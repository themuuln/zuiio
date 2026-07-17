import "server-only";
import { after } from "next/server";

import type { GatewayContext } from "@/gateway/types";
import { debug } from "@/lib/debug";
import { openAiConfig, openCodeGoConfig, validateConfig } from "@/lib/env";
import { sanitizeUserInput } from "@/lib/sanitize";
import { createServiceClient, type ServiceClient } from "@/lib/supabase";
import { GptMiniProvider } from "@/providers/gpt-mini";
import { OpenCodeGoProvider } from "@/providers/opencode-go";
import {
	AiGateway,
	type GatewayTool,
	type ToolContext,
} from "@/providers/types";
import { withAudit } from "@/state/audit";
import {
	checkDailyBudget,
	REQUEST_LIMITS,
	recordUsageAtomic,
} from "@/state/budget";
import { checkHandoffTriggers } from "@/state/handoff";
import {
	formatKnowledgeContext,
	type KnowledgeChunk,
	searchKnowledge,
} from "@/state/knowledge";
import { checkRateLimit, RATE_LIMITS } from "@/state/rate-limit";
import {
	loadSession,
	MAX_SESSION_MESSAGES,
	type SessionMessage,
	saveSession,
	summarizeIfNeeded,
} from "@/state/session";
import { clearWizardState, getWizardState } from "@/state/wizard";

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
	console.log(
		`[agent-handler] START org=${ctx.orgId} chat=${ctx.channelChatId} user=${ctx.channelUserId} channel=${ctx.channel} textLen=${text.length}`,
	);
	const timings: Record<string, number> = {};
	const pipelineStart = performance.now();
	const sb = getSb();
	const gateway = getGateway();
	const context: ToolContext = {
		orgId: ctx.orgId,
		userId: ctx.userId,
		supabase: opts.dataClient ?? sb,
	};

	// Check budget
	let t = performance.now();
	const budget = await checkDailyBudget(sb, ctx.orgId);
	timings.budget = Math.round(performance.now() - t);
	if (!budget.allowed) return budget.reason!;

	// Rate limiting
	t = performance.now();
	const rateLimit = await checkRateLimit(
		ctx.orgId,
		RATE_LIMITS.messagesPerMinute,
	);
	timings.rateLimit = Math.round(performance.now() - t);
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

	// Select tools — single-pass: audit logging + result truncation combined
	const rawTools = opts.getTools(context);
	const safeTools = rawTools.map((t) =>
		withAudit(t, ctx.channel, ctx.channelChatId, ctx.channelUserId, {
			truncate: true,
		}),
	);

	// Load context in parallel — session, prompt, knowledge, and wizard are independent
	t = performance.now();
	const [session, basePrompt, knowledgeChunks, wizardState] = await Promise.all(
		[
			loadSession(
				sb,
				ctx.orgId,
				ctx.channelChatId,
				ctx.channelUserId,
				ctx.channel,
			),
			opts.getSystemPrompt(ctx.productType, ctx.orgId, chatType, detectedLang),
			searchKnowledge(context.supabase, ctx.orgId, sanitizedText, {
				limit: 3,
			}).catch(() => [] as KnowledgeChunk[]),
			getWizardState(
				sb,
				ctx.orgId,
				ctx.channelChatId,
				ctx.channelUserId,
				ctx.channel,
			),
		],
	);
	timings.sessionLoad = Math.round(performance.now() - t);
	debug("agent", "session loaded", {
		messageCount: session.messages.length,
		tokenCount: session.tokenCount,
	});

	// Compose system prompt with knowledge and wizard context
	let systemPrompt = basePrompt;
	if (knowledgeChunks.length > 0) {
		systemPrompt += formatKnowledgeContext(knowledgeChunks);
	}
	if (wizardState) {
		systemPrompt += `\n\n## ACTIVE WIZARD\nYou are in the middle of a "${wizardState.type}" wizard (step ${wizardState.step}).\nThe user's next message is a response to your wizard question. Process it as step ${wizardState.step + 1} of the wizard.\nCollected data so far: ${JSON.stringify(wizardState.data)}\n\nWhen the wizard is complete (all steps done), respond with the result and include this marker at the end: [WIZARD_COMPLETE:${wizardState.type}]\nWhen the user wants to cancel the wizard, respond naturally and include: [WIZARD_CANCEL]`;
	}
	timings.contextLoad = Math.round(performance.now() - t);

	// LLM call
	t = performance.now();
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
	timings.llm = Math.round(performance.now() - t);
	debug("agent", "LLM call complete", {
		responseLen: response.length,
		preview: response.slice(0, 80),
	});

	// Check for wizard completion/cancel
	if (response.includes("[WIZARD_CANCEL]")) {
		await clearWizardState(
			sb,
			ctx.orgId,
			ctx.channelChatId,
			ctx.channelUserId,
			ctx.channel,
		);
	} else if (response.includes("[WIZARD_COMPLETE:")) {
		await clearWizardState(
			sb,
			ctx.orgId,
			ctx.channelChatId,
			ctx.channelUserId,
			ctx.channel,
		);
	}

	// Post-processing: session summarization and trimming
	t = performance.now();
	const CONTEXT_WINDOW_TOKENS = 12_000;
	const updatedMessages: SessionMessage[] = [
		...session.messages,
		{ role: "user" as const, content: sanitizedText },
		{ role: "assistant" as const, content: response ?? "" },
	];
	let finalMessages =
		(await summarizeIfNeeded(updatedMessages)) ?? updatedMessages;
	if (finalMessages.length > MAX_SESSION_MESSAGES) {
		finalMessages = finalMessages.slice(
			finalMessages.length - MAX_SESSION_MESSAGES,
		);
	}
	let totalTokens = finalMessages.reduce(
		(sum, m) => sum + Math.ceil((m.content?.length ?? 0) / 4),
		0,
	);
	while (finalMessages.length > 2 && totalTokens > CONTEXT_WINDOW_TOKENS) {
		const idx = finalMessages.findIndex((m) => m.role !== "system");
		if (idx < 0) break;
		const dropped = finalMessages.splice(idx, 1)[0]!;
		totalTokens -= Math.ceil((dropped.content?.length ?? 0) / 4);
	}
	const estimatedTokens = totalTokens;
	timings.postProcess = Math.round(performance.now() - t);

	timings.total = Math.round(performance.now() - pipelineStart);
	debug("agent", "pipeline timings", timings);

	// Persist session AFTER response is sent — after() extends serverless lifetime
	after(async () => {
		try {
			await Promise.all([
				saveSession(
					sb,
					ctx.orgId,
					ctx.channelChatId,
					ctx.channelUserId,
					finalMessages,
					estimatedTokens,
					ctx.channel,
				),
				recordUsageAtomic(
					sb,
					ctx.orgId,
					Math.ceil((sanitizedText.length + response.length) / 4),
				),
			]);
		} catch (err) {
			console.error("[agent-handler] after() save/usage failed:", err);
		}
	});

	return response;
}
