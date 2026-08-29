import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { capture } from "@zuiio/capture";

/**
 * Usage analytics and dashboard data.
 * Provides transparent cost tracking per organization.
 */

export interface UsageStats {
	orgId: string;
	period: {
		start: string;
		end: string;
	};
	totalTokens: number;
	totalApiCalls: number;
	totalToolCalls: number;
	topTools: Array<{ name: string; count: number }>;
	topUsers: Array<{ userId: string; messageCount: number }>;
	handoffCount: number;
	handoffResolvedCount: number;
	dailyBreakdown: Array<{
		date: string;
		tokens: number;
		calls: number;
	}>;
	estimatedCost: number; // in USD, based on token usage
	/** Response-time percentiles (ms) + per-tool averages from the audit log. */
	responseTimeMs: {
		p50: number;
		p95: number;
		p99: number;
		toolAverages: Array<{ name: string; avgMs: number }>;
	};
	/** Distinct conversations (session rows) in the period. */
	conversationCount: number;
	/** Per-channel activity in the period (from the audit log channel column). */
	byChannel: Array<{ channel: string; toolCalls: number; errors: number }>;
	/** Tool error rate in the period (0-1). */
	errorRate: number;
	/** Funnel totals for persistent experiment cohorts. */
	funnel: Array<{ experimentId: string; variant: string; users: number }>;
}

/** Nearest-rank percentile over a sorted array. */
export function percentile(sorted: number[], p: number): number {
	if (sorted.length === 0) return 0;
	const idx = Math.floor(sorted.length * p);
	const clamped = Math.min(idx, sorted.length - 1);
	return sorted[clamped] ?? 0;
}

/** Filter out null durations and sort ascending. */
export function computeSortedDurations(
	durations: Array<{ duration_ms: number | null; tool_name: string }>,
): number[] {
	return (durations ?? [])
		.filter(
			(d): d is { duration_ms: number; tool_name: string } =>
				d.duration_ms !== null && d.duration_ms !== undefined,
		)
		.map((d) => d.duration_ms)
		.sort((a, b) => a - b);
}

/** Per-tool average duration, sorted by slowest, capped at 10. */
export function computeToolAverages(
	durations: Array<{ duration_ms: number; tool_name: string }>,
): Array<{ name: string; avgMs: number }> {
	const map = new Map<string, { sum: number; count: number }>();
	for (const row of durations) {
		const entry = map.get(row.tool_name) ?? { sum: 0, count: 0 };
		entry.sum += row.duration_ms;
		entry.count += 1;
		map.set(row.tool_name, entry);
	}
	return Array.from(map.entries())
		.map(([name, { sum, count }]) => ({
			name,
			avgMs: Math.round(sum / count),
		}))
		.sort((a, b) => b.avgMs - a.avgMs)
		.slice(0, 10);
}

/**
 * Get usage statistics for an organization over a date range.
 *
 * Gateway state (daily spend, sessions, handoffs) is written to the
 * gateway/Zer project for every org, but the tool audit log is written to
 * the product's own project (tool calls run with the product's data client).
 * For Tolom orgs pass the Tolom client as `auditSupabase` so audit-derived
 * stats (tool calls, response times, byChannel, error rate) come from the
 * right project. Defaults to the main client when omitted.
 */
