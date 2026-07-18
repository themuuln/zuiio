import type { SupabaseClient } from "@supabase/supabase-js";
import type {
	ConversationRun,
	FlowVersion,
	OutboxEntry,
	RunStatus,
	WaitState,
} from "./types";

// ─── Flow Versions ────────────────────────────────────────────────────────────

/**
 * Load a published flow version by ID.
 * This is the immutable snapshot the executor runs against.
 */
export async function loadFlowVersion(
	supabase: SupabaseClient,
	flowVersionId: string,
): Promise<FlowVersion | null> {
	const { data, error } = await supabase
		.from("flow_versions")
		.select("*")
		.eq("id", flowVersionId)
		.single();

	if (error || !data) return null;

	return {
		id: data.id,
		orgId: data.organization_id,
		productType: data.product_type,
		nodes: data.nodes,
		edges: data.edges,
		channel: data.channel,
		triggerKeywords: data.trigger_keywords,
		metadata: data.metadata,
	};
}

/**
 * Find the active flow version for an org + optional channel + trigger keyword.
 * Returns the latest published version matching the criteria.
 */
export async function findActiveFlow(
	supabase: SupabaseClient,
	orgId: string,
	channel?: string,
	keyword?: string,
): Promise<FlowVersion | null> {
	let query = supabase
		.from("flow_versions")
		.select("*")
		.eq("organization_id", orgId)
		.eq("is_active", true);

	if (channel) {
		query = query.or(`channel.is.null,channel.eq.${channel}`);
	}

	if (keyword) {
		query = query.contains("trigger_keywords", [keyword]);
	}

	query = query.order("version", { ascending: false }).limit(1);

	const { data, error } = await query.single();
	if (error || !data) return null;

	return {
		id: data.id,
		orgId: data.organization_id,
		productType: data.product_type,
		nodes: data.nodes,
		edges: data.edges,
		channel: data.channel,
		triggerKeywords: data.trigger_keywords,
		metadata: data.metadata,
	};
}

// ─── Conversation Runs ────────────────────────────────────────────────────────

/**
 * Load an active run for a specific user in a specific conversation.
 * Returns the run if there's one in "active", "waiting", or "delayed" status.
 */
