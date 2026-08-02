import type { SupabaseClient } from "@supabase/supabase-js";
import type { Channel } from "@/channels/types";
import type { GatewayContext } from "@/gateway/types";
import type { AiProvider } from "@/providers/types";
import { interpretFlow, resumeFlow } from "./interpreter";
import { buttonValueFromCallback } from "./nodes/ask-question";
import {
	createRun,
	deleteWaitState,
	findActiveFlow,
	loadActiveRun,
	loadFlowVersion,
	loadReadyWaits,
	saveRun,
	saveWaitState,
} from "./persistence";
import type { ConversationRun, FlowContext } from "./types";

/**
 * Flow Executor — the public API.
 *
 * Entry points:
 *   - handleFlowMessage(): called when a message arrives and a flow is active
 *   - handleFlowCallback(): called when a button callback arrives for a flow
 *   - resumeDelayedFlows(): called by cron to resume delayed nodes
 */
export async function handleFlowMessage(
	ctx: GatewayContext,
	text: string,
	supabase: SupabaseClient,
	channel: Channel,
	aiProvider?: AiProvider,
): Promise<string | null> {
	// 1. Check if user has an active run
	const existingRun = await loadActiveRun(
		supabase,
		ctx.orgId,
		ctx.channel,
		ctx.channelChatId,
		ctx.channelUserId,
	);

	if (existingRun) {
		return resumeExistingRun(
			existingRun,
			text,
			supabase,
			channel,
			aiProvider,
			ctx,
		);
	}

	// 2. Check if a flow should be triggered by this message
	const flow = await findActiveFlow(supabase, ctx.orgId, ctx.channel);

	if (!flow) {
		return null; // No flow active — let the AI agent handler take over
	}

	// 3. Check if the flow has a keyword trigger
	if (flow.triggerKeywords?.length) {
		const matchedKeyword = flow.triggerKeywords.find((kw) =>
			text.toLowerCase().includes(kw.toLowerCase()),
		);
		if (!matchedKeyword) {
			return null; // Keyword doesn't match — not this flow's turn
		}
	}

	// 4. Create a new run
	const run = await createRun(
		supabase,
		flow,
		ctx.channel,
		ctx.channelChatId,
		ctx.channelUserId,
	);

	// 5. Set the initial user message and execute
	const flowCtx: FlowContext = {
		flow,
		run,
		userMessage: text,
		channel: wrapChannel(channel),
		supabase,
		aiProvider: aiProvider
			? {
					runWithTools: (params) =>
						aiProvider.runWithTools({
							system: params.system,
							userMessage: params.userMessage,
							images: undefined,
							tools: [],
							context: {
								orgId: ctx.orgId,
								userId: ctx.userId,
								supabase,
							},
							maxRounds: params.maxRounds,
							conversationHistory: undefined,
						}),
				}
			: undefined,
	};

	const result = await interpretFlow(flowCtx);

	// 6. Persist state
	await saveRun(supabase, result.run);

	if (result.waitState) {
		await saveWaitState(supabase, result.waitState);
	}

	// 7. Return a summary for the gateway to log
	return `[flow:${flow.metadata?.name ?? flow.id}] nodes executed, status=${result.run.status}`;
}

/**
 * Handle a button callback for a flow run.
 */
export async function handleFlowCallback(
	runId: string,
	callbackData: string,
	supabase: SupabaseClient,
	channel: Channel,
	_aiProvider?: AiProvider,
): Promise<string | null> {
	const run = await loadActiveRunById(supabase, runId);
	if (!run) return null;

	const flow = await loadFlowVersion(supabase, run.flowVersionId);
	if (!flow) return null;

	// Parse the callback data to extract the button value
	const buttonValue = buttonValueFromCallback(callbackData);

	// If waiting for a question response, persist the selected button as the
	// answer before resuming — downstream nodes read it from run.fields.
	const awaitingField = run.fields._awaitingField;
	if (awaitingField) {
		run.fields[awaitingField] = buttonValue;
		run.fields._awaitingField = "";
	}

	const flowCtx: FlowContext = {
		flow,
		run,
		userMessage: buttonValue,
		callbackData,
		channel: wrapChannel(channel),
		supabase,
	};

	const result = await interpretFlow(flowCtx);
	await saveRun(supabase, result.run);

	if (result.waitState) {
		await saveWaitState(supabase, result.waitState);
	}

	return `[flow:callback] run=${runId} status=${result.run.status}`;
}

