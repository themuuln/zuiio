import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { capture } from "@zuiio/capture";

/**
 * Human handoff state machine.
 * Manages escalation from AI agent to human and back.
 */

/** Per-org handoff configuration (agent_handoff_config). */
export interface HandoffConfig {
	keywordTriggers: string[];
	sentimentEnabled: boolean;
	adminChatId: number | null;
	autoHandoffAfterHours: boolean;
	lowConfidenceThreshold: number;
}

const DEFAULT_HANDOFF_CONFIG: HandoffConfig = {
	keywordTriggers: [],
	sentimentEnabled: true,
	adminChatId: null,
	autoHandoffAfterHours: true,
	lowConfidenceThreshold: 0.6,
};

/**
 * Load handoff config for an org (agent_handoff_config).
 * Returns defaults when no row exists.
 */
export async function getHandoffConfig(
	supabase: SupabaseClient,
	orgId: string,
): Promise<HandoffConfig> {
	const { data, error } = await supabase
		.from("agent_handoff_config")
		.select(
			"keyword_triggers, sentiment_enabled, admin_chat_id, auto_handoff_after_hours, low_confidence_threshold",
		)
		.eq("organization_id", orgId)
		.maybeSingle();

	if (error || !data) return DEFAULT_HANDOFF_CONFIG;

	const rawThreshold = Number(data.low_confidence_threshold ?? 0.6);
	const lowConfidenceThreshold = Number.isFinite(rawThreshold)
		? Math.min(1, Math.max(0, rawThreshold))
		: DEFAULT_HANDOFF_CONFIG.lowConfidenceThreshold;

	return {
		keywordTriggers: Array.isArray(data.keyword_triggers)
			? (data.keyword_triggers as string[])
			: [],
		sentimentEnabled: (data.sentiment_enabled as boolean) ?? true,
		adminChatId: data.admin_chat_id as number | null,
		autoHandoffAfterHours: (data.auto_handoff_after_hours as boolean) ?? true,
		lowConfidenceThreshold,
	};
}

/** List pending (unhandled) handoffs for an org — powers the team inbox. */
export async function listPendingHandoffs(
	supabase: SupabaseClient,
	orgId: string,
	limit = 50,
): Promise<HandoffEvent[]> {
	const { data, error } = await supabase
		.from("agent_handoff_events")
		.select(
			"id, organization_id, chat_id, user_id, status, reason, escalated_by, customer_query, admin_user_id, created_at",
		)
		.eq("organization_id", orgId)
		.in("status", ["pending_human", "human_active"])
		.order("created_at", { ascending: false })
		.limit(limit);

	if (error || !data) return [];

	return (data as Record<string, unknown>[]).map((row) => ({
		id: row.id as string,
		organizationId: row.organization_id as string,
		chatId: row.chat_id as number,
		userId: row.user_id as number,
		status: row.status as HandoffStatus,
		reason: row.reason as string | null,
		escalatedBy: row.escalated_by as string | null,
		customerQuery: row.customer_query as string | null,
		adminUserId: row.admin_user_id as number | null,
		createdAt: row.created_at as string,
	}));
}

/** Auto-resolve handoffs stuck in pending_human longer than the cutoff. */
export async function resolveStaleHandoffs(
	supabase: SupabaseClient,
	cutoff: string,
): Promise<number> {
	const { data, error } = await supabase
		.from("agent_handoff_events")
		.update({ status: "human_resolved", updated_at: new Date().toISOString() })
		.eq("status", "pending_human")
		.lt("created_at", cutoff)
		.select("id");

	if (error) {
		capture(error, { context: "agent-gateway: handoff stale sweep" });
		return 0;
	}
	return (data ?? []).length;
}

// ── Original module below ───────────────────────────────────────────────────

export type HandoffStatus =
	| "bot"
	| "pending_human"
	| "human_active"
	| "human_resolved"
	| "bot_resumed";

export interface HandoffEvent {
	id: string;
	organizationId: string;
	chatId: number;
	userId: number;
	status: HandoffStatus;
	reason: string | null;
	escalatedBy: string | null;
	customerQuery: string | null;
	adminUserId: number | null;
	createdAt: string;
}

/**
 * Escalate a conversation to a human admin.
 */