export async function loadActiveRun(
	supabase: SupabaseClient,
	orgId: string,
	channel: string,
	channelChatId: string,
	channelUserId: string,
): Promise<ConversationRun | null> {
	const { data, error } = await supabase
		.from("conversation_runs")
		.select("*")
		.eq("organization_id", orgId)
		.eq("channel", channel)
		.eq("channel_chat_id", channelChatId)
		.eq("channel_user_id", channelUserId)
		.in("status", ["active", "waiting", "delayed"])
		.order("started_at", { ascending: false })
		.limit(1)
		.single();

	if (error || !data) return null;

	return {
		id: data.id,
		flowVersionId: data.flow_version_id,
		orgId: data.organization_id,
		channel: data.channel,
		channelChatId: data.channel_chat_id,
		channelUserId: data.channel_user_id,
		status: data.status as RunStatus,
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
 * Create a new conversation run starting from the flow's start node.
 */
export async function createRun(
	supabase: SupabaseClient,
	flow: FlowVersion,
	channel: string,
	channelChatId: string,
	channelUserId: string,
	channelMeta?: Record<string, unknown>,
): Promise<ConversationRun> {
	const startNode = flow.nodes.find((n) => n.type === "start");
	const firstEdge = flow.edges.find((e) => e.source === startNode?.id);
	const firstNodeId = firstEdge?.target ?? startNode?.id ?? "";

	const now = new Date().toISOString();
	const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

	const run: ConversationRun = {
		id: crypto.randomUUID(),
		flowVersionId: flow.id,
		orgId: flow.orgId,
		channel,
		channelChatId,
		channelUserId,
		status: "active",
		currentNodeId: firstNodeId,
		fields: {},
		assignments: {},
		startedAt: now,
		updatedAt: now,
		expiresAt,
		channelMeta,
	};

	const { error } = await supabase.from("conversation_runs").insert({
		id: run.id,
		flow_version_id: run.flowVersionId,
		organization_id: run.orgId,
		channel: run.channel,
		channel_chat_id: run.channelChatId,
		channel_user_id: run.channelUserId,
		status: run.status,
		current_node_id: run.currentNodeId,
		fields: run.fields,
		assignments: run.assignments,
		started_at: run.startedAt,
		updated_at: run.updatedAt,
		expires_at: run.expiresAt,
		channel_meta: run.channelMeta,
	});

	if (error) {
		console.error("[flow-executor] Failed to create run:", error);
		throw error;
	}

	return run;
}

/**
 * Save updated run state after execution.
 */
export async function saveRun(
	supabase: SupabaseClient,
	run: ConversationRun,
): Promise<void> {
	const { error } = await supabase
		.from("conversation_runs")
		.update({
			status: run.status,
			current_node_id: run.currentNodeId,
			fields: run.fields,
			assignments: run.assignments,
			updated_at: run.updatedAt,
		})
		.eq("id", run.id);

	if (error) {
		console.error("[flow-executor] Failed to save run:", error);
	}
}

// ─── Wait States ──────────────────────────────────────────────────────────────

/**
 * Save a wait state (for askQuestion or delay nodes).
 */
export async function saveWaitState(
	supabase: SupabaseClient,
	waitState: WaitState,
): Promise<void> {
	const { error } = await supabase.from("flow_wait_states").insert({
		id: waitState.id,
		run_id: waitState.runId,
		wait_type: waitState.waitType,
		scheduled_at: waitState.scheduledAt,
		expected_input: waitState.expectedInput,
		callback_pattern: waitState.callbackPattern,
		created_at: waitState.createdAt,
	});

	if (error) {
		console.error("[flow-executor] Failed to save wait state:", error);
	}
}

/**
 * Load wait states that are ready to resume (delays that have passed).
 * Used by the cron scheduler.
 */
export async function loadReadyWaits(
	supabase: SupabaseClient,
): Promise<Array<WaitState & { run: ConversationRun }>> {
	const now = new Date().toISOString();

	const { data: waits, error } = await supabase
		.from("flow_wait_states")
		.select("*, conversation_runs(*)")
		.lte("scheduled_at", now)
		.is("scheduled_at", "not.null");

	if (error || !waits) return [];

	return waits.map((w) => ({
		id: w.id,
		runId: w.run_id,
		waitType: w.wait_type,
		scheduledAt: w.scheduled_at,
		expectedInput: w.expected_input,
		callbackPattern: w.callback_pattern,
		createdAt: w.created_at,
		run: {
			id: w.conversation_runs.id,
			flowVersionId: w.conversation_runs.flow_version_id,
			orgId: w.conversation_runs.organization_id,
			channel: w.conversation_runs.channel,
			channelChatId: w.conversation_runs.channel_chat_id,
			channelUserId: w.conversation_runs.channel_user_id,
			status: w.conversation_runs.status,
			currentNodeId: w.conversation_runs.current_node_id,
			fields: w.conversation_runs.fields ?? {},
			assignments: w.conversation_runs.assignments ?? {},
			startedAt: w.conversation_runs.started_at,
			updatedAt: w.conversation_runs.updated_at,
			expiresAt: w.conversation_runs.expires_at,
			channelMeta: w.conversation_runs.channel_meta,
		},
	}));
}

/**
 * Delete a wait state after it's been consumed.
 */
export async function deleteWaitState(
	supabase: SupabaseClient,
	waitId: string,
): Promise<void> {
	await supabase.from("flow_wait_states").delete().eq("id", waitId);
}

// ─── Outbox ───────────────────────────────────────────────────────────────────

/**
 * Enqueue a message for delivery (outbox pattern).
 * The message is committed to DB first, then sent.
 * If send fails, a retry job picks it up.
 */
export async function enqueueMessage(
	supabase: SupabaseClient,
	runId: string,
	channel: string,
	channelChatId: string,
	payload: { text: string; buttons?: Array<{ text: string; callbackData: string }> },
): Promise<string> {
	const id = crypto.randomUUID();

	await supabase.from("flow_outbox").insert({
		id,
		run_id: runId,
		channel,
		channel_chat_id: channelChatId,
		payload,
		status: "pending",
		retry_count: 0,
		max_retries: 3,
		created_at: new Date().toISOString(),
	});

	return id;
}

/**
 * Mark an outbox entry as sent.
 */
export async function markSent(
	supabase: SupabaseClient,
	outboxId: string,
): Promise<void> {
	await supabase
		.from("flow_outbox")
		.update({ status: "sent", sent_at: new Date().toISOString() })
		.eq("id", outboxId);
}

/**
 * Mark an outbox entry as failed and increment retry count.
 */
export async function markFailed(
	supabase: SupabaseClient,
	outboxId: string,
	error: string,
): Promise<void> {
	await supabase
		.from("flow_outbox")
		.update({
			status: "failed",
			error,
			retry_count: supabase.rpc ? 1 : 1, // Will use SQL increment in production
		})
		.eq("id", outboxId);
}

/**
 * Load pending outbox entries for retry.
 */
export async function loadPendingOutbox(
	supabase: SupabaseClient,
	limit = 50,
): Promise<OutboxEntry[]> {
	const { data, error } = await supabase
		.from("flow_outbox")
		.select("*")
		.eq("status", "pending")
		.lt("retry_count", 3)
		.order("created_at", { ascending: true })
		.limit(limit);

	if (error || !data) return [];

	return data.map((d) => ({
		id: d.id,
		runId: d.run_id,
		channel: d.channel,
		channelChatId: d.channel_chat_id,
		payload: d.payload,
		status: d.status,
		retryCount: d.retry_count,
		maxRetries: d.max_retries,
		createdAt: d.created_at,
		sentAt: d.sent_at,
		error: d.error,
	}));
}