/**
 * Resume delayed flows — called by cron job.
 */
export async function resumeDelayedFlows(
	supabase: SupabaseClient,
	channelFactory: (channel: string, meta?: Record<string, unknown>) => Channel,
	_aiProvider?: AiProvider,
): Promise<number> {
	const readyWaits = await loadReadyWaits(supabase);
	let resumed = 0;

	for (const wait of readyWaits) {
		try {
			const flow = await loadFlowVersion(supabase, wait.run.flowVersionId);
			if (!flow) {
				await deleteWaitState(supabase, wait.id);
				continue;
			}

			const channel = channelFactory(wait.run.channel, wait.run.channelMeta);

			const flowCtx: FlowContext = {
				flow,
				run: wait.run,
				userMessage: "", // No user message for delay resume
				channel: wrapChannel(channel),
				supabase,
			};

			const result = await resumeFlow(flowCtx);
			await saveRun(supabase, result.run);
			await deleteWaitState(supabase, wait.id);

			if (result.waitState) {
				await saveWaitState(supabase, result.waitState);
			}

			resumed++;
		} catch (error) {
			console.error(`[flow-executor] Failed to resume wait ${wait.id}:`, error);
		}
	}

	return resumed;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function resumeExistingRun(
	run: ConversationRun,
	text: string,
	supabase: SupabaseClient,
	channel: Channel,
	aiProvider: AiProvider | undefined,
	gatewayCtx: GatewayContext,
): Promise<string> {
	const flow = await loadFlowVersion(supabase, run.flowVersionId);
	if (!flow) {
		run.status = "expired";
		await saveRun(supabase, run);
		return "";
	}

	// Check expiration
	if (new Date(run.expiresAt) < new Date()) {
		run.status = "expired";
		await saveRun(supabase, run);
		return "";
	}

	// If waiting for a question response, store the answer
	const awaitingField = run.fields._awaitingField;
	if (awaitingField) {
		run.fields[awaitingField] = text;
		run.fields._awaitingField = "";
	}

	const flowCtx: FlowContext = {
		flow,
		run,
		userMessage: text,
		channel: wrapChannel(channel),
		supabase,
		aiProvider: aiProvider
			? {
					runWithTools: (params) =>
						aiProvider.runWithTools({
							system: params.system,
							userMessage: params.userMessage,
							images: undefined,
							tools: [],
							context: {
								orgId: gatewayCtx.orgId,
								userId: gatewayCtx.userId,
								supabase,
							},
							maxRounds: params.maxRounds,
							conversationHistory: undefined,
						}),
				}
			: undefined,
	};

	const result = await interpretFlow(flowCtx);
	await saveRun(supabase, result.run);

	if (result.waitState) {
		await saveWaitState(supabase, result.waitState);
	}

	return `[flow:resume] run=${run.id} status=${result.run.status}`;
}

async function loadActiveRunById(
	supabase: SupabaseClient,
	runId: string,
): Promise<ConversationRun | null> {
	const { data, error } = await supabase
		.from("conversation_runs")
		.select("*")
		.eq("id", runId)
		.in("status", ["active", "waiting", "delayed"])
		.single();

	if (error || !data) return null;

	return {
		id: data.id,
		flowVersionId: data.flow_version_id,
		orgId: data.organization_id,
		channel: data.channel,
		channelChatId: data.channel_chat_id,
		channelUserId: data.channel_user_id,
		status: data.status,
		currentNodeId: data.current_node_id,
		fields: data.fields ?? {},
		assignments: data.assignments ?? {},
		startedAt: data.started_at,
		updatedAt: data.updated_at,
		expiresAt: data.expires_at,
		channelMeta: data.channel_meta,
	};
}

/**
 * Wrap a Channel adapter to match FlowContext's simpler send interface.
 */
function wrapChannel(channel: Channel): FlowContext["channel"] {
	return {
		async sendMessage(chatId, text, options) {
			await channel.sendMessage(chatId, text, {
				quickReplies: options?.quickReplies,
			});
		},
	};
}