export async function triggerHandoff(
	supabase: SupabaseClient,
	params: {
		orgId: string;
		chatId: number;
		userId: number;
		reason: string;
		escalatedBy: "keyword" | "intent" | "sentiment" | "agent";
		customerQuery: string;
		botResponse: string;
		adminChatId?: number;
	},
): Promise<HandoffEvent> {
	const { data, error } = await supabase
		.from("agent_handoff_events")
		.insert({
			organization_id: params.orgId,
			chat_id: params.chatId,
			user_id: params.userId,
			status: "pending_human",
			reason: params.reason,
			escalated_by: params.escalatedBy,
			customer_query: params.customerQuery,
			bot_response: params.botResponse,
			admin_chat_id: params.adminChatId ?? null,
		})
		.select(
			"id, organization_id, chat_id, user_id, status, reason, escalated_by, customer_query, admin_user_id, created_at",
		)
		.single();

	if (error) {
		capture(error, { context: "agent-gateway: handoff trigger" });
		throw new Error("Хүнд шилжүүлэхэд алдаа гарлаа");
	}

	const row = data as Record<string, unknown>;
	return {
		id: row.id as string,
		organizationId: row.organization_id as string,
		chatId: row.chat_id as number,
		userId: row.user_id as number,
		status: row.status as HandoffStatus,
		reason: row.reason as string | null,
		escalatedBy: row.escalated_by as string | null,
		customerQuery: row.customer_query as string | null,
		adminUserId: row.admin_user_id as number | null,
		createdAt: row.created_at as string,
	};
}

/**
 * Check if a conversation is currently in handoff.
 */
export async function getActiveHandoff(
	supabase: SupabaseClient,
	orgId: string,
	chatId: number,
): Promise<HandoffEvent | null> {
	const { data, error } = await supabase.rpc("get_active_handoff", {
		p_org_id: orgId,
		p_chat_id: chatId,
	});

	if (error || !data || (data as unknown[]).length === 0) return null;

	const row = (data as Record<string, unknown>[])[0]!;
	return {
		id: row.id as string,
		organizationId: orgId,
		chatId: chatId,
		userId: 0, // not in function output
		status: row.status as HandoffStatus,
		reason: row.reason as string | null,
		escalatedBy: row.escalated_by as string | null,
		customerQuery: row.customer_query as string | null,
		adminUserId: row.admin_user_id as number | null,
		createdAt: row.created_at as string,
	};
}

/**
 * Resolve a handoff — mark as handled by human.
 */
export async function resolveHandoff(
	supabase: SupabaseClient,
	handoffId: string,
): Promise<void> {
	const { error } = await supabase
		.from("agent_handoff_events")
		.update({
			status: "human_resolved",
			resolved_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		})
		.eq("id", handoffId);

	if (error) {
		capture(error, { context: "agent-gateway: handoff resolve" });
	}
}

/**
 * Resume bot after human resolution.
 */
export async function resumeBotAfterHandoff(
	supabase: SupabaseClient,
	orgId: string,
	chatId: number,
): Promise<void> {
	const { error } = await supabase
		.from("agent_handoff_events")
		.update({
			status: "bot_resumed",
			updated_at: new Date().toISOString(),
		})
		.eq("organization_id", orgId)
		.eq("chat_id", chatId)
		.eq("status", "human_resolved");

	if (error) {
		capture(error, { context: "agent-gateway: handoff resume" });
	}
}

/**
 * Check if any handoff triggers match this message.
 * Returns trigger reason if matched, null otherwise.
 */
export function checkHandoffTriggers(
	userMessage: string,
	config: {
		keywordTriggers?: string[];
		sentimentEnabled?: boolean;
	},
): {
	triggered: boolean;
	reason?: string;
	by?: "keyword" | "sentiment" | "agent";
} {
	const lowerMsg = userMessage.toLowerCase();

	// Keyword triggers
	if (config.keywordTriggers) {
		for (const keyword of config.keywordTriggers) {
			if (lowerMsg.includes(keyword.toLowerCase())) {
				return {
					triggered: true,
					reason: `Түлхүүр үг илэрсэн: "${keyword}"`,
					by: "keyword",
				};
			}
		}
	}

	// Common Mongolian escalation keywords
	const escalationKeywords = [
		"хүн",
		"оператор",
		"ажилтан",
		"дарга",
		"менежер",
		"холбог",
		"дууд",
		"утас",
		"гомдол",
		"буруу",
		"алдаа",
		"хэлэлц",
	];
	for (const kw of escalationKeywords) {
		if (lowerMsg.includes(kw)) {
			return {
				triggered: true,
				reason: `Хэрэглэгч хүнтэй ярихыг хүсч байна: "${kw}"`,
				by: "keyword",
			};
		}
	}

	return { triggered: false };
}