export async function getUsageStats(
	supabase: SupabaseClient,
	orgId: string,
	days: number = 7,
	providerCostPer1M: number = 0.14, // OpenCodeGo Flash default
	auditSupabase?: SupabaseClient,
): Promise<UsageStats> {
	const end = new Date();
	const start = new Date(Date.now() - days * 86400000);
	const startDate = start.toISOString().slice(0, 10);
	const endDate = end.toISOString().slice(0, 10);

	try {
		const auditSb = auditSupabase ?? supabase;

		// Daily spend
		const { data: spend } = await supabase
			.from("agent_daily_spend")
			.select("date, tokens_used, api_calls")
			.eq("organization_id", orgId)
			.gte("date", startDate)
			.lte("date", endDate)
			.order("date", { ascending: false });

		const dailyBreakdown = (
			(spend ?? []) as Array<Record<string, unknown>>
		).map((row) => ({
			date: row.date as string,
			tokens: Number(row.tokens_used) || 0,
			calls: Number(row.api_calls) || 0,
		}));

		const totalTokens = dailyBreakdown.reduce((s, d) => s + d.tokens, 0);
		const totalApiCalls = dailyBreakdown.reduce((s, d) => s + d.calls, 0);

		// Tool calls + response times from the audit log
		const { data: tools } = await auditSb
			.from("agent_audit_log")
			.select("tool_name, duration_ms, channel, error")
			.eq("organization_id", orgId)
			.gte("created_at", start.toISOString());

		const totalToolCalls = (tools ?? []).length;
		const errorCount = (tools ?? []).filter(
			(t) => (t as { error?: string | null }).error != null,
		).length;

		// Per-channel aggregation
		const channelAgg = new Map<string, { toolCalls: number; errors: number }>();
		for (const t of tools ?? []) {
			const row = t as { channel?: string | null; error?: string | null };
			const channel = row.channel ?? "unknown";
			const agg = channelAgg.get(channel) ?? { toolCalls: 0, errors: 0 };
			agg.toolCalls += 1;
			if (row.error != null) agg.errors += 1;
			channelAgg.set(channel, agg);
		}
		const byChannel = Array.from(channelAgg.entries())
			.sort(([, a], [, b]) => b.toolCalls - a.toolCalls)
			.map(([channel, agg]) => ({ channel, ...agg }));

		const toolCounts = new Map<string, number>();
		for (const t of tools ?? []) {
			const name = (t as { tool_name?: string }).tool_name ?? "unknown";
			toolCounts.set(name, (toolCounts.get(name) ?? 0) + 1);
		}
		const topTools = Array.from(toolCounts.entries())
			.sort(([, a], [, b]) => b - a)
			.slice(0, 10)
			.map(([name, count]) => ({ name, count }));

		const durations = (tools ?? []) as Array<{
			duration_ms: number | null;
			tool_name: string;
		}>;
		const sortedDurations = computeSortedDurations(durations);
		const toolAverages = computeToolAverages(
			durations.filter(
				(d): d is { duration_ms: number; tool_name: string } =>
					d.duration_ms !== null && d.duration_ms !== undefined,
			),
		);

		// Handoff stats
		const { data: handoffs } = await supabase
			.from("agent_handoff_events")
			.select("status")
			.eq("organization_id", orgId)
			.gte("created_at", start.toISOString());

		const handoffCount = (handoffs ?? []).length;
		const handoffResolvedCount = (handoffs ?? []).filter((h: unknown) =>
			["human_resolved", "bot_resumed"].includes(
				(h as Record<string, string>).status,
			),
		).length;

		// Distinct conversations in the period
		const { count: conversationCount } = await supabase
			.from("agent_sessions")
			.select("*", { count: "exact", head: true })
			.eq("organization_id", orgId)
			.gte("updated_at", start.toISOString());

		let funnel: Array<{
			experimentId: string;
			variant: string;
			users: number;
		}> = [];
		try {
			const { data: experiments } = await supabase
				.from("experiments")
				.select("id")
				.eq("organization_id", orgId);
			const experimentIds = (experiments ?? []).map((row) => row.id);
			if (experimentIds.length === 0) {
				funnel = [];
			} else {
				const { data: assignments } = await supabase
					.from("experiment_assignments")
					.select("experiment_id, variant, channel_user_id")
					.in("experiment_id", experimentIds)
					.gte("assigned_at", start.toISOString());
				const funnelMap = new Map<string, Set<string>>();
				for (const row of assignments ?? []) {
					const typed = row as Record<string, unknown>;
					const key = JSON.stringify([typed.experiment_id, typed.variant]);
					const users = funnelMap.get(key) ?? new Set<string>();
					users.add(String(typed.channel_user_id));
					funnelMap.set(key, users);
				}
				funnel = Array.from(funnelMap.entries()).map(([key, users]) => {
					const [experimentId, variant] = JSON.parse(key) as [string, string];
					return { experimentId, variant, users: users.size };
				});
			}
		} catch {
			funnel = [];
		}

		// Estimated cost
		const estimatedCost = (totalTokens / 1_000_000) * providerCostPer1M;

		return {
			orgId,
			period: { start: start.toISOString(), end: end.toISOString() },
			totalTokens,
			totalApiCalls,
			totalToolCalls,
			topTools,
			topUsers: [],
			handoffCount,
			handoffResolvedCount,
			dailyBreakdown,
			estimatedCost: Math.round(estimatedCost * 10_000) / 10_000,
			responseTimeMs: {
				p50: percentile(sortedDurations, 0.5),
				p95: percentile(sortedDurations, 0.95),
				p99: percentile(sortedDurations, 0.99),
				toolAverages,
			},
			conversationCount: conversationCount ?? 0,
			byChannel,
			errorRate: totalToolCalls > 0 ? errorCount / totalToolCalls : 0,
			funnel,
		};
	} catch (err) {
		capture(err, {
			context: "agent-gateway: usage stats",
			orgId,
		});

		return {
			orgId,
			period: { start: start.toISOString(), end: end.toISOString() },
			totalTokens: 0,
			totalApiCalls: 0,
			totalToolCalls: 0,
			topTools: [],
			topUsers: [],
			handoffCount: 0,
			handoffResolvedCount: 0,
			dailyBreakdown: [],
			estimatedCost: 0,
			responseTimeMs: { p50: 0, p95: 0, p99: 0, toolAverages: [] },
			conversationCount: 0,
			byChannel: [],
			errorRate: 0,
			funnel: [],
		};
	}
}
