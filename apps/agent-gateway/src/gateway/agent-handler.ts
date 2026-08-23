import "server-only";
import { capture } from "@zuiio/capture";
import { after } from "next/server";

import { TelegramChannel } from "@zuiio/gateway-telegram";
import type { GatewayContext } from "@zuiio/gateway-core";
import { debug } from "@/lib/debug";
import { toToolContext, type ToolDependencies } from "@/gateway/tool-dependencies";
import { openAiConfig, openCodeGoConfig, validateConfig } from "@/lib/env";
import { sanitizeUserInput } from "@/lib/sanitize";
import { createServiceClient, type ServiceClient } from "@/lib/supabase";
import { GptMiniProvider } from "@/providers/gpt-mini";
import { OpenCodeGoProvider } from "@/providers/opencode-go";
import {
	AiGateway,
	type GatewayTool,
	type ToolContext,
} from "@zuiio/gateway-core";
import { formatProfileContext, loadAgentProfile } from "@/state/agent-profile";
import { withAudit } from "@/state/audit";
import {
	checkDailyBudget,
	REQUEST_LIMITS,
	recordUsageAtomic,
} from "@/state/budget";
import { scoreConfidence } from "@/state/confidence";
import {
	checkHandoffTriggers,
	getActiveHandoff,
	getHandoffConfig,
	type HandoffConfig,
	triggerHandoff,
} from "@/state/handoff";
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

/**
 * Escalate a conversation to a human: insert the handoff event, notify the org
 * admin on Telegram when configured, and return the canned reply.
 * Never throws — escalation failure must not break the user flow.
 */
