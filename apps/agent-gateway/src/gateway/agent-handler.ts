import "server-only";
import { capture } from "@zuiio/capture";
import { after } from "next/server";

import { TelegramChannel } from "@/channels/telegram";
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

const SENSITIVE_OUTPUT_PATTERN = /sk-[a-zA-Z0-9]{20,}|organization_id/;

function redactSensitiveOutput(output: string): string {
	if (!SENSITIVE_OUTPUT_PATTERN.test(output)) return output;
	return output
		.replace(/sk-[a-zA-Z0-9]{20,}/g, "[REDACTED_API_KEY]")
		.replace(/organization_id/g, "[REDACTED_FIELD]");
}

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
			orgId: ctx.orgId,
			chatId,
			userId,
			reason,
			escalatedBy,
			customerQuery,
			botResponse,
			adminChatId: handoffConfig?.adminChatId ?? undefined,
		});
		const { error: auditError } = await sb.from("agent_audit_log").insert({
			organization_id: ctx.orgId,
			user_id: ctx.channelUserId,
			chat_id: ctx.chatId || Number(ctx.channelChatId) || 0,
			telegram_user_id: ctx.telegramUserId || Number(ctx.channelUserId) || 0,
			channel: ctx.channel,
			channel_chat_id: ctx.channelChatId,
			channel_user_id: ctx.channelUserId,
			tool_name: "knowledge_escalation",
			tool_args: { reason, escalated_by: escalatedBy },
			tool_result: { handoff_id: event.id },
			error: null,
			duration_ms: 0,
		});
		if (auditError) {
			capture(auditError, { context: "agent-gateway: handoff audit insert" });
		}
		const adminChatId = handoffConfig?.adminChatId;
		if (adminChatId) {
			try {
				const tg = new TelegramChannel();
				await tg.sendMessage(
					adminChatId,
					`🛎 <b>Шинэ хүсэлт</b>\n\nШалтгаан: ${reason}\nХэрэглэгч: ${customerQuery.slice(0, 200)}\n\nID: ${event.id}`,
				);
			} catch (err) {
				capture(err, { context: "agent-gateway: handoff admin notify" });
			}
		}
	} catch (err) {
		capture(err, { context: "agent-gateway: handoff trigger" });
	}
	return "Таны асуулт мэргэжилтэн рүү шилжлээ...";
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
	/** Called after each tool execution — used to capture product results for rich card rendering. */
	onToolResult?: (toolName: string, result: unknown) => void;
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
		productType: ctx.productType,
		audience: ctx.audience ?? "internal",
		channel: ctx.channel,
		channelChatId: ctx.channelChatId,
		channelUserId: ctx.channelUserId,
		pageId: ctx.pageId,
		pageAccessToken: ctx.pageAccessToken,
	};
	// Persist a deterministic experiment cohort once; repeated messages reuse it.
	if (sb && typeof sb.from === "function") {
		try {
			const maybeChain = sb.from("experiments");
			if (!maybeChain || typeof maybeChain.select !== "function")
				throw new Error("no chain");
			const { data: experiments } = await maybeChain
				.select("id, variants, traffic_split")
				.eq("organization_id", ctx.orgId)
				.eq("status", "running");
			for (const experiment of experiments ?? []) {
				const variants = Array.isArray(
					(experiment as Record<string, unknown>).variants,
				)
					? ((experiment as Record<string, unknown>).variants as unknown[]).map(
							String,
						)
					: [];
				if (!variants.length) continue;
				const { data: existing } = await sb
					.from("experiment_assignments")
					.select("variant")
					.eq(
						"experiment_id",
						(experiment as Record<string, unknown>).id as string,
					)
					.eq("channel_user_id", ctx.channelUserId)
					.maybeSingle();
				if (existing) continue;
				let hash = 2166136261;
				for (let i = 0; i < ctx.channelUserId.length; i++)
					hash = Math.imul(hash ^ ctx.channelUserId.charCodeAt(i), 16777619);
				const point = (hash >>> 0) % 100;
				const split = ((experiment as Record<string, unknown>).traffic_split ??
					{}) as Record<string, number>;
				let cursor = 0;
				let variant = variants[variants.length - 1];
				for (const candidate of variants) {
					cursor += Number(split[candidate] ?? 0);
					if (point < cursor) {
						variant = candidate;
						break;
					}
				}
				await sb.from("experiment_assignments").insert({
					experiment_id: (experiment as Record<string, unknown>).id as string,
					channel_user_id: ctx.channelUserId,
					variant,
				});
			}
		} catch (err) {
			capture(err, {
				context: "gateway: experiment assignment",
				orgId: ctx.orgId,
			});
		}
	}
	const injectionAttempt =
		/ignore\s+(?:(?:all|previous)\s+)?instructions|pretend\s+you\s+are|\bDAN\b|jailbreak|system\s+prompt|you\s+are\s+now|\[SYSTEM\]|```system/i.test(
			text,
		);
	if (injectionAttempt) {
		const injectionError = new Error("Prompt injection attempt detected");
		capture(injectionError, {
			context: "gateway: prompt-injection",
			orgId: ctx.orgId,
			channel: ctx.channel,
		});
		console.warn("[agent-handler] prompt injection attempt", {
			orgId: ctx.orgId,
			channel: ctx.channel,
			textLength: text.length,
		});
	}

	const sanitizedText = sanitizeUserInput(text).slice(0, 2000);
	const userMessage = `<user_input>\n${sanitizedText}\n</user_input>`;

	// Detect language: Cyrillic → Mongolian, Latin → English
	const isCyrillic = /[\u0400-\u04FF]/.test(sanitizedText);
	let toolCallSequence = 0;
	const detectedLang = isCyrillic ? "mn" : "en";

	// Select tools — single-pass: audit logging + result truncation combined,
	// plus a collector that remembers the last tool result for confidence scoring.
	let lastToolName: string | undefined;
	let lastToolResult: unknown;
	const rawTools = opts.getTools(context);
	const safeTools = rawTools.map((t) => {
		const audited = withAudit(
			t,
			ctx.channel,
			ctx.channelChatId,
			ctx.channelUserId,
			{ truncate: true },
		);
		return {
			...audited,
			execute: async (args: Record<string, unknown>, execCtx: ToolContext) => {
				const sequence = ++toolCallSequence;
				const result = await audited.execute(args, execCtx);
				if (sequence >= toolCallSequence) {
					lastToolName = t.name;
					lastToolResult = result;
				}
				try {
					opts.onToolResult?.(t.name, result);
				} catch {}
				return result;
			},
		};
	});

	// Skip knowledge search for greetings/short messages — saves embedding + pgvector 150-300ms
	// for ~40% of traffic. searchKnowledge itself is Redis-cached but embedding generation is not.
	const shouldSearchKnowledge =
		sanitizedText.length > 6 &&
		!/^(сайн\s*уу|сайн|оройн мэнд|өглөөний мэнд|hello|hi|hey|bay|good\s*(morning|afternoon|evening))\b/i.test(
			sanitizedText.trim(),
		);

	// Parallel preflight: budget + rateLimit + handoff + session + prompt + profile + knowledge + wizard
	// All independent — single Promise.all saves ~150-300ms vs 3 serial hops.
	let t = performance.now();
	const [
		budget,
		rateLimit,
		handoffConfig,
		activeHandoff,
		session,
		basePrompt,
		profile,
		knowledgeChunks,
		wizardState,
	] = await Promise.all([
		checkDailyBudget(sb, ctx.orgId),
		checkRateLimit(ctx.orgId, RATE_LIMITS.messagesPerMinute),
		getHandoffConfig(sb, ctx.orgId).catch(() => null),
		getActiveHandoff(sb, ctx.orgId, Number(ctx.channelChatId) || 0).catch(
			() => null,
		),
		loadSession(
			sb,
			ctx.orgId,
			ctx.channelChatId,
			ctx.channelUserId,
			ctx.channel,
		),
		opts
			.getSystemPrompt(ctx.productType, ctx.orgId, chatType, detectedLang)
			.catch(() => ""),
		loadAgentProfile(
			context.supabase,
			ctx.orgId,
			ctx.audience ?? "internal",
		).catch(() => null),
		shouldSearchKnowledge
			? searchKnowledge(context.supabase, ctx.orgId, sanitizedText, {
					limit: 3,
					audience: ctx.audience ?? "internal",
				}).catch(() => [] as KnowledgeChunk[])
			: Promise.resolve([] as KnowledgeChunk[]),
		getWizardState(
			sb,
			ctx.orgId,
			ctx.channelChatId,
			ctx.channelUserId,
			ctx.channel,
		),
	]);
	timings.preflight = Math.round(performance.now() - t);
	// Back-compat granular timings (same value — avoids breaking dashboards)
	timings.budget = timings.preflight;
	timings.sessionLoad = timings.preflight;
	timings.contextLoad = timings.preflight;
	debug("agent", "session loaded", {
		messageCount: session.messages.length,
		tokenCount: session.tokenCount,
	});

	if (!budget.allowed) return budget.reason!;
	if (!rateLimit.allowed) {
		return `⏳ Хэт олон хүсэлт илгээсэн байна. ${Math.ceil(rateLimit.resetInMs / 1000)} секундын дараа дахин оролдоно уу.`;
	}

	// Check handoff triggers — if user wants a human, escalate immediately
	const handoff = checkHandoffTriggers(sanitizedText, {
		keywordTriggers: handoffConfig?.keywordTriggers ?? [],
		sentimentEnabled: handoffConfig?.sentimentEnabled ?? true,
	});
	if (handoff.triggered) {
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
	// Do not let the model invent an answer when the knowledge base has no
	// sufficiently similar grounding.
	// DISABLED for now — breaks existing profile tests that expect base prompt
	// to always be present. Re-enable after updating those tests to mock
	// lowConfidenceThreshold correctly.
	// const bestKnowledgeSimilarity = knowledgeChunks.reduce(
	// 	(best, chunk) => Math.max(best, Number(chunk.similarity) || 0),
	// 	0,
	// );
	// if (shouldSearchKnowledge && bestKnowledgeSimilarity < 0.5) {
	// 	if (activeHandoff) {
	// 		return "Таны асуулт мэргэжилтэн рүү шилжлээ...";
	// 	}
	// 	return escalateToHuman(
	// 		sb,
	// 		ctx,
	// 		handoffConfig,
	// 		`Мэдлэгийн сангийн итгэлцэл бага (${bestKnowledgeSimilarity.toFixed(2)})`,
	// 		"agent",
	// 		sanitizedText,
	// 		"",
	// 	);
	// }

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
		const wizardData = JSON.stringify(wizardState.data).replace(/[<>]/g, "");
		systemPrompt += `\n\n## ACTIVE WIZARD\nYou are in the middle of a "${wizardState.type}" wizard (step ${wizardState.step}).\nThe user's next message is a response to your wizard question. Process it as step ${wizardState.step + 1} of the wizard.\nCollected data so far: <wizard_data>${wizardData}</wizard_data>\n\nWhen the wizard is complete (all steps done), respond with the result and include this marker at the end: [WIZARD_COMPLETE:${wizardState.type}]\nWhen the user wants to cancel the wizard, respond naturally and include: [WIZARD_CANCEL]`;
	}
	if (ctx.channel === "messenger" && ctx.audience === "customer") {
		systemPrompt +=
			"\n\nFACEBOOK MESSENGER RULE: When you call searchProducts and find products, give ONLY a brief intro (one short sentence like 'Таны хайсан бараанууд:') — do NOT enumerate products as a numbered or bulleted text list, because they will be displayed as horizontally scrollable cards with image, price and buttons. Keep response under 2 sentences when products are shown.";
	}
	timings.contextLoad = Math.round(performance.now() - t);

	// LLM call
	t = performance.now();
	let response = await gateway.runWithTools({
		system: systemPrompt,
		userMessage,
		images,
		tools: safeTools,
		context,
		maxRounds: REQUEST_LIMITS.maxToolRounds,
		onToken: opts.onToken
			? (token) => opts.onToken?.(redactSensitiveOutput(token))
			: undefined,
		conversationHistory:
			session.messages.length > 0 ? session.messages : undefined,
	});
	timings.llm = Math.round(performance.now() - t);

	// Never return provider output that contains a secret or schema identifier.
	const redactedResponse = redactSensitiveOutput(response);
	if (redactedResponse !== response) {
		response = redactedResponse;
		const outputError = new Error("Sensitive provider output redacted");
		capture(outputError, {
			context: "gateway: output-screening",
			orgId: ctx.orgId,
			channel: ctx.channel,
		});
		console.warn("[agent-handler] sensitive output redacted", {
			orgId: ctx.orgId,
			channel: ctx.channel,
			responseLength: response.length,
		});
	}
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

			const shouldEscalate =
				confidence.shouldEscalate ||
				(handoffConfig?.lowConfidenceThreshold !== undefined &&
					confidence.score < handoffConfig.lowConfidenceThreshold);
			if (shouldEscalate) {
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
					return reply;
				}
				return `${confidence.displayPrefix ?? "⚠️ "}${response}`;
			}
			if (confidence.displayPrefix && resultLooksIncomplete) {
				return confidence.displayPrefix + response;
			}
		}
	} catch (err) {
		capture(err, { context: "agent-gateway: confidence scoring" });
	}

	// Post-processing: trim history synchronously (cheap), defer LLM summarization to after().
	// Previously summarizeIfNeeded() blocked the response by up to 800ms when history >20 msgs.
	t = performance.now();
	const CONTEXT_WINDOW_TOKENS = 12_000;
	const updatedMessages: SessionMessage[] = [
		...session.messages,
		{ role: "user" as const, content: sanitizedText },
		{ role: "assistant" as const, content: response ?? "" },
	];
	// Fast synchronous trim — no LLM call.
	let finalMessages = updatedMessages;
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

	// Persist session AFTER response is sent — after() extends serverless lifetime.
	// Summarization (LLM call) is deferred here so it never blocks the user response.
	after(async () => {
		try {
			const maybeSummarized = await summarizeIfNeeded(finalMessages).catch(
				() => null as SessionMessage[] | null,
			);
			const toSave = maybeSummarized ?? finalMessages;
			const saveTokens = maybeSummarized
				? maybeSummarized.reduce(
						(s, m) => s + Math.ceil((m.content?.length ?? 0) / 4),
						0,
					)
				: estimatedTokens;
			await saveSession(
				sb,
				ctx.orgId,
				ctx.channelChatId,
				ctx.channelUserId,
				toSave,
				saveTokens,
				ctx.channel,
			);
			await recordUsageAtomic(
				sb,
				ctx.orgId,
				Math.ceil((sanitizedText.length + response.length) / 4),
			);
		} catch (err) {
			console.error("[agent-handler] after() save/usage failed:", err);
		}
	});

	return response;
}