async function escalateToHuman(
	sb: ServiceClient,
	ctx: GatewayContext,
	handoffConfig: HandoffConfig | null,
	reason: string,
	escalatedBy: "keyword" | "intent" | "sentiment" | "agent",
	customerQuery: string,
	botResponse: string,
): Promise<string> {
	try {
		const chatId = Number(ctx.channelChatId) || 0;
		const userId = Number(ctx.channelUserId) || 0;
		const event = await triggerHandoff(sb, {
			orgId: ctx.externalOrganizationId,
			chatId,
			userId,
			reason,
			escalatedBy,
			customerQuery,
			botResponse,
			adminChatId: handoffConfig?.adminChatId ?? undefined,
		});

		const adminChatId = handoffConfig?.adminChatId;
		if (adminChatId) {
			try {
				const tg = new TelegramChannel();
				await tg.sendMessage(
					adminChatId,
					`🛎 <b>Шинэ хүсэлт</b>\n\n` +
						`Шалтгаан: ${reason}\n` +
						`Хэрэглэгч: ${customerQuery.slice(0, 200)}\n\n` +
						`ID: ${event.id}`, // resolvable from the dashboard inbox
				);
			} catch (err) {
				capture(err, { context: "agent-gateway: handoff admin notify" });
			}
		}
	} catch (err) {
		capture(err, { context: "agent-gateway: handoff trigger" });
	}

	return `🔄 Таны хүсэлтийг хүлээн авлаа. Ойрын хугацаанд манай ажилтан тантай холбогдох болно.\n\nШалтгаан: ${reason}`;
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
	getTools: (context: ToolDependencies) => GatewayTool[];
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
		`[agent-handler] START org=${ctx.externalOrganizationId} chat=${ctx.channelChatId} user=${ctx.channelUserId} channel=${ctx.channel} textLen=${text.length}`,
	);
	const timings: Record<string, number> = {};
	const pipelineStart = performance.now();
	const sb = getSb();
	const dataClient = opts.dataClient ?? sb;
	const gateway = getGateway();
	const toolDependencies: ToolDependencies = {
		supabase: dataClient,
		externalOrganizationId: ctx.externalOrganizationId,
		userId: ctx.userId,
		productType: ctx.productType,
		audience: ctx.audience,
		channel: ctx.channel,
		channelChatId: ctx.channelChatId,
		channelUserId: ctx.channelUserId,
		conversationId: ctx.conversationId,
		traceId: ctx.traceId,
	};
	const context: ToolContext = toToolContext(toolDependencies);

	// Check budget
	let t = performance.now();
	const budget = await checkDailyBudget(sb, ctx.externalOrganizationId);
	timings.budget = Math.round(performance.now() - t);
	if (!budget.allowed) return budget.reason!;

	// Rate limiting
	t = performance.now();
	const rateLimit = await checkRateLimit(
		ctx.externalOrganizationId,
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
	const [handoffConfig, activeHandoff] = await Promise.all([
		getHandoffConfig(sb, ctx.externalOrganizationId).catch(() => null),
		getActiveHandoff(sb, ctx.externalOrganizationId, Number(ctx.channelChatId) || 0).catch(
			() => null,
		),
	]);
	const handoff = checkHandoffTriggers(sanitizedText, {
		keywordTriggers: handoffConfig?.keywordTriggers ?? [],
		sentimentEnabled: handoffConfig?.sentimentEnabled ?? true,
	});
	if (handoff.triggered) {
		// Already escalated — don't create duplicate events.
		if (activeHandoff) {
			return `🔄 Таны хүсэлтийг хүлээн авсан байна. Ойрын хугацаанд манай ажилтан тантай холбогдох болно.`;
		}
		return escalateToHuman(
			sb,
			ctx,
			handoffConfig,
			handoff.reason ?? "Handoff requested",
			handoff.by ?? "keyword",
			sanitizedText,
			"",
		);
	}

	// Select tools — single-pass: audit logging + result truncation combined,
	// plus a collector that remembers the last tool result for confidence scoring.
	let lastToolName: string | undefined;
	let lastToolResult: unknown;
	const rawTools = opts.getTools(toolDependencies);
	const safeTools = rawTools.map((t) => {
		const audited = withAudit(
			t,
			{
				supabase: dataClient,
				externalOrganizationId: ctx.externalOrganizationId,
				channel: ctx.channel,
				channelChatId: ctx.channelChatId,
				channelUserId: ctx.channelUserId,
			},
			{ truncate: true },
		);
		return {
			...audited,
			execute: async (args: Record<string, unknown>, execCtx: ToolContext) => {
				const result = await audited.execute(args, execCtx);
				lastToolName = t.name;
				lastToolResult = result;
				return result;
			},
		};
	});

	// Load context in parallel — session, prompt, profile, knowledge, and wizard
	// are independent
	t = performance.now();
	const [session, basePrompt, profile, knowledgeChunks, wizardState] =
		await Promise.all([
			loadSession(
				sb,
				ctx.externalOrganizationId,
				ctx.channelChatId,
				ctx.channelUserId,
				ctx.channel,
			),
			opts.getSystemPrompt(ctx.productType, ctx.externalOrganizationId, chatType, detectedLang),
			// Audience-scoped org profile (personality/instructions) — never throws.
			loadAgentProfile(
				dataClient,
				ctx.externalOrganizationId,
				ctx.audience ?? "internal",
			).catch(() => null),
			searchKnowledge(dataClient, ctx.externalOrganizationId, sanitizedText, {
				limit: 3,
				audience: ctx.audience ?? "internal",
			}).catch(() => [] as KnowledgeChunk[]),
			getWizardState(
				sb,
				ctx.externalOrganizationId,
				ctx.channelChatId,
				ctx.channelUserId,
				ctx.channel,
			),
		]);
	timings.sessionLoad = Math.round(performance.now() - t);
	debug("agent", "session loaded", {
		messageCount: session.messages.length,
		tokenCount: session.tokenCount,
	});

	// Compose system prompt: base → profile → knowledge → wizard
	let systemPrompt = basePrompt;
	if (profile) {
		const profileContext = formatProfileContext(profile);
		if (profileContext) {
			systemPrompt += `\n\n${profileContext}`;
		}
	}
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
			ctx.externalOrganizationId,
			ctx.channelChatId,
			ctx.channelUserId,
			ctx.channel,
		);
	} else if (response.includes("[WIZARD_COMPLETE:")) {
		await clearWizardState(
			sb,
			ctx.externalOrganizationId,
			ctx.channelChatId,
			ctx.channelUserId,
			ctx.channel,
		);
	}

	// Confidence scoring: only meaningful when the answer came from a tool.
	// Low confidence → escalate to a human (if configured); medium confidence
	// → caveat prefix only when the tool result itself looks incomplete/errored.
	try {
		if (!lastToolName) {
			// Pure LLM chat — nothing to be confident about.
			debug("agent", "confidence skipped (no tool call)");
		} else {
			const confidence = scoreConfidence({
				toolName: lastToolName,
				toolResult: lastToolResult,
				llmResponse: response,
			});
			debug("agent", "confidence", {
				level: confidence.level,
				score: confidence.score,
				tool: lastToolName,
			});

			const resultLooksIncomplete =
				lastToolResult === undefined ||
				lastToolResult === null ||
				(typeof lastToolResult === "object" &&
					"error" in (lastToolResult as Record<string, unknown>));

			if (confidence.shouldEscalate) {
				if (!activeHandoff && handoffConfig) {
					const reply = await escalateToHuman(
						sb,
						ctx,
						handoffConfig,
						`Бага итгэлцэл: ${confidence.reasoning}`,
						"agent",
						sanitizedText,
						response,
					);
					return confidence.displayPrefix + reply;
				}
				return confidence.displayPrefix + response;
			}
			if (confidence.displayPrefix && resultLooksIncomplete) {
				return confidence.displayPrefix + response;
			}
		}
	} catch (err) {
		capture(err, { context: "agent-gateway: confidence scoring" });
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
					ctx.externalOrganizationId,
					ctx.channelChatId,
					ctx.channelUserId,
					finalMessages,
					estimatedTokens,
					ctx.channel,
				),
				recordUsageAtomic(
					sb,
					ctx.externalOrganizationId,
					Math.ceil((sanitizedText.length + response.length) / 4),
				),
			]);
		} catch (err) {
			console.error("[agent-handler] after() save/usage failed:", err);
		}
	});

	return response;
}
